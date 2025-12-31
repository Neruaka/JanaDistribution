/**
 * Order Validator
 * @description Validation des données pour les commandes
 */

const { body, param, query } = require('express-validator');

/**
 * Validation pour la création d'une commande
 */
const createOrderValidation = [
  // Adresse de livraison (obligatoire)
  body('adresseLivraison')
    .exists()
    .withMessage('L\'adresse de livraison est obligatoire')
    .isObject()
    .withMessage('L\'adresse de livraison doit être un objet'),
  
  body('adresseLivraison.nom')
    .trim()
    .notEmpty()
    .withMessage('Le nom est obligatoire')
    .isLength({ max: 100 })
    .withMessage('Le nom ne peut pas dépasser 100 caractères'),
  
  body('adresseLivraison.prenom')
    .trim()
    .notEmpty()
    .withMessage('Le prénom est obligatoire')
    .isLength({ max: 100 })
    .withMessage('Le prénom ne peut pas dépasser 100 caractères'),
  
  body('adresseLivraison.adresse')
    .trim()
    .notEmpty()
    .withMessage('L\'adresse est obligatoire')
    .isLength({ max: 255 })
    .withMessage('L\'adresse ne peut pas dépasser 255 caractères'),
  
  body('adresseLivraison.complement')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Le complément ne peut pas dépasser 255 caractères'),
  
  body('adresseLivraison.codePostal')
    .trim()
    .notEmpty()
    .withMessage('Le code postal est obligatoire')
    .matches(/^[0-9]{5}$/)
    .withMessage('Le code postal doit contenir 5 chiffres'),
  
  body('adresseLivraison.ville')
    .trim()
    .notEmpty()
    .withMessage('La ville est obligatoire')
    .isLength({ max: 100 })
    .withMessage('La ville ne peut pas dépasser 100 caractères'),
  
  body('adresseLivraison.pays')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Le pays ne peut pas dépasser 100 caractères'),
  
  body('adresseLivraison.telephone')
    .optional()
    .trim()
    .matches(/^[0-9+\s-]{10,20}$/)
    .withMessage('Le numéro de téléphone n\'est pas valide'),
  
  // Adresse de facturation (optionnelle)
  body('adresseFacturation')
    .optional()
    .isObject()
    .withMessage('L\'adresse de facturation doit être un objet'),
  
  body('adresseFacturation.nom')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Le nom ne peut pas dépasser 100 caractères'),
  
  body('adresseFacturation.prenom')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Le prénom ne peut pas dépasser 100 caractères'),
  
  body('adresseFacturation.adresse')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('L\'adresse ne peut pas dépasser 255 caractères'),
  
  body('adresseFacturation.codePostal')
    .optional()
    .trim()
    .matches(/^[0-9]{5}$/)
    .withMessage('Le code postal doit contenir 5 chiffres'),
  
  body('adresseFacturation.ville')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La ville ne peut pas dépasser 100 caractères'),
  
  // Mode de paiement
  body('modePaiement')
    .optional()
    .isIn(['CARTE', 'VIREMENT', 'CHEQUE', 'ESPECES'])
    .withMessage('Mode de paiement invalide (CARTE, VIREMENT, CHEQUE, ESPECES)'),
  
  // Frais de livraison
  body('fraisLivraison')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Les frais de livraison doivent être un nombre positif'),
  
  // Instructions de livraison
  body('instructionsLivraison')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Les instructions ne peuvent pas dépasser 500 caractères')
];

/**
 * Validation pour la mise à jour du statut
 */
const updateStatusValidation = [
  param('id')
    .isUUID()
    .withMessage('ID de commande invalide'),
  
  body('statut')
    .notEmpty()
    .withMessage('Le statut est obligatoire')
    .isIn(['EN_ATTENTE', 'CONFIRMEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE', 'ANNULEE'])
    .withMessage('Statut invalide'),
  
  body('instructionsLivraison')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Les instructions ne peuvent pas dépasser 500 caractères')
];

/**
 * Validation pour l'ID de commande
 */
const orderIdValidation = [
  param('id')
    .isUUID()
    .withMessage('ID de commande invalide')
];

/**
 * Validation pour le numéro de commande
 */
const orderNumeroValidation = [
  param('numero')
    .matches(/^CMD-[0-9]{8}-[0-9]{4}$/)
    .withMessage('Numéro de commande invalide (format: CMD-YYYYMMDD-XXXX)')
];

/**
 * Validation pour les filtres de liste
 */
const listOrdersValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La page doit être un entier positif'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être entre 1 et 100'),
  
  query('statut')
    .optional()
    .isIn(['EN_ATTENTE', 'CONFIRMEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE', 'ANNULEE'])
    .withMessage('Statut invalide'),
  
  query('dateDebut')
    .optional()
    .isISO8601()
    .withMessage('Date de début invalide (format ISO 8601)'),
  
  query('dateFin')
    .optional()
    .isISO8601()
    .withMessage('Date de fin invalide (format ISO 8601)'),
  
  query('orderBy')
    .optional()
    .isIn(['createdAt', 'total', 'statut', 'numero'])
    .withMessage('Tri invalide'),
  
  query('orderDir')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('Direction de tri invalide (ASC ou DESC)')
];

module.exports = {
  createOrderValidation,
  updateStatusValidation,
  orderIdValidation,
  orderNumeroValidation,
  listOrdersValidation
};
