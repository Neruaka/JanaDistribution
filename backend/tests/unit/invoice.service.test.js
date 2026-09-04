/**
 * Tests Unitaires — InvoiceService (T12-07)
 * Couvre :
 *  - la cohérence de l'arrondi TVA (arrondi ligne par ligne à 2 décimales
 *    AVANT sommation, méthode identique à cart.repository.js), sans écart
 *    de quelques centimes entre lignes et totaux ;
 *  - la reprise du prix HT et du taux de TVA FIGÉS sur la ligne de commande
 *    (lc.prix_unitaire_ht / lc.taux_tva) plutôt que le taux courant du
 *    produit, qui peut avoir changé depuis l'achat ;
 *  - l'immutabilité de la facture au niveau des routes (aucune route
 *    PUT/PATCH/DELETE ne doit permettre de modifier une facture émise).
 */

jest.mock('../../src/repositories/invoice.repository');
jest.mock('../../src/services/invoice-pdf.generator', () => ({
  generateInvoicePDF: jest.fn().mockResolvedValue(Buffer.from('pdf'))
}));
jest.mock('../../src/services/email.service', () => ({
  sendInvoiceEmail: jest.fn().mockResolvedValue({})
}));

const database = require('../../src/config/database');
const invoiceRepository = require('../../src/repositories/invoice.repository');
const invoiceService = require('../../src/services/invoice.service');

const COMMANDE_ID = 'commande-uuid-0001';

// adresse_livraison est une colonne JSONB (commande.adresse_livraison, voir
// scripts/init.sql) — le driver `pg` la renvoie déjà comme objet JS, jamais
// comme chaîne. `utilisateur` n'a aucune colonne d'adresse (l'adresse vit
// uniquement sur la commande, figée au moment de l'achat).
const mockCommandeRow = {
  id: COMMANDE_ID,
  utilisateur_id: 'user-uuid-0001',
  prenom: 'Jean',
  client_nom_famille: 'Dupont',
  email: 'jean.dupont@example.com',
  adresse_livraison: {
    nom: 'Dupont', prenom: 'Jean', adresse: '1 rue de la Paix',
    complement: '', codePostal: '75001', ville: 'Paris', telephone: '0612345678'
  }
};

