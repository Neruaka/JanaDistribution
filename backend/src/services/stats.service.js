/**
 * Stats Service - VERSION FINALE CORRIGÉE
 * @description Transforme les données du repository au format attendu par AdminDashboard.jsx
 * 
 * ✅ CORRECTIONS APPLIQUÉES:
 * - chiffreAffaires → { total, variation }
 * - commandes → { total, parStatut: { enAttente, confirmees, ... } }
 * - evolution[].montant → evolution[].chiffreAffaires
 * - topCategories[].montantTotal → topCategories[].chiffreAffaires
 * - topProducts avec rang, pourcentageMax, quantiteVendue, categorie
 * - recentOrders avec numeroCommande, dateCommande (pas createdAt)
 */

const statsRepository = require('../repositories/stats.repository');
const logger = require('../config/logger');

class StatsService {
  
  /**
   * Récupère les statistiques complètes du dashboard
   * ✅ Format attendu par AdminDashboard.jsx
   */
  async getDashboardStats({ dateDebut, dateFin, periode }) {
    try {
      // Si période prédéfinie, calculer les dates
      if (periode && !dateDebut && !dateFin) {
        const dates = this.calculatePeriodDates(periode);
        dateDebut = dates.dateDebut;
        dateFin = dates.dateFin;
      }

      logger.info('Récupération stats dashboard', { dateDebut, dateFin, periode });

      // Récupérer les stats brutes du repository
      const stats = await statsRepository.getDashboardStats(dateDebut, dateFin);
      
      // Récupérer les stats globales pour les compteurs par statut
      const globalStats = await statsRepository.getGlobalStats();

      // ✅ Transformation au format EXACT attendu par le frontend
      return {
        chiffreAffaires: {
          total: stats.chiffreAffaires || 0,
          variation: 0  // TODO: implémenter comparaison période précédente
        },
        commandes: {
          total: stats.nombreCommandes || 0,
          variation: 0,
          parStatut: {
            enAttente: globalStats.commandesParStatut?.enAttente || 0,
            confirmees: globalStats.commandesParStatut?.confirmees || 0,
            enPreparation: globalStats.commandesParStatut?.enPreparation || 0,
            expediees: globalStats.commandesParStatut?.expediees || 0,
            livrees: globalStats.commandesParStatut?.livrees || 0,
            annulees: globalStats.commandesParStatut?.annulees || 0
          }
        },
        panierMoyen: {
          total: stats.panierMoyen || 0,
          variation: 0
        },
        clients: {
          total: stats.nombreClients || 0,
          nouveaux: 0,  // TODO: calculer nouveaux clients sur la période
          variation: 0
        },
        produits: {
          actifs: stats.nombreProduits || 0,
          stockFaible: stats.produitsStockFaible || 0,
          rupture: 0  // TODO: calculer produits en rupture totale
        }
      };
    } catch (error) {
      logger.error('Erreur récupération stats dashboard', { error: error.message });
      throw error;
    }
  }

  /**
   * CompatibilitÃ© avec /api/admin/stats/revenue
   * Renvoie le mÃªme format que getEvolution()
   */
  async getRevenueEvolution({ dateDebut, dateFin, periode, groupBy = 'day' }) {
    return this.getEvolution({ dateDebut, dateFin, periode, groupBy });
  }

  /**
   * CompatibilitÃ© avec /api/admin/stats/comparison
   * Compare la pÃ©riode demandÃ©e avec la pÃ©riode prÃ©cÃ©dente de mÃªme durÃ©e
   */
  async getComparisonStats({ dateDebut, dateFin, periode }) {
    try {
      const {
        currentDateDebut,
        currentDateFin,
        previousDateDebut,
        previousDateFin
      } = this.resolveComparisonRanges({ dateDebut, dateFin, periode });

      const currentRaw = await statsRepository.getDashboardStats(currentDateDebut, currentDateFin);

      let previousRaw = null;
      if (previousDateDebut && previousDateFin) {
        previousRaw = await statsRepository.getDashboardStats(previousDateDebut, previousDateFin);
      }

      const current = this.mapComparisonStats(currentRaw);
      const previous = previousRaw ? this.mapComparisonStats(previousRaw) : null;

      return {
        current,
        previous,
        variation: {
          chiffreAffaires: previous ? this.calculateVariation(current.chiffreAffaires, previous.chiffreAffaires) : 0,
          commandes: previous ? this.calculateVariation(current.commandes, previous.commandes) : 0,
          panierMoyen: previous ? this.calculateVariation(current.panierMoyen, previous.panierMoyen) : 0,
          clients: previous ? this.calculateVariation(current.clients, previous.clients) : 0
        },
        periode: {
          dateDebut: currentDateDebut,
          dateFin: currentDateFin,
          previousDateDebut,
          previousDateFin
        }
      };
    } catch (error) {
      logger.error('Erreur rÃ©cupÃ©ration stats comparison', { error: error.message });
      throw error;
    }
  }

