# 04 — Architecture Cible

> L'architecture cible est une évolution progressive de l'existant, non une réécriture.
> Priorité à la finalisabilité, pas à la perfection théorique.

---

## Principe général

L'architecture actuelle est **correcte dans ses fondamentaux**. Monorepo, backend modulaire (routes / controllers / services / repositories), frontend React avec Context API, PostgreSQL + Redis — tout cela est sain.

Les ajouts nécessaires sont ciblés :
1. Stockage persistant des fichiers (S3 ou volume Railway)
2. Facturation (service dédié + PDF)
3. Révocation des tokens (blacklist ou rotation courte)
4. Historique des statuts de commande
5. Tests d'intégration réels

Aucun changement de stack n'est recommandé.

---

## Architecture cible — Backend

### Organisation des modules

```
backend/src/
├── config/
│   ├── database.js        ✅ Existant
│   ├── logger.js          ✅ Existant
│   ├── redis.js           ✅ Existant (nettoyer doublon ioredis/redis)
│   ├── stripe.js          ✅ Existant
│   └── storage.js         🆕 Abstraction upload (local dev / S3 prod)
│
├── domains/               🆕 Organisation par domaine métier
│   ├── auth/
│   │   ├── auth.routes.js
│   │   ├── auth.controller.js
│   │   ├── auth.service.js
│   │   └── auth.validator.js
│   ├── catalogue/
│   │   ├── product.routes.js
│   │   ├── product.controller.js
│   │   ├── product.service.js
│   │   ├── product.repository.js
│   │   ├── category.routes.js
│   │   ├── category.service.js
│   │   └── category.repository.js
│   ├── cart/
│   │   ├── cart.routes.js
│   │   ├── cart.service.js
│   │   └── cart.repository.js
│   ├── orders/
│   │   ├── order.routes.js           (public client)
│   │   ├── admin.order.routes.js     (admin)
│   │   ├── order.controller.js
│   │   ├── order.service.js
│   │   ├── order.repository.js
│   │   └── order-status-history.repository.js  🆕
│   ├── payments/
│   │   ├── payment.routes.js
│   │   ├── payment.controller.js
│   │   ├── payment.service.js
│   │   └── webhook.routes.js
│   ├── invoices/           🆕 NOUVEAU DOMAINE
│   │   ├── invoice.routes.js
│   │   ├── invoice.controller.js
│   │   ├── invoice.service.js
│   │   ├── invoice.repository.js
│   │   └── invoice-pdf.generator.js
│   ├── shipping/           🆕 Extraction du module livraison
│   │   ├── shipping.routes.js
│   │   ├── shipping.service.js
│   │   └── geocoding.service.js
│   ├── users/
│   │   ├── user.routes.js
│   │   ├── user.service.js
│   │   └── user.repository.js
│   ├── media/              🆕 Gestion uploads
│   │   ├── upload.routes.js
│   │   ├── upload.controller.js
│   │   └── upload.service.js        (abstraction local/S3)
│   ├── admin/
│   │   ├── admin.stats.routes.js
│   │   ├── admin.clients.routes.js
│   │   └── admin.dashboard.service.js
│   └── settings/
│       ├── settings.routes.js
│       ├── settings.service.js
│       └── settings.repository.js
│
├── middlewares/
│   ├── auth.middleware.js  ✅ Existant
│   ├── errorHandler.js     ✅ Existant
│   ├── validate.middleware.js ✅ Existant
│   ├── rateLimit.middleware.js 🆕 Centraliser rate limiters
│   └── audit.middleware.js 🆕 Journalisation actions sensibles
│
└── index.js               ✅ Existant
```

---

## Architecture cible — Frontend

### Organisation des pages et composants

