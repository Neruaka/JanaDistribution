# ÉTAT ACTUEL DU PROJET — Jana Distribution

> Mise à jour : 2026-06-14. Source : inspection statique du code + git status.
> Mettre à jour après chaque tâche DONE.

---

## 1. Métadonnées

| Champ | Valeur |
|---|---|
| Projet | Jana Distribution — e-commerce alimentaire B2C/B2B |
| Branche active | `develop` |
| Dernier commit | `2a9201d` — `feat(frontend): order status timeline + admin refund UI + CSV export` |
| Fichiers modifiés non commités | 0 — working tree propre |
| Phase active | Phase 7 — Tests automatisés |
| Tâche active | Aucune — Phases 4 et 6 terminées (2026-06-27) |
| Verdict | **NON PRÊT POUR LA PRODUCTION** |
| Avancement estimé | ~80 % |

---

## 2. Verdict

**NON PRÊT POUR LA PRODUCTION.**

Phase 0 terminée (6/7 tâches DONE, T0-02 BLOCKED décision provider). Deux bloquants P0 restants : absence totale de facturation (illégal en France) et stockage des images éphémères Railway (T0-02 BLOCKED). Sept problèmes P1 restants avant lancement commercial. Aucune correction n'est encore commitée (travail sur branche `develop`).

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
| Email | Brevo REST API (`BREVO_API_KEY`) | — |
| Paiements | Stripe Checkout Sessions | stripe 22.0.2 |
| Géocodage livraison | BAN API adresse.data.gouv.fr | gratuit |
| Upload fichiers | Multer → disque local `/uploads/products/` | 1.4.5-lts.1 |
| Déploiement | Railway (NIXPACKS backend, Dockerfile frontend) | — |
| CI/CD | GitHub Actions | — |
| Validation | express-validator | — |
| Logs | Winston | 3.11.0 |
| Tests backend | Jest (DB mockée) | — |
| Tests frontend | Vitest | 4.0.16 |

---

## 4. Architecture actuelle

```
Navigateur
  → Frontend React/Vite → Nginx (Railway)
      ↓ HTTPS
  → Backend Express (Railway)
      ├── PostgreSQL 15 (Railway)
      ├── Redis 7 / ioredis (Railway)
      ├── Stripe API (externe)
      ├── Brevo REST API (externe — email)
      └── BAN API adresse.data.gouv.fr (externe — géocodage)
```

**Points d'entrée principaux :**

| Responsabilité | Fichier |
|---|---|
| Backend principal | `backend/src/index.js` |
| Schéma DB | `backend/scripts/init.sql` |
| Auth (JWT, login, refresh) | `backend/src/services/auth.service.js` |
| Commandes (transaction atomique) | `backend/src/repositories/order.repository.js` |
| Stripe (checkout + webhook) | `backend/src/services/payment.service.js` *(non commité)* |
| Livraison (FIXE/DISTANCE) | `backend/src/services/settings.service.js` |
| Géocodage BAN | `backend/src/services/geocoding.service.js` *(non commité)* |
| Checkout frontend | `frontend/src/pages/CheckoutPage.jsx` |
| Middleware auth + admin | `backend/src/middlewares/auth.middleware.js` |

---

## 5. Fonctionnalités — état réel

| Domaine | État | Éléments fonctionnels | Vérification |
|---|---|---|---|
| Catalogue (produits, catégories, filtres, pagination) | FONCTIONNEL | CRUD complet, recherche, tri | Code inspecté |
| Panier (CRUD, persistance DB) | FONCTIONNEL | Ajout, modif, suppression, persistance | Code inspecté |
| Commande (transaction atomique, stock) | FONCTIONNEL | BEGIN/COMMIT, décrémentation stock idempotente | Code inspecté |
| Paiement Stripe (Checkout Session, webhook) | FONCTIONNEL | Session créée, webhook signé, idempotency OK, refund.created géré, remboursements partiels et totaux. | Code inspecté + committé |
| Livraison (FIXE + DISTANCE Haversine) | FONCTIONNEL | Calcul serveur, franco de port, BAN API intégrée | Code inspecté |
| Authentification (login, register, refresh) | FONCTIONNEL | JWT, bcrypt 12 rounds, reset MDP haché | Code inspecté |
| Emails transactionnels (Brevo) | FONCTIONNEL | Bienvenue, statut commande, reset MDP | Code inspecté |
| Administration (produits, catégories, commandes, clients, paramètres) | FONCTIONNEL | Interface complète | Code inspecté |
| Facturation | ABSENT | Aucune table, aucun service, aucun PDF | Code inspecté |
| Tests | PARTIEL | Jest backend (DB mockée), 1 test Vitest frontend | Code inspecté |
| Railway (déploiement) | PARTIEL | Health check OK, images éphémères, pas de staging | Non vérifiable Railway |
| Stockage images | CASSÉ | Disque local éphémère — images perdues au redéploiement | Code inspecté |
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
| P0-B | P0 | Images produits sur disque éphémère Railway — perdues à chaque redéploiement | `upload.middleware.js` + `index.js:42` | T0-02 | BLOCKED (DB-01) |
| P0-C | P0 | Facturation entièrement absente — obligation légale France | Aucune table facture dans `init.sql` | T5-01..T5-17 | TODO |
| P0-D | P0 | `Access-Control-Allow-Origin: *` sur `/uploads` — exposition non restreinte | `backend/src/index.js:117` | T0-07 | ~~RÉSOLU~~ |

