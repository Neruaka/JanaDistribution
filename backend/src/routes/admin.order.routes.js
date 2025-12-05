/**
 * Admin Order Routes
 * @description Routes admin pour la gestion des commandes
 */

const express = require('express');
const router = express.Router();

const orderController = require('../controllers/order.controller');
const { authenticate, isAdmin } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  updateStatusValidation,
  orderIdValidation,
  listOrdersValidation
} = require('../validators/order.validator');

// Middleware: toutes les routes admin nécessitent auth + rôle ADMIN
router.use(authenticate);
router.use(isAdmin);

/**
 * @route   GET /api/admin/orders
 * @desc    Récupérer toutes les commandes
 * @access  Private (Admin)
 */
router.get(
  '/',
  listOrdersValidation,
  validate,
  orderController.getAllOrders
);

/**
 * @route   GET /api/admin/orders/stats
 * @desc    Récupérer les statistiques des commandes
 * @access  Private (Admin)
 */
router.get(
  '/stats',
  orderController.getOrderStats
);

/**
 * @route   PATCH /api/admin/orders/:id/status
 * @desc    Mettre à jour le statut d'une commande
 * @access  Private (Admin)
 */
router.patch(
  '/:id/status',
  updateStatusValidation,
  validate,
  orderController.updateOrderStatus
);

/**
 * @route   GET /api/admin/orders/:id
 * @desc    Récupérer une commande par ID (admin)
 * @access  Private (Admin)
 */
router.get(
  '/:id',
  orderIdValidation,
  validate,
  orderController.getOrderById
);

module.exports = router;
