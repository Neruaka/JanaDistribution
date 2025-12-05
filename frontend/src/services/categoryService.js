/**
 * Service Catégories
 * @description Appels API pour les catégories
 */

import api from './api';

const categoryService = {
  /**
   * Récupère toutes les catégories
   * @param {boolean} includeProductCount - Inclure le nombre de produits
   * @returns {Promise} Liste des catégories
   */
  getAll: async (includeProductCount = true) => {
    const response = await api.get(`/categories?includeProductCount=${includeProductCount}`);
    return response.data;
  },

  /**
   * Récupère une catégorie par son ID
   * @param {string} id - UUID de la catégorie
   * @returns {Promise} Détail de la catégorie
   */
  getById: async (id) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  /**
   * Récupère une catégorie par son slug
   * @param {string} slug - Slug URL de la catégorie
   * @returns {Promise} Détail de la catégorie
   */
  getBySlug: async (slug) => {
    const response = await api.get(`/categories/slug/${slug}`);
    return response.data;
  }
};

export default categoryService;
