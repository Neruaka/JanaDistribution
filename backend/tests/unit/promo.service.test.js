/**
 * Tests Unitaires — PromoService
 * Couvre la validation d'un code promo (existence, actif, dates, montant
 * minimum, limites d'utilisation) et le calcul du rabais (POURCENTAGE vs
 * MONTANT_FIXE).
 */

jest.mock('../../src/repositories/promo.repository');

const promoService = require('../../src/services/promo.service');
const promoRepository = require('../../src/repositories/promo.repository');

const USER_ID = 'user-uuid-1111';

const basePromo = {
  id: 'promo-uuid-0001',
  code: 'BIENVENUE10',
  typeRabais: 'POURCENTAGE',
  valeurRabais: 10,
  montantMinimum: 0,
  maxUtilisationsGlobal: null,
  maxUtilisationsParClient: 1,
  dateDebut: null,
  dateFin: null,
  actif: true
};

describe('PromoService — validerCode()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    promoRepository.countUtilisationsGlobal.mockResolvedValue(0);
    promoRepository.countUtilisationsByUser.mockResolvedValue(0);
  });

  it('rejette un code inexistant', async () => {
    promoRepository.findByCode.mockResolvedValue(null);

    await expect(promoService.validerCode('INEXISTANT', USER_ID, 50))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejette un code désactivé', async () => {
    promoRepository.findByCode.mockResolvedValue({ ...basePromo, actif: false });

    await expect(promoService.validerCode('BIENVENUE10', USER_ID, 50))
      .rejects.toThrow(/n'est plus actif/);
  });

  it('rejette un code pas encore valide (date_debut future)', async () => {
    const dateDebut = new Date(Date.now() + 24 * 60 * 60 * 1000);
    promoRepository.findByCode.mockResolvedValue({ ...basePromo, dateDebut });

    await expect(promoService.validerCode('BIENVENUE10', USER_ID, 50))
      .rejects.toThrow(/pas encore valide/);
  });

  it('rejette un code expiré (date_fin passée)', async () => {
    const dateFin = new Date(Date.now() - 24 * 60 * 60 * 1000);
    promoRepository.findByCode.mockResolvedValue({ ...basePromo, dateFin });

    await expect(promoService.validerCode('BIENVENUE10', USER_ID, 50))
      .rejects.toThrow(/expiré/);
  });

  it('rejette si le montant minimum de commande n\'est pas atteint', async () => {
    promoRepository.findByCode.mockResolvedValue({ ...basePromo, montantMinimum: 100 });

    await expect(promoService.validerCode('BIENVENUE10', USER_ID, 50))
      .rejects.toThrow(/montant minimum/);
  });

  it('rejette si la limite globale d\'utilisations est atteinte', async () => {
    promoRepository.findByCode.mockResolvedValue({ ...basePromo, maxUtilisationsGlobal: 5 });
    promoRepository.countUtilisationsGlobal.mockResolvedValue(5);

    await expect(promoService.validerCode('BIENVENUE10', USER_ID, 50))
      .rejects.toThrow(/maximum d'utilisations/);
  });

  it('rejette si le client a déjà atteint sa limite d\'utilisations personnelle', async () => {
    promoRepository.findByCode.mockResolvedValue({ ...basePromo, maxUtilisationsParClient: 1 });
    promoRepository.countUtilisationsByUser.mockResolvedValue(1);

    await expect(promoService.validerCode('BIENVENUE10', USER_ID, 50))
      .rejects.toThrow(/déjà utilisé ce code/);
  });

  it('calcule correctement un rabais de type POURCENTAGE', async () => {
    promoRepository.findByCode.mockResolvedValue({ ...basePromo, typeRabais: 'POURCENTAGE', valeurRabais: 10 });

    const result = await promoService.validerCode('BIENVENUE10', USER_ID, 100);

    expect(result.montantRabais).toBe(10);
    expect(result.totalApresRabais).toBe(90);
  });

  it('calcule correctement un rabais de type MONTANT_FIXE', async () => {
    promoRepository.findByCode.mockResolvedValue({ ...basePromo, typeRabais: 'MONTANT_FIXE', valeurRabais: 15 });

    const result = await promoService.validerCode('BIENVENUE10', USER_ID, 100);

    expect(result.montantRabais).toBe(15);
    expect(result.totalApresRabais).toBe(85);
  });

  it('plafonne un rabais MONTANT_FIXE au total de la commande (jamais négatif)', async () => {
    promoRepository.findByCode.mockResolvedValue({ ...basePromo, typeRabais: 'MONTANT_FIXE', valeurRabais: 500 });

    const result = await promoService.validerCode('BIENVENUE10', USER_ID, 30);

    expect(result.montantRabais).toBe(30);
    expect(result.totalApresRabais).toBe(0);
  });

  it('rejette un total de commande invalide', async () => {
    await expect(promoService.validerCode('BIENVENUE10', USER_ID, 0))
      .rejects.toMatchObject({ statusCode: 400 });
  });
});
