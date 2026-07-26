# 01 — Inventaire du Projet

> ⚠️ **Document historique (état figé au 2026-06-14)** — Rédigé lors de l'audit initial, avant le retrait complet de Stripe (T4-07, 2026-07-02) et l'ajout de la facturation légale (Phase 5) et des tests d'intégration réels (Phase 7). Les références à Stripe, aux webhooks et aux tests 100% mockés ne reflètent plus l'état actuel du code. Voir `docs/ETAT_ACTUEL_PROJET.md` et `docs/PLAN_CORRECTION_AUDIT.md` pour l'état réel à jour.

> Audit réalisé le 2026-06-14 par inspection statique.

---

## Stack détectée

| Composant | Technologie | Version | Source |
|---|---|---|---|
| Runtime backend | Node.js | ≥ 18.0.0 | `backend/package.json` engines |
| Framework API | Express | 4.18.2 | `backend/package.json` |
| Base de données | PostgreSQL | 15-alpine | `docker-compose.yml` |
| Cache | Redis | 7-alpine | `docker-compose.yml` |
| ORM / accès DB | pg (node-postgres) | 8.11.3 | `backend/package.json` |
| Client Redis | ioredis + redis | 5.3.2 / 4.7.1 | `backend/package.json` ⚠️ doublon |
| Authentification | JWT (jsonwebtoken 9.0.2) | 9.0.2 | `backend/package.json` |
| Hachage mot de passe | bcrypt | 5.1.1 | `backend/package.json` |
| Paiement | Stripe | 22.0.2 | `backend/package.json` |
| Email | Brevo (API REST) | N/A | `email.service.js` |
| Uploads | Multer | 1.4.5-lts.1 | `backend/package.json` |
| Logging | Winston | 3.11.0 | `backend/package.json` |
| Validation | express-validator + Joi | 7.3.1 / 17.11.0 | `backend/package.json` ⚠️ doublon |
| Rate limiting | express-rate-limit | 7.1.5 | `backend/package.json` |
| Sécurité HTTP | Helmet | 7.1.0 | `backend/package.json` |
| CORS | cors | 2.8.5 | `backend/package.json` |
| UUID | uuid | 9.0.1 | `backend/package.json` |
| Frontend framework | React | 18.2.0 | `frontend/package.json` |
| Build tool | Vite | 7.3.0 | `frontend/package.json` |
| Routing frontend | React Router Dom | 6.30.3 | `frontend/package.json` |
| Requêtes HTTP | Axios | 1.6.2 | `frontend/package.json` |
| UI / Design | TailwindCSS | 3.4.0 | `frontend/package.json` |
| Icônes | Lucide React | 0.555.0 | `frontend/package.json` |
| Animations | Framer Motion | 12.23.25 | `frontend/package.json` |
| Toast | React Hot Toast | 2.4.1 | `frontend/package.json` |
| Graphiques | Recharts | 3.5.1 | `frontend/package.json` |
| Excel frontend | ExcelJS | 4.4.0 | `frontend/package.json` |
| Stripe frontend | @stripe/stripe-js | 9.2.0 | `frontend/package.json` |
| Tests backend | Jest + supertest | 29.7.0 / 6.3.3 | `backend/package.json` |
| Tests frontend | Vitest | 4.0.16 | `frontend/package.json` |
| Infrastructure locale | Docker + Docker Compose | Postgres 15, Redis 7 | `docker-compose.yml` |
| Hébergement | Railway | N/A | `backend/railway.json`, `frontend/railway.json` |
| CI/CD | GitHub Actions | N/A | `.github/workflows/` |
| Géocodage | BAN (api-adresse.data.gouv.fr) | N/A | `geocoding.service.js` |

**Remarque importante** : La stack décrite initialement (MUI/Chakra UI, Redux) ne correspond PAS à la stack réelle. Le frontend utilise **TailwindCSS** (pas MUI/Chakra) et **Context API** (pas Redux).

---

## Arborescence principale

