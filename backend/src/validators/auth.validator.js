/**
 * Validations pour l'authentification
 * @description Règles de validation avec express-validator
 */

const { body, validationResult } = require('express-validator');
const { ApiError } = require('../middlewares/errorHandler');

/**
 * Middleware pour vérifier les erreurs de validation
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));

    console.log('❌ Erreurs de validation:', JSON.stringify(errorMessages, null, 2));
    throw ApiError.badRequest('Erreur de validation', errorMessages);
  }
  
  next();
};

/**
 * Validation pour l'inscription
 */
const registerValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('L\'email est obligatoire')
    .isEmail().withMessage('L\'email doit être valide')
    .normalizeEmail({ gmail_remove_dots: false }),

  body('motDePasse')
    .notEmpty().withMessage('Le mot de passe est obligatoire')
    .isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/[a-z]/).withMessage('Le mot de passe doit contenir au moins une minuscule')
    .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir au moins une majuscule')
    .matches(/[0-9]/).withMessage('Le mot de passe doit contenir au moins un chiffre')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Le mot de passe doit contenir au moins un caractère spécial'),

  body('nom')
    .trim()
    .notEmpty().withMessage('Le nom est obligatoire')
    .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('Le nom ne doit contenir que des lettres'),

  body('prenom')
    .trim()
    .notEmpty().withMessage('Le prénom est obligatoire')
    .isLength({ min: 2, max: 100 }).withMessage('Le prénom doit contenir entre 2 et 100 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('Le prénom ne doit contenir que des lettres'),

  body('telephone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/)
    .withMessage('Le numéro de téléphone doit être au format français'),

  body('typeClient')
    .optional()
    .isIn(['PARTICULIER', 'PROFESSIONNEL'])
    .withMessage('Le type de client doit être PARTICULIER ou PROFESSIONNEL'),

  body('siret')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^\d{14}$/)
    .withMessage('Le SIRET doit contenir exactement 14 chiffres'),

  body('raisonSociale')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('La raison sociale ne doit pas dépasser 255 caractères'),

  body('numeroTva')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^FR\d{11}$/)
    .withMessage('Le numéro de TVA doit être au format FRXXXXXXXXXXX'),

  body('accepteCgu')
    .isBoolean().withMessage('accepteCgu doit être un booléen')
    .custom((value) => {
      if (value !== true) {
        throw new Error('Vous devez accepter les conditions générales d\'utilisation');
      }
      return true;
    }),

  body('accepteNewsletter')
    .optional()
    .isBoolean().withMessage('accepteNewsletter doit être un booléen'),

  validate
];

/**
 * Validation pour la connexion
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('L\'email est obligatoire')
    .isEmail().withMessage('L\'email doit être valide')
    .normalizeEmail({ gmail_remove_dots: false }),

  body('motDePasse')
    .notEmpty().withMessage('Le mot de passe est obligatoire'),

  validate
];

/**
 * Validation pour forgot-password
 */
const forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('L\'email est obligatoire')
    .isEmail().withMessage('L\'email doit etre valide')
    .normalizeEmail({ gmail_remove_dots: false }),

  validate
];

/**
 * Validation pour reset-password
 */
const resetPasswordValidation = [
  body('token')
    .trim()
    .notEmpty().withMessage('Le token de reinitialisation est obligatoire')
    .isLength({ min: 64, max: 64 }).withMessage('Le token de reinitialisation est invalide')
    .isHexadecimal().withMessage('Le token de reinitialisation est invalide'),

  body('nouveauMotDePasse')
    .notEmpty().withMessage('Le nouveau mot de passe est obligatoire')
    .isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caracteres')
    .matches(/[a-z]/).withMessage('Le mot de passe doit contenir au moins une minuscule')
    .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir au moins une majuscule')
    .matches(/[0-9]/).withMessage('Le mot de passe doit contenir au moins un chiffre')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Le mot de passe doit contenir au moins un caractere special'),

  validate
];

/**
 * Validation pour le changement de mot de passe
 */
const changePasswordValidation = [
  body('ancienMotDePasse')
    .notEmpty().withMessage('L\'ancien mot de passe est obligatoire'),

  body('nouveauMotDePasse')
    .notEmpty().withMessage('Le nouveau mot de passe est obligatoire')
    .isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/[a-z]/).withMessage('Le mot de passe doit contenir au moins une minuscule')
    .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir au moins une majuscule')
    .matches(/[0-9]/).withMessage('Le mot de passe doit contenir au moins un chiffre')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Le mot de passe doit contenir au moins un caractère spécial')
    .custom((value, { req }) => {
      if (value === req.body.ancienMotDePasse) {
        throw new Error('Le nouveau mot de passe doit être différent de l\'ancien');
      }
      return true;
    }),

  body('confirmationMotDePasse')
    .notEmpty().withMessage('La confirmation du mot de passe est obligatoire')
    .custom((value, { req }) => {
      if (value !== req.body.nouveauMotDePasse) {
        throw new Error('Les mots de passe ne correspondent pas');
      }
      return true;
    }),

  validate
];

/**
 * Validation pour la mise à jour du profil
 */
const updateProfileValidation = [
  body('nom')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('Le nom ne doit contenir que des lettres'),

  body('prenom')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Le prénom doit contenir entre 2 et 100 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('Le prénom ne doit contenir que des lettres'),

  body('telephone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/)
    .withMessage('Le numéro de téléphone doit être au format français'),

  body('accepteNewsletter')
    .optional()
    .isBoolean().withMessage('accepteNewsletter doit être un booléen'),

  validate
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  updateProfileValidation
};
