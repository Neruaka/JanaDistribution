/**
 * Order Routes
 * @description Routes pour la gestion des commandes
 */

const express = require('express');
const router = express.Router();

const orderController = require('../controllers/order.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  createOrderValidation,
  updateStatusValidation,
  orderIdValidation,
  orderNumeroValidation,
  listOrdersValidation
} = require('../validators/order.validator');

// ==========================================
// ROUTES CLIENT (authentification requise)
// ==========================================

/**
 * @route   POST /api/orders
 * @desc    Créer une commande depuis le panier
 * @access  Private (Client)
 */
router.post(
  '/',
  authenticate,
  createOrderValidation,
  validate,
  orderController.createOrder
);

/**
 * @route   GET /api/orders
 * @desc    Récupérer mes commandes
 * @access  Private (Client)
 */
router.get(
  '/',
  authenticate,
  listOrdersValidation,
  validate,
  orderController.getUserOrders
);

/**
 * @route   GET /api/orders/numero/:numero
 * @desc    Récupérer une commande par numéro
 * @access  Private (Client/Admin)
 */
router.get(
  '/numero/:numero',
  authenticate,
  orderNumeroValidation,
  validate,
  orderController.getOrderByNumero
);

/**
 * @route   GET /api/orders/:id
 * @desc    Récupérer une commande par ID
 * @access  Private (Client/Admin)
 */
router.get(
  '/:id',
  authenticate,
  orderIdValidation,
  validate,
  orderController.getOrderById
);

/**
 * @route   POST /api/orders/:id/cancel
 * @desc    Annuler une commande
 * @access  Private (Client/Admin)
 */
router.post(
  '/:id/cancel',
  authenticate,
  orderIdValidation,
  validate,
  orderController.cancelOrder
);

module.exports = router;
