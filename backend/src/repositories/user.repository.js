/**
 * Repository Utilisateur - AVEC RESET TOKEN + NOTIFICATIONS COMMANDES
 * @description Accès aux données de la table utilisateur
 * 
 * ✅ AJOUTS:
 * - setResetToken() : stocke le token de reset
 * - findByResetToken() : trouve un utilisateur par son token
 * - clearResetToken() : supprime le token après utilisation
 * - Support notifications_commandes pour le suivi des commandes
 */

const { query, getClient } = require('../config/database');
const logger = require('../config/logger');

class UserRepository {
  /**
   * Crée un nouvel utilisateur
   * @param {Object} userData - Données de l'utilisateur
   * @returns {Promise<Object>} Utilisateur créé
   */
  async create(userData) {
    const {
      email,
      motDePasseHash,
      nom,
      prenom,
      telephone = null,
      role = 'CLIENT',
      typeClient = 'PARTICULIER',
      siret = null,
      raisonSociale = null,
      numeroTva = null,
      accepteCgu = false,
      accepteNewsletter = false,
      notificationsCommandes = true // ✅ Par défaut activé
    } = userData;

    const sql = `
      INSERT INTO utilisateur (
        email, mot_de_passe_hash, nom, prenom, telephone,
        role, type_client, siret, raison_sociale, numero_tva,
        accepte_cgu, accepte_newsletter, notifications_commandes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING 
        id, email, nom, prenom, telephone,
        role, type_client, siret, raison_sociale, numero_tva,
        accepte_cgu, accepte_newsletter, notifications_commandes, est_actif,
        date_creation, date_modification
    `;

    const values = [
      email, motDePasseHash, nom, prenom, telephone,
      role, typeClient, siret, raisonSociale, numeroTva,
      accepteCgu, accepteNewsletter, notificationsCommandes
    ];

    const result = await query(sql, values);
    logger.info(`Utilisateur créé: ${email}`);
    return this._formatUser(result.rows[0]);
  }

