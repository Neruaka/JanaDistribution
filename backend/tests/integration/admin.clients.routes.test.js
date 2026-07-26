/**
 * Tests d'Intégration — Routes admin.clients.routes.js
 * @description Couvre T12-09 :
 *  1. Cloisonnement admin (401 sans token, 403 avec un token non-admin)
 *     sur les routes /api/admin/clients/*.
 *  2. Couverture réelle de l'audit_log pour les actions sensibles sur les
 *     comptes clients (modification, activation/blocage, suppression RGPD),
 *     qui n'étaient pas tracées avant cette correction.
 */

const request = require('supertest');
const express = require('express');

// =============================================
// MOCKS — doivent être AVANT les imports
// =============================================

jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

// Client transactionnel utilisé par la route DELETE (getClient())
const mockTxClient = {
  query: jest.fn(),
  release: jest.fn()
};

const mockDb = {
  query: jest.fn(),
  getClient: jest.fn(() => Promise.resolve(mockTxClient))
};
jest.mock('../../src/config/database', () => mockDb);

// Auth : admin si le token contient "admin", sinon CLIENT. Sans header => 401.
jest.mock('../../src/middlewares/auth.middleware', () => ({
  authenticate: (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Token manquant' });
    }
    req.user = {
      id: 'admin-uuid-1',
      email: 'admin@jana-distribution.fr',
      role: authHeader.includes('admin') ? 'ADMIN' : 'CLIENT'
    };
    next();
  },
  isAdmin: (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux administrateurs' });
    }
    next();
  }
}));

jest.mock('../../src/middlewares/validate.middleware', () => (req, res, next) => next());

// =============================================
// IMPORTS — après les mocks
// =============================================
const adminClientsRoutes = require('../../src/routes/admin.clients.routes');

const testErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ success: false, message: err.message });
};

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/admin/clients', adminClientsRoutes);
  app.use(testErrorHandler);
  return app;
};

describe('Routes admin.clients.routes.js — T12-09', () => {
  let app;
  const CLIENT_ID = '523e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    jest.clearAllMocks();
    mockTxClient.query.mockReset();
    mockDb.getClient.mockResolvedValue(mockTxClient);
    app = createTestApp();
  });

  // =============================================
  // CLOISONNEMENT ADMIN (401 / 403)
  // =============================================
  describe('Cloisonnement admin', () => {
    it('GET /api/admin/clients — 401 sans token', async () => {
      const res = await request(app).get('/api/admin/clients');
      expect(res.status).toBe(401);
    });

    it('GET /api/admin/clients — 403 avec un token non-admin', async () => {
      const res = await request(app)
        .get('/api/admin/clients')
        .set('Authorization', 'Bearer client-token');
      expect(res.status).toBe(403);
    });

    it('PATCH /api/admin/clients/:id/toggle-status — 401 sans token', async () => {
      const res = await request(app).patch(`/api/admin/clients/${CLIENT_ID}/toggle-status`);
      expect(res.status).toBe(401);
    });

    it('PATCH /api/admin/clients/:id/toggle-status — 403 avec un token non-admin', async () => {
      const res = await request(app)
        .patch(`/api/admin/clients/${CLIENT_ID}/toggle-status`)
        .set('Authorization', 'Bearer client-token');
      expect(res.status).toBe(403);
    });

    it('DELETE /api/admin/clients/:id — 401 sans token', async () => {
      const res = await request(app).delete(`/api/admin/clients/${CLIENT_ID}`);
      expect(res.status).toBe(401);
    });

    it('DELETE /api/admin/clients/:id — 403 avec un token non-admin', async () => {
      const res = await request(app)
        .delete(`/api/admin/clients/${CLIENT_ID}`)
        .set('Authorization', 'Bearer client-token');
      expect(res.status).toBe(403);
    });
  });

  // =============================================
  // COUVERTURE AUDIT_LOG (actions sensibles sur comptes clients)
  // =============================================
  describe('Traçabilité audit_log', () => {
    it('PATCH /:id/toggle-status écrit une entrée audit_log (CLIENT_TOGGLE_STATUS)', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{ id: CLIENT_ID, nom: 'Dupont', prenom: 'Jean', email: 'jean@test.fr', est_actif: false }]
      });

      const res = await request(app)
        .patch(`/api/admin/clients/${CLIENT_ID}/toggle-status`)
        .set('Authorization', 'Bearer admin-token');

      expect(res.status).toBe(200);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_log'),
        expect.arrayContaining(['CLIENT_TOGGLE_STATUS'])
      );
    });

    it('PATCH /:id (modification) écrit une entrée audit_log (CLIENT_UPDATE)', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{ id: CLIENT_ID, nom: 'Durand', prenom: 'Alice', email: 'alice@test.fr' }]
      });

      const res = await request(app)
        .patch(`/api/admin/clients/${CLIENT_ID}`)
        .set('Authorization', 'Bearer admin-token')
        .send({ nom: 'Durand' });

      expect(res.status).toBe(200);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_log'),
        expect.arrayContaining(['CLIENT_UPDATE'])
      );
    });

    it('DELETE /:id (anonymisation RGPD) écrit une entrée audit_log (CLIENT_DELETE_RGPD)', async () => {
      mockTxClient.query.mockImplementation((sql) => {
        if (typeof sql === 'string' && sql.includes('SELECT id, email FROM utilisateur')) {
          return Promise.resolve({ rows: [{ id: CLIENT_ID, email: 'jean@test.fr' }] });
        }
        return Promise.resolve({ rows: [] });
      });

      const res = await request(app)
        .delete(`/api/admin/clients/${CLIENT_ID}`)
        .set('Authorization', 'Bearer admin-token');

      expect(res.status).toBe(200);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_log'),
        expect.arrayContaining(['CLIENT_DELETE_RGPD'])
      );
    });
  });
});
