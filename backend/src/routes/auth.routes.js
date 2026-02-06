/**
 * Routes d'authentification - AVEC MOT DE PASSE OUBLIÃ‰
 * @description Inscription, connexion, dÃ©connexion, profil, reset password
 * 
 * âœ… AJOUTS:
 * - POST /api/auth/forgot-password
 * - POST /api/auth/reset-password
 */

const express = require('express');
const router = express.Router();

// Controllers
const authController = require('../controllers/auth.controller');

// Middlewares
const { authenticate } = require('../middlewares/auth.middleware');

// Validations
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  refreshTokenValidation,
  changePasswordValidation,
  updateProfileValidation
} = require('../validators/auth.validator');

// ==========================================
// ROUTES PUBLIQUES (sans authentification)
// ==========================================

/**
 * POST /api/auth/register
 * @description Inscription d'un nouvel utilisateur
 * @access Public
 */
router.post('/register', registerValidation, authController.register);

/**
 * POST /api/auth/login
 * @description Connexion d'un utilisateur
 * @access Public
 */
router.post('/login', loginValidation, authController.login);

/**
 * POST /api/auth/forgot-password
 * @description Demande de rÃ©initialisation de mot de passe
 * @access Public
 */
router.post('/forgot-password', forgotPasswordValidation, authController.forgotPassword);

/**
 * POST /api/auth/reset-password
 * @description RÃ©initialise le mot de passe avec le token
 * @access Public
 */
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);

// ==========================================
// ROUTES PROTÃ‰GÃ‰ES (authentification requise)
// ==========================================

/**
 * POST /api/auth/logout
 * @description DÃ©connexion de l'utilisateur
 * @access Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * GET /api/auth/me
 * @description RÃ©cupÃ¨re le profil de l'utilisateur connectÃ©
 * @access Private
 */
router.get('/me', authenticate, authController.getProfile);

/**
 * PUT /api/auth/profile
 * @description Met Ã  jour le profil de l'utilisateur
 * @access Private
 */
router.put('/profile', authenticate, updateProfileValidation, authController.updateProfile);

/**
 * PUT /api/auth/password
 * @description Change le mot de passe
 * @access Private
 */
router.put('/password', authenticate, changePasswordValidation, authController.changePassword);

/**
 * POST /api/auth/refresh
 * @description RafraÃ®chit le token JWT
 * @access Public (refresh token requis)
 */
router.post('/refresh', refreshTokenValidation, authController.refreshToken);


/** * DELETE /api/auth/account
 * @description Supprime dÃ©finitivement le compte utilisateur
 * @access Private
 */
router.delete('/account', authenticate, authController.deleteAccount);


module.exports = router;

