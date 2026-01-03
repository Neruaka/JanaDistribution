/**
 * Configuration Redis
 * @description Compatible Railway (REDIS_URL) et développement local
 * 
 * ✅ MODIFIÉ POUR MISE EN LIGNE RAILWAY
 */

const Redis = require('ioredis');
const logger = require('./logger');

let redis = null;

/**
 * Connexion à Redis
 */
const connectRedis = async () => {
  try {
    // ==========================================
    // PRODUCTION (Railway fournit REDIS_URL)
    // ==========================================
    if (process.env.REDIS_URL) {
      console.log('🌐 Redis: Mode Production détecté (REDIS_URL)');
      
      redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        lazyConnect: true
      });
    } 
    // ==========================================
    // DÉVELOPPEMENT LOCAL
    // ==========================================
    else if (process.env.REDIS_HOST) {
      console.log('🏠 Redis: Mode Développement détecté');
      
      redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: 3
      });
    } 
    // ==========================================
    // REDIS NON CONFIGURÉ (optionnel)
    // ==========================================
    else {
      logger.warn('⚠️ Redis non configuré - L\'application fonctionne sans cache');
      return null;
    }

    // Gestionnaires d'événements
    redis.on('error', (err) => {
      logger.error('Redis error:', err.message);
    });

    redis.on('connect', () => {
      logger.info('✅ Connexion Redis établie');
    });

    redis.on('ready', () => {
      logger.info('✅ Redis prêt à recevoir des commandes');
    });

    redis.on('close', () => {
      logger.warn('⚠️ Connexion Redis fermée');
    });

    // Tester la connexion
    await redis.connect();
    await redis.ping();

    return redis;
  } catch (error) {
    logger.warn(`⚠️ Redis non disponible: ${error.message}`);
    logger.warn('⚠️ L\'application continue sans cache Redis');
    redis = null;
    return null;
  }
};

/**
 * Obtenir l'instance Redis
 */
const getRedis = () => redis;

/**
 * Vérifier si Redis est disponible
 */
const isRedisAvailable = () => redis !== null && redis.status === 'ready';

/**
 * Fermer la connexion Redis
 */
const closeRedis = async () => {
  if (redis) {
    await redis.quit();
    logger.info('Connexion Redis fermée');
  }
};

/**
 * Helper pour le cache avec fallback
 */
const cacheGet = async (key) => {
  if (!isRedisAvailable()) return null;
  try {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.warn(`Cache get error: ${error.message}`);
    return null;
  }
};

const cacheSet = async (key, value, ttlSeconds = 300) => {
  if (!isRedisAvailable()) return false;
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.warn(`Cache set error: ${error.message}`);
    return false;
  }
};

const cacheDel = async (key) => {
  if (!isRedisAvailable()) return false;
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    logger.warn(`Cache del error: ${error.message}`);
    return false;
  }
};

module.exports = { 
  connectRedis, 
  getRedis,
  isRedisAvailable,
  closeRedis,
  cacheGet,
  cacheSet,
  cacheDel
};