```
frontend/src/
├── pages/
│   ├── public/
│   │   ├── HomePage.jsx
│   │   ├── CataloguePage.jsx
│   │   ├── ProductDetailPage.jsx
│   │   └── legal/ (CGV, Mentions, Confidentialité, Accessibilité)
│   ├── checkout/
│   │   ├── CartPage.jsx
│   │   ├── CheckoutPage.jsx
│   │   ├── OrderConfirmationPage.jsx
│   │   ├── PaymentSuccessPage.jsx
│   │   └── PaymentCancelPage.jsx
│   ├── account/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── ForgotPasswordPage.jsx
│   │   ├── ResetPasswordPage.jsx
│   │   ├── MonComptePage.jsx
│   │   ├── OrderHistoryPage.jsx
│   │   └── OrderDetailPage.jsx
│   └── admin/
│       ├── AdminDashboard.jsx
│       ├── AdminProductsList.jsx
│       ├── AdminProductForm.jsx
│       ├── AdminCategoriesList.jsx
│       ├── AdminOrdersList.jsx
│       ├── AdminClientsList.jsx
│       ├── AdminSettingsPage.jsx
│       ├── AdminProfilePage.jsx
│       └── AdminInvoicesPage.jsx     🆕
│
├── features/              🆕 Regroupement par fonctionnalité
│   ├── auth/
│   ├── cart/
│   ├── catalogue/
│   ├── checkout/
│   ├── orders/
│   ├── payments/
│   └── invoices/
│
├── services/              ✅ Existant (garder structure actuelle)
├── contexts/              ✅ Existant (AuthContext, CartContext, SettingsContext)
└── components/
    ├── admin/             ✅ Existant
    ├── checkout/          ✅ Existant
    ├── mon-compte/        ✅ Existant
    └── shared/            🆕 Composants partagés extraits
```

---

## Modèle de données cible

### Tables à ajouter

```sql
-- Historique des statuts de commande
CREATE TABLE commande_statut_historique (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commande_id UUID NOT NULL REFERENCES commande(id) ON DELETE CASCADE,
  ancien_statut statut_commande,
  nouveau_statut statut_commande NOT NULL,
  commentaire TEXT,
  modifie_par UUID REFERENCES utilisateur(id) ON DELETE SET NULL,
  date_modification TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Factures
CREATE SEQUENCE facture_numero_seq START 1;

CREATE TABLE facture (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_facture VARCHAR(20) NOT NULL UNIQUE,  -- FAC-2024-0001
  commande_id UUID NOT NULL REFERENCES commande(id),
  utilisateur_id UUID REFERENCES utilisateur(id) ON DELETE SET NULL,
  date_emission TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_echeance TIMESTAMP,
  -- Données entreprise snapshottées
  entreprise_nom VARCHAR(255) NOT NULL,
  entreprise_siret VARCHAR(20),
  entreprise_adresse TEXT,
  -- Données client snapshottées
  client_nom VARCHAR(255) NOT NULL,
  client_email VARCHAR(255),
  client_adresse_facturation JSONB NOT NULL,
  -- Montants
  total_ht DECIMAL(10,2) NOT NULL,
  total_tva DECIMAL(10,2) NOT NULL,
  total_ttc DECIMAL(10,2) NOT NULL,
  frais_livraison DECIMAL(10,2) NOT NULL DEFAULT 0,
  -- Statut
  statut VARCHAR(20) NOT NULL DEFAULT 'EMISE',  -- EMISE, ANNULEE
  -- Stockage PDF
  pdf_path VARCHAR(500),
  pdf_generated_at TIMESTAMP,
  -- Métadonnées
  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Lignes de facture (snapshot au moment de l'émission)
CREATE TABLE facture_ligne (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facture_id UUID NOT NULL REFERENCES facture(id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  quantite INTEGER NOT NULL,
  prix_unitaire_ht DECIMAL(10,2) NOT NULL,
  taux_tva DECIMAL(5,2) NOT NULL,
  total_ht DECIMAL(10,2) NOT NULL,
  total_ttc DECIMAL(10,2) NOT NULL
);

-- Avoirs
CREATE SEQUENCE avoir_numero_seq START 1;

CREATE TABLE avoir (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_avoir VARCHAR(20) NOT NULL UNIQUE,  -- AVO-2024-0001
  facture_id UUID NOT NULL REFERENCES facture(id),
  commande_id UUID NOT NULL REFERENCES commande(id),
  motif TEXT,
  total_ttc DECIMAL(10,2) NOT NULL,
  date_emission TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Blacklist tokens révoqués (ou : raccourcir durée JWT)
CREATE TABLE token_revoque (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_hash VARCHAR(64) NOT NULL UNIQUE,  -- SHA-256 du token
  utilisateur_id UUID REFERENCES utilisateur(id) ON DELETE CASCADE,
  revoque_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expire_le TIMESTAMP NOT NULL  -- Pour le nettoyage automatique
);

-- Refresh tokens (pour révocation)
CREATE TABLE refresh_token (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  utilisateur_id UUID NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
  cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expire_le TIMESTAMP NOT NULL,
  revoque BOOLEAN NOT NULL DEFAULT false,
  revoque_le TIMESTAMP
);

-- Journal d'audit
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  utilisateur_id UUID REFERENCES utilisateur(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  ressource_type VARCHAR(50),
  ressource_id VARCHAR(255),
  details JSONB,
  ip VARCHAR(45),
  date_action TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Tables existantes à modifier

```sql
-- commande : ajouter champ annulation paiement
ALTER TABLE commande ADD COLUMN stripe_refund_id VARCHAR(255);

