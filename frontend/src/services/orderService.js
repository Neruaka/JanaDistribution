/**
 * Service Commandes
 * @description Gestion des appels API pour les commandes
 */

import api from './api';

// ==========================================
// CONSTANTES (fallback si settings non disponibles)
// ==========================================

const DEFAULT_FRAIS_LIVRAISON = 15.00; // Fallback uniquement

export const MODES_PAIEMENT = [
  { id: 'ESPECES', label: 'Espèces', description: 'Paiement en espèces à la livraison' },
  { id: 'CARTE', label: 'Carte bancaire', description: 'Paiement par CB à la livraison' },
  { id: 'VIREMENT', label: 'Virement bancaire', description: 'Virement avant livraison' },
  { id: 'CHEQUE', label: 'Chèque', description: 'Chèque à la livraison' }
];

export const STATUTS_COMMANDE = {
  EN_ATTENTE: { label: 'En attente', color: 'yellow', description: 'Commande en attente de confirmation' },
  CONFIRMEE: { label: 'Confirmée', color: 'blue', description: 'Commande confirmée par notre équipe' },
  EN_PREPARATION: { label: 'En préparation', color: 'purple', description: 'Commande en cours de préparation' },
  EXPEDIEE: { label: 'Expédiée', color: 'indigo', description: 'Commande en cours de livraison' },
  LIVREE: { label: 'Livrée', color: 'green', description: 'Commande livrée' },
  ANNULEE: { label: 'Annulée', color: 'red', description: 'Commande annulée' }
};

// ==========================================
// FONCTIONS UTILITAIRES
// ==========================================

/**
 * Retourne les frais de livraison par défaut (fallback)
 * Note: Préférer utiliser useSettings().livraison.frais dans les composants
 */
export const getFraisLivraison = () => DEFAULT_FRAIS_LIVRAISON;

/**
 * Retourne les infos d'un statut
 */
export const getStatutInfo = (statut) => {
  return STATUTS_COMMANDE[statut] || { label: statut, color: 'gray', description: '' };
};

/**
 * Vérifie si une commande peut être annulée
 */
export const canCancelOrder = (statut) => {
  return statut === 'EN_ATTENTE';
};

// ==========================================
// API COMMANDES CLIENT
// ==========================================

/**
 * Créer une commande depuis le panier
 * @param {Object} orderData - Données de la commande
 * @param {number} fraisLivraison - Frais de livraison (depuis settings)
 * @returns {Promise<Object>} Commande créée
 */
export const createOrder = async (orderData, fraisLivraison = DEFAULT_FRAIS_LIVRAISON) => {
  // Construire l'adresse de livraison
  const adresseLivraison = {
    nom: orderData.nom,
    prenom: orderData.prenom,
    entreprise: orderData.entreprise || null,
    adresse: orderData.adresse,
    complement: orderData.complement || null,
    codePostal: orderData.codePostal,
    ville: orderData.ville,
    telephone: orderData.telephone
  };

  // ✅ Construire l'adresse de facturation
  // Si adresseFacturation est renseignée, utiliser les champs de facturation
  // Sinon, utiliser l'adresse de livraison
  let adresseFacturation = null;
  
  if (orderData.adresseFacturation && orderData.codePostalFacturation && orderData.villeFacturation) {
    // Adresse de facturation différente
    adresseFacturation = {
      nom: orderData.nom,
      prenom: orderData.prenom,
      entreprise: orderData.entreprise || null,
      adresse: orderData.adresseFacturation,
      complement: orderData.complementFacturation || null,
      codePostal: orderData.codePostalFacturation,
      ville: orderData.villeFacturation,
      telephone: orderData.telephone
    };
  } else {
    // Même adresse que la livraison
    adresseFacturation = { ...adresseLivraison };
  }

  const response = await api.post('/orders', {
    adresseLivraison,
    adresseFacturation,
    modePaiement: orderData.modePaiement,
    fraisLivraison, // ✅ Utilise le paramètre au lieu de la constante
    instructionsLivraison: orderData.instructions || null
  });
  return response.data;
};

