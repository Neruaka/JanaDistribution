const { query } = require('../config/database');

class InvoiceRepository {
  async getNextNumber(prefix = 'FAC') {
    const year = new Date().getFullYear();
    const result = await query('SELECT nextval(\'facture_seq\') AS seq');
    const seq = String(result.rows[0].seq).padStart(4, '0');
    return `${prefix}-${year}-${seq}`;
  }

  async create({ numero, commandeId, utilisateurId, clientSnapshot, entrepriseSnapshot, totaux, type = 'FACTURE', remise = null }) {
    const result = await query(
      `INSERT INTO facture
         (numero, commande_id, utilisateur_id,
          client_nom, client_email, client_adresse,
          entreprise_nom, entreprise_siret, entreprise_tva_numero, entreprise_adresse,
          total_ht, total_tva, total_ttc, type, remise_montant, remise_code)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        numero, commandeId, utilisateurId,
        clientSnapshot.nom, clientSnapshot.email, clientSnapshot.adresse,
        entrepriseSnapshot.nom, entrepriseSnapshot.siret,
        entrepriseSnapshot.tvaNumero, entrepriseSnapshot.adresse,
        totaux.ht, totaux.tva, totaux.ttc, type,
        remise?.montant ?? null, remise?.code ?? null
      ]
    );
    return result.rows[0];
  }

  /**
   * Lie un avoir à sa facture d'origine (avoir_id ne peut être défini
   * qu'une seule fois — également garanti par le trigger trg_facture_immutable).
   */
  async linkAvoir(factureOriginaleId, avoirFactureId) {
    const result = await query(
      'UPDATE facture SET avoir_id = $2 WHERE id = $1 AND avoir_id IS NULL RETURNING *',
      [factureOriginaleId, avoirFactureId]
    );
    return result.rows[0] || null;
  }

  /**
   * Dernière facture de type FACTURE (pas un avoir) pour une commande —
   * c'est celle-ci qu'un avoir corrige.
   */
  async findOriginalByCommande(commandeId) {
    const result = await query(
      'SELECT * FROM facture WHERE commande_id = $1 AND type = \'FACTURE\' ORDER BY date_emission DESC LIMIT 1',
      [commandeId]
    );
    return result.rows[0] || null;
  }

  async findQuoteByCommande(commandeId) {
    const result = await query(
      'SELECT * FROM facture WHERE commande_id = $1 AND type = \'DEVIS\' ORDER BY date_emission DESC LIMIT 1',
      [commandeId]
    );
    return result.rows[0] || null;
  }

  async createLigne({ factureId, ligne }) {
    await query(
      `INSERT INTO facture_ligne
         (facture_id, produit_nom, produit_ref, quantite,
          prix_unitaire_ht, taux_tva, montant_ht, montant_tva, montant_ttc)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        factureId, ligne.nom, ligne.ref, ligne.quantite,
        ligne.prixUnitaireHt, ligne.tauxTva,
        ligne.montantHt, ligne.montantTva, ligne.montantTtc
      ]
    );
  }

  async findByCommande(commandeId) {
    const result = await query(
      'SELECT * FROM facture WHERE commande_id = $1 ORDER BY date_emission DESC',
      [commandeId]
    );
    return result.rows;
  }

  async findById(id) {
    const result = await query(
      `SELECT f.*, json_agg(fl.* ORDER BY fl.id) AS lignes
       FROM facture f
       LEFT JOIN facture_ligne fl ON fl.facture_id = f.id
       WHERE f.id = $1
       GROUP BY f.id`,
      [id]
    );
    return result.rows[0] || null;
  }

  async findAll({ page = 1, limit = 20, types = null } = {}) {
    const offset = (page - 1) * limit;
    const params = types ? [types, limit, offset] : [limit, offset];
    const sql = types
      ? 'SELECT * FROM facture WHERE type = ANY($1::text[]) ORDER BY date_emission DESC LIMIT $2 OFFSET $3'
      : 'SELECT * FROM facture ORDER BY date_emission DESC LIMIT $1 OFFSET $2';
    const result = await query(sql, params);
    return result.rows;
  }

  async countAll({ types = null } = {}) {
    const sql = types
      ? 'SELECT COUNT(*) FROM facture WHERE type = ANY($1::text[])'
      : 'SELECT COUNT(*) FROM facture';
    const result = await query(sql, types ? [types] : []);
    return parseInt(result.rows[0].count, 10);
  }

  async findByUtilisateur(utilisateurId) {
    const result = await query(
      'SELECT * FROM facture WHERE utilisateur_id = $1 ORDER BY date_emission DESC',
      [utilisateurId]
    );
    return result.rows;
  }
}

module.exports = new InvoiceRepository();
