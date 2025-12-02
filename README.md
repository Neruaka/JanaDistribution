# 🥬 Jana Distribution

> Plateforme e-commerce B2B/B2C pour le commerce de gros alimentaire

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-red.svg)](https://redis.io/)

## 📋 Description

Jana Distribution est une application e-commerce complète permettant la vente de produits alimentaires en gros, destinée à deux segments de clientèle :
- **Particuliers** : achats à l'unité
- **Professionnels** : achats en gros avec tarifs dédiés

## 🚀 Stack Technique

### Backend
- **Node.js** 18+ avec **Express.js**
- **PostgreSQL** 15 (base de données relationnelle)
- **Redis** 7 (cache)
- **JWT** pour l'authentification
- **bcrypt** pour le hashage des mots de passe

### Frontend
- **React** 18.2 avec **Vite**
- **React Router** v6
- **Axios** pour les requêtes HTTP
- **Tailwind CSS** pour le styling

### DevOps
- **Docker** & **Docker Compose**
- **GitHub Actions** (CI/CD)

## 📦 Installation

### Prérequis
- Node.js 18+
- Docker & Docker Compose
- Git

### 1. Cloner le repository

```bash
git clone https://github.com/votre-username/jana-distribution.git
cd jana-distribution
```

### 2. Configurer l'environnement

```bash
# Backend
cp backend/.env.example backend/.env
# Modifier les variables si nécessaire
```

### 3. Lancer les conteneurs Docker

```bash
docker-compose up -d
```

Cela démarre :
- PostgreSQL sur le port `5432`
- Redis sur le port `6379`
- Adminer (interface DB) sur le port `8080`

### 4. Installer les dépendances

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 5. Lancer l'application

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 🔗 URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API Backend | http://localhost:3000 |
| API Health | http://localhost:3000/api/health |
| Adminer (DB) | http://localhost:8080 |

## 📁 Structure du Projet

```
jana-distribution/
├── backend/
│   ├── src/
│   │   ├── config/          # Configurations (DB, Redis, Logger)
│   │   ├── controllers/     # Logique des routes
│   │   ├── middlewares/     # Middlewares Express
│   │   ├── models/          # Modèles de données
│   │   ├── repositories/    # Accès aux données
│   │   ├── routes/          # Définition des routes
│   │   ├── services/        # Logique métier
│   │   ├── utils/           # Utilitaires
│   │   └── index.js         # Point d'entrée
│   ├── tests/               # Tests unitaires
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Composants réutilisables
│   │   ├── pages/           # Pages de l'application
│   │   ├── services/        # Services API
│   │   ├── hooks/           # Custom hooks
│   │   ├── context/         # Contexts React
│   │   ├── assets/          # Images, fonts, etc.
│   │   ├── App.jsx          # Composant principal
│   │   └── main.jsx         # Point d'entrée
│   └── package.json
│
├── docs/                    # Documentation
├── scripts/                 # Scripts utilitaires
│   └── init.sql             # Script d'initialisation DB
├── docker-compose.yml       # Configuration Docker
└── README.md
```

## 🔐 Comptes de Test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@jana-distribution.fr | Admin123! |
| Client | client@test.fr | Client123! |

## 📡 Endpoints API

### Authentification
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion |
| POST | `/api/auth/logout` | Déconnexion |
| GET | `/api/auth/me` | Profil utilisateur |

### Produits
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/products` | Liste des produits |
| GET | `/api/products/:id` | Détail d'un produit |
| POST | `/api/products` | Créer un produit (admin) |
| PUT | `/api/products/:id` | Modifier un produit (admin) |
| DELETE | `/api/products/:id` | Supprimer un produit (admin) |

### Panier
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/cart` | Récupérer le panier |
| POST | `/api/cart/items` | Ajouter au panier |
| PUT | `/api/cart/items/:id` | Modifier quantité |
| DELETE | `/api/cart/items/:id` | Retirer du panier |

### Commandes
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/orders` | Liste des commandes |
| GET | `/api/orders/:id` | Détail d'une commande |
| POST | `/api/orders` | Créer une commande |

## 🧪 Tests

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 📄 Licence

Ce projet est réalisé dans le cadre de la certification CDA (Concepteur Développeur d'Applications).

## 👤 Auteur

**Frederick** - Projet CDA 2024

---

*Projet Jana Distribution - E-commerce B2B/B2C*
