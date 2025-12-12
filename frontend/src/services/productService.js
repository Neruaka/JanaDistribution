/**
 * Service Produits
 * @description Appels API pour les produits
 */

import api from './api';

const productService = {
  /**
   * RÃ©cupÃ¨re la liste des produits avec filtres et pagination
   * @param {Object} params - ParamÃ¨tres de filtrage
   * @returns {Promise} Liste des produits + pagination
   */
  getAll: async (params = {}) => {
    const {
      page = 1,
      limit = 12,
      categorieId,
      search,
      minPrice,
      maxPrice,
      enStock,
      estActif,
      orderBy = 'createdAt',
      orderDir = 'DESC',
      labels
    } = params;

    // Construction des query params
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    
    if (categorieId) queryParams.append('categorieId', categorieId);
    if (search) queryParams.append('search', search);
    if (minPrice) queryParams.append('minPrice', minPrice);
    if (maxPrice) queryParams.append('maxPrice', maxPrice);
    if (enStock !== undefined) queryParams.append('enStock', enStock);
    if (estActif !== undefined) queryParams.append('estActif', estActif);
    if (orderBy) queryParams.append('orderBy', orderBy);
    if (orderDir) queryParams.append('orderDir', orderDir);
    if (labels) queryParams.append('labels', labels);

    const response = await api.get(`/products?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * RÃ©cupÃ¨re un produit par son ID
   * @param {string} id - UUID du produit
   * @returns {Promise} DÃ©tail du produit
   */
  getById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  /**
   * RÃ©cupÃ¨re un produit par son slug
   * @param {string} slug - Slug URL du produit
   * @returns {Promise} DÃ©tail du produit
   */
  getBySlug: async (slug) => {
    const response = await api.get(`/products/slug/${slug}`);
    return response.data;
  },

  /**
   * Recherche de produits
   * @param {string} query - Terme de recherche
   * @param {number} limit - Nombre de rÃ©sultats
   * @returns {Promise} Produits correspondants
   */
  search: async (query, limit = 10) => {
    const response = await api.get(`/products/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  },

  /**
   * RÃ©cupÃ¨re les produits en promotion
   * @param {number} limit - Nombre de rÃ©sultats
   * @returns {Promise} Produits en promo
   */
  getPromos: async (limit = 12) => {
    const response = await api.get(`/products/promos?limit=${limit}`);
    return response.data;
  },

  /**
   * RÃ©cupÃ¨re les nouveaux produits
   * @param {number} days - Nombre de jours (dÃ©faut: 30)
   * @param {number} limit - Nombre de rÃ©sultats
   * @returns {Promise} Nouveaux produits
   */
  getNew: async (days = 30, limit = 12) => {
    const response = await api.get(`/products/new?days=${days}&limit=${limit}`);
    return response.data;
  },

  /**
   * RÃ©cupÃ¨re les produits d'une catÃ©gorie
   * @param {string} categorieId - UUID de la catÃ©gorie
   * @param {Object} params - ParamÃ¨tres supplÃ©mentaires
   * @returns {Promise} Produits de la catÃ©gorie
   */
  getByCategory: async (categorieId, params = {}) => {
    return productService.getAll({ ...params, categorieId });
  },

  // ==========================================
  // âœ… MÃ‰THODES ADMIN (CRUD) - AJOUTÃ‰ES !
  // ==========================================

  /**
   * CrÃ©e un nouveau produit
   * @param {Object} data - DonnÃ©es du produit
   * @returns {Promise} Produit crÃ©Ã©
   */
  create: async (data) => {
    const response = await api.post('/products', data);
    return response.data;
  },

  /**
   * Met Ã  jour un produit
   * @param {string} id - UUID du produit
   * @param {Object} data - DonnÃ©es Ã  mettre Ã  jour
   * @returns {Promise} Produit mis Ã  jour
   */
  update: async (id, data) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },

  /**
   * Supprime un produit (soft delete - dÃ©sactivation)
   * @param {string} id - UUID du produit
   * @returns {Promise} Confirmation
   */
  delete: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  /**
   * Supprime dÃ©finitivement un produit
   * @param {string} id - UUID du produit
   * @returns {Promise} Confirmation
   */
  hardDelete: async (id) => {
    const response = await api.delete(`/products/${id}/hard`);
    return response.data;
  },

  /**
   * Met Ã  jour le stock d'un produit
   * @param {string} id - UUID du produit
   * @param {number} quantite - QuantitÃ©
   * @param {string} operation - 'set', 'add', ou 'subtract'
   * @returns {Promise} Stock mis Ã  jour
   */
  updateStock: async (id, quantite, operation = 'set') => {
    const response = await api.patch(`/products/${id}/stock`, { 
      quantite, 
      operation 
    });
    return response.data;
  },

  /**
   * RÃ©cupÃ¨re les produits avec stock faible (admin)
   * @returns {Promise} Produits en alerte stock
   */
  getLowStock: async () => {
    const response = await api.get('/products/admin/low-stock');
    return response.data;
  },

  /**
   * Suppression multiple de produits
   * @param {Array} ids - Liste des UUIDs à supprimer
   * @returns {Promise} Résultats de suppression
   */
  bulkDelete: async (ids) => {
    const response = await api.delete('/products/admin/bulk', { data: { ids } });
    return response.data;
  },

  /**
   * Export de tous les produits
   * @returns {Promise} Liste des produits pour export
   */
  exportAll: async () => {
    const response = await api.get('/products/admin/export');
    return response.data;
  },

  /**
   * Import de produits
   * @param {Array} products - Liste des produits à importer
   * @param {string} defaultCategoryId - ID de la catégorie par défaut
   * @returns {Promise} Résultats d'import
   */
  importProducts: async (products, defaultCategoryId) => {
    const response = await api.post('/products/admin/import', { products, defaultCategoryId });
    return response.data;
  }
};

export default productService;