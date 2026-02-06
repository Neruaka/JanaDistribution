# Jana Distribution

Jana Distribution est une plateforme e-commerce B2B/B2C pour la vente de produits alimentaires, avec:
- un backend Node.js/Express (API REST),
- un frontend React/Vite,
- PostgreSQL pour les donnees,
- Redis pour le cache,
- Docker Compose pour l'orchestration locale.

## Sommaire
1. Vue d'ensemble
2. Architecture
3. Fonctionnalites principales
4. Stack technique
5. Structure du repository
6. Demarrage rapide (Docker)
7. Demarrage developpement (app en local)
8. Configuration des variables d'environnement
9. Seed et comptes de test
10. Scripts utiles
11. API - vue rapide
12. Base de donnees
13. Qualite, tests et CI/CD
14. Depannage
15. Auteur et licence

## Vue d'ensemble

Le projet couvre un cycle e-commerce complet:
- navigation catalogue et fiche produit,
- panier et commande,
- authentification avec access token + refresh token,
- espace client (profil et historique commandes),
- espace admin (produits, categories, clients, commandes, statistiques, parametres),
- pages legales (CGV, confidentialite, mentions legales, accessibilite).

## Architecture

Flux principal:
1. Le frontend React consomme l'API `/api/*`.
2. Le backend Express gere la logique metier, la securite et la validation.
3. PostgreSQL stocke les entites metier (utilisateurs, produits, commandes, etc.).
4. Redis est utilise comme cache quand disponible (fallback sans cache si indisponible).
5. Les images uploades sont servies via `/uploads`.

## Fonctionnalites principales

Fonctionnalites client:
- inscription, connexion, mot de passe oublie/reinitialisation,
- catalogue avec recherche, promotions, nouveautes,
- panier persistant par utilisateur,
- creation/annulation de commande,
- consultation historique et detail de commandes.

Fonctionnalites admin:
- CRUD produits + import/export + gestion image + operations bulk,
- CRUD categories + reordonnancement + activation/desactivation,
- gestion des commandes et des clients,
- dashboard de statistiques,
- gestion des parametres du site (`/api/settings/admin`).

## Stack technique

| Domaine | Technologies |
|---|---|
| Backend | Node.js, Express, pg, ioredis, JWT, bcrypt, Joi, express-validator |
| Frontend | React 18, Vite, React Router v6, Axios, Tailwind CSS, Vitest |
| Donnees | PostgreSQL 15, Redis 7 |
| DevOps | Docker, Docker Compose, GitHub Actions |

Versions recommandees:
- Node.js 20+ (coherent avec CI et Dockerfiles),
- npm 10+,
- Docker Desktop avec plugin Compose.

## Structure du repository

```text
.
|-- backend/
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middlewares/
|   |   |-- repositories/
|   |   |-- routes/
|   |   |-- services/
|   |   `-- validators/
|   |-- scripts/
|   |   |-- init.sql
|   |   |-- seed.js
|   |   `-- seed_user.js
|   `-- tests/
|-- frontend/
|   `-- src/
|       |-- components/
|       |-- contexts/
|       |-- hooks/
|       |-- pages/
|       |-- services/
|       `-- utils/
|-- .github/workflows/
|-- docker-compose.yml
|-- README-CI-CD.md
`-- README.md
```

## Demarrage rapide (Docker)

1. Copier les fichiers d'environnement:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

2. Lancer la stack complete:

```bash
docker compose up -d --build
```

3. (Optionnel) Activer Adminer:

```bash
docker compose --profile dev up -d
```

4. Verifier les services:

```bash
docker compose ps
```

URLs par defaut:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`
- Healthcheck: `http://localhost:3000/api/health`
- Adminer (profile dev): `http://localhost:8080`

## Demarrage developpement (app en local)

Cette option lance Postgres/Redis en conteneurs, puis backend/frontend en local.

1. Demarrer les dependances:

```bash
docker compose up -d postgres redis
```

2. Lancer le backend:

```bash
cd backend
npm ci
npm run dev
```

3. Lancer le frontend:

```bash
cd frontend
npm ci
npm run dev
```

Notes:
- Vite est configure avec un proxy `/api -> http://localhost:3000`.
- L'API healthcheck verifie la connectivite PostgreSQL.

## Configuration des variables d'environnement

### Racine (`.env`) - utilise par Docker Compose

