/**
 * Configuration Base de données PostgreSQL
 * @description Compatible Railway (DATABASE_URL) et développement local
 * 
 * ✅ MODIFIÉ POUR MISE EN LIGNE RAILWAY
 */

const { Pool } = require('pg');
const logger = require('./logger');

let pool;

// Détection automatique de l'environnement
if (process.env.DATABASE_URL) {
  // ==========================================
  // PRODUCTION (Railway, Render, Heroku...)
  // ==========================================
  console.log('🌐 Mode Production détecté (DATABASE_URL)');
  
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
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
  console.log('🏠 Mode Développement détecté');
  
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
 * Connexion à la base de données
 */
const connectDB = async () => {
  try {
    const client = await pool.connect();
    
    // Test de connexion
    const result = await client.query('SELECT NOW() as now');
    logger.info(`✅ Connexion PostgreSQL établie - ${result.rows[0].now}`);
    
    client.release();
    return true;
  } catch (error) {
    logger.error('❌ Erreur connexion PostgreSQL:', error.message);
    
    // En production, on peut réessayer
    if (process.env.NODE_ENV === 'production') {
      logger.info('🔄 Nouvelle tentative dans 5 secondes...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectDB();
    }
    
    throw error;
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