-- produit : ajouter poids pour calcul livraison futur
ALTER TABLE produit ADD COLUMN poids_kg DECIMAL(6,3);
```

---

## Stockage des fichiers (migration obligatoire)

**Situation actuelle** : Multer écrit sur `backend/uploads/products/` (disque éphémère Railway).

**Cible recommandée** : Service de stockage objet S3-compatible.

Options dans l'ordre de recommandation :
1. **AWS S3** (référence, écosystème large)
2. **Cloudflare R2** (moins cher, compatible S3 API)
3. **Railway Volume** (simple mais moins scalable, 1 Go/service gratuit)

```javascript
// backend/src/config/storage.js (cible)
// Abstraction : même interface en dev (disk) et prod (S3)
const uploadService = process.env.STORAGE_BACKEND === 's3'
  ? new S3UploadService(...)
  : new DiskUploadService('./uploads/');
```

---

## Différences importantes actuelles → cibles

| Aspect | Actuel | Cible |
|---|---|---|
| Images | Disque local éphémère | S3 ou Volume persistant |
| Facturation | Absente | Service complet avec PDF |
| Tokens JWT | Non révocables | Blacklist ou refresh ≤ 1h |
| Historique statuts | Absent | Table `commande_statut_historique` |
| Migrations | Script SQL destructif | Migrations versionnées numérotées |
| Tests | Mocks DB uniquement | Tests intégration contre vraie DB de test |
| Audit log | Logs Winston | Table `audit_log` pour actions sensibles |
| Redis packages | ioredis + redis (doublon) | ioredis uniquement |
| Validation | express-validator + Joi (doublon) | Un seul système (Joi recommandé) |

---

## Stratégie de migration progressive

### Étape 1 (Phase 0-1) — Sans rupture
- Garder structure actuelle
- Ajouter tables manquantes via migrations versionnées
- Corriger encodage fichiers
- Ne pas changer organisation

### Étape 2 (Phase 2-5)
- Ajouter domaine `invoices`
- Migrer uploads vers stockage persistant
- Ajouter `commande_statut_historique`
- Implémenter révocation tokens

### Étape 3 (Phase 6-8)
- Refactoring optionnel vers organisation par domaine
- Nettoyage doublons (redis, validation)
- Tests intégration complets

La migration est **progressive et non bloquante**. L'ordre des étapes garantit qu'à chaque point d'arrêt, le projet reste déployable.
