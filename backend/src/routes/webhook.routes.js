/**
 * Webhook Routes - Stripe
 * @description Reçoit les événements Stripe signés.
 *
 * ⚠️ IMPORTANT : cette route DOIT être montée dans index.js AVANT
 *    `app.use(express.json())`, car la vérification de signature Stripe
 *    exige le *body brut* (Buffer) non parsé. Ici on applique `express.raw`
 *    directement au niveau du handler pour ce seul endpoint.
 */

const express = require('express');
const router = express.Router();

const paymentService = require('../services/payment.service');
const logger = require('../config/logger');

/**
 * POST /api/webhooks/stripe
 * @access Public (vérifié par signature)
 */
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      logger.warn('Webhook Stripe reçu sans en-tête stripe-signature');
      return res.status(400).json({ received: false, message: 'Signature manquante' });
    }

    let event;
    try {
      event = paymentService.verifyWebhookSignature(req.body, signature);
    } catch (err) {
      // verifyWebhookSignature lève une ApiError 400 avec message générique
      return res.status(400).json({ received: false, message: err.message });
    }

    try {
      await paymentService.handleWebhookEvent(event);
      return res.json({ received: true });
    } catch (err) {
      // On log l'erreur mais on renvoie 500 pour que Stripe retente la livraison.
      logger.error('Erreur traitement webhook Stripe', {
        eventId: event.id, type: event.type, error: err.message, stack: err.stack
      });
      return res.status(500).json({ received: false });
    }
  }
);

module.exports = router;
