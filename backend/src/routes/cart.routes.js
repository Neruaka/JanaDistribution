/**
 * Cart Routes
 * @description Routes pour la gestion du panier
 * Toutes les routes nécessitent une authentification
 */

const express = require('express');
const router = express.Router();

const cartController = require('../controllers/cart.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { 
  addItemValidator, 
  updateItemValidator, 
  itemIdValidator 
} = require('../validators/cart.validator');

// ===== TOUTES LES ROUTES NÉCESSITENT UNE AUTHENTIFICATION =====
router.use(authenticate);

/**
 * @route   GET /api/cart
 * @desc    Récupérer le panier de l'utilisateur
 * @access  Private
 */
router.get('/', cartController.getCart);

/**
 * @route   GET /api/cart/count
 * @desc    Obtenir le nombre d'items (pour badge navbar)
 * @access  Private
 */
router.get('/count', cartController.getItemCount);

/**
 * @route   GET /api/cart/validate
 * @desc    Valider le panier avant commande
 * @access  Private
 */
router.get('/validate', cartController.validateCart);

/**
 * @route   POST /api/cart/items
 * @desc    Ajouter un produit au panier
 * @access  Private
 * @body    { productId: UUID, quantity?: number }
 */
router.post('/items', addItemValidator, validate, cartController.addItem);

/**
 * @route   PUT /api/cart/items/:itemId
 * @desc    Modifier la quantité d'un item
 * @access  Private
 * @body    { quantity: number }
 */
router.put('/items/:itemId', updateItemValidator, validate, cartController.updateItem);

/**
 * @route   DELETE /api/cart/items/:itemId
 * @desc    Supprimer un item du panier
 * @access  Private
 */
router.delete('/items/:itemId', itemIdValidator, validate, cartController.removeItem);

/**
 * @route   DELETE /api/cart
 * @desc    Vider tout le panier
 * @access  Private
 */
router.delete('/', cartController.clearCart);

/**
 * @route   POST /api/cart/fix
 * @desc    Appliquer les corrections suggérées au panier
 * @access  Private
 */
router.post('/fix', cartController.applyFixes);

module.exports = router;
