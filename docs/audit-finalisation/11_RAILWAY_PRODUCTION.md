# 11 — Railway et Production

> ⚠️ **Document historique (état figé au 2026-06-14)** — Rédigé lors de l'audit initial, avant le retrait complet de Stripe (T4-07, 2026-07-02) et l'ajout de la facturation légale (Phase 5) et des tests d'intégration réels (Phase 7). Les références à Stripe, aux webhooks et aux tests 100% mockés ne reflètent plus l'état actuel du code. Voir `docs/workflow/ETAT_ACTUEL_PROJET.md` et `docs/workflow/PLAN_CORRECTION_AUDIT.md` pour l'état réel à jour.

> Audit réalisé par inspection des fichiers de configuration locaux.
> L'accès au tableau de bord Railway n'est pas disponible dans ce contexte.
> Certains points sont donc marqués "Non vérifiable — accès Railway nécessaire".

---

## Configuration actuelle détectée

### Services configurés (déduit des fichiers)

| Service | Fichier de config | Build | Start |
|---|---|---|---|
| Backend Node.js | `backend/railway.json` | `npm install` (NIXPACKS) | `npm start` |
| Frontend React | `frontend/railway.json` | Dockerfile | Nginx |
| PostgreSQL | Service Railway natif | N/A | N/A |
| Redis | Service Railway natif | N/A | N/A |