  /**
   * Trouve un utilisateur par email
   * @param {string} email - Email de l'utilisateur
   * @returns {Promise<Object|null>} Utilisateur ou null
   */
  async findByEmail(email) {
    const sql = `
      SELECT 
        id, email, mot_de_passe_hash, nom, prenom, telephone,
        role, type_client, siret, raison_sociale, numero_tva,
        accepte_cgu, accepte_newsletter, notifications_commandes, est_actif,
        date_creation, date_modification, derniere_connexion,
        reset_token, reset_token_expiry
      FROM utilisateur
      WHERE email = $1
    `;

    const result = await query(sql, [email.toLowerCase()]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this._formatUser(result.rows[0], true);
  }

  /**
   * Trouve un utilisateur par ID
   * @param {string} id - UUID de l'utilisateur
   * @returns {Promise<Object|null>} Utilisateur ou null
   */
  async findById(id) {
    const sql = `
      SELECT 
        id, email, nom, prenom, telephone,
        role, type_client, siret, raison_sociale, numero_tva,
        accepte_cgu, accepte_newsletter, notifications_commandes, est_actif,
        date_creation, date_modification, derniere_connexion
      FROM utilisateur
      WHERE id = $1
    `;

    const result = await query(sql, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this._formatUser(result.rows[0]);
  }

  /**
   * Vérifie si un email existe déjà
   * @param {string} email - Email à vérifier
   * @returns {Promise<boolean>} true si l'email existe
   */
  async emailExists(email) {
    const sql = 'ELECT 1 FROM utilisateur WHERE email = $1';
    const result = await query(sql, [email.toLowerCase()]);
    return result.rows.length > 0;
  }

  /**
   * Met à jour la date de dernière connexion
   * @param {string} id - UUID de l'utilisateur
   */
  async updateLastLogin(id) {
    const sql = `
      UPDATE utilisateur 
      SET derniere_connexion = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await query(sql, [id]);
  }

  /**
   * Met à jour un utilisateur
   * @param {string} id - UUID de l'utilisateur
   * @param {Object} updates - Champs à mettre à jour
   * @returns {Promise<Object>} Utilisateur mis à jour
   */
  async update(id, updates) {
    const allowedFields = [
      'nom', 'prenom', 'telephone', 'type_client',
      'siret', 'raison_sociale', 'numero_tva',
      'accepte_newsletter', 'notifications_commandes', 'est_actif' // ✅ Ajouté
    ];

    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      const snakeKey = this._toSnakeCase(key);
      if (allowedFields.includes(snakeKey)) {
        setClauses.push(`${snakeKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const sql = `
      UPDATE utilisateur 
      SET ${setClauses.join(', ')}, date_modification = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING 
        id, email, nom, prenom, telephone,
        role, type_client, siret, raison_sociale, numero_tva,
        accepte_cgu, accepte_newsletter, notifications_commandes, est_actif,
        date_creation, date_modification
    `;

    const result = await query(sql, values);
    logger.info(`Utilisateur mis à jour: ${id}`);
    return this._formatUser(result.rows[0]);
  }

  /**
   * Met à jour le mot de passe
   * @param {string} id - UUID de l'utilisateur
   * @param {string} hashedPassword - Nouveau mot de passe hashé
   */
  async updatePassword(id, hashedPassword) {
    const sql = `
      UPDATE utilisateur 
      SET mot_de_passe_hash = $1, date_modification = CURRENT_TIMESTAMP
      WHERE id = $2
    `;
    await query(sql, [hashedPassword, id]);
    logger.info(`Mot de passe mis à jour pour: ${id}`);
  }

  // ==========================================
  // ✅ MÉTHODES RESET TOKEN
  // ==========================================

  /**
   * Stocke le token de réinitialisation de mot de passe
   * @param {string} id - UUID de l'utilisateur
   * @param {string} tokenHash - Token hashé (SHA256)
   * @param {Date} expiry - Date d'expiration
   */
  async setResetToken(id, tokenHash, expiry) {
    const sql = `
      UPDATE utilisateur 
      SET reset_token = $1, reset_token_expiry = $2, date_modification = CURRENT_TIMESTAMP
      WHERE id = $3
    `;
    await query(sql, [tokenHash, expiry, id]);
    logger.info(`Reset token défini pour utilisateur: ${id}`);
  }

  /**
   * Trouve un utilisateur par son token de reset (non expiré)
   * @param {string} tokenHash - Token hashé
   * @returns {Promise<Object|null>} Utilisateur ou null
   */
  async findByResetToken(tokenHash) {
    const sql = `
      SELECT 
        id, email, nom, prenom, telephone,
        role, type_client, est_actif,
        reset_token, reset_token_expiry
      FROM utilisateur
      WHERE reset_token = $1 
        AND reset_token_expiry > CURRENT_TIMESTAMP
        AND est_actif = true
    `;

    const result = await query(sql, [tokenHash]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      nom: row.nom,
      prenom: row.prenom,
      telephone: row.telephone,
      role: row.role,
      typeClient: row.type_client,
      estActif: row.est_actif,
      resetToken: row.reset_token,
      resetTokenExpiry: row.reset_token_expiry
    };
  }

  /**
   * Supprime le token de reset après utilisation
   * @param {string} id - UUID de l'utilisateur
   */
  async clearResetToken(id) {
    const sql = `
      UPDATE utilisateur 
      SET reset_token = NULL, reset_token_expiry = NULL, date_modification = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await query(sql, [id]);
    logger.info(`Reset token supprimé pour utilisateur: ${id}`);
  }

  // ==========================================
  // AUTRES MÉTHODES
  // ==========================================

  /**
   * Désactive un utilisateur (soft delete)
   * @param {string} id - UUID de l'utilisateur
   */
  async deactivate(id) {
    const sql = `
      UPDATE utilisateur 
      SET est_actif = false
      WHERE id = $1
    `;
    await query(sql, [id]);
    logger.info(`Utilisateur désactivé: ${id}`);
  }

  /**
   * Liste les utilisateurs avec pagination
   * @param {Object} options - Options de pagination et filtres
   * @returns {Promise<Object>} Liste paginée
   */
  async findAll(options = {}) {
    const {
      page = 1,
      limit = 20,
      role = null,
      typeClient = null,
      estActif = null,
      search = null
    } = options;

    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (role) {
      conditions.push(`role = $${paramIndex}`);
      values.push(role);
      paramIndex++;
    }

    if (typeClient) {
      conditions.push(`type_client = $${paramIndex}`);
      values.push(typeClient);
      paramIndex++;
    }

    if (estActif !== null) {
      conditions.push(`est_actif = $${paramIndex}`);
      values.push(estActif);
      paramIndex++;
    }

    if (search) {
      conditions.push(`(
        nom ILIKE $${paramIndex} OR 
        prenom ILIKE $${paramIndex} OR 
        email ILIKE $${paramIndex}
      )`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}` 
      : '';

    // Compte total
    const countSql = `SELECT COUNT(*) FROM utilisateur ${whereClause}`;
    const countResult = await query(countSql, values);
    const total = parseInt(countResult.rows[0].count);

    // Données paginées
    values.push(limit, offset);
    const dataSql = `
      SELECT 
        id, email, nom, prenom, telephone,
        role, type_client, siret, raison_sociale,
        est_actif, date_creation, derniere_connexion
      FROM utilisateur
      ${whereClause}
      ORDER BY date_creation DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataResult = await query(dataSql, values);

    return {
      data: dataResult.rows.map(row => this._formatUser(row)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Anonymise un utilisateur (soft delete RGPD)
   * Garde les commandes mais supprime les données personnelles
   * @param {string} id - UUID de l'utilisateur
   */
  async anonymize(id) {
    const sql = `
      UPDATE utilisateur 
      SET 
        email = CONCAT('deleted_', id, '@anonymized.local'),
        nom = 'Utilisateur',
        prenom = 'Supprimé',
        telephone = NULL,
        mot_de_passe_hash = 'ACCOUNT_DELETED',
        siret = NULL,
        raison_sociale = NULL,
        numero_tva = NULL,
        reset_token = NULL,
        reset_token_expiry = NULL,
        est_actif = false,
        accepte_newsletter = false,
        notifications_commandes = false,
        date_modification = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await query(sql, [id]);
    logger.info(`Utilisateur anonymisé: ${id}`);
  }

  /**
   * Supprime définitivement un utilisateur (hard delete)
   * ATTENTION: Cela peut casser les références FK dans les commandes
   * @param {string} id - UUID de l'utilisateur
   */
  async delete(id) {
    // D'abord, mettre à NULL les références dans les commandes
    await query('UPDATE commande SET utilisateur_id = NULL WHERE utilisateur_id = $1', [id]);
    
    // Supprimer le panier
    await query('DELETE FROM panier WHERE utilisateur_id = $1', [id]);
    
    // Supprimer les lignes de panier orphelines
    await query('DELETE FROM ligne_panier WHERE panier_id NOT IN (SELECT id FROM panier)');
    
    // Supprimer l'utilisateur
    const sql = 'DELETE FROM utilisateur WHERE id = $1';
    await query(sql, [id]);
    logger.info(`Utilisateur supprimé définitivement: ${id}`);
  }

  /**
   * Formate un utilisateur depuis la BDD
   * @private
   */
  _formatUser(row, includePassword = false) {
    if (!row) return null;

    const user = {
      id: row.id,
      email: row.email,
      nom: row.nom,
      prenom: row.prenom,
      telephone: row.telephone,
      role: row.role,
      typeClient: row.type_client,
      siret: row.siret,
      raisonSociale: row.raison_sociale,
      numeroTva: row.numero_tva,
      accepteCgu: row.accepte_cgu,
      accepteNewsletter: row.accepte_newsletter,
      notificationsCommandes: row.notifications_commandes ?? true, // ✅ Par défaut true
      estActif: row.est_actif,
      dateCreation: row.date_creation,
      dateModification: row.date_modification,
      derniereConnexion: row.derniere_connexion
    };

    if (includePassword) {
      user.motDePasseHash = row.mot_de_passe_hash;
    }

    // Inclure les infos de reset token si présentes
    if (row.reset_token !== undefined) {
      user.resetToken = row.reset_token;
      user.resetTokenExpiry = row.reset_token_expiry;
    }

    return user;
  }

  /**
   * Convertit camelCase en snake_case
   * @private
   */
  _toSnakeCase(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

module.exports = new UserRepository();
