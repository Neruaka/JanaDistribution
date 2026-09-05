/**
 * Configuration du logger Winston
 * @description Logging structuré avec niveaux et fichiers
 */

const winston = require('winston');
require('winston-daily-rotate-file');
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

// En production, ajouter les fichiers de log.
// Rotation quotidienne + purge par ANCIENNETÉ (90 jours) en plus de la
// taille : la config précédente (maxFiles: 5 fichiers de 5MB) ne purgeait
// que par taille, donc sans garantie qu'une entrée de log donnée (contenant
// des IP, des emails, des actions utilisateur) soit un jour supprimée sur
// une instance à faible trafic — gap RGPD identifié dans
// docs/produit/RGPD_ACCESSIBILITE.md. Note : sur Fly.io, le filesystem des
// machines est éphémère (pas de volume monté sur ce dossier, contrairement
// à /app/uploads) — ces fichiers ne survivent de toute façon pas à un
// redéploiement ; cette politique reste utile en local/homeserver ou si un
// volume de logs est ajouté plus tard.
if (process.env.NODE_ENV === 'production') {
  const logsDir = path.join(__dirname, '../../logs');
  const LOG_RETENTION_DAYS = '90d';

  // Logs d'erreurs
  logger.add(new winston.transports.DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '5m',
    maxFiles: LOG_RETENTION_DAYS
  }));

  // Tous les logs
  logger.add(new winston.transports.DailyRotateFile({
    filename: path.join(logsDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '5m',
    maxFiles: LOG_RETENTION_DAYS
  }));
}

module.exports = logger;
