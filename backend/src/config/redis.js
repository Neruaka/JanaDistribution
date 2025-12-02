/**
 * Configuration de la connexion Redis
 * @description Client Redis pour le cache
 */

const { createClient } = require('redis');
const logger = require('./logger');

// ==========================================
// CRÉATION DU CLIENT REDIS
// ==========================================
const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis: Nombre max de tentatives atteint');
        return new Error('Nombre max de tentatives de reconnexion atteint');
      }
      return Math.min(retries * 100, 3000);
    }
  },
  password: process.env.REDIS_PASSWORD || undefined
});

// ==========================================
// ÉVÉNEMENTS REDIS
// ==========================================
redisClient.on('connect', () => {
  logger.debug('Redis: Tentative de connexion...');
});

redisClient.on('ready', () => {
  logger.info('Redis: Client prêt');
});

redisClient.on('error', (err) => {
  logger.error('Redis: Erreur client:', err.message);
});

redisClient.on('reconnecting', () => {
  logger.warn('Redis: Reconnexion en cours...');
});

// ==========================================
// FONCTIONS UTILITAIRES
// ==========================================

/**
 * Connexion à Redis
 */
const connectRedis = async () => {
  try {
    await redisClient.connect();
    await redisClient.ping();
    logger.info('Redis connecté avec succès');
    return true;
  } catch (error) {
    logger.error('Erreur de connexion Redis:', error.message);
    // On ne fait pas planter l'app si Redis n'est pas dispo
    // Le cache sera simplement désactivé
    return false;
  }
};

/**
 * Stocke une valeur dans le cache
 * @param {string} key - Clé du cache
 * @param {any} value - Valeur à stocker
 * @param {number} ttl - Durée de vie en secondes (défaut: 1 heure)
 */
const setCache = async (key, value, ttl = 3600) => {
  try {
    if (!redisClient.isReady) return false;
    await redisClient.setEx(key, ttl, JSON.stringify(value));
    logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`);
    return true;
  } catch (error) {
    logger.error(`Erreur cache SET ${key}:`, error.message);
    return false;
  }
};

/**
 * Récupère une valeur du cache
 * @param {string} key - Clé du cache
 * @returns {any|null} Valeur ou null si non trouvée
 */
const getCache = async (key) => {
  try {
    if (!redisClient.isReady) return null;
    const value = await redisClient.get(key);
    if (value) {
      logger.debug(`Cache HIT: ${key}`);
      return JSON.parse(value);
    }
    logger.debug(`Cache MISS: ${key}`);
    return null;
  } catch (error) {
    logger.error(`Erreur cache GET ${key}:`, error.message);
    return null;
  }
};

/**
 * Supprime une valeur du cache
 * @param {string} key - Clé du cache
 */
const deleteCache = async (key) => {
  try {
    if (!redisClient.isReady) return false;
    await redisClient.del(key);
    logger.debug(`Cache DEL: ${key}`);
    return true;
  } catch (error) {
    logger.error(`Erreur cache DEL ${key}:`, error.message);
    return false;
  }
};

/**
 * Supprime toutes les clés correspondant à un pattern
 * @param {string} pattern - Pattern de clés (ex: "products:*")
 */
const deleteCachePattern = async (pattern) => {
  try {
    if (!redisClient.isReady) return false;
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.debug(`Cache DEL pattern ${pattern}: ${keys.length} clés supprimées`);
    }
    return true;
  } catch (error) {
    logger.error(`Erreur cache DEL pattern ${pattern}:`, error.message);
    return false;
  }
};

/**
 * Vide tout le cache
 */
const flushCache = async () => {
  try {
    if (!redisClient.isReady) return false;
    await redisClient.flushAll();
    logger.info('Cache vidé (FLUSH ALL)');
    return true;
  } catch (error) {
    logger.error('Erreur cache FLUSH:', error.message);
    return false;
  }
};

// ==========================================
// CLÉS DE CACHE PRÉDÉFINIES
// ==========================================
const CACHE_KEYS = {
  PRODUCTS_ALL: 'products:all',
  PRODUCTS_FEATURED: 'products:featured',
  CATEGORIES_ALL: 'categories:all',
  PRODUCT: (id) => `product:${id}`,
  CATEGORY: (id) => `category:${id}`,
  USER_CART: (userId) => `cart:${userId}`,
  SESSION: (sessionId) => `session:${sessionId}`
};

// Durées de cache (en secondes)
const CACHE_TTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes
  LONG: 3600,      // 1 heure
  VERY_LONG: 86400 // 24 heures
};

module.exports = {
  redisClient,
  connectRedis,
  setCache,
  getCache,
  deleteCache,
  deleteCachePattern,
  flushCache,
  CACHE_KEYS,
  CACHE_TTL
};
