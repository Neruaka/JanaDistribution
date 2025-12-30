/**
 * Product Service - Frontend
 * @description Appels API pour les produits
 * 
 * ✅ AJOUT: uploadImage, deleteImage
 */

import api from './api';

const productService = {
  // ==========================================
  // LECTURE
  // ==========================================

  /**
   * Récupérer tous les produits avec filtres
   */
  async getAll(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.categorieId) queryParams.append('categorieId', params.categorieId);
    if (params.search) queryParams.append('search', params.search);
    if (params.minPrice) queryParams.append('minPrice', params.minPrice);
    if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice);
    if (params.enStock !== undefined) queryParams.append('enStock', params.enStock);
    if (params.estActif !== undefined) queryParams.append('estActif', params.estActif);
    if (params.enPromotion !== undefined) queryParams.append('enPromotion', params.enPromotion);
    if (params.estMisEnAvant !== undefined) queryParams.append('estMisEnAvant', params.estMisEnAvant);
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.orderDir) queryParams.append('orderDir', params.orderDir);
    if (params.labels) queryParams.append('labels', params.labels);

    const response = await api.get(`/products?${queryParams}`);
    return response.data;
  },

  /**
   * Récupérer un produit par ID
   */
  async getById(id) {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  /**
   * Récupérer un produit par slug
   */
  async getBySlug(slug) {
    const response = await api.get(`/products/slug/${slug}`);
    return response.data;
  },

  /**
   * Rechercher des produits
   */
  async search(query, params = {}) {
    const queryParams = new URLSearchParams();
    queryParams.append('q', query);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);

    const response = await api.get(`/products/search?${queryParams}`);
    return response.data;
  },

  /**
   * Récupérer les promos
   */
  async getPromos() {
    const response = await api.get('/products/promos');
    return response.data;
  },

  /**
   * Récupérer les nouveautés
   */
  async getNew(days = 30, limit = 10) {
    const response = await api.get(`/products/new?days=${days}&limit=${limit}`);
    return response.data;
  },

  /**
   * Récupérer les produits mis en avant
   */
  async getFeatured(limit = 8) {
    const response = await api.get(`/products/featured?limit=${limit}`);
    return response.data;
  },

  // ==========================================
  // ADMIN - CRUD
  // ==========================================

  /**
   * Créer un produit
   */
  async create(data) {
    const response = await api.post('/products', data);
    return response.data;
  },

  /**
   * Modifier un produit
   */
  async update(id, data) {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },

  /**
   * Supprimer un produit (soft delete)
   */
  async delete(id) {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  /**
   * Supprimer définitivement un produit
   */
  async hardDelete(id) {
    const response = await api.delete(`/products/${id}/hard`);
    return response.data;
  },

  /**
   * Mettre à jour le stock
   */
  async updateStock(id, quantite, operation = 'set') {
    const response = await api.patch(`/products/${id}/stock`, { quantite, operation });
    return response.data;
  },

  /**
   * Suppression multiple
   */
  async bulkDelete(ids) {
    const response = await api.delete('/products/admin/bulk', { data: { ids } });
    return response.data;
  },

  // ==========================================
  // ✅ NOUVEAU: UPLOAD D'IMAGE
  // ==========================================

  /**
   * Upload une image produit
   * @param {File} file - Fichier image
   * @returns {Promise<{success, data: {imageUrl, filename}}>}
   */
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/products/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Supprimer une image uploadée
   * @param {string} filename - Nom du fichier
   */
  async deleteImage(filename) {
    const response = await api.delete(`/products/delete-image/${filename}`);
    return response.data;
  },

  // ==========================================
  // ADMIN - EXPORT/IMPORT
  // ==========================================

  /**
   * Exporter tous les produits
   */
  async exportAll() {
    const response = await api.get('/products/admin/export');
    return response.data;
  },

  /**
   * Importer des produits
   */
  async importProducts(products, defaultCategoryId) {
    const response = await api.post('/products/admin/import', { 
      products, 
      defaultCategoryId 
    });
    return response.data;
  },

  /**
   * Récupérer les produits en stock faible
   */
  async getLowStock() {
    const response = await api.get('/products/admin/low-stock');
    return response.data;
  }
};

export default productService;