### P1 — Critiques avant lancement (7 restants sur 10)

| ID | Priorité | Problème | Preuve dans le code | Tâche | État |
|---|---|---|---|---|---|
| P1-01 | P1 | `JWT_REFRESH_SECRET` fallback silencieux sur `JWT_SECRET` | `auth.service.js:24` | T0-03 | ~~RÉSOLU~~ |
| P1-02 | P1 | Refresh tokens non révocables (pas de table en DB) | Absent de `init.sql` | T2-03..T2-05 | TODO |
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

**19 fichiers modifiés non stagés + 12 nouveaux fichiers non trackés.**

Ces changements ne sont PAS encore commités. Ils incluent une implémentation partielle de Stripe et du géocodage.

### Nouveaux fichiers non trackés (travail en cours)

| Fichier | Contenu |
|---|---|
| `backend/src/services/payment.service.js` | Stripe Checkout Session + webhook handler |
| `backend/src/controllers/payment.controller.js` | Endpoints paiement |
| `backend/src/routes/payment.routes.js` | Route `/api/payment/checkout-session` |
| `backend/src/routes/webhook.routes.js` | Route `/api/webhooks/stripe` (raw body) |
| `backend/src/services/geocoding.service.js` | BAN API + Haversine |
| `frontend/src/pages/PaymentSuccessPage.jsx` | Page retour paiement (polling) |
| `frontend/src/pages/PaymentCancelPage.jsx` | Page annulation paiement |
| `frontend/src/services/paymentService.js` | Service API paiement frontend |
| `frontend/src/services/shippingService.js` | Service estimation livraison frontend |
| `DEPLOY-RAILWAY.md` | Notes de déploiement |
| `docs/audit-finalisation/` | Rapports d'audit (ce dossier) |

### État du working tree

Working tree propre. Tout est committé dans `085fc5f`. Les corrections Phase 0 (T0-01..T0-07) et les fichiers Stripe/géocodage/paiement sont inclus dans ce commit.

---

## 8. Décisions techniques

| Décision | Statut | Détail |
|---|---|---|
| Stripe Checkout Sessions | DÉCIDÉ | Conserver — ne pas remplacer |
| Bibliothèque PDF factures | RECOMMANDÉ MAIS NON VALIDÉ | PDFKit (pure JS, légère) |
| Storage images | À DÉCIDER | S3 / Cloudflare R2 / Railway Volume — bloque T0-02 |
| Client Redis | RECOMMANDÉ MAIS NON VALIDÉ | Garder ioredis, supprimer package `redis` |
| Système de validation | À DÉCIDER | Choisir express-validator OU Joi — bloque T1-04 |
| Tests intégration | DÉCIDÉ | Vraie PostgreSQL (testcontainers-node) — ne pas mocker |
| Architecture | DÉCIDÉ | Évolution progressive — pas de réécriture |
| Refresh tokens | DÉCIDÉ | Stocker en DB (table `refresh_token` à créer) |

---

## 9. Décisions métier ouvertes

