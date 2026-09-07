/**
 * Tests Unitaires — ListeRecurrenteService (T16-13)
 * Couvre : création depuis le panier serveur (jamais depuis des données
 * client), ré-ajout au panier avec tolérance aux échecs individuels
 * (produit désactivé/rupture), et les gardes-fous notFound/panier vide.
 */

jest.mock('../../src/repositories/liste-recurrente.repository');
jest.mock('../../src/repositories/cart.repository');
jest.mock('../../src/services/cart.service');

const listeRecurrenteService = require('../../src/services/liste-recurrente.service');
const listeRecurrenteRepository = require('../../src/repositories/liste-recurrente.repository');
const cartRepository = require('../../src/repositories/cart.repository');
const cartService = require('../../src/services/cart.service');

const USER_ID = 'user-uuid-1234';

describe('ListeRecurrenteService.createFromCart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('crée la liste à partir des items réels du panier serveur (pas de données client)', async () => {
    cartRepository.getOrCreateCart.mockResolvedValue({
      items: [
        { productId: 'prod-1', quantity: 3 },
        { productId: 'prod-2', quantity: 1 }
      ]
    });
    listeRecurrenteRepository.create.mockResolvedValue({ id: 'liste-1', nom: 'Ma liste', dateCreation: new Date() });

    await listeRecurrenteService.createFromCart(USER_ID, 'Ma liste');

    expect(listeRecurrenteRepository.create).toHaveBeenCalledWith(USER_ID, 'Ma liste', [
      { produitId: 'prod-1', quantite: 3 },
      { produitId: 'prod-2', quantite: 1 }
    ]);
  });

  it('rejette si le panier est vide', async () => {
    cartRepository.getOrCreateCart.mockResolvedValue({ items: [] });

    await expect(listeRecurrenteService.createFromCart(USER_ID, 'Ma liste')).rejects.toThrow(/panier est vide/);
    expect(listeRecurrenteRepository.create).not.toHaveBeenCalled();
  });

  it('rejette si le nom est vide', async () => {
    await expect(listeRecurrenteService.createFromCart(USER_ID, '   ')).rejects.toThrow(/nom de la liste/);
    expect(cartRepository.getOrCreateCart).not.toHaveBeenCalled();
  });
});

describe('ListeRecurrenteService.ajouterAuPanier', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejette si la liste n\'existe pas ou n\'appartient pas à l\'utilisateur', async () => {
    listeRecurrenteRepository.findById.mockResolvedValue(null);

    await expect(listeRecurrenteService.ajouterAuPanier('liste-1', USER_ID)).rejects.toThrow(/non trouvée/);
  });

  it('rejette si la liste appartient à un autre utilisateur', async () => {
    listeRecurrenteRepository.findById.mockResolvedValue({ utilisateurId: 'autre-user', produits: [] });

    await expect(listeRecurrenteService.ajouterAuPanier('liste-1', USER_ID)).rejects.toThrow(/non trouvée/);
  });

  it('continue sur un produit en échec (désactivé/rupture) et rapporte le compte exact', async () => {
    listeRecurrenteRepository.findById.mockResolvedValue({
      utilisateurId: USER_ID,
      produits: [
        { produitId: 'prod-1', quantite: 2 },
        { produitId: 'prod-2', quantite: 1 },
        { produitId: 'prod-3', quantite: 5 }
      ]
    });
    cartService.addItem
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('Ce produit est en rupture de stock'))
      .mockResolvedValueOnce({});

    const result = await listeRecurrenteService.ajouterAuPanier('liste-1', USER_ID);

    expect(cartService.addItem).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ added: 2, skipped: 1 });
  });
});

describe('ListeRecurrenteService.deleteListe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejette si la liste n\'existe pas ou n\'appartient pas à l\'utilisateur', async () => {
    listeRecurrenteRepository.delete.mockResolvedValue(false);

    await expect(listeRecurrenteService.deleteListe('liste-1', USER_ID)).rejects.toThrow(/non trouvée/);
  });

  it('supprime la liste si elle appartient à l\'utilisateur', async () => {
    listeRecurrenteRepository.delete.mockResolvedValue(true);

    await expect(listeRecurrenteService.deleteListe('liste-1', USER_ID)).resolves.toBeUndefined();
    expect(listeRecurrenteRepository.delete).toHaveBeenCalledWith('liste-1', USER_ID);
  });
});
