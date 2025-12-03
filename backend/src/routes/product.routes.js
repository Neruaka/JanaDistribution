/**
 * Routes Produits
 * @description CRUD complet pour les produits
 */

const express = require('express');
const router = express.Router();

const productController = require('../controllers/product.controller');
const productValidators = require('../validators/product.validator');
const validate = require('../middlewares/validate.middleware');
const { authenticate, isAdmin, optionalAuth } = require('../middlewares/auth.middleware');

// ==========================================
// ROUTES PUBLIQUES (ou auth optionnelle)
// ==========================================

/**
 * @route   GET /api/products
 * @desc    Liste des produits avec filtres et pagination
 * @access  Public
 */
router.get('/',
  productValidators.listQuery,
  validate,
  productController.getAll
);

/**
 * @route   GET /api/products/search
 * @desc    Recherche de produits
 * @access  Public
 */
router.get('/search',
  productController.search
);

/**
 * @route   GET /api/products/promos
 * @desc    Liste des produits en promotion
 * @access  Public
 */
router.get('/promos',
  productController.getPromos
);

/**
 * @route   GET /api/products/new
 * @desc    Liste des nouveaux produits
 * @access  Public
 */
router.get('/new',
  productController.getNew
);

/**
 * @route   GET /api/products/slug/:slug
 * @desc    Détail d'un produit par slug
 * @access  Public
 */
router.get('/slug/:slug',
  productValidators.slugParam,
  validate,
  productController.getBySlug
);

/**
 * @route   GET /api/products/:id
 * @desc    Détail d'un produit par ID
 * @access  Public
 */
router.get('/:id',
  productValidators.idParam,
  validate,
  productController.getById
);

// ==========================================
// ROUTES ADMIN (authentification + rôle admin)
// ==========================================

/**
 * @route   GET /api/products/low-stock
 * @desc    Liste des produits avec stock faible
 * @access  Admin
 */
router.get('/admin/low-stock',
  authenticate,
  isAdmin,
  productController.getLowStock
);

/**
 * @route   POST /api/products
 * @desc    Créer un nouveau produit
 * @access  Admin
 */
router.post('/',
  authenticate,
  isAdmin,
  productValidators.create,
  validate,
  productController.create
);

/**
 * @route   PUT /api/products/:id
 * @desc    Mettre à jour un produit
 * @access  Admin
 */
router.put('/:id',
  authenticate,
  isAdmin,
  productValidators.update,
  validate,
  productController.update
);

/**
 * @route   PATCH /api/products/:id/stock
 * @desc    Mettre à jour le stock d'un produit
 * @access  Admin
 */
router.patch('/:id/stock',
  authenticate,
  isAdmin,
  productValidators.updateStock,
  validate,
  productController.updateStock
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Désactiver un produit (soft delete)
 * @access  Admin
 */
router.delete('/:id',
  authenticate,
  isAdmin,
  productValidators.idParam,
  validate,
  productController.delete
);

/**
 * @route   DELETE /api/products/:id/hard
 * @desc    Supprimer définitivement un produit
 * @access  Admin
 */
router.delete('/:id/hard',
  authenticate,
  isAdmin,
  productValidators.idParam,
  validate,
  productController.hardDelete
);

module.exports = router;
