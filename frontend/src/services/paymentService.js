/**
 * Service Paiement (Stripe)
 * @description Appels API pour la création de sessions Stripe Checkout
 *              et la vérification du statut de paiement après retour.
 */

import api from './api';

/**
 * Créer une Stripe Checkout Session pour une commande CARTE.
 * Renvoie l'URL de redirection Stripe.
 *
 * @param {string} orderId
 * @returns {Promise<{ url: string, sessionId: string }>}
 */
export const createCheckoutSession = async (orderId) => {
  const response = await api.post('/payment/checkout-session', { orderId });
  return response.data.data;
};

/**
 * Récupérer le statut courant d'une commande à partir du sessionId Stripe.
 * Utilisé par la page de retour (success) pour polling si le webhook
 * n'a pas encore été traité.
 *
 * @param {string} sessionId
 * @returns {Promise<{ orderId, numeroCommande, statut, paiementStatut, payeLe }>}
 */
export const getSessionStatus = async (sessionId) => {
  const response = await api.get(`/payment/session/${sessionId}`);
  return response.data.data;
};

/**
 * [ADMIN] Mettre à jour manuellement le statut de paiement
 * (virement / chèque / espèces). Refusé côté backend pour CARTE.
 *
 * @param {string} orderId
 * @param {'PENDING'|'AUTHORIZED'|'PAID'|'FAILED'|'REFUNDED'} paiementStatut
 */
export const adminUpdatePaymentStatus = async (orderId, paiementStatut) => {
  const response = await api.patch(`/admin/orders/${orderId}/payment-status`, {
    paiementStatut
  });
  return response.data;
};

export default {
  createCheckoutSession,
  getSessionStatus,
  adminUpdatePaymentStatus
};
