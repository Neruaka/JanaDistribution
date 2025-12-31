/**
 * Stats Controller
 * @description Endpoints API pour les statistiques dashboard admin
 */

const statsService = require('../services/stats.service');
const logger = require('../config/logger');

class StatsController {
  
  /**
   * GET /api/admin/stats/dashboard
   * Récupère toutes les stats du dashboard
   */
  async getDashboardStats(req, res, next) {
    try {
      const { dateDebut, dateFin, periode } = req.query;

      const stats = await statsService.getDashboardStats({
        dateDebut,
        dateFin,
        periode
      });

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Erreur getDashboardStats', { error: error.message });
      next(error);
    }
  }

  /**
   * GET /api/admin/stats/revenue
   * Récupère l'évolution du CA
   */
  async getRevenueEvolution(req, res, next) {
    try {
      const { dateDebut, dateFin, periode } = req.query;

      const evolution = await statsService.getRevenueEvolution({
        dateDebut,
        dateFin,
        periode
      });

      res.json({
        success: true,
        data: evolution
      });
    } catch (error) {
      logger.error('Erreur getRevenueEvolution', { error: error.message });
      next(error);
    }
  }

  /**
   * GET /api/admin/stats/top-categories
   * Récupère le top des catégories
   */
  async getTopCategories(req, res, next) {
    try {
      const { dateDebut, dateFin, periode, limit } = req.query;

      const topCategories = await statsService.getTopCategories({
        dateDebut,
        dateFin,
        periode,
        limit: limit ? parseInt(limit) : 5
      });

      res.json({
        success: true,
        data: topCategories
      });
    } catch (error) {
      logger.error('Erreur getTopCategories', { error: error.message });
      next(error);
    }
  }

  /**
   * GET /api/admin/stats/top-products
   * Récupère le top des produits
   */
  async getTopProducts(req, res, next) {
    try {
      const { dateDebut, dateFin, periode, limit } = req.query;

      const topProducts = await statsService.getTopProducts({
        dateDebut,
        dateFin,
        periode,
        limit: limit ? parseInt(limit) : 5
      });

      res.json({
        success: true,
        data: topProducts
      });
    } catch (error) {
      logger.error('Erreur getTopProducts', { error: error.message });
      next(error);
    }
  }

  /**
   * GET /api/admin/stats/global
   * Récupère les stats globales (compteurs)
   */
  async getGlobalStats(req, res, next) {
    try {
      const stats = await statsService.getGlobalStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Erreur getGlobalStats', { error: error.message });
      next(error);
    }
  }

  /**
   * GET /api/admin/stats/comparison
   * Récupère les stats avec comparaison période précédente
   */
  async getComparisonStats(req, res, next) {
    try {
      const { dateDebut, dateFin, periode } = req.query;

      const comparison = await statsService.getComparisonStats({
        dateDebut,
        dateFin,
        periode
      });

      res.json({
        success: true,
        data: comparison
      });
    } catch (error) {
      logger.error('Erreur getComparisonStats', { error: error.message });
      next(error);
    }
  }

  /**
   * GET /api/admin/stats/evolution
   * Récupère l'évolution du CA avec groupBy
   */
  async getEvolution(req, res, next) {
    try {
      const { dateDebut, dateFin, periode, groupBy } = req.query;

      const evolution = await statsService.getEvolution({
        dateDebut,
        dateFin,
        periode,
        groupBy
      });

      res.json({
        success: true,
        data: evolution
      });
    } catch (error) {
      logger.error('Erreur getEvolution', { error: error.message });
      next(error);
    }
  }

  /**
   * GET /api/admin/stats/recent-orders
   * Récupère les commandes récentes
   */
  async getRecentOrders(req, res, next) {
    try {
      const { limit } = req.query;

      const orders = await statsService.getRecentOrders(
        limit ? parseInt(limit) : 5
      );

      res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      logger.error('Erreur getRecentOrders', { error: error.message });
      next(error);
    }
  }

  /**
   * GET /api/admin/stats/low-stock
   * Récupère les produits avec stock faible
   */
  async getLowStockProducts(req, res, next) {
    try {
      const { limit } = req.query;

      const products = await statsService.getLowStockProducts(
        limit ? parseInt(limit) : 10
      );

      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      logger.error('Erreur getLowStockProducts', { error: error.message });
      next(error);
    }
  }
}

module.exports = new StatsController();
