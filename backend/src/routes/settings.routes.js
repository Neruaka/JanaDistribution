/**
 * Routes Settings
 * @description API pour la gestion des paramètres du site
 * @location backend/src/routes/settings.routes.js
 */

const express = require('express');
const router = express.Router();

// Controller
const settingsController = require('../controllers/settings.controller');

// Middlewares
const { authenticate, requireAdmin } = require('../middlewares/auth.middleware');

// ==========================================
// ROUTES PUBLIQUES (sans authentification)
// ==========================================

/**
 * GET /api/settings/public
 * @description Récupère les paramètres publics du site
 * @access Public
 */
router.get('/public', settingsController.getPublicSettings);

/**
 * GET /api/settings/delivery-fees
 * @description Calcule les frais de livraison pour un montant
 * @query montant - Montant de la commande
 * @access Public
 */
router.get('/delivery-fees', settingsController.getDeliveryFees);

// ==========================================
// ROUTES ADMIN (authentification + admin)
// ==========================================

/**
 * GET /api/admin/settings
 * @description Récupère tous les paramètres (admin)
 * @access Admin
 */
router.get('/admin', authenticate, requireAdmin, settingsController.getAllSettings);

/**
 * PUT /api/admin/settings
 * @description Met à jour tous les paramètres
 * @access Admin
 */
router.put('/admin', authenticate, requireAdmin, settingsController.updateAllSettings);

/**
 * PUT /api/admin/settings/:category
 * @description Met à jour une catégorie de paramètres
 * @access Admin
 */
router.put('/admin/:category', authenticate, requireAdmin, settingsController.updateCategorySettings);

module.exports = router;
