/**
 * Stats Repository - VERSION FINALE
 * @description Requêtes SQL pour les statistiques dashboard admin
 * 
 * ✅ Compatible avec init.sql (tables françaises, enum MAJUSCULES)
 * ✅ Inclut categorieNom dans getTopProducts
 */

const { query } = require('../config/database');
const logger = require('../config/logger');

class StatsRepository {

  /**
   * Récupère les statistiques complètes du dashboard
   */
  async getDashboardStats(dateDebut, dateFin) {
    try {
      // Construction des conditions de date
      let dateCondition = '';
      const params = [];
      
      if (dateDebut && dateFin) {
        dateCondition = 'WHERE c.date_commande BETWEEN $1 AND $2';
        params.push(dateDebut, dateFin);
      } else if (dateDebut) {
        dateCondition = 'WHERE c.date_commande >= $1';
        params.push(dateDebut);
      } else if (dateFin) {
        dateCondition = 'WHERE c.date_commande <= $1';
        params.push(dateFin);
      }

      // Chiffre d'affaires et commandes (exclut ANNULEE)
      const revenueSQL = `
        SELECT 
          COALESCE(SUM(total_ttc), 0) as chiffre_affaires,
          COUNT(*) as nombre_commandes,
          COALESCE(AVG(total_ttc), 0) as panier_moyen
        FROM commande c
        ${dateCondition}
        ${dateCondition ? 'AND' : 'WHERE'} statut != 'ANNULEE'
      `;

      // Nombre de clients distincts
      const clientsSQL = `
        SELECT COUNT(DISTINCT utilisateur_id) as nombre_clients
        FROM commande c
        ${dateCondition}
      `;

      // Nombre total de produits actifs
      const produitsSQL = `
        SELECT COUNT(*) as nombre_produits
        FROM produit
        WHERE est_actif = true
      `;

      // Produits en stock faible
      const lowStockSQL = `
        SELECT COUNT(*) as produits_stock_faible
        FROM produit
        WHERE stock_quantite <= stock_min_alerte
          AND est_actif = true
      `;

      // Commandes en attente (EN_ATTENTE + CONFIRMEE)
      const pendingSQL = `
        SELECT COUNT(*) as commandes_en_attente
        FROM commande
        WHERE statut IN ('EN_ATTENTE', 'CONFIRMEE')
      `;

      const [revenueResult, clientsResult, produitsResult, lowStockResult, pendingResult] = await Promise.all([
        query(revenueSQL, params),
        query(clientsSQL, params),
        query(produitsSQL),
        query(lowStockSQL),
        query(pendingSQL)
      ]);

      return {
        chiffreAffaires: parseFloat(revenueResult.rows[0].chiffre_affaires) || 0,
        nombreCommandes: parseInt(revenueResult.rows[0].nombre_commandes) || 0,
        panierMoyen: parseFloat(revenueResult.rows[0].panier_moyen) || 0,
        nombreClients: parseInt(clientsResult.rows[0].nombre_clients) || 0,
        nombreProduits: parseInt(produitsResult.rows[0].nombre_produits) || 0,
        produitsStockFaible: parseInt(lowStockResult.rows[0].produits_stock_faible) || 0,
        commandesEnAttente: parseInt(pendingResult.rows[0].commandes_en_attente) || 0
      };
    } catch (error) {
      logger.error('Erreur getDashboardStats', { error: error.message });
      throw error;
    }
  }

  /**
   * Récupère l'évolution du CA avec groupBy
   */
  async getEvolution(dateDebut, dateFin, groupBy = 'day') {
    try {
      let dateCondition = '';
      const params = [];
      
      if (dateDebut && dateFin) {
        dateCondition = 'WHERE c.date_commande BETWEEN $1 AND $2';
        params.push(dateDebut, dateFin);
      } else if (dateDebut) {
        dateCondition = 'WHERE c.date_commande >= $1';
        params.push(dateDebut);
      } else if (dateFin) {
        dateCondition = 'WHERE c.date_commande <= $1';
        params.push(dateFin);
      }

      // Format de date selon groupBy
      let dateFormat;
      switch (groupBy) {
      case 'week':
        dateFormat = "TO_CHAR(DATE_TRUNC('week', c.date_commande), 'IYYY-IW')";
        break;
      case 'month':
        dateFormat = "TO_CHAR(c.date_commande, 'YYYY-MM')";
        break;
      case 'day':
      default:
        dateFormat = "TO_CHAR(c.date_commande, 'YYYY-MM-DD')";
        break;
    }

      const sql = `
        SELECT 
          ${dateFormat} as periode,
          COALESCE(SUM(total_ttc), 0) as montant,
          COUNT(*) as nombre_commandes,
          COALESCE(AVG(total_ttc), 0) as panier_moyen
        FROM commande c
        ${dateCondition}
        ${dateCondition ? 'AND' : 'WHERE'} statut != 'ANNULEE'
        GROUP BY ${dateFormat}
        ORDER BY periode ASC
      `;

      const result = await query(sql, params);
      
      return result.rows.map(row => ({
        periode: row.periode,
        montant: parseFloat(row.montant) || 0,
        nombreCommandes: parseInt(row.nombre_commandes) || 0,
        panierMoyen: parseFloat(row.panier_moyen) || 0
      }));
    } catch (error) {
      logger.error('Erreur getEvolution', { error: error.message });
      throw error;
    }
  }

