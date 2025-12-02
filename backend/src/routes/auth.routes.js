/**
 * Routes d'authentification
 * @description Inscription, connexion, déconnexion
 */

const express = require('express');
const router = express.Router();

// ==========================================
// ROUTES AUTH (à implémenter jour 4-5)
// ==========================================

/**
 * POST /api/auth/register
 * @description Inscription d'un nouvel utilisateur
 */
router.post('/register', (req, res) => {
  // TODO: Jour 4 - Implémenter l'inscription
  res.status(501).json({
    success: false,
    message: 'Route à implémenter (jour 4)'
  });
});

/**
 * POST /api/auth/login
 * @description Connexion d'un utilisateur
 */
router.post('/login', (req, res) => {
  // TODO: Jour 5 - Implémenter la connexion
  res.status(501).json({
    success: false,
    message: 'Route à implémenter (jour 5)'
  });
});

/**
 * POST /api/auth/logout
 * @description Déconnexion
 */
router.post('/logout', (req, res) => {
  // TODO: Jour 5 - Implémenter la déconnexion
  res.status(501).json({
    success: false,
    message: 'Route à implémenter (jour 5)'
  });
});

/**
 * GET /api/auth/me
 * @description Profil de l'utilisateur connecté
 */
router.get('/me', (req, res) => {
  // TODO: Jour 5 - Implémenter le profil
  res.status(501).json({
    success: false,
    message: 'Route à implémenter (jour 5)'
  });
});

/**
 * POST /api/auth/refresh
 * @description Rafraîchir le token JWT
 */
router.post('/refresh', (req, res) => {
  // TODO: Bonus - Implémenter le refresh token
  res.status(501).json({
    success: false,
    message: 'Route à implémenter (bonus)'
  });
});

module.exports = router;
