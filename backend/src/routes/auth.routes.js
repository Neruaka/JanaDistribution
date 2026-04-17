/**
 * Routes d'authentification - AVEC MOT DE PASSE OUBLIÉ
 * @description Inscription, connexion, déconnexion, profil, reset password
 * 
 * AJOUTS:
 * - POST /api/auth/forgot-password
 * - POST /api/auth/reset-password
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
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
// RATE LIMITERS SPÉCIFIQUES (password reset)
// Plus strict que le authLimiter global de /api/auth,
// pour prévenir énumération d'emails et brute-force de tokens.
// ==========================================
const passwordResetLimiter = rateLimit({
  windowMs: parseInt(process.env.PASSWORD_RESET_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.PASSWORD_RESET_RATE_LIMIT_MAX_REQUESTS, 10) || 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Trop de tentatives de réinitialisation, veuillez réessayer dans 15 minutes.'
  }
});

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
 * @description Demande de réinitialisation de mot de passe
 * @access Public
 */
router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidation, authController.forgotPassword);

/**
 * POST /api/auth/reset-password
 * @description Réinitialise le mot de passe avec le token
 * @access Public
 */
router.post('/reset-password', passwordResetLimiter, resetPasswordValidation, authController.resetPassword);

// ==========================================
// ROUTES PROTÉGÉES (authentification requise)
// ==========================================

/**
 * POST /api/auth/logout
 * @description Déconnexion de l'utilisateur
 * @access Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * GET /api/auth/me
 * @description Récupère le profil de l'utilisateur connecté
 * @access Private
 */
router.get('/me', authenticate, authController.getProfile);

/**
 * PUT /api/auth/profile
 * @description Met à jour le profil de l'utilisateur
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
 * @description Rafraîchit le token JWT
 * @access Public (refresh token requis)
 */
router.post('/refresh', refreshTokenValidation, authController.refreshToken);


/** * DELETE /api/auth/account
 * @description Supprime définitivement le compte utilisateur
 * @access Private
 */
router.delete('/account', authenticate, authController.deleteAccount);


module.exports = router;

