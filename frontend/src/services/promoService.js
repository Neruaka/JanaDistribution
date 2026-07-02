/**
 * Service Code Promo
 * @description Appels API pour la validation des codes promo au checkout
 */

import api from './api';

/**
 * Valide un code promo pour un montant de commande donné
 * @param {string} code - Code promo saisi par le client
 * @param {number} totalCommande - Total de la commande AVANT rabais (calculé côté frontend, pour affichage uniquement — le backend recalcule et fait foi à la création de la commande)
 * @returns {Promise<Object>} Réponse API : { success, data: { code, type_rabais, valeur_rabais, montant_rabais, total_apres_rabais, message } }
 */
export const validerCodePromo = async (code, totalCommande) => {
  const response = await api.post('/promo/valider', {
    code,
    total_commande: totalCommande
  });
  return response.data;
};

export default {
  validerCodePromo
};
