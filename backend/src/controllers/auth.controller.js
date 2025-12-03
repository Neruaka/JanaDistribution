/**
 * Controller d'Authentification
 * @description Gère les requêtes HTTP pour l'authentification
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
   * Change le mot de passe
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
}

module.exports = new AuthController();
