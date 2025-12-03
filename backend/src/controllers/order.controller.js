/**
 * Controller Commandes
 * @description Gestion des requêtes HTTP pour les commandes
 */

const orderService = require('../services/order.service');
const logger = require('../config/logger');

class OrderController {
  /**
   * GET /api/orders
   * Liste des commandes (admin: toutes, client: les siennes)
   */
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 20, statut, dateDebut, dateFin } = req.query;
      const user = req.user;

      const options = {
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 50),
        statut,
        dateDebut,
        dateFin
      };

      // Si ce n'est pas un admin, filtrer par utilisateur
      if (user.role !== 'ADMIN') {
        options.userId = user.id;
      }

      const result = await orderService.getOrders(options);

      res.json({
        success: true,
        data: result.orders,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/orders/my
   * Liste des commandes de l'utilisateur connecté
   */
  async getMyOrders(req, res, next) {
    try {
      const { page = 1, limit = 20, statut } = req.query;

      const result = await orderService.getUserOrders(req.user.id, {
        page: parseInt(page),
        limit: parseInt(limit),
        statut
      });

      res.json({
        success: true,
        data: result.orders,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/orders/stats
   * Statistiques des commandes (admin)
   */
  async getStats(req, res, next) {
    try {
      const { dateDebut, dateFin } = req.query;

      const stats = await orderService.getOrderStats(dateDebut, dateFin);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/orders/:id
   * Détail d'une commande
   */
  async getById(req, res, next) {
    try {
      const user = req.user;
      const isAdmin = user.role === 'ADMIN';

      const order = await orderService.getOrderById(
        req.params.id,
        isAdmin ? null : user.id
      );

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/orders/numero/:numero
   * Détail d'une commande par numéro
   */
  async getByNumero(req, res, next) {
    try {
      const user = req.user;
      const isAdmin = user.role === 'ADMIN';

      const order = await orderService.getOrderByNumero(
        req.params.numero,
        isAdmin ? null : user.id
      );

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/orders
   * Créer une nouvelle commande
   */
  async create(req, res, next) {
    try {
      const order = await orderService.createOrder(req.user.id, req.body);

      res.status(201).json({
        success: true,
        message: `Commande ${order.numero} créée avec succès`,
        data: order
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/orders/:id/status
   * Mettre à jour le statut d'une commande (admin)
   */
  async updateStatus(req, res, next) {
    try {
      const { statut, notes } = req.body;

      if (!statut) {
        return res.status(400).json({
          success: false,
          message: 'Le statut est obligatoire'
        });
      }

      const order = await orderService.updateOrderStatus(
        req.params.id,
        statut,
        notes
      );

      res.json({
        success: true,
        message: `Statut mis à jour: ${statut}`,
        data: order
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/orders/:id/cancel
   * Annuler une commande
   */
  async cancel(req, res, next) {
    try {
      const user = req.user;
      const isAdmin = user.role === 'ADMIN';

      const order = await orderService.cancelOrder(
        req.params.id,
        user.id,
        isAdmin
      );

      res.json({
        success: true,
        message: 'Commande annulée avec succès',
        data: order
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();
