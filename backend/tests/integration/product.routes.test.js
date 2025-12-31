/**
 * Tests d'Intégration - Product Routes
 * @description Tests des endpoints de gestion des produits
 */

const request = require('supertest');
const express = require('express');

// =============================================
// MOCKS - Doivent être AVANT les imports
// =============================================

// Mock du logger
jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

// Mock de la base de données
jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
  connect: jest.fn()
}));

// Mock de Redis
jest.mock('../../src/config/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn()
}));

// Mock du service product avec TOUTES les méthodes
const mockProductService = {
  getProducts: jest.fn(),
  getProductById: jest.fn(),
  getProductBySlug: jest.fn(),
  getPromos: jest.fn(),
  getNewProducts: jest.fn(),
  getFeaturedProducts: jest.fn(),
  getLowStockProducts: jest.fn(),
  createProduct: jest.fn(),
  updateProduct: jest.fn(),
  deleteProduct: jest.fn(),
  hardDeleteProduct: jest.fn(),
  updateStock: jest.fn(),
  generateSlug: jest.fn(),
  countByCategory: jest.fn()
};
jest.mock('../../src/services/product.service', () => mockProductService);

// Mock du middleware auth avec les BONS NOMS
jest.mock('../../src/middlewares/auth.middleware', () => ({
  authenticate: (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Token manquant' });
    }
    req.user = {
      id: 'user-uuid',
      email: 'test@example.com',
      role: authHeader.includes('admin') ? 'ADMIN' : 'CLIENT'
    };
    next();
  },
  isAdmin: (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux administrateurs' });
    }
    next();
  },
  requireAdmin: (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux administrateurs' });
    }
    next();
  },
  optionalAuth: (req, res, next) => next(),
  isClient: (req, res, next) => next(),
  hasPermission: () => (req, res, next) => next(),
  isOwnerOrAdmin: () => (req, res, next) => next()
}));

// Mock des validators (tableaux vides = pas de validation)
jest.mock('../../src/validators/product.validator', () => ({
  listQuery: [],
  idParam: [],
  slugParam: [],
  create: [],
  update: [],
  updateStock: []
}));

// Mock du validate middleware
jest.mock('../../src/middlewares/validate.middleware', () => (req, res, next) => next());

// =============================================
// IMPORTS - Après les mocks
// =============================================
const productRoutes = require('../../src/routes/product.routes');

// ErrorHandler simplifié pour les tests
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
  app.use('/api/products', productRoutes);
  app.use(testErrorHandler);
  return app;
};

