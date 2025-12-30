/**
 * Service Produits - VERSION COMPLÈTE
 * @description Appels API pour les produits
 * @location frontend/src/services/productService.js
 * 
 * ✅ AJOUTS:
 * - exportAll : Export de tous les produits
 * - importProducts : Import depuis Excel
 * - bulkDelete : Suppression multiple
 */

import api from './api';

const productService = {
  /**
   * Récupère la liste des produits avec filtres et pagination
   * @param {Object} params - Paramètres de filtrage
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
   * Récupère un produit par son ID
   * @param {string} id - UUID du produit
   * @returns {Promise} Détail du produit
   */
  getById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  /**
   * Récupère un produit par son slug
   * @param {string} slug - Slug URL du produit
   * @returns {Promise} Détail du produit
   */
  getBySlug: async (slug) => {
    const response = await api.get(`/products/slug/${slug}`);
    return response.data;
  },

  /**
   * Recherche de produits
   * @param {string} query - Terme de recherche
   * @param {number} limit - Nombre de résultats
   * @returns {Promise} Produits correspondants
   */
  search: async (query, limit = 10) => {
    const response = await api.get(`/products/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  },

  /**
   * Récupère les produits en promotion
   * @param {number} limit - Nombre de résultats
   * @returns {Promise} Produits en promo
   */
  getPromos: async (limit = 12) => {
    const response = await api.get(`/products/promos?limit=${limit}`);
    return response.data;
  },

  /**
   * Récupère les nouveaux produits
   * @param {number} days - Nombre de jours (défaut: 30)
   * @param {number} limit - Nombre de résultats
   * @returns {Promise} Nouveaux produits
   */
  getNew: async (days = 30, limit = 12) => {
    const response = await api.get(`/products/new?days=${days}&limit=${limit}`);
    return response.data;
  },

  /**
   * Récupère les produits d'une catégorie
   * @param {string} categorieId - UUID de la catégorie
   * @param {Object} params - Paramètres supplémentaires
   * @returns {Promise} Produits de la catégorie
   */
  getByCategory: async (categorieId, params = {}) => {
    return productService.getAll({ ...params, categorieId });
  },

  // ==========================================
  // ✅ MÉTHODES ADMIN (CRUD)
  // ==========================================

  /**
   * Crée un nouveau produit
   * @param {Object} data - Données du produit
   * @returns {Promise} Produit créé
   */
  create: async (data) => {
    const response = await api.post('/products', data);
    return response.data;
  },

  /**
   * Met à jour un produit
   * @param {string} id - UUID du produit
   * @param {Object} data - Données à mettre à jour
   * @returns {Promise} Produit mis à jour
   */
  update: async (id, data) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },

  /**
   * Supprime un produit (soft delete - désactivation)
   * @param {string} id - UUID du produit
   * @returns {Promise} Confirmation
   */
  delete: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  /**
   * Supprime définitivement un produit
   * @param {string} id - UUID du produit
   * @returns {Promise} Confirmation
   */
  hardDelete: async (id) => {
    const response = await api.delete(`/products/${id}/hard`);
    return response.data;
  },

  /**
   * Met à jour le stock d'un produit
   * @param {string} id - UUID du produit
   * @param {number} quantite - Quantité
   * @param {string} operation - 'set', 'add', ou 'subtract'
   * @returns {Promise} Stock mis à jour
   */
  updateStock: async (id, quantite, operation = 'set') => {
    const response = await api.patch(`/products/${id}/stock`, { 
      quantite, 
      operation 
    });
    return response.data;
  },

  /**
   * Récupère les produits avec stock faible (admin)
   * @returns {Promise} Produits en alerte stock
   */
  getLowStock: async () => {
    const response = await api.get('/products/admin/low-stock');
    return response.data;
  },

  // ==========================================
  // ✅ NOUVELLES MÉTHODES : EXPORT / IMPORT / BULK
  // ==========================================

  /**
   * Export de tous les produits pour Excel
   * @returns {Promise} Liste complète des produits formatée pour export
   */
  exportAll: async () => {
    const response = await api.get('/products/admin/export');
    return response.data;
  },

  /**
   * Import de produits depuis Excel
   * @param {Array} products - Liste des produits à importer
   * @param {string} defaultCategoryId - ID de la catégorie par défaut
   * @returns {Promise} Résultat de l'import (created, updated, errors)
   */
  importProducts: async (products, defaultCategoryId) => {
    const response = await api.post('/products/admin/import', {
      products,
      defaultCategoryId
    });
    return response.data;
  },

  /**
   * Suppression multiple de produits
   * @param {Array} ids - Liste des IDs à supprimer
   * @returns {Promise} Résultat (success, errors)
   */
  bulkDelete: async (ids) => {
    const response = await api.post('/products/admin/bulk-delete', { ids });
    return response.data;
  }
};

export default productService;
