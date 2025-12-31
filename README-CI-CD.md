# 🔄 CI/CD Pipeline - Jana Distribution

Configuration complète des workflows GitHub Actions pour l'automatisation des tests, builds et déploiements.

## 📁 Structure des Workflows

```
.github/
└── workflows/
    ├── ci.yml          # 🧪 Tests et qualité de code
    ├── docker.yml      # 🐳 Build images Docker
    └── deploy.yml      # 🚀 Déploiement (staging/production)
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

## 🚀 Deploy Pipeline (`deploy.yml`)

### Déclencheurs
- **Push** sur `main`
- **Manuel** avec choix de l'environnement

### Environnements

| Environnement | URL | Déploiement |
|---------------|-----|-------------|
| Staging | https://staging.jana-distribution.fr | Automatique |
| Production | https://jana-distribution.fr | Manuel (approbation requise) |

### Workflow de déploiement

```
Push main → CI ✓ → Docker Build ✓ → Deploy Staging → [Approbation] → Deploy Production
```

---

## 🔧 Configuration Requise

### 1. Secrets GitHub

Aller dans **Settings > Secrets and variables > Actions** :

| Secret | Description | Requis |
|--------|-------------|--------|
| `GITHUB_TOKEN` | Fourni automatiquement | ✅ Auto |
| `DOCKERHUB_USERNAME` | (optionnel) Username Docker Hub | ❌ |
| `DOCKERHUB_TOKEN` | (optionnel) Token Docker Hub | ❌ |

### 2. Environnements GitHub

Aller dans **Settings > Environments** :

1. Créer l'environnement `staging`
2. Créer l'environnement `production`
   - Ajouter **Required reviewers** (approbateurs)
   - Ajouter **Wait timer** (optionnel, ex: 5 min)

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
# Déploiement staging (automatique sur push main)
git push origin main

# Déploiement production (manuel)
gh workflow run deploy.yml -f environment=production
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
