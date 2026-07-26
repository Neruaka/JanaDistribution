# Déploiement Homeserver — Jana Distribution

> Remplace Railway comme chemin critique vers la production (Phase 11,
> `docs/PLAN_CORRECTION_AUDIT.md`). Railway reste actif en parallèle jusqu'à
> validation complète du cutover (T11-09) — voir `docs/DEPLOY-RAILWAY.md`
> (historique).

Backend Node + PostgreSQL + Redis + frontend React/Vite, auto-hébergés en
Docker Compose sur le homeserver personnel `tfredklab.dev`, exposés via
Cloudflare Tunnel + Caddy (reverse proxy déjà en place pour d'autres
services : Vaultwarden, Nextcloud, Jellyfin, etc.).

---

## 1. Architecture cible

```
Internet
  → Cloudflare Tunnel "homeserver" (cloudflared, pas de port ouvert)
      → Caddy :80 (matchers par Host header, TLS géré par Cloudflare)
          ├── jana.tfredklab.dev      → 172.17.0.1:4000 (jana-frontend)
          └── jana-api.tfredklab.dev  → 172.17.0.1:4001 (jana-backend)

/opt/docker/jana/  (hors dépôt git)
├── docker-compose.yml     (services : postgres, redis, backend, frontend)
├── .env                   (secrets — jamais commité, chmod 600)
├── pgdata/                (bind mount données Postgres)
├── redisdata/             (bind mount données Redis)
├── backups/               (dumps pg_dump quotidiens, rotation 14j)
├── backup-postgres.sh     (script cron)
└── repo/                  (clone git de ce dépôt, branche develop)
```

`postgres` et `redis` n'ont **aucun port publié sur l'hôte** (réseau
`jana-network` interne uniquement) — seuls `backend` (4001→3000) et
`frontend` (4000→80) sont publiés, et uniquement Caddy les atteint via
`172.17.0.1:<port>`.

---

## 2. Pourquoi un sous-dossier `repo/`

Le dépôt git contient déjà un `docker-compose.yml` de dev (`Dockerfile.dev`,
ports Postgres/Redis publiés, volumes source montés). Si `/opt/docker/jana`
était lui-même le clone git, un `git pull` écraserait le compose de
production à chaque déploiement. Le clone git vit donc dans un sous-dossier
`repo/`, et le compose de production (avec ses propres contextes de build
`./repo/backend`, `./repo/frontend`) reste à la racine de `/opt/docker/jana/`,
hors du dépôt.

---

## 3. Premier déploiement (fait le 2026-07-26)

```bash
mkdir -p /opt/docker/jana && cd /opt/docker/jana
git clone --branch develop https://github.com/Neruaka/JanaDistribution repo

# .env : générer les secrets sur CE serveur (jamais réutiliser Railway)
# JWT_SECRET / JWT_REFRESH_SECRET / POSTGRES_PASSWORD via `openssl rand -hex 32`
# Voir la section 5 pour la liste complète des variables.

docker compose build
docker compose up -d
```

