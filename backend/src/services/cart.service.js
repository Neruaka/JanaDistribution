/**
 * Cart Service
 * @description Logique métier pour la gestion du panier
 * 
 * IMPORTANT - Conventions de nommage:
 * - product.repository retourne des propriétés en FRANÇAIS (camelCase):
 *   estActif, stockQuantite, nom, prix, prixPromo
 * 
 * - cart.repository._mapCartItem retourne des propriétés en ANGLAIS:
 *   product.isActive, product.stock, product.name, etc.
 */

const cartRepository = require('../repositories/cart.repository');
const productRepository = require('../repositories/product.repository');
const logger = require('../config/logger');
const { ApiError } = require('../middlewares/errorHandler');

class CartService {
  
  /**
   * Récupérer le panier de l'utilisateur
   * @param {string} userId - UUID de l'utilisateur
   * @returns {Object} Le panier avec items et résumé
   */
  async getCart(userId) {
    const cart = await cartRepository.getOrCreateCart(userId);
    
    // vérifier si des produits sont devenus indisponibles
    // NOTE: cart.repository retourne isActive/stock (anglais)
    const warnings = [];
    
    for (const item of cart.items) {
      if (!item.product.isActive) {
        warnings.push({
          type: 'PRODUCT_INACTIVE',
          itemId: item.id,
          productName: item.product.name,
          message: `"${item.product.name}" n'est plus disponible`
        });
      } else if (item.product.stock < item.quantity) {
        warnings.push({
          type: 'INSUFFICIENT_STOCK',
          itemId: item.id,
          productName: item.product.name,
          availableStock: item.product.stock,
          requestedQuantity: item.quantity,
          message: `Stock insuffisant pour "${item.product.name}" (${item.product.stock} disponible)`
        });
      }
    }
    
    return {
      ...cart,
      warnings: warnings.length > 0 ? warnings : null
    };
  }
  
  /**
   * Ajouter un produit au panier
   * @param {string} userId - UUID de l'utilisateur
   * @param {string} productId - UUID du produit
   * @param {number} quantity - Quantité à ajouter
   * @returns {Object} L'item ajouté et le panier mis à jour
   */
  async addItem(userId, productId, quantity = 1) {
    // validation de la quantité
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw ApiError.badRequest('La quantité doit être un entier positif');
    }
    
    if (quantity > 9999) {
      throw ApiError.badRequest('La quantité maximale est de 9999');
    }
    
    // vérifier que le produit existe et est actif
    // NOTE: product.repository retourne estActif (français)
    const product = await productRepository.findById(productId);
    
    if (!product) {
      throw ApiError.notFound('Produit non trouvé');
    }
    
    if (!product.estActif) {
      throw ApiError.badRequest('Ce produit n\'est plus disponible');
    }
    
    // récupérer ou créer le panier
    const cart = await cartRepository.getOrCreateCart(userId);
    
    // vérifier le stock disponible (en tenant compte de ce qui est déjà dans le panier)
    const existingItem = cart.items.find(item => item.productId === productId);
    const currentQuantityInCart = existingItem ? existingItem.quantity : 0;
    const totalRequestedQuantity = currentQuantityInCart + quantity;
    
    // NOTE: product.repository retourne stockQuantite (français)
    if (totalRequestedQuantity > product.stockQuantite) {
      const availableToAdd = product.stockQuantite - currentQuantityInCart;
      
      if (availableToAdd <= 0) {
        throw ApiError.badRequest(
          `Stock insuffisant. Vous avez déjà ${currentQuantityInCart} "${product.nom}" dans votre panier (stock: ${product.stockQuantite})`
        );
      }
      
      throw ApiError.badRequest(
        `Stock insuffisant. Vous pouvez ajouter ${availableToAdd} "${product.nom}" maximum (stock: ${product.stockQuantite}, dans panier: ${currentQuantityInCart})`
      );
    }
    
    // déterminer le prix à utiliser (promo si disponible)
    // NOTE: product.repository retourne prixPromo et prix (français)
    const priceToUse = product.prixPromo || product.prix;
    
    // ajouter l'item
    const item = await cartRepository.addItem(cart.id, productId, quantity, priceToUse);
    
