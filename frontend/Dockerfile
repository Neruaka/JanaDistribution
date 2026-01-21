# =============================================
# DOCKERFILE - JANA DISTRIBUTION FRONTEND
# =============================================
# Multi-stage build avec Nginx pour servir les fichiers statiques
# Compatible Railway (port dynamique)

# =============================================
# STAGE 1: Builder
# =============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Arguments de build pour les variables d'environnement
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build de production
RUN npm run build

# =============================================
# STAGE 2: Production avec Nginx
# =============================================
FROM nginx:alpine AS production

# Métadonnées de l'image
LABEL maintainer="Frederick Toufik <frederick@jana-distribution.fr>"
LABEL description="Frontend Jana Distribution - React SPA"
LABEL version="1.0.0"

# Supprimer la configuration par défaut de Nginx
RUN rm -rf /usr/share/nginx/html/*
RUN rm /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés depuis le stage builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier le template de configuration Nginx
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Railway injecte $PORT - Nginx utilisera envsubst automatiquement
# L'image nginx:alpine exécute envsubst sur les fichiers .template au démarrage

# Port par défaut (sera remplacé par $PORT de Railway)
ENV PORT=80

# Exposer le port (informatif)
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/ || exit 1

# Commande de démarrage (utilise le entrypoint par défaut de nginx:alpine)
CMD ["nginx", "-g", "daemon off;"]