### Backend railway.json

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 5,
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 60
  }
}
```

**Point positif** : Health check configuré sur `/api/health` qui vérifie la connexion PostgreSQL.

**Problème** : `buildCommand: "npm install"` — en production, il faudrait `npm ci --production` pour installer uniquement les dépendances de production et être reproductible.

### Frontend railway.json

```json
{
  "build": {
    "builder": "DOCKERFILE"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 5,
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30
  }
}
```

Le frontend utilise un Dockerfile (build Vite + Nginx). Health check sur `/health` (route Nginx).

---

## Variables d'environnement Railway

### Variables backend nécessaires en production

| Variable | Obligatoire | Valeur attendue |
|---|---|---|
| `NODE_ENV` | Oui | `production` |
| `DATABASE_URL` | Oui | URL PostgreSQL Railway |
| `REDIS_URL` | Oui | URL Redis Railway |
| `JWT_SECRET` | Oui | Chaîne aléatoire longue (≥ 32 chars) |
| `JWT_REFRESH_SECRET` | Oui | Chaîne aléatoire distincte de JWT_SECRET |
| `JWT_EXPIRES_IN` | Non | `7d` (à réduire en prod) |
| `JWT_REFRESH_EXPIRES_IN` | Non | `30d` |
| `BCRYPT_SALT_ROUNDS` | Non | `12` |
| `CORS_ORIGIN` | Oui | URL Railway du frontend |
| `BREVO_API_KEY` | Prod | Clé API Brevo |
| `BREVO_SENDER_EMAIL` | Prod | Email d'envoi |
| `FRONTEND_URL` | Oui | URL Railway du frontend |
| `STRIPE_SECRET_KEY` | Prod | `sk_live_...` en prod |
| `STRIPE_WEBHOOK_SECRET` | Prod | `whsec_...` depuis Stripe Dashboard |
| `RATE_LIMIT_MAX_REQUESTS` | Non | 300 (à ajuster) |

### Variables frontend nécessaires en production

| Variable | Obligatoire | Valeur attendue |
|---|---|---|
| `VITE_API_URL` | Oui | URL backend Railway + `/api` |

### État vérification

> **Non vérifiable** — Nécessite accès au tableau de bord Railway pour confirmer que toutes ces variables sont configurées.

---

## Problème critique : Stockage des images

**Problème confirmé** : Railway utilise un **système de fichiers éphémère**. Les fichiers écrits dans `backend/uploads/products/` sont **perdus à chaque redéploiement**.

**Conséquence** : Les images de produits uploadées en production disparaissent à chaque push de code. Le catalogue devient visuellement cassé.

**Solutions** :

1. **Railway Volumes** (simple, intégré) :
   - Monter un volume persistant sur le service backend
   - Les fichiers survivent aux redéploiements
   - Limitation : 1 Go gratuit, pas CDN

2. **AWS S3 / Cloudflare R2** (recommandé) :
   - Stocker les images sur un service objet externe
   - Modifier `upload.middleware.js` pour utiliser `@aws-sdk/client-s3` ou `@aws-sdk/lib-storage`
   - Stocker l'URL S3 dans `produit.image_url`
   - Cloudflare R2 : gratuit jusqu'à 10 Go, compatible API S3

3. **Cloudinary** (simple mais coût) :
   - SDK simple, CDN intégré, transformations d'images
   - Coût à partir d'un certain volume

---

## Migrations en production

**Problème** : Il n'existe pas de système de migrations versionné. Le fichier `init.sql` contient des `DROP TABLE IF EXISTS` qui sont **destructifs** en production.

**Procédure recommandée** :

1. Ne jamais exécuter `init.sql` en production (réservé au premier setup)
2. Créer des fichiers de migration nommés séquentiellement :
   ```
   migrations/
     001_initial.sql        (init.sql initial)
     002_add_invoice.sql    (nouvelles tables)
     003_add_audit_log.sql  ...
   ```
3. Utiliser un outil de migration : `node-pg-migrate`, `db-migrate`, ou script custom
4. Exécuter les migrations au démarrage avant le serveur

---

## Health check

```javascript
// backend/src/index.js
app.get('/api/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ success: true, services: { database: 'up' } });
  } catch (error) {
    res.status(503).json({ success: false, services: { database: 'down' } });
  }
});
```

**Point positif** : Health check vérifie PostgreSQL.

**Manque** : Pas de vérification Redis. Pas de métrique de latence. Pas d'alerte.

---

## Sauvegardes

| Aspect | État | Recommandation |
|---|---|---|
| Sauvegardes PostgreSQL | Non vérifiable | Activer backup automatique Railway (plan Pro) ou `pg_dump` cron |
| Sauvegardes Redis | Non applicable | Redis est un cache, les données sont reconstruites |
| Sauvegardes uploads | Absent | Réglé par migration vers S3 (versioning S3) |

**Railway Pro** inclut des sauvegardes automatiques. Vérifier que c'est activé.

---

## Logs

Winston est configuré avec des niveaux `info`, `warn`, `error`, `debug`.

En production Railway, les logs sont accessibles via le tableau de bord. Pas d'intégration externe (Datadog, Papertrail, Logtail) détectée.

**Recommandation** : Pour un monitoring sérieux, intégrer un service de logs externe accessible depuis Railway (Datadog, Better Uptime, ou Logtail).

---

## Causes probables des bugs constatés en production

| Bug type | Cause probable |
|---|---|
| Images cassées | Stockage éphémère Railway (confirmé) |
| Erreurs API 500 | Variable d'environnement manquante ou URL de DB incorrecte |
| Problèmes CORS | `CORS_ORIGIN` ne correspond pas à l'URL Railway du frontend |
| Emails non envoyés | `BREVO_API_KEY` absent ou invalide |
| Stripe non fonctionnel | `STRIPE_SECRET_KEY` ou `STRIPE_WEBHOOK_SECRET` absent |
| Connexion DB échoue | `DATABASE_URL` mal formatée ou PostgreSQL Railway non démarré |
| Redis non disponible | `REDIS_URL` absent (mais l'application fonctionne sans Redis) |

---

## Checklist de mise en ligne (extrait)

> Voir `14_CHECKLIST_GO_LIVE.md` pour la liste complète.

- [ ] `NODE_ENV=production` configuré
- [ ] `CORS_ORIGIN` = URL exact du frontend Railway (avec https://)
- [ ] `FRONTEND_URL` = URL exact du frontend Railway (pour liens emails)
- [ ] `STRIPE_WEBHOOK_SECRET` configuré depuis Stripe Dashboard (pas CLI)
- [ ] `JWT_SECRET` et `JWT_REFRESH_SECRET` distincts et aléatoires
- [ ] Migration vers stockage images persistant effectuée
- [ ] Sauvegardes PostgreSQL activées
- [ ] Health check confirmé après déploiement
- [ ] Test d'envoi email en production
- [ ] Test paiement Stripe avec clé LIVE (montant faible)
- [ ] Test webhook Stripe en production

---

## Environnement de staging recommandé

| Aspect | Description |
|---|---|
| Service Railway staging | Copie des services backend + frontend avec suffixe `-staging` |
| Base de données staging | PostgreSQL séparé, données de test |
| Clés Stripe staging | `sk_test_...` uniquement |
| Brevo staging | Peut utiliser un compte de test ou ne pas envoyer d'emails |
| URL staging | Sous-domaine distinct pour ne pas tromper les utilisateurs |
| Déploiement | Push sur branche `staging` → déploiement automatique vers staging |
| Déploiement prod | Push sur `main` → validation staging → déploiement prod |
