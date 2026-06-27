/**
 * Payment Service - Stripe
 * @description Création de sessions Stripe Checkout et traitement des webhooks.
 *
 * Flux :
 *  1. Client finalise son checkout avec modePaiement=CARTE → `orderService.createFromCart`
 *     crée une commande EN_ATTENTE / paiement_statut=PENDING.
 *  2. Frontend appelle `POST /api/payment/checkout-session` → on crée une Stripe Checkout
 *     Session, on stocke son id sur la commande, on renvoie l'URL Stripe.
 *  3. Utilisateur paie sur Stripe → Stripe appelle `POST /api/webhooks/stripe`.
 *  4. Handler webhook vérifie signature + idempotency, puis met à jour la commande.
 */

const { getStripe, getWebhookSecret } = require('../config/stripe');
const orderRepository = require('../repositories/order.repository');
const auditRepository = require('../repositories/audit.repository');
const logger = require('../config/logger');
const { ApiError } = require('../middlewares/errorHandler');
const { query } = require('../config/database');

class PaymentService {

  /**
   * Crée une Stripe Checkout Session pour une commande existante.
   * La commande doit appartenir à l'utilisateur appelant et être en statut payable.
   *
   * @param {string} orderId - UUID de la commande
   * @param {string} userId  - UUID de l'utilisateur (vérification ownership)
   * @returns {Promise<{url: string, sessionId: string}>}
   */
  async createCheckoutSession(orderId, userId) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw ApiError.notFound('Commande introuvable');
    if (order.utilisateurId !== userId) throw ApiError.forbidden('Accès refusé à cette commande');

    if (order.modePaiement !== 'CARTE') {
      throw ApiError.badRequest(
        'Cette commande n\'est pas réglée par carte bancaire. Aucun paiement en ligne à initier.'
      );
    }

    if (order.paiementStatut === 'PAID') {
      throw ApiError.badRequest('Cette commande est déjà payée');
    }
    if (order.statut === 'ANNULEE') {
      throw ApiError.badRequest('Impossible de payer une commande annulée');
    }

    const stripe = getStripe();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const successUrl = `${frontendUrl}/paiement/succes?session_id={CHECKOUT_SESSION_ID}&orderId=${order.id}`;
    const cancelUrl  = `${frontendUrl}/paiement/annule?orderId=${order.id}`;

