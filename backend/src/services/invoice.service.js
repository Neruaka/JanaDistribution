// ⚠️ VALIDATION COMPTABLE REQUISE avant première vente réelle
// Taux TVA conformes CGI 2024 — art. 278 et suivants
// Faire valider par un expert-comptable chaque référence produit

const invoiceRepository = require('../repositories/invoice.repository');
const { query } = require('../config/database');
const logger = require('../config/logger');
const { generateInvoicePDF } = require('./invoice-pdf.generator');
const emailService = require('./email.service');

// Snapshot données entreprise — ⚠️ ENTREPRISE_ADRESSE reste à renseigner avant mise en prod
const ENTREPRISE = {
  nom: process.env.ENTREPRISE_NOM || 'Jana Distribution',
  siret: process.env.ENTREPRISE_SIRET || '798787784',
  tvaNumero: process.env.ENTREPRISE_TVA_NUMERO || 'FR92798787784',
  adresse: process.env.ENTREPRISE_ADRESSE || null,       // ⚠️ OBLIGATOIRE en prod
};

class InvoiceService {
  async generateForOrder(commandeId) {
    // L'adresse n'est jamais lue sur `utilisateur` (qui n'a pas de colonnes
    // d'adresse — elles vivent dans la table `adresse`, séparée) : la seule
    // adresse pertinente pour une facture est celle réellement utilisée pour
    // CETTE commande, déjà figée en JSON sur `commande.adresse_livraison` au
    // moment de la commande (voir order.repository.js). Utiliser l'adresse
    // courante du profil utilisateur serait de toute façon incorrect si le
    // client l'a modifiée depuis.
    const cmdResult = await query(
      `SELECT c.*, u.prenom, u.nom AS client_nom_famille, u.email
       FROM commande c
       JOIN utilisateur u ON u.id = c.utilisateur_id
       WHERE c.id = $1`,
      [commandeId]
    );

    if (!cmdResult.rows.length) throw new Error(`Commande ${commandeId} introuvable`);
    const commande = cmdResult.rows[0];
    const adresseLivraison = typeof commande.adresse_livraison === 'string'
      ? JSON.parse(commande.adresse_livraison)
      : commande.adresse_livraison;

    // Idempotency — ne pas créer deux fois la même facture. Doit chercher
    // spécifiquement une facture de type FACTURE : findByCommande renvoie
    // aussi les avoirs (type AVOIR, générés après un remboursement), triés
    // par date décroissante — un avoir plus récent que la facture d'origine
    // serait sinon retourné à tort ici.
    const existing = await invoiceRepository.findOriginalByCommande(commandeId);
    if (existing) {
      logger.info(`Facture déjà existante pour commande ${commandeId}`);
      return existing;
    }

    // NOTE : on ne sélectionne QUE p.reference depuis produit — le taux de
    // TVA facturé doit être celui figé sur la ligne de commande au moment de
    // l'achat (lc.taux_tva), jamais le taux courant du produit (qui peut
    // changer depuis). Sélectionner aussi p.taux_tva ici écraserait
    // silencieusement lc.taux_tva (même nom de colonne) et ferait dériver la
    // facture du prix réellement payé.
    const lignesResult = await query(
      `SELECT lc.*, p.reference
       FROM ligne_commande lc
       JOIN produit p ON p.id = lc.produit_id
       WHERE lc.commande_id = $1`,
      [commandeId]
    );

    let totalHt = 0;
    let totalTva = 0;

    // Méthode d'arrondi retenue (identique panier / commande / facture) :
    // arrondi ligne par ligne à 2 décimales AVANT sommation, puis un arrondi
    // de sécurité sur les totaux (ré-arrondit un éventuel résidu binaire IEEE
    // 754 issu de l'addition, sans changer la valeur déjà arrondie). Voir
    // cart.repository.js#_mapCartItem et #_calculateSummary qui appliquent la
    // même règle — évite tout écart de quelques centimes entre panier,
    // commande et facture PDF.
    const lignesFacture = lignesResult.rows.map(ligne => {
      // lc.prix_unitaire_ht et lc.taux_tva sont figés à la création de la
      // commande (order.repository.js) — la facture doit rester fidèle à ce
      // qui a été réellement facturé au client, indépendamment de toute
      // évolution ultérieure du prix ou du taux du produit.
      const tauxTva = parseFloat(ligne.taux_tva) || 5.5;
      const prixHt = Math.round(parseFloat(ligne.prix_unitaire_ht) * 100) / 100;
      const montantHt = Math.round(prixHt * ligne.quantite * 100) / 100;
      const montantTva = Math.round(montantHt * (tauxTva / 100) * 100) / 100;
      const montantTtc = Math.round((montantHt + montantTva) * 100) / 100;

      totalHt += montantHt;
      totalTva += montantTva;

      return {
        nom: ligne.nom_produit,
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
        adresse: adresseLivraison
          ? [
              [adresseLivraison.adresse, adresseLivraison.complement].filter(Boolean).join(' '),
              [adresseLivraison.codePostal, adresseLivraison.ville].filter(Boolean).join(' '),
            ].filter(Boolean).join(', ')
          : null,
      },
      entrepriseSnapshot: ENTREPRISE,
      totaux: { ht: totalHt, tva: totalTva, ttc: totalTtc },
    });

    for (const ligne of lignesFacture) {
      await invoiceRepository.createLigne({ factureId: facture.id, ligne });
    }

    logger.info(`Facture ${numero} générée pour commande ${commandeId}`);

    // Envoi du PDF par email — fire and forget, ne bloque pas la génération
    invoiceRepository.findById(facture.id)
      .then(factureComplete => generateInvoicePDF(factureComplete))
      .then(pdfBuffer => emailService.sendInvoiceEmail({
        destinataireEmail: commande.email,
        destinataireNom: `${commande.prenom || ''} ${commande.client_nom_famille || ''}`.trim(),
        facture,
        pdfBuffer,
      }))
      .then(() => logger.info(`Email facture envoyé : ${numero}`))
      .catch(err => logger.error(`Email facture échoué ${numero}:`, err.message));

    return facture;
  }

