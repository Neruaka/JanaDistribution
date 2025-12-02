/**
 * Configuration du logger Winston
 * @description Logging structuré avec niveaux et fichiers
 */

const winston = require('winston');
const path = require('path');

// ==========================================
// FORMAT PERSONNALISÉ
// ==========================================
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Ajouter les métadonnées si présentes
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    // Ajouter la stack trace si erreur
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// ==========================================
// FORMAT CONSOLE (avec couleurs)
// ==========================================
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  customFormat
);

// ==========================================
// CRÉATION DU LOGGER
// ==========================================
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: { service: 'jana-api' },
  transports: [
    // Console (toujours actif)
    new winston.transports.Console({
      format: consoleFormat
    })
  ]
});

// En production, ajouter les fichiers de log
if (process.env.NODE_ENV === 'production') {
  const logsDir = path.join(__dirname, '../../logs');
  
  // Logs d'erreurs
  logger.add(new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));
  
  // Tous les logs
  logger.add(new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));
}

module.exports = logger;
