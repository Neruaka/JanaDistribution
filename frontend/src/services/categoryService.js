/**
 * Service Catégories (Frontend)
 * @description Appels API pour les catégories
 */

import api from './api';

const categoryService = {
  // ==========================================
  // MÉTHODES PUBLIQUES (lecture)
  // ==========================================

  /**
   * Récupère toutes les catégories
   * @param {Object} options - Options de récupération
   * @param {boolean} options.includeProductCount - Inclure le nombre de produits
   * @param {boolean} options.includeInactive - Inclure les catégories inactives (admin)
   */
  getAll: async (options = {}) => {
    const params = {
      includeProductCount: options.includeProductCount !== false ? 'true' : 'false',
      includeInactive: options.includeInactive ? 'true' : 'false'
    };
    const response = await api.get('/categories', { params });
    return response.data;
  },

  /**
   * Récupère une catégorie par ID
   * @param {string} id - UUID de la catégorie
   */
  getById: async (id) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  /**
   * Récupère une catégorie par slug
   * @param {string} slug - Slug de la catégorie
   */
  getBySlug: async (slug) => {
    const response = await api.get(`/categories/slug/${slug}`);
    return response.data;
  },

  // ==========================================
  // MÉTHODES ADMIN (CRUD)
  // ==========================================

  /**
   * Crée une nouvelle catégorie
   * @param {Object} data - Données de la catégorie
   */
  create: async (data) => {
    const response = await api.post('/categories', data);
    return response.data;
  },

  /**
   * Met à jour une catégorie
   * @param {string} id - UUID de la catégorie
   * @param {Object} data - Données à mettre à jour
   */
  update: async (id, data) => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },

  /**
   * Supprime une catégorie (soft delete)
   * @param {string} id - UUID de la catégorie
   */
  delete: async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },

  /**
   * Active/désactive une catégorie
   * @param {string} id - UUID de la catégorie
   */
  toggleActive: async (id) => {
    const response = await api.patch(`/categories/${id}/toggle-active`);
    return response.data;
  },

  /**
   * Réorganise l'ordre des catégories
   * @param {string[]} orderedIds - Tableau d'UUIDs dans le nouvel ordre
   */
  reorder: async (orderedIds) => {
    const response = await api.put('/categories/reorder', { orderedIds });
    return response.data;
  }
};

export default categoryService;