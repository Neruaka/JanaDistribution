/**
 * Service d'Authentification
 * @description Logique métier pour inscription, connexion, JWT
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const logger = require('../config/logger');
const { ApiError } = require('../middlewares/errorHandler');

class AuthService {
  constructor() {
    this.saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  }

  /**
   * Inscription d'un nouvel utilisateur
   * @param {Object} userData - Données d'inscription
   * @returns {Promise<Object>} Utilisateur créé + token
   */
  async register(userData) {
    const {
      email,
      motDePasse,
      nom,
      prenom,
      telephone,
      typeClient = 'PARTICULIER',
      siret,
      raisonSociale,
      numeroTva,
      accepteCgu,
      accepteNewsletter = false
    } = userData;

    // Vérifier si l'email existe déjà
    const emailExists = await userRepository.emailExists(email);
    if (emailExists) {
      throw ApiError.conflict('Cette adresse email est déjà utilisée');
    }

    // Valider les CGU
    if (!accepteCgu) {
      throw ApiError.badRequest('Vous devez accepter les conditions générales d\'utilisation');
    }

    // Valider le SIRET pour les professionnels
    if (typeClient === 'PROFESSIONNEL') {
      if (!siret || siret.length !== 14) {
        throw ApiError.badRequest('Le numéro SIRET est obligatoire pour les professionnels (14 chiffres)');
      }
      if (!raisonSociale) {
        throw ApiError.badRequest('La raison sociale est obligatoire pour les professionnels');
      }
    }

    // Hasher le mot de passe
    const motDePasseHash = await bcrypt.hash(motDePasse, this.saltRounds);

    // Créer l'utilisateur
    const user = await userRepository.create({
      email: email.toLowerCase().trim(),
      motDePasseHash,
      nom: nom.trim(),
      prenom: prenom.trim(),
      telephone: telephone?.trim() || null,
      role: 'CLIENT',
      typeClient,
      siret: siret?.trim() || null,
      raisonSociale: raisonSociale?.trim() || null,
      numeroTva: numeroTva?.trim() || null,
      accepteCgu,
      accepteNewsletter
    });

    // Générer le token JWT
    const token = this.generateToken(user);

    logger.info(`Nouvel utilisateur inscrit: ${user.email} (${user.typeClient})`);

    return {
      user: this.sanitizeUser(user),
      token
    };
  }

  /**
   * Connexion d'un utilisateur
   * @param {string} email - Email
   * @param {string} motDePasse - Mot de passe
   * @returns {Promise<Object>} Utilisateur + token
   */
  async login(email, motDePasse) {
    // Trouver l'utilisateur
    const user = await userRepository.findByEmail(email.toLowerCase().trim());
    
    if (!user) {
      throw ApiError.unauthorized('Email ou mot de passe incorrect');
    }

    // Vérifier si le compte est actif
    if (!user.estActif) {
      throw ApiError.forbidden('Votre compte a été désactivé. Contactez le support.');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(motDePasse, user.motDePasseHash);
    
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Email ou mot de passe incorrect');
    }

    // Mettre à jour la dernière connexion
    await userRepository.updateLastLogin(user.id);

    // Générer le token
    const token = this.generateToken(user);

    logger.info(`Connexion réussie: ${user.email}`);

    return {
      user: this.sanitizeUser(user),
      token
    };
  }

  /**
   * Récupère le profil de l'utilisateur connecté
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Profil utilisateur
   */
  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    
    if (!user) {
      throw ApiError.notFound('Utilisateur non trouvé');
    }

    if (!user.estActif) {
      throw ApiError.forbidden('Votre compte a été désactivé');
    }

    return this.sanitizeUser(user);
  }

  /**
   * Change le mot de passe
   * @param {string} userId - ID de l'utilisateur
   * @param {string} ancienMotDePasse - Ancien mot de passe
   * @param {string} nouveauMotDePasse - Nouveau mot de passe
   */
  async changePassword(userId, ancienMotDePasse, nouveauMotDePasse) {
    const user = await userRepository.findByEmail(
      (await userRepository.findById(userId)).email
    );

    if (!user) {
      throw ApiError.notFound('Utilisateur non trouvé');
    }

    // Vérifier l'ancien mot de passe
    const isPasswordValid = await bcrypt.compare(ancienMotDePasse, user.motDePasseHash);
    
    if (!isPasswordValid) {
      throw ApiError.badRequest('L\'ancien mot de passe est incorrect');
    }

    // Hasher et sauvegarder le nouveau mot de passe
    const nouveauHash = await bcrypt.hash(nouveauMotDePasse, this.saltRounds);
    await userRepository.updatePassword(userId, nouveauHash);

    logger.info(`Mot de passe changé pour: ${user.email}`);
  }

  /**
   * Met à jour le profil utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} updates - Champs à mettre à jour
   * @returns {Promise<Object>} Profil mis à jour
   */
  async updateProfile(userId, updates) {
    // Empêcher la modification de certains champs sensibles
    const { email, role, motDePasse, accepteCgu, ...allowedUpdates } = updates;

    const user = await userRepository.update(userId, allowedUpdates);
    
    logger.info(`Profil mis à jour: ${user.email}`);
    
    return this.sanitizeUser(user);
  }

  /**
   * Génère un token JWT
   * @param {Object} user - Utilisateur
   * @returns {string} Token JWT
   */
  generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      typeClient: user.typeClient
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn
    });
  }

  /**
   * Vérifie un token JWT
   * @param {string} token - Token à vérifier
   * @returns {Object} Payload décodé
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Token expiré');
      }
      throw ApiError.unauthorized('Token invalide');
    }
  }

  /**
   * Nettoie les données utilisateur (retire les infos sensibles)
   * @param {Object} user - Utilisateur
   * @returns {Object} Utilisateur nettoyé
   */
  sanitizeUser(user) {
    const { motDePasseHash, ...safeUser } = user;
    return safeUser;
  }
}

module.exports = new AuthService();
