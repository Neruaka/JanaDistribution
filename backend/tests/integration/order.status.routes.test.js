/**
 * Tests d'Intégration — Route admin PATCH /api/admin/orders/:id/status
 * @description Couvre T12-05 : la machine à états des statuts de commande
 * doit être appliquée CÔTÉ SERVEUR (order.service.js), pas seulement
 * empêchée par l'UI admin React. On exerce ici la vraie pile
 * route -> (logique inline admin.order.routes.js) -> orderService (réel)
 * -> orderRepository (mocké), pour vérifier qu'une transition de statut
 * invalide est rejetée avec un 400 et qu'aucune écriture n'est effectuée.
 */

const request = require('supertest');
const express = require('express');

// =============================================
// MOCKS — doivent être AVANT les imports
// =============================================

// Le logger et config/database sont déjà mockés globalement par tests/setup.js

// Mock du repository commande (findById / updateStatus consultés par orderService,
// le reste par les autres routes du fichier admin.order.routes.js)
const mockOrderRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByNumero: jest.fn(),
  findByUser: jest.fn(),
  create: jest.fn(),
  updateStatus: jest.fn(),
  cancel: jest.fn(),
  getHistory: jest.fn(),
  updatePaymentStatus: jest.fn(),
  markPaid: jest.fn(),
  updateRefund: jest.fn(),
  getStats: jest.fn()
};
jest.mock('../../src/repositories/order.repository', () => mockOrderRepository);

// userRepository utilisé par orderService pour l'email de notification —
// on le mock pour renvoyer null (pas d'utilisateur trouvé) afin que
// l'envoi d'email soit silencieusement ignoré (comportement déjà prévu par
// order.service.js#_sendOrderNotification).
jest.mock('../../src/repositories/user.repository', () => ({
  findById: jest.fn().mockResolvedValue(null)
}));

// Middleware d'authentification simplifié (admin toujours authentifié ici,
// le test de permission "isAdmin" n'est pas l'objet de ce fichier)
jest.mock('../../src/middlewares/auth.middleware', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 'admin-uuid-1', email: 'admin@jana-distribution.fr', role: 'ADMIN' };
    next();
  },
  isAdmin: (req, res, next) => next()
}));

// =============================================
// IMPORTS — après les mocks
// =============================================
const orderRepository = require('../../src/repositories/order.repository');
const adminOrderRoutes = require('../../src/routes/admin.order.routes');

const testErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    details: err.details || null
  });
};

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/admin/orders', adminOrderRoutes);
  app.use(testErrorHandler);
  return app;
};

describe('PATCH /api/admin/orders/:id/status — T12-05 machine à états', () => {
  let app;
  const ORDER_ID = '423e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    jest.clearAllMocks();
    app = createTestApp();
  });

  const baseOrder = (statut) => ({
    id: ORDER_ID,
    numeroCommande: 'CMD-20260714-0001',
    statut,
    utilisateurId: 'client-uuid-1',
    modePaiement: 'ESPECES'
  });

  it('rejette EN_ATTENTE → LIVREE (saut d\'étapes) avec 400, sans écrire en base', async () => {
    orderRepository.findById.mockResolvedValue(baseOrder('EN_ATTENTE'));

    const res = await request(app)
      .patch(`/api/admin/orders/${ORDER_ID}/status`)
      .set('Authorization', 'Bearer admin-token')
      .send({ statut: 'LIVREE' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Transition de statut invalide/);
    expect(orderRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('rejette une transition depuis un statut terminal (LIVREE → EXPEDIEE) avec 400', async () => {
    orderRepository.findById.mockResolvedValue(baseOrder('LIVREE'));

    const res = await request(app)
      .patch(`/api/admin/orders/${ORDER_ID}/status`)
      .set('Authorization', 'Bearer admin-token')
      .send({ statut: 'EXPEDIEE' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Transition de statut invalide/);
    expect(orderRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('accepte une transition valide EN_ATTENTE → CONFIRMEE (200)', async () => {
    orderRepository.findById.mockResolvedValue(baseOrder('EN_ATTENTE'));
    orderRepository.updateStatus.mockResolvedValue(baseOrder('CONFIRMEE'));

    const res = await request(app)
      .patch(`/api/admin/orders/${ORDER_ID}/status`)
      .set('Authorization', 'Bearer admin-token')
      .send({ statut: 'CONFIRMEE' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.statut).toBe('CONFIRMEE');
    expect(orderRepository.updateStatus).toHaveBeenCalledWith(ORDER_ID, 'CONFIRMEE', null);
  });

  it('rejette un statut inconnu dès la validation express-validator (400, service jamais appelé)', async () => {
    const res = await request(app)
      .patch(`/api/admin/orders/${ORDER_ID}/status`)
      .set('Authorization', 'Bearer admin-token')
      .send({ statut: 'STATUT_INEXISTANT' });

    expect(res.status).toBe(400);
    expect(orderRepository.findById).not.toHaveBeenCalled();
  });
});
