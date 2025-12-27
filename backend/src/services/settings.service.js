/**
 * Service Configuration / Settings
 * @description Logique métier pour la gestion des paramètres du site
 * @location backend/src/services/settings.service.js
 * 
 * ✅ Features:
 * - Cache Redis pour performance
 * - Validation des paramètres
 * - Mise à jour atomique
 */

const settingsRepository = require('../repositories/settings.repository');
const logger = require('../config/logger');

// Optionnel: Redis pour le cache (si disponible)
let redis = null;
try {
  redis = require('../config/redis');
} catch (e) {
  logger.info('Redis non disponible, cache settings désactivé');
}

const CACHE_KEY = 'app:settings';
const CACHE_TTL = 3600; // 1 heure

class SettingsService {
  /**
   * Récupère tous les paramètres (avec cache)
   * @returns {Promise<Object>} Tous les paramètres
   */
  async getAll() {
    // Essayer le cache Redis
    if (redis) {
      try {
        const cached = await redis.get(CACHE_KEY);
        if (cached) {
          logger.debug('Settings récupérés depuis le cache');
          return JSON.parse(cached);
        }
      } catch (err) {
        logger.warn('Erreur cache Redis:', err.message);
      }
    }

    // Charger depuis la BDD
    const settings = await settingsRepository.getAll();

    // Mettre en cache
    if (redis) {
      try {
        await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(settings));
      } catch (err) {
        logger.warn('Erreur mise en cache:', err.message);
      }
    }

