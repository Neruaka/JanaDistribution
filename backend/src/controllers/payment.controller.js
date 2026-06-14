/**
 * Payment Controller - Stripe
 */

const paymentService = require('../services/payment.service');
const orderRepository = require('../repositories/order.repository');
const { ApiError } = require('../middlewares/errorHandler');
const logger = require('../config/logger');

/**
 * POST /api/payment/checkout-session
 * Body: { orderId }
 * Crée une Stripe Checkout Session et renvoie l'URL de redirection.
 */
const createCheckoutSession = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) throw ApiError.badRequest('orderId requis');

    const { url, sessionId } = await paymentService.createCheckoutSession(orderId, req.user.id);

    res.json({
      success: true,
      data: { url, sessionId }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/payment/session/:sessionId
 * Permet au front, après retour de Stripe, de re-synchroniser le statut
 * même si le webhook n'a pas encore été traité (latence réseau).
 * On se contente de renvoyer l'état courant de la commande associée.
 */
const getSessionStatus = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const order = await orderRepository.findBySessionId(sessionId);
    if (!order) throw ApiError.notFound('Aucune commande associée à cette session');

    // Ownership : seul l'acheteur (ou un admin) peut interroger sa session
    if (req.user.role !== 'ADMIN' && order.utilisateurId !== req.user.id) {
      throw ApiError.forbidden('Accès refusé');
    }

    res.json({
      success: true,
      data: {
        orderId: order.id,
        numeroCommande: order.numeroCommande,
        statut: order.statut,
        paiementStatut: order.paiementStatut,
        payeLe: order.payeLe
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/orders/:id/payment-status
 * Admin : marque manuellement un paiement PAID/FAILED/REFUNDED pour les modes
 * non-carte (virement / espèces / chèque).
 */
const adminUpdatePaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paiementStatut } = req.body;

    const VALID = ['PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'REFUNDED'];
    if (!VALID.includes(paiementStatut)) {
      throw ApiError.badRequest(`paiementStatut invalide. Valeurs: ${VALID.join(', ')}`);
    }

    const order = await orderRepository.findById(id);
    if (!order) throw ApiError.notFound('Commande introuvable');

    // Refus de forcer PAID sur un mode CARTE : ça doit venir du webhook Stripe.
    if (paiementStatut === 'PAID' && order.modePaiement === 'CARTE') {
      throw ApiError.badRequest(
        'Impossible de valider manuellement un paiement CARTE. ' +
        'La validation doit provenir du webhook Stripe.'
      );
    }

    let updated;
    if (paiementStatut === 'PAID') {
      updated = await orderRepository.markPaid(id, {});
    } else {
      updated = await orderRepository.updatePaymentStatus(id, paiementStatut);
    }

    logger.info('Paiement mis à jour manuellement par admin', {
      orderId: id,
      adminId: req.user.id,
      paiementStatut,
      modePaiement: order.modePaiement
    });

    res.json({
      success: true,
      data: updated,
      message: `Statut paiement mis à jour: ${paiementStatut}`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCheckoutSession,
  getSessionStatus,
  adminUpdatePaymentStatus
};
