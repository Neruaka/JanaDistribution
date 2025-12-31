/**
 * Cart Controller
 * @description Gestion des requêtes HTTP pour le panier
 */

const cartService = require('../services/cart.service');
const logger = require('../config/logger');

class CartController {
  
  /**
   * GET /api/cart
   * Récupérer le panier de l'utilisateur connecté
   */
  async getCart(req, res, next) {
    try {
      const userId = req.user.id;
      
      const cart = await cartService.getCart(userId);
      
      res.json({
        success: true,
        data: cart
      });
      
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * POST /api/cart/items
   * Ajouter un produit au panier
   * Body: { productId: string, quantity?: number }
   */
  async addItem(req, res, next) {
    try {
      const userId = req.user.id;
      const { productId, quantity = 1 } = req.body;
      
      const result = await cartService.addItem(userId, productId, parseInt(quantity));
      
      res.status(201).json({
        success: true,
        message: result.message,
        data: {
          item: result.item,
          cart: result.cart
        }
      });
      
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * PUT /api/cart/items/:itemId
   * Modifier la quantité d'un item
   * Body: { quantity: number }
   */
  async updateItem(req, res, next) {
    try {
      const userId = req.user.id;
      const { itemId } = req.params;
      const { quantity } = req.body;
      
      const result = await cartService.updateItemQuantity(userId, itemId, parseInt(quantity));
      
      res.json({
        success: true,
        message: result.message,
        data: {
          item: result.item,
          cart: result.cart
        }
      });
      
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * DELETE /api/cart/items/:itemId
   * Supprimer un item du panier
   */
  async removeItem(req, res, next) {
    try {
      const userId = req.user.id;
      const { itemId } = req.params;
      
      const result = await cartService.removeItem(userId, itemId);
      
      res.json({
        success: true,
        message: result.message,
        data: {
          cart: result.cart
        }
      });
      
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * DELETE /api/cart
   * Vider tout le panier
   */
  async clearCart(req, res, next) {
    try {
      const userId = req.user.id;
      
      const result = await cartService.clearCart(userId);
      
      res.json({
        success: true,
        message: result.message,
        data: {
          cart: result.cart
        }
      });
      
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /api/cart/count
   * Obtenir le nombre d'items (pour badge navbar)
   */
  async getItemCount(req, res, next) {
    try {
      const userId = req.user.id;
      
      const result = await cartService.getItemCount(userId);
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /api/cart/validate
   * Valider le panier avant commande
   */
  async validateCart(req, res, next) {
    try {
      const userId = req.user.id;
      
      const result = await cartService.validateCart(userId);
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * POST /api/cart/fix
   * Appliquer les corrections suggérées (supprimer items indisponibles, ajuster quantités)
   */
  async applyFixes(req, res, next) {
    try {
      const userId = req.user.id;
      
      const result = await cartService.applyValidationSuggestions(userId);
      
      res.json({
        success: true,
        message: result.message,
        data: {
          cart: result.cart,
          changes: result.changes
        }
      });
      
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CartController();