Variables principales:
- `DB_PORT`, `REDIS_PORT`, `BACKEND_PORT`, `FRONTEND_PORT`, `ADMINER_PORT`
- `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `NODE_ENV`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `BCRYPT_SALT_ROUNDS`
- `VITE_API_URL`

### Backend (`backend/.env`)

Variables supportees par le code backend:
- Serveur: `NODE_ENV`, `PORT`, `LOG_LEVEL`
- Database: `DATABASE_URL` ou `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD`
- Retry DB: `DB_MAX_RETRIES`, `DB_RETRY_DELAY_MS`
- Redis: `REDIS_URL` ou `REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD`
- Auth: `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`, `BCRYPT_SALT_ROUNDS`
- Rate limiting: `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`, `AUTH_RATE_LIMIT_WINDOW_MS`, `AUTH_RATE_LIMIT_MAX_REQUESTS`
- CORS: `CORS_ORIGIN`
- Email (Brevo): `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`, `FRONTEND_URL`

### Frontend (`frontend/.env`)

- `VITE_API_URL` (exemple local: `http://localhost:3000/api`)

## Seed et comptes de test

Script seed principal:

```bash
cd backend
npm run seed
```

Le seed cree des categories, produits et comptes de demonstration.

Comptes de test:
- Admin: `admin@jana-distribution.fr` / `Admin123!`
- Client: `client@test.fr` / `Client123!`
- Pro: `pro@restaurant.fr` / `Pro123!`

## Scripts utiles

### Backend (`backend/package.json`)

| Script | Description |
|---|---|
| `npm run dev` | Lancement dev avec nodemon |
| `npm start` | Lancement production |
| `npm run seed` | Seed base de donnees |
| `npm test` | Tests Jest + coverage |
| `npm run test:unit` | Tests unitaires |
| `npm run test:integration` | Tests integration |
| `npm run test:ci` | Mode CI (jest-junit) |
| `npm run lint` | Lint ESLint |
| `npm run lint:fix` | Lint avec autofix |

### Frontend (`frontend/package.json`)

| Script | Description |
|---|---|
| `npm run dev` | Serveur Vite |
| `npm run build` | Build production |
| `npm run preview` | Preview build |
| `npm test` | Tests Vitest |
| `npm run test:coverage` | Tests avec couverture |
| `npm run lint` | Lint ESLint |

## API - vue rapide

Authentification:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/refresh`
- `GET /api/auth/me` (auth)
- `PUT /api/auth/profile` (auth)
- `PUT /api/auth/password` (auth)
- `POST /api/auth/logout` (auth)
- `DELETE /api/auth/account` (auth)

Catalogue et contenu public:
- `GET /api/categories`
- `GET /api/categories/slug/:slug`
- `GET /api/products`
- `GET /api/products/search`
- `GET /api/products/promos`
- `GET /api/products/new`
- `GET /api/products/slug/:slug`
- `GET /api/settings/public`
- `GET /api/settings/delivery-fees`

Panier et commandes (auth requise):
- `GET /api/cart`
- `POST /api/cart/items`
- `PUT /api/cart/items/:itemId`
- `DELETE /api/cart/items/:itemId`
- `DELETE /api/cart`
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:id`
- `POST /api/orders/:id/cancel`

Administration:
- `POST/PUT/PATCH/DELETE /api/categories/*` (admin)
- `POST/PUT/PATCH/DELETE /api/products/*` (admin)
- `GET /api/products/admin/*` (admin)
- `GET /api/admin/orders/*` (admin)
- `GET /api/admin/stats/*` (admin)
- `GET/PATCH/DELETE /api/admin/clients/*` (admin)
- `GET/PUT /api/settings/admin*` (admin)

Authentification API:
- utiliser le header `Authorization: Bearer <token>`.

## Base de donnees

Schema principal initialise par `backend/scripts/init.sql`.

Tables principales:
- `utilisateur`
- `adresse`
- `categorie`
- `produit`
- `panier`
- `ligne_panier`
- `commande`
- `ligne_commande`
- `configuration`

Le script SQL cree aussi:
- les enums metier (role utilisateur, type client, statut commande, etc.),
- les indexes principaux,
- des triggers `date_modification`,
- des valeurs initiales pour la table `configuration`.

## Qualite, tests et CI/CD

Workflows GitHub Actions:
- `ci.yml`: lint, tests backend, build frontend, audit securite npm.
- `docker.yml`: build/push images backend/frontend et test compose.
- `deploy.yml`: pipeline de deploiement (staging/production) a completer selon votre infra.

Documentation detaillee CI/CD:
- voir `README-CI-CD.md`.

## Depannage

Probleme: port deja occupe.
- Modifier les ports dans `.env` puis relancer `docker compose up -d`.

Probleme: schema SQL non reapplique.
- Les scripts d'init Postgres ne se rejouent pas si le volume existe deja.
- Pour reset complet local: `docker compose down -v` puis `docker compose up -d`.

Probleme: Redis indisponible.
- Le backend continue a fonctionner sans cache (mode degrade).

Probleme: frontend ne contacte pas le bon backend.
- Verifier `VITE_API_URL` dans `frontend/.env`.
- En dev Vite local, verifier aussi le proxy `/api` dans `frontend/vite.config.js`.

## Auteur et licence

Auteur:
- Frederick Toufik

Licence:
- ISC (voir `backend/package.json`).
