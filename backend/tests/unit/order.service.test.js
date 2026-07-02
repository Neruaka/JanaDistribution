/**
 * Tests Unitaires — OrderService (atomicité panier/commande)
 * Couvre T1-01 : le cartId est transmis à orderRepository.create() et
 * clearCart() n'est JAMAIS appelé séparément depuis le service.
 *
 * LIMITE : tests sur DB mockée. La vérification que le DELETE ligne_panier
 * est bien dans la même transaction PostgreSQL est prévue en Phase 7 (tests
 * d'intégration sur vraie base).
 */

jest.mock('../../src/repositories/order.repository');
jest.mock('../../src/repositories/cart.repository');
jest.mock('../../src/repositories/user.repository');
jest.mock('../../src/services/email.service', () => ({
  sendOrderConfirmation: jest.fn().mockResolvedValue({}),
  sendOrderStatusUpdate: jest.fn().mockResolvedValue({})
}));
jest.mock('../../src/services/settings.service', () => ({
  get: jest.fn().mockResolvedValue(0),
  getFraisLivraison: jest.fn().mockResolvedValue(5.90),
  computeDistanceShipping: jest.fn().mockResolvedValue({ hors_zone: false })
}));

const orderService = require('../../src/services/order.service');
const orderRepository = require('../../src/repositories/order.repository');
const cartRepository = require('../../src/repositories/cart.repository');

const CART_ID = 'cart-uuid-1234';
const USER_ID = 'user-uuid-5678';

const mockCart = {
  id: CART_ID,
  userId: USER_ID,
  items: [
    {
      productId: 'prod-uuid-001',
      quantity: 2,
      effectivePrice: 5.00,
      product: { name: 'Pommes', isActive: true, stock: 10, tvaRate: 5.5 }
    }
  ],
  summary: { subtotalHT: 10.00, totalTVA: 0.55, totalTTC: 10.55, itemCount: 1, totalQuantity: 2 }
};

const mockOrder = {
  id: 'order-uuid-9999',
  numeroCommande: 'CMD-20260614-0001',
  statut: 'EN_ATTENTE',
  totalTtc: 16.45,
  utilisateurId: USER_ID
};

const validOrderData = {
  adresseLivraison: { nom: 'Dupont', prenom: 'Jean', adresse: '1 rue de la Paix', codePostal: '75001', ville: 'Paris' },
  modePaiement: 'ESPECES'
};

describe('OrderService — T1-01 : atomicité panier/commande', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cartRepository.getOrCreateCart.mockResolvedValue(mockCart);
    orderRepository.create.mockResolvedValue(mockOrder);
    cartRepository.clearCart.mockResolvedValue(true);
  });

  it('transmet cartId dans orderData à orderRepository.create()', async () => {
    await orderService.createFromCart(USER_ID, validOrderData);

    expect(orderRepository.create).toHaveBeenCalledTimes(1);
    const callArg = orderRepository.create.mock.calls[0][0];
    expect(callArg.cartId).toBe(CART_ID);
  });

  it('ne appelle PAS clearCart() après la création de commande', async () => {
    await orderService.createFromCart(USER_ID, validOrderData);

    expect(cartRepository.clearCart).not.toHaveBeenCalled();
  });

  it('lance une erreur si le panier est vide, sans appeler orderRepository.create()', async () => {
    cartRepository.getOrCreateCart.mockResolvedValue({
      ...mockCart,
      items: [],
      summary: { subtotalHT: 0, totalTVA: 0, totalTTC: 0, itemCount: 0, totalQuantity: 0 }
    });

    await expect(orderService.createFromCart(USER_ID, validOrderData))
      .rejects.toThrow('panier est vide');

    expect(orderRepository.create).not.toHaveBeenCalled();
    expect(cartRepository.clearCart).not.toHaveBeenCalled();
  });

  it('ne vide pas le panier si un produit est inactif (erreur de validation)', async () => {
    cartRepository.getOrCreateCart.mockResolvedValue({
      ...mockCart,
      items: [{
        ...mockCart.items[0],
        product: { ...mockCart.items[0].product, isActive: false }
      }]
    });

    await expect(orderService.createFromCart(USER_ID, validOrderData))
      .rejects.toThrow();

    expect(cartRepository.clearCart).not.toHaveBeenCalled();
  });

  it('retourne order + message si la création réussit', async () => {
    const result = await orderService.createFromCart(USER_ID, validOrderData);

    expect(result.order).toEqual(mockOrder);
    expect(result.message).toContain(mockOrder.numeroCommande);
  });
});
