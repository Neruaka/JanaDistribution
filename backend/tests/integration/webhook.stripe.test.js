/**
 * Tests d'intégration — Webhook Stripe (T7-02)
 *
 * Vérifie :
 * 1. Rejet si stripe-signature absente (→ 400, court-circuit dans la route)
 * 2. Rejet si signature invalide (→ 400, constructEvent lève une erreur)
 * 3. Idempotency : même event_id traité une seule fois (rowCount=0 → return sans retraitement)
 * 4. checkout.session.completed → 200
 * 5. refund.created → 200 (utilise payment_intent, pas charge)
 * 6. event inconnu → 200 sans crash
 *
 * Pattern : mini-app Express isolée (comme auth.routes.test.js), mocks au niveau module.
 */

const request = require('supertest');
const express = require('express');

// =============================================
// MOCKS — doivent être déclarés avant tout import
// =============================================

jest.mock('../../src/config/logger', () => ({
  info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn()
}));

jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
  pool: { query: jest.fn() }
}));

jest.mock('../../src/config/redis', () => ({
  connectRedis: jest.fn().mockResolvedValue(null),
  getRedis: jest.fn().mockReturnValue(null),
  isRedisAvailable: jest.fn().mockReturnValue(false),
  cacheGet: jest.fn().mockResolvedValue(null),
  cacheSet: jest.fn().mockResolvedValue(false),
  cacheDel: jest.fn().mockResolvedValue(false)
}));

// Mock stripe config — getStripe() retourné sera configuré dans chaque test
jest.mock('../../src/config/stripe', () => ({
  getStripe: jest.fn(),
  getWebhookSecret: jest.fn().mockReturnValue('whsec_test_mock')
}));

// Mocks des dépendances internes appelées après vérification signature
jest.mock('../../src/repositories/order.repository', () => ({
  findById: jest.fn().mockResolvedValue(null),
  markPaid: jest.fn().mockResolvedValue({}),
  updatePaymentStatus: jest.fn().mockResolvedValue({}),
  updateRefund: jest.fn().mockResolvedValue({})
}));

jest.mock('../../src/services/order.service', () => ({
  updateStatus: jest.fn().mockResolvedValue({})
}));

jest.mock('../../src/services/invoice.service', () => ({
  generateForOrder: jest.fn().mockResolvedValue({})
}));

jest.mock('../../src/repositories/audit.repository', () => ({
  log: jest.fn().mockResolvedValue({})
}));

// =============================================
// IMPORTS POST-MOCK
// =============================================

const { query } = require('../../src/config/database');
const { getStripe } = require('../../src/config/stripe');
const orderRepository = require('../../src/repositories/order.repository');

// =============================================
// FACTORY APP DE TEST
// =============================================

const createTestApp = () => {
  const app = express();
  // La route webhook monte son propre express.raw() — pas d'express.json() global
  const webhookRoutes = require('../../src/routes/webhook.routes');
  app.use('/api/webhooks', webhookRoutes);
  return app;
};

// =============================================
// DESCRIBE 1 — Sécurité
// =============================================

describe('Webhook Stripe — Sécurité', () => {
  let app;
  let mockConstructEvent;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    mockConstructEvent = jest.fn();
    getStripe.mockReturnValue({ webhooks: { constructEvent: mockConstructEvent } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('rejette une requête sans header stripe-signature → 400', async () => {
    const res = await request(app)
      .post('/api/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ type: 'checkout.session.completed' }));

    expect(res.status).toBe(400);
    expect(res.body.received).toBe(false);
    // constructEvent ne doit pas être appelé — la route retourne 400 avant
    expect(mockConstructEvent).not.toHaveBeenCalled();
  });

  test('rejette une signature invalide → 400', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Webhook signature verification failed');
    });

    const res = await request(app)
      .post('/api/webhooks/stripe')
      .set('stripe-signature', 'invalid-sig')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ type: 'test' }));

    expect(res.status).toBe(400);
    expect(res.body.received).toBe(false);
  });
});

// =============================================
// DESCRIBE 2 — Idempotency
// =============================================

