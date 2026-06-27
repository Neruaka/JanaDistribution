// ⚠️ VALIDATION COMPTABLE REQUISE avant première vente réelle
// Taux TVA conformes CGI 2024 — art. 278 et suivants
// Faire valider par un expert-comptable chaque référence produit

const invoiceRepository = require('../repositories/invoice.repository');
const { query } = require('../config/database');
const logger = require('../config/logger');

// Snapshot données entreprise — ⚠️ À compléter avant mise en prod
const ENTREPRISE = {
  nom: process.env.ENTREPRISE_NOM || 'Jana Distribution',
  siret: process.env.ENTREPRISE_SIRET || null,           // ⚠️ OBLIGATOIRE en prod
  tvaNumero: process.env.ENTREPRISE_TVA_NUMERO || null,  // ⚠️ OBLIGATOIRE en prod
  adresse: process.env.ENTREPRISE_ADRESSE || null,       // ⚠️ OBLIGATOIRE en prod
};

class InvoiceService {
  async generateForOrder(commandeId) {
    const cmdResult = await query(
      `SELECT c.*, u.prenom, u.nom AS client_nom_famille, u.email,
              u.adresse_livraison, u.ville, u.code_postal
       FROM commande c
       JOIN utilisateur u ON u.id = c.utilisateur_id
       WHERE c.id = $1`,
      [commandeId]
    );

    if (!cmdResult.rows.length) throw new Error(`Commande ${commandeId} introuvable`);
    const commande = cmdResult.rows[0];

    // Idempotency — ne pas créer deux fois la même facture
    const existing = await invoiceRepository.findByCommande(commandeId);
    if (existing.length > 0) {
      logger.info(`Facture déjà existante pour commande ${commandeId}`);
      return existing[0];
    }

    const lignesResult = await query(
      `SELECT lc.*, p.taux_tva, p.reference
       FROM ligne_commande lc
       JOIN produit p ON p.id = lc.produit_id
       WHERE lc.commande_id = $1`,
      [commandeId]
    );

    let totalHt = 0;
    let totalTva = 0;

    const lignesFacture = lignesResult.rows.map(ligne => {
      // ⚠️ Prix stocké en TTC — reconversion HT selon taux TVA du produit
      const tauxTva = parseFloat(ligne.taux_tva) || 5.5;
      const prixTtc = parseFloat(ligne.prix_unitaire);
      const prixHt = Math.round((prixTtc / (1 + tauxTva / 100)) * 100) / 100;
      const montantHt = Math.round(prixHt * ligne.quantite * 100) / 100;
      const montantTva = Math.round((prixTtc - prixHt) * ligne.quantite * 100) / 100;
      const montantTtc = Math.round(prixTtc * ligne.quantite * 100) / 100;

      totalHt += montantHt;
      totalTva += montantTva;

      return {
        nom: ligne.nom_produit || ligne.produit_nom,
        ref: ligne.reference || null,
        quantite: ligne.quantite,
        prixUnitaireHt: prixHt,
        tauxTva,
        montantHt,
        montantTva,
        montantTtc,
      };
    });

    totalHt = Math.round(totalHt * 100) / 100;
    totalTva = Math.round(totalTva * 100) / 100;
    const totalTtc = Math.round((totalHt + totalTva) * 100) / 100;

    const numero = await invoiceRepository.getNextNumber();

    const facture = await invoiceRepository.create({
      numero,
      commandeId,
      utilisateurId: commande.utilisateur_id,
      clientSnapshot: {
        nom: `${commande.prenom || ''} ${commande.client_nom_famille || ''}`.trim(),
        email: commande.email,
        adresse: [commande.adresse_livraison, commande.code_postal, commande.ville]
          .filter(Boolean).join(', '),
      },
      entrepriseSnapshot: ENTREPRISE,
      totaux: { ht: totalHt, tva: totalTva, ttc: totalTtc },
    });

    for (const ligne of lignesFacture) {
      await invoiceRepository.createLigne({ factureId: facture.id, ligne });
    }

    logger.info(`Facture ${numero} générée pour commande ${commandeId}`);
    return facture;
  }
}

module.exports = new InvoiceService();
