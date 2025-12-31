/**
 * Middleware de gestion globale des erreurs
 * @description Capture et formate toutes les erreurs de l'API
 */

const logger = require('../config/logger');

/**
 * Classe d'erreur personnalisée pour l'API
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details = null) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Non autorisé') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Accès interdit') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Ressource non trouvée') {
    return new ApiError(404, message);
  }

  static conflict(message, details = null) {
    return new ApiError(409, message, details);
  }

  static unprocessable(message, details = null) {
    return new ApiError(422, message, details);
  }

  static internal(message = 'Erreur interne du serveur') {
    return new ApiError(500, message);
  }
}

/**
 * Middleware de gestion des erreurs
 */
const errorHandler = (err, req, res, next) => {
  // Log de l'erreur
  logger.error('Erreur capturée:', {
    message: err.message,
    statusCode: err.statusCode,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // Erreur opérationnelle (prévisible)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details || null
    });
  }

  // Erreurs de validation express-validator
  if (err.array && typeof err.array === 'function') {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      details: err.array()
    });
  }

  // Erreurs PostgreSQL spécifiques
  if (err.code) {
    switch (err.code) {
    case '23505': // Violation de contrainte unique
      return res.status(409).json({
        success: false,
        message: 'Cette ressource existe déjà',
        details: err.detail
     });
    case '23503': // Violation de clé étrangère
      return res.status(400).json({
        success: false,
        message: 'Référence invalide',
        details: err.detail
      });
    case '22P02': // Format UUID invalide
      return res.status(400).json({
        success: false,
        message: 'Format d\'identifiant invalide'
      });
    }
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expiré'
    });
  }

  // Erreur par défaut (non gérée)
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Une erreur est survenue' 
    : err.message;

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

module.exports = errorHandler;
module.exports.ApiError = ApiError;
