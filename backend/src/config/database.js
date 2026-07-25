/**
 * Configuration Base de données PostgreSQL
 * @description Compatible Railway (DATABASE_URL) et développement local
 * 
 *  MODIFIÉ POUR MISE EN LIGNE RAILWAY
 */

const { Pool } = require('pg');
const logger = require('./logger');

let pool;
const getEnv = (...keys) => {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }
  return undefined;
};

const hasExplicitLocalDbConfig = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'PGHOST', 'PGPORT', 'PGDATABASE', 'PGUSER', 'PGPASSWORD'].some((key) => {
  const value = process.env[key];
  return typeof value === 'string' && value.trim() !== '';
});
const hasDatabaseUrl = typeof process.env.DATABASE_URL === 'string' && process.env.DATABASE_URL.trim() !== '';
const shouldUseDatabaseUrl = hasDatabaseUrl && (process.env.NODE_ENV === 'production' || !hasExplicitLocalDbConfig);
const parsedLocalPort = parseInt(getEnv('DB_PORT', 'PGPORT') || '5432', 10);
const localDbConfig = {
  host: getEnv('DB_HOST', 'PGHOST') || 'localhost',
  port: Number.isNaN(parsedLocalPort) ? 5432 : parsedLocalPort,
  database: getEnv('DB_NAME', 'PGDATABASE') || 'jana_distribution',
  user: getEnv('DB_USER', 'PGUSER') || 'postgres',
  password: getEnv('DB_PASSWORD', 'PGPASSWORD') || 'postgres'
};

// Détection automatique de l'environnement
if (shouldUseDatabaseUrl) {
  // ==========================================
  // PRODUCTION (Railway, Render, Heroku...)
  // ==========================================
  console.log('🌐 Mode Production détecté (DATABASE_URL)');

  // SSL requis sur Railway/Render (terminaison TLS gérée par la plateforme).
  // Désactivable via DB_SSL_DISABLE=true pour un PostgreSQL auto-hébergé sans TLS
  // (ex: conteneur Docker joint sur un réseau interne, comme sur le homeserver).
  const disableSsl = getEnv('DB_SSL_DISABLE') === 'true';

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: disableSsl ? false : {
      rejectUnauthorized: false // Requis pour Railway/Render
    },
    max: 20,                    // Connexions max dans le pool
    idleTimeoutMillis: 30000,   // Fermer connexions inactives après 30s
    connectionTimeoutMillis: 10000 // Timeout connexion 10s
  });
} else {
  // ==========================================
  // DÉVELOPPEMENT LOCAL
  // ==========================================
  console.log(`🛈 Mode Développement détecté (host=${localDbConfig.host}, db=${localDbConfig.database}, user=${localDbConfig.user})`);
  
  pool = new Pool({
    host: localDbConfig.host,
    port: localDbConfig.port,
    database: localDbConfig.database,
    user: localDbConfig.user,
    password: localDbConfig.password,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  });
}

/**
 * Connexion à la base de données
 */
const connectDB = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const retryDelayMs = parseInt(process.env.DB_RETRY_DELAY_MS, 10) || 5000;
  const parsedMaxRetries = parseInt(process.env.DB_MAX_RETRIES, 10);
  const maxRetries = isProduction ? (Number.isNaN(parsedMaxRetries) ? 10 : parsedMaxRetries) : 1;
  const safeMaxRetries = Math.max(maxRetries, 1);

  for (let attempt = 1; attempt <= safeMaxRetries; attempt += 1) {
    try {
      const client = await pool.connect();

      // Test de connexion
      const result = await client.query('SELECT NOW() as now');
      logger.info(`Connexion PostgreSQL établie - ${result.rows[0].now}`);

      client.release();
      return true;
    } catch (error) {
      logger.error('Erreur connexion PostgreSQL:', error.message);

      if (error?.code === '28P01' || error?.code === '28000') {
        logger.error(
          `Authentification PostgreSQL invalide (user=${localDbConfig.user}, db=${localDbConfig.database}, host=${localDbConfig.host}).`
        );
        logger.error(
          'Si vous etes en Docker local avec un ancien volume, lancez: docker compose down -v puis docker compose up -d --build'
        );
      }

      if (attempt === safeMaxRetries) {
        logger.error(`Échec connexion PostgreSQL après ${safeMaxRetries} tentative(s)`);
        throw error;
      }

      logger.warn(`Nouvelle tentative PostgreSQL (${attempt + 1}/${safeMaxRetries}) dans ${retryDelayMs / 1000} secondes...`);
      await new Promise(resolve => setTimeout(resolve, retryDelayMs));
    }
  }
};

/**
 * Exécuter une requête SQL
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log en développement uniquement
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`Query executed in ${duration}ms`, { 
        text: text.substring(0, 100),
        rows: result.rowCount 
      });
    }
    
    return result;
  } catch (error) {
    logger.error('Query error:', { 
      text: text.substring(0, 100), 
      error: error.message 
    });
    throw error;
  }
};

/**
 * Obtenir un client pour les transactions
 */
const getClient = () => pool.connect();

/**
 * Fermer le pool (pour les tests)
 */
const closePool = async () => {
  await pool.end();
  logger.info('Pool PostgreSQL fermé');
};

module.exports = { 
  pool, 
  connectDB, 
  query, 
  getClient,
  closePool 
};

