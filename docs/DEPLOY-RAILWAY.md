# Déploiement Railway — Jana Distribution

> ⚠️ **OBSOLÈTE (2026-07-26)** — Railway n'est plus le chemin critique vers la production. La migration vers un homeserver auto-géré (`tfredklab.dev`) est en cours (Phase 11, `docs/PLAN_CORRECTION_AUDIT.md`) — voir `docs/DEPLOY-HOMESERVER.md`. Ce document est conservé comme référence historique le temps que Railway reste actif en parallèle (T11-09, cutover non encore validé). Ne pas suivre cette procédure pour un nouveau déploiement.
>
> ⚠️ **Sections Stripe obsolètes** — Stripe a été entièrement retiré du MVP (décision client T4-07, 2026-07-02). Les étapes/variables liées à Stripe (webhook, `STRIPE_SECRET_KEY`, cartes de test) mentionnées dans ce document ne s'appliquent plus. Paiement actuel : ESPECES/VIREMENT/CHEQUE, statut positionné manuellement par un admin. Voir `docs/ETAT_ACTUEL_PROJET.md` pour l'état réel à jour.

Procédure pas-à-pas pour mettre en ligne le backend Node + Postgres + Redis et le
frontend React/Vite sur [Railway](https://railway.app).

---

## 1. Pré-requis

- Compte Railway (gratuit jusqu'à 5 $ de crédit / mois)
- Compte Stripe avec une clé secrète **live** et un webhook configuré
- Repo Git du projet poussé sur GitHub

---

## 2. Architecture cible

```
Railway Project "jana-distribution"
├── Service: backend         (Node 20, build NIXPACKS)
├── Service: frontend        (Docker, sert Nginx + build Vite)
├── Service: Postgres        (plugin Railway)
└── Service: Redis           (plugin Railway, optionnel)
```

---

## 3. Création des services

### 3.1 Postgres
1. Dans le projet Railway → `+ New` → `Database` → `PostgreSQL`.
2. Récupérer la variable `DATABASE_URL` générée (visible dans l'onglet Variables).
3. Se connecter et exécuter les scripts SQL :
   ```bash
   psql "$DATABASE_URL" -f backend/scripts/init.sql        # si présent
   psql "$DATABASE_URL" -f settings_table.sql
   psql "$DATABASE_URL" -f backend/scripts/add-distance-shipping-settings.sql
   ```

### 3.2 Redis (optionnel mais recommandé pour le cache settings)
1. `+ New` → `Database` → `Redis`.
2. Récupérer `REDIS_URL`.

### 3.3 Backend
1. `+ New` → `GitHub Repo` → sélectionner le repo.
2. **Root Directory** : `JanaDistribution/backend`
3. Le `railway.json` est détecté automatiquement (NIXPACKS + `npm start`).
4. Onglet **Variables** — ajouter :

| Variable | Valeur |
|----------|--------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `DATABASE_URL` | (référencer le service Postgres) |
| `REDIS_URL` | (référencer le service Redis, ou laisser vide) |
| `JWT_SECRET` | Long secret aléatoire (≥ 48 chars) |
| `JWT_REFRESH_SECRET` | Autre long secret |
| `JWT_EXPIRES_IN` | `7d` |
| `JWT_REFRESH_EXPIRES_IN` | `30d` |
| `BCRYPT_SALT_ROUNDS` | `12` |
| `CORS_ORIGIN` | URL publique du frontend Railway (ex `https://jana-frontend.up.railway.app`) |
| `FRONTEND_URL` | Idem (utilisé pour les liens dans les emails transactionnels) |
| `GMAIL_SENDER_EMAIL` | Adresse Gmail expéditeur (voir `docs/GUIDE_GMAIL_SMTP.md`) |
| `GMAIL_APP_PASSWORD` | Mot de passe d'application Gmail (16 caractères) |
| `GMAIL_SENDER_NAME` | `Jana Distribution` |
| **`STRIPE_SECRET_KEY`** | `sk_live_…` |
| **`STRIPE_WEBHOOK_SECRET`** | `whsec_…` (généré à l'étape webhook) |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_…` (optionnel côté backend) |
| `LOG_LEVEL` | `info` |

5. Cliquer **Deploy**. La route healthcheck `/api/health` doit répondre 200.

### 3.4 Frontend
1. `+ New` → `GitHub Repo` → même repo.
2. **Root Directory** : `JanaDistribution/frontend`
3. Le `Dockerfile` est utilisé. Avant le premier déploiement, vérifier la build
   arg `VITE_API_URL` :
   - Onglet **Variables** → ajouter :
     - `VITE_API_URL` = URL publique du backend Railway suivie de `/api`
       (ex : `https://jana-backend.up.railway.app/api`)
     - `VITE_STRIPE_PUBLISHABLE_KEY` = `pk_live_…`
4. Cliquer **Deploy**.

---

## 4. Webhook Stripe

Une fois le backend déployé :

1. Dashboard Stripe → **Developers > Webhooks** → **Add endpoint**.
2. URL : `https://<backend>.up.railway.app/api/webhooks/stripe`
3. Événements à écouter :
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Récupérer le **signing secret** (`whsec_…`).
5. Le copier dans la variable `STRIPE_WEBHOOK_SECRET` du backend Railway.
6. Re-deploy.

---

## 5. Test post-déploiement

```bash
# Healthcheck
curl https://<backend>.up.railway.app/api/health

# Settings publics
curl https://<backend>.up.railway.app/api/settings/public

# Estimation frais (mode DISTANCE)
curl -X POST https://<backend>.up.railway.app/api/settings/shipping/estimate \
  -H 'content-type: application/json' \
  -d '{"montant":50,"codePostal":"69001","ville":"Lyon"}'
```

Côté front : aller sur l'URL publique → catalogue → ajouter au panier →
checkout → choisir CARTE → redirection Stripe → carte test `4242 4242 4242 4242`.

---

## 6. Domaine personnalisé

1. Dans le service Railway → onglet **Settings > Domains** → `+ Custom Domain`.
2. Pointer le `CNAME` chez votre registrar vers `<service>.up.railway.app`.
3. Railway provisionne automatiquement le certificat SSL.
4. **Important** : mettre à jour `CORS_ORIGIN` et `FRONTEND_URL` sur le backend
   et `VITE_API_URL` sur le frontend (puis re-deploy).

---

## 7. Frais de livraison par distance

Une fois en ligne :

1. Se connecter en admin.
2. **Paramètres > Informations générales** : renseigner adresse, code postal, ville
   du dépôt. La sauvegarde déclenche le géocodage automatique (BAN — gratuit, sans clé).
3. **Paramètres > Livraison** : choisir **Selon la distance**, régler
   - Frais de base (ex : 5 €)
   - Tarif au km (ex : 0,80 €/km)
   - Distance max. (ex : 200 km, 0 = illimité)
   - Seuil franco (ex : 150 € — au-delà, livraison offerte)

Au checkout, dès que le client saisit code postal + ville, l'API
`/api/settings/shipping/estimate` calcule en live les frais. Le calcul final lors
de la création de la commande reste 100 % serveur (anti-tampering).

---

## 8. Backups & supervision

- **Backups Postgres** : activer le snapshot automatique dans le service Postgres
  Railway (onglet **Settings**).
- **Logs** : onglet **Deployments** > **View Logs** sur chaque service.
- **Alertes** : configurer un webhook Discord / Slack via l'onglet **Settings >
  Webhooks** du projet.
