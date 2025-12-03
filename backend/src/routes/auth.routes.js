/**
 * Routes d'authentification
 * @description Inscription, connexion, déconnexion, profil
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
 * @access Private
 */
router.post('/refresh', authenticate, authController.refreshToken);

module.exports = router;
