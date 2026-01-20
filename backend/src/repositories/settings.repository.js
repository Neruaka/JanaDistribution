/**
 * Repository Configuration / Settings
 * @description Accès aux données de la table configuration
 * @location backend/src/repositories/settings.repository.js
 */

const { query } = require('../config/database');
const logger = require('../config/logger');

class SettingsRepository {
  /**
   * Récupère tous les paramètres
   * @returns {Promise<Object>} Paramètres groupés par catégorie
   */
  async getAll() {
    const sql = `
      SELECT cle, valeur, type, categorie, description
      FROM configuration
      ORDER BY categorie, cle
    `;

    const result = await query(sql);
    
    // Grouper par catégorie et convertir les types
    const settings = {};
    
    for (const row of result.rows) {
      if (!settings[row.categorie]) {
        settings[row.categorie] = {};
      }
      
      settings[row.categorie][row.cle] = this._convertValue(row.valeur, row.type);
    }

    return settings;
  }

  /**
   * Récupère les paramètres d'une catégorie
   * @param {string} categorie - Nom de la catégorie
   * @returns {Promise<Object>} Paramètres de la catégorie
   */
  async getByCategory(categorie) {
    const sql = `
      SELECT cle, valeur, type, description
      FROM configuration
      WHERE categorie = $1
      ORDER BY cle
    `;

    const result = await query(sql, [categorie]);
    
    const settings = {};
    for (const row of result.rows) {
      settings[row.cle] = this._convertValue(row.valeur, row.type);
    }

    return settings;
  }

  /**
   * Récupère un paramètre spécifique
   * @param {string} cle - Clé du paramètre
   * @returns {Promise<any>} Valeur du paramètre
   */
  async get(cle) {
    const sql = `
      SELECT valeur, type
      FROM configuration
      WHERE cle = $1
    `;

    const result = await query(sql, [cle]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this._convertValue(result.rows[0].valeur, result.rows[0].type);
  }

  /**
   * Met à jour ou crée un paramètre (UPSERT)
   * @param {string} cle - Clé du paramètre
   * @param {any} valeur - Nouvelle valeur
   * @param {string} categorie - Catégorie (pour insertion si clé n'existe pas)
   * @returns {Promise<boolean>} Succès
   */
  async set(cle, valeur, categorie = 'general') {
    // Convertir la valeur en string pour stockage
    const valeurStr = typeof valeur === 'object'
      ? JSON.stringify(valeur)
      : String(valeur);

    // Déterminer le type automatiquement
    let type = 'string';
    if (typeof valeur === 'number') type = 'number';
    else if (typeof valeur === 'boolean') type = 'boolean';
    else if (typeof valeur === 'object') type = 'json';

    // UPSERT: INSERT ou UPDATE si existe déjà
    const sql = `
      INSERT INTO configuration (cle, valeur, type, categorie, date_modification)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (cle) DO UPDATE SET
        valeur = EXCLUDED.valeur,
        date_modification = CURRENT_TIMESTAMP
      RETURNING cle
    `;

    const result = await query(sql, [cle, valeurStr, type, categorie]);

    if (result.rows.length > 0) {
      logger.debug(`Setting mis à jour: ${cle}`);
      return true;
    }

    return false;
  }

  /**
   * Met à jour plusieurs paramètres d'une catégorie
   * @param {string} categorie - Nom de la catégorie
   * @param {Object} settings - Objet clé/valeur des paramètres
   * @returns {Promise<number>} Nombre de paramètres mis à jour
   */
  async updateCategory(categorie, settings) {
    let updated = 0;

    for (const [cle, valeur] of Object.entries(settings)) {
      // Passer la catégorie pour que les nouvelles clés soient créées avec la bonne catégorie
      const success = await this.set(cle, valeur, categorie);
      if (success) updated++;
    }

    logger.info(`${updated} settings mis à jour dans la catégorie: ${categorie}`);
    return updated;
  }

  /**
   * Met à jour tous les paramètres
   * @param {Object} allSettings - Objet avec catégories et leurs paramètres
   * @returns {Promise<number>} Nombre total de paramètres mis à jour
   */
  async updateAll(allSettings) {
    let totalUpdated = 0;

    for (const [categorie, settings] of Object.entries(allSettings)) {
      if (typeof settings === 'object' && settings !== null) {
        const updated = await this.updateCategory(categorie, settings);
        totalUpdated += updated;
      }
    }

    return totalUpdated;
  }

  /**
   * Récupère les paramètres publics (pour le frontend non-admin)
   * @returns {Promise<Object>} Paramètres publics
   */
  async getPublicSettings() {
    const sql = `
      SELECT cle, valeur, type
      FROM configuration
      WHERE cle IN (
        'site_nom', 'site_description', 'site_email', 'site_telephone',
        'site_adresse', 'site_code_postal', 'site_ville', 'site_siret',
        'livraison_frais_standard', 'livraison_seuil_franco',
        'livraison_delai_min', 'livraison_delai_max',
        'commande_montant_min', 'commande_produits_par_page'
      )
    `;

    const result = await query(sql);
    
    const settings = {};
    for (const row of result.rows) {
      settings[row.cle] = this._convertValue(row.valeur, row.type);
    }

    return settings;
  }

  /**
   * Convertit une valeur selon son type
   * @private
   */
  _convertValue(valeur, type) {
    if (valeur === null || valeur === undefined) {
      return null;
    }

    switch (type) {
    case 'number':
      return parseFloat(valeur);
    case 'boolean':
      return valeur === 'true' || valeur === true;
    case 'json':
      try {
        return JSON.parse(valeur);
      } catch {
        return valeur;
      }
    default:
      return valeur;
    }
  }
}

module.exports = new SettingsRepository();
