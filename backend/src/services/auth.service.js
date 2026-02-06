/**
 * Service d'Authentification - AVEC MOT DE PASSE OUBLIÃ‰
 * @description Logique mÃ©tier pour inscription, connexion, JWT, reset password
 * 
 * âœ… AJOUTS:
 * - forgotPassword() : gÃ©nÃ¨re un token de reset et envoie l'email
 * - resetPassword() : rÃ©initialise le mot de passe avec le token
 * - Utilisation du service email pour les notifications
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const userRepository = require('../repositories/user.repository');
const logger = require('../config/logger');
const { ApiError } = require('../middlewares/errorHandler');
const emailService = require('./email.service');

class AuthService {
  constructor() {
    this.saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    this.resetTokenExpiry = 60 * 60 * 1000; // 1 heure en millisecondes
  }

  /**
   * Inscription d'un nouvel utilisateur
   * @param {Object} userData - DonnÃ©es d'inscription
   * @returns {Promise<Object>} Utilisateur crÃ©Ã© + token
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

    // VÃ©rifier si l'email existe dÃ©jÃ 
    const emailExists = await userRepository.emailExists(email);
    if (emailExists) {
      throw ApiError.conflict('Cette adresse email est dÃ©jÃ  utilisÃ©e');
    }

    // Valider les CGU
    if (!accepteCgu) {
      throw ApiError.badRequest('Vous devez accepter les conditions gÃ©nÃ©rales d\'utilisation');
    }

    // Valider le SIRET pour les professionnels
    if (typeClient === 'PROFESSIONNEL') {
      if (!siret || siret.length !== 14) {
        throw ApiError.badRequest('Le numÃ©ro SIRET est obligatoire pour les professionnels (14 chiffres)');
      }
      if (!raisonSociale) {
        throw ApiError.badRequest('La raison sociale est obligatoire pour les professionnels');
      }
    }

    // Hasher le mot de passe
    const motDePasseHash = await bcrypt.hash(motDePasse, this.saltRounds);

    // CrÃ©er l'utilisateur
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

    // GÃ©nÃ©rer le token JWT
    const token = this.generateToken(user);

    logger.info(`Nouvel utilisateur inscrit: ${user.email} (${user.typeClient})`);

    // âœ… Envoyer email de bienvenue (asynchrone, non bloquant)
    emailService.sendWelcomeEmail(user).catch(err => {
      logger.error('Erreur envoi email bienvenue:', err.message);
    });

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

    // VÃ©rifier si le compte est actif
    if (!user.estActif) {
      throw ApiError.forbidden('Votre compte a Ã©tÃ© dÃ©sactivÃ©. Contactez le support.');
    }

    // VÃ©rifier le mot de passe
    const isPasswordValid = await bcrypt.compare(motDePasse, user.motDePasseHash);
    
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Email ou mot de passe incorrect');
    }

    // Mettre Ã  jour la derniÃ¨re connexion
    await userRepository.updateLastLogin(user.id);

    // GÃ©nÃ©rer le token
    const token = this.generateToken(user);

    logger.info(`Connexion rÃ©ussie: ${user.email}`);

    return {
      user: this.sanitizeUser(user),
      token
    };
  }

  /**
   * RÃ©cupÃ¨re le profil de l'utilisateur connectÃ©
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Profil utilisateur
   */
  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    
    if (!user) {
      throw ApiError.notFound('Utilisateur non trouvÃ©');
    }

    if (!user.estActif) {
      throw ApiError.forbidden('Votre compte a Ã©tÃ© dÃ©sactivÃ©');
    }

    return this.sanitizeUser(user);
  }

  /**
   * Change le mot de passe (utilisateur connectÃ©)
   * @param {string} userId - ID de l'utilisateur
   * @param {string} ancienMotDePasse - Ancien mot de passe
   * @param {string} nouveauMotDePasse - Nouveau mot de passe
   */
  async changePassword(userId, ancienMotDePasse, nouveauMotDePasse) {
    const existingUser = await userRepository.findById(userId);

    if (!existingUser) {
      throw ApiError.notFound('Utilisateur non trouvé');
    }

    const user = await userRepository.findByEmail(existingUser.email);

    if (!user) {
      throw ApiError.notFound('Utilisateur non trouvé');
    }
    // VÃ©rifier l'ancien mot de passe
    const isPasswordValid = await bcrypt.compare(ancienMotDePasse, user.motDePasseHash);
    
    if (!isPasswordValid) {
      throw ApiError.badRequest('L\'ancien mot de passe est incorrect');
    }

    // Hasher et sauvegarder le nouveau mot de passe
    const nouveauHash = await bcrypt.hash(nouveauMotDePasse, this.saltRounds);
    await userRepository.updatePassword(userId, nouveauHash);

    logger.info(`Mot de passe changÃ© pour: ${user.email}`);

    // âœ… Envoyer email de confirmation
    emailService.sendPasswordChangedEmail(user).catch(err => {
      logger.error('Erreur envoi email changement mdp:', err.message);
    });
  }
  /**
 * Supprime le compte utilisateur (RGPD - droit Ã  l'effacement)
 * @param {string} userId - ID de l'utilisateur
 */
  async deleteAccount(userId) {
    const user = await userRepository.findById(userId);
  
    if (!user) {
      const error = new Error('Utilisateur non trouvÃ©');
      error.statusCode = 404;
      throw error;
    }

    // VÃ©rifier que ce n'est pas un admin (protection)
    if (user.role === 'ADMIN') {
      const error = new Error('Les comptes administrateurs ne peuvent pas Ãªtre supprimÃ©s via cette mÃ©thode');
      error.statusCode = 403;
      throw error;
    }

    // Option 1: Soft delete (anonymisation) - RECOMMANDÃ‰ pour garder l'historique des commandes
    await userRepository.anonymize(userId);
  
    // Option 2: Hard delete (suppression totale) - DÃ©commenter si besoin
    // await userRepository.delete(userId);

    logger.info(`Compte supprimÃ© (RGPD): ${user.email}`);
  }

  // ==========================================
  // âœ… NOUVELLES MÃ‰THODES : MOT DE PASSE OUBLIÃ‰
  // ==========================================

  /**
   * Demande de rÃ©initialisation de mot de passe
   * GÃ©nÃ¨re un token et envoie l'email
   * @param {string} email - Email de l'utilisateur
   * @returns {Promise<Object>} Message de confirmation
   */
  async forgotPassword(email) {
    // Toujours retourner le mÃªme message (sÃ©curitÃ© : ne pas rÃ©vÃ©ler si l'email existe)
    const genericResponse = {
      message: 'Si cette adresse email est associÃ©e Ã  un compte, vous recevrez un lien de rÃ©initialisation.'
    };

    // Chercher l'utilisateur
    const user = await userRepository.findByEmail(email.toLowerCase().trim());
    
    if (!user) {
      logger.info(`Tentative reset password pour email inconnu: ${email}`);
      return genericResponse;
    }

    if (!user.estActif) {
      logger.info(`Tentative reset password pour compte dÃ©sactivÃ©: ${email}`);
      return genericResponse;
    }

    // GÃ©nÃ©rer un token sÃ©curisÃ©
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hasher le token avant de le stocker (sÃ©curitÃ©)
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Calculer la date d'expiration
    const resetTokenExpiry = new Date(Date.now() + this.resetTokenExpiry);

    // Sauvegarder le token hashÃ© en base
    await userRepository.setResetToken(user.id, resetTokenHash, resetTokenExpiry);

    logger.info(`Token reset password gÃ©nÃ©rÃ© pour: ${user.email}`);

    // Envoyer l'email avec le token NON hashÃ© (celui qu'on envoie Ã  l'utilisateur)
    const emailResult = await emailService.sendPasswordResetEmail(user, resetToken);
    
    if (!emailResult.success) {
      logger.error(`Ã‰chec envoi email reset pour: ${user.email}`);
      // On ne rÃ©vÃ¨le pas l'erreur Ã  l'utilisateur
    }

    return genericResponse;
  }

  /**
   * RÃ©initialise le mot de passe avec le token
   * @param {string} token - Token de rÃ©initialisation (reÃ§u par email)
   * @param {string} nouveauMotDePasse - Nouveau mot de passe
   * @returns {Promise<Object>} Confirmation
   */
  async resetPassword(token, nouveauMotDePasse) {
    // Hasher le token pour le comparer avec celui en base
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Chercher l'utilisateur avec ce token et vÃ©rifier l'expiration
    const user = await userRepository.findByResetToken(resetTokenHash);

    if (!user) {
      throw ApiError.badRequest('Token invalide ou expirÃ©. Veuillez refaire une demande de rÃ©initialisation.');
    }

    // VÃ©rifier l'expiration
    if (new Date() > new Date(user.resetTokenExpiry)) {
      // Nettoyer le token expirÃ©
      await userRepository.clearResetToken(user.id);
      throw ApiError.badRequest('Ce lien a expirÃ©. Veuillez refaire une demande de rÃ©initialisation.');
    }

    // Hasher le nouveau mot de passe
    const nouveauHash = await bcrypt.hash(nouveauMotDePasse, this.saltRounds);

    // Mettre Ã  jour le mot de passe et supprimer le token
    await userRepository.updatePassword(user.id, nouveauHash);
    await userRepository.clearResetToken(user.id);

    logger.info(`Mot de passe rÃ©initialisÃ© pour: ${user.email}`);

    // Envoyer email de confirmation
    emailService.sendPasswordChangedEmail(user).catch(err => {
      logger.error('Erreur envoi email confirmation reset:', err.message);
    });

    return {
      message: 'Votre mot de passe a Ã©tÃ© rÃ©initialisÃ© avec succÃ¨s. Vous pouvez maintenant vous connecter.'
    };
  }

  /**
   * Met Ã  jour le profil utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} updates - Champs Ã  mettre Ã  jour
   * @returns {Promise<Object>} Profil mis Ã  jour
   */
  async updateProfile(userId, updates) {
    // EmpÃªcher la modification de certains champs sensibles
    const { email, role, motDePasse, accepteCgu, ...allowedUpdates } = updates;

    const user = await userRepository.update(userId, allowedUpdates);
    
    logger.info(`Profil mis Ã  jour: ${user.email}`);
    
    return this.sanitizeUser(user);
  }

  /**
   * GÃ©nÃ¨re un token JWT
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
   * VÃ©rifie un token JWT
   * @param {string} token - Token Ã  vÃ©rifier
   * @returns {Object} Payload dÃ©codÃ©
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Token expirÃ©');
      }
      throw ApiError.unauthorized('Token invalide');
    }
  }

  /**
   * Nettoie les donnÃ©es utilisateur (retire les infos sensibles)
   * @param {Object} user - Utilisateur
   * @returns {Object} Utilisateur nettoyÃ©
   */
  sanitizeUser(user) {
    const { motDePasseHash, resetToken, resetTokenExpiry, ...safeUser } = user;
    return safeUser;
  }
}

module.exports = new AuthService();

