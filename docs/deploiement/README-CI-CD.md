# 🔄 CI/CD Pipeline - Jana Distribution

Configuration complète des workflows GitHub Actions pour l'automatisation des tests, builds et déploiements.

## 📁 Structure des Workflows

```
.github/
└── workflows/
    ├── ci.yml             # 🧪 Tests et qualité de code
    ├── docker.yml         # 🐳 Build images Docker
    ├── deploy-flyio.yml   # 🪂 Déploiement Fly.io (actif — auto-deploy temporaire)
    └── deploy.yml         # 🚀 Déploiement homeserver (DÉSACTIVÉ, voir section dédiée)
```

## 🧪 CI Pipeline (`ci.yml`)

### Déclencheurs
- **Push** sur les branches : `main`, `develop`, `feature/*`
- **Pull Request** vers : `main`, `develop`

### Jobs exécutés

| Job | Description | Durée estimée |
|-----|-------------|---------------|
| `backend-tests` | Tests Jest (unitaires + intégration) | ~2 min |
| `frontend-build` | Build Vite production | ~1 min |
| `security-check` | Audit npm des dépendances | ~30 sec |
| `ci-summary` | Résumé de la pipeline | ~10 sec |

### Commandes exécutées

**Backend :**
```bash
npm ci                    # Installation des dépendances
npm run lint              # Vérification ESLint
npm test -- --coverage    # Tests Jest avec couverture
```

**Frontend :**
```bash
npm ci                    # Installation des dépendances
npm run lint              # Vérification ESLint
npm run build             # Build Vite production
```

---

## 🐳 Docker Pipeline (`docker.yml`)

### Déclencheurs
- **Push** sur `main` ou `develop` (fichiers backend/frontend/Docker modifiés)
- **Pull Request** vers `main`
- **Manuel** (workflow_dispatch)

### Jobs exécutés

| Job | Description |
|-----|-------------|
| `build-backend` | Build image backend Node.js |
| `build-frontend` | Build image frontend Nginx |
| `test-compose` | Test stack complète avec Docker Compose |

### Images générées

Les images sont poussées vers **GitHub Container Registry** :

```bash
ghcr.io/<username>/jana-distribution/backend:latest
ghcr.io/<username>/jana-distribution/frontend:latest
```

### Tags générés automatiquement
- `latest` (branche main uniquement)
- `<branch-name>` (ex: `develop`, `feature-auth`)
- `<sha>` (hash du commit)

---

## 🪂 Deploy to Fly.io Pipeline (`deploy-flyio.yml`)

**Actif.** Auto-deploy **temporaire** pendant la phase de développement/tests
(décision utilisateur, 2026-09-05) — à désactiver (retirer le déclencheur
`push`, garder `workflow_dispatch`) une fois le site jugé fini. Équivalent
manuel : `flyctl deploy` — voir `docs/deploiement/DEPLOY-FLYIO.md`.

### Déclencheurs
- **Push** sur `develop`, si `backend/**`, `frontend/**` ou le workflow lui-même a changé
- **Manuel** (`workflow_dispatch`)

### Jobs exécutés

| Job | Description |
|-----|-------------|
| `deploy-backend` | `flyctl deploy --app jana-backend --remote-only` |
| `deploy-frontend` | `flyctl deploy --app jana-frontend --remote-only` |
| `smoke-test` | `curl` sur `/api/health` (backend) et `/` (frontend) après un court délai |

Les deux jobs de déploiement tournent dans l'environnement GitHub `flyio`
(secret `FLY_API_TOKEN`, voir §Configuration ci-dessous) et il n'y a pas
d'environnement de staging séparé — chaque push sur `develop` redéploie
directement `jana-backend`/`jana-frontend` en production.

---

## 🚀 Deploy Pipeline homeserver (`deploy.yml`)

> ⚠️ **SUPERSÉDÉ ET DÉSACTIVÉ (2026-09-05, décision utilisateur explicite).**
> Le homeserver `tfredklab.dev` a été abandonné avant mise en service au
> profit de Fly.io (Phase 14) — voir la section `deploy-flyio.yml`
> ci-dessus pour le pipeline réellement actif aujourd'hui. Le
> déclencheur automatique sur push `develop` a été retiré de
> `.github/workflows/deploy.yml` (ne reste que `workflow_dispatch` manuel) ;
> le job pointe toujours vers le homeserver et nécessiterait une
> revalidation complète avant réactivation. Voir `docs/archive/deploiement/DEPLOY-HOMESERVER.md`.
>
> Section originale ci-dessous, conservée à titre historique :
>
> Mis à jour 2026-07-26 (Phase 11, migration Railway → homeserver auto-géré `tfredklab.dev`). Voir `docs/archive/deploiement/DEPLOY-HOMESERVER.md` pour l'infrastructure cible.

### Déclencheurs
- **Push** sur `develop` (branche réellement déployée — pas de staging Railway distinct)
- **Manuel** (`workflow_dispatch`)

### Environnement unique

