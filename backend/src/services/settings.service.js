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
const geocodingService = require('./geocoding.service');
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
        const cached = await redis.cacheGet(CACHE_KEY);
        if (cached) {
          logger.debug('Settings récupérés depuis le cache');
          return cached;
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
        await redis.cacheSet(CACHE_KEY, settings, CACHE_TTL);
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
        const cached = await redis.cacheGet(cacheKey);
        if (cached) {
          return cached;
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
        delaiMax: settings.livraison_delai_max,
        modeCalcul: settings.livraison_mode_calcul || 'FIXE',
        prixParKm: settings.livraison_prix_par_km,
        fraisBase: settings.livraison_frais_base,
        distanceMaxKm: settings.livraison_distance_max_km
      },
      commande: {
        montantMin: settings.commande_montant_min,
        produitsParPage: settings.commande_produits_par_page
      }
    };

    // Mettre en cache
    if (redis) {
      try {
        await redis.cacheSet(cacheKey, formatted, CACHE_TTL);
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
    // Détection d'un changement d'adresse du site → invalidation du cache de coordonnées
    const newSite = allSettings.general || {};
    const previousAdresse   = await this.get('site_adresse');
    const previousCp        = await this.get('site_code_postal');
    const previousVille     = await this.get('site_ville');
    const adresseChanged =
      (newSite.adresse !== undefined && newSite.adresse !== previousAdresse) ||
      (newSite.codePostal !== undefined && newSite.codePostal !== previousCp) ||
      (newSite.ville !== undefined && newSite.ville !== previousVille);

    // Transformer le format frontend vers le format BDD
    const dbSettings = this._transformToDbFormat(allSettings);

    // Mettre à jour en BDD
    const updated = await settingsRepository.updateAll(dbSettings);

    // Invalider le cache settings
    await this._invalidateCache();

    // Si l'adresse a changé, on force le re-géocodage du point de départ
    if (adresseChanged) {
      await this.resetDepartCoords();
      logger.info('Adresse du site modifiée → coordonnées de départ réinitialisées');
    }

    logger.info(`Settings globaux mis à jour: ${updated} paramètres`);

    return {
      updated,
      success: true
    };
  }

  /**
   * Récupère les frais de livraison.
   *
   * Si mode = DISTANCE et qu'une adresse est fournie, calcule
   *   frais = frais_base + (distance_km * prix_par_km)
   * et refuse si distance > distance_max_km (0 = illimité).
   * Le franco de port s'applique en priorité dans tous les modes.
   *
   * @param {number} montantCommande - Montant TTC de la commande
   * @param {Object} [adresseLivraison] - Optionnel, requis pour mode DISTANCE
   * @returns {Promise<number|object>} Frais en € (number) ou détail si DISTANCE
   */
  async getFraisLivraison(montantCommande = 0, adresseLivraison = null) {
    const seuilFranco   = (await this.get('livraison_seuil_franco'))   ?? 150;
    const fraisStandard = (await this.get('livraison_frais_standard')) ?? 15;
    const mode          = (await this.get('livraison_mode_calcul'))    || 'FIXE';

    // Franco de port : prioritaire dans tous les modes
    if (montantCommande >= seuilFranco) {
      return 0;
    }

    if (mode !== 'DISTANCE' || !adresseLivraison) {
      return fraisStandard;
    }

    // Mode DISTANCE
    const result = await this.computeDistanceShipping(adresseLivraison);
    if (result === null) {
      // Géocodage échoué ou point de départ non configuré → fallback prix fixe
      logger.warn('Calcul distance impossible, fallback frais fixes', { adresseLivraison });
      return fraisStandard;
    }
    return result.frais;
  }

  /**
   * Calcule les frais de livraison par distance pour une adresse.
   * Renvoie null si impossible (géocodage KO, point de départ manquant).
   *
   * @param {Object} adresseLivraison - { adresse, codePostal, ville }
   * @returns {Promise<{frais:number, distanceKm:number, distanceMaxKm:number, hors_zone:boolean}|null>}
   */
  async computeDistanceShipping(adresseLivraison) {
    const prixParKm    = parseFloat(await this.get('livraison_prix_par_km'))     || 0;
    const fraisBase    = parseFloat(await this.get('livraison_frais_base'))      || 0;
    const distanceMax  = parseFloat(await this.get('livraison_distance_max_km')) || 0;

    const depart = await this._getDepartCoords();
    if (!depart) return null;

    const livraison = await geocodingService.geocode(adresseLivraison);
    if (!livraison) return null;

    const distanceKm = geocodingService.haversineKm(depart, livraison);
    if (distanceKm === null) return null;

    if (distanceMax > 0 && distanceKm > distanceMax) {
      return {
        frais: 0,
        distanceKm,
        distanceMaxKm: distanceMax,
        hors_zone: true
      };
    }

    const frais = Math.round((fraisBase + distanceKm * prixParKm) * 100) / 100;
    return {
      frais,
      distanceKm,
      distanceMaxKm: distanceMax,
      hors_zone: false
    };
  }

  /**
   * Coordonnées GPS du point de départ. Mise en cache dans la table configuration
   * pour éviter de re-géocoder l'adresse du site à chaque commande.
   * @private
   */
  async _getDepartCoords() {
    const cachedLat = await this.get('livraison_depart_lat');
    const cachedLng = await this.get('livraison_depart_lng');
    if (cachedLat && cachedLng) {
      return { lat: parseFloat(cachedLat), lng: parseFloat(cachedLng) };
    }

    const adresse = await this.get('site_adresse');
    const codePostal = await this.get('site_code_postal');
    const ville = await this.get('site_ville');
    if (!ville && !codePostal) return null;

    const coords = await geocodingService.geocode({ adresse, codePostal, ville });
    if (!coords) return null;

    // On cache directement dans la table configuration
    try {
      await settingsRepository.set('livraison_depart_lat', String(coords.lat), 'delivery');
      await settingsRepository.set('livraison_depart_lng', String(coords.lng), 'delivery');
      await this._invalidateCache();
    } catch (err) {
      logger.warn('Impossible de cacher les coordonnées de départ', { error: err.message });
    }

    return { lat: coords.lat, lng: coords.lng };
  }

  /**
   * Force le re-géocodage du point de départ. À appeler après modification
   * de l'adresse de l'entreprise par l'admin.
   */
  async resetDepartCoords() {
    try {
      await settingsRepository.set('livraison_depart_lat', '', 'delivery');
      await settingsRepository.set('livraison_depart_lng', '', 'delivery');
      await this._invalidateCache();
      geocodingService.clearCache();
    } catch (err) {
      logger.warn('Erreur lors du reset des coordonnées de départ', { error: err.message });
    }
  }

  /**
   * Invalide le cache Redis
   * @private
   */
  async _invalidateCache() {
    if (redis) {
      try {
        await redis.cacheDel(CACHE_KEY);
        await redis.cacheDel('app:settings:public');
        logger.debug('Cache settings invalidé');
      } catch (err) {
        logger.warn('Erreur invalidation cache:', err.message);
      }
    }
  }

  /**
   * Transforme le format frontend vers le format BDD
   * @private
   * Note: Frontend utilise general/delivery/orders, BDD utilise site/livraison/commande
   */
  _transformToDbFormat(frontendSettings) {
    const dbSettings = {};

    // General → site
    if (frontendSettings.general) {
      dbSettings.site = {
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

    // Delivery → livraison
    if (frontendSettings.delivery) {
      dbSettings.livraison = {
        livraison_frais_standard: frontendSettings.delivery.fraisLivraisonStandard,
        livraison_seuil_franco: frontendSettings.delivery.seuilFrancoPort,
        livraison_delai_min: frontendSettings.delivery.delaiLivraisonMin,
        livraison_delai_max: frontendSettings.delivery.delaiLivraisonMax,
        livraison_zones: frontendSettings.delivery.zonesLivraison,
        livraison_message_indisponible: frontendSettings.delivery.messageIndisponible
      };

      // Calcul par distance — champs optionnels
      if (frontendSettings.delivery.modeCalcul !== undefined) {
        dbSettings.livraison.livraison_mode_calcul = frontendSettings.delivery.modeCalcul;
      }
      if (frontendSettings.delivery.prixParKm !== undefined) {
        dbSettings.livraison.livraison_prix_par_km = frontendSettings.delivery.prixParKm;
      }
      if (frontendSettings.delivery.fraisBase !== undefined) {
        dbSettings.livraison.livraison_frais_base = frontendSettings.delivery.fraisBase;
      }
      if (frontendSettings.delivery.distanceMaxKm !== undefined) {
        dbSettings.livraison.livraison_distance_max_km = frontendSettings.delivery.distanceMaxKm;
      }
    }

    // Orders → commande
    if (frontendSettings.orders) {
      dbSettings.commande = {
        commande_montant_min: frontendSettings.orders.montantMinCommande,
        commande_tva_defaut: frontendSettings.orders.tauxTvaDefaut,
        commande_stock_alerte: frontendSettings.orders.stockAlerteSeuil,
        commande_produits_par_page: frontendSettings.orders.nombreProduitsParPage,
        commande_autoriser_sans_stock: frontendSettings.orders.autoriserCommandeSansStock,
        commande_email_confirmation: frontendSettings.orders.envoyerEmailConfirmation,
        commande_email_expedition: frontendSettings.orders.envoyerEmailExpedition
      };
    }

    // Emails reste emails
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