describe('Webhook Stripe — Idempotency', () => {
  let app;
  let mockConstructEvent;

  const fakeEvent = {
    id: 'evt_test_idempotency_001',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test',
        payment_status: 'paid',
        payment_intent: 'pi_test',
        metadata: { orderId: 'cmd-uuid-idem' },
        client_reference_id: null
      }
    }
  };

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    mockConstructEvent = jest.fn().mockReturnValue(fakeEvent);
    getStripe.mockReturnValue({ webhooks: { constructEvent: mockConstructEvent } });
    orderRepository.findById.mockResolvedValue({ id: 'cmd-uuid-idem', statut: 'EN_ATTENTE' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('traite un event une seule fois (double envoi ignoré)', async () => {
    // Premier appel : rowCount=1 → event nouveau, traité
    query.mockResolvedValueOnce({ rowCount: 1, rows: [] });

    const res1 = await request(app)
      .post('/api/webhooks/stripe')
      .set('stripe-signature', 'valid-sig')
      .set('Content-Type', 'application/json')
      .send('{}');

    // Deuxième appel : rowCount=0 → event déjà traité, ignoré silencieusement
    query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const res2 = await request(app)
      .post('/api/webhooks/stripe')
      .set('stripe-signature', 'valid-sig')
      .set('Content-Type', 'application/json')
      .send('{}');

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res1.body.received).toBe(true);
    expect(res2.body.received).toBe(true);

    // INSERT appelé deux fois (une par requête), mais markPaid appelé une seule fois
    expect(query).toHaveBeenCalledTimes(2);
    const insertCalls = query.mock.calls.filter(([sql]) =>
      typeof sql === 'string' && sql.includes('INSERT INTO stripe_event')
    );
    expect(insertCalls.length).toBe(2);

    // markPaid appelé une seule fois (au premier appel seulement)
    expect(orderRepository.markPaid).toHaveBeenCalledTimes(1);
  });
});

// =============================================
// DESCRIBE 3 — Events
// =============================================

describe('Webhook Stripe — Events', () => {
  let app;
  let mockConstructEvent;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    mockConstructEvent = jest.fn();
    getStripe.mockReturnValue({ webhooks: { constructEvent: mockConstructEvent } });
    // Par défaut : INSERT réussit (event nouveau)
    query.mockResolvedValue({ rowCount: 1, rows: [] });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('checkout.session.completed avec payment_status=paid → 200', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_checkout_001',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_001',
          payment_status: 'paid',
          payment_intent: 'pi_test_001',
          metadata: { orderId: 'cmd-uuid-001' },
          client_reference_id: null
        }
      }
    });

    orderRepository.findById.mockResolvedValue({
      id: 'cmd-uuid-001', statut: 'EN_ATTENTE', utilisateurId: 'user-001'
    });

    const res = await request(app)
      .post('/api/webhooks/stripe')
      .set('stripe-signature', 'valid-sig')
      .set('Content-Type', 'application/json')
      .send('{}');

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
    expect(orderRepository.markPaid).toHaveBeenCalledWith('cmd-uuid-001', expect.objectContaining({
      stripeSessionId: 'cs_test_001'
    }));
  });

  test('checkout.session.completed sans payment_status=paid → 200 (ignoré)', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_checkout_unpaid',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_unpaid',
          payment_status: 'unpaid',
          metadata: { orderId: 'cmd-uuid-002' },
          client_reference_id: null
        }
      }
    });

    const res = await request(app)
      .post('/api/webhooks/stripe')
      .set('stripe-signature', 'valid-sig')
      .set('Content-Type', 'application/json')
      .send('{}');

    expect(res.status).toBe(200);
    // markPaid ne doit pas être appelé (payment_status != 'paid')
    expect(orderRepository.markPaid).not.toHaveBeenCalled();
  });

  test('refund.created → 200 (identifie la commande par payment_intent)', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_refund_001',
      type: 'refund.created',
      data: {
        object: {
          id: 're_test_001',
          payment_intent: 'pi_ref_001',  // Le code utilise payment_intent, pas charge
          amount: 5000,
          status: 'succeeded'
        }
      }
    });

    // INSERT stripe_event → rowCount=1
    // SELECT commande WHERE stripe_payment_intent_id → commande trouvée
    query
      .mockResolvedValueOnce({ rowCount: 1, rows: [] })
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'cmd-uuid-001', total_ttc: '100.00' }] });

    const res = await request(app)
      .post('/api/webhooks/stripe')
      .set('stripe-signature', 'valid-sig')
      .set('Content-Type', 'application/json')
      .send('{}');

    expect(res.status).toBe(200);
    expect(orderRepository.updateRefund).toHaveBeenCalledWith('cmd-uuid-001', expect.objectContaining({
      stripeRefundId: 're_test_001',
      montantRembourse: 50
    }));
  });

  test('event inconnu (customer.created) → 200 sans crash', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_unknown_001',
      type: 'customer.created',
      data: { object: { id: 'cus_test' } }
    });

    const res = await request(app)
      .post('/api/webhooks/stripe')
      .set('stripe-signature', 'valid-sig')
      .set('Content-Type', 'application/json')
      .send('{}');

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
    // Aucune action métier ne doit avoir été déclenchée
    expect(orderRepository.markPaid).not.toHaveBeenCalled();
    expect(orderRepository.updateRefund).not.toHaveBeenCalled();
  });
});
