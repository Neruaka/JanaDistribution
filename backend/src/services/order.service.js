/**
 * Order Service - AVEC NOTIFICATIONS EMAIL
 * @description Logique métier pour la gestion des commandes
 * 
 * ✅ AJOUT:
 * - Envoi d'email au changement de statut de commande
 */

const orderRepository = require('../repositories/order.repository');
const cartRepository = require('../repositories/cart.repository');
const productRepository = require('../repositories/product.repository');
const userRepository = require('../repositories/user.repository');
const logger = require('../config/logger');
const { ApiError } = require('../middlewares/errorHandler');
const emailService = require('./email.service');

// Statuts valides et transitions autorisées
const STATUT_TRANSITIONS = {
  'EN_ATTENTE': ['CONFIRMEE', 'ANNULEE'],
  'CONFIRMEE': ['EN_PREPARATION', 'ANNULEE'],
  'EN_PREPARATION': ['EXPEDIEE'],
  'EXPEDIEE': ['LIVREE'],
  'LIVREE': [],
  'ANNULEE': []
};

class OrderService {
  
  /**
   * Créer une commande à partir du panier
   * @param {string} userId - UUID de l'utilisateur
   * @param {Object} data - Données de la commande (adresses, paiement, etc.)
   * @returns {Object} La commande créée
   */
  async createFromCart(userId, data) {
    // Récupérer le panier
    const cart = await cartRepository.getOrCreateCart(userId);
    
    if (!cart.items || cart.items.length === 0) {
      throw ApiError.badRequest('Le panier est vide');
    }
    
    // Valider tous les items du panier
    const validationErrors = [];
    const lignes = [];
    
    for (const item of cart.items) {
      // Vérifier que le produit est toujours actif
      if (!item.product.isActive) {
        validationErrors.push({
          type: 'PRODUCT_INACTIVE',
          productName: item.product.name,
          message: `"${item.product.name}" n'est plus disponible`
        });
        continue;
      }
      
      // Vérifier le stock
      if (item.product.stock < item.quantity) {
        validationErrors.push({
          type: 'INSUFFICIENT_STOCK',
          productName: item.product.name,
          available: item.product.stock,
          requested: item.quantity,
          message: `Stock insuffisant pour "${item.product.name}" (${item.product.stock} disponible)`
        });
        continue;
      }
      
      // Préparer la ligne de commande
      lignes.push({
        produitId: item.productId,
        nomProduit: item.product.name,
        quantite: item.quantity,
        prixUnitaireHt: item.effectivePrice,
        tauxTva: item.product.tvaRate
      });
    }
    
    // Si des erreurs de validation, on arrête
    if (validationErrors.length > 0) {
      throw ApiError.badRequest('Certains produits ne sont pas disponibles', {
        errors: validationErrors
      });
    }
    
    // Valider l'adresse de livraison
    if (!data.adresseLivraison) {
      throw ApiError.badRequest('L\'adresse de livraison est obligatoire');
    }
    
    const requiredFields = ['nom', 'prenom', 'adresse', 'codePostal', 'ville'];
    for (const field of requiredFields) {
      if (!data.adresseLivraison[field]) {
        throw ApiError.badRequest(`Le champ "${field}" est obligatoire dans l'adresse de livraison`);
      }
    }
    
    // Calculer les totaux
    const fraisLivraison = data.fraisLivraison || 0;
    const totalHt = cart.summary.subtotalHT;
    const totalTva = cart.summary.totalTVA;
    const totalTtc = cart.summary.totalTTC + fraisLivraison;
    
    // Créer la commande
    const orderData = {
      utilisateurId: userId,
      adresseLivraison: data.adresseLivraison,
      adresseFacturation: data.adresseFacturation || data.adresseLivraison,
      modePaiement: data.modePaiement || 'CARTE',
      fraisLivraison,
      instructionsLivraison: data.instructionsLivraison,
      totalHt,
      totalTva,
      totalTtc,
      lignes
    };
    
    const order = await orderRepository.create(orderData);
    
    // Vider le panier après création de la commande
    await cartRepository.clearCart(cart.id);
    
    logger.info(`Commande créée depuis panier`, {
      userId,
      orderId: order.id,
      numeroCommande: order.numeroCommande,
      totalTtc
    });

    // ✅ AJOUT: Envoyer email de confirmation de commande
    this._sendOrderStatusEmail(order, null, 'EN_ATTENTE', userId).catch(err => {
      logger.error('Erreur envoi email nouvelle commande:', err.message);
    });
    
    return {
      order,
      message: `Commande ${order.numeroCommande} créée avec succès`
    };
  }
  