  /**
   * Génère un avoir (facture à montants négatifs) suite à un remboursement
   * manuel (voir T13-04, orderRepository.addRefund). Ne modifie jamais la
   * facture d'origine — l'immuabilité (T5-14) interdit toute UPDATE de ses
   * montants ; seul son avoir_id est renseigné une fois, pour la lier à cet
   * avoir.
   *
   * Le montant TTC du remboursement est réparti HT/TVA au prorata du taux
   * moyen pondéré de la facture d'origine (une commande peut mélanger
   * plusieurs taux de TVA ; le flux de remboursement actuel ne redescend pas
   * au niveau ligne, donc cette répartition proportionnelle est
   * l'approximation la plus défendable sans réécrire ce flux).
   *
   * @param {string} commandeId
   * @param {number} montantTtc - Montant TTC de CE remboursement (pas le cumul)
   * @param {string|null} raison
   * @returns {Promise<Object|null>} L'avoir créé, ou null si aucune facture
   *   d'origine n'existe pour cette commande (remboursement enregistré quand
   *   même côté commande — l'absence de facture ne doit jamais bloquer un
   *   remboursement déjà décidé par un admin).
   */
  async generateCreditNote(commandeId, montantTtc, raison) {
    const original = await invoiceRepository.findOriginalByCommande(commandeId);
    if (!original) {
      logger.warn(`Remboursement enregistré sans facture d'origine pour la commande ${commandeId} — avoir non généré`);
      return null;
    }

    const totalHtOriginal = parseFloat(original.total_ht);
    const totalTvaOriginal = parseFloat(original.total_tva);
    const totalTtcOriginal = parseFloat(original.total_ttc);
    const ratioHt = totalTtcOriginal > 0 ? totalHtOriginal / totalTtcOriginal : 1;

    const montantTtcAvoir = Math.round(montantTtc * 100) / 100;
    const montantHtAvoir = Math.round(montantTtcAvoir * ratioHt * 100) / 100;
    const montantTvaAvoir = Math.round((montantTtcAvoir - montantHtAvoir) * 100) / 100;
    const tauxMoyen = totalHtOriginal > 0 ? Math.round((totalTvaOriginal / totalHtOriginal) * 10000) / 100 : 0;

    const numero = await invoiceRepository.getNextNumber('AV');

    const avoir = await invoiceRepository.create({
      numero,
      commandeId,
      utilisateurId: original.utilisateur_id,
      clientSnapshot: {
        nom: original.client_nom,
        email: original.client_email,
        adresse: original.client_adresse,
      },
      entrepriseSnapshot: {
        nom: original.entreprise_nom,
        siret: original.entreprise_siret,
        tvaNumero: original.entreprise_tva_numero,
        adresse: original.entreprise_adresse,
      },
      totaux: { ht: -montantHtAvoir, tva: -montantTvaAvoir, ttc: -montantTtcAvoir },
      type: 'AVOIR',
    });

    await invoiceRepository.createLigne({
      factureId: avoir.id,
      ligne: {
        nom: `Avoir sur facture ${original.numero}${raison ? ` — ${raison}` : ''}`,
        ref: original.numero,
        quantite: 1,
        prixUnitaireHt: -montantHtAvoir,
        tauxTva: tauxMoyen,
        montantHt: -montantHtAvoir,
        montantTva: -montantTvaAvoir,
        montantTtc: -montantTtcAvoir,
      },
    });

    await invoiceRepository.linkAvoir(original.id, avoir.id);

    logger.info(`Avoir ${numero} généré pour commande ${commandeId} (${montantTtcAvoir}€ TTC) — facture d'origine ${original.numero}`);

    // Envoi du PDF par email — fire and forget, cohérent avec generateForOrder
    invoiceRepository.findById(avoir.id)
      .then(avoirComplet => generateInvoicePDF(avoirComplet))
      .then(pdfBuffer => emailService.sendInvoiceEmail({
        destinataireEmail: original.client_email,
        destinataireNom: original.client_nom,
        facture: avoir,
        pdfBuffer,
      }))
      .then(() => logger.info(`Email avoir envoyé : ${numero}`))
      .catch(err => logger.error(`Email avoir échoué ${numero}:`, err.message));

    return avoir;
  }
}

module.exports = new InvoiceService();
