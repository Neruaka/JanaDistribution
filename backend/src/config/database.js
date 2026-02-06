/**
 * Configuration Base de donnÃ©es PostgreSQL
 * @description Compatible Railway (DATABASE_URL) et dÃ©veloppement local
 * 
 * âœ… MODIFIÃ‰ POUR MISE EN LIGNE RAILWAY
 */

const { Pool } = require('pg');
const logger = require('./logger');

let pool;

// DÃ©tection automatique de l'environnement
if (process.env.DATABASE_URL) {
  // ==========================================
  // PRODUCTION (Railway, Render, Heroku...)
  // ==========================================
  console.log('ðŸŒ Mode Production dÃ©tectÃ© (DATABASE_URL)');
  
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Requis pour Railway/Render
    },
    max: 20,                    // Connexions max dans le pool
    idleTimeoutMillis: 30000,   // Fermer connexions inactives aprÃ¨s 30s
    connectionTimeoutMillis: 10000 // Timeout connexion 10s
  });
} else {
  // ==========================================
  // DÃ‰VELOPPEMENT LOCAL
  // ==========================================
  console.log('ðŸ  Mode DÃ©veloppement dÃ©tectÃ©');
  
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'jana_distribution',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  });
}

/**
 * Connexion Ã  la base de donnÃ©es
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
      logger.info(`Connexion PostgreSQL etablie - ${result.rows[0].now}`);

      client.release();
      return true;
    } catch (error) {
      logger.error('Erreur connexion PostgreSQL:', error.message);

      if (attempt === safeMaxRetries) {
        logger.error(`Echec connexion PostgreSQL apres ${safeMaxRetries} tentative(s)`);
        throw error;
      }

      logger.warn(`Nouvelle tentative PostgreSQL (${attempt + 1}/${safeMaxRetries}) dans ${retryDelayMs / 1000} secondes...`);
      await new Promise(resolve => setTimeout(resolve, retryDelayMs));
    }
  }
};

/**
 * ExÃ©cuter une requÃªte SQL
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log en dÃ©veloppement uniquement
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
  logger.info('Pool PostgreSQL fermÃ©');
};

module.exports = { 
  pool, 
  connectDB, 
  query, 
  getClient,
  closePool 
};

