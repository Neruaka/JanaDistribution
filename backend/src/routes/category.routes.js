/**
 * Routes Catégories
 * @description CRUD complet pour les catégories
 */

const express = require('express');
const router = express.Router();

const categoryController = require('../controllers/category.controller');
const categoryValidators = require('../validators/category.validator');
const validate = require('../middlewares/validate.middleware');
const { authenticate, isAdmin } = require('../middlewares/auth.middleware');

// ==========================================
// ROUTES PUBLIQUES
// ==========================================

/**
 * @route   GET /api/categories
 * @desc    Liste de toutes les catégories actives
 * @access  Public
 */
router.get('/',
  categoryController.getAll
);

/**
 * @route   GET /api/categories/slug/:slug
 * @desc    Détail d'une catégorie par slug
 * @access  Public
 */
router.get('/slug/:slug',
  categoryValidators.slugParam,
  validate,
  categoryController.getBySlug
);

/**
 * @route   GET /api/categories/:id
 * @desc    Détail d'une catégorie par ID
 * @access  Public
 */
router.get('/:id',
  categoryValidators.idParam,
  validate,
  categoryController.getById
);

// ==========================================
// ROUTES ADMIN
// ==========================================

/**
 * @route   POST /api/categories
 * @desc    Créer une nouvelle catégorie
 * @access  Admin
 */
router.post('/',
  authenticate,
  isAdmin,
  categoryValidators.create,
  validate,
  categoryController.create
);

/**
 * @route   PUT /api/categories/reorder
 * @desc    Réorganiser l'ordre des catégories
 * @access  Admin
 */
router.put('/reorder',
  authenticate,
  isAdmin,
  categoryValidators.reorder,
  validate,
  categoryController.reorder
);

/**
 * @route   PUT /api/categories/:id
 * @desc    Mettre à jour une catégorie
 * @access  Admin
 */
router.put('/:id',
  authenticate,
  isAdmin,
  categoryValidators.update,
  validate,
  categoryController.update
);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Supprimer une catégorie
 * @access  Admin
 */
router.delete('/:id',
  authenticate,
  isAdmin,
  categoryValidators.idParam,
  validate,
  categoryController.delete
);

module.exports = router;
