/**
 * Configuration Jest pour Jana Distribution Backend
 * @description Configuration des tests unitaires et d'intégration
 */

module.exports = {
  // Environnement de test
  testEnvironment: 'node',

  // Dossiers de tests
  roots: ['<rootDir>/tests'],

  // Pattern des fichiers de test
  testMatch: [
    '**/*.test.js',
    '**/*.spec.js'
  ],

  // Fichiers à ignorer
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],

  // Setup avant tous les tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Couverture de code
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Fichiers à inclure dans la couverture
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/config/**',
    '!src/scripts/**'
  ],

  // PAS DE SEUILS STRICTS - pour le développement
  // Les seuils peuvent être activés en production
  // coverageThreshold: {
  //   global: {
  //     branches: 50,
  //     functions: 50,
  //     lines: 50,
  //     statements: 50
  //   }
  // },

  // Timeout des tests (10 secondes)
  testTimeout: 10000,

  // Affichage verbose
  verbose: true,

  // Force exit après les tests
  forceExit: true,

  // Détection des handles ouverts
  detectOpenHandles: true,

  // Clear mocks entre les tests
  clearMocks: true,

  // Restore mocks après chaque test
  restoreMocks: true
};