Le schéma DB est initialisé via `repo/backend/scripts/init.sql` (monté en
`docker-entrypoint-initdb.d`, comme en dev local) — **seulement au premier
démarrage** (Postgres saute l'init si `pgdata/` contient déjà des données).

⚠️ **Dette connue** : `backend/scripts/run-migrations.js` et la migration
`0001` ne sont pas committés dans le dépôt git (fichiers locaux uniquement
sur une machine de dev). `npm run migrate` est donc inutilisable tel quel
sur un environnement propre — `init.sql` (resynchronisé avec les migrations
0001-0010 le 2026-07-04) est la seule source de schéma fiable pour un
premier déploiement. À corriger : committer `run-migrations.js` + la
migration `0001` manquante.

---

## 4. Correctif SSL requis (`DB_SSL_DISABLE`)

`backend/src/config/database.js` forçait `ssl: { rejectUnauthorized: false }`
en mode production (`DATABASE_URL`), requis par Railway/Render mais
incompatible avec un PostgreSQL auto-hébergé sans TLS configuré. Le flag
`DB_SSL_DISABLE=true` (dans `/opt/docker/jana/.env`) désactive le SSL côté
pool `pg` uniquement quand demandé explicitement — le comportement Railway
par défaut est inchangé.

---

## 5bis. Stockage images — auto-hébergé sur disque (pas de R2)

`backend/src/middlewares/upload.middleware.js` fait un no-op R2 dès que
`R2_ACCOUNT_ID`/`R2_ACCESS_KEY_ID` sont absents du `.env` — le fichier reste
alors sur le disque local du conteneur (`/app/uploads/products`). Railway
avait un filesystem éphémère (raison d'être de R2 à l'origine, DM-09) ; le
homeserver a un disque persistant, donc R2 n'est plus nécessaire pour
l'instant. Variables `R2_*` retirées du `.env` (2026-07-26).

`docker-compose.yml` monte un volume bind dédié sur le service `backend` :

```yaml
volumes:
  - ./uploads:/app/uploads
```

⚠️ Le conteneur backend tourne en non-root (`nodejs`, uid 1001 — voir
`backend/Dockerfile`). Le dossier hôte `/opt/docker/jana/uploads` doit lui
appartenir, sinon `EACCES` à l'upload :

```bash
docker run --rm -v /opt/docker/jana/uploads:/data alpine chown -R 1001:1001 /data
```

Pour revenir à R2 plus tard : générer un nouveau token R2 dédié (ne jamais
réutiliser celui de Railway), renseigner les 5 variables `R2_*` dans `.env`,
`docker compose up -d backend`.

---

## 5. Variables d'environnement (`/opt/docker/jana/.env`)

Voir `backend/.env.example` pour la liste de référence. Différences
spécifiques homeserver :

| Variable | Valeur homeserver |
|---|---|
| `DATABASE_URL` | recalculée par `docker-compose.yml` (`environment:`) à partir de `POSTGRES_*` |
| `DB_SSL_DISABLE` | `true` |
| `CORS_ORIGIN` / `FRONTEND_URL` | `https://jana.tfredklab.dev` |
| `GMAIL_SENDER_EMAIL` / `GMAIL_APP_PASSWORD` | voir `docs/GUIDE_GMAIL_SMTP.md` — **à renseigner, jamais réutiliser un secret Railway** |
| `R2_*` | **Non utilisées (2026-07-26)** — stockage d'images auto-hébergé sur disque local (voir §5bis), toutes les variables R2 retirées du `.env` |
| `ENTREPRISE_ADRESSE` | à renseigner avant toute vente réelle (obligation légale facture) |

`POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` sont lus à la fois par
le service `postgres` (`env_file`) et interpolés par Docker Compose dans
`DATABASE_URL` du service `backend` — attention à ne PAS échapper ces
variables avec `$$` dans `docker-compose.yml` sauf dans les `healthcheck:`
(shell interne au conteneur), sous peine de laisser `${POSTGRES_USER}` non
substitué dans `DATABASE_URL`.

---

## 6. Sauvegardes PostgreSQL

`/opt/docker/jana/backup-postgres.sh` : `pg_dump` quotidien (cron `0 3 * * *`),
gzip, rotation 14 jours dans `/opt/docker/jana/backups/`. Restauration
testée le 2026-07-26 (17 tables restaurées avec succès dans une base
temporaire). Restauration manuelle :

```bash
gunzip -c backups/jana_<date>.sql.gz | docker exec -i jana-postgres psql -U jana_user -d jana_distribution
```

---

## 7. Monitoring

Moniteurs Uptime Kuma (`status.tfredklab.dev`) :
- `https://jana.tfredklab.dev` (frontend)
- `https://jana-api.tfredklab.dev/api/health` (backend)

---

## 8. Déploiement continu (CI/CD)

`.github/workflows/deploy.yml` : push sur `develop` → le runner GitHub
rejoint le tailnet Tailscale (`tailscale/github-action`, secret
`TS_AUTHKEY`) puis SSH vers le homeserver avec une clé dédiée
(`HOMESERVER_SSH_KEY`) restreinte côté serveur à une **forced command**
(`authorized_keys` : `command="cd /opt/docker/jana/repo && git pull && cd
/opt/docker/jana && docker compose build && docker compose up -d"`) — même
en cas de fuite de la clé, elle ne peut exécuter que ce pipeline précis,
aucun accès shell interactif.

Secrets GitHub requis : `TS_AUTHKEY`, `HOMESERVER_TAILSCALE_IP`
(`100.100.203.0`), `HOMESERVER_SSH_USER`, `HOMESERVER_SSH_KEY`.

---

## 9. Reverse proxy Caddy

Bloc ajouté dans `/opt/docker/caddy/Caddyfile` (sur le homeserver, hors
dépôt git) :

```
@jana host jana.tfredklab.dev
handle @jana {
  reverse_proxy 172.17.0.1:4000
}

@jana_api host jana-api.tfredklab.dev
handle @jana_api {
  reverse_proxy 172.17.0.1:4001
}
```

⚠️ Pour appliquer un changement de `Caddyfile` : ne pas utiliser `mv` pour
remplacer le fichier (un bind-mount fichier-à-fichier Docker reste attaché
à l'inode d'origine, `caddy reload` rechargerait alors l'ancien contenu).
Écrire le contenu en place (`cp` ou édition directe) puis `docker exec caddy
caddy reload --config /etc/caddy/Caddyfile` ; en cas de doute, `docker
restart caddy` (interruption de quelques secondes pour tous les services
proxyfiés, mais garantit la reprise du fichier actuel).

---

## 10. Actions externes restantes avant cutover complet (T11-09)

1. Ajouter les deux public hostnames dans le tunnel Cloudflare "homeserver"
   (Zero Trust → Networks → Tunnels → Public Hostname) : `jana.tfredklab.dev`
   et `jana-api.tfredklab.dev` → `localhost:80`.
2. Renseigner `GMAIL_SENDER_EMAIL` / `GMAIL_APP_PASSWORD` (nouveau mot de
   passe d'application, pas celui de Railway) dans `.env`.
3. ~~Générer un nouveau token R2 dédié~~ — non nécessaire (stockage local, voir §5bis).
4. Renseigner `ENTREPRISE_ADRESSE`.
5. Ajouter les moniteurs Uptime Kuma (section 7).
6. Configurer les 4 secrets GitHub Actions (section 8).
7. Valider le flux commande complet sur `jana.tfredklab.dev` avant bascule
   DNS finale et arrêt de Railway (garder Railway actif quelques jours après
   comme filet de sécurité, ne pas supprimer le projet immédiatement).
