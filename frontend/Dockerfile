# =============================================
# DOCKERFILE - JANA DISTRIBUTION FRONTEND
# =============================================
# Multi-stage build avec Nginx pour servir les fichiers statiques

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
ARG VITE_API_URL=http://localhost:3000/api
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

# Copier les fichiers buildés depuis le stage builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier la configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposer le port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Commande de démarrage
CMD ["nginx", "-g", "daemon off;"]