    return settings;
  }

  /**
   * Récupère les paramètres publics (pour le frontend)
   * @returns {Promise<Object>} Paramètres publics
   */
  async getPublicSettings() {
    const cacheKey = 'app:settings:public';

    // Essayer le cache Redis
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (err) {
        logger.warn('Erreur cache Redis:', err.message);
      }
    }

    // Charger depuis la BDD
    const settings = await settingsRepository.getPublicSettings();

    // Transformer en format plus pratique pour le frontend
    const formatted = {
      site: {
        nom: settings.site_nom,
        description: settings.site_description,
        email: settings.site_email,
        telephone: settings.site_telephone,
        adresse: settings.site_adresse,
        codePostal: settings.site_code_postal,
        ville: settings.site_ville,
        siret: settings.site_siret
      },
      livraison: {
        fraisStandard: settings.livraison_frais_standard,
        seuilFranco: settings.livraison_seuil_franco,
        delaiMin: settings.livraison_delai_min,
        delaiMax: settings.livraison_delai_max
      },
      commande: {
        montantMin: settings.commande_montant_min,
        produitsParPage: settings.commande_produits_par_page
      }
    };

    // Mettre en cache
    if (redis) {
      try {
        await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(formatted));
      } catch (err) {
        logger.warn('Erreur mise en cache:', err.message);
      }
    }

    return formatted;
  }

  /**
   * Récupère un paramètre spécifique
   * @param {string} cle - Clé du paramètre
   * @returns {Promise<any>} Valeur
   */
  async get(cle) {
    return settingsRepository.get(cle);
  }

  /**
   * Met à jour les paramètres d'une catégorie
   * @param {string} categorie - Nom de la catégorie
   * @param {Object} settings - Paramètres à mettre à jour
   * @returns {Promise<Object>} Résultat
   */
  async updateCategory(categorie, settings) {
    // Valider les paramètres selon la catégorie
    this._validateSettings(categorie, settings);

    // Mettre à jour en BDD
    const updated = await settingsRepository.updateCategory(categorie, settings);

    // Invalider le cache
    await this._invalidateCache();

    logger.info(`Settings catégorie "${categorie}" mis à jour: ${updated} paramètres`);

    return {
      updated,
      categorie
    };
  }

  /**
   * Met à jour tous les paramètres
   * @param {Object} allSettings - Tous les paramètres par catégorie
   * @returns {Promise<Object>} Résultat
   */
  async updateAll(allSettings) {
    // Transformer le format frontend vers le format BDD
    const dbSettings = this._transformToDbFormat(allSettings);

    // Mettre à jour en BDD
    const updated = await settingsRepository.updateAll(dbSettings);

    // Invalider le cache
    await this._invalidateCache();

    logger.info(`Settings globaux mis à jour: ${updated} paramètres`);

    return {
      updated,
      success: true
    };
  }

  /**
   * Récupère les frais de livraison
   * @param {number} montantCommande - Montant de la commande
   * @returns {Promise<number>} Frais de livraison
   */
  async getFraisLivraison(montantCommande = 0) {
    const seuilFranco = await this.get('livraison_seuil_franco') || 150;
    const fraisStandard = await this.get('livraison_frais_standard') || 15;

    // Franco de port si montant >= seuil
    if (montantCommande >= seuilFranco) {
      return 0;
    }

    return fraisStandard;
  }

  /**
   * Invalide le cache Redis
   * @private
   */
  async _invalidateCache() {
    if (redis) {
      try {
        await redis.del(CACHE_KEY);
        await redis.del('app:settings:public');
        logger.debug('Cache settings invalidé');
      } catch (err) {
        logger.warn('Erreur invalidation cache:', err.message);
      }
    }
  }

  /**
   * Transforme le format frontend vers le format BDD
   * @private
   */
  _transformToDbFormat(frontendSettings) {
    const dbSettings = {};

    // General
    if (frontendSettings.general) {
      dbSettings.general = {
        site_nom: frontendSettings.general.nomSite,
        site_description: frontendSettings.general.description,
        site_email: frontendSettings.general.email,
        site_telephone: frontendSettings.general.telephone,
        site_adresse: frontendSettings.general.adresse,
        site_code_postal: frontendSettings.general.codePostal,
        site_ville: frontendSettings.general.ville,
        site_siret: frontendSettings.general.siret,
        site_tva_intra: frontendSettings.general.tvaIntracommunautaire
      };
    }

    // Delivery
    if (frontendSettings.delivery) {
      dbSettings.delivery = {
        livraison_frais_standard: frontendSettings.delivery.fraisLivraisonStandard,
        livraison_seuil_franco: frontendSettings.delivery.seuilFrancoPort,
        livraison_delai_min: frontendSettings.delivery.delaiLivraisonMin,
        livraison_delai_max: frontendSettings.delivery.delaiLivraisonMax,
        livraison_zones: frontendSettings.delivery.zonesLivraison,
        livraison_message_indisponible: frontendSettings.delivery.messageIndisponible
      };
    }

    // Orders
    if (frontendSettings.orders) {
      dbSettings.orders = {
        commande_montant_min: frontendSettings.orders.montantMinCommande,
        commande_tva_defaut: frontendSettings.orders.tauxTvaDefaut,
        commande_stock_alerte: frontendSettings.orders.stockAlerteSeuil,
        commande_produits_par_page: frontendSettings.orders.nombreProduitsParPage,
        commande_autoriser_sans_stock: frontendSettings.orders.autoriserCommandeSansStock,
        commande_email_confirmation: frontendSettings.orders.envoyerEmailConfirmation,
        commande_email_expedition: frontendSettings.orders.envoyerEmailExpedition
      };
    }

    // Emails
    if (frontendSettings.emails) {
      dbSettings.emails = {
        email_expediteur: frontendSettings.emails.expediteur,
        email_nom_expediteur: frontendSettings.emails.nomExpediteur,
        email_copie_admin: frontendSettings.emails.copieAdmin,
        email_admin: frontendSettings.emails.emailAdmin,
        email_signature: frontendSettings.emails.signatureEmail
      };
    }

    return dbSettings;
  }

  /**
   * Valide les paramètres selon la catégorie
   * @private
   */
  _validateSettings(categorie, settings) {
    // Validation basique - peut être étendue
    switch (categorie) {
      case 'delivery':
        if (settings.livraison_frais_standard < 0) {
          throw new Error('Les frais de livraison ne peuvent pas être négatifs');
        }
        if (settings.livraison_seuil_franco < 0) {
          throw new Error('Le seuil franco ne peut pas être négatif');
        }
        break;

      case 'orders':
        if (settings.commande_montant_min < 0) {
          throw new Error('Le montant minimum ne peut pas être négatif');
        }
        break;

      case 'emails':
        if (settings.email_expediteur && !this._isValidEmail(settings.email_expediteur)) {
          throw new Error('Email expéditeur invalide');
        }
        break;
    }
  }

  /**
   * Valide un email
   * @private
   */
  _isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

module.exports = new SettingsService();