| ID | Décision | Options | Bloque | Responsable |
|---|---|---|---|---|
| DM-01 | Stratégie livraison | FIXE ou DISTANCE (les deux existent) | T3-01 | Propriétaire |
| DM-02 | Zones géographiques livrées | France entière ? Rayon ? Région ? | T3-01 | Propriétaire |
| DM-03 | Seuil franco de port | 50€ (valeur actuelle init.sql) — à confirmer | T3-02 | Propriétaire |
| DM-04 | Retrait sur place | Oui / Non | T3-04 (éventuelle) | Propriétaire |
| DM-05 | Taux TVA produits alimentaires | 5,5% / 10% / 20% selon catégorie | T5-01..T5-17 | Comptable |
| DM-06 | Mentions obligatoires facture | SIRET, N° TVA, adresse entreprise | T5-02 | Propriétaire + comptable |
| DM-07 | Politique de remboursement | Délais, conditions, partiel vs total | T4-02, T5-15 | Propriétaire |
| DM-08 | Durée conservation factures | 10 ans légal France (à confirmer) | T5-14 | Comptable |
| DM-09 | Provider stockage images | S3 / Cloudflare R2 / Railway Volume | T0-02 | Propriétaire (coût) |

---

## 10. État des environnements

| Environnement | État | Vérifiable | Non vérifiable |
|---|---|---|---|
| Local (Docker Compose) | À vérifier | docker-compose.yml présent | Fonctionnement réel |
| Tests | PARTIEL | setup.js présent, DB mockée | Tests d'intégration absents |
| Staging Railway | ABSENT | — | Accès Railway requis |
| Production Railway | NON PRÊT | Health check configuré | Variables env, sauvegardes |
| Stripe test mode | PARTIEL | Clés test dans .env.example | Webhook configuré ? |
| Stripe live mode | NON PRÊT | — | Clés live à configurer |

---

## 11. Fichiers clés

| Fichier | Responsabilité |
|---|---|
| `backend/src/index.js` | Point d'entrée Express, middlewares, ordre des routes |
| `backend/scripts/init.sql` | Schéma DB complet (NE PAS exécuter en production) |
| `backend/src/services/auth.service.js` | JWT, login, refresh, reset MDP |
| `backend/src/middlewares/auth.middleware.js` | `authenticate`, `isAdmin`, `isOwnerOrAdmin` (`hasPermission` supprimé — T1-02) |
| `backend/src/repositories/order.repository.js` | Transaction commande, stock, Stripe columns |
| `backend/src/services/order.service.js` | Logique commande, validation stock, livraison |
| `backend/src/services/payment.service.js` | Stripe Checkout + webhook *(non commité)* |
| `backend/src/services/settings.service.js` | Configuration, livraison FIXE/DISTANCE |
| `backend/src/services/geocoding.service.js` | BAN API, Haversine *(non commité)* |
| `backend/src/services/email.service.js` | Brevo REST API |
| `backend/tests/setup.js` | Mocks DB et Redis — à ne PAS copier pour les tests d'intégration |
| `frontend/src/pages/CheckoutPage.jsx` | Checkout multi-étapes, P0 bug ligne 347-362 |
| `frontend/src/pages/PaymentSuccessPage.jsx` | Polling statut paiement *(non commité)* |
| `frontend/src/App.jsx` | Routing React, routes admin |
| `frontend/src/services/api.js` | Intercepteur Axios, refresh token auto |
| `backend/src/routes/webhook.routes.js` | Webhook Stripe raw body *(non commité)* |
| `backend/src/config/stripe.js` | Config Stripe *(non commité)* |

---

## 12. Journal des changements

| Date | Tâche | Changement | Tests | Statut |
|---|---|---|---|---|
| 2026-06-14 | Audit initial | Création des 16 rapports d'audit dans `docs/audit-finalisation/` | — | DONE |
| 2026-06-14 | Plan opérationnel | Création de CLAUDE_WORKFLOW.md, ETAT_ACTUEL_PROJET.md, PLAN_CORRECTION_AUDIT.md | — | DONE |
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

---

## 13. Prochaine action recommandée

**Phases 4 et 6 terminées (2026-06-27). Prochaine : Phase 7 — Tests automatisés (T7-01..T7-07)**

| Champ | Valeur |
|---|---|
| Identifiant | T7-01 |
| Objectif | Tests d'intégration création commande (vraie DB PostgreSQL — testcontainers-node) |
| Fichiers | `backend/tests/integration/order.create.test.js` (à créer), `docker-compose.test.yml` éventuel |
| Prérequis | T1-05 (migrations DONE) |
| Critère de sortie | Transaction atomique testée sur vraie DB, stock décrémenté vérifié |
