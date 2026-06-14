/**
 * Service Shipping (frais de livraison)
 *
 * Estime côté serveur les frais de livraison pour une adresse donnée
 * (distance Haversine + franco de port). La source de vérité reste le
 * backend lors de la création de la commande.
 */

import api from './api';

/**
 * Estime les frais de livraison pour une adresse.
 *
 * @param {Object} params
 * @param {number} params.montant - Montant TTC de la commande
 * @param {string} params.adresse
 * @param {string} params.codePostal
 * @param {string} params.ville
 * @returns {Promise<{mode, frais, distanceKm?, distanceMaxKm?, horsZone?, francoAtteint, seuilFranco, geocodageEchoue?}>}
 */
export const estimateShipping = async ({ montant, adresse, codePostal, ville }) => {
  const response = await api.post('/settings/shipping/estimate', {
    montant,
    adresse,
    codePostal,
    ville
  });
  return response.data.data;
};

export default { estimateShipping };
