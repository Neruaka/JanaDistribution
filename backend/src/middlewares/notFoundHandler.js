/**
 * Middleware pour les routes non trouvées
 * @description Renvoie une erreur 404 pour les routes inexistantes
 */

const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route non trouvée: ${req.method} ${req.originalUrl}`,
    suggestion: 'Vérifiez l\'URL et la méthode HTTP'
  });
};

module.exports = notFoundHandler;
