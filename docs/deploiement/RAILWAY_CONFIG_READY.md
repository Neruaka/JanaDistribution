# Configuration Railway — Prête à appliquer

> ⚠️ **OBSOLÈTE (2026-07-26)** — Railway n'est plus le chemin critique vers la production ; migration en cours vers un homeserver auto-géré, voir `docs/deploiement/DEPLOY-HOMESERVER.md` et Phase 11 de `docs/workflow/PLAN_CORRECTION_AUDIT.md`. Conservé comme référence tant que Railway reste actif en parallèle (T11-09).
>
> ⚠️ **Sections Stripe obsolètes** — Stripe a été entièrement retiré du MVP (décision client T4-07, 2026-07-02). Les variables liées à Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, etc.) mentionnées dans ce document ne s'appliquent plus. Paiement actuel : ESPECES/VIREMENT/CHEQUE, statut positionné manuellement par un admin. Voir `docs/workflow/ETAT_ACTUEL_PROJET.md` pour l'état réel à jour.
# À exécuter quand le plan Railway sera réactivé

> Mise à jour : 2026-06-28. Toutes les valeurs non-secrètes sont pré-renseignées.
> Les secrets (JWT, clés Stripe LIVE, clés R2) sont à générer/récupérer au moment du déploiement.

---

## Variables d'environnement Backend (Railway → service backend → Variables)

### Serveur
```
NODE_ENV=production
PORT=3000
```

### Base de données (fournie automatiquement par Railway PostgreSQL)
```
DATABASE_URL=<copier depuis Railway PostgreSQL → Connect>
```

### Redis (fourni automatiquement par Railway Redis)
```
REDIS_URL=<copier depuis Railway Redis → Connect>
```

### Authentification JWT
```
JWT_SECRET=<générer : openssl rand -hex 32>
JWT_REFRESH_SECRET=<générer : openssl rand -hex 32 — OBLIGATOIREMENT DIFFÉRENT>
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
BCRYPT_SALT_ROUNDS=12
```

### Sécurité / CORS
```
CORS_ORIGIN=https://<frontend>.up.railway.app
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX_REQUESTS=20
PASSWORD_RESET_RATE_LIMIT_WINDOW_MS=900000
PASSWORD_RESET_RATE_LIMIT_MAX_REQUESTS=5
```

### Cloudflare R2 — Stockage images
```
R2_ACCOUNT_ID=86498f0365c08c2ed26806c7710d15a5
R2_ACCESS_KEY_ID=<clé R2 — depuis Cloudflare Dashboard>
R2_SECRET_ACCESS_KEY=<secret R2 — depuis Cloudflare Dashboard>
R2_BUCKET_NAME=jana-products
R2_PUBLIC_URL=https://pub-3569a5f34db44a24bcb189552621ff79.r2.dev
```
> ⚠️ En prod : configurer un custom domain Cloudflare pour R2_PUBLIC_URL (ex: images.jana-distribution.fr)

### Stripe LIVE (⚠️ PAS test !)
```
STRIPE_SECRET_KEY=sk_live_<depuis Stripe Dashboard → Clés API>
STRIPE_PUBLISHABLE_KEY=pk_live_<depuis Stripe Dashboard → Clés API>
STRIPE_WEBHOOK_SECRET=whsec_<généré lors création webhook Railway — voir étape 8>
```

### Gmail SMTP (Email — migré depuis Brevo le 2026-07-08, voir `docs/guides/GUIDE_GMAIL_SMTP.md`)
```
GMAIL_SENDER_EMAIL=<adresse Gmail dédiée>
GMAIL_APP_PASSWORD=<mot de passe d'application Gmail, 16 caractères>
GMAIL_SENDER_NAME=Jana Distribution
FRONTEND_URL=https://<frontend>.up.railway.app
```

### Entreprise (Factures — OBLIGATOIRES avant première vente)
```
ENTREPRISE_NOM=Jana Distribution
ENTREPRISE_SIRET=<à renseigner>
ENTREPRISE_TVA_NUMERO=<à renseigner>
ENTREPRISE_ADRESSE=<adresse complète>
```

### Logs
```
LOG_LEVEL=warn
```

---

## Variables d'environnement Frontend (Railway → service frontend → Variables build)

```
VITE_API_URL=/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_<même que STRIPE_PUBLISHABLE_KEY>
```

---

## Étapes Railway dans l'ordre

1. **Réactiver le plan Railway** (dashboard.railway.app → Billing)
2. **Créer projet** : "jana-distribution"
3. **Ajouter PostgreSQL** : New Service → Database → PostgreSQL 15
   - Copier `DATABASE_URL` dans les variables backend
4. **Ajouter Redis** : New Service → Database → Redis 7
   - Copier `REDIS_URL` dans les variables backend
5. **Créer service backend** :
   - Source : GitHub repo, root directory : `JanaDistribution/backend`
   - Build : NIXPACKS (détecté automatiquement)
   - Variables : configurer toutes les variables ci-dessus
6. **Créer service frontend** :
   - Source : GitHub repo, root directory : `JanaDistribution/frontend`
   - Build : Dockerfile (présent dans frontend/)
   - Variables build : VITE_API_URL, VITE_STRIPE_PUBLISHABLE_KEY
7. **Déployer backend** → vérifier `GET /api/health` → doit retourner `{"status":"ok"}`
8. **Configurer webhook Stripe** (une fois l'URL backend connue) :
   - Stripe Dashboard → Developers → Webhooks → Add endpoint
   - URL : `https://<backend>.up.railway.app/api/webhooks/stripe`
   - Événements : `checkout.session.completed`, `refund.created`
   - Copier le `whsec_` → mettre à jour `STRIPE_WEBHOOK_SECRET` dans Railway
9. **Redéployer backend** (pour prendre en compte STRIPE_WEBHOOK_SECRET)
10. **Déployer frontend**
11. **Mettre à jour CORS_ORIGIN** avec l'URL Railway frontend réelle
12. **Tester flux complet** avec carte Stripe test `4242 4242 4242 4242`
13. **Valider sauvegardes** : Railway → PostgreSQL → Backups → activer
14. **Passer en mode LIVE Stripe** quand tout est validé en test
15. **Configurer monitoring** : UptimeRobot → surveiller `GET /api/health`

---

## Commandes utiles post-déploiement

```bash
# Vérifier santé API
curl https://<backend>.up.railway.app/api/health

# Voir les logs Railway en temps réel
railway logs --service backend-jana

# Forcer un redéploiement
railway up --service backend-jana
```

---

## Checklist go-live finale

- [ ] T8-01 : Services Railway staging créés
- [ ] T8-02 : Variables d'env staging configurées
- [ ] T8-03 : Deploy workflow GitHub Actions configuré
- [ ] T8-04 : Sauvegardes PostgreSQL activées
- [ ] T8-05 : Monitoring configuré (UptimeRobot)
- [ ] T8-06 : R2 configuré côté Railway (variables R2_*)
- [ ] T9-01 : Test flux complet en staging (Stripe test)
- [ ] T9-02 : Variables prod vérifiées
- [ ] T9-03 : Validation légale CGV/RGPD (BLOCKED — juridique)
- [ ] T9-04 : Validation comptable TVA (BLOCKED — comptable)
- [ ] T9-05 : Test paiement LIVE 1€
- [ ] T9-06 : Sauvegardes DB confirmées
- [ ] T9-07 : npm audit sans CVE critique
- [ ] T9-08 : Documentation déploiement à jour
