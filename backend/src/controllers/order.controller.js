/**
 * Order Controller
 * @description Contrôleur pour les endpoints commandes
 */

const orderService = require('../services/order.service');
const { ApiError } = require('../middlewares/errorHandler');

/**
 * POST /api/orders
 * Créer une commande depuis le panier
 */
const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { 
      adresseLivraison, 
      adresseFacturation, 
      modePaiement, 
      fraisLivraison,
      instructionsLivraison 
    } = req.body;
    
    const result = await orderService.createFromCart(userId, {
      adresseLivraison,
      adresseFacturation,
      modePaiement,
      fraisLivraison,
      instructionsLivraison
    });
    
    res.status(201).json({
      success: true,
      data: result.order,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders
 * Récupérer les commandes de l'utilisateur connecté
 */
const getUserOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page, limit, statut } = req.query;
    
    const result = await orderService.getUserOrders(userId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
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
};

/**
 * GET /api/orders/:id
 * Récupérer une commande par ID
 */
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';
    
    // Admin peut voir toutes les commandes
    const order = await orderService.getOrderById(id, isAdmin ? null : userId);
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders/numero/:numero
 * Récupérer une commande par numéro
 */
const getOrderByNumero = async (req, res, next) => {
  try {
    const { numero } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';
    
    const order = await orderService.getOrderByNumero(numero, isAdmin ? null : userId);
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/orders/:id/cancel
 * Annuler une commande (client ou admin)
 */
const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';
    
    const result = await orderService.cancelOrder(id, userId, isAdmin);
    
    res.json({
      success: true,
      data: result.order,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

/**
 * GET /api/admin/orders
 * Récupérer toutes les commandes (admin)
 */
const getAllOrders = async (req, res, next) => {
  try {
    const { page, limit, statut, dateDebut, dateFin, orderBy, orderDir } = req.query;
    
    const result = await orderService.getAllOrders({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      statut,
      dateDebut,
      dateFin,
      orderBy,
      orderDir
    });
    
    res.json({
      success: true,
      data: result.orders,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/orders/:id/status
 * Mettre à jour le statut d'une commande (admin)
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { statut, instructionsLivraison } = req.body;
    
    if (!statut) {
      throw ApiError.badRequest('Le statut est obligatoire');
    }
    
    const validStatuts = ['EN_ATTENTE', 'CONFIRMEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE', 'ANNULEE'];
    if (!validStatuts.includes(statut)) {
      throw ApiError.badRequest(`Statut invalide. Valeurs autorisées: ${validStatuts.join(', ')}`);
    }
    
    const result = await orderService.updateStatus(id, statut, instructionsLivraison);
    
    res.json({
      success: true,
      data: result.order,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/orders/stats
 * Récupérer les statistiques des commandes (admin)
 */
const getOrderStats = async (req, res, next) => {
  try {
    const { dateDebut, dateFin } = req.query;
    
    const stats = await orderService.getStats(dateDebut, dateFin);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Client
  createOrder,
  getUserOrders,
  getOrderById,
  getOrderByNumero,
  cancelOrder,
  // Admin
  getAllOrders,
  updateOrderStatus,
  getOrderStats
};
