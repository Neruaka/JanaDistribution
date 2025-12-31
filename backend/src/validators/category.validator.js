/**
 * Validator Catégories
 * @description Validation des données catégories
 */

const { body, param } = require('express-validator');

const categoryValidators = {
  /**
   * Validation pour la création d'une catégorie
   */
  create: [
    body('nom')
      .trim()
      .notEmpty().withMessage('Le nom est obligatoire')
      .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),

    body('slug')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Le slug ne doit pas dépasser 100 caractères')
      .matches(/^[a-z0-9-]+$/).withMessage('Le slug ne doit contenir que des lettres minuscules, chiffres et tirets'),

    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('La description ne doit pas dépasser 500 caractères'),

    body('imageUrl')
      .optional({ nullable: true })
      .trim()
      .isURL().withMessage('L\'URL de l\'image n\'est pas valide'),

    body('couleur')
      .optional()
      .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('La couleur doit être au format hexadécimal (#RRGGBB)'),

    body('icone')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 50 }).withMessage('L\'icône ne doit pas dépasser 50 caractères'),

    body('ordre')
      .optional()
      .isInt({ min: 0 }).withMessage('L\'ordre doit être un entier positif'),

    body('estActif')
      .optional()
      .isBoolean().withMessage('estActif doit être un booléen')
  ],

  /**
   * Validation pour la mise à jour d'une catégorie
   */
  update: [
    param('id')
      .isUUID().withMessage('ID de catégorie invalide'),

    body('nom')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),

    body('slug')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Le slug ne doit pas dépasser 100 caractères')
      .matches(/^[a-z0-9-]+$/).withMessage('Le slug ne doit contenir que des lettres minuscules, chiffres et tirets'),

    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('La description ne doit pas dépasser 500 caractères'),

    body('imageUrl')
      .optional({ nullable: true })
      .trim()
      .isURL().withMessage('L\'URL de l\'image n\'est pas valide'),

    body('couleur')
      .optional()
      .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('La couleur doit être au format hexadécimal (#RRGGBB)'),

    body('icone')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 50 }).withMessage('L\'icône ne doit pas dépasser 50 caractères'),

    body('ordre')
      .optional()
      .isInt({ min: 0 }).withMessage('L\'ordre doit être un entier positif'),

    body('estActif')
      .optional()
      .isBoolean().withMessage('estActif doit être un booléen')
  ],

  /**
   * Validation de l'ID en paramètre
   */
  idParam: [
    param('id')
      .isUUID().withMessage('ID de catégorie invalide')
  ],

  /**
   * Validation du slug en paramètre
   */
  slugParam: [
    param('slug')
      .trim()
      .notEmpty().withMessage('Le slug est obligatoire')
      .matches(/^[a-z0-9-]+$/).withMessage('Slug invalide')
  ],

  /**
   * Validation pour le réordonnancement
   */
  reorder: [
    body('orderedIds')
      .isArray({ min: 1 }).withMessage('Un tableau d\'IDs est requis'),

    body('orderedIds.*')
      .isUUID().withMessage('Chaque ID doit être un UUID valide')
  ]
};

module.exports = categoryValidators;
