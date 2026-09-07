/**
 * Admin Service - VERSION CORRIGÉE
 * @description Appels API pour l'administration
 * @location frontend/src/services/adminService.js
 * 
 * ✅ FIX: Ajout du paramètre search dans getOrders()
 */

import api from './api';

const adminService = {
  // ==========================================
  // STATS DASHBOARD
  // ==========================================
  
  /**
   * Récupérer les stats du dashboard
   * @param {string} dateDebut - Date de début (ISO)
   * @param {string} dateFin - Date de fin (ISO)
   */
  async getDashboardStats(dateDebut = null, dateFin = null) {
    const params = new URLSearchParams();
    if (dateDebut) params.append('dateDebut', dateDebut);
    if (dateFin) params.append('dateFin', dateFin);
    
    const response = await api.get(`/admin/stats/dashboard?${params}`);
    return response.data.data;
  },
  
  /**
   * Récupérer l'évolution du CA
   * @param {string} dateDebut - Date de début (ISO)
   * @param {string} dateFin - Date de fin (ISO)
   * @param {string} groupBy - 'day' | 'week' | 'month'
   */
  async getEvolution(dateDebut = null, dateFin = null, groupBy = 'day') {
    const params = new URLSearchParams();
    if (dateDebut) params.append('dateDebut', dateDebut);
    if (dateFin) params.append('dateFin', dateFin);
    params.append('groupBy', groupBy);
    
    const response = await api.get(`/admin/stats/evolution?${params}`);
    return response.data.data;
  },
  
  /**
   * Récupérer le top des catégories
   * @param {string} dateDebut - Date de début (ISO)
   * @param {string} dateFin - Date de fin (ISO)
   * @param {number} limit - Nombre de catégories
   */
  async getTopCategories(dateDebut = null, dateFin = null, limit = 5) {
    const params = new URLSearchParams();
    if (dateDebut) params.append('dateDebut', dateDebut);
    if (dateFin) params.append('dateFin', dateFin);
    params.append('limit', limit);
    
    const response = await api.get(`/admin/stats/top-categories?${params}`);
    return response.data.data;
  },
  
  /**
   * Récupérer le top des produits vendus
   * @param {string} dateDebut - Date de début (ISO)
   * @param {string} dateFin - Date de fin (ISO)
   * @param {number} limit - Nombre de produits
   */
  async getTopProducts(dateDebut = null, dateFin = null, limit = 5) {
    const params = new URLSearchParams();
    if (dateDebut) params.append('dateDebut', dateDebut);
    if (dateFin) params.append('dateFin', dateFin);
    params.append('limit', limit);
    
    const response = await api.get(`/admin/stats/top-products?${params}`);
    return response.data.data;
  },
  
  /**
   * Récupérer les commandes récentes
   * @param {number} limit - Nombre de commandes
   */
  async getRecentOrders(limit = 5) {
    const response = await api.get(`/admin/stats/recent-orders?limit=${limit}`);
    return response.data.data;
  },
  
  /**
   * Récupérer les produits avec stock faible
   * @param {number} limit - Nombre de produits
   */
  async getLowStockProducts(limit = 10) {
    const response = await api.get(`/admin/stats/low-stock?limit=${limit}`);
    return response.data.data;
  },

  /**
   * Récupérer les stats comparées à la période précédente (deltas réels)
   * @param {string} dateDebut - Date de début (ISO)
   * @param {string} dateFin - Date de fin (ISO)
   */
  async getComparison(dateDebut = null, dateFin = null) {
    const params = new URLSearchParams();
    if (dateDebut) params.append('dateDebut', dateDebut);
    if (dateFin) params.append('dateFin', dateFin);

    const response = await api.get(`/admin/stats/comparison?${params}`);
    return response.data.data;
  },

  // ==========================================
  // CLIENTS
  // ==========================================
  
  /**
   * Récupérer la liste des clients
   * @param {Object} params - Paramètres de recherche
   */
  async getClients(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.typeClient) queryParams.append('typeClient', params.typeClient);
    if (params.estActif !== undefined) queryParams.append('estActif', params.estActif);
    if (params.search) queryParams.append('search', params.search);
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.orderDir) queryParams.append('orderDir', params.orderDir);
    
    const response = await api.get(`/admin/clients?${queryParams}`);
    return response.data;
  },
  
  /**
   * Récupérer un client par ID
   * @param {string} id - UUID du client
   */
  async getClientById(id) {
    const response = await api.get(`/admin/clients/${id}`);
    return response.data.data;
  },
  
  /**
   * Modifier un client
   * @param {string} id - UUID du client
   * @param {Object} data - Données à modifier
   */
  async updateClient(id, data) {
    const response = await api.patch(`/admin/clients/${id}`, data);
    return response.data;
  },
  
  /**
   * Activer/désactiver un client
   * @param {string} id - UUID du client
   */
  async toggleClientStatus(id) {
    const response = await api.patch(`/admin/clients/${id}/toggle-status`);
    return response.data;
  },

  async validerComptePro(id) {
    const response = await api.patch(`/admin/clients/${id}/valider-pro`);
    return response.data;
  },
  
  /**
   * Supprimer un client (anonymisation RGPD)
   * @param {string} id - UUID du client
   */
  async deleteClient(id) {
    const response = await api.delete(`/admin/clients/${id}`);
    return response.data;
  },
  
  /**
   * Récupérer les commandes d'un client
   * @param {string} id - UUID du client
   * @param {Object} params - Paramètres de pagination
   */
  async getClientOrders(id, params = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    const response = await api.get(`/admin/clients/${id}/orders?${queryParams}`);
    return response.data;
  },
  
  // ==========================================
  // COMMANDES ADMIN
  // ==========================================
  
  /**
   * Récupérer toutes les commandes
   * @param {Object} params - Paramètres de recherche
   * ✅ FIX: Ajout du paramètre search
   */
  async getOrders(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search); // ✅ AJOUTÉ
    if (params.statut) queryParams.append('statut', params.statut);
    if (params.dateDebut) queryParams.append('dateDebut', params.dateDebut);
    if (params.dateFin) queryParams.append('dateFin', params.dateFin);
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.orderDir) queryParams.append('orderDir', params.orderDir);
    
    const response = await api.get(`/admin/orders?${queryParams}`);
    return response.data;
  },
  
  /**
   * Récupérer une commande par ID
   * @param {string} id - UUID de la commande
   */
  async getOrderById(id) {
    const response = await api.get(`/admin/orders/${id}`);
    return response.data.data;
  },
  
  /**
   * Mettre à jour le statut d'une commande
   * @param {string} id - UUID de la commande
   * @param {string} statut - Nouveau statut
   */
  async updateOrderStatus(id, statut) {
    const response = await api.patch(`/admin/orders/${id}/status`, { statut });
    return response.data;
  },
  
  /**
   * Récupérer les stats des commandes
   * @param {string} dateDebut - Date de début (ISO)
   * @param {string} dateFin - Date de fin (ISO)
   */
  async getOrderStats(dateDebut = null, dateFin = null) {
    const params = new URLSearchParams();
    if (dateDebut) params.append('dateDebut', dateDebut);
    if (dateFin) params.append('dateFin', dateFin);

    const response = await api.get(`/admin/orders/stats?${params}`);
    return response.data.data;
  },

  /**
   * Récupérer l'historique des statuts d'une commande
   * @param {string} id - UUID de la commande
   */
  async getOrderHistory(id) {
    const response = await api.get(`/admin/orders/${id}/history`);
    return response.data.data || [];
  },

  /**
   * Enregistrer un remboursement manuel (ESPECES / VIREMENT / CHEQUE) depuis l'admin
   * @param {string} id - UUID de la commande
   * @param {Object} data - { montant: number, raison?: string }
   */
  async initiateRefund(id, { montant, raison }) {
    const response = await api.post(`/admin/orders/${id}/refund`, { montant, raison });
    return response.data;
  },

  async getFactureByCommande(commandeId) {
    const response = await api.get(`/invoices/admin?commande_id=${commandeId}`);
    return response.data.data;
  },

  async downloadFacturePDF(factureId, numero) {
    const response = await api.get(`/invoices/${factureId}/pdf`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${numero}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Ouvre le PDF d'une facture/devis/avoir dans un nouvel onglet (viewer natif du navigateur).
   * L'onglet est ouvert de façon synchrone (avant l'appel réseau) pour ne pas être bloqué
   * comme popup par le navigateur.
   */
  async viewFacturePDF(factureId) {
    const win = window.open('', '_blank');
    try {
      const response = await api.get(`/invoices/${factureId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      if (win) win.location.href = url;
    } catch (e) {
      if (win) win.close();
      throw e;
    }
  },

  /**
   * Liste paginée des devis/factures/avoirs (back-office).
   * @param {Object} params - { page, limit, type } — type accepte une liste séparée par des virgules
   */
  async getFactures({ page = 1, limit = 20, type } = {}) {
    const params = new URLSearchParams({ page, limit });
    if (type) params.set('type', type);
    const response = await api.get(`/invoices/admin?${params.toString()}`);
    return response.data;
  },

  // ==========================================
  // CODES PROMO
  // ==========================================

  /**
   * Récupérer la liste paginée des codes promo
   * @param {Object} params - { page, limit, actif }
   */
  async getCodesPromo(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.actif !== undefined) queryParams.append('actif', params.actif);

    const response = await api.get(`/promo/admin?${queryParams}`);
    return response.data;
  },

  /**
   * Récupérer un code promo par ID (détail + stats complètes)
   * @param {string} id - UUID du code promo
   */
  async getCodePromoById(id) {
    const response = await api.get(`/promo/admin/${id}`);
    return response.data.data;
  },

  /**
   * Créer un code promo
   * @param {Object} data
   */
  async createCodePromo(data) {
    const response = await api.post('/promo/admin', data);
    return response.data.data;
  },

  /**
   * Modifier un code promo (whitelist de champs)
   * @param {string} id - UUID du code promo
   * @param {Object} data - champs à modifier
   */
  async updateCodePromo(id, data) {
    const response = await api.patch(`/promo/admin/${id}`, data);
    return response.data.data;
  },

  /**
   * Activer / désactiver un code promo
   * @param {string} id - UUID du code promo
   */
  async toggleCodePromo(id) {
    const response = await api.patch(`/promo/admin/${id}/toggle`);
    return response.data.data;
  },

  /**
   * Supprimer un code promo (impossible si déjà utilisé)
   * @param {string} id - UUID du code promo
   */
  async deleteCodePromo(id) {
    const response = await api.delete(`/promo/admin/${id}`);
    return response.data;
  }
};

export default adminService;