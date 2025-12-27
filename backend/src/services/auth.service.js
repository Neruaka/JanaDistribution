/**
 * Service d'Authentification - AVEC MOT DE PASSE OUBLIÉ
 * @description Logique métier pour inscription, connexion, JWT, reset password
 * 
 * ✅ AJOUTS:
 * - forgotPassword() : génère un token de reset et envoie l'email
 * - resetPassword() : réinitialise le mot de passe avec le token
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

    // ✅ Envoyer email de bienvenue (asynchrone, non bloquant)
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
   * Change le mot de passe (utilisateur connecté)
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

    // ✅ Envoyer email de confirmation
    emailService.sendPasswordChangedEmail(user).catch(err => {
      logger.error('Erreur envoi email changement mdp:', err.message);
    });
  }
  /**
 * Supprime le compte utilisateur (RGPD - droit à l'effacement)
 * @param {string} userId - ID de l'utilisateur
 */
async deleteAccount(userId) {
  const user = await userRepository.findById(userId);
  
  if (!user) {
    const error = new Error('Utilisateur non trouvé');
    error.statusCode = 404;
    throw error;
  }

  // Vérifier que ce n'est pas un admin (protection)
  if (user.role === 'ADMIN') {
    const error = new Error('Les comptes administrateurs ne peuvent pas être supprimés via cette méthode');
    error.statusCode = 403;
    throw error;
  }

  // Option 1: Soft delete (anonymisation) - RECOMMANDÉ pour garder l'historique des commandes
  await userRepository.anonymize(userId);
  
  // Option 2: Hard delete (suppression totale) - Décommenter si besoin
  // await userRepository.delete(userId);

  logger.info(`Compte supprimé (RGPD): ${user.email}`);
}

  // ==========================================
  // ✅ NOUVELLES MÉTHODES : MOT DE PASSE OUBLIÉ
  // ==========================================

  /**
   * Demande de réinitialisation de mot de passe
   * Génère un token et envoie l'email
   * @param {string} email - Email de l'utilisateur
   * @returns {Promise<Object>} Message de confirmation
   */
  async forgotPassword(email) {
    // Toujours retourner le même message (sécurité : ne pas révéler si l'email existe)
    const genericResponse = {
      message: 'Si cette adresse email est associée à un compte, vous recevrez un lien de réinitialisation.'
    };

    // Chercher l'utilisateur
    const user = await userRepository.findByEmail(email.toLowerCase().trim());
    
    if (!user) {
      logger.info(`Tentative reset password pour email inconnu: ${email}`);
      return genericResponse;
    }

    if (!user.estActif) {
      logger.info(`Tentative reset password pour compte désactivé: ${email}`);
      return genericResponse;
    }

    // Générer un token sécurisé
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hasher le token avant de le stocker (sécurité)
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Calculer la date d'expiration
    const resetTokenExpiry = new Date(Date.now() + this.resetTokenExpiry);

    // Sauvegarder le token hashé en base
    await userRepository.setResetToken(user.id, resetTokenHash, resetTokenExpiry);

    logger.info(`Token reset password généré pour: ${user.email}`);

    // Envoyer l'email avec le token NON hashé (celui qu'on envoie à l'utilisateur)
    const emailResult = await emailService.sendPasswordResetEmail(user, resetToken);
    
    if (!emailResult.success) {
      logger.error(`Échec envoi email reset pour: ${user.email}`);
      // On ne révèle pas l'erreur à l'utilisateur
    }

    return genericResponse;
  }

  /**
   * Réinitialise le mot de passe avec le token
   * @param {string} token - Token de réinitialisation (reçu par email)
   * @param {string} nouveauMotDePasse - Nouveau mot de passe
   * @returns {Promise<Object>} Confirmation
   */
  async resetPassword(token, nouveauMotDePasse) {
    // Hasher le token pour le comparer avec celui en base
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Chercher l'utilisateur avec ce token et vérifier l'expiration
    const user = await userRepository.findByResetToken(resetTokenHash);

    if (!user) {
      throw ApiError.badRequest('Token invalide ou expiré. Veuillez refaire une demande de réinitialisation.');
    }

    // Vérifier l'expiration
    if (new Date() > new Date(user.resetTokenExpiry)) {
      // Nettoyer le token expiré
      await userRepository.clearResetToken(user.id);
      throw ApiError.badRequest('Ce lien a expiré. Veuillez refaire une demande de réinitialisation.');
    }

    // Hasher le nouveau mot de passe
    const nouveauHash = await bcrypt.hash(nouveauMotDePasse, this.saltRounds);

    // Mettre à jour le mot de passe et supprimer le token
    await userRepository.updatePassword(user.id, nouveauHash);
    await userRepository.clearResetToken(user.id);

    logger.info(`Mot de passe réinitialisé pour: ${user.email}`);

    // Envoyer email de confirmation
    emailService.sendPasswordChangedEmail(user).catch(err => {
      logger.error('Erreur envoi email confirmation reset:', err.message);
    });

    return {
      message: 'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.'
    };
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
    const { motDePasseHash, resetToken, resetTokenExpiry, ...safeUser } = user;
    return safeUser;
  }
}

module.exports = new AuthService();
