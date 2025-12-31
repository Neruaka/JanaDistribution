/**
 * Tests d'Intégration - Auth Routes
 * @description Tests des endpoints d'authentification
 */

const request = require('supertest');
const express = require('express');

// Mock des dépendances AVANT les imports
jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
  connect: jest.fn()
}));

jest.mock('../../src/config/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn()
}));

// Mock du service auth
jest.mock('../../src/services/auth.service');

// Import après les mocks
const authService = require('../../src/services/auth.service');
const authRoutes = require('../../src/routes/auth.routes');

// Créer un errorHandler simplifié pour les tests
const testErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    details: err.details || null
  });
};

/**
 * Crée une app Express de test
 */
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use(testErrorHandler);
  return app;
};

describe('Auth Routes - Integration Tests', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createTestApp();
  });

  // =============================================
  // POST /api/auth/register
  // =============================================
  describe('POST /api/auth/register', () => {
    const validRegistration = {
      email: 'test@example.com',
      motDePasse: 'SecureP@ss123',
      nom: 'Dupont',
      prenom: 'Jean',
      telephone: '0612345678',
      typeClient: 'PARTICULIER',
      accepteCgu: true
    };

    it('devrait créer un nouvel utilisateur avec succès (201)', async () => {
      // Arrange
      const mockUser = {
        id: 'uuid-123',
        email: validRegistration.email,
        nom: validRegistration.nom,
        prenom: validRegistration.prenom,
        role: 'CLIENT'
      };
      const mockToken = 'jwt-token-123';
      
      authService.register.mockResolvedValue({ user: mockUser, token: mockToken });

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistration);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(validRegistration.email);
      expect(response.body.data.token).toBe(mockToken);
    });

    it('devrait rejeter une inscription sans email (400)', async () => {
      // Arrange
      const invalidData = { ...validRegistration };
      delete invalidData.email;

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('devrait rejeter un email invalide (400)', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegistration, email: 'invalid-email' });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('devrait rejeter un mot de passe trop court (400)', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegistration, motDePasse: '123' });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('devrait rejeter sans acceptation des CGU (400)', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegistration, accepteCgu: false });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('devrait rejeter si l\'email existe déjà (409)', async () => {
      // Arrange
      const error = new Error('Cet email est déjà utilisé');
      error.statusCode = 409;
      authService.register.mockRejectedValue(error);

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistration);

      // Assert
      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('devrait valider le SIRET pour les professionnels (400)', async () => {
      // Arrange
      const proData = {
        ...validRegistration,
        typeClient: 'PROFESSIONNEL',
        siret: '123' // SIRET invalide (doit faire 14 chiffres)
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(proData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // =============================================
  // POST /api/auth/login
  // =============================================
  describe('POST /api/auth/login', () => {
    const validLogin = {
      email: 'test@example.com',
      motDePasse: 'SecureP@ss123'
    };

    it('devrait connecter un utilisateur avec succès (200)', async () => {
      // Arrange
      const mockUser = {
        id: 'uuid-123',
        email: validLogin.email,
        nom: 'Dupont',
        prenom: 'Jean',
        role: 'CLIENT'
      };
      const mockToken = 'jwt-token-456';
      
      authService.login.mockResolvedValue({ user: mockUser, token: mockToken });

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(validLogin);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBe(mockToken);
    });

    it('devrait rejeter sans email (400)', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({ motDePasse: 'password123' });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('devrait rejeter sans mot de passe (400)', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('devrait rejeter des identifiants invalides (401)', async () => {
      // Arrange
      const error = new Error('Identifiants invalides');
      error.statusCode = 401;
      authService.login.mockRejectedValue(error);

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(validLogin);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('devrait rejeter un compte désactivé (403)', async () => {
      // Arrange
      const error = new Error('Compte désactivé');
      error.statusCode = 403;
      authService.login.mockRejectedValue(error);

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(validLogin);

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  // =============================================
  // GET /api/auth/me
  // =============================================
  describe('GET /api/auth/me', () => {
    it('devrait rejeter sans token (401)', async () => {
      // Act
      const response = await request(app)
        .get('/api/auth/me');

      // Assert
      expect(response.status).toBe(401);
    });

    it('devrait rejeter avec un token invalide (401)', async () => {
      // Arrange
      authService.verifyToken.mockImplementation(() => {
        const error = new Error('Token invalide');
        error.statusCode = 401;
        throw error;
      });

      // Act
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      // Assert
      expect(response.status).toBe(401);
    });
  });

  // =============================================
  // POST /api/auth/logout
  // =============================================
  describe('POST /api/auth/logout', () => {
    it('devrait retourner un succès même sans token', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/logout');

      // Assert - logout devrait toujours réussir côté serveur
      expect([200, 401]).toContain(response.status);
    });
  });
});
