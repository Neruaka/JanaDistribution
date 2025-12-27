/**
 * Point d'entrée de l'API Jana Distribution
 * @description Serveur Express avec PostgreSQL et Redis
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import des configurations
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const logger = require('./config/logger');

// Import des routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const categoryRoutes = require('./routes/category.routes');
const productRoutes = require('./routes/product.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const adminOrderRoutes = require('./routes/admin.order.routes');
const adminStatsRoutes = require('./routes/admin.stats.routes');       
const adminClientsRoutes = require('./routes/admin.clients.routes');  
const settingsRoutes = require('./routes/settings.routes');

// Import des middlewares
const errorHandler = require('./middlewares/errorHandler');
const notFoundHandler = require('./middlewares/notFoundHandler');

// ==========================================
// INITIALISATION EXPRESS
// ==========================================
const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARES GLOBAUX
// ==========================================

// Sécurité
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting - AJUSTÉ pour le développement
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 1 * 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 500, // 500 requêtes par minute
  message: {
    success: false,
    message: 'Trop de requêtes, veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Désactiver le rate limiting en développement
  skip: (req) => process.env.NODE_ENV === 'development'
});
app.use('/api/', limiter);

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging des requêtes
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Jana Distribution opérationnelle',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Routes API publiques
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
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
// DÉMARRAGE DU SERVEUR
// ==========================================
const startServer = async () => {
  try {
    // Connexion à PostgreSQL
    await connectDB();
    logger.info('✅ Connexion PostgreSQL établie');

    // Connexion à Redis (optionnel)
    try {
      await connectRedis();
      logger.info('✅ Connexion Redis établie');
    } catch (redisError) {
      logger.warn('⚠️ Redis non disponible, fonctionnement sans cache');
    }

    // Démarrage du serveur
    app.listen(PORT, () => {
      logger.info(`🚀 Serveur démarré sur http://localhost:${PORT}`);
      logger.info(`📚 Environment: ${process.env.NODE_ENV}`);
      logger.info('📊 Routes disponibles:');
      logger.info('   - /api/admin/stats/* (dashboard)');
      logger.info('   - /api/admin/clients/* (gestion clients)');
      logger.info('   - /api/admin/orders/* (gestion commandes)');
    });
  } catch (error) {
    logger.error('❌ Erreur au démarrage du serveur:', error);
    process.exit(1);
  }
};

// Gestion propre de l'arrêt
process.on('SIGTERM', () => {
  logger.info('SIGTERM reçu, arrêt gracieux...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT reçu, arrêt gracieux...');
  process.exit(0);
});

// Lancement
startServer();

module.exports = app;
