/**
 * Cart Service - VERSION CORRIGÉE
 * @description Service métier pour le panier
 * 
 * ✅ CORRECTION: Utilise les méthodes EXISTANTES du cart.repository.js:
 * - getOrCreateCart(userId)
 * - addItem(cartId, productId, quantity, unitPrice)
 * - updateItemQuantity(itemId, quantity)
 * - removeItem(itemId)
 * - clearCart(cartId)
 * - getItemCount(userId)
 * - isItemOwnedByUser(itemId, userId)
 * - getItemById(itemId)
 */

const cartRepository = require('../repositories/cart.repository');
const productRepository = require('../repositories/product.repository');
const logger = require('../config/logger');
const { ApiError } = require('../middlewares/errorHandler');

// Import settings service si disponible
let settingsService;
try {
  settingsService = require('./settings.service');
} catch (e) {
  settingsService = null;
}

class CartService {
  
  /**
   * Récupère le panier complet d'un utilisateur
   * @param {string} userId - UUID de l'utilisateur
   * @returns {Object} Panier avec items, summary et warnings
   */
  async getCart(userId) {
    // getOrCreateCart retourne déjà le panier avec items et summary
    const cart = await cartRepository.getOrCreateCart(userId);
    
    // Vérifier les problèmes de stock
    const warnings = [];
    
    if (cart.items && cart.items.length > 0) {
      for (const item of cart.items) {
        // Vérifier si le produit est toujours actif
        if (!item.product.isActive) {
          warnings.push({
            type: 'PRODUCT_INACTIVE',
            itemId: item.id,
            productName: item.product.name,
            message: `"${item.product.name}" n'est plus disponible`
          });
        }
        // Vérifier le stock
        else if (item.product.stock < item.quantity) {
          warnings.push({
            type: 'INSUFFICIENT_STOCK',
            itemId: item.id,
            productName: item.product.name,
            available: item.product.stock,
            requested: item.quantity,
            message: `Stock insuffisant pour "${item.product.name}" (${item.product.stock} disponible)`
          });
        }
      }
    }
    
    return {
      id: cart.id,
      items: cart.items || [],
      summary: cart.summary || {
        itemCount: 0,
        totalQuantity: 0,
        subtotalHT: 0,
        totalTVA: 0,
        totalTTC: 0,
        economies: 0
      },
      warnings: warnings.length > 0 ? warnings : null
    };
  }
  
  /**
   * Ajoute un produit au panier
   * @param {string} userId - UUID de l'utilisateur
   * @param {string} productId - UUID du produit
   * @param {number} quantity - Quantité à ajouter
   * @returns {Object} Résultat avec item ajouté et panier mis à jour
   */
  async addItem(userId, productId, quantity = 1) {
    // Valider la quantité
    if (quantity < 1) {
      throw ApiError.badRequest('La quantité doit être au moins de 1');
    }
    
    // Récupérer le produit
    const product = await productRepository.findById(productId);
    
    if (!product) {
      throw ApiError.notFound('Produit non trouvé');
    }
    
    if (!product.estActif) {
      throw ApiError.badRequest('Ce produit n\'est plus disponible');
    }
    
    // Vérifier le stock selon les settings
    let autoriserSansStock = false;
    try {
      if (settingsService) {
        autoriserSansStock = await settingsService.get('commande_autoriser_sans_stock') || false;
      }
    } catch (e) {
      // Settings pas disponibles, on utilise la valeur par défaut
    }
    
    if (!autoriserSansStock && product.stockQuantite <= 0) {
      throw ApiError.badRequest('Ce produit est en rupture de stock');
    }
    
    if (!autoriserSansStock && product.stockQuantite < quantity) {
      throw ApiError.badRequest(`Stock insuffisant. Disponible: ${product.stockQuantite}`);
    }
    
    // Récupérer ou créer le panier
    const cart = await cartRepository.getOrCreateCart(userId);
    
    // Vérifier si le produit est déjà dans le panier
    const existingItem = cart.items?.find(item => item.productId === productId);
    
    let item;
    const unitPrice = product.prixPromo || product.prix;
    
    if (existingItem) {
      // Mettre à jour la quantité
      const newQuantity = existingItem.quantity + quantity;
      
      if (!autoriserSansStock && newQuantity > product.stockQuantite) {
        throw ApiError.badRequest(`Stock insuffisant. Maximum: ${product.stockQuantite}`);
      }
      
      item = await cartRepository.updateItemQuantity(existingItem.id, newQuantity);
    } else {
      // Ajouter le nouvel item
      item = await cartRepository.addItem(cart.id, productId, quantity, unitPrice);
    }
    
    // Récupérer le panier mis à jour
    const updatedCart = await this.getCart(userId);
    
    logger.info(`Produit ajouté au panier`, { userId, productId, quantity });
    
    return {
      item,
      cart: updatedCart,
      message: existingItem 
        ? `Quantité mise à jour (${existingItem.quantity + quantity})`
        : `${product.nom} ajouté au panier`
    };
  }
  
