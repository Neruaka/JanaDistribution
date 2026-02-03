# =============================================
# DOCKERFILE - JANA DISTRIBUTION BACKEND
# =============================================
# Multi-stage build pour optimiser la taille de l'image

# =============================================
# STAGE 1: Dependencies
# =============================================
FROM node:20-alpine AS dependencies

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances de production uniquement
RUN npm ci --only=production && npm cache clean --force

# =============================================
# STAGE 2: Production
# =============================================
FROM node:20-alpine AS production

# Métadonnées de l'image
LABEL maintainer="Frederick Toufik <frederick@jana-distribution.fr>"
LABEL description="API REST Jana Distribution - E-commerce B2B/B2C"
LABEL version="1.0.0"

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3000

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Créer le dossier logs AVANT de copier les fichiers
RUN mkdir -p /app/logs

# Copier les dépendances de production depuis le stage dependencies
COPY --from=dependencies /app/node_modules ./node_modules

# Copier le code source
COPY . .

# Supprimer les fichiers de développement
RUN rm -rf tests/ jest.config.js .env.example

# Donner les permissions à l'utilisateur nodejs sur TOUT le dossier app
RUN chown -R nodejs:nodejs /app

# Changer vers l'utilisateur non-root
USER nodejs

# Exposer le port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Commande de démarrage
CMD ["node", "src/index.js"]
