# Déploiement Fly.io — Jana Distribution

> Infrastructure de production active depuis le 2026-09-04 (Phase 14). Déploiement
> **manuel** (`flyctl deploy`), pas de CI/CD — choix délibéré pour ne pas dépendre
> de GitHub Actions. Voir `docs/workflow/ETAT_ACTUEL_PROJET.md` Phase 14 pour
> l'historique de la mise en place.

---

## 1. Vue d'ensemble

| App Fly | Rôle | URL | Config |
|---|---|---|---|
| `jana-backend` | API Node/Express | https://jana-backend.fly.dev | `backend/fly.toml` + `backend/Dockerfile` |
| `jana-frontend` | React/Vite servi par Nginx | https://jana-frontend.fly.dev | `frontend/fly.toml` + `frontend/Dockerfile` |
| `jana-db` | PostgreSQL managé (réseau privé uniquement) | — (accès via `DATABASE_URL` auto-injectée) | — |

Org Fly : `personal`, région : `cdg` (Paris).

`flyctl` doit être authentifié sur le compte propriétaire (`flyctl auth whoami` pour vérifier). Sur cette machine, le binaire n'est pas forcément sur le `PATH` — utiliser le chemin complet si besoin :
```bash
# Git Bash / WSL
/c/Users/<utilisateur>/.fly/bin/flyctl.exe <commande>
```

---

## 2. Déployer une mise à jour

### Backend

```bash
cd backend
flyctl deploy
```

Ça rebuild l'image Docker (`backend/Dockerfile`) à partir du code local — **pas** de ce qui est sur GitHub — et la pousse sur `jana-backend`. `flyctl deploy` attend que le nouveau machine passe les healthchecks (`GET /api/health`) avant de couper l'ancien ; en cas d'échec, l'ancienne version continue de tourner (pas de coupure).

### Frontend

```bash
cd frontend
flyctl deploy
```

Même principe. `VITE_API_URL` est injecté comme build arg depuis `frontend/fly.toml` (`https://jana-backend.fly.dev/api`) — inutile de le repasser en ligne de commande.

### Les deux en même temps

Il n'y a pas de commande unique : lancer les deux `flyctl deploy` l'un après l'autre (backend d'abord si le changement touche l'API, pour éviter que le frontend appelle une route qui n'existe pas encore).

---

## 3. Migrations de base de données

`flyctl deploy` ne touche **jamais** à la base — un changement de schéma doit être appliqué à la main avant (ou après, selon compatibilité) le déploiement du code qui en dépend.

`jana-db` n'est joignable que depuis le réseau privé Fly (pas de port exposé publiquement) : passer par un tunnel local.

```bash
# Terminal 1 — ouvre un tunnel local vers jana-db
flyctl proxy 15433:5432 --app jana-db

# Terminal 2 — applique la migration via le tunnel
psql "postgresql://<user>:<password>@localhost:15433/<db>" -f backend/scripts/migrations/00XX_ma_migration.sql
```

Les identifiants de connexion (`user`/`password`/`db`) sont dans `DATABASE_URL` (voir `flyctl secrets list --app jana-backend`, la valeur elle-même n'est pas affichée — se référer à ce qui a été utilisé au provisioning, ou regénérer via `flyctl postgres connect --app jana-db` qui ouvre directement un shell `psql` sans avoir besoin du mot de passe).

Après une migration, penser à répercuter le changement dans `backend/scripts/init.sql` (convention du projet : les migrations sont aussi refondues dans le schéma d'installation fraîche, voir les migrations existantes 0001-0012).

---

## 4. Secrets (variables d'environnement sensibles)

```bash
# Voir les secrets configurés (noms + empreinte, jamais les valeurs)
flyctl secrets list --app jana-backend

# Changer un secret — préférer stdin à un argument de commande
# (évite qu'il apparaisse en clair dans l'historique shell / process list)
printf 'MA_CLE=la_valeur\n' | flyctl secrets import --app jana-backend
```

Poser un secret redéploie automatiquement l'app (sauf `--stage` pour différer). Le frontend n'a pas de secrets runtime — `VITE_API_URL` est un build arg dans `frontend/fly.toml`, pas un secret Fly.

---

## 5. Vérifier après déploiement

```bash
curl https://jana-backend.fly.dev/api/health
curl -I https://jana-frontend.fly.dev/

flyctl status --app jana-backend
flyctl checks list --app jana-backend
```

Logs en direct :
```bash
flyctl logs --app jana-backend
```

---

## 6. Rollback

Pas de commande `rollback` dédiée dans cette version de `flyctl` — revenir à l'image précédente manuellement :

```bash
# Lister les releases avec leur référence d'image
flyctl releases --app jana-backend --image

# Redéployer une image précédente par sa référence
flyctl deploy --app jana-backend --image <reference-de-l-image-precedente>
```

Le rollback ne touche que le code — si la version cassée avait aussi appliqué une migration de schéma incompatible, il faut la défaire à la main (voir §3) avant ou après.

---

## 7. Nom de domaine personnalisé

Voir `docs/guides/GUIDE_NOM_DOMAINE_FLYIO.md` (achat du domaine, certificats
`flyctl certs`, DNS, mise à jour de `CORS_ORIGIN`/`FRONTEND_URL`/`VITE_API_URL`).

---

## 8. Ce qui n'est PAS automatique

- **Pas de déploiement sur push GitHub.** `.github/workflows/deploy.yml` cible encore l'ancien homeserver et est désactivé (déclencheur manuel uniquement) — voir `docs/deploiement/README-CI-CD.md`. Un `git push` seul ne change rien en production.
- **Pas de migration automatique.** Voir §3.
- **Pas de peuplement de catalogue.** `backend/scripts/seed.js` crée des comptes de démo à mot de passe public — volontairement jamais exécuté en production (voir Phase 14, T14-*). Le catalogue réel se gère depuis le back-office (`https://jana-frontend.fly.dev/admin`).
