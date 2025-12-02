/**
 * Configuration de la connexion PostgreSQL
 * @description Pool de connexions avec pg
 */

const { Pool } = require('pg');
const logger = require('./logger');

// ==========================================
// CONFIGURATION DU POOL
// ==========================================
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'jana_distribution',
  user: process.env.DB_USER || 'jana_user',
  password: process.env.DB_PASSWORD || 'jana_secret_2024',
  
  // Configuration du pool
  max: 20,                    // Nombre max de connexions
  idleTimeoutMillis: 30000,   // Fermer les connexions inactives après 30s
  connectionTimeoutMillis: 2000, // Timeout de connexion
});

// ==========================================
// ÉVÉNEMENTS DU POOL
// ==========================================
pool.on('connect', () => {
  logger.debug('Nouvelle connexion au pool PostgreSQL');
});

pool.on('error', (err) => {
  logger.error('Erreur inattendue du pool PostgreSQL:', err);
});

// ==========================================
// FONCTIONS UTILITAIRES
// ==========================================

/**
 * Teste la connexion à la base de données
 */
const connectDB = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    logger.info(`PostgreSQL connecté: ${result.rows[0].now}`);
    return true;
  } catch (error) {
    logger.error('Erreur de connexion PostgreSQL:', error.message);
    throw error;
  }
};

/**
 * Exécute une requête SQL
 * @param {string} text - Requête SQL
 * @param {Array} params - Paramètres de la requête
 * @returns {Promise<Object>} Résultat de la requête
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug(`Query executed in ${duration}ms`, { 
      text: text.substring(0, 100),
      rows: result.rowCount 
    });
    return result;
  } catch (error) {
    logger.error('Erreur SQL:', { text: text.substring(0, 100), error: error.message });
    throw error;
  }
};

/**
 * Obtient un client pour une transaction
 * @returns {Promise<Object>} Client PostgreSQL
 */
const getClient = async () => {
  const client = await pool.connect();
  const originalQuery = client.query.bind(client);
  const originalRelease = client.release.bind(client);
  
  // Timeout pour éviter les fuites de connexion
  const timeout = setTimeout(() => {
    logger.error('Client PostgreSQL non libéré après 5s!');
    client.release();
  }, 5000);

  client.query = (...args) => {
    return originalQuery(...args);
  };

  client.release = () => {
    clearTimeout(timeout);
    return originalRelease();
  };

  return client;
};

module.exports = {
  pool,
  query,
  getClient,
  connectDB
};
