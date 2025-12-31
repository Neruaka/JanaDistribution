/**
 * Setup Global des Tests - Jana Distribution
 * @description Configuration et mocks partagés pour tous les tests
 */

// =============================================
// VARIABLES D'ENVIRONNEMENT DE TEST
// =============================================
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '1h';
process.env.BCRYPT_SALT_ROUNDS = '4'; // Moins de rounds pour tests plus rapides
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'jana_test';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';

// =============================================
// MOCK DU LOGGER (évite les logs pendant les tests)
// =============================================
jest.mock('../src/config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

// =============================================
// MOCK DE LA BASE DE DONNÉES
// =============================================
const mockPool = {
  query: jest.fn(),
  connect: jest.fn(() => ({
    query: jest.fn(),
    release: jest.fn()
  })),
  end: jest.fn()
};

jest.mock('../src/config/database', () => mockPool);

// =============================================
// MOCK DE REDIS
// =============================================
const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  setex: jest.fn(),
  expire: jest.fn(),
  keys: jest.fn(),
  quit: jest.fn()
};

jest.mock('../src/config/redis', () => mockRedis);

// =============================================
// DONNÉES DE TEST RÉUTILISABLES
// =============================================
global.testData = {
  // Utilisateur de test
  validUser: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    motDePasseHash: '$2b$04$test.hash.value',
    nom: 'Dupont',
    prenom: 'Jean',
    telephone: '0612345678',
    role: 'CLIENT',
    typeClient: 'PARTICULIER',
    estActif: true,
    accepteCgu: true,
    accepteNewsletter: false,
    dateCreation: new Date(),
    dateModification: new Date()
  },

  // Admin de test
  adminUser: {
    id: '123e4567-e89b-12d3-a456-426614174001',
    email: 'admin@jana-distribution.fr',
    motDePasseHash: '$2b$04$admin.hash.value',
    nom: 'Admin',
    prenom: 'Jana',
    role: 'ADMIN',
    typeClient: 'PARTICULIER',
    estActif: true,
    accepteCgu: true
  },

  // Professionnel de test
  proUser: {
    id: '123e4567-e89b-12d3-a456-426614174002',
    email: 'pro@entreprise.fr',
    motDePasseHash: '$2b$04$pro.hash.value',
    nom: 'Martin',
    prenom: 'Sophie',
    role: 'CLIENT',
    typeClient: 'PROFESSIONNEL',
    siret: '12345678901234',
    raisonSociale: 'Restaurant Le Gourmet',
    estActif: true,
    accepteCgu: true
  },

  // Catégorie de test
  validCategory: {
    id: '223e4567-e89b-12d3-a456-426614174000',
    nom: 'Fruits & Légumes',
    slug: 'fruits-legumes',
    description: 'Fruits et légumes frais de saison',
    couleur: '#22C55E',
    icone: '🥬',
    ordre: 1,
    estActif: true
  },

  // Produit de test
  validProduct: {
    id: '323e4567-e89b-12d3-a456-426614174000',
    categorieId: '223e4567-e89b-12d3-a456-426614174000',
    reference: 'FRL-0001',
    nom: 'Pommes Gala Bio',
    slug: 'pommes-gala-bio',
    description: 'Pommes Gala biologiques, croquantes et sucrées',
    prix: 3.50,
    prixPromo: null,
    tauxTva: 5.50,
    uniteMesure: 'kg',
    stockQuantite: 100,
    stockMinAlerte: 10,
    imageUrl: '/images/pommes-gala.jpg',
    labels: ['bio', 'local'],
    origine: 'France',
    estActif: true,
    estMisEnAvant: true
  },

  // Commande de test
  validOrder: {
    id: '423e4567-e89b-12d3-a456-426614174000',
    utilisateurId: '123e4567-e89b-12d3-a456-426614174000',
    numeroCommande: 'CMD-20241230-0001',
    statut: 'EN_ATTENTE',
    dateCommande: new Date(),
    totalHt: 45.50,
    totalTva: 2.50,
    totalTtc: 48.00,
    fraisLivraison: 5.00,
    adresseLivraison: {
      nom: 'Dupont',
      prenom: 'Jean',
      adresse: '123 Rue de la Paix',
      codePostal: '75001',
      ville: 'Paris'
    },
    modePaiement: 'CARTE'
  },

  // Données d'inscription valides
  validRegistration: {
    email: 'nouveau@example.com',
    motDePasse: 'SecureP@ss123',
    nom: 'Nouveau',
    prenom: 'Client',
    telephone: '0698765432',
    typeClient: 'PARTICULIER',
    accepteCgu: true,
    accepteNewsletter: false
  },

  // Données d'inscription pro valides
  validProRegistration: {
    email: 'nouveau.pro@entreprise.fr',
    motDePasse: 'SecureP@ss123',
    nom: 'Nouveau',
    prenom: 'Pro',
    telephone: '0698765432',
    typeClient: 'PROFESSIONNEL',
    siret: '98765432109876',
    raisonSociale: 'Nouvelle Entreprise SARL',
    accepteCgu: true
  },

  // Token JWT valide de test
  validToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyM2U0NTY3LWU4OWItMTJkMy1hNDU2LTQyNjYxNDE3NDAwMCIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJDTElFTlQiLCJpYXQiOjE3MDQwNjcyMDB9.test-signature'
};

// =============================================
// HELPERS DE TEST
// =============================================
global.testHelpers = {
  /**
   * Génère un UUID v4 de test
   */
  generateUUID: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  /**
   * Génère un token JWT de test
   */
  generateTestToken: (payload = {}) => {
    const jwt = require('jsonwebtoken');
    const defaultPayload = {
      id: global.testData.validUser.id,
      email: global.testData.validUser.email,
      role: global.testData.validUser.role,
      typeClient: global.testData.validUser.typeClient
    };
    return jwt.sign({ ...defaultPayload, ...payload }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });
  },

  /**
   * Génère un token admin de test
   */
  generateAdminToken: () => {
    const jwt = require('jsonwebtoken');
    return jwt.sign({
      id: global.testData.adminUser.id,
      email: global.testData.adminUser.email,
      role: 'ADMIN',
      typeClient: 'PARTICULIER'
    }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });
  },

  /**
   * Reset tous les mocks
   */
  resetMocks: () => {
    jest.clearAllMocks();
    mockPool.query.mockReset();
    mockRedis.get.mockReset();
    mockRedis.set.mockReset();
  }
};

// =============================================
// HOOKS GLOBAUX
// =============================================
beforeAll(() => {
  // Setup avant tous les tests
  console.log('🧪 Démarrage des tests Jana Distribution...');
});

afterAll(() => {
  // Cleanup après tous les tests
  console.log('✅ Tests terminés');
});

beforeEach(() => {
  // Reset les mocks avant chaque test
  global.testHelpers.resetMocks();
});

// =============================================
// EXPORTS POUR LES TESTS
// =============================================
module.exports = {
  mockPool,
  mockRedis,
  testData: global.testData,
  testHelpers: global.testHelpers
};
