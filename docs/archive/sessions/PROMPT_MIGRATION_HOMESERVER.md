Tu es l'orchestrateur principal de Jana Distribution.

## MISSION DE CETTE SESSION

Remplacer Railway par un hébergement auto-géré sur le homeserver personnel de l'utilisateur
(`tfredklab.dev`), pour le backend, le frontend, PostgreSQL et Redis de Jana Distribution.
Railway est actuellement EN PAUSE (plan expiré) — cette migration devient donc le chemin
critique vers la mise en production, à la place de la Phase 8 (`T8-01..T8-06`).

## ÉTAPE 0 — LECTURE OBLIGATOIRE (avant tout)

```bash
cat docs/workflow/CLAUDE_WORKFLOW.md
cat docs/workflow/ETAT_ACTUEL_PROJET.md
cat docs/workflow/PLAN_CORRECTION_AUDIT.md
git status
git log --oneline -5
cat docker-compose.yml
cat backend/Dockerfile frontend/Dockerfile
cat backend/railway.json frontend/railway.json
cat .github/workflows/deploy.yml
```

## CONTEXTE HOMESERVER (à ne pas redemander à l'utilisateur — déjà fourni)

| Élément | Valeur |
|---|---|
| OS | Debian GNU/Linux 13 (Trixie), kernel 6.12 |
| Conteneurisation | Docker Engine 29.5.3 + Docker Compose |
| Reverse proxy | Caddy 2, un seul bloc `:80` avec matchers par `Host` header, `auto_https off` (TLS géré par Cloudflare) |
| Exposition internet | Cloudflare Tunnel nommé `"homeserver"` (cloudflared) — pas de port ouvert sur la box |
| Accès SSH | Uniquement via Tailscale (IP `100.100.203.0`), clé SSH, pas de mot de passe |
| DNS | Domaine `tfredklab.dev` chez Porkbun, zone gérée sur Cloudflare (plan Free) |
| Convention services | Chaque service dans `/opt/docker/<service>/docker-compose.yml` |
| Fichier Caddy | `/opt/docker/caddy/Caddyfile` |
| IP Docker bridge hôte | `172.17.0.1` (utilisée par Caddy pour joindre les conteneurs qui publient un port sur l'hôte) |

**Ports déjà utilisés sur cet hôte — ne pas entrer en collision :**
`80/443` (Caddy), `3000` + `53` (AdGuard Home), `3001` (Uptime Kuma), `5055` (Jellyseerr),
`8000` (Paperless-NGX), `8080` (Nextcloud), `8096` (Jellyfin), `9000` (Portainer),
`3030` + `8081` (Riven), port 22 réservé Tailscale-only.

**Ce qui NE change PAS** (indépendant de Railway) : Cloudflare R2 (stockage images),
Brevo (emails), l'architecture `routes → controllers → services → repositories`,
le code applicatif. Ne pas y toucher dans cette session.

## DÉCISION DÉJÀ PRISE

Sous-domaines de `tfredklab.dev` retenus (pas de nouvel achat de domaine) :
- `jana.tfredklab.dev` → frontend
- `jana-api.tfredklab.dev` → backend

Si ces noms ne conviennent pas à la relecture, les renommer dès l'étape T11-01 — mais ne pas
redemander à l'utilisateur pourquoi un domaine tfredklab.dev plutôt que jana-distribution.fr,
c'est déjà tranché.

## ⚠️ POINTS D'ATTENTION SÉCURITÉ SPÉCIFIQUES À CETTE MIGRATION

- Ce homeserver héberge déjà des services personnels sensibles (Vaultwarden, Nextcloud,
  fichiers média). Une vraie boutique e-commerce (données clients, commandes) va cohabiter
  sur la même machine physique. Isoler Jana dans son propre réseau Docker dédié
  (`jana-network`), ne jamais exposer PostgreSQL/Redis sur un port de l'hôte (contrairement
  au `docker-compose.yml` actuel du repo, pensé pour le dev local uniquement).
