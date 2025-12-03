/**
 * Validator Commandes
 * @description Validation des données commandes
 */

const { body, param, query } = require('express-validator');

const orderValidators = {
  /**
   * Validation pour la création d'une commande
   */
  create: [
    body('lignes')
      .isArray({ min: 1 }).withMessage('La commande doit contenir au moins un produit'),

    body('lignes.*.produitId')
      .isUUID().withMessage('ID de produit invalide'),

    body('lignes.*.quantite')
      .isInt({ min: 1 }).withMessage('La quantité doit être au moins 1'),

    body('adresseLivraison')
      .notEmpty().withMessage('L\'adresse de livraison est obligatoire'),

    body('adresseLivraison.nom')
      .trim()
      .notEmpty().withMessage('Le nom est obligatoire')
      .isLength({ max: 100 }).withMessage('Le nom ne doit pas dépasser 100 caractères'),

    body('adresseLivraison.prenom')
      .trim()
      .notEmpty().withMessage('Le prénom est obligatoire')
      .isLength({ max: 100 }).withMessage('Le prénom ne doit pas dépasser 100 caractères'),

    body('adresseLivraison.adresse')
      .trim()
      .notEmpty().withMessage('L\'adresse est obligatoire')
      .isLength({ max: 255 }).withMessage('L\'adresse ne doit pas dépasser 255 caractères'),

    body('adresseLivraison.complement')
      .optional()
      .trim()
      .isLength({ max: 255 }).withMessage('Le complément ne doit pas dépasser 255 caractères'),

    body('adresseLivraison.codePostal')
      .trim()
      .notEmpty().withMessage('Le code postal est obligatoire')
      .matches(/^\d{5}$/).withMessage('Le code postal doit contenir 5 chiffres'),

    body('adresseLivraison.ville')
      .trim()
      .notEmpty().withMessage('La ville est obligatoire')
      .isLength({ max: 100 }).withMessage('La ville ne doit pas dépasser 100 caractères'),

    body('adresseLivraison.pays')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Le pays ne doit pas dépasser 100 caractères'),

    body('adresseLivraison.telephone')
      .optional()
      .trim()
      .matches(/^(\+33|0)[1-9](\d{8})$/).withMessage('Numéro de téléphone invalide'),

    body('adresseFacturation')
      .optional(),

    body('modePaiement')
      .optional()
      .isIn(['CARTE', 'VIREMENT', 'CHEQUE', 'ESPECES']).withMessage('Mode de paiement invalide'),

    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Les notes ne doivent pas dépasser 1000 caractères')
  ],

  /**
   * Validation pour la mise à jour du statut
   */
  updateStatus: [
    param('id')
      .isUUID().withMessage('ID de commande invalide'),

    body('statut')
      .notEmpty().withMessage('Le statut est obligatoire')
      .isIn(['EN_ATTENTE', 'PAYEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE', 'ANNULEE'])
      .withMessage('Statut invalide'),

    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Les notes ne doivent pas dépasser 1000 caractères')
  ],

  /**
   * Validation de l'ID en paramètre
   */
  idParam: [
    param('id')
      .isUUID().withMessage('ID de commande invalide')
  ],

  /**
   * Validation du numéro en paramètre
   */
  numeroParam: [
    param('numero')
      .trim()
      .notEmpty().withMessage('Le numéro de commande est obligatoire')
      .matches(/^CMD-\d{8}-\d{4}$/).withMessage('Format de numéro invalide')
  ],

  /**
   * Validation des query params de liste
   */
  listQuery: [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page doit être un entier positif'),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 }).withMessage('Limit doit être entre 1 et 50'),

    query('statut')
      .optional()
      .isIn(['EN_ATTENTE', 'PAYEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE', 'ANNULEE'])
      .withMessage('Statut invalide'),

    query('dateDebut')
      .optional()
      .isISO8601().withMessage('Date de début invalide'),

    query('dateFin')
      .optional()
      .isISO8601().withMessage('Date de fin invalide')
  ]
};

module.exports = orderValidators;
