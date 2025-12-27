/**
 * Validator Produits - VERSION CORRIGÉE
 * @description Validation des données produits avec express-validator
 * 
 * ✅ CORRECTION: Ajout de 'enPromotion' dans listQuery
 */

const { body, param, query } = require('express-validator');

const productValidators = {
  /**
   * Validation pour la création d'un produit
   */
  create: [
    body('reference')
      .trim()
      .notEmpty().withMessage('La référence est obligatoire')
      .isLength({ min: 3, max: 50 }).withMessage('La référence doit contenir entre 3 et 50 caractères'),

    body('nom')
      .trim()
      .notEmpty().withMessage('Le nom est obligatoire')
      .isLength({ min: 2, max: 200 }).withMessage('Le nom doit contenir entre 2 et 200 caractères'),

    body('slug')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Le slug ne doit pas dépasser 200 caractères')
      .matches(/^[a-z0-9-]+$/).withMessage('Le slug ne doit contenir que des lettres minuscules, chiffres et tirets'),

    body('description')
      .optional()
      .trim()
      .isLength({ max: 5000 }).withMessage('La description ne doit pas dépasser 5000 caractères'),

    body('prix')
      .notEmpty().withMessage('Le prix est obligatoire')
      .isFloat({ min: 0.01 }).withMessage('Le prix doit être supérieur à 0'),

    body('prixPromo')
      .optional({ nullable: true })
      .isFloat({ min: 0.01 }).withMessage('Le prix promo doit être supérieur à 0'),

    body('tauxTva')
      .optional()
      .isFloat({ min: 0, max: 100 }).withMessage('Le taux TVA doit être entre 0 et 100'),

    body('uniteMesure')
      .optional()
      .isIn(['piece', 'kg', 'litre', 'unite']).withMessage('Unité de mesure invalide'),

    body('stockQuantite')
      .optional()
      .isInt({ min: 0 }).withMessage('Le stock doit être un nombre entier positif'),

    body('stockMinAlerte')
      .optional()
      .isInt({ min: 0 }).withMessage('Le stock minimum doit être un nombre entier positif'),

    body('imageUrl')
      .optional({ nullable: true })
      .trim()
      .isURL().withMessage('L\'URL de l\'image n\'est pas valide'),

    body('labels')
      .optional()
      .isArray().withMessage('Les labels doivent être un tableau'),

    body('labels.*')
      .optional()
      .isIn(['BIO', 'LOCAL', 'PROMO', 'NOUVEAU', 'AOP', 'AOC', 'LABEL_ROUGE'])
      .withMessage('Label invalide'),

    body('origine')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 100 }).withMessage('L\'origine ne doit pas dépasser 100 caractères'),

    body('categorieId')
      .notEmpty().withMessage('La catégorie est obligatoire')
      .isUUID().withMessage('ID de catégorie invalide'),

    body('estActif')
      .optional()
      .isBoolean().withMessage('estActif doit être un booléen'),

    body('estMisEnAvant')
      .optional()
      .isBoolean().withMessage('estMisEnAvant doit être un booléen')
  ],

  /**
   * Validation pour la mise à jour d'un produit
   */
  update: [
    param('id')
      .isUUID().withMessage('ID de produit invalide'),

    body('reference')
      .optional()
      .trim()
      .isLength({ min: 3, max: 50 }).withMessage('La référence doit contenir entre 3 et 50 caractères'),

    body('nom')
      .optional()
      .trim()
      .isLength({ min: 2, max: 200 }).withMessage('Le nom doit contenir entre 2 et 200 caractères'),

    body('slug')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Le slug ne doit pas dépasser 200 caractères')
      .matches(/^[a-z0-9-]+$/).withMessage('Le slug ne doit contenir que des lettres minuscules, chiffres et tirets'),

    body('description')
      .optional()
      .trim()
      .isLength({ max: 5000 }).withMessage('La description ne doit pas dépasser 5000 caractères'),

    body('prix')
      .optional()
      .isFloat({ min: 0.01 }).withMessage('Le prix doit être supérieur à 0'),

    body('prixPromo')
      .optional({ nullable: true })
      .isFloat({ min: 0.01 }).withMessage('Le prix promo doit être supérieur à 0'),

    body('tauxTva')
      .optional()
      .isFloat({ min: 0, max: 100 }).withMessage('Le taux TVA doit être entre 0 et 100'),

    body('uniteMesure')
      .optional()
      .isIn(['piece', 'kg', 'litre', 'unite']).withMessage('Unité de mesure invalide'),

    body('stockQuantite')
      .optional()
      .isInt({ min: 0 }).withMessage('Le stock doit être un nombre entier positif'),

    body('stockMinAlerte')
      .optional()
      .isInt({ min: 0 }).withMessage('Le stock minimum doit être un nombre entier positif'),

    body('imageUrl')
      .optional({ nullable: true })
      .trim()
      .isURL().withMessage('L\'URL de l\'image n\'est pas valide'),

    body('labels')
      .optional()
      .isArray().withMessage('Les labels doivent être un tableau'),

    body('origine')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 100 }).withMessage('L\'origine ne doit pas dépasser 100 caractères'),

    body('categorieId')
      .optional()
      .isUUID().withMessage('ID de catégorie invalide'),

    body('estActif')
      .optional()
      .isBoolean().withMessage('estActif doit être un booléen'),

    body('estMisEnAvant')
      .optional()
      .isBoolean().withMessage('estMisEnAvant doit être un booléen')
  ],

  /**
   * Validation pour la mise à jour du stock
   */
  updateStock: [
    param('id')
      .isUUID().withMessage('ID de produit invalide'),

    body('quantite')
      .notEmpty().withMessage('La quantité est obligatoire')
      .isInt().withMessage('La quantité doit être un nombre entier'),

    body('operation')
      .optional()
      .isIn(['set', 'add', 'subtract']).withMessage('Opération invalide (set, add, subtract)')
  ],

  /**
   * Validation de l'ID en paramètre
   */
  idParam: [
    param('id')
      .isUUID().withMessage('ID de produit invalide')
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
   * Validation des query params de liste
   * ✅ CORRECTION: Ajout de 'enPromotion' et 'hasPromo'
   */
  listQuery: [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page doit être un entier positif'),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limit doit être entre 1 et 100'), // ✅ Augmenté à 100

    query('categorieId')
      .optional()
      .isUUID().withMessage('ID de catégorie invalide'),

    query('minPrice')
      .optional()
      .isFloat({ min: 0 }).withMessage('Prix minimum invalide'),

    query('maxPrice')
      .optional()
      .isFloat({ min: 0 }).withMessage('Prix maximum invalide'),

    query('enStock')
      .optional()
      .isIn(['true', 'false']).withMessage('enStock doit être true ou false'),

    // ✅ AJOUT: Filtre promotions
    query('enPromotion')
      .optional()
      .isIn(['true', 'false']).withMessage('enPromotion doit être true ou false'),

    // ✅ AJOUT: Alias pour enPromotion
    query('hasPromo')
      .optional()
      .isIn(['true', 'false']).withMessage('hasPromo doit être true ou false'),

    query('estActif')
      .optional()
      .isIn(['true', 'false', 'all']).withMessage('estActif doit être true, false ou all'),

    // ✅ AJOUT: Filtre mis en avant
    query('estMisEnAvant')
      .optional()
      .isIn(['true', 'false']).withMessage('estMisEnAvant doit être true ou false'),

    query('orderBy')
      .optional()
      .isIn(['createdAt', 'prix', 'nom', 'stock', 'prixPromo']).withMessage('Tri invalide'),

    query('orderDir')
      .optional()
      .isIn(['ASC', 'DESC', 'asc', 'desc']).withMessage('Direction de tri invalide'),

    // ✅ AJOUT: Recherche texte
    query('search')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Recherche trop longue (max 100 caractères)'),

    query('q')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Recherche trop longue (max 100 caractères)'),

    // ✅ AJOUT: Labels
    query('labels')
      .optional()
      .trim()
  ]
};

module.exports = productValidators;
