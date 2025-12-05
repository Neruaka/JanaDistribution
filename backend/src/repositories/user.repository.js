/**
 * Repository Utilisateur
 * @description Accès aux données de la table utilisateur
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
      accepteNewsletter = false
    } = userData;

    const sql = `
      INSERT INTO utilisateur (
        email, mot_de_passe_hash, nom, prenom, telephone,
        role, type_client, siret, raison_sociale, numero_tva,
        accepte_cgu, accepte_newsletter
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING 
        id, email, nom, prenom, telephone,
        role, type_client, siret, raison_sociale, numero_tva,
        accepte_cgu, accepte_newsletter, est_actif,
        date_creation, date_modification
    `;

    const values = [
      email, motDePasseHash, nom, prenom, telephone,
      role, typeClient, siret, raisonSociale, numeroTva,
      accepteCgu, accepteNewsletter
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
        accepte_cgu, accepte_newsletter, est_actif,
        date_creation, date_modification, derniere_connexion
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
        accepte_cgu, accepte_newsletter, est_actif,
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
    const sql = `SELECT 1 FROM utilisateur WHERE email = $1`;
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
      'accepte_newsletter', 'est_actif'
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
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING 
        id, email, nom, prenom, telephone,
        role, type_client, siret, raison_sociale, numero_tva,
        accepte_cgu, accepte_newsletter, est_actif,
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
      SET mot_de_passe_hash = $1
      WHERE id = $2
    `;
    await query(sql, [hashedPassword, id]);
    logger.info(`Mot de passe mis à jour pour: ${id}`);
  }

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
      estActif: row.est_actif,
      dateCreation: row.date_creation,
      dateModification: row.date_modification,
      derniereConnexion: row.derniere_connexion
    };

    if (includePassword) {
      user.motDePasseHash = row.mot_de_passe_hash;
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
