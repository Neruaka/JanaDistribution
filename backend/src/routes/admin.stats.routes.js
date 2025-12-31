/**
 * Stats Routes (Admin)
 * @description Routes API pour les statistiques dashboard admin
 */

const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats.controller');
const { authenticate, isAdmin } = require('../middlewares/auth.middleware');

// Toutes les routes nécessitent d'être admin
router.use(authenticate, isAdmin);

/**
 * @route   GET /api/admin/stats/dashboard
 * @desc    Récupère toutes les stats du dashboard
 * @access  Admin
 * @query   dateDebut, dateFin, periode (7j, 30j, 90j, 1an, tout)
 */
router.get('/dashboard', statsController.getDashboardStats);

/**
 * @route   GET /api/admin/stats/revenue
 * @desc    Récupère l'évolution du CA par jour
 * @access  Admin
 * @query   dateDebut, dateFin, periode
 */
router.get('/revenue', statsController.getRevenueEvolution);

/**
 * @route   GET /api/admin/stats/top-categories
 * @desc    Récupère le top des catégories par ventes
 * @access  Admin
 * @query   dateDebut, dateFin, periode, limit
 */
router.get('/top-categories', statsController.getTopCategories);

/**
 * @route   GET /api/admin/stats/top-products
 * @desc    Récupère le top des produits vendus
 * @access  Admin
 * @query   dateDebut, dateFin, periode, limit
 */
router.get('/top-products', statsController.getTopProducts);

/**
 * @route   GET /api/admin/stats/global
 * @desc    Récupère les stats globales (compteurs)
 * @access  Admin
 */
router.get('/global', statsController.getGlobalStats);

/**
 * @route   GET /api/admin/stats/comparison
 * @desc    Récupère les stats avec comparaison période précédente
 * @access  Admin
 * @query   dateDebut, dateFin, periode
 */
router.get('/comparison', statsController.getComparisonStats);

/**
 * @route   GET /api/admin/stats/evolution
 * @desc    Récupère l'évolution du CA avec groupBy
 * @access  Admin
 * @query   dateDebut, dateFin, periode, groupBy (day, week, month)
 */
router.get('/evolution', statsController.getEvolution);

/**
 * @route   GET /api/admin/stats/recent-orders
 * @desc    Récupère les commandes récentes
 * @access  Admin
 * @query   limit
 */
router.get('/recent-orders', statsController.getRecentOrders);

/**
 * @route   GET /api/admin/stats/low-stock
 * @desc    Récupère les produits avec stock faible
 * @access  Admin
 * @query   limit
 */
router.get('/low-stock', statsController.getLowStockProducts);

module.exports = router;