  /**
   * Récupère l'évolution du CA
   * ✅ Renomme 'montant' en 'chiffreAffaires' pour le graphique LineChart
   */
  async getEvolution({ dateDebut, dateFin, periode, groupBy = 'day' }) {
    try {
      if (periode && !dateDebut && !dateFin) {
        const dates = this.calculatePeriodDates(periode);
        dateDebut = dates.dateDebut;
        dateFin = dates.dateFin;
      }

      const evolution = await statsRepository.getEvolution(dateDebut, dateFin, groupBy);

      // ✅ Transformation: montant → chiffreAffaires (attendu par le LineChart)
      return {
        evolution: evolution.map(item => ({
          periode: item.periode,
          chiffreAffaires: item.montant || 0,  // ← Le graphique utilise dataKey="chiffreAffaires"
          nombreCommandes: item.nombreCommandes || 0,
          panierMoyen: item.panierMoyen || 0
        }))
      };
    } catch (error) {
      logger.error('Erreur récupération évolution CA', { error: error.message });
      throw error;
    }
  }

  /**
   * Récupère le top des catégories
   * ✅ Renomme 'montantTotal' en 'chiffreAffaires' et ajoute pourcentage/couleur
   */
  async getTopCategories({ dateDebut, dateFin, periode, limit = 5 }) {
    try {
      if (periode && !dateDebut && !dateFin) {
        const dates = this.calculatePeriodDates(periode);
        dateDebut = dates.dateDebut;
        dateFin = dates.dateFin;
      }

      const categories = await statsRepository.getTopCategories(dateDebut, dateFin, limit);

      // Calculer le total pour les pourcentages
      const totalCA = categories.reduce((sum, cat) => sum + (cat.montantTotal || 0), 0);

      // ✅ Transformation avec chiffreAffaires, pourcentage, couleur
      return categories.map((cat, index) => ({
        id: cat.id,
        nom: cat.nom,
        chiffreAffaires: cat.montantTotal || 0,  // ← Le PieChart utilise dataKey="chiffreAffaires"
        quantiteVendue: cat.quantiteTotale || 0,
        nombreCommandes: cat.nombreCommandes || 0,
        pourcentage: totalCA > 0 ? Math.round((cat.montantTotal / totalCA) * 100) : 0,
        couleur: this.getCategoryColor(index)
      }));
    } catch (error) {
      logger.error('Erreur récupération top catégories', { error: error.message });
      throw error;
    }
  }

  /**
   * Récupère le top des produits
   * ✅ Ajoute rang, pourcentageMax, quantiteVendue, categorie pour l'affichage
   */
  async getTopProducts({ dateDebut, dateFin, periode, limit = 5 }) {
    try {
      if (periode && !dateDebut && !dateFin) {
        const dates = this.calculatePeriodDates(periode);
        dateDebut = dates.dateDebut;
        dateFin = dates.dateFin;
      }

      const products = await statsRepository.getTopProducts(dateDebut, dateFin, limit);

      // Trouver le max pour calculer les pourcentages de barre
      const maxQuantite = products.length > 0 
        ? Math.max(...products.map(p => p.quantiteTotale || 0)) 
        : 1;

      // ✅ Transformation avec tous les champs attendus par le frontend
      return products.map((prod, index) => ({
        id: prod.id,
        nom: prod.nom,
        reference: prod.reference,
        imageUrl: prod.imageUrl,
        categorie: prod.categorieNom || 'Non catégorisé',  // ← Attendu par le frontend
        rang: index + 1,  // ← Numéro affiché dans le carré gris
        quantiteVendue: prod.quantiteTotale || 0,  // ← Affiché à droite "X ventes"
        chiffreAffaires: prod.montantTotal || 0,
        nombreCommandes: prod.nombreCommandes || 0,
        pourcentageMax: maxQuantite > 0   // ← Largeur de la barre verte
          ? Math.round((prod.quantiteTotale / maxQuantite) * 100) 
          : 0
      }));
    } catch (error) {
      logger.error('Erreur récupération top produits', { error: error.message });
      throw error;
    }
  }

  /**
   * Récupère les commandes récentes
   * ✅ Utilise numeroCommande et dateCommande (pas createdAt)
   */
  async getRecentOrders(limit = 5) {
    try {
      const orders = await statsRepository.getRecentOrders(limit);

      // ✅ Transformation avec les bons noms de champs
      return orders.map(order => ({
        id: order.id,
        numeroCommande: order.numero,  // ← Frontend utilise order.numeroCommande
        totalTtc: order.totalTtc || 0,
        statut: order.statut,
        dateCommande: order.createdAt,  // ← Frontend utilise new Date(order.dateCommande)
        client: order.client
      }));
    } catch (error) {
      logger.error('Erreur récupération commandes récentes', { error: error.message });
      throw error;
    }
  }