    logger.info(`Produit ajouté au panier`, { 
      userId, 
      productId, 
      quantity, 
      productName: product.nom 
    });
    
    // récupérer le panier mis à jour
    const updatedCart = await cartRepository.getOrCreateCart(userId);
    
    return {
      item,
      cart: updatedCart,
      message: existingItem 
        ? `Quantité de "${product.nom}" mise à jour` 
        : `"${product.nom}" ajouté au panier`
    };
  }
  
  /**
   * Modifier la quantité d'un item
   * @param {string} userId - UUID de l'utilisateur
   * @param {string} itemId - UUID de l'item
   * @param {number} quantity - Nouvelle quantité
   * @returns {Object} L'item mis à jour et le panier
   */
  async updateItemQuantity(userId, itemId, quantity) {
    // validation de la quantité
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw ApiError.badRequest('La quantité doit être un entier positif');
    }
    
    if (quantity > 9999) {
      throw ApiError.badRequest('La quantité maximale est de 9999');
    }
    
    // vérifier que l'item appartient à l'utilisateur
    const isOwned = await cartRepository.isItemOwnedByUser(itemId, userId);
    
    if (!isOwned) {
      throw ApiError.notFound('Item non trouvé dans votre panier');
    }
    
    // récupérer l'item actuel pour avoir le produit
    // NOTE: cart.repository retourne product.stock et product.isActive (anglais)
    const currentItem = await cartRepository.getItemById(itemId);
    
    if (!currentItem) {
      throw ApiError.notFound('Item non trouvé');
    }
    
    // vérifier le stock
    if (quantity > currentItem.product.stock) {
      throw ApiError.badRequest(
        `Stock insuffisant pour "${currentItem.product.name}" (${currentItem.product.stock} disponible)`
      );
    }
    
    // vérifier que le produit est toujours actif
    if (!currentItem.product.isActive) {
      throw ApiError.badRequest(
        `"${currentItem.product.name}" n'est plus disponible. Veuillez le retirer de votre panier.`
      );
    }
    
    // mettre à jour la quantité
    const updatedItem = await cartRepository.updateItemQuantity(itemId, quantity);
    
    logger.info(`Quantité mise à jour dans le panier`, { 
      userId, 
      itemId, 
      oldQuantity: currentItem.quantity,
      newQuantity: quantity 
    });
    
    // récupérer le panier mis à jour
    const cart = await cartRepository.getOrCreateCart(userId);
    
    return {
      item: updatedItem,
      cart,
      message: `Quantité mise à jour`
    };
  }
  
  /**
   * Supprimer un item du panier
   * @param {string} userId - UUID de l'utilisateur
   * @param {string} itemId - UUID de l'item
   * @returns {Object} Le panier mis à jour
   */
  async removeItem(userId, itemId) {
    // vérifier que l'item appartient à l'utilisateur
    const isOwned = await cartRepository.isItemOwnedByUser(itemId, userId);
    
    if (!isOwned) {
      throw ApiError.notFound('Item non trouvé dans votre panier');
    }
    
    // récupérer le nom du produit avant suppression (pour le message)
    // NOTE: cart.repository retourne product.name (anglais)
    const item = await cartRepository.getItemById(itemId);
    const productName = item?.product?.name || 'Produit';
    
    // supprimer l'item
    await cartRepository.removeItem(itemId);
    
    logger.info(`Item supprimé du panier`, { userId, itemId, productName });
    
    // récupérer le panier mis à jour
    const cart = await cartRepository.getOrCreateCart(userId);
    
    return {
      cart,
      message: `"${productName}" retiré du panier`
    };
  }
  
  /**
   * Vider tout le panier
   * @param {string} userId - UUID de l'utilisateur
   * @returns {Object} Le panier vide
   */
  async clearCart(userId) {
    const cart = await cartRepository.getOrCreateCart(userId);
    
    if (cart.items.length === 0) {
      throw ApiError.badRequest('Le panier est déjà vide');
    }
    
    const itemCount = cart.items.length;
    
    await cartRepository.clearCart(cart.id);
    
    logger.info(`Panier vidé`, { userId, itemsRemoved: itemCount });
    
    // récupérer le panier vide
    const clearedCart = await cartRepository.getOrCreateCart(userId);
    
    return {
      cart: clearedCart,
      message: 'Panier vidé'
    };
  }
  
  /**
   * Obtenir le nombre d'items (pour le badge)
   * @param {string} userId - UUID de l'utilisateur
   * @returns {Object} Le compteur
   */
  async getItemCount(userId) {
    const count = await cartRepository.getItemCount(userId);
    
    return {
      count,
      displayCount: count > 99 ? '99+' : count.toString()
    };
  }
  
  /**
   * Valider le panier avant commande
   * Vérifie que tous les produits sont disponibles et en stock suffisant
   * @param {string} userId - UUID de l'utilisateur
   * @returns {Object} Résultat de la validation
   */
  async validateCart(userId) {
    const cart = await cartRepository.getOrCreateCart(userId);
    
    if (cart.items.length === 0) {
      return {
        isValid: false,
        errors: [{ type: 'EMPTY_CART', message: 'Le panier est vide' }]
      };
    }
    
    const errors = [];
    const itemsToRemove = [];
    const itemsToUpdate = [];
    
    // NOTE: cart.repository retourne product.isActive et product.stock (anglais)
    for (const item of cart.items) {
      // produit inactif
      if (!item.product.isActive) {
        errors.push({
          type: 'PRODUCT_INACTIVE',
          itemId: item.id,
          productName: item.product.name,
          message: `"${item.product.name}" n'est plus disponible`
        });
        itemsToRemove.push(item.id);
        continue;
      }
      
      // stock insuffisant
      if (item.product.stock < item.quantity) {
        if (item.product.stock === 0) {
          errors.push({
            type: 'OUT_OF_STOCK',
            itemId: item.id,
            productName: item.product.name,
            message: `"${item.product.name}" est en rupture de stock`
          });
          itemsToRemove.push(item.id);
        } else {
          errors.push({
            type: 'INSUFFICIENT_STOCK',
            itemId: item.id,
            productName: item.product.name,
            availableStock: item.product.stock,
            requestedQuantity: item.quantity,
            message: `Stock insuffisant pour "${item.product.name}" (${item.product.stock} disponible, ${item.quantity} demandé)`
          });
          itemsToUpdate.push({
            id: item.id,
            newQuantity: item.product.stock
          });
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : null,
      cart,
      suggestions: {
        itemsToRemove: itemsToRemove.length > 0 ? itemsToRemove : null,
        itemsToUpdate: itemsToUpdate.length > 0 ? itemsToUpdate : null
      }
    };
  }
  
  /**
   * Appliquer les suggestions de validation (supprimer/ajuster items problématiques)
   * @param {string} userId - UUID de l'utilisateur
   * @returns {Object} Le panier nettoyé
   */
  async applyValidationSuggestions(userId) {
    const validation = await this.validateCart(userId);
    
    if (validation.isValid) {
      return {
        cart: validation.cart,
        changes: [],
        message: 'Aucune modification nécessaire'
      };
    }
    
    const changes = [];
    
    // supprimer les items à retirer
    if (validation.suggestions.itemsToRemove) {
      for (const itemId of validation.suggestions.itemsToRemove) {
        const item = validation.cart.items.find(i => i.id === itemId);
        await cartRepository.removeItem(itemId);
        changes.push({
          type: 'REMOVED',
          productName: item?.product?.name,
          reason: 'Produit indisponible ou en rupture de stock'
        });
      }
    }
    
    // ajuster les quantités
    if (validation.suggestions.itemsToUpdate) {
      for (const update of validation.suggestions.itemsToUpdate) {
        const item = validation.cart.items.find(i => i.id === update.id);
        await cartRepository.updateItemQuantity(update.id, update.newQuantity);
        changes.push({
          type: 'QUANTITY_ADJUSTED',
          productName: item?.product?.name,
          oldQuantity: item?.quantity,
          newQuantity: update.newQuantity,
          reason: 'Ajusté au stock disponible'
        });
      }
    }
    
    logger.info(`Corrections appliquées au panier`, { userId, changes });
    
    // récupérer le panier mis à jour
    const updatedCart = await cartRepository.getOrCreateCart(userId);
    
    return {
      cart: updatedCart,
      changes,
      message: `${changes.length} modification(s) appliquée(s)`
    };
  }
}

module.exports = new CartService();