    // Construction des line items depuis la commande (sécurisé : on re-crée depuis la DB)
    const lineItems = (order.lignes || []).map(l => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: l.produit?.nom || l.nomProduit || 'Produit',
          metadata: { produit_id: l.produitId || '' }
        },
        // Stripe attend les montants en centimes entiers, TTC
        unit_amount: Math.round(Number(l.totalTtc) * 100 / Number(l.quantite))
      },
      quantity: l.quantite
    }));

    if (Number(order.fraisLivraison) > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: { name: 'Frais de livraison' },
          unit_amount: Math.round(Number(order.fraisLivraison) * 100)
        },
        quantity: 1
      });
    }

    // Idempotency-Key : si l'utilisateur relance le checkout, on évite de créer 2 sessions
    // pour la même commande. Stripe renverra la session existante.
    const idempotencyKey = `order_${order.id}_v1`;

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: lineItems,
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: order.utilisateur?.email,
        client_reference_id: order.id,
        metadata: {
          orderId: order.id,
          numeroCommande: order.numeroCommande,
          utilisateurId: order.utilisateurId
        },
        payment_intent_data: {
          metadata: {
            orderId: order.id,
            numeroCommande: order.numeroCommande,
            utilisateurId: order.utilisateurId
          }
        }
      },
      { idempotencyKey }
    );

    await orderRepository.attachStripeSession(order.id, session.id);

    logger.info('Stripe Checkout Session créée', {
      orderId: order.id,
      sessionId: session.id,
      numeroCommande: order.numeroCommande
    });

    return { url: session.url, sessionId: session.id };
  }

  /**
   * Vérifie la signature d'un webhook Stripe et retourne l'événement parsé.
   * À appeler avec le *raw body* (Buffer), pas le JSON parsé.
   *
   * @param {Buffer} rawBody
   * @param {string} signature - header `stripe-signature`
   * @returns {Stripe.Event}
   */
  verifyWebhookSignature(rawBody, signature) {
    const stripe = getStripe();
    const secret = getWebhookSecret();
    try {
      return stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch (err) {
      logger.warn('Signature webhook Stripe invalide', { error: err.message });
      throw ApiError.badRequest('Signature webhook invalide');
    }
  }

  /**
   * Traite un événement Stripe déjà vérifié.
   * Idempotent : un même event.id ne sera traité qu'une seule fois.
   *
   * @param {Stripe.Event} event
   */
  async handleWebhookEvent(event) {
    // 1. Idempotency : INSERT ON CONFLICT DO NOTHING. Si 0 ligne insérée, l'event a déjà été
    // traité et on sort. Sinon on continue le routing métier.
    // On ne stocke que l'identifiant, le type et la date de traitement.
    // Le payload complet n'est pas conservé (données sensibles inutiles pour l'idempotency).
    const insertResult = await query(
      `INSERT INTO stripe_event (event_id, type)
       VALUES ($1, $2)
       ON CONFLICT (event_id) DO NOTHING`,
      [event.id, event.type]
    );

    if (insertResult.rowCount === 0) {
      logger.info('Webhook Stripe déjà traité (idempotent)', {
        eventId: event.id, type: event.type
      });
      return;
    }

    // 2. Routing métier
    switch (event.type) {
    case 'checkout.session.completed':
      await this._onCheckoutCompleted(event.data.object);
      break;

    case 'checkout.session.expired':
      await this._onCheckoutExpired(event.data.object);
      break;

    case 'payment_intent.payment_failed':
      await this._onPaymentFailed(event.data.object);
      break;

    case 'refund.created':
      await this._onRefundCreated(event.data.object);
      break;

    default:
      logger.info('Événement Stripe ignoré', { type: event.type, eventId: event.id });
    }
  }

  // --------------------------------------------------
  // Handlers internes
  // --------------------------------------------------

  async _onCheckoutCompleted(session) {
    const orderId = session.metadata?.orderId || session.client_reference_id;
    if (!orderId) {
      logger.error('checkout.session.completed sans orderId', { sessionId: session.id });
      return;
    }

    // Vérifier que le paiement est effectivement acquitté
    if (session.payment_status !== 'paid') {
      logger.warn('checkout.session.completed avec payment_status non "paid"', {
        sessionId: session.id, payment_status: session.payment_status
      });
      return;
    }

    await orderRepository.markPaid(orderId, {
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent
    });

    logger.info('Commande marquée PAID suite au webhook', {
      orderId, sessionId: session.id
    });

    // Déclencher la transition EN_ATTENTE → CONFIRMEE si applicable
    try {
      const orderService = require('./order.service');
      const order = await orderRepository.findById(orderId);
      if (order && order.statut === 'EN_ATTENTE') {
        await orderService.updateStatus(orderId, 'CONFIRMEE');
      }
    } catch (err) {
      logger.error('Erreur transition auto EN_ATTENTE→CONFIRMEE', {
        error: err.message, orderId
      });
    }
  }

  async _onCheckoutExpired(session) {
    const orderId = session.metadata?.orderId || session.client_reference_id;
    if (!orderId) return;

    await orderRepository.updatePaymentStatus(orderId, 'FAILED');
    logger.info('Checkout Session expirée → paiement_statut=FAILED', {
      orderId, sessionId: session.id
    });
  }

  async _onPaymentFailed(paymentIntent) {
    const orderId = paymentIntent.metadata?.orderId;
    if (!orderId) return;

    await orderRepository.updatePaymentStatus(orderId, 'FAILED');
    logger.info('PaymentIntent failed → paiement_statut=FAILED', {
      orderId, paymentIntentId: paymentIntent.id
    });
  }

  async _onRefundCreated(refund) {
    const paymentIntentId = refund.payment_intent;
    if (!paymentIntentId) {
      logger.warn('refund.created sans payment_intent', { refundId: refund.id });
      return;
    }

    const row = await query(
      `SELECT id, total_ttc FROM commande WHERE stripe_payment_intent_id = $1 LIMIT 1`,
      [paymentIntentId]
    );
    if (!row.rows.length) {
      logger.warn('Refund reçu pour un PaymentIntent inconnu', { paymentIntentId, refundId: refund.id });
      return;
    }

    const orderId = row.rows[0].id;
    const totalTtcCents = Math.round(parseFloat(row.rows[0].total_ttc) * 100);
    const montantRembourse = refund.amount / 100;
    const isTotal = refund.amount >= totalTtcCents;
    const nouveauStatut = isTotal ? 'REMBOURSE' : 'PARTIELLEMENT_REMBOURSE';

    await orderRepository.updateRefund(orderId, {
      stripeRefundId: refund.id,
      montantRembourse,
      nouveauStatut
    });

    if (isTotal) {
      await orderRepository.updatePaymentStatus(orderId, 'REFUNDED');
    }

    auditRepository.log({
      action: 'REFUND_WEBHOOK',
      entiteType: 'commande',
      entiteId: orderId,
      details: { refundId: refund.id, montantRembourse, total: isTotal }
    }).catch(err => logger.warn('Audit refund webhook non logué:', err.message));

    logger.info(`Commande ${nouveauStatut}`, { orderId, refundId: refund.id, montantRembourse });
  }
}

module.exports = new PaymentService();