describe('InvoiceService.generateForOrder — cohérence des arrondis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    invoiceRepository.findOriginalByCommande.mockResolvedValue(null);
    invoiceRepository.getNextNumber.mockResolvedValue('FAC-2026-0001');
    invoiceRepository.create.mockImplementation(async (data) => ({ id: 'facture-uuid-0001', ...data }));
    invoiceRepository.createLigne.mockResolvedValue();
    invoiceRepository.findById.mockResolvedValue({ id: 'facture-uuid-0001', lignes: [] });
  });

  it('arrondit chaque ligne à 2 décimales puis somme les lignes déjà arrondies (pas de dérive flottante)', async () => {
    // 0.10 € × 3 avec TVA 20% déclenche un résidu binaire IEEE 754 classique
    // (0.10 * 3 * 0.20 = 0.060000000000000005) : la ligne doit rester à 0.06 €
    // et le total doit être la somme EXACTE des lignes déjà arrondies.
    database.query
      .mockResolvedValueOnce({ rows: [mockCommandeRow] }) // SELECT commande
      .mockResolvedValueOnce({
        rows: [
          { prix_unitaire_ht: '3.50', taux_tva: '5.50', quantite: 3, nom_produit: 'Pommes', reference: 'FRL-0001' },
          { prix_unitaire_ht: '0.10', taux_tva: '20.00', quantite: 3, nom_produit: 'Sachet', reference: 'FRL-0002' }
        ]
      }); // SELECT lignes commande

    await invoiceService.generateForOrder(COMMANDE_ID);

    expect(invoiceRepository.create).toHaveBeenCalledTimes(1);
    const { totaux } = invoiceRepository.create.mock.calls[0][0];

    // Ligne 1 : HT = 3.50 * 3 = 10.50 ; TVA = 10.50 * 5.5% = 0.5775 -> 0.58 ; TTC = 11.08
    // Ligne 2 : HT = 0.10 * 3 = 0.30  ; TVA = 0.30 * 20%  = 0.06   ; TTC = 0.36
    expect(totaux.ht).toBeCloseTo(10.80, 2);
    expect(totaux.tva).toBeCloseTo(0.64, 2);
    expect(totaux.ttc).toBeCloseTo(11.44, 2);
    // Le total TTC doit être EXACTEMENT HT + TVA (pas d'écart de centime)
    expect(totaux.ttc).toBe(Math.round((totaux.ht + totaux.tva) * 100) / 100);

    expect(invoiceRepository.createLigne).toHaveBeenCalledTimes(2);
    const ligne2 = invoiceRepository.createLigne.mock.calls[1][0].ligne;
    expect(ligne2.montantTva).toBe(0.06);
    expect(ligne2.montantHt + ligne2.montantTva).toBe(ligne2.montantTtc);
  });

  it('reprend le prix HT et le taux de TVA figés sur la ligne de commande (pas ceux, courants, du produit)', async () => {
    database.query
      .mockResolvedValueOnce({ rows: [mockCommandeRow] })
      .mockResolvedValueOnce({
        rows: [
          { prix_unitaire_ht: '5.00', taux_tva: '5.50', quantite: 2, nom_produit: 'Riz', reference: 'FRL-0003' }
        ]
      });

    await invoiceService.generateForOrder(COMMANDE_ID);

    const ligne = invoiceRepository.createLigne.mock.calls[0][0].ligne;
    expect(ligne.prixUnitaireHt).toBe(5.00);
    expect(ligne.tauxTva).toBe(5.5);
    expect(ligne.montantHt).toBe(10.00);
    expect(ligne.montantTva).toBe(0.55);
    expect(ligne.montantTtc).toBe(10.55);

    // La requête ne doit PAS sélectionner p.taux_tva : cela écraserait
    // silencieusement lc.taux_tva (même alias de colonne) par le taux
    // courant du produit, qui peut avoir changé depuis l'achat.
    const lignesSql = database.query.mock.calls[1][0];
    expect(lignesSql).not.toMatch(/p\.taux_tva/);
    expect(lignesSql).toMatch(/p\.reference/);
  });

  it("n'a aucune valeur NaN dans les montants générés (régression : mauvaise colonne / mauvais sens de conversion)", async () => {
    database.query
      .mockResolvedValueOnce({ rows: [mockCommandeRow] })
      .mockResolvedValueOnce({
        rows: [
          { prix_unitaire_ht: '2.20', taux_tva: '10.00', quantite: 1, nom_produit: 'Sauce', reference: 'FRL-0004' }
        ]
      });

    await invoiceService.generateForOrder(COMMANDE_ID);

    const { totaux } = invoiceRepository.create.mock.calls[0][0];
    expect(Number.isNaN(totaux.ht)).toBe(false);
    expect(Number.isNaN(totaux.tva)).toBe(false);
    expect(Number.isNaN(totaux.ttc)).toBe(false);
  });
});