  /**
   * Récupérer les commandes de l'utilisateur
   * @param {string} userId - UUID de l'utilisateur
   * @param {Object} options - Options de pagination/filtres
   * @returns {Object} Liste des commandes avec pagination
   */
  async getUserOrders(userId, options = {}) {
    const { page = 1, limit = 10, statut } = options;
    
    const result = await orderRepository.findByUser(userId, {
      page,
      limit,
      statut,
      orderBy: 'createdAt',
      orderDir: 'DESC'
    });
    
    return result;
  }
  
  /**
   * Récupérer une commande par ID
   * @param {string} orderId - UUID de la commande
   * @param {string} userId - UUID de l'utilisateur (pour vérification)
   * @returns {Object} La commande
   */
  async getOrderById(orderId, userId = null) {
    const order = await orderRepository.findById(orderId);
    
    if (!order) {
      throw ApiError.notFound('Commande non trouvée');
    }
    
    // Si userId fourni, vérifier que la commande appartient à l'utilisateur
    if (userId && order.utilisateurId !== userId) {
      throw ApiError.forbidden('Vous n\'avez pas accès à cette commande');
    }
    
    return order;
  }
  
  /**
   * Récupérer une commande par numéro
   * @param {string} numero - Numéro de la commande (ex: CMD-20251205-0001)
   * @param {string} userId - UUID de l'utilisateur (pour vérification)
   * @returns {Object} La commande
   */
  async getOrderByNumero(numero, userId = null) {
    const order = await orderRepository.findByNumero(numero);
    
    if (!order) {
      throw ApiError.notFound('Commande non trouvée');
    }
    
    // Si userId fourni, vérifier que la commande appartient à l'utilisateur
    if (userId && order.utilisateurId !== userId) {
      throw ApiError.forbidden('Vous n\'avez pas accès à cette commande');
    }
    
    return order;
  }
  
  /**
   * Mettre à jour le statut d'une commande (admin)
   * @param {string} orderId - UUID de la commande
   * @param {string} newStatut - Nouveau statut
   * @param {string} instructionsLivraison - Instructions optionnelles
   * @returns {Object} La commande mise à jour
   */
  async updateStatus(orderId, newStatut, instructionsLivraison = null) {
    const order = await orderRepository.findById(orderId);
    
    if (!order) {
      throw ApiError.notFound('Commande non trouvée');
    }
    
    const oldStatut = order.statut;
    
    // Vérifier que la transition est valide
    const allowedTransitions = STATUT_TRANSITIONS[oldStatut];
    
    if (!allowedTransitions || !allowedTransitions.includes(newStatut)) {
      throw ApiError.badRequest(
        `Transition de statut invalide: ${oldStatut} → ${newStatut}. ` +
        `Transitions autorisées: ${allowedTransitions?.join(', ') || 'aucune'}`
      );
    }
    
    // Si annulation, utiliser cancelOrder() qui restaure le stock
    if (newStatut === 'ANNULEE') {
      logger.info(`Annulation via updateStatus, redirection vers cancelOrder`, { orderId });
      return this.cancelOrder(orderId, null, true); // isAdmin = true
    }
    
    const updatedOrder = await orderRepository.updateStatus(orderId, newStatut, instructionsLivraison);
    
    logger.info(`Statut commande mis à jour`, {
      orderId,
      oldStatut,
      newStatut,
      numeroCommande: order.numeroCommande
    });
    
    // ✅ AJOUT: Envoyer email de notification
    this._sendOrderStatusEmail(updatedOrder, oldStatut, newStatut, order.utilisateurId).catch(err => {
      logger.error('Erreur envoi email changement statut:', err.message);
    });
    
    return {
      order: updatedOrder,
      message: `Commande ${order.numeroCommande} mise à jour: ${newStatut}`
    };
  }
  
