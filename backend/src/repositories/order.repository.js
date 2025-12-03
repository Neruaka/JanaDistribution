/**
 * Repository Commandes
 * @description Accès aux données commandes PostgreSQL avec transactions
 */

const { query, getClient } = require('../config/database');
const logger = require('../config/logger');

class OrderRepository {
  /**
   * Récupère toutes les commandes avec filtres et pagination
   */
  async findAll(options = {}) {
    const {
      page = 1,
      limit = 20,
      userId,
      statut,
      dateDebut,
      dateFin,
      orderBy = 'createdAt',
      orderDir = 'DESC'
    } = options;

    const offset = (page - 1) * limit;
    const params = [];
    let paramIndex = 1;

    let whereClause = 'WHERE 1=1';

    if (userId) {
      whereClause += ` AND c.utilisateur_id = $${paramIndex++}`;
      params.push(userId);
    }

    if (statut) {
      whereClause += ` AND c.statut = $${paramIndex++}`;
      params.push(statut);
    }

    if (dateDebut) {
      whereClause += ` AND c.created_at >= $${paramIndex++}`;
      params.push(dateDebut);
    }

    if (dateFin) {
      whereClause += ` AND c.created_at <= $${paramIndex++}`;
      params.push(dateFin);
    }

    const orderByMap = {
      'createdAt': 'c.created_at',
      'total': 'c.total_ttc',
      'statut': 'c.statut'
    };
    const orderColumn = orderByMap[orderBy] || 'c.created_at';
    const direction = orderDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT 
        c.*,
        u.nom as utilisateur_nom,
        u.prenom as utilisateur_prenom,
        u.email as utilisateur_email,
        u.type_client as utilisateur_type,
        (SELECT COUNT(*) FROM ligne_commande lc WHERE lc.commande_id = c.id) as nb_articles
      FROM commande c
      LEFT JOIN utilisateur u ON c.utilisateur_id = u.id
      ${whereClause}
      ORDER BY ${orderColumn} ${direction}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    params.push(limit, offset);

    const countSql = `
      SELECT COUNT(*) as total
      FROM commande c
      ${whereClause}
    `;

    const [ordersResult, countResult] = await Promise.all([
      query(sql, params),
      query(countSql, params.slice(0, -2))
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    return {
      orders: ordersResult.rows.map(this.mapOrder),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Récupère une commande par ID avec ses lignes
   */
  async findById(id) {
    const orderSql = `
      SELECT 
        c.*,
        u.nom as utilisateur_nom,
        u.prenom as utilisateur_prenom,
        u.email as utilisateur_email,
        u.telephone as utilisateur_telephone,
        u.type_client as utilisateur_type
      FROM commande c
      LEFT JOIN utilisateur u ON c.utilisateur_id = u.id
      WHERE c.id = $1
    `;

    const linesSql = `
      SELECT 
        lc.*,
        p.nom as produit_nom,
        p.reference as produit_reference,
        p.image_url as produit_image
      FROM ligne_commande lc
      LEFT JOIN produit p ON lc.produit_id = p.id
      WHERE lc.commande_id = $1
      ORDER BY lc.id
    `;

    const [orderResult, linesResult] = await Promise.all([
      query(orderSql, [id]),
      query(linesSql, [id])
    ]);

    if (!orderResult.rows[0]) return null;

    const order = this.mapOrder(orderResult.rows[0]);
    order.lignes = linesResult.rows.map(this.mapOrderLine);

    return order;
  }

  /**
   * Récupère une commande par numéro
   */
  async findByNumero(numero) {
    const sql = `SELECT id FROM commande WHERE numero = $1`;
    const result = await query(sql, [numero]);
    
    if (!result.rows[0]) return null;
    return this.findById(result.rows[0].id);
  }

  /**
   * Récupère les commandes d'un utilisateur
   */
  async findByUser(userId, options = {}) {
    return this.findAll({ ...options, userId });
  }

  /**
   * Crée une nouvelle commande avec ses lignes (transaction)
   */
  async create(data) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Générer le numéro de commande
      const numeroResult = await client.query(
        "SELECT 'CMD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('commande_numero_seq')::text, 4, '0') as numero"
      );
      const numero = numeroResult.rows[0].numero;

      // Créer la commande
      const orderSql = `
        INSERT INTO commande (
          numero, utilisateur_id, statut,
          adresse_livraison, adresse_facturation,
          mode_paiement, sous_total_ht, total_tva, total_ttc,
          frais_livraison, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const orderParams = [
        numero,
        data.utilisateurId,
        'EN_ATTENTE',
        JSON.stringify(data.adresseLivraison),
        JSON.stringify(data.adresseFacturation || data.adresseLivraison),
        data.modePaiement || 'CARTE',
        data.sousTotalHt,
        data.totalTva,
        data.totalTtc,
        data.fraisLivraison || 0,
        data.notes || null
      ];

      const orderResult = await client.query(orderSql, orderParams);
      const order = orderResult.rows[0];

      // Créer les lignes de commande
      const lineSql = `
        INSERT INTO ligne_commande (
          commande_id, produit_id, quantite, prix_unitaire_ht,
          taux_tva, total_ht, total_ttc
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const lines = [];
      for (const ligne of data.lignes) {
        const lineResult = await client.query(lineSql, [
          order.id,
          ligne.produitId,
          ligne.quantite,
          ligne.prixUnitaireHt,
          ligne.tauxTva,
          ligne.totalHt,
          ligne.totalTtc
        ]);
        lines.push(lineResult.rows[0]);

        // Mettre à jour le stock du produit
        await client.query(
          'UPDATE produit SET stock_quantite = stock_quantite - $1 WHERE id = $2',
          [ligne.quantite, ligne.produitId]
        );
      }

      await client.query('COMMIT');

      logger.info(`Commande créée: ${numero} pour utilisateur ${data.utilisateurId}`);

      const mappedOrder = this.mapOrder(order);
      mappedOrder.lignes = lines.map(this.mapOrderLine);
      return mappedOrder;

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Erreur création commande:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Met à jour le statut d'une commande
   */
  async updateStatus(id, statut, notes = null) {
    const sql = `
      UPDATE commande 
      SET statut = $2, notes = COALESCE($3, notes), updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await query(sql, [id, statut, notes]);
    
    if (result.rows[0]) {
      logger.info(`Commande ${id} mise à jour: ${statut}`);
    }

    return result.rows[0] ? this.mapOrder(result.rows[0]) : null;
  }

  /**
   * Annule une commande (restaure le stock)
   */
  async cancel(id) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Récupérer les lignes pour restaurer le stock
      const linesResult = await client.query(
        'SELECT produit_id, quantite FROM ligne_commande WHERE commande_id = $1',
        [id]
      );

      // Restaurer le stock
      for (const ligne of linesResult.rows) {
        await client.query(
          'UPDATE produit SET stock_quantite = stock_quantite + $1 WHERE id = $2',
          [ligne.quantite, ligne.produit_id]
        );
      }

      // Mettre à jour le statut
      const result = await client.query(
        `UPDATE commande SET statut = 'ANNULEE', updated_at = NOW() WHERE id = $1 RETURNING *`,
        [id]
      );

      await client.query('COMMIT');

      logger.info(`Commande annulée: ${id}`);
      return result.rows[0] ? this.mapOrder(result.rows[0]) : null;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Récupère les statistiques des commandes
   */
  async getStats(dateDebut = null, dateFin = null) {
    let whereClause = "WHERE statut != 'ANNULEE'";
    const params = [];
    let paramIndex = 1;

    if (dateDebut) {
      whereClause += ` AND created_at >= $${paramIndex++}`;
      params.push(dateDebut);
    }

    if (dateFin) {
      whereClause += ` AND created_at <= $${paramIndex++}`;
      params.push(dateFin);
    }

    const sql = `
      SELECT 
        COUNT(*) as total_commandes,
        SUM(total_ttc) as chiffre_affaires,
        AVG(total_ttc) as panier_moyen,
        COUNT(*) FILTER (WHERE statut = 'EN_ATTENTE') as en_attente,
        COUNT(*) FILTER (WHERE statut = 'EN_PREPARATION') as en_preparation,
        COUNT(*) FILTER (WHERE statut = 'EXPEDIEE') as expediees,
        COUNT(*) FILTER (WHERE statut = 'LIVREE') as livrees
      FROM commande
      ${whereClause}
    `;

    const result = await query(sql, params);
    const row = result.rows[0];

    return {
      totalCommandes: parseInt(row.total_commandes) || 0,
      chiffreAffaires: parseFloat(row.chiffre_affaires) || 0,
      panierMoyen: parseFloat(row.panier_moyen) || 0,
      parStatut: {
        enAttente: parseInt(row.en_attente) || 0,
        enPreparation: parseInt(row.en_preparation) || 0,
        expediees: parseInt(row.expediees) || 0,
        livrees: parseInt(row.livrees) || 0
      }
    };
  }

  /**
   * Mappe une commande
   */
  mapOrder(row) {
    if (!row) return null;

    return {
      id: row.id,
      numero: row.numero,
      utilisateurId: row.utilisateur_id,
      utilisateur: row.utilisateur_nom ? {
        nom: row.utilisateur_nom,
        prenom: row.utilisateur_prenom,
        email: row.utilisateur_email,
        telephone: row.utilisateur_telephone,
        typeClient: row.utilisateur_type
      } : null,
      statut: row.statut,
      adresseLivraison: typeof row.adresse_livraison === 'string' 
        ? JSON.parse(row.adresse_livraison) 
        : row.adresse_livraison,
      adresseFacturation: typeof row.adresse_facturation === 'string'
        ? JSON.parse(row.adresse_facturation)
        : row.adresse_facturation,
      modePaiement: row.mode_paiement,
      sousTotalHt: parseFloat(row.sous_total_ht),
      totalTva: parseFloat(row.total_tva),
      totalTtc: parseFloat(row.total_ttc),
      fraisLivraison: parseFloat(row.frais_livraison),
      notes: row.notes,
      nbArticles: row.nb_articles ? parseInt(row.nb_articles) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Mappe une ligne de commande
   */
  mapOrderLine(row) {
    if (!row) return null;

    return {
      id: row.id,
      produitId: row.produit_id,
      produit: row.produit_nom ? {
        nom: row.produit_nom,
        reference: row.produit_reference,
        imageUrl: row.produit_image
      } : null,
      quantite: parseInt(row.quantite),
      prixUnitaireHt: parseFloat(row.prix_unitaire_ht),
      tauxTva: parseFloat(row.taux_tva),
      totalHt: parseFloat(row.total_ht),
      totalTtc: parseFloat(row.total_ttc)
    };
  }
}

module.exports = new OrderRepository();