/**
 * Récupérer les commandes de l'utilisateur connecté
 * @param {Object} options - Options de pagination et filtres
 * @returns {Promise<Object>} Liste paginée des commandes
 */
export const getUserOrders = async (options = {}) => {
  const params = new URLSearchParams();
  
  if (options.page) params.append('page', options.page);
  if (options.limit) params.append('limit', options.limit);
  if (options.statut) params.append('statut', options.statut);
  if (options.orderBy) params.append('orderBy', options.orderBy);
  if (options.orderDir) params.append('orderDir', options.orderDir);

  const response = await api.get(`/orders?${params.toString()}`);
  return response.data;
};

/**
 * Récupérer une commande par son ID
 * @param {string} orderId - ID de la commande
 * @returns {Promise<Object>} Détails de la commande
 */
export const getOrderById = async (orderId) => {
  const response = await api.get(`/orders/${orderId}`);
  return response.data;
};

/**
 * Récupérer une commande par son numéro
 * @param {string} numero - Numéro de la commande (CMD-YYYYMMDD-XXXX)
 * @returns {Promise<Object>} Détails de la commande
 */
export const getOrderByNumero = async (numero) => {
  const response = await api.get(`/orders/numero/${numero}`);
  return response.data;
};

/**
 * Annuler une commande
 * @param {string} orderId - ID de la commande
 * @returns {Promise<Object>} Commande mise à jour
 */
export const cancelOrder = async (orderId) => {
  const response = await api.post(`/orders/${orderId}/cancel`);
  return response.data;
};

// ==========================================
// API ADMIN COMMANDES
// ==========================================

/**
 * [ADMIN] Récupérer toutes les commandes
 * @param {Object} options - Options de pagination et filtres
 * @returns {Promise<Object>} Liste paginée des commandes
 */
export const getAllOrders = async (options = {}) => {
  const params = new URLSearchParams();
  
  if (options.page) params.append('page', options.page);
  if (options.limit) params.append('limit', options.limit);
  if (options.statut) params.append('statut', options.statut);
  if (options.userId) params.append('userId', options.userId);
  if (options.dateDebut) params.append('dateDebut', options.dateDebut);
  if (options.dateFin) params.append('dateFin', options.dateFin);
  if (options.orderBy) params.append('orderBy', options.orderBy);
  if (options.orderDir) params.append('orderDir', options.orderDir);

  const response = await api.get(`/admin/orders?${params.toString()}`);
  return response.data;
};

/**
 * [ADMIN] Mettre à jour le statut d'une commande
 * @param {string} orderId - ID de la commande
 * @param {string} statut - Nouveau statut
 * @param {string} instructions - Instructions optionnelles
 * @returns {Promise<Object>} Commande mise à jour
 */
export const updateOrderStatus = async (orderId, statut, instructions = null) => {
  const response = await api.patch(`/admin/orders/${orderId}/status`, {
    statut,
    instructions
  });
  return response.data;
};

/**
 * [ADMIN] Récupérer les statistiques des commandes
 * @param {string} dateDebut - Date de début (ISO)
 * @param {string} dateFin - Date de fin (ISO)
 * @returns {Promise<Object>} Statistiques
 */
export const getOrderStats = async (dateDebut = null, dateFin = null) => {
  const params = new URLSearchParams();
  if (dateDebut) params.append('dateDebut', dateDebut);
  if (dateFin) params.append('dateFin', dateFin);

  const response = await api.get(`/admin/orders/stats?${params.toString()}`);
  return response.data;
};

// ==========================================
// EXPORT PAR DÉFAUT
// ==========================================

export default {
  // Constantes
  DEFAULT_FRAIS_LIVRAISON,
  MODES_PAIEMENT,
  STATUTS_COMMANDE,
  
  // Utilitaires
  getFraisLivraison,
  getStatutInfo,
  canCancelOrder,
  
  // API Client
  createOrder,
  getUserOrders,
  getOrderById,
  getOrderByNumero,
  cancelOrder,
  
  // API Admin
  getAllOrders,
  updateOrderStatus,
  getOrderStats
};