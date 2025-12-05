/**
 * Cart Validators
 * @description Validation des données pour le panier
 */

const { body, param } = require('express-validator');

/**
 * Validation pour ajouter un item au panier
 */
const addItemValidator = [
  body('productId')
    .notEmpty()
    .withMessage('L\'ID du produit est requis')
    .isUUID()
    .withMessage('L\'ID du produit doit être un UUID valide'),
  
  body('quantity')
    .optional()
    .isInt({ min: 1, max: 9999 })
    .withMessage('La quantité doit être un entier entre 1 et 9999')
];

/**
 * Validation pour modifier la quantité d'un item
 */
const updateItemValidator = [
  param('itemId')
    .isUUID()
    .withMessage('L\'ID de l\'item doit être un UUID valide'),
  
  body('quantity')
    .notEmpty()
    .withMessage('La quantité est requise')
    .isInt({ min: 1, max: 9999 })
    .withMessage('La quantité doit être un entier entre 1 et 9999')
];

/**
 * Validation de l'ID d'item dans les params
 */
const itemIdValidator = [
  param('itemId')
    .isUUID()
    .withMessage('L\'ID de l\'item doit être un UUID valide')
];

module.exports = {
  addItemValidator,
  updateItemValidator,
  itemIdValidator
};
