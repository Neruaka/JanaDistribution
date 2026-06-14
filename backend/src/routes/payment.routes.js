/**
 * Payment Routes
 * @description Routes applicatives Stripe (création session, lecture statut).
 * Les webhooks sont dans webhook.routes.js (raw body, pas ici).
 */

const express = require('express');
const router = express.Router();

const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middlewares/auth.middleware');

/**
 * POST /api/payment/checkout-session
 * @access Private
 * Body : { orderId }
 */
router.post('/checkout-session', authenticate, paymentController.createCheckoutSession);

/**
 * GET /api/payment/session/:sessionId
 * @access Private (owner ou admin)
 */
router.get('/session/:sessionId', authenticate, paymentController.getSessionStatus);

module.exports = router;