  /**
   * Modifie la quantité d'un item
   * @param {string} userId - UUID de l'utilisateur
   * @param {string} itemId - UUID de l'item
   * @param {number} quantity - Nouvelle quantité
   * @returns {Object} Résultat avec item et panier mis à jour
   */
  async updateItemQuantity(userId, itemId, quantity) {
    // Vérifier que l'item appartient à l'utilisateur
    const isOwned = await cartRepository.isItemOwnedByUser(itemId, userId);
    
    if (!isOwned) {
      throw ApiError.forbidden('Cet item ne vous appartient pas');
    }
    
    if (quantity < 1) {
      throw ApiError.badRequest('La quantité doit être au moins de 1');
    }
    
    // Récupérer l'item pour vérifier le stock
    const existingItem = await cartRepository.getItemById(itemId);
    
    if (!existingItem) {
      throw ApiError.notFound('Item non trouvé');
    }
    
    // Vérifier le stock
    let autoriserSansStock = false;
    try {
      if (settingsService) {
        autoriserSansStock = await settingsService.get('commande_autoriser_sans_stock') || false;
      }
    } catch (e) {
      // Settings pas disponibles
    }
    
    if (!autoriserSansStock && existingItem.product && quantity > existingItem.product.stock) {
      throw ApiError.badRequest(`Stock insuffisant. Maximum: ${existingItem.product.stock}`);
    }
    
    // Mettre à jour
    const item = await cartRepository.updateItemQuantity(itemId, quantity);
    
    // Récupérer le panier mis à jour
    const updatedCart = await this.getCart(userId);
    
    return {
      item,
      cart: updatedCart,
      message: 'Quantité mise à jour'
    };
  }
  
  /**
   * Supprime un item du panier
   * @param {string} userId - UUID de l'utilisateur
   * @param {string} itemId - UUID de l'item
   * @returns {Object} Résultat avec panier mis à jour
   */
  async removeItem(userId, itemId) {
    // Vérifier que l'item appartient à l'utilisateur
    const isOwned = await cartRepository.isItemOwnedByUser(itemId, userId);
    
    if (!isOwned) {
      throw ApiError.forbidden('Cet item ne vous appartient pas');
    }
    
    // Supprimer l'item
    await cartRepository.removeItem(itemId);
    
    // Récupérer le panier mis à jour
    const updatedCart = await this.getCart(userId);
    
    logger.info(`Item supprimé du panier`, { userId, itemId });
    
    return {
      cart: updatedCart,
      message: 'Produit retiré du panier'
    };
  }
  
  /**
   * Vide complètement le panier
   * @param {string} userId - UUID de l'utilisateur
   * @returns {Object} Résultat avec panier vide
   */
  async clearCart(userId) {
    // Récupérer le panier pour avoir l'ID
    const cart = await cartRepository.getOrCreateCart(userId);
    
    // Vider le panier
    await cartRepository.clearCart(cart.id);
    
    logger.info(`Panier vidé`, { userId });
    
    return {
      cart: {
        id: cart.id,
        items: [],
        summary: {
          itemCount: 0,
          totalQuantity: 0,
          subtotalHT: 0,
          totalTVA: 0,
          totalTTC: 0,
          economies: 0
        },
        warnings: null
      },
      message: 'Panier vidé'
    };
  }
  