```
JanaDistribution/
├── .github/
│   └── workflows/
│       ├── ci.yml           — Tests CI
│       ├── deploy.yml       — Déploiement Railway
│       └── docker.yml       — Build Docker
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js  — Pool pg
│   │   │   ├── logger.js    — Winston
│   │   │   ├── redis.js     — ioredis
│   │   │   └── stripe.js    — Init Stripe SDK
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── cart.controller.js
│   │   │   ├── category.controller.js
│   │   │   ├── order.controller.js
│   │   │   ├── payment.controller.js
│   │   │   ├── product.controller.js
│   │   │   ├── settings.controller.js
│   │   │   └── stats.controller.js
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js   — JWT verify + rôle
│   │   │   ├── errorHandler.js
│   │   │   ├── notFoundHandler.js
│   │   │   ├── upload.middleware.js — Multer
│   │   │   └── validate.middleware.js
│   │   ├── repositories/
│   │   │   ├── cart.repository.js
│   │   │   ├── category.repository.js
│   │   │   ├── order.repository.js
│   │   │   ├── product.repository.js
│   │   │   ├── settings.repository.js
│   │   │   ├── stats.repository.js
│   │   │   └── user.repository.js
│   │   ├── routes/
│   │   │   ├── admin.clients.routes.js
│   │   │   ├── admin.order.routes.js
│   │   │   ├── admin.stats.routes.js
│   │   │   ├── auth.routes.js
│   │   │   ├── cart.routes.js
│   │   │   ├── category.routes.js
│   │   │   ├── order.routes.js
│   │   │   ├── payment.routes.js
│   │   │   ├── product.routes.js
│   │   │   ├── settings.routes.js
│   │   │   ├── user.routes.js
│   │   │   └── webhook.routes.js
│   │   ├── services/
│   │   │   ├── auth.service.js
│   │   │   ├── cart.service.js
│   │   │   ├── category.service.js
│   │   │   ├── email.service.js     — Brevo REST
│   │   │   ├── geocoding.service.js — BAN API
│   │   │   ├── order.service.js
│   │   │   ├── payment.service.js   — Stripe
│   │   │   ├── product.service.js
│   │   │   ├── settings.service.js
│   │   │   └── stats.service.js
│   │   ├── validators/
│   │   │   ├── auth.validator.js
│   │   │   ├── cart.validator.js
│   │   │   ├── category.validator.js
│   │   │   ├── order.validator.js
│   │   │   └── product.validator.js
│   │   └── index.js         — Point d'entrée Express
│   ├── scripts/
│   │   ├── init.sql         — Schéma complet + données initiales
│   │   ├── seed.js          — Données de démo
│   │   └── add-distance-shipping-settings.sql — Config livraison DISTANCE
│   ├── tests/
│   │   └── setup.js         — Setup Jest + mocks globaux
│   ├── coverage/            — Rapport de couverture existant
│   ├── reports/
│   │   └── junit.xml        — Rapport CI
│   ├── Dockerfile
│   ├── jest.config.js
│   ├── package.json
│   └── railway.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx          — Routeur principal
│   │   ├── main.jsx         — Point d'entrée React
│   │   ├── components/
│   │   │   ├── admin/       — AdminLayout, ImageUploader, tables commandes/produits
│   │   │   ├── checkout/    — Formulaires multi-étapes
│   │   │   ├── mon-compte/  — Onglets profil, sécurité, adresses
│   │   │   ├── CartDrawer, CartItem, CatalogFilters, Navbar, Footer, Pagination...
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── CartContext.jsx
│   │   │   └── SettingsContext.jsx
│   │   ├── hooks/
│   │   │   ├── useOrdersAdmin.js
│   │   │   └── useProductsAdmin.js
│   │   ├── pages/
│   │   │   ├── admin/       — Dashboard, Produits, Catégories, Commandes, Clients, Paramètres
│   │   │   ├── CataloguePage, ProductDetailPage, CartPage, CheckoutPage
│   │   │   ├── OrderConfirmationPage, OrderHistoryPage, OrderDetailPage
│   │   │   ├── PaymentSuccessPage, PaymentCancelPage
│   │   │   ├── LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage
│   │   │   ├── MonComptePage, HomePage
│   │   │   └── Pages légales (CGV, Confidentialité, Mentions, Accessibilité)
│   │   ├── services/
│   │   │   ├── api.js           — Axios + intercepteurs refresh token
│   │   │   ├── adminService.js
│   │   │   ├── cartService.js
│   │   │   ├── categoryService.js
│   │   │   ├── orderService.js
│   │   │   ├── paymentService.js
│   │   │   ├── productService.js
│   │   │   └── shippingService.js
│   │   └── utils/
│   │       ├── imageUtils.js
│   │       └── imageUtils.test.js
│   ├── dist/                — Build produit (présent, doit être régénéré)
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── railway.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── scripts/
│   └── init.sql             — Doublon du script init (racine vs backend/scripts)
├── settings_table.sql       — Script SQL supplémentaire (configuration livraison distance)
├── docker-compose.yml
├── .github/workflows/
├── README.md
├── docs/README-CI-CD.md
├── docs/DEPLOY-RAILWAY.md
└── .env.example             — Variables d'env racine
```

---

## Applications et services

| Service | Type | Port local | Railway |
|---|---|---|---|
| Backend Express | API REST | 3000 | Service séparé |
| Frontend React (Nginx) | SPA | 5173 → 80 en Docker | Service séparé |
| PostgreSQL | DB | 5432 | Service Railway natif |
| Redis | Cache | 6379 | Service Railway natif |

---

## Scripts npm disponibles

### Backend
| Script | Commande |
|---|---|
| `start` | `node src/index.js` |
| `dev` | `nodemon src/index.js` |
| `test` | `jest --coverage --detectOpenHandles` |
| `test:ci` | `jest --ci --coverage --reporters=default --reporters=jest-junit` |
| `lint` | `eslint src/ --ext .js` |
| `seed` | `node scripts/seed.js` |

