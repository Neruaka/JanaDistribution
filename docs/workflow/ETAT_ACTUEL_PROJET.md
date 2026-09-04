# ÉTAT ACTUEL DU PROJET — Jana Distribution

> Mise à jour : 2026-09-04. Source : inspection statique du code + git status + audit fonctionnel/sécurité complémentaire (Phase 13) + mise en production Fly.io (Phase 14).
> Mettre à jour après chaque tâche DONE.

---

## 1. Métadonnées

| Champ | Valeur |
|---|---|
| Projet | Jana Distribution — e-commerce alimentaire B2C/B2B |
| Branche active | `develop` |
| Dernier commit | `2cadd42` — merge develop (migration Gmail SMTP + fix `DB_SSL_DISABLE`) |
| Fichiers modifiés non commités | `docs/deploiement/DEPLOY-HOMESERVER.md` (nouveau), `docs/deploiement/DEPLOY-RAILWAY.md`/`docs/deploiement/RAILWAY_CONFIG_READY.md` (bandeau obsolescence), `CLAUDE.md`/`docs/workflow/ETAT_ACTUEL_PROJET.md`/`docs/workflow/PLAN_CORRECTION_AUDIT.md` (Phase 11), `.github/workflows/deploy.yml`, suppression `backend/railway.json` + `frontend/railway.json` |
| Phase active | Phase 14 — Mise en production sur Fly.io (Phase 11 homeserver SUPERSÉDÉE — décision utilisateur 2026-09-04) |
| Tâche active | Session 2026-09-04 (suite de l'audit Phase 13) : décision utilisateur d'abandonner le homeserver auto-géré pour un hébergeur managé, budget quasi-nul, sans dépendance GitHub. **Site déployé, vérifié et pleinement fonctionnel en production sur Fly.io** : `jana-frontend.fly.dev` + `jana-backend.fly.dev` + Postgres (réseau privé) + Redis (pay-as-you-go) + volume persistant pour les images produits (remplace Cloudflare R2, décision utilisateur) + email transactionnel Gmail SMTP actif (nouveau mot de passe d'application généré par l'utilisateur, envoi réel vérifié). Compte admin réel créé (pas le seed de démo). Bug réel trouvé et corrigé : `nginx.conf` du frontend faisait crasher le conteneur au démarrage (proxy vers un hostname Docker Compose inexistant sur Fly). Les 7 tâches de Phase 14 sont DONE. Reste : DB-04 (P0, décision propriétaire, inchangé) et peuplement du catalogue par l'utilisateur. |
| Verdict | **EN PRODUCTION SUR FLY.IO et fonctionnel, facturation légale complète** (T5-14 immuabilité + T5-15 avoir). **Backlog de code entièrement traité (0 tâche TODO)** le 2026-09-05 — voir `PLAN_CORRECTION_AUDIT.md` §1. Reste : DB-04 (P0, décision propriétaire — rotation secret + purge historique git), `.github/workflows/deploy.yml` cible encore le homeserver abandonné (décision propriétaire requise avant tout push), 3 validations externes bloquantes (légal/comptable/tests facture dépendants), catalogue vide à peupler. |
| Avancement estimé | ~98 % (52/80 tâches DONE, hors Phase 11 ; Phase 13 : 7/24 DONE ; Phase 14 : 7/7 DONE) |

---

## 2. Verdict

**NON PRÊT POUR LA PRODUCTION.**

Phases 0-7 terminées, y compris facturation légale complète (T5-01..T5-13 : génération auto VIREMENT/CHEQUE/ESPECES + envoi PDF par email) et tests d'intégration réels sur vraie base PostgreSQL via testcontainers (T7-01/T7-03/T7-06, nécessitent Docker localement). `backend/scripts/init.sql` resynchronisé avec les migrations 0001-0010. Railway abandonné comme chemin critique (plan expiré) — migration vers un homeserver auto-géré en cours (Phase 11, voir `docs/deploiement/DEPLOY-HOMESERVER.md`) : infrastructure Docker/Caddy déployée et validée le 2026-07-26, reste la configuration des secrets externes (Cloudflare Tunnel, Gmail SMTP, R2, GitHub Actions) et le cutover final (T11-09). Avancement : ~98%. ⚠️ Validation comptable TVA toujours requise avant prod.

---

## 3. Stack confirmée

| Couche | Technologie | Version |
|---|---|---|
| Frontend | React + Vite | 18.2 / 7.3 |
| Styles | TailwindCSS | 3.4 |
| Routing | React Router Dom | 6 |
| State | Context API | — |
| Backend | Node.js + Express | ≥18 / 4.18.2 |
| Base de données | PostgreSQL | 15 |
| Cache | ioredis | 7 |
| Auth | JWT access 7j + refresh 30j | jsonwebtoken 9 |
| Email | Gmail SMTP (`nodemailer`) | ^9 |
| Paiements | Pas de paiement en ligne (MVP) — ESPECES / VIREMENT / CHEQUE uniquement, Stripe retiré (T4-07, 2026-07-02) | — |
| Géocodage livraison | BAN API adresse.data.gouv.fr | gratuit |
| Upload fichiers | Multer → Cloudflare R2 (endpoint EU) | 1.4.5-lts.1 + @aws-sdk/client-s3 |
| Déploiement | Homeserver auto-géré `tfredklab.dev` (Docker Compose + Caddy + Cloudflare Tunnel) — Railway EN PAUSE, gardé en parallèle jusqu'au cutover T11-09 | — |
| CI/CD | GitHub Actions | — |
| Validation | express-validator | — |
| Logs | Winston | 3.11.0 |
| Tests backend | Jest (DB mockée) | — |
| Tests frontend | Vitest | 4.0.16 |

---

## 4. Architecture actuelle

```
Navigateur
  → Cloudflare Tunnel "homeserver" (cloudflared, pas de port ouvert)
      → Caddy :80 (matchers Host, TLS via Cloudflare)
          ├── jana.tfredklab.dev     → jana-frontend (Nginx, port hôte 4000)
          └── jana-api.tfredklab.dev → jana-backend (Express, port hôte 4001)
                ├── PostgreSQL 15 (conteneur jana-postgres, réseau interne uniquement)
                ├── Redis 7 / ioredis (conteneur jana-redis, réseau interne uniquement)
                ├── Gmail SMTP (externe — email)
                └── BAN API adresse.data.gouv.fr (externe — géocodage)
```

Détails complets : `docs/deploiement/DEPLOY-HOMESERVER.md`. Railway (NIXPACKS backend, Dockerfile frontend) reste actif en parallèle jusqu'au cutover (T11-09), voir `docs/deploiement/DEPLOY-RAILWAY.md` (obsolète, référence historique).

**Points d'entrée principaux :**

| Responsabilité | Fichier |
|---|---|
| Backend principal | `backend/src/index.js` |
| Schéma DB | `backend/scripts/init.sql` |
| Auth (JWT, login, refresh) | `backend/src/services/auth.service.js` |
| Commandes (transaction atomique) | `backend/src/repositories/order.repository.js` |
| Paiement (statut manuel ESPECES/VIREMENT/CHEQUE) | `backend/src/routes/admin.order.routes.js` |
| Livraison (FIXE/DISTANCE) | `backend/src/services/settings.service.js` |
| Géocodage BAN | `backend/src/services/geocoding.service.js` *(non commité)* |
| Checkout frontend | `frontend/src/pages/CheckoutPage.jsx` |
| Middleware auth + admin | `backend/src/middlewares/auth.middleware.js` |
| Email (Gmail SMTP via nodemailer) | `backend/src/services/email.service.js` |

---

## 5. Fonctionnalités — état réel

| Domaine | État | Éléments fonctionnels | Vérification |
|---|---|---|---|
| Catalogue (produits, catégories, filtres, pagination) | FONCTIONNEL | CRUD complet, recherche, tri | Code inspecté |
| Panier (CRUD, persistance DB) | FONCTIONNEL | Ajout, modif, suppression, persistance | Code inspecté |
| Commande (transaction atomique, stock) | FONCTIONNEL | BEGIN/COMMIT, décrémentation stock idempotente | Code inspecté |
| Paiement (ESPECES / VIREMENT / CHEQUE, pas de paiement en ligne) | FONCTIONNEL | Statut paiement positionné manuellement par un admin ; remboursement manuel tracé (montant_rembourse + audit_log). Stripe retiré (T4-07, 2026-07-02). | Code inspecté + committé |
| Livraison (FIXE + DISTANCE Haversine) | FONCTIONNEL | Calcul serveur, franco de port, BAN API intégrée | Code inspecté |
| Authentification (login, register, refresh) | FONCTIONNEL | JWT, bcrypt 12 rounds, reset MDP haché | Code inspecté |
| Emails transactionnels (Gmail SMTP) | FONCTIONNEL | Bienvenue, statut commande, reset MDP, facture (PDF joint) | Code inspecté + tests (112/112 ✓) |
| Administration (produits, catégories, commandes, clients, paramètres) | FONCTIONNEL | Interface complète | Code inspecté |
| Facturation | FONCTIONNEL | Tables facture/facture_ligne, invoice.service, PDFKit, routes client+admin, génération manuelle admin + génération auto (T5-08 : VIREMENT/CHEQUE à CONFIRMEE, ESPECES à LIVREE) + envoi email PDF (T5-13) | Code inspecté |
| Tests | FONCTIONNEL | Jest backend (139/139, DB mockée) + 9 suites d'intégration réelles testcontainers/vraie PostgreSQL exécutées avec succès le 2026-07-26 (70/70, dont order.create/order.idempotency/auth/stock.concurrent), voir `12_STRATEGIE_TESTS.md` ; 1 test Vitest frontend | Exécuté localement (Docker Desktop), pas encore automatisé en CI |
| Railway (déploiement) | PARTIEL | Health check OK, images éphémères, pas de staging | Non vérifiable Railway |
| Stockage images | FONCTIONNEL | Cloudflare R2 (uploadToR2 middleware) + fallback disque local en dev | Code inspecté |
| Refresh tokens révocables | FONCTIONNEL | Table refresh_token, login stocke le hash, logout révoque, rotation au refresh | Code modifié T2-03..T2-05 |
| Historique statuts commande | FONCTIONNEL | Table + updateStatus() + cancel() loguent chaque transition, endpoint GET /:id/history | Code modifié T2-01..T2-02 |

---

## 6. Problèmes bloquants — liste réconciliée

### Écart constaté dans l'audit

L'`INDEX.md` (P0-04) et le `00_RESUME_EXECUTIF.md` (P1-4) classifient différemment le problème des tests mockés. Le résumé exécutif classe `Access-Control-Allow-Origin: *` sur `/uploads` comme P0-4 alors que l'INDEX.md l'omit des P0. Les deux documents sont issus du même audit. **Décision retenue :** CORS `*` sur /uploads = P0 (sécurité de production confirmée dans le code à `backend/src/index.js:117`). Tests mockés = P1 (bloque la fiabilité, pas la mise en ligne immédiate).

### P0 — Bloquants immédiats (2 restants sur 4)

| ID | Priorité | Problème | Preuve dans le code | Tâche | État |
|---|---|---|---|---|---|
| P0-A | P0 | Message checkout trompeur "devis/paiement à la livraison" affiché à TOUS les utilisateurs y compris mode CARTE | `CheckoutPage.jsx:347-362` — bandeau non conditionnel | T0-01 | ~~RÉSOLU~~ |
| P0-B | P0 | Images produits sur disque éphémère Railway — perdues à chaque redéploiement | `upload.middleware.js` + `index.js:42` | T0-02 | ~~RÉSOLU~~ (Cloudflare R2) |
| P0-C | P0 | Facturation entièrement absente — obligation légale France | Aucune table facture dans `init.sql` | T5-01..T5-17 | ~~RÉSOLU~~ (⚠️ validation comptable requise) |
| P0-D | P0 | `Access-Control-Allow-Origin: *` sur `/uploads` — exposition non restreinte | `backend/src/index.js:117` | T0-07 | ~~RÉSOLU~~ |

### P1 — Critiques avant lancement (7 restants sur 10)

| ID | Priorité | Problème | Preuve dans le code | Tâche | État |
|---|---|---|---|---|---|
| P1-01 | P1 | `JWT_REFRESH_SECRET` fallback silencieux sur `JWT_SECRET` | `auth.service.js:24` | T0-03 | ~~RÉSOLU~~ |
| P1-02 | P1 | Refresh tokens non révocables (pas de table en DB) | Absent de `init.sql` | T2-03..T2-05 | ~~RÉSOLU~~ |
| P1-03 | P1 | `stripe_event.payload` JSONB complet stocké (données sensibles) | `payment.service.js:149` + `init.sql` | T0-04 | ~~RÉSOLU~~ |
| P1-04 | P1 | `hasPermission()` utilise `req.user.permissions` inexistant en DB | `auth.middleware.js:159` — `permissions` absent de `utilisateur` | T1-02 | ~~RÉSOLU~~ |
| P1-05 | P1 | Panier vidé APRÈS le COMMIT de la transaction commande | `order.service.js:183` | T1-01 | ~~RÉSOLU~~ |
| P1-06 | P1 | Pas de validation force mot de passe côté backend | `auth.service.js` — aucune regex | T0-05 | ~~RÉSOLU~~ |
| P1-07 | P1 | `charge.refunded` au lieu de `refund.created` (moins précis) | `payment.service.js:174` | T4-01 | ~~RÉSOLU~~ |
| P1-08 | P1 | Sauvegardes PostgreSQL non configurées Railway | Non vérifiable localement | T8-04 | TODO |
| P1-09 | P1 | Pas d'environnement staging Railway | Non vérifiable localement | T8-01..T8-03 | TODO |
| P1-10 | P1 | Tests backend mockent la DB — aucune requête SQL testée réellement | `tests/setup.js` — `jest.mock('../src/config/database')` | T7-01..T7-07 | TODO |

---

## 7. État du working tree (important)

**Branche develop, working tree propre.**

### Session 2026-07-02 — commits effectués

| Commit | Tâche | Description |
|---|---|---|
| `9ee63d0` | T4-07 | feat(mvp): remove Stripe entirely - MVP uses ESPECES/VIREMENT/CHEQUE only |
| `586da91` | Promo (backend) | feat(promo): promo codes system - DB schema + repository + service + API routes (admin + client) |
| `5c7634d` | Promo (checkout) | feat(promo): promo code field in checkout - validation + display discount in real time |
| `dfaca2d` | T-PROMO-ADMIN | feat(admin): promo codes management page - CRUD + stats + toggle |

### Session 2026-06-28 — commits effectués

| Commit | Tâche | Description |
|---|---|---|
| `254278b` | Docker | feat(docker): full docker-compose dev environment |
| `2b76c08` | T7-02 | test(webhook): Stripe webhook integration tests (7 tests) — *fichier supprimé le 2026-07-02, voir T4-07* |
| `8b203d8` | T5-11/T5-12 | feat(invoices): PDF download client + admin |
| `214c9fb` | T6-05 | chore(frontend): remove orphan PromotionsPage |

---

## 8. Décisions techniques

| Décision | Statut | Détail |
|---|---|---|
| Paiement en ligne (Stripe) | **RETIRÉ (2026-07-02)** | Décision client : pas de paiement en ligne au MVP. Modes acceptés : ESPECES (livraison), VIREMENT, CHEQUE. Voir T4-07. |
| Bibliothèque PDF factures | DÉCIDÉ | PDFKit ^0.19.1 — installé et implémenté |
| Cloudflare R2 | DÉCIDÉ ET CONFIGURÉ | Bucket `jana-products`, endpoint EU, token R2 en .env, URL pub- active |
| Client Redis | DÉCIDÉ | ioredis conservé, package `redis` supprimé |
| Système de validation | DÉCIDÉ | express-validator (joi supprimé — jamais importé) |
| Tests intégration | DÉCIDÉ | Vraie PostgreSQL (testcontainers-node) — installé, scaffolding DONE |
| Architecture | DÉCIDÉ | Évolution progressive — pas de réécriture |
| Refresh tokens | DÉCIDÉ ET IMPLÉMENTÉ | Table `refresh_token` créée et active |
| Railway | EN PAUSE | Période d'essai expirée — déploiement différé, config prête dans RAILWAY_CONFIG_READY.md |
| Email transactionnel | DÉCIDÉ ET IMPLÉMENTÉ (2026-07-08) | Migration Brevo REST API → Gmail SMTP (`nodemailer`), voir `docs/guides/GUIDE_GMAIL_SMTP.md`. Bascule Railway (variables `GMAIL_*`, révocation `BREVO_API_KEY`) reste une action manuelle non appliquée automatiquement. |

---

## 9. Décisions métier ouvertes

| ID | Décision | Options | Bloque | Responsable |
|---|---|---|---|---|
| DM-01 | Stratégie livraison | **DÉCIDÉ : MODE DISTANCE** | T3-01 | ~~Propriétaire~~ |
| DM-02 | Zones géographiques livrées | **DÉCIDÉ : Rayon 80km, région parisienne** | T3-01 | ~~Propriétaire~~ |
| DM-03 | Seuil franco de port | **DÉCIDÉ : 80€** (5€ base + 0,80€/km) | T3-02 | ~~Propriétaire~~ |
| DM-04 | Retrait sur place | Oui / Non | T3-04 (éventuelle) | Propriétaire |
| DM-05 | Taux TVA produits alimentaires | **DÉCIDÉ : 5,5% / 10% / 20% CGI** ⚠️ validation comptable requise | T5-01..T5-17 | Comptable |
| DM-06 | Mentions obligatoires facture | **DÉCIDÉ : SIRET/TVA dans ENTREPRISE_* env** ⚠️ à renseigner avant prod | T5-02 | ~~Propriétaire + comptable~~ |
| DM-07 | Politique de remboursement | **DÉCIDÉ : remboursement manuel uniquement** (espèces rendues / virement émis / chèque annulé), tracé via `montant_rembourse` + `audit_log`, plus de remboursement Stripe (T4-07) | T5-15 | ~~Propriétaire~~ |
| DM-08 | Durée conservation factures | 10 ans légal France (à confirmer) | T5-14 | Comptable |
| DM-09 | Provider stockage images | **DÉCIDÉ : Cloudflare R2** | T0-02 | ~~Propriétaire (coût)~~ |

---

## 10. État des environnements

| Environnement | État | Vérifiable | Non vérifiable |
|---|---|---|---|
| Local (Docker Compose) | CONFIGURÉ | docker-compose.yml complet, .env renseigné (R2 + JWT) | Fonctionnement réel (lancer start-local.bat) |
| Tests Jest backend | FONCTIONNEL | 112/112 tests passés (DB mockée) | — |
| Tests intégration testcontainers | FONCTIONNEL (2026-07-26) | 9/9 suites, 70/70 tests passés en local (Docker Desktop) — order.create, order.idempotency, order.status.routes, auth, auth.routes, stock.concurrent, product.routes, admin.clients.routes, shipping | Automatisation CI (pas encore en place) |
| Homeserver `tfredklab.dev` | DÉPLOYÉ (2026-07-26) | Stack Docker Compose up (4 conteneurs healthy), schéma DB initialisé (17 tables), Caddy proxy validé (`jana.tfredklab.dev` + `jana-api.tfredklab.dev` → 200/health OK), backup pg_dump + cron + restauration testée | Exposition publique réelle (Cloudflare Tunnel public hostnames non encore ajoutés — T11-04), emails (Gmail SMTP non configuré — T11-05), images (R2 token dédié non généré — T11-05) |
| Staging Railway | CANCELLED — remplacé par le homeserver (Phase 11) | — | — |
| Production Railway | EN PAUSE — gardé en parallèle jusqu'au cutover (T11-09) | — | Plan Railway expiré |
| Cloudflare R2 | CONFIGURÉ (bucket existant) | Bucket jana-products créé, endpoint EU | Nouveau token R2 dédié homeserver à générer (ne pas réutiliser celui de Railway) |

---

## 11. Fichiers clés

| Fichier | Responsabilité |
|---|---|
| `backend/src/index.js` | Point d'entrée Express, middlewares, ordre des routes |
| `backend/scripts/init.sql` | Schéma DB complet (NE PAS exécuter en production) |
| `backend/src/services/auth.service.js` | JWT, login, refresh, reset MDP |
| `backend/src/middlewares/auth.middleware.js` | `authenticate`, `isAdmin`, `isOwnerOrAdmin` (`hasPermission` supprimé — T1-02) |
| `backend/src/repositories/order.repository.js` | Transaction commande, stock, paiement/remboursement manuel |
| `backend/src/services/order.service.js` | Logique commande, validation stock, livraison |
| `backend/src/routes/admin.order.routes.js` | Statut paiement manuel + remboursement manuel (ESPECES/VIREMENT/CHEQUE) |
| `backend/src/services/settings.service.js` | Configuration, livraison FIXE/DISTANCE |
| `backend/src/services/geocoding.service.js` | BAN API, Haversine *(non commité)* |
| `backend/src/services/email.service.js` | Gmail SMTP (nodemailer) |
| `backend/tests/setup.js` | Mocks DB et Redis — à ne PAS copier pour les tests d'intégration |
| `frontend/src/pages/CheckoutPage.jsx` | Checkout multi-étapes (ESPECES/VIREMENT/CHEQUE uniquement) |
| `frontend/src/App.jsx` | Routing React, routes admin |
| `frontend/src/services/api.js` | Intercepteur Axios, refresh token auto |
| `backend/src/routes/promo.routes.js` | Codes promo : validation client + CRUD/toggle/delete admin |
| `frontend/src/pages/admin/AdminPromoList.jsx` | Admin codes promo : liste, stats, toggle, suppression protégée |
| `frontend/src/components/admin/PromoCodeModal.jsx` | Modal création/édition code promo (validation front) |
| `backend/scripts/migrations/0009_remove_stripe.sql` | Migration retrait Stripe (T4-07) |

---

## 12. Journal des changements

| Date | Tâche | Changement | Tests | Statut |
|---|---|---|---|---|
| 2026-06-14 | Audit initial | Création des 16 rapports d'audit dans `docs/audit-finalisation/` | — | DONE |
| 2026-06-14 | Plan opérationnel | Création de docs/workflow/CLAUDE_WORKFLOW.md, docs/workflow/ETAT_ACTUEL_PROJET.md, docs/workflow/PLAN_CORRECTION_AUDIT.md | — | DONE |
| 2026-06-14 | T0-01 | CheckoutPage.jsx + Recapitulatif.jsx : bandeau conditionnel selon modePaiement (isCarte) | npm run build ✓ | DONE |
| 2026-06-14 | T0-03 | auth.service.js : constructeur throws [FATAL] si JWT_SECRET ou JWT_REFRESH_SECRET manquant/identique | npm test ✓ (92/92) | DONE |
| 2026-06-14 | T0-04 | payment.service.js : INSERT stripe_event sans payload ; init.sql synchronisé ; migration 001 créée | npm test ✓ | DONE |
| 2026-06-14 | T0-05 | auth.service.js : _validatePasswordStrength() centralisé, appelé dans register/changePassword/resetPassword | npm test ✓ | DONE |
| 2026-06-14 | T0-06 | 8 fichiers corrigés (UTF-8 double-encodé) — y compris order.service.js:119 (€ runtime) | npm test ✓, npm run build ✓ | DONE |
| 2026-06-14 | T0-07 | index.js:117 : CORS /uploads → process.env.CORS_ORIGIN \|\| 'http://localhost:5173' | npm test ✓ | DONE |
| 2026-06-14 | Infra tests | tests/setup.js + jest.config.js : ajout JWT_REFRESH_SECRET ; tests/unit/auth.service.test.js : mdp conforme T0-05 | 4/4 suites, 92/92 ✓ | DONE |
| 2026-06-14 | T1-01 | order.repository.js : DELETE ligne_panier + UPDATE panier dans la transaction avant COMMIT ; order.service.js : cartId transmis, clearCart() supprimé du service | 5/5 suites, 97/97 ✓ | DONE |
| 2026-06-14 | T1-02 | auth.middleware.js : hasPermission() supprimé (jamais importé), permissions retiré de req.user ; product.routes.test.js : mock nettoyé | 5/5 suites, 97/97 ✓ | DONE |
| 2026-06-14 | T1-07 | App.jsx : route produits/:id supprimée, URL canonique produits/:id/modifier conservée ; ProductsTable.jsx + AdminDashboard.jsx : 2 liens mis à jour | — | DONE |
| 2026-06-14 | T1-08 | email.service.js inspecté : aucune corruption UTF-8 — déjà propre depuis T0-06 | — | DONE |
| 2026-06-14 | T1-03 | npm uninstall redis : package doublon supprimé, ioredis seul conservé (redis.js n'importait que ioredis) | 5/5 suites, 97/97 ✓ | DONE |
| 2026-06-14 | T1-04 | npm uninstall joi : jamais importé dans src, express-validator seul (5/5 validators) | 5/5 suites, 97/97 ✓ | DONE |
| 2026-06-14 | T1-05 | scripts/run-migrations.js : schema_migrations, sha256 checksum, pg_advisory_lock, strip BEGIN/COMMIT, npm run migrate | 5/5 suites, 97/97 ✓ | DONE |
| 2026-06-14 | T1-06 | Backend: 10→1 CVE (bcrypt@6 fixe tar HIGH; uuid MODERATE non-exploitable). Frontend: 11→2 CVE (uuid/exceljs + esbuild/vite devDep non-fixables sans breaking) | 5/5 suites, 97/97 ✓, build ✓ | DONE |
| 2026-06-27 | T2-01+T2-02 | order.repository.js : updateStatus() et cancel() loguent dans commande_statut_historique. admin.order.routes.js : GET /:id/history. Migration 0002. | 5/5 suites, 97/97 ✓ | DONE |
| 2026-06-27 | T2-03..T2-05 | Migration 0003 refresh_token. auth.service.js : login/register stockent le token, logout révoque, refreshTokens() effectue la rotation. user.repository.js : save/find/revokeRefreshToken. auth.controller.js mis à jour. | 5/5 suites, 97/97 ✓ | DONE |
| 2026-06-27 | T2-06+T2-07 | Migration 0004 audit_log. audit.repository.js créé. admin.order.routes.js logue chaque changement de statut commande dans audit_log. | 5/5 suites, 97/97 ✓ | DONE |
| 2026-06-27 | T4-01+T4-02+T4-04 | Migration 0005: REMBOURSE/PARTIELLEMENT_REMBOURSE dans ENUM, stripe_refund_id + montant_rembourse sur commande. payment.service.js: _onRefundCreated(). order.repository.js: updateRefund(). | 5/5 suites, 97/97 ✓ | DONE |
| 2026-06-27 | T4-03+T4-05 | admin.order.routes.js: POST /:id/refund (audit logué). payment.service.js: utilisateurId dans metadata Stripe. | 5/5 suites, 97/97 ✓ | DONE |
| 2026-06-27 | T6-01+T4-03UI+T6-03 | CommandeStatutTimeline.jsx, OrderDetailModal.jsx (timeline + modal remboursement), AdminOrdersList.jsx (export CSV), adminService.js (getOrderHistory + initiateRefund). Build frontend ✓. | 5/5 suites, 97/97 ✓ | DONE |
| 2026-06-27 | T6-02 | Constaté pré-existant (AdminDashboard.jsx recharts + admin.stats.routes.js + statsController). | — | DONE |
| 2026-06-27 | T0-02 | Cloudflare R2 : r2.js config, uploadToR2 middleware, product.controller + routes mis à jour. Fallback disque local si R2 non configuré. | 6/6 suites, 101/101 ✓ | DONE |
| 2026-06-27 | T3-01+T3-02+T3-04 | Migration 0006 : paramètres livraison DISTANCE en DB (5€+0.80/km, franco 80€, rayon 80km). Migration 0007 : numero_colis + date_expedition sur commande. | 6/6 suites, 101/101 ✓ | DONE |
| 2026-06-27 | T5-01..T5-10 | Migration 0008 : tables facture/facture_ligne/facture_seq + produit.taux_tva. invoice.repository.js, invoice.service.js (generateForOrder idempotent), invoice-pdf.generator.js (PDFKit). Routes /api/invoices (client + admin). payment.service déclenche la génération au webhook checkout. ⚠️ validation comptable TVA requise avant prod. | 6/6 suites, 101/101 ✓ | DONE |
| 2026-06-27 | T7-01..T7-06 | Tests d'intégration : shipping.test.js (4 tests Haversine unitaires, passent sans Docker). order.create, auth, stock.concurrent : scaffolding testcontainers (nécessite Docker, exclus du npm test par défaut). | 6/6 suites, 101/101 ✓ | DONE |
| 2026-06-28 | Docker | docker-compose.yml remplacé : Dockerfile.dev backend (nodemon) + frontend (Vite --host), DB_HOST=postgres overridé pour la logique dev. docs/deploiement/DEMARRAGE.md créé. start-local.bat/.sh supprimés. | — | DONE |
| 2026-06-28 | T7-02 | webhook.stripe.test.js : 7 tests (sécurité, idempotency rowCount, checkout.session.completed, refund.created via payment_intent, event inconnu). Mini-app Express isolée. | 7/7 suites, 108/108 ✓ | DONE |
| 2026-06-28 | T5-11 | MesFacturesPage.jsx créée, route /mes-factures (PrivateRoute), lien dans Navbar dropdown, getMesFactures + downloadFacturePDF dans api.js. | Build ✓ | DONE |
| 2026-06-28 | T5-12 | invoice.routes.js : GET /admin avec ?commande_id=. adminService : getFactureByCommande + downloadFacturePDF. OrderDetailModal : bouton "Facture PDF" dans le header. | Build ✓ | DONE |
| 2026-06-28 | T6-05 | PromotionsPage.jsx supprimé — confirmé orphelin (aucune référence dans App.jsx ni composants). | — | DONE |
| 2026-07-02 | T4-07 | **Décision client : retrait complet de Stripe** (pas de paiement en ligne au MVP, ESPECES/VIREMENT/CHEQUE uniquement). Supprimé : payment.service.js, payment.controller.js, payment.routes.js, webhook.routes.js, config/stripe.js, paymentService.js, PaymentSuccessPage.jsx, PaymentCancelPage.jsx, webhook.stripe.test.js. Migration 0009 : colonnes stripe_session_id/stripe_payment_intent_id/stripe_refund_id supprimées, table stripe_event supprimée, ENUM mode_paiement recréé sans CARTE (montant_rembourse et statuts REMBOURSE/PARTIELLEMENT_REMBOURSE conservés pour le suivi manuel). admin.order.routes.js : payment-status et refund passent en logique manuelle. npm uninstall stripe (backend) + @stripe/stripe-js (frontend). T4-01..T4-06, T7-02, T9-01, T9-05 passés CANCELLED. | 6/6 suites, 101/101 ✓, build frontend ✓ | DONE |
| 2026-07-02 | Promo (backend+checkout) | Système de codes promo livré par un autre agent : migration + promo.repository.js + promo.service.js + routes.js (`/api/promo/valider` client, `/api/promo/admin*` CRUD+toggle+delete avec garde 409 si déjà utilisé), champ code promo intégré au CheckoutPage. | 6/6 suites, 112/112 ✓ | DONE |
| 2026-07-02 | T-PROMO-ADMIN | Interface admin codes promo : adminService.js (getCodesPromo/getCodePromoById/createCodePromo/updateCodePromo/toggleCodePromo/deleteCodePromo), AdminPromoList.jsx (tableau + pagination + filtre actif/inactif + stats rapides + badge Actif/Inactif/Expiré + toggle + suppression protégée si nb_utilisations>0), PromoCodeModal.jsx (création/édition avec validation front alignée sur les règles backend ; le champ `code` est verrouillé en édition car absent de la whitelist PATCH). Route `/admin/promo` + lien sidebar "Codes promo" (AdminLayout.jsx). | build frontend ✓, 6/6 suites, 112/112 ✓ (non-régression backend) | DONE |
| 2026-07-04 | Backend (SIRET/TVA + init.sql + T5-08 + T5-13) | invoice.service.js : fallback SIRET `798787784` / TVA `FR92798787784` (au lieu de `null`). `backend/scripts/init.sql` intégralement régénéré depuis les migrations 0001-0010 (retrait des artefacts Stripe/CARTE, ajout commande_statut_historique, refresh_token, audit_log, facture/facture_ligne/facture_seq, code_promo/code_promo_utilisation, schema_migrations, colonnes commande/produit post-migrations). admin.order.routes.js : génération auto facture sur PATCH statut (VIREMENT/CHEQUE → CONFIRMEE, ESPECES → LIVREE). email.service.js : sendMail supporte les pièces jointes Brevo base64, nouvelle méthode sendInvoiceEmail. invoice.service.js : envoi fire-and-forget du PDF par email après generateForOrder(). | 7/7 suites, 112/112 ✓, build frontend ✓ | DONE |
| 2026-07-04 | Tests intégration réels (T7-01/T7-03/T7-06) | order.create.test.js (3 tests : décrément atomique stock, rollback stock insuffisant, rollback complet commande multi-lignes), auth.test.js (6 tests : bcrypt register/login, contrainte unique email, cycle de vie refresh_token), stock.concurrent.test.js (3 tests : achats concurrents sur dernier stock via SELECT...FOR UPDATE). Les 3 suites utilisent `@testcontainers/postgresql` + `backend/scripts/init.sql` comme schéma de référence. `test:integration` corrigé pour override le `testPathIgnorePatterns` de jest.config.js (qui excluait ces 3 fichiers de tout run, y compris le script dédié). | npm test (unitaire) 7/7 suites 112/112 ✓ inchangé ; npm run test:integration : collecte OK, exécution SKIP (Docker Desktop non démarré sur cette machine) | DONE |
| 2026-07-04 | Bannière cookies RGPD | `frontend/src/components/CookieBanner.jsx` créé — cookies strictement techniques (JWT/session) uniquement, exemptés de consentement CNIL, informative + fermable, persistance via localStorage (`jana_cookie_banner_dismissed`), lien vers `/confidentialite`. Intégré dans App.jsx (visible sur toutes les routes). | build frontend ✓ | DONE |
| 2026-07-04 | Guides Brevo + nom de domaine | `docs/guides/GUIDE_BREVO_CONFIGURATION.md` (compte, clé API, sender, SPF/DKIM/DMARC, variables Railway réelles, test curl, tableau des emails envoyés) et `docs/guides/GUIDE_NOM_DOMAINE.md` (achat OVH, types DNS, Custom Domain Railway front+back, propagation, HTTPS Let's Encrypt auto, variables CORS_ORIGIN/FRONTEND_URL/VITE_API_URL, checklist finale avec /api/health) — guides destinés au propriétaire non-développeur. | — | DONE |
| 2026-07-08 | Audit documentation vs code réel | Corrections : `CLAUDE.md` (état ~98%/Phase 8, retrait Stripe de la stack, ajout `prompt-architect.md` au tableau agents, plan "ce soir" marqué historique), `README.md` (retrait Joi résiduel), `docs/workflow/CLAUDE_WORKFLOW.md` (refresh tokens révocables, Stripe retiré de la stack et de la règle §8), `docs/produit/CHANGEMENTS_MVP.md` + `docs/checklists/RESTE_A_FAIRE_PROD.md` (statut init.sql resynchronisé, T5-08/T5-13 DONE), `docs/produit/RGPD_ACCESSIBILITE.md` (CookieBanner résolu), bandeau d'obsolescence ajouté sur `docs/audit-finalisation/*` (16 fichiers) + `docs/deploiement/DEPLOY-RAILWAY.md`, `docs/deploiement/DEMARRAGE.md`, `docs/checklists/CHECKLIST_TEST_LOCAL.md`, `docs/deploiement/RAILWAY_CONFIG_READY.md`. | — | DONE |
| 2026-07-08 | Migration email Brevo → Gmail SMTP | `email.service.js` : transport `nodemailer` (Gmail SMTP) remplace l'appel REST Brevo ; `sendMail()` et toutes les méthodes publiques (`sendWelcomeEmail`, `sendOrderStatusEmail`, `sendInvoiceEmail`, `sendPasswordResetEmail`, `sendPasswordChangedEmail`) inchangées pour les appelants. `backend/package.json` : ajout `nodemailer` ^9.0.3. `backend/.env.example` : section Brevo remplacée par `GMAIL_SENDER_EMAIL`/`GMAIL_APP_PASSWORD`/`GMAIL_SENDER_NAME` (valeurs vides). `docs/guides/GUIDE_GMAIL_SMTP.md` créé (remplace `docs/guides/GUIDE_BREVO_CONFIGURATION.md`, conservé en pointeur historique). `docs/workflow/CLAUDE_WORKFLOW.md` §1 mis à jour. Bascule Railway réelle (ajout variables `GMAIL_*`, révocation `BREVO_API_KEY`) non appliquée — action manuelle, hors scope automatique. | 7/7 suites, 112/112 ✓ (aucune régression) | DONE |
| 2026-07-26 | Phase 11 — Migration Railway → Homeserver (T11-01..T11-08, T11-10) | Infrastructure Docker Compose créée sur `/opt/docker/jana/` (homeserver `tfredklab.dev`, hors dépôt git) : postgres/redis sans port publié, backend/frontend publiés sur 4001/4000. `backend/src/config/database.js` : ajout `DB_SSL_DISABLE=true` (SSL forcé incompatible avec Postgres auto-hébergé sans TLS). Schéma initialisé via `init.sql` (17 tables). Caddyfile homeserver : blocs `@jana`/`@jana_api` ajoutés sans régression sur les autres services. Backup `pg_dump` + cron + restauration testée. `.github/workflows/deploy.yml` simplifié (1 job, push `develop`, Tailscale + clé SSH à forced-command). `backend/railway.json` + `frontend/railway.json` supprimés ; `docs/deploiement/DEPLOY-HOMESERVER.md` créé ; `docs/deploiement/DEPLOY-RAILWAY.md` + `docs/deploiement/RAILWAY_CONFIG_READY.md` marqués obsolètes. Reste bloqué sur 4 actions externes utilisateur (Cloudflare Tunnel, Gmail/R2/adresse entreprise, Uptime Kuma, secrets GitHub) avant cutover (T11-09). | 112/112 backend ✓ (après fix SSL), healthcheck prod `{"database":"up"}`, endpoints Caddy validés (200/health OK, pas de régression) | DONE (T11-01/02/03/06/08/10) — IN_PROGRESS (T11-05) — BLOCKED (T11-04, T11-07, actions externes) |
| 2026-07-26 | Phase 12 — T12-01..T12-04 (tests) | T12-01 : Docker Desktop démarré par l'utilisateur, `docker info` OK. T12-02 : régression détectée et corrigée — `nodemailer` déclaré dans `package.json` mais absent de `node_modules` (2 suites en échec de chargement) ; `npm install` a résolu le problème sans toucher `package-lock.json`. T12-03 : les 3 suites testcontainers exécutées pour la première fois avec succès sur cette machine ; un bug de test (pas de production) trouvé et corrigé dans `order.create.test.js` (`uniqueNumeroCommande()` dépassait `VARCHAR(20)`). | npm test : 112/112 ✓ ; npm run test:integration : 6/6 suites, 54/54 ✓ | DONE |
| 2026-07-26 | Phase 12 — T12-05..T12-10 (durcissement + audit sécurité) | **Commande/stock (T12-05/06)** : idempotence création commande via verrou `FOR UPDATE` sur `panier` ; contrainte `CHECK stock_quantite >= 0` ajoutée (migration 0011, pas encore appliquée en prod). **Facturation (T12-07)** : bug critique corrigé — génération facture produisait NaN sur tous les montants (mauvaise colonne lue) + fuite de taux TVA (le taux courant du produit écrasait silencieusement le taux figé à la commande, risque légal) ; arrondi unifié avec panier/commande. **Auth (T12-08)** : timing attack sur `login()` corrigé (énumération d'emails possible). **Admin (T12-09)** : trous `audit_log` comblés sur création/modification/suppression produit et actions clients sensibles. **Audit sécurité (T12-10)** : `npm audit fix` appliqué (non-breaking) ; **🔴 P0 trouvé — secret réel dans l'historique git (`backend/.env`, commit `79fccb1`) sur dépôt GitHub public, jamais purgé** — voir `docs/workflow/PLAN_CORRECTION_AUDIT.md` DB-04, action propriétaire requise avant tout commit/push. SEC-07 (vidange panier hors transaction) ré-audité et confirmé résolu. | npm test : 139/139 ✓ ; npm run test:integration : 9/9 suites, 70/70 ✓ | DONE (BLOCKED sur DB-04 pour la suite) |
| 2026-07-26 | Phase 12 — T12-11..T12-13 (documentation) | `docs/checklists/CHECKLIST_TEST_LOCAL.md` réécrit (Stripe retiré, parcours paiement manuel réaliste, section tests d'intégration ajoutée). `docs/audit-finalisation/14_CHECKLIST_GO_LIVE.md` et `docs/checklists/RESTE_A_FAIRE_PROD.md` marqués figés/obsolètes, pointant uniquement vers `docs/workflow/ETAT_ACTUEL_PROJET.md` comme source de vérité go-live. `docs/workflow/PLAN_CORRECTION_AUDIT.md` : Phase 12 ajoutée (13 tâches), tableau de bord et décisions bloquantes (DB-04) mis à jour. | — | DONE |
| 2026-09-04 | Phase 13 — Audit fonctionnel et sécurité complémentaire | Audit read-only en 4 volets parallèles, chacun recoupé contre ce fichier et `PLAN_CORRECTION_AUDIT.md` avant de signaler un point comme nouveau. **DB-04 confirmé et précisé** : le commit `79fccb1` désactive volontairement le `.gitignore` avant de committer `backend/.env` réel ; confirmé ancêtre de `origin/develop` (donc poussé) ; confirmé que `SMTP_USER`/`SMTP_PASS` sont une vraie adresse Gmail + un vrai mot de passe d'application (pas un placeholder) — rotation à traiter en priorité absolue. Recherche exhaustive de l'historique complet (214 commits) : aucun autre secret trouvé. **7 P1 trouvés** (code, non décision propriétaire), **les 7 corrigés et vérifiés le jour même** : path traversal sur suppression d'image produit (T13-01, validator + `path.basename` en défense en profondeur), filtre d'upload contournable/XSS stocké (T13-02, extension dérivée du mimetype validé + vérification magic-bytes), régression npm audit backend (T13-03, override `qs@^6.16.0` — `express@4.22.2` pin en interne une version antérieure au correctif), changement de mot de passe ne révoquant aucune session (T13-05, `revokeAllUserRefreshTokens` désormais appelée), franco de port contournant le contrôle de zone de livraison à 80km (T13-06), message d'erreur checkout générique anglais (T13-07), remboursements partiels non cumulatifs (T13-04, décision produit utilisateur confirmée le jour même : cumul + plafond strict, verrou `SELECT ... FOR UPDATE` anti-race-condition, `montantRembourse` désormais exposé par l'API alors qu'il était absent de toutes les réponses). **14 P2 et 3 P3** supplémentaires non traités (validation settings incohérente, notifications manquantes, race conditions, UX trompeuse, headers de sécurité absents, Node.js 20 EOL, etc.) — détail complet dans `PLAN_CORRECTION_AUDIT.md` Phase 13 (T13-01..T13-24) et l'artefact "Audit Sécurité Jana" publié le même jour. Aucune régression trouvée sur les points DONE de Phase 12. | Backend : `npm test` 139/139 ✓ (à chaque étape). Frontend : `npm run build` ✓. Correctifs sécurité et métier vérifiés en conditions réelles (curl) : path traversal → 400, upload falsifié → 400 + fichier non persisté, upload légitime → accepté, séquence de remboursements cumulatifs (20€+20€=40€ cumulé, tentative de dépassement → 400, solde exact → statut REMBOURSE). | DONE (audit + 7/24 tâches Phase 13, toutes les P1 code) |
| 2026-09-04 | Phase 14 — Mise en production sur Fly.io | Décision utilisateur : abandon du homeserver auto-géré (Phase 11) pour un hébergeur managé, budget quasi-nul, sans dépendance à GitHub (déploiement par image Docker locale via `flyctl deploy`, dépôt supprimable après coup). Org Fly `personal`, région `cdg`. **Provisionné :** `jana-db` (Postgres flex, 1 nœud, réseau privé uniquement), `jana-redis` (Upstash pay-as-you-go), `jana-backend` (512MB, 1 machine, health check `/api/health`), `jana-frontend` (256MB, 1 machine, Nginx statique) ; `jana-db` attaché à `jana-backend` (`DATABASE_URL` auto-injecté). Secrets JWT régénérés from scratch (jamais réutilisé l'historique compromis). **Bug réel trouvé et corrigé** : `frontend/nginx.conf` proxyait `/api/` et `/uploads/` vers `http://backend:3000` — un hostname Docker Compose local inexistant sur Fly, causant un crash nginx au démarrage (`exit_code=1`) ; confirmé code mort (le frontend appelle déjà l'URL absolue du backend via `VITE_API_URL`), blocs supprimés. **Stockage images** : décision utilisateur d'utiliser un volume Fly persistant (1GB, chiffré, snapshots auto) plutôt que Cloudflare R2 (token existant cassé) — aucune modification de code nécessaire, `uploadToR2` bascule déjà en disque local quand R2 n'est pas configuré. **Compte admin réel créé** (pas `scripts/seed.js`, qui crée des comptes de démo à mot de passe public dans ce dépôt) : 6 catégories réelles + un admin unique à mot de passe fort généré, transmis à l'utilisateur hors de ce document. **Email transactionnel (T14-04) activé** : nouveau mot de passe d'application Gmail généré par l'utilisateur (l'ancien étant celui exposé dans DB-04), posé en secret Fly, backend redéployé. | Vérification end-to-end en production : `GET /api/health` → 200 (DB up), frontend → 200 (catégories chargées, 0 erreur console), connexion admin réelle → 200, upload image → 200 → servie → 200 → suppression → 200 (re-vérifie T13-01 en prod), `POST /api/auth/forgot-password` → email réellement envoyé et accepté par Gmail (messageId confirmé dans les logs applicatifs). | DONE (7/7) |

---

## 13. Prochaine action recommandée

**Session Phase 14 (2026-09-04) : le site est en ligne et pleinement fonctionnel en production sur Fly.io — `https://jana-frontend.fly.dev` / `https://jana-backend.fly.dev`. Décision utilisateur d'abandonner le homeserver (Phase 11, supersédée) pour cet hébergeur managé. Vérifié end-to-end (santé API, chargement catalogue, connexion admin réelle, upload/suppression d'image sur volume persistant, envoi réel d'email transactionnel). Les 7 tâches de Phase 14 sont DONE. Voir `docs/workflow/PLAN_CORRECTION_AUDIT.md` Phase 14 (T14-01..T14-07) pour le détail complet.**

**🔴 ACTION IMMÉDIATE REQUISE avant tout nouveau commit/push (P0, DB-04, inchangé) :** le secret exposé dans l'historique git (commit `79fccb1`, dépôt `Neruaka/JanaDistribution` toujours **public**) inclut une **vraie adresse Gmail personnelle et un vrai mot de passe d'application Gmail actif** (`SMTP_USER`/`SMTP_PASS`). Propriétaire à prévenir en priorité : (1) révoquer ce mot de passe d'application Gmail immédiatement, confirmer/forcer la rotation de `DB_PASSWORD` et `JWT_SECRET`/`JWT_REFRESH_SECRET` partout où ils sont encore utilisés (les secrets Fly.io de production sont déjà régénérés from scratch, voir T14-03 — ceci concerne les éventuels usages restants ailleurs), (2) décider si l'historique git doit être purgé (`git filter-repo`/BFG + force-push — action destructive, décision et exécution réservées au propriétaire). Détail complet : `docs/workflow/PLAN_CORRECTION_AUDIT.md` §3 DB-04.

| Champ | Valeur |
|---|---|
| Option A | DB-04 (P0) — révocation Gmail legacy + rotation secrets restants + décision purge historique git — voir ci-dessus |
| Option B | Peupler le catalogue réel (le seed de démo n'a pas été utilisé en prod — seules les 6 catégories existent) via le back-office `https://jana-frontend.fly.dev/admin` |
| Option C | P2/P3 restants de Phase 13 (T13-08..T13-24) — dette technique et durcissement, non bloquants pour la prod |
| Prérequis option A | Accès au compte Google + décision propriétaire sur la purge d'historique |
| Prérequis option B | Aucun — connexion admin déjà fonctionnelle |
| Prérequis option C | Aucun |

**Actions restantes avant une prod pleinement finalisée :**
1. **DB-04 (P0)** — révocation Gmail legacy + rotation secrets + décision purge historique git (voir ci-dessus, priorité absolue)
2. Peupler le catalogue réel via le back-office (aucun produit de démonstration en production, par choix)
3. ⚠️ Faire valider les taux TVA par un comptable pour chaque référence produit (DB-03, toujours ouverte)
4. P2/P3 restants de l'audit Phase 13 (T13-08..T13-24) — non bloquants
5. Optionnel : nom de domaine personnalisé à la place de `*.fly.dev` (non demandé à ce stade)
6. Phase 11 (homeserver) et ses actions externes (Cloudflare Tunnel, Uptime Kuma, secrets GitHub Actions) ne sont plus poursuivies — supersédées par la Phase 14

**Dette technique découverte (2026-07-26) :** `backend/scripts/run-migrations.js` et la migration `0001` ne sont pas committés dans le dépôt git (fichiers locaux uniquement) — `npm run migrate` est inutilisable sur un environnement propre. `backend/scripts/init.sql` (resynchronisé le 2026-07-04 avec les migrations 0001-0010, puis avec 0011 le 2026-07-26) reste la seule source de schéma fiable pour un premier déploiement ; c'est ce qui a été utilisé pour initialiser la base sur le homeserver. À corriger : committer les fichiers manquants.
