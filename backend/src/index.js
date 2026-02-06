/**
 * Point d'entrÃ©e de l'API Jana Distribution
 * @description Serveur Express avec PostgreSQL et Redis
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import des configurations
const { connectDB, query } = require('./config/database');
const { connectRedis } = require('./config/redis');
const logger = require('./config/logger');

// Import des routes
const authRoutes = require('./routes/auth.routes');
const categoryRoutes = require('./routes/category.routes');
const productRoutes = require('./routes/product.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const adminOrderRoutes = require('./routes/admin.order.routes');
const adminStatsRoutes = require('./routes/admin.stats.routes');       
const adminClientsRoutes = require('./routes/admin.clients.routes');  
const settingsRoutes = require('./routes/settings.routes');
const path = require('path');
const fs = require('fs');

// Import des middlewares
const errorHandler = require('./middlewares/errorHandler');
const notFoundHandler = require('./middlewares/notFoundHandler');

// ==========================================
// Gestion des uploads de fichiers (crÃ©ation du dossier si nÃ©cessaire)
// ==========================================

// CrÃ©er le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, '../uploads/products');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ==========================================
// INITIALISATION EXPRESS
// ==========================================
const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARES GLOBAUX
// ==========================================

// SÃ©curitÃ©
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting - AJUSTÃ‰ pour le dÃ©veloppement
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 1 * 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 500, // 500 requÃªtes par minute
  message: {
    success: false,
    message: 'Trop de requÃªtes, veuillez rÃ©essayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // DÃ©sactiver le rate limiting en dÃ©veloppement
  skip: (req) => process.env.NODE_ENV === 'development'
});
app.use('/api/', limiter);

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging des requÃªtes
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// ==========================================
// ROUTES
// ==========================================

// Fichiers statiques pour les uploads
// Fichiers statiques pour les uploads - AVEC HEADERS CORS
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({
      success: true,
      message: 'API Jana Distribution operationnelle',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      services: {
        database: 'up'
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'API indisponible',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      services: {
        database: 'down'
      }
    });
  }
});

// Routes API publiques
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Routes API Admin
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/stats', adminStatsRoutes);       
app.use('/api/admin/clients', adminClientsRoutes);   
app.use('/api/settings', settingsRoutes);

// ==========================================
// GESTION DES ERREURS
// ==========================================
app.use(notFoundHandler);
app.use(errorHandler);

// ==========================================
// DÃ‰MARRAGE DU SERVEUR
// ==========================================
const startServer = async () => {
  try {
    // Connexion Ã  PostgreSQL
    await connectDB();
    logger.info('âœ… Connexion PostgreSQL Ã©tablie');

    // Connexion Ã  Redis (optionnel)
    try {
      await connectRedis();
      logger.info('âœ… Connexion Redis Ã©tablie');
    } catch (redisError) {
      logger.warn('âš ï¸ Redis non disponible, fonctionnement sans cache');
    }

    app.listen(PORT, () => {
      logger.info('Serveur demarre sur le port ' + PORT);
      logger.info('Environment: ' + process.env.NODE_ENV);
    });

    logger.info('ðŸ“Š Serveur prÃªt - toutes les connexions Ã©tablies');
  } catch (error) {
    logger.error('âŒ Erreur au dÃ©marrage du serveur:', error);
    process.exit(1);
  }
};

// Gestion propre de l'arrÃªt
process.on('SIGTERM', () => {
  logger.info('SIGTERM reÃ§u, arrÃªt gracieux...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT reÃ§u, arrÃªt gracieux...');
  process.exit(0);
});

// Lancement
startServer();

module.exports = app;