  /**
   * Récupère le top des catégories par ventes
   */
  async getTopCategories(dateDebut, dateFin, limit = 5) {
    try {
      let dateCondition = '';
      const params = [limit];
      let paramIndex = 2;
      
      if (dateDebut && dateFin) {
        dateCondition = `AND c.date_commande BETWEEN $${paramIndex++} AND $${paramIndex++}`;
        params.push(dateDebut, dateFin);
      } else if (dateDebut) {
        dateCondition = `AND c.date_commande >= $${paramIndex++}`;
        params.push(dateDebut);
      } else if (dateFin) {
        dateCondition = `AND c.date_commande <= $${paramIndex++}`;
        params.push(dateFin);
      }

      const sql = `
        SELECT 
          cat.id,
          cat.nom,
          COALESCE(SUM(lc.quantite * lc.prix_unitaire_ht), 0) as montant_total,
          COALESCE(SUM(lc.quantite), 0) as quantite_totale,
          COUNT(DISTINCT c.id) as nombre_commandes
        FROM categorie cat
        LEFT JOIN produit p ON p.categorie_id = cat.id
        LEFT JOIN ligne_commande lc ON lc.produit_id = p.id
        LEFT JOIN commande c ON c.id = lc.commande_id AND c.statut != 'ANNULEE' ${dateCondition}
        WHERE cat.est_actif = true
        GROUP BY cat.id, cat.nom
        ORDER BY montant_total DESC
        LIMIT $1
      `;

      const result = await query(sql, params);
      
      return result.rows.map(row => ({
        id: row.id,
        nom: row.nom,
        montantTotal: parseFloat(row.montant_total) || 0,
        quantiteTotale: parseInt(row.quantite_totale) || 0,
        nombreCommandes: parseInt(row.nombre_commandes) || 0
      }));
    } catch (error) {
      logger.error('Erreur getTopCategories', { error: error.message });
      throw error;
    }
  }

  /**
   * Récupère le top des produits vendus
   * ✅ Inclut le nom de la catégorie (categorieNom)
   */
  async getTopProducts(dateDebut, dateFin, limit = 5) {
    try {
      let dateCondition = '';
      const params = [limit];
      let paramIndex = 2;
      
      if (dateDebut && dateFin) {
        dateCondition = `AND c.date_commande BETWEEN $${paramIndex++} AND $${paramIndex++}`;
        params.push(dateDebut, dateFin);
      } else if (dateDebut) {
        dateCondition = `AND c.date_commande >= $${paramIndex++}`;
        params.push(dateDebut);
      } else if (dateFin) {
        dateCondition = `AND c.date_commande <= $${paramIndex++}`;
        params.push(dateFin);
      }

      const sql = `
        SELECT 
          p.id,
          p.nom,
          p.reference,
          p.image_url,
          cat.nom as categorie_nom,
          COALESCE(SUM(lc.quantite * lc.prix_unitaire_ht), 0) as montant_total,
          COALESCE(SUM(lc.quantite), 0) as quantite_totale,
          COUNT(DISTINCT c.id) as nombre_commandes
        FROM produit p
        LEFT JOIN categorie cat ON p.categorie_id = cat.id
        LEFT JOIN ligne_commande lc ON lc.produit_id = p.id
        LEFT JOIN commande c ON c.id = lc.commande_id AND c.statut != 'ANNULEE' ${dateCondition}
        WHERE p.est_actif = true
        GROUP BY p.id, p.nom, p.reference, p.image_url, cat.nom
        HAVING SUM(lc.quantite) > 0
        ORDER BY quantite_totale DESC
        LIMIT $1
      `;

      const result = await query(sql, params);
      
      return result.rows.map(row => ({
        id: row.id,
        nom: row.nom,
        reference: row.reference,
        imageUrl: row.image_url,
        categorieNom: row.categorie_nom,  // ← Ajouté pour le frontend
        montantTotal: parseFloat(row.montant_total) || 0,
        quantiteTotale: parseInt(row.quantite_totale) || 0,
        nombreCommandes: parseInt(row.nombre_commandes) || 0
      }));
    } catch (error) {
      logger.error('Erreur getTopProducts', { error: error.message });
      throw error;
    }
  }