| Environnement | URL | Déploiement |
|---------------|-----|-------------|
| Production (homeserver) | https://jana.tfredklab.dev | Automatique sur push `develop` |

### Workflow de déploiement

```
Push develop → Checkout → Connexion Tailscale (tailscale/github-action) → SSH vers le homeserver
             → (forced command côté serveur) git pull && docker compose build && docker compose up -d
             → Smoke test (/api/health + /)
```

Le homeserver n'a pas de port SSH ouvert publiquement (accès Tailscale
uniquement) : le runner GitHub rejoint le tailnet avant de se connecter. La
clé SSH utilisée est restreinte côté serveur à une seule commande forcée
(`authorized_keys` : `command="..."`) — même en cas de fuite du secret, elle
ne peut exécuter que ce pipeline précis.

---

## 🔧 Configuration Requise

### 1. Secrets GitHub

Aller dans **Settings > Secrets and variables > Actions** :

| Secret | Description | Requis |
|--------|-------------|--------|
| `GITHUB_TOKEN` | Fourni automatiquement | ✅ Auto |
| `FLY_API_TOKEN` | Token de déploiement Fly.io (`flyctl tokens create org`), scopé dans l'environnement `flyio` | ✅ (deploy-flyio.yml) |
| `TS_AUTHKEY` | Clé Tailscale éphémère (générée sur [login.tailscale.com/admin/settings/keys](https://login.tailscale.com/admin/settings/keys)) pour que le runner rejoigne le tailnet | ⚠️ historique (deploy.yml désactivé) |
| `HOMESERVER_TAILSCALE_IP` | IP Tailscale du homeserver (`100.100.203.0`) | ⚠️ historique (deploy.yml désactivé) |
| `HOMESERVER_SSH_USER` | Utilisateur SSH du homeserver | ⚠️ historique (deploy.yml désactivé) |
| `HOMESERVER_SSH_KEY` | Clé privée SSH dédiée CI (restreinte côté serveur à une forced command) | ⚠️ historique (deploy.yml désactivé) |
| `DOCKERHUB_USERNAME` | (optionnel) Username Docker Hub | ❌ |
| `DOCKERHUB_TOKEN` | (optionnel) Token Docker Hub | ❌ |

### 2. Environnements GitHub

Aller dans **Settings > Environments** :

1. Créer l'environnement `flyio` (utilisé par `deploy-flyio.yml`, secret `FLY_API_TOKEN` scopé dessus)
   - Ajouter **Required reviewers** (approbateurs), optionnel
2. *(Historique, deploy.yml désactivé)* L'environnement `production` pointait vers le homeserver — plus utilisé activement.

### 3. Structure du projet requise

```
janadistribution/
├── backend/
│   ├── package.json
│   ├── package-lock.json
│   ├── Dockerfile
│   ├── .dockerignore
│   └── tests/
├── frontend/
│   ├── package.json
│   ├── package-lock.json
│   ├── Dockerfile
│   └── .dockerignore
├── docker-compose.yml
└── .github/
    └── workflows/
        ├── ci.yml
        ├── docker.yml
        ├── deploy-flyio.yml
        └── deploy.yml
```

---

## 📊 Badges de statut

Ajoutez ces badges à votre README.md principal :

```markdown
![CI](https://github.com/<username>/janadistribution/actions/workflows/ci.yml/badge.svg)
![Docker](https://github.com/<username>/janadistribution/actions/workflows/docker.yml/badge.svg)
```

---

## 🚀 Utilisation

### Lancer la CI manuellement

```bash
# Via GitHub CLI
gh workflow run ci.yml --ref main

# Ou depuis l'interface GitHub :
# Actions > CI Pipeline > Run workflow
```

### Déclencher un déploiement

```bash
# Déploiement Fly.io (automatique sur push develop, tant que deploy-flyio.yml
# garde son déclencheur push — voir décision 2026-09-05 en tête de section)
git push origin develop

# Déploiement Fly.io manuel
gh workflow run deploy-flyio.yml

# Déploiement homeserver manuel (déclencheur automatique retiré, job non
# revalidé depuis l'abandon du homeserver — voir section deploy.yml)
gh workflow run deploy.yml
```

---

## 📈 Visualisation

Après chaque exécution, un résumé est disponible dans l'onglet **Actions** :

```
🎯 CI Pipeline Summary

| Job           | Status    |
|---------------|-----------|
| Backend Tests | ✅ Passed |
| Frontend Build| ✅ Passed |
| Security Audit| ✅ Passed |
```

---

## 🐛 Dépannage

### Tests qui échouent

```bash
# Exécuter les tests localement
cd backend
npm test -- --verbose
```

### Build Docker qui échoue

```bash
# Tester le build localement
docker build -t test-backend ./backend
docker build -t test-frontend ./frontend
```

### Cache npm corrompu

Supprimer le cache dans GitHub Actions :
**Actions > Caches > Delete cache**

---

## 📚 Ressources

- [Documentation GitHub Actions](https://docs.github.com/en/actions)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments)

---

*Projet CDA - Jana Distribution - Décembre 2024*
