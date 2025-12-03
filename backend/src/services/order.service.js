/**
 * Service Commandes
 * @description Logique métier pour les commandes
 */

const orderRepository = require('../repositories/order.repository');
const productRepository = require('../repositories/product.repository');
const logger = require('../config/logger');
const { ApiError } = require('../middlewares/errorHandler');

class OrderService {
  // Statuts de commande valides
  static STATUTS = {
    EN_ATTENTE: 'EN_ATTENTE',
    PAYEE: 'PAYEE',
    EN_PREPARATION: 'EN_PREPARATION',
    EXPEDIEE: 'EXPEDIEE',
    LIVREE: 'LIVREE',
    ANNULEE: 'ANNULEE'
  };

  // Transitions de statut autorisées
  static TRANSITIONS = {
    EN_ATTENTE: ['PAYEE', 'ANNULEE'],
    PAYEE: ['EN_PREPARATION', 'ANNULEE'],
    EN_PREPARATION: ['EXPEDIEE', 'ANNULEE'],
    EXPEDIEE: ['LIVREE'],
    LIVREE: [],
    ANNULEE: []
  };

  /**
   * Récupère les commandes avec filtres
   */
  async getOrders(options = {}) {
    return orderRepository.findAll(options);
  }

  /**
   * Récupère une commande par ID
   */
  async getOrderById(id, userId = null) {
    const order = await orderRepository.findById(id);
    
    if (!order) {
      throw ApiError.notFound('Commande non trouvée');
    }

    // Vérifier que l'utilisateur a accès à cette commande
    if (userId && order.utilisateurId !== userId) {
      throw ApiError.forbidden('Vous n\'avez pas accès à cette commande');
    }

    return order;
  }

  /**
   * Récupère une commande par numéro
   */
  async getOrderByNumero(numero, userId = null) {
    const order = await orderRepository.findByNumero(numero);
    
    if (!order) {
      throw ApiError.notFound('Commande non trouvée');
    }

    if (userId && order.utilisateurId !== userId) {
      throw ApiError.forbidden('Vous n\'avez pas accès à cette commande');
    }

    return order;
  }

  /**
   * Récupère les commandes d'un utilisateur
   */
  async getUserOrders(userId, options = {}) {
    return orderRepository.findByUser(userId, options);
  }

  /**
   * Crée une nouvelle commande
   */
  async createOrder(userId, data) {
    // Valider les lignes de commande
    if (!data.lignes || data.lignes.length === 0) {
      throw ApiError.badRequest('La commande doit contenir au moins un produit');
    }

    // Vérifier la disponibilité et calculer les totaux
    let sousTotalHt = 0;
    let totalTva = 0;
    const lignesValidees = [];

    for (const ligne of data.lignes) {
      const product = await productRepository.findById(ligne.produitId);
      
      if (!product) {
        throw ApiError.badRequest(`Produit ${ligne.produitId} non trouvé`);
      }

      if (!product.estActif) {
        throw ApiError.badRequest(`Le produit "${product.nom}" n'est plus disponible`);
      }

      if (product.stockQuantite < ligne.quantite) {
        throw ApiError.badRequest(
          `Stock insuffisant pour "${product.nom}". ` +
          `Disponible: ${product.stockQuantite}, Demandé: ${ligne.quantite}`
        );
      }

      // Utiliser le prix promo si disponible
      const prixUnitaire = product.prixPromo || product.prix;
      const totalLigneHt = prixUnitaire * ligne.quantite;
      const tvaLigne = totalLigneHt * (product.tauxTva / 100);

      lignesValidees.push({
        produitId: product.id,
        quantite: ligne.quantite,
        prixUnitaireHt: prixUnitaire,
        tauxTva: product.tauxTva,
        totalHt: totalLigneHt,
        totalTtc: totalLigneHt + tvaLigne
      });

      sousTotalHt += totalLigneHt;
      totalTva += tvaLigne;
    }

    // Calculer les frais de livraison (gratuit au-dessus de 100€)
    const fraisLivraison = sousTotalHt >= 100 ? 0 : 5.90;
    const totalTtc = sousTotalHt + totalTva + fraisLivraison;

    // Valider l'adresse de livraison
    if (!data.adresseLivraison) {
      throw ApiError.badRequest('L\'adresse de livraison est obligatoire');
    }

    this.validateAddress(data.adresseLivraison);

    // Créer la commande
    const orderData = {
      utilisateurId: userId,
      lignes: lignesValidees,
      adresseLivraison: data.adresseLivraison,
      adresseFacturation: data.adresseFacturation,
      modePaiement: data.modePaiement || 'CARTE',
      sousTotalHt,
      totalTva,
      totalTtc,
      fraisLivraison,
      notes: data.notes
    };

    const order = await orderRepository.create(orderData);

    logger.info(`Commande ${order.numero} créée pour utilisateur ${userId}`);

    return order;
  }

  /**
   * Met à jour le statut d'une commande
   */
  async updateOrderStatus(id, newStatut, notes = null) {
    const order = await orderRepository.findById(id);
    
    if (!order) {
      throw ApiError.notFound('Commande non trouvée');
    }

    // Vérifier que la transition est valide
    const allowedTransitions = OrderService.TRANSITIONS[order.statut];
    if (!allowedTransitions.includes(newStatut)) {
      throw ApiError.badRequest(
        `Transition de statut invalide: ${order.statut} → ${newStatut}. ` +
        `Transitions possibles: ${allowedTransitions.join(', ') || 'aucune'}`
      );
    }

    return orderRepository.updateStatus(id, newStatut, notes);
  }

  /**
   * Annule une commande
   */
  async cancelOrder(id, userId = null, isAdmin = false) {
    const order = await orderRepository.findById(id);
    
    if (!order) {
      throw ApiError.notFound('Commande non trouvée');
    }

    // Vérifier les permissions
    if (!isAdmin && userId && order.utilisateurId !== userId) {
      throw ApiError.forbidden('Vous n\'avez pas accès à cette commande');
    }

    // Vérifier que l'annulation est possible
    const canCancel = OrderService.TRANSITIONS[order.statut].includes('ANNULEE');
    if (!canCancel) {
      throw ApiError.badRequest(
        `Impossible d'annuler une commande avec le statut "${order.statut}"`
      );
    }

    return orderRepository.cancel(id);
  }

  /**
   * Récupère les statistiques des commandes
   */
  async getOrderStats(dateDebut = null, dateFin = null) {
    return orderRepository.getStats(dateDebut, dateFin);
  }

  /**
   * Valide une adresse
   */
  validateAddress(address) {
    const requiredFields = ['nom', 'prenom', 'adresse', 'codePostal', 'ville'];
    
    for (const field of requiredFields) {
      if (!address[field]) {
        throw ApiError.badRequest(`Le champ "${field}" est obligatoire dans l'adresse`);
      }
    }

    // Valider le code postal français
    if (!/^\d{5}$/.test(address.codePostal)) {
      throw ApiError.badRequest('Le code postal doit contenir 5 chiffres');
    }
  }
}

module.exports = new OrderService();