// =============================================
// TESTS
// =============================================
describe('Product Routes - Integration Tests', () => {
  let app;

  // Données de test
  const validProduct = {
    id: '323e4567-e89b-12d3-a456-426614174000',
    categorieId: '223e4567-e89b-12d3-a456-426614174000',
    reference: 'FRL-0001',
    nom: 'Pommes Gala Bio',
    slug: 'pommes-gala-bio',
    description: 'Pommes biologiques',
    prix: 3.50,
    prixPromo: null,
    stockQuantite: 100,
    estActif: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    app = createTestApp();
  });

  // =============================================
  // GET /api/products
  // =============================================
  describe('GET /api/products', () => {
    it('devrait retourner la liste des produits (200)', async () => {
      // Arrange - Le controller attend { products, pagination }
      mockProductService.getProducts.mockResolvedValue({
        products: [validProduct],
        pagination: { page: 1, limit: 12, total: 1, totalPages: 1 }
      });

      // Act
      const response = await request(app).get('/api/products');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination).toBeDefined();
    });

    it('devrait supporter la pagination', async () => {
      // Arrange
      mockProductService.getProducts.mockResolvedValue({
        products: [],
        pagination: { page: 2, limit: 10, total: 25, totalPages: 3 }
      });

      // Act
      const response = await request(app)
        .get('/api/products')
        .query({ page: 2, limit: 10 });

      // Assert
      expect(response.status).toBe(200);
      expect(mockProductService.getProducts).toHaveBeenCalled();
    });

    it('devrait filtrer par catégorie', async () => {
      // Arrange
      mockProductService.getProducts.mockResolvedValue({
        products: [validProduct],
        pagination: { page: 1, limit: 12, total: 1, totalPages: 1 }
      });

      // Act
      const response = await request(app)
        .get('/api/products')
        .query({ categorieId: '223e4567-e89b-12d3-a456-426614174000' });

      // Assert
      expect(response.status).toBe(200);
    });

    it('devrait filtrer par recherche textuelle', async () => {
      // Arrange
      mockProductService.getProducts.mockResolvedValue({
        products: [validProduct],
        pagination: { page: 1, limit: 12, total: 1, totalPages: 1 }
      });

      // Act
      const response = await request(app)
        .get('/api/products')
        .query({ search: 'pommes' });

      // Assert
      expect(response.status).toBe(200);
    });
  });

  // =============================================
  // GET /api/products/:id
  // =============================================
  describe('GET /api/products/:id', () => {
    it('devrait retourner un produit par ID (200)', async () => {
      // Arrange
      mockProductService.getProductById.mockResolvedValue(validProduct);

      // Act
      const response = await request(app)
        .get(`/api/products/${validProduct.id}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(validProduct.id);
    });

    it('devrait retourner 404 si le produit n\'existe pas', async () => {
      // Arrange
      mockProductService.getProductById.mockResolvedValue(null);

      // Act
      const response = await request(app)
        .get('/api/products/uuid-inexistant');

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // =============================================
  // GET /api/products/slug/:slug
  // =============================================
  describe('GET /api/products/slug/:slug', () => {
    it('devrait retourner un produit par slug (200)', async () => {
      // Arrange
      mockProductService.getProductBySlug.mockResolvedValue(validProduct);

      // Act
      const response = await request(app)
        .get('/api/products/slug/pommes-gala-bio');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.slug).toBe('pommes-gala-bio');
    });

    it('devrait retourner 404 si le slug n\'existe pas', async () => {
      // Arrange
      mockProductService.getProductBySlug.mockResolvedValue(null);

      // Act
      const response = await request(app)
        .get('/api/products/slug/slug-inexistant');

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // =============================================
  // GET /api/products/promos
  // =============================================
  describe('GET /api/products/promos', () => {
    it('devrait retourner les produits en promotion (200)', async () => {
      // Arrange
      const promoProduct = { ...validProduct, prixPromo: 2.99 };
      mockProductService.getPromos.mockResolvedValue([promoProduct]);

      // Act
      const response = await request(app).get('/api/products/promos');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data[0].prixPromo).toBe(2.99);
    });
  });

  // =============================================
  // GET /api/products/new
  // =============================================
  describe('GET /api/products/new', () => {
    it('devrait retourner les nouveaux produits (200)', async () => {
      // Arrange
      mockProductService.getNewProducts.mockResolvedValue([validProduct]);

      // Act
      const response = await request(app).get('/api/products/new');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  // =============================================
  // POST /api/products (Admin)
  // =============================================
  describe('POST /api/products', () => {
    const newProductData = {
      categorieId: '223e4567-e89b-12d3-a456-426614174000',
      reference: 'FRL-0002',
      nom: 'Oranges Bio',
      prix: 4.50,
      stockQuantite: 50
    };

    it('devrait créer un produit en tant qu\'admin (201)', async () => {
      // Arrange
      mockProductService.createProduct.mockResolvedValue({
        id: 'new-uuid',
        ...newProductData,
        slug: 'oranges-bio'
      });

      // Act
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', 'Bearer admin-token')
        .send(newProductData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.nom).toBe(newProductData.nom);
    });

    it('devrait rejeter sans authentification (401)', async () => {
      // Act
      const response = await request(app)
        .post('/api/products')
        .send(newProductData);

      // Assert
      expect(response.status).toBe(401);
    });

    it('devrait rejeter si non admin (403)', async () => {
      // Act
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', 'Bearer client-token')
        .send(newProductData);

      // Assert
      expect(response.status).toBe(403);
    });
  });

  // =============================================
  // PUT /api/products/:id (Admin)
  // =============================================
  describe('PUT /api/products/:id', () => {
    const updateData = { nom: 'Pommes Gala Premium', prix: 4.00 };

    it('devrait mettre à jour un produit en tant qu\'admin (200)', async () => {
      // Arrange
      mockProductService.updateProduct.mockResolvedValue({
        ...validProduct,
        ...updateData
      });

      // Act
      const response = await request(app)
        .put(`/api/products/${validProduct.id}`)
        .set('Authorization', 'Bearer admin-token')
        .send(updateData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.nom).toBe(updateData.nom);
    });

    it('devrait retourner 404 si le produit n\'existe pas', async () => {
      // Arrange
      mockProductService.updateProduct.mockResolvedValue(null);

      // Act
      const response = await request(app)
        .put('/api/products/uuid-inexistant')
        .set('Authorization', 'Bearer admin-token')
        .send(updateData);

      // Assert
      expect(response.status).toBe(404);
    });

    it('devrait rejeter sans droits admin (403)', async () => {
      // Act
      const response = await request(app)
        .put(`/api/products/${validProduct.id}`)
        .set('Authorization', 'Bearer client-token')
        .send(updateData);

      // Assert
      expect(response.status).toBe(403);
    });
  });

  // =============================================
  // DELETE /api/products/:id (Admin)
  // =============================================
  describe('DELETE /api/products/:id', () => {
    it('devrait désactiver un produit en tant qu\'admin (200)', async () => {
      // Arrange
      mockProductService.deleteProduct.mockResolvedValue({ ...validProduct, estActif: false });

      // Act
      const response = await request(app)
        .delete(`/api/products/${validProduct.id}`)
        .set('Authorization', 'Bearer admin-token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('devrait retourner 404 si le produit n\'existe pas', async () => {
      // Arrange
      mockProductService.deleteProduct.mockResolvedValue(null);

      // Act
      const response = await request(app)
        .delete('/api/products/uuid-inexistant')
        .set('Authorization', 'Bearer admin-token');

      // Assert
      expect(response.status).toBe(404);
    });

    it('devrait rejeter sans droits admin (403)', async () => {
      // Act
      const response = await request(app)
        .delete(`/api/products/${validProduct.id}`)
        .set('Authorization', 'Bearer client-token');

      // Assert
      expect(response.status).toBe(403);
    });
  });

  // =============================================
  // PATCH /api/products/:id/stock (Admin)
  // =============================================
  describe('PATCH /api/products/:id/stock', () => {
    it('devrait mettre à jour le stock (200)', async () => {
      // Arrange
      mockProductService.updateStock.mockResolvedValue({ ...validProduct, stockQuantite: 50 });

      // Act
      const response = await request(app)
        .patch(`/api/products/${validProduct.id}/stock`)
        .set('Authorization', 'Bearer admin-token')
        .send({ quantite: 50, operation: 'set' });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('devrait supporter les opérations add/subtract', async () => {
      // Arrange
      mockProductService.updateStock.mockResolvedValue({ ...validProduct, stockQuantite: 110 });

      // Act
      const response = await request(app)
        .patch(`/api/products/${validProduct.id}/stock`)
        .set('Authorization', 'Bearer admin-token')
        .send({ quantite: 10, operation: 'add' });

      // Assert
      expect(response.status).toBe(200);
    });
  });

  // =============================================
  // Gestion des erreurs
  // =============================================
  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs serveur (500)', async () => {
      // Arrange
      mockProductService.getProducts.mockRejectedValue(new Error('Erreur base de données'));

      // Act
      const response = await request(app).get('/api/products');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('devrait gérer les références en doublon (409)', async () => {
      // Arrange
      const error = new Error('Cette référence existe déjà');
      mockProductService.createProduct.mockRejectedValue(error);

      // Act
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', 'Bearer admin-token')
        .send({
          categorieId: '223e4567-e89b-12d3-a456-426614174000',
          reference: 'FRL-0001',
          nom: 'Produit Doublon',
          prix: 5.00
        });

      // Assert
      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });
});
