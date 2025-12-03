/**
 * Middleware d'Authentification
 * @description Vérifie le token JWT et protège les routes
 */

const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const { ApiError } = require('./errorHandler');
const logger = require('../config/logger');

/**
 * Middleware pour vérifier l'authentification
 * Extrait et vérifie le token JWT du header Authorization
 */
const authenticate = async (req, res, next) => {
  try {
    // Récupérer le header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw ApiError.unauthorized('Token d\'authentification manquant');
    }

    // Vérifier le format "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw ApiError.unauthorized('Format de token invalide');
    }

    const token = parts[1];

    // Vérifier le token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Token expiré, veuillez vous reconnecter');
      }
      throw ApiError.unauthorized('Token invalide');
    }

    // Vérifier que l'utilisateur existe toujours et est actif
    const user = await userRepository.findById(decoded.id);

    if (!user) {
      throw ApiError.unauthorized('Utilisateur non trouvé');
    }

    if (!user.estActif) {
      throw ApiError.forbidden('Votre compte a été désactivé');
    }

    // Attacher l'utilisateur à la requête
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      typeClient: user.typeClient,
      permissions: user.permissions
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware optionnel d'authentification
 * Attache l'utilisateur si un token valide est présent, mais ne bloque pas
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next();
    }

    const token = parts[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await userRepository.findById(decoded.id);

      if (user && user.estActif) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          typeClient: user.typeClient,
          permissions: user.permissions
        };
      }
    } catch (error) {
      // Token invalide, on continue sans user
      logger.debug('Token optionnel invalide, continuation sans auth');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware pour vérifier le rôle admin
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentification requise'));
  }

  if (req.user.role !== 'ADMIN') {
    return next(ApiError.forbidden('Accès réservé aux administrateurs'));
  }

  next();
};

/**
 * Middleware pour vérifier le rôle client
 */
const isClient = (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentification requise'));
  }

  if (req.user.role !== 'CLIENT') {
    return next(ApiError.forbidden('Accès réservé aux clients'));
  }

  next();
};

/**
 * Middleware pour vérifier une permission spécifique (admin)
 * @param {string} permission - Permission requise
 */
const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentification requise'));
    }

    if (req.user.role !== 'ADMIN') {
      return next(ApiError.forbidden('Accès réservé aux administrateurs'));
    }

    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      return next(ApiError.forbidden(`Permission requise: ${permission}`));
    }

    next();
  };
};

/**
 * Middleware pour vérifier que l'utilisateur est propriétaire de la ressource
 * ou est admin
 * @param {Function} getOwnerId - Fonction qui extrait l'ID du propriétaire
 */
const isOwnerOrAdmin = (getOwnerId) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentification requise'));
    }

    // Admin peut tout faire
    if (req.user.role === 'ADMIN') {
      return next();
    }

    try {
      const ownerId = await getOwnerId(req);
      
      if (ownerId !== req.user.id) {
        return next(ApiError.forbidden('Vous n\'êtes pas autorisé à accéder à cette ressource'));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  authenticate,
  optionalAuth,
  isAdmin,
  isClient,
  hasPermission,
  isOwnerOrAdmin
};
