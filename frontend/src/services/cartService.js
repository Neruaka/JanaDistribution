/**
 * Cart Service
 * Appels API pour la gestion du panier
 */

import api from './api';

const cartService = {
  /**
   * Récupérer le panier de l'utilisateur
   * @returns {Promise<Object>} Le panier avec items et résumé
   */
  async getCart() {
    const response = await api.get('/cart');
    return response.data.data;
  },

  /**
   * Obtenir le nombre d'items (pour badge)
   * @returns {Promise<Object>} { count, displayCount }
   */
  async getItemCount() {
    const response = await api.get('/cart/count');
    return response.data.data;
  },

  /**
   * Ajouter un produit au panier
   * @param {string} productId - UUID du produit
   * @param {number} quantity - Quantité (défaut: 1)
   * @returns {Promise<Object>} { item, cart, message }
   */
  async addItem(productId, quantity = 1) {
    const response = await api.post('/cart/items', { productId, quantity });
    return response.data;
  },

  /**
   * Modifier la quantité d'un item
   * @param {string} itemId - UUID de l'item
   * @param {number} quantity - Nouvelle quantité
   * @returns {Promise<Object>} { item, cart, message }
   */
  async updateItemQuantity(itemId, quantity) {
    const response = await api.put(`/cart/items/${itemId}`, { quantity });
    return response.data;
  },

  /**
   * Supprimer un item du panier
   * @param {string} itemId - UUID de l'item
   * @returns {Promise<Object>} { cart, message }
   */
  async removeItem(itemId) {
    const response = await api.delete(`/cart/items/${itemId}`);
    return response.data;
  },

  /**
   * Vider tout le panier
   * @returns {Promise<Object>} { cart, message }
   */
  async clearCart() {
    const response = await api.delete('/cart');
    return response.data;
  },

  /**
   * Valider le panier avant commande
   * @returns {Promise<Object>} { isValid, errors, cart, suggestions }
   */
  async validateCart() {
    const response = await api.get('/cart/validate');
    return response.data.data;
  },

  /**
   * Appliquer les corrections suggérées
   * @returns {Promise<Object>} { cart, changes, message }
   */
  async applyFixes() {
    const response = await api.post('/cart/fix');
    return response.data;
  }
};

export default cartService;
