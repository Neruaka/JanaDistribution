/**
 * Controller Settings - VERSION CORRIGÉE
 * @description Gère les requêtes HTTP pour les paramètres du site
 * @location backend/src/controllers/settings.controller.js
 * 
 */

const settingsService = require('../services/settings.service');
const logger = require('../config/logger');

class SettingsController {
  /**
   * GET /api/settings/public
   * Récupère les paramètres publics (accessible sans auth)
   */
  getPublicSettings = async (req, res, next) => {
    try {
      const settings = await settingsService.getPublicSettings();

      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/settings/admin
   * Récupère tous les paramètres (admin only)
   */
  getAllSettings = async (req, res, next) => {
    try {
      const settings = await settingsService.getAll();

      // Transformer en format frontend
      const formatted = this._formatForFrontend(settings);

      res.json({
        success: true,
        data: formatted
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/settings/admin
   * Met à jour tous les paramètres (admin only)
   */
  updateAllSettings = async (req, res, next) => {
    try {
      const allSettings = req.body;

      const result = await settingsService.updateAll(allSettings);

      res.json({
        success: true,
        message: `${result.updated} paramètres mis à jour`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/settings/admin/:category
   * Met à jour les paramètres d'une catégorie (admin only)
   */
  updateCategorySettings = async (req, res, next) => {
    try {
      const { category } = req.params;
      const settings = req.body;

      const result = await settingsService.updateCategory(category, settings);

      res.json({
        success: true,
        message: `Paramètres "${category}" mis à jour`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/settings/delivery-fees
   * Calcule les frais de livraison pour un montant donné
   */
  getDeliveryFees = async (req, res, next) => {
    try {
      const { montant } = req.query;
      const montantCommande = parseFloat(montant) || 0;

      const frais = await settingsService.getFraisLivraison(montantCommande);
      const seuilFranco = await settingsService.get('livraison_seuil_franco');

      res.json({
        success: true,
        data: {
          frais,
          seuilFranco,
          montantCommande,
          francoAtteint: frais === 0
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Formate les settings pour le frontend admin
   * @private
   * Note: La BDD utilise les catégories: site, livraison, commande, emails
   */
  _formatForFrontend(settings) {
    return {
      general: {
        nomSite: settings.site?.site_nom || 'Jana Distribution',
        description: settings.site?.site_description || '',
        email: settings.site?.site_email || '',
        telephone: settings.site?.site_telephone || '',
        adresse: settings.site?.site_adresse || '',
        codePostal: settings.site?.site_code_postal || '',
        ville: settings.site?.site_ville || '',
        siret: settings.site?.site_siret || '',
        tvaIntracommunautaire: settings.site?.site_tva_intra || ''
      },
      delivery: {
        fraisLivraisonStandard: settings.livraison?.livraison_frais_standard || 15,
        seuilFrancoPort: settings.livraison?.livraison_seuil_franco || 150,
        delaiLivraisonMin: settings.livraison?.livraison_delai_min || 2,
        delaiLivraisonMax: settings.livraison?.livraison_delai_max || 5,
        zonesLivraison: settings.livraison?.livraison_zones || 'France métropolitaine',
        messageIndisponible: settings.livraison?.livraison_message_indisponible || ''
      },
      orders: {
        montantMinCommande: settings.commande?.commande_montant_min || 20,
        tauxTvaDefaut: settings.commande?.commande_tva_defaut || 5.5,
        stockAlerteSeuil: settings.commande?.commande_stock_alerte || 10,
        nombreProduitsParPage: settings.commande?.commande_produits_par_page || 12,
        autoriserCommandeSansStock: settings.commande?.commande_autoriser_sans_stock || false,
        envoyerEmailConfirmation: settings.commande?.commande_email_confirmation !== false,
        envoyerEmailExpedition: settings.commande?.commande_email_expedition !== false
      },
      emails: {
        expediteur: settings.emails?.email_expediteur || '',
        nomExpediteur: settings.emails?.email_nom_expediteur || 'Jana Distribution',
        copieAdmin: settings.emails?.email_copie_admin !== false,
        emailAdmin: settings.emails?.email_admin || '',
        signatureEmail: settings.emails?.email_signature || ''
      }
    };
  }
}

module.exports = new SettingsController();