  /**
   * Récupère les produits avec stock faible
   * ✅ Ajoute stock, seuilAlerte, enRupture pour l'affichage
   */
  async getLowStockProducts(limit = 10) {
    try {
      const products = await statsRepository.getLowStockProducts(limit);

      // ✅ Transformation avec les bons noms de champs
      return products.map(prod => ({
        id: prod.id,
        nom: prod.nom,
        reference: prod.reference,
        imageUrl: prod.imageUrl,
        stock: prod.stockQuantite || 0,  // ← Frontend utilise product.stock
        seuilAlerte: prod.stockMinAlerte || 10,  // ← Frontend utilise product.seuilAlerte
        categorie: prod.categorieNom,
        enRupture: (prod.stockQuantite || 0) === 0  // ← Colore en rouge si rupture
      }));
    } catch (error) {
      logger.error('Erreur récupération produits stock faible', { error: error.message });
      throw error;
    }
  }

  /**
   * Récupère les stats globales (compteurs)
   */
  async getGlobalStats() {
    try {
      return await statsRepository.getGlobalStats();
    } catch (error) {
      logger.error('Erreur récupération stats globales', { error: error.message });
      throw error;
    }
  }

  /**
   * Calcule les dates pour une période prédéfinie
   */
  calculatePeriodDates(periode) {
    const now = new Date();
    const dateFin = now.toISOString();
    let dateDebut;

    switch (periode) {
    case '7j':
      dateDebut = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case '30j':
      dateDebut = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case '90j':
      dateDebut = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case '1an':
      dateDebut = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case 'tout':
    default:
      dateDebut = null;
      break;
    }

    return { dateDebut, dateFin: periode === 'tout' ? null : dateFin };
  }

  /**
   * Retourne une couleur pour les catégories du PieChart
   */
  getCategoryColor(index) {
    const colors = [
      '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336',
      '#00BCD4', '#FFEB3B', '#795548', '#607D8B', '#E91E63'
    ];
    return colors[index % colors.length];
  }

  /**
   * Normalise les stats brutes du repository pour la comparaison
   * @private
   */
  mapComparisonStats(raw) {
    return {
      chiffreAffaires: raw?.chiffreAffaires || 0,
      commandes: raw?.nombreCommandes || 0,
      panierMoyen: raw?.panierMoyen || 0,
      clients: raw?.nombreClients || 0,
      produits: raw?.nombreProduits || 0,
      stockFaible: raw?.produitsStockFaible || 0
    };
  }

  /**
   * Calcule un pourcentage de variation
   * @private
   */
  calculateVariation(currentValue, previousValue) {
    if (!previousValue) {
      return currentValue ? 100 : 0;
    }

    const variation = ((currentValue - previousValue) / previousValue) * 100;
    return Number(variation.toFixed(2));
  }

  /**
   * Determine current and previous comparison ranges
   * @private
   */
  resolveComparisonRanges({ dateDebut, dateFin, periode }) {
    // Predefined period takes priority.
    if (periode && !dateDebut && !dateFin) {
      const dates = this.calculatePeriodDates(periode);
      dateDebut = dates.dateDebut;
      dateFin = dates.dateFin;
    }

    // Without explicit dates, fallback to last 30 days.
    if (!dateDebut && !dateFin) {
      const fallback = this.calculatePeriodDates('30j');
      dateDebut = fallback.dateDebut;
      dateFin = fallback.dateFin;
    }

    // If only one bound is provided, complete with "now".
    if (dateDebut && !dateFin) {
      dateFin = new Date().toISOString();
    }

    if (!dateDebut || !dateFin) {
      return {
        currentDateDebut: dateDebut || null,
        currentDateFin: dateFin || null,
        previousDateDebut: null,
        previousDateFin: null
      };
    }

    const currentStart = new Date(dateDebut);
    const currentEnd = new Date(dateFin);

    if (Number.isNaN(currentStart.getTime()) || Number.isNaN(currentEnd.getTime())) {
      throw new Error('PÃ©riode invalide pour la comparaison');
    }

    const durationMs = Math.max(1, currentEnd.getTime() - currentStart.getTime());
    const previousEnd = new Date(currentStart.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - durationMs);

    return {
      currentDateDebut: currentStart.toISOString(),
      currentDateFin: currentEnd.toISOString(),
      previousDateDebut: previousStart.toISOString(),
      previousDateFin: previousEnd.toISOString()
    };
  }
}

module.exports = new StatsService();