- Ne jamais réutiliser les secrets Railway (`JWT_SECRET`, `JWT_REFRESH_SECRET`, clés R2,
  `BREVO_API_KEY`) sur le homeserver — les régénérer. Un secret qui a existé dans les
  variables Railway ne doit pas resservir ailleurs.
- Le `.env` de production vit uniquement sur le homeserver (`/opt/docker/jana/.env`),
  jamais commité, jamais collé dans un rapport de session.
- Ne pas décommissionner Railway avant d'avoir validé un cutover complet (voir T11-09) —
  garder les deux en parallèle le temps de la validation.

## PLAN DE TÂCHES (nouvelle Phase 11 — remplace Phase 8 dans docs/workflow/PLAN_CORRECTION_AUDIT.md)

Respecter le cycle de tâche de `docs/workflow/CLAUDE_WORKFLOW.md §4` (préanalyse → plan → implémentation →
validation → synchronisation doc) pour chacune. Séquence recommandée :

### BLOC 1 — Infrastructure Docker (agent Full Stack)

1. **T11-01** — Confirmer les sous-domaines, vérifier qu'aucun port choisi pour
   `jana-backend`/`jana-frontend` n'entre en collision avec la liste ci-dessus.
2. **T11-02** — Créer `/opt/docker/jana/docker-compose.yml` (prod, sur le homeserver, hors
   du repo git) :
   - `postgres:15-alpine` et `redis:7-alpine` **sans mapping de port host** (réseau interne
     `jana-network` uniquement), volume nommé dédié pour les données Postgres
   - `backend` : build depuis `backend/Dockerfile` (déjà prod-ready, non-root user, healthcheck
     `/api/health` intégré), `env_file` pointant vers `/opt/docker/jana/.env`
   - `frontend` : build depuis `frontend/Dockerfile` (multi-stage Nginx), `ARG VITE_API_URL=https://jana-api.tfredklab.dev/api`
   - `restart: unless-stopped` partout, healthchecks actifs
3. **T11-03** — Ajouter dans `/opt/docker/caddy/Caddyfile` deux blocs `@jana` /
   `@jana_api` avec `reverse_proxy` vers les conteneurs (nom de service Docker, pas
   `172.17.0.1`, si Caddy et Jana partagent un réseau Docker commun — sinon `172.17.0.1:<port>`
   comme pour les autres services). Recharger Caddy sans downtime des autres services.

### BLOC 2 — Exposition et secrets (agent Cybersécurité + action externe utilisateur)

4. **T11-04** (ACTION EXTERNE) — Ajouter les deux public hostnames dans le Cloudflare Tunnel
   `"homeserver"` (dashboard Cloudflare Zero Trust) → `jana.tfredklab.dev` et
   `jana-api.tfredklab.dev` vers `localhost:80` (Caddy fait le routing final par Host header).
5. **T11-05** — Générer les nouveaux secrets de production (`openssl rand -hex 32` pour
   JWT_SECRET et JWT_REFRESH_SECRET — bien distincts), configurer le `.env` du homeserver :
   `CORS_ORIGIN=https://jana.tfredklab.dev`, `FRONTEND_URL=https://jana.tfredklab.dev`,
   `DATABASE_URL` interne au réseau `jana-network`, clés R2/Brevo/ENTREPRISE_* (nouvelles
   clés R2 dédiées si possible, ne pas réutiliser celles de Railway).

### BLOC 3 — Continuité de service (agent Backend + Full Stack)

6. **T11-06** — Script de sauvegarde PostgreSQL (`pg_dump` via cron sur le homeserver,
   rotation à définir) + une restauration de test documentée. Remplace T8-04 (sauvegardes
   Railway, devenu sans objet).
7. **T11-07** — Ajouter `https://jana.tfredklab.dev` et
   `https://jana-api.tfredklab.dev/api/health` comme moniteurs dans l'instance Uptime Kuma
   déjà en place (`status.tfredklab.dev`). Remplace T8-05 (UptimeRobot/Better Uptime, devenu
   sans objet).