  /**
   * Récupère le nombre d'items dans le panier
   * @param {string} userId - UUID de l'utilisateur
   * @returns {Object} Compteur
   */
  async getItemCount(userId) {
    const count = await cartRepository.getItemCount(userId);
    return { count };
  }
  
  /**
   * Valide le panier avant commande
   * @param {string} userId - UUID de l'utilisateur
   * @returns {Object} Résultat de validation
   */
  async validateCart(userId) {
    const cart = await this.getCart(userId);
    
    const errors = [];
    const warnings = [];
    
    // Vérifier que le panier n'est pas vide
    if (!cart.items || cart.items.length === 0) {
      errors.push({
        type: 'EMPTY_CART',
        message: 'Votre panier est vide'
      });
      return { isValid: false, errors, warnings };
    }
    
    // Vérifier chaque produit
    for (const item of cart.items) {
      if (!item.product.isActive) {
        errors.push({
          type: 'PRODUCT_INACTIVE',
          itemId: item.id,
          productName: item.product.name,
          message: `"${item.product.name}" n'est plus disponible`
        });
      } else if (item.product.stock < item.quantity) {
        if (item.product.stock === 0) {
          errors.push({
            type: 'OUT_OF_STOCK',
            itemId: item.id,
            productName: item.product.name,
            message: `"${item.product.name}" est en rupture de stock`
          });
        } else {
          warnings.push({
            type: 'INSUFFICIENT_STOCK',
            itemId: item.id,
            productName: item.product.name,
            available: item.product.stock,
            requested: item.quantity,
            message: `Stock limité pour "${item.product.name}" (${item.product.stock} disponible)`
          });
        }
      }
    }
    
    // Vérifier le montant minimum
    let montantMinCommande = 0;
    try {
      if (settingsService) {
        montantMinCommande = await settingsService.get('commande_montant_min') || 0;
      }
    } catch (e) {
      // Settings pas disponibles
    }
    
    if (montantMinCommande > 0 && cart.summary.totalTTC < montantMinCommande) {
      errors.push({
        type: 'MIN_AMOUNT',
        currentAmount: cart.summary.totalTTC,
        requiredAmount: montantMinCommande,
        message: `Le montant minimum de commande est de ${montantMinCommande.toFixed(2)}€ TTC`
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      cart
    };
  }
  
  /**
   * Applique les corrections suggérées (supprime items indisponibles, ajuste quantités)
   * @param {string} userId - UUID de l'utilisateur
   * @returns {Object} Résultat avec modifications appliquées
   */
  async applyValidationSuggestions(userId) {
    const cart = await this.getCart(userId);
    const changes = [];
    
    if (!cart.items || cart.items.length === 0) {
      return { cart, changes, message: 'Aucune modification nécessaire' };
    }
    
    for (const item of cart.items) {
      // Supprimer les produits inactifs
      if (!item.product.isActive) {
        await cartRepository.removeItem(item.id);
        changes.push({
          type: 'REMOVED',
          productName: item.product.name,
          reason: 'Produit indisponible'
        });
      }
      // Ajuster les quantités si stock insuffisant
      else if (item.product.stock < item.quantity) {
        if (item.product.stock === 0) {
          await cartRepository.removeItem(item.id);
          changes.push({
            type: 'REMOVED',
            productName: item.product.name,
            reason: 'Rupture de stock'
          });
        } else {
          await cartRepository.updateItemQuantity(item.id, item.product.stock);
          changes.push({
            type: 'QUANTITY_ADJUSTED',
            productName: item.product.name,
            oldQuantity: item.quantity,
            newQuantity: item.product.stock,
            reason: 'Stock limité'
          });
        }
      }
    }
    
    // Récupérer le panier mis à jour
    const updatedCart = await this.getCart(userId);
    
    return {
      cart: updatedCart,
      changes,
      message: changes.length > 0 
        ? `${changes.length} modification(s) appliquée(s)`
        : 'Aucune modification nécessaire'
    };
  }
}

module.exports = new CartService();