### Frontend
| Script | Commande |
|---|---|
| `dev` | `vite` |
| `build` | `vite build` |
| `test` | `vitest` |
| `lint` | `eslint . --ext js,jsx` |

---

## Variables d'environnement documentées

Fichier de référence : `backend/.env.example`

| Variable | Obligatoire | Description |
|---|---|---|
| `NODE_ENV` | Oui | `development` / `production` |
| `PORT` | Oui | Port Express (3000) |
| `DATABASE_URL` | Prod | URL complète PostgreSQL |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Dev | Connexion PostgreSQL |
| `REDIS_URL` | Prod | URL Redis |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` | Dev | Connexion Redis |
| `JWT_SECRET` | Oui | Secret token d'accès |
| `JWT_EXPIRES_IN` | Non | Expiration (défaut 7d) |
| `JWT_REFRESH_SECRET` | Oui | Secret refresh token |
| `JWT_REFRESH_EXPIRES_IN` | Non | Expiration refresh (défaut 30d) |
| `BCRYPT_SALT_ROUNDS` | Non | Rounds bcrypt (défaut 12) |
| `RATE_LIMIT_WINDOW_MS` | Non | Fenêtre rate limit global |
| `RATE_LIMIT_MAX_REQUESTS` | Non | Max requêtes (défaut 300) |
| `AUTH_RATE_LIMIT_WINDOW_MS` | Non | Fenêtre auth rate limit |
| `AUTH_RATE_LIMIT_MAX_REQUESTS` | Non | Max tentatives auth (20) |
| `CORS_ORIGIN` | Oui | URL frontend autorisée |
| `BREVO_API_KEY` | Prod | Clé API Brevo (emails) |
| `BREVO_SENDER_EMAIL` | Non | Email expéditeur |
| `BREVO_SENDER_NAME` | Non | Nom expéditeur |
| `FRONTEND_URL` | Oui | URL frontend (liens emails) |
| `STRIPE_SECRET_KEY` | Prod | Clé secrète Stripe |
| `STRIPE_WEBHOOK_SECRET` | Prod | Secret webhook Stripe |
| `STRIPE_PUBLISHABLE_KEY` | Non | Clé publique (frontend) |

Fichier frontend : `frontend/.env.example` (non fourni dans la liste des fichiers)
Fichier local existant : `frontend/.env.local`

---

## Migrations et scripts SQL

| Fichier | Description |
|---|---|
| `backend/scripts/init.sql` | Schéma complet : tables, enums, indexes, triggers, données config |
| `backend/scripts/seed.js` | Données de démonstration (produits, catégories) |
| `backend/scripts/add-distance-shipping-settings.sql` | Paramètres livraison DISTANCE |
| `scripts/init.sql` (racine) | Doublon du fichier ci-dessus → risque de confusion |
| `settings_table.sql` (racine) | Script supplémentaire de configuration |

**Problème** : Pas de système de migrations versionné (Flyway, Liquibase, node-pg-migrate, Knex migrations). Les modifications de schéma s'appliquent manuellement.

---

## État git

Git non initialisé dans le répertoire de travail inspecté (pas de dossier `.git` visible à la racine `/jana`). Le projet est dans `/jana/JanaDistribution/` et peut contenir un repo git non exposé dans cette session.

---

## Workflows CI/CD

| Fichier | Déclencheur | Action |
|---|---|---|
| `.github/workflows/ci.yml` | Push / PR | Tests Jest + lint |
| `.github/workflows/deploy.yml` | Push main | Déploiement Railway |
| `.github/workflows/docker.yml` | Push main | Build images Docker |

---

## Documentation existante

| Fichier | Contenu |
|---|---|
| `README.md` | Documentation générale du projet |
| `docs/README-CI-CD.md` | Documentation CI/CD GitHub Actions |
| `docs/DEPLOY-RAILWAY.md` | Guide de déploiement Railway |

---

## Éléments suspects / obsolètes

| Élément | Type | Problème |
|---|---|---|
| `backend/coverage/` | Dossier | Rapport de couverture commité (doit être dans .gitignore) |
| `backend/reports/junit.xml` | Fichier | Rapport CI commité |
| `frontend/dist/` | Dossier | Build produit commité (doit être dans .gitignore) |
| `scripts/init.sql` (racine) | Doublon | Même contenu que `backend/scripts/init.sql` |
| `settings_table.sql` (racine) | Hors structure | Script SQL à la racine, non intégré dans la séquence d'init |
| `redis` + `ioredis` | Doublon npm | Deux packages Redis différents installés |
| `express-validator` + `Joi` | Doublon npm | Deux bibliothèques de validation utilisées |
| Encodage UTF-8 corrompu | Code | Certains fichiers contiennent des séquences `Ã©`, `â‚¬`, `â€™` |
| `PromotionsPage.jsx` | Frontend | Page existante mais non routée dans App.jsx (route supprimée) |
| Page Catégories | Frontend | Supprimée du routing mais le composant existe encore |