  /**
   * Récupère les stats globales avec compteurs par statut
   */
  async getGlobalStats() {
    try {
      const sql = `
        SELECT
          (SELECT COUNT(*) FROM utilisateur WHERE est_actif = true AND role = 'CLIENT') as total_clients,
          (SELECT COUNT(*) FROM produit WHERE est_actif = true) as total_produits,
          (SELECT COUNT(*) FROM categorie WHERE est_actif = true) as total_categories,
          (SELECT COUNT(*) FROM commande) as total_commandes,
          (SELECT COALESCE(SUM(total_ttc), 0) FROM commande WHERE statut != 'ANNULEE') as ca_total,
          (SELECT COUNT(*) FROM commande WHERE statut = 'EN_ATTENTE') as commandes_en_attente,
          (SELECT COUNT(*) FROM commande WHERE statut = 'CONFIRMEE') as commandes_confirmees,
          (SELECT COUNT(*) FROM commande WHERE statut = 'EN_PREPARATION') as commandes_en_preparation,
          (SELECT COUNT(*) FROM commande WHERE statut = 'EXPEDIEE') as commandes_expediees,
          (SELECT COUNT(*) FROM commande WHERE statut = 'LIVREE') as commandes_livrees,
          (SELECT COUNT(*) FROM commande WHERE statut = 'ANNULEE') as commandes_annulees
      `;

      const result = await query(sql);
      const row = result.rows[0];

      return {
        totalClients: parseInt(row.total_clients) || 0,
        totalProduits: parseInt(row.total_produits) || 0,
        totalCategories: parseInt(row.total_categories) || 0,
        totalCommandes: parseInt(row.total_commandes) || 0,
        caTotal: parseFloat(row.ca_total) || 0,
        commandesParStatut: {
          enAttente: parseInt(row.commandes_en_attente) || 0,
          confirmees: parseInt(row.commandes_confirmees) || 0,
          enPreparation: parseInt(row.commandes_en_preparation) || 0,
          expediees: parseInt(row.commandes_expediees) || 0,
          livrees: parseInt(row.commandes_livrees) || 0,
          annulees: parseInt(row.commandes_annulees) || 0
        }
      };
    } catch (error) {
      logger.error('Erreur getGlobalStats', { error: error.message });
      throw error;
    }
  }

  /**
   * Récupère les commandes récentes
   */
  async getRecentOrders(limit = 5) {
    try {
      const sql = `
        SELECT 
          c.id,
          c.numero_commande as numero,
          c.total_ttc,
          c.statut,
          c.date_commande,
          u.nom as client_nom,
          u.prenom as client_prenom,
          u.email as client_email
        FROM commande c
        LEFT JOIN utilisateur u ON c.utilisateur_id = u.id
        ORDER BY c.date_commande DESC
        LIMIT $1
      `;

      const result = await query(sql, [limit]);
      
      return result.rows.map(row => ({
        id: row.id,
        numero: row.numero,
        totalTtc: parseFloat(row.total_ttc) || 0,
        statut: row.statut,
        createdAt: row.date_commande,  // ← Le service transformera en dateCommande
        client: {
          nom: row.client_nom,
          prenom: row.client_prenom,
          email: row.client_email
        }
      }));
    } catch (error) {
      logger.error('Erreur getRecentOrders', { error: error.message });
      throw error;
    }
  }

  /**
   * Récupère les produits avec stock faible
   */
  async getLowStockProducts(limit = 10) {
    try {
      const sql = `
        SELECT 
          p.id,
          p.nom,
          p.reference,
          p.stock_quantite,
          p.stock_min_alerte,
          p.image_url,
          cat.nom as categorie_nom
        FROM produit p
        LEFT JOIN categorie cat ON p.categorie_id = cat.id
        WHERE p.stock_quantite <= p.stock_min_alerte
          AND p.est_actif = true
        ORDER BY p.stock_quantite ASC
        LIMIT $1
      `;

      const result = await query(sql, [limit]);
      
      return result.rows.map(row => ({
        id: row.id,
        nom: row.nom,
        reference: row.reference,
        stockQuantite: parseInt(row.stock_quantite) || 0,
        stockMinAlerte: parseInt(row.stock_min_alerte) || 0,
        imageUrl: row.image_url,
        categorieNom: row.categorie_nom
      }));
    } catch (error) {
      logger.error('Erreur getLowStockProducts', { error: error.message });
      throw error;
    }
  }
}

module.exports = new StatsRepository();