describe('InvoiceService.generateCreditNote — avoir après remboursement (T5-15)', () => {
  const FACTURE_ORIGINALE = {
    id: 'facture-uuid-orig',
    numero: 'FAC-2026-0042',
    utilisateur_id: 'user-uuid-0001',
    client_nom: 'Jean Dupont',
    client_email: 'jean.dupont@example.com',
    client_adresse: '1 rue de la Paix, 75001 Paris',
    entreprise_nom: 'Jana Distribution',
    entreprise_siret: '798787784',
    entreprise_tva_numero: 'FR92798787784',
    entreprise_adresse: '10 rue du Commerce',
    total_ht: '100.00',
    total_tva: '5.50',
    total_ttc: '105.50'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    invoiceRepository.getNextNumber.mockResolvedValue('AV-2026-0001');
    invoiceRepository.create.mockImplementation(async (data) => ({ id: 'avoir-uuid-0001', ...data }));
    invoiceRepository.createLigne.mockResolvedValue();
    invoiceRepository.linkAvoir.mockResolvedValue();
    invoiceRepository.findById.mockResolvedValue({ id: 'avoir-uuid-0001', lignes: [] });
  });

  it("ne génère rien et ne lève pas d'exception si aucune facture d'origine n'existe (remboursement sans facture)", async () => {
    invoiceRepository.findOriginalByCommande.mockResolvedValue(null);

    const result = await invoiceService.generateCreditNote(COMMANDE_ID, 50, 'Colis endommagé');

    expect(result).toBeNull();
    expect(invoiceRepository.create).not.toHaveBeenCalled();
  });

  it('proratise HT/TVA de l\'avoir sur le taux moyen de la facture d\'origine, montants négatifs', async () => {
    invoiceRepository.findOriginalByCommande.mockResolvedValue(FACTURE_ORIGINALE);

    // Remboursement partiel de 52.75€ TTC (moitié de la facture 105.50€ TTC,
    // ratio HT/TTC original = 100/105.50).
    await invoiceService.generateCreditNote(COMMANDE_ID, 52.75, 'Retour partiel');

    expect(invoiceRepository.getNextNumber).toHaveBeenCalledWith('AV');
    expect(invoiceRepository.create).toHaveBeenCalledTimes(1);
    const avoirData = invoiceRepository.create.mock.calls[0][0];

    expect(avoirData.type).toBe('AVOIR');
    expect(avoirData.commandeId).toBe(COMMANDE_ID);
    expect(avoirData.totaux.ttc).toBeCloseTo(-52.75, 2);
    // Tous les montants de l'avoir doivent être négatifs (credit note)
    expect(avoirData.totaux.ht).toBeLessThan(0);
    expect(avoirData.totaux.tva).toBeLessThan(0);
    // HT + TVA doit reconstituer exactement le TTC (pas d'écart d'arrondi)
    expect(Math.round((avoirData.totaux.ht + avoirData.totaux.tva) * 100) / 100).toBe(avoirData.totaux.ttc);

    expect(invoiceRepository.createLigne).toHaveBeenCalledTimes(1);
    const ligne = invoiceRepository.createLigne.mock.calls[0][0].ligne;
    expect(ligne.montantTtc).toBe(avoirData.totaux.ttc);
    expect(ligne.ref).toBe(FACTURE_ORIGINALE.numero);

    expect(invoiceRepository.linkAvoir).toHaveBeenCalledWith(FACTURE_ORIGINALE.id, 'avoir-uuid-0001');
  });

  it('un remboursement total (montant = TTC original) produit un avoir qui annule exactement HT et TVA', async () => {
    invoiceRepository.findOriginalByCommande.mockResolvedValue(FACTURE_ORIGINALE);

    await invoiceService.generateCreditNote(COMMANDE_ID, 105.50, null);

    const avoirData = invoiceRepository.create.mock.calls[0][0];
    expect(avoirData.totaux.ttc).toBe(-105.50);
    expect(avoirData.totaux.ht).toBe(-100.00);
    expect(avoirData.totaux.tva).toBe(-5.50);
  });

  it("n'a aucune valeur NaN même quand total_ttc original vaut zéro (garde-fou division)", async () => {
    invoiceRepository.findOriginalByCommande.mockResolvedValue({
      ...FACTURE_ORIGINALE,
      total_ht: '0.00',
      total_tva: '0.00',
      total_ttc: '0.00'
    });

    await invoiceService.generateCreditNote(COMMANDE_ID, 0, 'Remboursement nul');

    const avoirData = invoiceRepository.create.mock.calls[0][0];
    expect(Number.isNaN(avoirData.totaux.ht)).toBe(false);
    expect(Number.isNaN(avoirData.totaux.tva)).toBe(false);
    expect(Number.isNaN(avoirData.totaux.ttc)).toBe(false);
  });
});

describe('InvoiceRoutes — immutabilité d\'une facture émise', () => {
  it("n'expose aucune route PUT/PATCH/DELETE sur /api/invoices (seul un avoir doit pouvoir corriger une facture)", () => {
    const invoiceRoutes = require('../../src/routes/invoice.routes');

    const mutatingRoutes = invoiceRoutes.stack
      .filter((layer) => layer.route)
      .flatMap((layer) =>
        Object.keys(layer.route.methods)
          .filter((method) => ['put', 'patch', 'delete'].includes(method))
          .map((method) => `${method.toUpperCase()} ${layer.route.path}`)
      );

    expect(mutatingRoutes).toEqual([]);
  });
});
