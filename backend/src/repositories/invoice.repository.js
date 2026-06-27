const { query } = require('../config/database');
const logger = require('../config/logger');

class InvoiceRepository {
  async getNextNumber() {
    const year = new Date().getFullYear();
    const result = await query("SELECT nextval('facture_seq') AS seq");
    const seq = String(result.rows[0].seq).padStart(4, '0');
    return `FAC-${year}-${seq}`;
  }

  async create({ numero, commandeId, utilisateurId, clientSnapshot, entrepriseSnapshot, totaux }) {
    const result = await query(
      `INSERT INTO facture
         (numero, commande_id, utilisateur_id,
          client_nom, client_email, client_adresse,
          entreprise_nom, entreprise_siret, entreprise_tva_numero, entreprise_adresse,
          total_ht, total_tva, total_ttc)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        numero, commandeId, utilisateurId,
        clientSnapshot.nom, clientSnapshot.email, clientSnapshot.adresse,
        entrepriseSnapshot.nom, entrepriseSnapshot.siret,
        entrepriseSnapshot.tvaNumero, entrepriseSnapshot.adresse,
        totaux.ht, totaux.tva, totaux.ttc,
      ]
    );
    return result.rows[0];
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
        ligne.montantHt, ligne.montantTva, ligne.montantTtc,
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

  async findAll({ page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const result = await query(
      'SELECT * FROM facture ORDER BY date_emission DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
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
