/**
 * Repository Commandes
 * @description Accès aux données commandes PostgreSQL avec transactions
 * 
 * ✅ CORRECTIONS MINIMALES (2 modifications):
 * - _mapOrder(): ajout alias 'client' en plus de 'utilisateur'
 * - _mapOrderLine(): ajout 'nom' dans l'objet 'produit'
 * 
 * IMPORTANT - Mapping colonnes SQL:
 * - numero_commande (pas numero)
 * - date_commande (pas created_at)
 * - date_modification (pas updated_at)
 * - total_ht (pas sous_total_ht)
 * - instructions_livraison (pas notes)
 */

const { query, pool } = require('../config/database');
const logger = require('../config/logger');
const { ApiError } = require('../middlewares/errorHandler');
const promoRepository = require('./promo.repository');

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
      whereClause += ` AND c.date_commande >= $${paramIndex++}`;
      params.push(dateDebut);
    }

    if (dateFin) {
      whereClause += ` AND c.date_commande <= $${paramIndex++}`;
      params.push(dateFin);
    }

    // Mapping des colonnes pour ORDER BY
    const orderByMap = {
      'createdAt': 'c.date_commande',
      'total': 'c.total_ttc',
      'statut': 'c.statut',
      'numero': 'c.numero_commande'
    };
    const orderColumn = orderByMap[orderBy] || 'c.date_commande';
    const direction = orderDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT
        c.id,
        c.numero_commande,
        c.utilisateur_id,
        c.statut,
        c.date_commande,
        c.total_ht,
        c.total_tva,
        c.total_ttc,
        c.adresse_livraison,
        c.adresse_facturation,
        c.mode_paiement,
        c.frais_livraison,
        c.instructions_livraison,
        c.paiement_statut,
        c.paye_le,
        c.code_promo_id,
        c.montant_rabais,
        c.total_avant_rabais,
        c.date_modification,
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
      orders: ordersResult.rows.map(row => this._mapOrder(row)),
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
        c.id,
        c.numero_commande,
        c.utilisateur_id,
        c.statut,
        c.date_commande,
        c.total_ht,
        c.total_tva,
        c.total_ttc,
        c.adresse_livraison,
        c.adresse_facturation,
        c.mode_paiement,
        c.frais_livraison,
        c.instructions_livraison,
        c.paiement_statut,
        c.paye_le,
        c.code_promo_id,
        c.montant_rabais,
        c.total_avant_rabais,
        c.date_modification,
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
        lc.id,
        lc.commande_id,
        lc.produit_id,
        lc.quantite,
        lc.prix_unitaire_ht,
        lc.taux_tva,
        lc.total_ht,
        lc.total_ttc,
        lc.nom_produit,
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

    const order = this._mapOrder(orderResult.rows[0]);
    order.lignes = linesResult.rows.map(row => this._mapOrderLine(row));

    return order;
  }

  /**
   * Récupère une commande par numéro
   */
  async findByNumero(numero) {
    const sql = 'SELECT id FROM commande WHERE numero_commande = $1';
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
   * Génère un numéro de commande unique
   * Format: CMD-YYYYMMDD-XXXX
   */
  async _generateNumeroCommande(client) {
    // Utiliser la séquence si elle existe, sinon compter les commandes du jour
    try {
      const result = await client.query(
        "SELECT 'CMD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('commande_numero_seq')::text, 4, '0') as numero"
      );
      return result.rows[0].numero;
    } catch (error) {
      // Fallback: compter les commandes du jour
      const countResult = await client.query(`
        SELECT COUNT(*) + 1 as next_num 
        FROM commande 
        WHERE DATE(date_commande) = CURRENT_DATE
      `);
      const nextNum = countResult.rows[0].next_num;
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      return `CMD-${today}-${String(nextNum).padStart(4, '0')}`;
    }
  }

  /**
   * Crée une nouvelle commande avec ses lignes (transaction)
   */
  async create(data) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Protection double-clic / double-soumission (T12-05) : on verrouille la
      // ligne panier AVANT toute écriture. Si deux requêtes concurrentes
      // arrivent pour le même panier (même utilisateur), la seconde est
      // bloquée sur ce verrou jusqu'à la fin (COMMIT/ROLLBACK) de la
      // première. Comme la première transaction vide le panier (DELETE
      // ligne_panier) avant de committer, la seconde — une fois débloquée —
      // constate un panier vide et est rejetée proprement, sans dupliquer
      // la commande ni décrémenter le stock deux fois.
      if (data.cartId) {
        const cartLock = await client.query(
          'SELECT id FROM panier WHERE id = $1 FOR UPDATE',
          [data.cartId]
        );
        if (!cartLock.rows[0]) {
          throw ApiError.badRequest('Panier introuvable');
        }
        const cartItemsCheck = await client.query(
          'SELECT COUNT(*)::int AS count FROM ligne_panier WHERE panier_id = $1',
          [data.cartId]
        );
        if (cartItemsCheck.rows[0].count === 0) {
          throw ApiError.badRequest(
            'Le panier est vide (commande déjà créée ou panier vidé entre-temps)'
          );
        }
      }

      // Générer le numéro de commande
      const numeroCommande = await this._generateNumeroCommande(client);

      // Code promo (optionnel) : re-vérification des limites d'utilisation
      // DANS la transaction, avec verrou pessimiste sur la ligne code_promo,
      // pour empêcher un dépassement de max_utilisations_global /
      // max_utilisations_par_client sous forte concurrence (deux commandes
      // simultanées avec le même code promo se sérialisent sur ce verrou).
      if (data.codePromoId) {
        const promoLockResult = await client.query(
          `SELECT id, actif, date_debut, date_fin, max_utilisations_global, max_utilisations_par_client
           FROM code_promo WHERE id = $1 FOR UPDATE`,
          [data.codePromoId]
        );
        const promo = promoLockResult.rows[0];

        if (!promo || !promo.actif) {
          throw ApiError.badRequest('Ce code promo n\'est plus valide');
        }

        const now = new Date();
        if (promo.date_debut && now < new Date(promo.date_debut)) {
          throw ApiError.badRequest('Ce code promo n\'est pas encore valide');
        }
        if (promo.date_fin && now > new Date(promo.date_fin)) {
          throw ApiError.badRequest('Ce code promo a expiré');
        }

        if (promo.max_utilisations_global !== null && promo.max_utilisations_global !== undefined) {
          const globalCount = await client.query(
            'SELECT COUNT(*) as total FROM code_promo_utilisation WHERE code_promo_id = $1',
            [data.codePromoId]
          );
          if (parseInt(globalCount.rows[0].total, 10) >= promo.max_utilisations_global) {
            throw ApiError.badRequest('Ce code promo a atteint son nombre maximum d\'utilisations');
          }
        }

        if (promo.max_utilisations_par_client !== null && promo.max_utilisations_par_client !== undefined) {
          const userCount = await client.query(
            'SELECT COUNT(*) as total FROM code_promo_utilisation WHERE code_promo_id = $1 AND utilisateur_id = $2',
            [data.codePromoId, data.utilisateurId]
          );
          if (parseInt(userCount.rows[0].total, 10) >= promo.max_utilisations_par_client) {
            throw ApiError.badRequest('Vous avez déjà utilisé ce code promo le nombre maximum de fois autorisé');
          }
        }
      }

      // Créer la commande
      const orderSql = `
        INSERT INTO commande (
          numero_commande,
          utilisateur_id,
          statut,
          total_ht,
          total_tva,
          total_ttc,
          adresse_livraison,
          adresse_facturation,
          mode_paiement,
          frais_livraison,
          instructions_livraison,
          code_promo_id,
          montant_rabais,
          total_avant_rabais
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;

      const orderParams = [
        numeroCommande,
        data.utilisateurId,
        'EN_ATTENTE',
        data.totalHt,
        data.totalTva,
        data.totalTtc,
        JSON.stringify(data.adresseLivraison),
        JSON.stringify(data.adresseFacturation || data.adresseLivraison),
        data.modePaiement || 'ESPECES',
        data.fraisLivraison || 0,
        data.instructionsLivraison || null,
        data.codePromoId || null,
        data.montantRabais || 0,
        data.totalAvantRabais || null
      ];

      const orderResult = await client.query(orderSql, orderParams);
      const order = orderResult.rows[0];

      // Créer les lignes de commande
      const lineSql = `
        INSERT INTO ligne_commande (
          commande_id,
          produit_id,
          quantite,
          prix_unitaire_ht,
          taux_tva,
          total_ht,
          total_ttc,
          nom_produit
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const lines = [];
      for (const ligne of data.lignes) {
        // Calculer les totaux de la ligne
        const totalHt = ligne.prixUnitaireHt * ligne.quantite;
        const totalTtc = totalHt * (1 + ligne.tauxTva / 100);

        // Decrementation atomique pour eviter la course critique sur le stock.
        // Si la commande n'est pas satisfiable (stock insuffisant ou produit inactif),
        // le UPDATE ne matche aucune ligne et on lève une ApiError 400 qui déclenche le ROLLBACK.
        const stockUpdateResult = await client.query(
          `UPDATE produit
           SET stock_quantite = stock_quantite - $1, date_modification = NOW()
           WHERE id = $2
             AND est_actif = true
             AND stock_quantite >= $1
           RETURNING id, nom, stock_quantite`,
          [ligne.quantite, ligne.produitId]
        );

        if (stockUpdateResult.rowCount === 0) {
          const produitInfo = await client.query(
            'SELECT nom, stock_quantite, est_actif FROM produit WHERE id = $1',
            [ligne.produitId]
          );
          const infos = produitInfo.rows[0];
          throw ApiError.badRequest(
            `Stock insuffisant ou produit indisponible pour "${ligne.nomProduit || infos?.nom || ligne.produitId}"`,
            {
              type: 'STOCK_CONFLICT',
              produitId: ligne.produitId,
              requested: ligne.quantite,
              available: infos?.stock_quantite ?? 0,
              estActif: infos?.est_actif ?? false
            }
          );
        }

        const lineResult = await client.query(lineSql, [
          order.id,
          ligne.produitId,
          ligne.quantite,
          ligne.prixUnitaireHt,
          ligne.tauxTva,
          totalHt,
          totalTtc,
          ligne.nomProduit
        ]);
        lines.push(lineResult.rows[0]);
      }

      // Vider le panier dans la même transaction pour garantir l'atomicité.
      // Si cartId est fourni, la suppression se fait avant COMMIT — un échec
      // déclenche le ROLLBACK complet (commande + stock + lignes annulés).
      if (data.cartId) {
        await client.query(
          'DELETE FROM ligne_panier WHERE panier_id = $1',
          [data.cartId]
        );
        await client.query(
          'UPDATE panier SET date_modification = NOW() WHERE id = $1',
          [data.cartId]
        );
      }

      // Enregistrer l'utilisation du code promo DANS la même transaction que
      // la création de la commande (cohérence transactionnelle : si la
      // commande échoue, l'utilisation n'est pas comptabilisée et vice versa).
      if (data.codePromoId) {
        await promoRepository.enregistrerUtilisation(
          {
            codePromoId: data.codePromoId,
            commandeId: order.id,
            utilisateurId: data.utilisateurId,
            montantRabaisApplique: data.montantRabais || 0,
            totalAvantRabais: data.totalAvantRabais
          },
          client
        );
      }

      await client.query('COMMIT');

      logger.info(`Commande créée: ${numeroCommande} pour utilisateur ${data.utilisateurId}`);

      const mappedOrder = this._mapOrder(order);
      mappedOrder.lignes = lines.map(row => this._mapOrderLine(row));
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
   * Met à jour le statut d'une commande et logue la transition dans l'historique
   */
  async updateStatus(id, statut, instructionsLivraison = null) {
    const currentResult = await query('SELECT statut FROM commande WHERE id = $1', [id]);
    const ancienStatut = currentResult.rows[0]?.statut || null;

    const sql = `
      UPDATE commande
      SET
        statut = $2,
        instructions_livraison = COALESCE($3, instructions_livraison),
        date_modification = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await query(sql, [id, statut, instructionsLivraison]);

    if (result.rows[0]) {
      logger.info(`Commande ${id} mise à jour: ${ancienStatut} → ${statut}`);
      query(
        'INSERT INTO commande_statut_historique (commande_id, ancien_statut, nouveau_statut) VALUES ($1, $2, $3)',
        [id, ancienStatut, statut]
      ).catch(err => logger.warn('Historique statut non logué:', err.message));
    }

    return result.rows[0] ? this._mapOrder(result.rows[0]) : null;
  }

  /**
   * Récupère l'historique des transitions de statut d'une commande
   */
  async getHistory(commandeId) {
    const result = await query(
      'SELECT * FROM commande_statut_historique WHERE commande_id = $1 ORDER BY created_at ASC',
      [commandeId]
    );
    return result.rows;
  }

  /**
   * Annule une commande (restaure le stock)
   */
  async cancel(id) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Vérifier que la commande peut être annulée
      const checkResult = await client.query(
        'SELECT statut FROM commande WHERE id = $1',
        [id]
      );

      if (!checkResult.rows[0]) {
        throw new Error('Commande non trouvée');
      }

      const currentStatut = checkResult.rows[0].statut;

      // On ne peut annuler que les commandes EN_ATTENTE ou CONFIRMEE
      if (!['EN_ATTENTE', 'CONFIRMEE'].includes(currentStatut)) {
        throw new Error(`Impossible d'annuler une commande ${currentStatut}`);
      }

      // Récupérer les lignes pour restaurer le stock
      const linesResult = await client.query(
        'SELECT produit_id, quantite FROM ligne_commande WHERE commande_id = $1',
        [id]
      );

      // Restaurer le stock
      for (const ligne of linesResult.rows) {
        await client.query(
          'UPDATE produit SET stock_quantite = stock_quantite + $1, date_modification = NOW() WHERE id = $2',
          [ligne.quantite, ligne.produit_id]
        );
        logger.info(`Stock restauré: +${ligne.quantite} pour produit ${ligne.produit_id}`);
      }

      // Mettre à jour le statut
      const result = await client.query(
        'UPDATE commande SET statut = \'ANNULEE\', date_modification = NOW() WHERE id = $1 RETURNING *',
        [id]
      );

      await client.query('COMMIT');

      logger.info(`Commande annulée: ${id} - Stock restauré pour ${linesResult.rows.length} produits`);

      // Log de l'historique après COMMIT (non critique — fire and forget)
      query(
        'INSERT INTO commande_statut_historique (commande_id, ancien_statut, nouveau_statut) VALUES ($1, $2, $3)',
        [id, currentStatut, 'ANNULEE']
      ).catch(err => logger.warn('Historique statut non logué (cancel):', err.message));

      return result.rows[0] ? this._mapOrder(result.rows[0]) : null;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ==========================================
  // PAIEMENT (ESPECES / VIREMENT / CHEQUE — pas de paiement en ligne)
  // ==========================================

  /**
   * Met à jour le statut de paiement (sans toucher au statut commande).
   * Utilisé pour FAILED / REFUNDED / AUTHORIZED.
   */
  async updatePaymentStatus(orderId, paiementStatut) {
    const sql = `
      UPDATE commande
      SET paiement_statut = $2,
          date_modification = NOW()
      WHERE id = $1
      RETURNING id, paiement_statut
    `;
    const result = await query(sql, [orderId, paiementStatut]);
    return result.rows[0] || null;
  }

  /**
   * Marque une commande comme payée (PAID + paye_le), positionné manuellement
   * par un admin (ESPECES / VIREMENT / CHEQUE).
   * Idempotent : si la commande est déjà PAID, on ne fait rien.
   */
  async markPaid(orderId) {
    const sql = `
      UPDATE commande
      SET paiement_statut = 'PAID',
          paye_le = NOW(),
          date_modification = NOW()
      WHERE id = $1 AND paiement_statut <> 'PAID'
      RETURNING id
    `;
    const result = await query(sql, [orderId]);
    return result.rows[0] || null;
  }

  /**
   * Met à jour les informations de remboursement (manuel) et le statut de la commande.
   * Logue la transition dans commande_statut_historique.
   */
  async updateRefund(orderId, { montantRembourse, nouveauStatut }) {
    const currentResult = await query('SELECT statut FROM commande WHERE id = $1', [orderId]);
    const ancienStatut = currentResult.rows[0]?.statut || null;

    const sql = `
      UPDATE commande
      SET montant_rembourse = $2,
          statut = $3,
          date_modification = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const result = await query(sql, [orderId, montantRembourse, nouveauStatut]);

    if (result.rows[0]) {
      query(
        'INSERT INTO commande_statut_historique (commande_id, ancien_statut, nouveau_statut) VALUES ($1, $2, $3)',
        [orderId, ancienStatut, nouveauStatut]
      ).catch(err => logger.warn('Historique statut refund non logué:', err.message));
    }

    return result.rows[0] ? this._mapOrder(result.rows[0]) : null;
  }

  /**
   * Récupère les statistiques des commandes
   */
  async getStats(dateDebut = null, dateFin = null) {
    let whereClause = "WHERE statut != 'ANNULEE'";
    const params = [];
    let paramIndex = 1;

    if (dateDebut) {
      whereClause += ` AND date_commande >= $${paramIndex++}`;
      params.push(dateDebut);
    }

    if (dateFin) {
      whereClause += ` AND date_commande <= $${paramIndex++}`;
      params.push(dateFin);
    }

    const sql = `
      SELECT 
        COUNT(*) as total_commandes,
        COALESCE(SUM(total_ttc), 0) as chiffre_affaires,
        COALESCE(AVG(total_ttc), 0) as panier_moyen,
        COUNT(*) FILTER (WHERE statut = 'EN_ATTENTE') as en_attente,
        COUNT(*) FILTER (WHERE statut = 'CONFIRMEE') as confirmees,
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
        confirmees: parseInt(row.confirmees) || 0,
        enPreparation: parseInt(row.en_preparation) || 0,
        expediees: parseInt(row.expediees) || 0,
        livrees: parseInt(row.livrees) || 0
      }
    };
  }

  /**
   * Mappe une commande (row SQL → objet JS)
   * 
   * ✅ CORRECTION: ajout de 'client' en plus de 'utilisateur' pour compatibilité frontend
   */
  _mapOrder(row) {
    if (!row) return null;

    // Objet utilisateur/client (même données, 2 noms pour compatibilité)
    const userInfo = row.utilisateur_nom ? {
      nom: row.utilisateur_nom,
      prenom: row.utilisateur_prenom,
      email: row.utilisateur_email,
      telephone: row.utilisateur_telephone,
      typeClient: row.utilisateur_type
    } : null;

    return {
      id: row.id,
      numeroCommande: row.numero_commande,
      utilisateurId: row.utilisateur_id,
      // ✅ CORRECTION: Les 2 noms pour compatibilité frontend
      utilisateur: userInfo,
      client: userInfo,  // ← AJOUT pour le frontend AdminOrdersList.jsx
      statut: row.statut,
      dateCommande: row.date_commande,
      totalHt: parseFloat(row.total_ht) || 0,
      totalTva: parseFloat(row.total_tva) || 0,
      totalTtc: parseFloat(row.total_ttc) || 0,
      adresseLivraison: typeof row.adresse_livraison === 'string' 
        ? JSON.parse(row.adresse_livraison) 
        : row.adresse_livraison,
      adresseFacturation: row.adresse_facturation 
        ? (typeof row.adresse_facturation === 'string' 
          ? JSON.parse(row.adresse_facturation) 
          : row.adresse_facturation)
        : null,
      modePaiement: row.mode_paiement,
      fraisLivraison: parseFloat(row.frais_livraison) || 0,
      instructionsLivraison: row.instructions_livraison,
      paiementStatut: row.paiement_statut || 'PENDING',
      payeLe: row.paye_le || null,
      codePromoId: row.code_promo_id || null,
      montantRabais: row.montant_rabais !== undefined && row.montant_rabais !== null ? parseFloat(row.montant_rabais) : 0,
      totalAvantRabais: row.total_avant_rabais !== undefined && row.total_avant_rabais !== null ? parseFloat(row.total_avant_rabais) : null,
      nbArticles: row.nb_articles ? parseInt(row.nb_articles) : undefined,
      dateModification: row.date_modification
    };
  }

  /**
   * Mappe une ligne de commande
   * 
   * ✅ CORRECTION: ajout de 'nom' dans l'objet 'produit'
   */
  _mapOrderLine(row) {
    if (!row) return null;

    return {
      id: row.id,
      commandeId: row.commande_id,
      produitId: row.produit_id,
      nomProduit: row.nom_produit,
      // ✅ CORRECTION: produit avec nom pour le frontend
      produit: {
        id: row.produit_id,
        nom: row.produit_nom || row.nom_produit || 'Produit',  // ← AJOUT du nom
        reference: row.produit_reference,
        imageUrl: row.produit_image
      },
      quantite: parseInt(row.quantite),
      prixUnitaireHt: parseFloat(row.prix_unitaire_ht),
      tauxTva: parseFloat(row.taux_tva),
      totalHt: parseFloat(row.total_ht) || 0,
      totalTtc: parseFloat(row.total_ttc) || 0
    };
  }
}

module.exports = new OrderRepository();
