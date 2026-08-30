/**
 * Order Service
 * @description Logique métier pour la gestion des commandes
 * 
 * ✅ AJOUT: Notifications email automatiques lors des changements de statut
 */

const orderRepository = require('../repositories/order.repository');
const cartRepository = require('../repositories/cart.repository');
const userRepository = require('../repositories/user.repository');
// const productRepository = require('../repositories/product.repository');
const emailService = require('./email.service');
const settingsService = require('./settings.service');
const promoService = require('./promo.service');
const logger = require('../config/logger');
const { ApiError } = require('../middlewares/errorHandler');

// Statuts valides et transitions autorisées
const STATUT_TRANSITIONS = {
  'EN_ATTENTE': ['CONFIRMEE', 'ANNULEE'],
  'CONFIRMEE': ['EN_PREPARATION', 'ANNULEE'],
  'EN_PREPARATION': ['EXPEDIEE'],
  'EXPEDIEE': ['LIVREE'],
  'LIVREE': [],
  'ANNULEE': []
};

// Statuts qui déclenchent une notification email
const NOTIFIABLE_STATUSES = ['CONFIRMEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE', 'ANNULEE'];

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
    
    // Calculer les totaux depuis le panier serveur
    const totalHt = cart.summary.subtotalHT;
    const totalTva = cart.summary.totalTVA;
    const totalPanierTtc = cart.summary.totalTTC;

    // Appliquer le montant minimum côté serveur
    let montantMinCommande = 0;
    try {
      montantMinCommande = await settingsService.get('commande_montant_min') || 0;
    } catch (error) {
      logger.warn('Impossible de récupérer le montant minimum de commande, valeur par défaut appliquée', {
        error: error.message
      });
    }

    if (montantMinCommande > 0 && totalPanierTtc < montantMinCommande) {
      throw ApiError.badRequest(
        `Le montant minimum de commande est de ${montantMinCommande.toFixed(2)}€ TTC`
      );
    }

    // Calcul des frais de livraison strictement côté serveur
    // Inclut le calcul par distance (Haversine) si mode DISTANCE activé
    let fraisLivraison = 0;
    try {
      fraisLivraison = await settingsService.getFraisLivraison(totalPanierTtc, {
        adresse: data.adresseLivraison.adresse,
        codePostal: data.adresseLivraison.codePostal,
        ville: data.adresseLivraison.ville
      });

      // Vérifier que la zone est livrable si mode DISTANCE
      const mode = await settingsService.get('livraison_mode_calcul');
      if (mode === 'DISTANCE' && totalPanierTtc < (await settingsService.get('livraison_seuil_franco') || 150)) {
        const details = await settingsService.computeDistanceShipping({
          adresse: data.adresseLivraison.adresse,
          codePostal: data.adresseLivraison.codePostal,
          ville: data.adresseLivraison.ville
        });
        if (details?.hors_zone) {
          throw ApiError.badRequest(
            `L'adresse est hors zone de livraison (distance > ${details.distanceMaxKm} km)`
          );
        }
      }
    } catch (error) {
      if (error?.statusCode) throw error;
      logger.warn('Impossible de récupérer les frais de livraison dynamiques, fallback appliqué', {
        error: error.message
      });
      fraisLivraison = totalPanierTtc >= 150 ? 0 : 15;
    }

    // Détection d'une tentative de forcer un montant côté client
    if (data.fraisLivraison !== undefined && Number(data.fraisLivraison) !== Number(fraisLivraison)) {
      logger.warn('Frais livraison fournis par le client ignorés', {
        userId,
        clientValue: data.fraisLivraison,
        serverValue: fraisLivraison
      });
    }

    let totalTtc = cart.summary.totalTTC + fraisLivraison;

    // Code promo (optionnel) : validation côté serveur AVANT la transaction de
    // création de commande. Le total transmis par le client n'est jamais
    // utilisé — le rabais est calculé sur le total recalculé serveur.
    // Note (limite connue du MVP) : la re-vérification finale des limites
    // d'utilisation (globale / par client) a lieu DANS la transaction
    // (order.repository.js#create, avec verrou SELECT ... FOR UPDATE sur la
    // ligne code_promo) pour éviter un dépassement sous forte concurrence.
    // Cette validation préalable sert surtout à retourner une erreur claire
    // au client sans ouvrir de transaction inutilement.
    let promoInfo = null;
    if (data.codePromo) {
      const totalAvantRabais = totalTtc;
      const validation = await promoService.validerCode(data.codePromo, userId, totalAvantRabais);
      promoInfo = {
        codePromoId: validation.codePromo.id,
        montantRabais: validation.montantRabais,
        totalAvantRabais
      };
      totalTtc = validation.totalApresRabais;
    }

    // Créer la commande
    const orderData = {
      utilisateurId: userId,
      cartId: cart.id,
      adresseLivraison: data.adresseLivraison,
      adresseFacturation: data.adresseFacturation || data.adresseLivraison,
      modePaiement: data.modePaiement || 'ESPECES',
      fraisLivraison,
      instructionsLivraison: data.instructionsLivraison,
      totalHt,
      totalTva,
      totalTtc,
      lignes,
      ...(promoInfo && {
        codePromoId: promoInfo.codePromoId,
        montantRabais: promoInfo.montantRabais,
        totalAvantRabais: promoInfo.totalAvantRabais
      })
    };

    const order = await orderRepository.create(orderData);
    
    logger.info('Commande créée depuis panier', {
      userId,
      orderId: order.id,
      numeroCommande: order.numeroCommande,
      totalTtc
    });

    // ✅ Envoyer email de confirmation de commande
    await this._sendOrderNotification(userId, order, null, 'EN_ATTENTE');
    
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
    const { page = 1, limit = 10, statut, dateDebut, dateFin, orderBy = 'createdAt', orderDir = 'DESC' } = options;

    const result = await orderRepository.findByUser(userId, {
      page,
      limit,
      statut,
      dateDebut,
      dateFin,
      orderBy,
      orderDir
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
    const allowedTransitions = STATUT_TRANSITIONS[order.statut];
    
    if (!allowedTransitions || !allowedTransitions.includes(newStatut)) {
      throw ApiError.badRequest(
        `Transition de statut invalide: ${order.statut} → ${newStatut}. ` +
        `Transitions autorisées: ${allowedTransitions?.join(', ') || 'aucune'}`
      );
    }
    
    // Si annulation, utiliser cancelOrder() qui restaure le stock
    if (newStatut === 'ANNULEE') {
      logger.info('Annulation via updateStatus, redirection vers cancelOrder', { orderId });
      return this.cancelOrder(orderId, null, true); // isAdmin = true
    }
    
    const updatedOrder = await orderRepository.updateStatus(orderId, newStatut, instructionsLivraison);
    
    logger.info('Statut commande mis à jour', {
      orderId,
      oldStatut,
      newStatut,
      numeroCommande: order.numeroCommande
    });

    // ✅ Envoyer notification email
    await this._sendOrderNotification(order.utilisateurId, updatedOrder, oldStatut, newStatut);
    
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
    
    logger.info('Commande annulée', {
      orderId,
      numeroCommande: order.numeroCommande,
      byAdmin: isAdmin,
      userId
    });

    // ✅ Envoyer notification email d'annulation
    await this._sendOrderNotification(order.utilisateurId, cancelledOrder, oldStatut, 'ANNULEE');
    
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
  // ✅ NOTIFICATIONS EMAIL
  // ==========================================

  /**
   * Envoie une notification email pour un changement de statut
   * @private
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} order - La commande
   * @param {string} oldStatus - Ancien statut (null si nouvelle commande)
   * @param {string} newStatus - Nouveau statut
   */
  async _sendOrderNotification(userId, order, oldStatus, newStatus) {
    try {
      // Récupérer l'utilisateur
      const user = await userRepository.findById(userId);
      
      if (!user) {
        logger.warn(`Utilisateur non trouvé pour notification: ${userId}`);
        return;
      }

      // ✅ Vérifier si l'utilisateur a activé les notifications
      // Par défaut true si la propriété n'existe pas (rétrocompatibilité)
      if (user.notificationsCommandes === false) {
        logger.info(`Notifications commandes désactivées pour ${user.email}`);
        return;
      }

      // Envoyer l'email via le service existant
      if (NOTIFIABLE_STATUSES.includes(newStatus) || newStatus === 'EN_ATTENTE') {
        await emailService.sendOrderStatusEmail(order, oldStatus, newStatus, user);
        logger.info(`📧 Email statut "${newStatus}" envoyé pour commande ${order.numeroCommande} à ${user.email}`);
      }
    } catch (error) {
      // Ne pas bloquer la commande si l'email échoue
      logger.error('Erreur envoi notification email:', {
        error: error.message,
        orderId: order.id,
        userId,
        newStatus
      });
    }
  }
}

module.exports = new OrderService();