  /**
   * Annuler une commande
   * @param {string} orderId - UUID de la commande
   * @param {string} userId - UUID de l'utilisateur (pour vérification client)
   * @param {boolean} isAdmin - Si l'appelant est admin
   * @returns {Object} La commande annulée
   */
  async cancelOrder(orderId, userId = null, isAdmin = false) {
    const order = await orderRepository.findById(orderId);
    
    if (!order) {
      throw ApiError.notFound('Commande non trouvée');
    }
    
    const oldStatut = order.statut;
    
    // Vérifier les permissions
    if (!isAdmin && userId && order.utilisateurId !== userId) {
      throw ApiError.forbidden('Vous n\'avez pas accès à cette commande');
    }
    
    // Un client ne peut annuler que les commandes EN_ATTENTE
    if (!isAdmin && order.statut !== 'EN_ATTENTE') {
      throw ApiError.badRequest(
        'Vous ne pouvez annuler que les commandes en attente. ' +
        'Contactez le service client pour les autres cas.'
      );
    }
    
    // Vérifier que la commande peut être annulée (admin peut annuler EN_ATTENTE et CONFIRMEE)
    if (!['EN_ATTENTE', 'CONFIRMEE'].includes(order.statut)) {
      throw ApiError.badRequest(
        `Impossible d'annuler une commande ${order.statut.toLowerCase().replace('_', ' ')}`
      );
    }
    
    // cancel() dans le repository restaure le stock
    const cancelledOrder = await orderRepository.cancel(orderId);
    
    logger.info(`Commande annulée`, {
      orderId,
      numeroCommande: order.numeroCommande,
      byAdmin: isAdmin,
      userId
    });
    
    // ✅ AJOUT: Envoyer email de notification d'annulation
    this._sendOrderStatusEmail(cancelledOrder, oldStatut, 'ANNULEE', order.utilisateurId).catch(err => {
      logger.error('Erreur envoi email annulation:', err.message);
    });
    
    return {
      order: cancelledOrder,
      message: `Commande ${order.numeroCommande} annulée. Le stock a été restauré.`
    };
  }
  
  /**
   * Récupérer toutes les commandes (admin)
   * @param {Object} options - Options de pagination/filtres
   * @returns {Object} Liste des commandes avec pagination
   */
  async getAllOrders(options = {}) {
    const {
      page = 1,
      limit = 20,
      statut,
      dateDebut,
      dateFin,
      orderBy = 'createdAt',
      orderDir = 'DESC'
    } = options;
    
    return orderRepository.findAll({
      page,
      limit,
      statut,
      dateDebut,
      dateFin,
      orderBy,
      orderDir
    });
  }
  
  /**
   * Récupérer les statistiques des commandes (admin)
   * @param {Date} dateDebut - Date de début (optionnel)
   * @param {Date} dateFin - Date de fin (optionnel)
   * @returns {Object} Statistiques
   */
  async getStats(dateDebut = null, dateFin = null) {
    return orderRepository.getStats(dateDebut, dateFin);
  }
  
  /**
   * Obtenir le libellé d'un statut
   * @param {string} statut - Code du statut
   * @returns {string} Libellé français
   */
  getStatutLabel(statut) {
    const labels = {
      'EN_ATTENTE': 'En attente',
      'CONFIRMEE': 'Confirmée',
      'EN_PREPARATION': 'En préparation',
      'EXPEDIEE': 'Expédiée',
      'LIVREE': 'Livrée',
      'ANNULEE': 'Annulée'
    };
    return labels[statut] || statut;
  }
  
  /**
   * Obtenir les transitions possibles pour un statut
   * @param {string} statut - Statut actuel
   * @returns {Array} Liste des statuts possibles
   */
  getPossibleTransitions(statut) {
    return STATUT_TRANSITIONS[statut] || [];
  }

  // ==========================================
  // ✅ MÉTHODE PRIVÉE : ENVOI EMAIL
  // ==========================================

  /**
   * Envoie un email de notification de changement de statut
   * @private
   * @param {Object} order - La commande
   * @param {string} oldStatus - Ancien statut (null si nouvelle commande)
   * @param {string} newStatus - Nouveau statut
   * @param {string} userId - ID de l'utilisateur
   */
  async _sendOrderStatusEmail(order, oldStatus, newStatus, userId) {
    try {
      // Récupérer les infos de l'utilisateur
      const user = await userRepository.findById(userId);
      
      if (!user || !user.email) {
        logger.warn(`Impossible d'envoyer email: utilisateur ${userId} introuvable`);
        return;
      }

      // Envoyer l'email
      await emailService.sendOrderStatusEmail(order, oldStatus, newStatus, user);
      
    } catch (error) {
      // On log l'erreur mais on ne bloque pas le processus
      logger.error('Erreur dans _sendOrderStatusEmail:', error.message);
    }
  }
}

module.exports = new OrderService();