8. **T11-08** — Remplacer le stub SSH de `.github/workflows/deploy.yml` (section
   "INSTRUCTIONS DE DÉPLOIEMENT" actuellement en commentaire) par un vrai déploiement :
   connexion SSH via Tailscale vers le homeserver, `cd /opt/docker/jana && git pull &&
   docker compose build && docker compose up -d`.
   **DÉCISION REQUISE (demander à l'utilisateur, ne pas trancher seul)** : quel mécanisme
   d'authentification pour GitHub Actions → homeserver (clé SSH dédiée restreinte en secret
   GitHub, tailscale auth key à durée limitée, ou runner self-hosted sur le homeserver
   lui-même) — c'est un choix avec de vraies implications sécurité, pas un détail
   d'implémentation.

### BLOC 4 — Cutover et documentation (agent Chef de Projet)

9. **T11-09** — Cutover : Railway reste actif jusqu'à validation complète du flux commande
   sur `jana.tfredklab.dev` (voir `docs/checklists/CHECKLIST_TEST_LOCAL.md` comme base, adapter les URLs).
   Une fois validé, bascule DNS finale et décommission Railway (arrêt des services, pas
   suppression immédiate du projet Railway — garder un filet de sécurité quelques jours).
10. **T11-10** — Synchronisation documentaire complète :
    - Supprimer `backend/railway.json`, `frontend/railway.json`
    - Remplacer `docs/deploiement/DEPLOY-RAILWAY.md` par `docs/deploiement/DEPLOY-HOMESERVER.md` (procédure homeserver)
    - Archiver ou réécrire `docs/deploiement/RAILWAY_CONFIG_READY.md` (⚠️ il mentionne encore Stripe,
      déjà retiré du projet — corriger au passage)
    - Mettre à jour `CLAUDE.md` (ligne Déploiement : Railway → Homeserver `tfredklab.dev`
      / Docker Compose / Caddy / Cloudflare Tunnel ; corriger aussi le `~68%` et la mention
      Stripe déjà obsolètes constatés lors de la session précédente)
    - Mettre à jour `docs/workflow/ETAT_ACTUEL_PROJET.md` (§3 stack, §4 architecture, §10 environnements,
      §13 prochaine action) et `docs/workflow/PLAN_CORRECTION_AUDIT.md` (Phase 8 → statut CANCELLED avec
      renvoi vers la nouvelle Phase 11 ; ajouter la Phase 11 avec T11-01..T11-10)
    - Mettre à jour `README.md` (section déploiement) et `docs/deploiement/README-CI-CD.md` si le workflow
      `deploy.yml` change de forme

## RÈGLES D'ORCHESTRATION

- Respecter `docs/workflow/CLAUDE_WORKFLOW.md §7` (règles de sécurité absolues) : ne jamais afficher un
  secret, ne jamais committer `.env`, toujours vérifier `git diff | grep -iE
  "sk_live|jwt_secret|whsec_|BEGIN.*PRIVATE KEY"` avant tout commit.
- Les actions qui modifient le homeserver lui-même (Caddyfile, docker-compose, Cloudflare
  Tunnel, cron) se font en dehors du repo git Jana Distribution — documenter précisément
  les commandes exécutées côté serveur dans le rapport de session, mais le repo git ne
  contient que le code applicatif et la documentation.
- Ne pas décommissionner Railway avant T11-09 validé.
- Si une décision utilisateur est nécessaire (T11-08 notamment) et non tranchée : marquer
  la tâche `BLOCKED`, ne pas inventer de choix par défaut.

## BILAN FINAL OBLIGATOIRE

Format `docs/workflow/CLAUDE_WORKFLOW.md §9`, puis mise à jour de `docs/workflow/PLAN_CORRECTION_AUDIT.md` et
`docs/workflow/ETAT_ACTUEL_PROJET.md`, commit final : `chore(infra): migration Railway vers homeserver [DATE]`.

---

**Lance maintenant en commençant par lire les fichiers opérationnels (Étape 0), puis
confirme T11-01 avant de créer quoi que ce soit sur le homeserver.**
