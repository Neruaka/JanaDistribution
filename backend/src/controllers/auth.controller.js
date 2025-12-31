/**
 * Controller d'Authentification - AVEC MOT DE PASSE OUBLIÉ
 * @description Gère les requêtes HTTP pour l'authentification
 * 
 */

const authService = require('../services/auth.service');
const logger = require('../config/logger');

class AuthController {
  /**
   * POST /api/auth/register
   * Inscription d'un nouvel utilisateur
   */
  async register(req, res, next) {
    try {
      const {
        email,
        motDePasse,
        nom,
        prenom,
        telephone,
        typeClient,
        siret,
        raisonSociale,
        numeroTva,
        accepteCgu,
        accepteNewsletter
      } = req.body;

      const result = await authService.register({
        email,
        motDePasse,
        nom,
        prenom,
        telephone,
        typeClient,
        siret,
        raisonSociale,
        numeroTva,
        accepteCgu,
        accepteNewsletter
      });

      res.status(201).json({
        success: true,
        message: 'Inscription réussie',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Connexion d'un utilisateur
   */
  async login(req, res, next) {
    try {
      const { email, motDePasse } = req.body;

      const result = await authService.login(email, motDePasse);

      res.json({
        success: true,
        message: 'Connexion réussie',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   * Déconnexion (côté client, invalide le token)
   */
  async logout(req, res, next) {
    try {
      // Le token est géré côté client (suppression du localStorage)
      // Ici on pourrait ajouter le token à une blacklist Redis si besoin

      res.json({
        success: true,
        message: 'Déconnexion réussie'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Récupère le profil de l'utilisateur connecté
   */
  async getProfile(req, res, next) {
    try {
      const user = await authService.getProfile(req.user.id);

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/auth/profile
   * Met à jour le profil de l'utilisateur connecté
   */
  async updateProfile(req, res, next) {
    try {
      const updates = req.body;
      const user = await authService.updateProfile(req.user.id, updates);

      res.json({
        success: true,
        message: 'Profil mis à jour',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/auth/password
   * Change le mot de passe (utilisateur connecté)
   */
  async changePassword(req, res, next) {
    try {
      const { ancienMotDePasse, nouveauMotDePasse } = req.body;

      await authService.changePassword(
        req.user.id,
        ancienMotDePasse,
        nouveauMotDePasse
      );

      res.json({
        success: true,
        message: 'Mot de passe modifié avec succès'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/refresh
   * Rafraîchit le token JWT
   */
  async refreshToken(req, res, next) {
    try {
      const user = await authService.getProfile(req.user.id);
      const token = authService.generateToken(user);

      res.json({
        success: true,
        data: { token }
      });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // MOT DE PASSE OUBLIÉ
  // ==========================================

  /**
   * POST /api/auth/forgot-password
   * Demande de réinitialisation de mot de passe
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'L\'adresse email est requise'
        });
      }

      const result = await authService.forgotPassword(email);

      // Toujours retourner un succès (sécurité)
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      // Ne jamais révéler si l'email existe ou pas
      logger.error('Erreur forgot-password:', error.message);
      res.json({
        success: true,
        message: 'Si cette adresse email est associée à un compte, vous recevrez un lien de réinitialisation.'
      });
    }
  }

  /**
   * POST /api/auth/reset-password
   * Réinitialise le mot de passe avec le token
   */
  async resetPassword(req, res, next) {
    try {
      const { token, nouveauMotDePasse } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token de réinitialisation requis'
        });
      }

      if (!nouveauMotDePasse || nouveauMotDePasse.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Le mot de passe doit contenir au moins 8 caractères'
        });
      }

      const result = await authService.resetPassword(token, nouveauMotDePasse);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }
  /**
 * DELETE /api/auth/account
 * Supprime le compte de l'utilisateur (RGPD)
 */
  async deleteAccount(req, res, next) {
    try {
      await authService.deleteAccount(req.user.id);

      res.json({
        success: true,
        message: 'Compte supprimé avec succès'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
