/**
 * Routes Produits - VERSION COMPLÈTE
 * @description CRUD + Export/Import/Bulk operations
 * @location backend/src/routes/product.routes.js
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const productController = require('../controllers/product.controller');
const productValidators = require('../validators/product.validator');
const validate = require('../middlewares/validate.middleware');
const { authenticate, isAdmin } = require('../middlewares/auth.middleware');
const { productImageUpload, uploadToR2, verifyImageSignature } = require('../middlewares/upload.middleware');

// T13-10 : GET /search est non authentifiée et lance une requête ILIKE en
// base à chaque appel — le plafond global (300/15min, partagé par toute
// l'API) ne suffit pas à empêcher un abus de charge DB ciblé sur cette
// seule route.
const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { success: false, message: 'Trop de recherches, veuillez reessayer plus tard.' },
  standardHeaders: true,
  legacyHeaders: false
});

// T13-10 : import Excel = potentiellement des centaines d'écritures DB en
// une requête ; un admin compromis ou un script buggé ne doit pas pouvoir
// le déclencher en boucle serrée.
const importLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Trop d imports, veuillez reessayer plus tard.' },
  standardHeaders: true,
  legacyHeaders: false
});

// ==========================================
// ROUTES PUBLIQUES
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
  searchLimiter,
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

// ==========================================
// ROUTES ADMIN - DOIVENT ÊTRE AVANT /:id
// ==========================================

/**
 * @route   GET /api/products/admin/low-stock
 * @desc    Liste des produits avec stock faible
 * @access  Admin
 */
router.get('/admin/low-stock',
  authenticate,
  isAdmin,
  productController.getLowStock
);

/**
 * @route   GET /api/products/admin/export
 * @desc    Export de tous les produits pour Excel
 * @access  Admin
 */
router.get('/admin/export',
  authenticate,
  isAdmin,
  productController.exportAll
);

/**
 * @route   POST /api/products/admin/import
 * @desc    Import de produits depuis Excel
 * @access  Admin
 */
router.post('/admin/import',
  authenticate,
  isAdmin,
  importLimiter,
  productController.importProducts
);

/**
 * @route   POST /api/products/admin/bulk-delete
 * @desc    Suppression multiple de produits
 * @access  Admin
 */
router.post('/admin/bulk-delete',
  authenticate,
  isAdmin,
  productController.bulkDelete
);

/**
 * @route   POST /api/products/upload-image
 * @desc    Upload d'une image produit
 * @access  Admin
 */
router.post('/upload-image',
  authenticate,
  isAdmin,
  productImageUpload.single('image'),
  verifyImageSignature,
  uploadToR2,
  productController.uploadImage
);

/**
 * @route   DELETE /api/products/image/:filename
 * @desc    Supprime une image produit
 * @access  Admin
 */
router.delete('/image/:filename',
  authenticate,
  isAdmin,
  productValidators.filenameParam,
  validate,
  productController.deleteProductImage
);

// ==========================================
// ROUTE PARAMÉTRIQUE - DOIT ÊTRE EN DERNIER
// ==========================================

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
