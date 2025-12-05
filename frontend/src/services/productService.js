/**
 * Service Produits
 * @description Appels API pour les produits
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
  }
};

export default productService;
