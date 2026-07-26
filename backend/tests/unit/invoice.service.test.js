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

const mockCommandeRow = {
  id: COMMANDE_ID,
  utilisateur_id: 'user-uuid-0001',
  prenom: 'Jean',
  client_nom_famille: 'Dupont',
  email: 'jean.dupont@example.com',
  adresse_livraison: '1 rue de la Paix',
  ville: 'Paris',
  code_postal: '75001'
};

describe('InvoiceService.generateForOrder — cohérence des arrondis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    invoiceRepository.findByCommande.mockResolvedValue([]);
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
