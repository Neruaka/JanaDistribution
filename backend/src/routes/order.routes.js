/**
 * Routes Commandes
 * @description CRUD complet pour les commandes
 */

const express = require('express');
const router = express.Router();

const orderController = require('../controllers/order.controller');
const orderValidators = require('../validators/order.validator');
const validate = require('../middlewares/validate.middleware');
const { authenticate, isAdmin } = require('../middlewares/auth.middleware');

// ==========================================
// TOUTES LES ROUTES NÉCESSITENT UNE AUTHENTIFICATION
// ==========================================

/**
 * @route   GET /api/orders/stats
 * @desc    Statistiques des commandes
 * @access  Admin
 */
router.get('/stats',
  authenticate,
  isAdmin,
  orderController.getStats
);

/**
 * @route   GET /api/orders/my
 * @desc    Liste des commandes de l'utilisateur connecté
 * @access  Client authentifié
 */
router.get('/my',
  authenticate,
  orderValidators.listQuery,
  validate,
  orderController.getMyOrders
);

/**
 * @route   GET /api/orders
 * @desc    Liste de toutes les commandes (admin) ou de l'utilisateur (client)
 * @access  Authentifié
 */
router.get('/',
  authenticate,
  orderValidators.listQuery,
  validate,
  orderController.getAll
);

/**
 * @route   GET /api/orders/numero/:numero
 * @desc    Détail d'une commande par numéro
 * @access  Authentifié (propriétaire ou admin)
 */
router.get('/numero/:numero',
  authenticate,
  orderValidators.numeroParam,
  validate,
  orderController.getByNumero
);

/**
 * @route   GET /api/orders/:id
 * @desc    Détail d'une commande par ID
 * @access  Authentifié (propriétaire ou admin)
 */
router.get('/:id',
  authenticate,
  orderValidators.idParam,
  validate,
  orderController.getById
);

/**
 * @route   POST /api/orders
 * @desc    Créer une nouvelle commande
 * @access  Client authentifié
 */
router.post('/',
  authenticate,
  orderValidators.create,
  validate,
  orderController.create
);

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Mettre à jour le statut d'une commande
 * @access  Admin
 */
router.patch('/:id/status',
  authenticate,
  isAdmin,
  orderValidators.updateStatus,
  validate,
  orderController.updateStatus
);

/**
 * @route   POST /api/orders/:id/cancel
 * @desc    Annuler une commande
 * @access  Authentifié (propriétaire ou admin)
 */
router.post('/:id/cancel',
  authenticate,
  orderValidators.idParam,
  validate,
  orderController.cancel
);

module.exports = router;
