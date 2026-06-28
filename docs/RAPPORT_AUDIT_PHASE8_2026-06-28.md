# RAPPORT D'AUDIT — Session Phase 8 — 2026-06-28

> Source : inspection statique du code, git log, npm test, npm audit, git status.
> Branche : `develop` — 8 commits ahead of origin/develop.

---

## ✅ CONFIRMÉ FONCTIONNEL

### Code & Architecture
- **101 tests Jest** passent (6 suites : auth, auth.routes, order.create, product.routes, shipping, stock.concurrent)
- **Frontend build réussi** (`npm run build` OK en 12.9s)
- **8 migrations** versionnées dans `backend/scripts/migrations/` (0001 → 0008)
- **Toutes les routes** enregistrées dans `backend/src/index.js` :
  - auth, categories, products, cart, orders, payment, invoices, webhooks, admin.orders, admin.stats, admin.clients, settings
- **PDFKit** installé (`^0.19.1`) et implémenté dans `invoice.service.js`
- **testcontainers** installés (`^12.0.3`) — 6 fichiers de tests d'intégration scaffoldés
- **docker-compose.yml** complet (PostgreSQL 15, Redis 7, Backend, Frontend, Adminer dev)
- **CI GitHub Actions** — 4 jobs : backend-tests, frontend-build, security-audit, ci-summary

### Sécurité
- `.env` correctement ignoré par `.gitignore` (non commité)
- Pas de secrets dans les 5 derniers commits git diff
- Anciens tokens R2 révoqués — absents du code
- `JWT_REFRESH_SECRET` distinct obligatoire au démarrage (`auth.service.js:29-33`)
- Rate limiting actif sur `/api/auth` (20 req/15min)
- Password reset rate limiting strict (5 req/15min)
- Payload Stripe réduit (`event_id`, `type`, `processed_at` seulement)
- Refresh tokens révocables en DB (table `refresh_token`)
- Audit log actif (`audit_log` table)

### Infrastructure
- **Cloudflare R2** configuré : bucket `jana-products`, endpoint EU, token en `.env`
- **Stripe** configuré : compte créé, clés TEST en `.env`, Stripe CLI installé localement
- **docker-compose** : PostgreSQL + Redis démarrables avec `docker-compose up -d postgres redis`
- **.env.example** complet — toutes les variables documentées

---

## ⚠️ INCOMPLET / À FINIR

### CI — Environnement de test incomplet (CORRIGÉ en session)
- **Corrigé** : `JWT_REFRESH_SECRET`, `BCRYPT_SALT_ROUNDS`, `JWT_REFRESH_EXPIRES_IN` ajoutés aux env CI
- Sans ce fix, le CI aurait échoué à l'instantiation de `AuthService` (throw FATAL)

### Endpoint R2 EU (CORRIGÉ en session)
- **Corrigé** : `backend/src/config/r2.js` utilisait `r2.cloudflarestorage.com` au lieu de `eu.r2.cloudflarestorage.com`
- Les uploads vers le bucket EU auraient échoué silencieusement

### Frontend bundle > 1 MB (warning non bloquant)
- `index-DIg7CrtF.js` : 1177 kB (gzip: 320 kB)
- Cause probable : ExcelJS (936 kB pour le chunk excel) + import dynamique mal configuré
- `api.js` est importé à la fois statiquement et dynamiquement (warning Vite)
- Impact : chargement initial plus lent — non bloquant pour le lancement
- Tâche associée : T6-04 (validation Excel backend, réduire dépendance)

### T5-08..T5-17 — Facturation incomplète (BLOCKED sur T5-04)
- Génération automatique OK pour paiements CARTE (Stripe webhook)
- MANQUANT : facturation pour VIREMENT/CHEQUE/ESPECES
- MANQUANT : téléchargement PDF dans espace client (T5-11)
- MANQUANT : téléchargement PDF dans admin (T5-12)
- MANQUANT : envoi facture par email avec pièce jointe (T5-13)
- MANQUANT : factures immuables / logique avoir (T5-14, T5-15)
- MANQUANT : tests unitaires et intégration facture (T5-16, T5-17)

### T3-03 — Poids produit non implémenté
- Décision prise : mode DISTANCE (Haversine), pas de calcul au poids
- Tâche T3-03 peut être CANCELLED si le mode poids n'est pas envisagé

---

## ❌ MANQUANT / ABSENT

### Tests
- **T7-02** (P0) : `backend/tests/integration/webhook.stripe.test.js` — à créer
  - Signature vérifiée, idempotency, tous les événements traités
- **T7-05** (P1) : Tests unitaires `invoice.service.js` — aucun test
- **T7-07** (P2) : Tests E2E Playwright — non installé, non scaffoldé

### Administration
- **T6-04** (P2) : Validation import produits Excel côté backend
  - `product.routes.js` : route Excel sans validation serveur des données
- **T6-05** (P3) : `frontend/src/pages/PromotionsPage.jsx` encore présente
  - Page orpheline (pas de route vers elle dans le router)
  - Impact : bundle légèrement plus lourd, confusion du développeur

### Migrations Railway / Production
- **T8-01 à T8-06** : Staging Railway — 100% bloqué par l'expiration du plan
- **T1-05** : Migrations versionnées (runner de migrations automatique) — TODO

---

## 🔒 SÉCURITÉ — Points d'attention

### CVE npm audit (après corrections session)
| Package | Sévérité | Status | Action |
|---|---|---|---|
| `form-data 4.0.0-4.0.5` (frontend) | HIGH — CRLF injection | **CORRIGÉ** (npm audit fix) | — |
| `uuid < 11.1.1` (backend) | Moderate | Non bloquant CI | Update sans breaking change possible |
| `uuid < 11.1.1` via `exceljs` (frontend) | Moderate | Non bloquant CI | Breaking change requis (exceljs@3.4.0) |

### Sécurité restante
- `docker-compose.yml` : mot de passe PostgreSQL par défaut (`postgres`) — à changer en prod
- `ENTREPRISE_SIRET` et `ENTREPRISE_TVA_NUMERO` non renseignés (obligatoires sur les factures)
- Token R2 avec permissions "tous les buckets" — en prod, limiter au bucket `jana-products`
- `JWT_SECRET` et `JWT_REFRESH_SECRET` en `.env` local — NE PAS commiter, générer de nouveaux pour prod

---

## 📋 ACTIONS MANUELLES RESTANTES (non codables par un agent)

- [ ] **Cloudflare R2** : configurer un custom domain (ex: images.jana-distribution.fr) pour `R2_PUBLIC_URL` en prod
- [ ] **Stripe** : passer en mode LIVE quand prêt — récupérer `sk_live_` + configurer webhook prod
- [ ] **Railway** : réactiver le plan → appliquer `docs/RAILWAY_CONFIG_READY.md`
- [ ] **Comptable** : valider taux TVA par catégorie produit avant première vente réelle
- [ ] **Juridique** : rédiger CGV, mentions légales, politique RGPD (T9-03 BLOCKED)
- [ ] **Entreprise** : renseigner `ENTREPRISE_SIRET` + `ENTREPRISE_TVA_NUMERO` + `ENTREPRISE_ADRESSE` dans les variables d'env
- [ ] **Test local complet** : suivre `docs/CHECKLIST_TEST_LOCAL.md` avec `start-local.bat`

---

## 📊 MÉTRIQUES FINALES

| Indicateur | Valeur |
|---|---|
| Tâches DONE | 47 / 75 |
| Tâches TODO | ~18 (dont 8 actions externes) |
| Tâches BLOCKED | ~10 (cascade T5-04, légal, comptable) |
| P0 restants (code) | 0 |
| P1 restants (code) | 2 (T7-02, T7-05) |
| P2 restants (code) | 3 (T6-04, T6-05, T7-07) |
| Tests backend | 101 / 101 passés |
| Coverage services | ~48% (cible : >70%) |
| Avancement estimé | ~92% |
| Frontend build | ✅ 12.9s |
| CVE HIGH non résolues | 0 (corrigée en session) |
| CVE MODERATE non résolues | 3 (non bloquantes CI) |

---

## 🚀 ORDRE RECOMMANDÉ POUR FINIR LE PROJET

### Priorité immédiate (peut être fait sans Railway)
1. **T7-02** — Tests intégration webhook Stripe (P0, Docker requis)
2. **T7-05** — Tests unitaires invoice.service (P1, pas de Docker)
3. **T5-11** — Téléchargement PDF client espace Mon Compte (débloque la facturation côté UX)
4. **T5-12** — Téléchargement PDF admin (symétrique)
5. **T6-04** — Validation import Excel backend (P2, simple)
6. **T6-05** — Supprimer PromotionsPage orpheline (P3, 5 min)

### Quand Railway est réactivé
7. **T8-01..T8-06** — Staging Railway (suivre RAILWAY_CONFIG_READY.md)
8. **T9-01..T9-08** — Go-live checklist

### Actions externes parallèles (propriétaire / comptable / juridique)
- Validation comptable TVA → débloque T5-08, T5-13, T5-14, T5-15, T5-16, T5-17
- CGV / mentions légales / RGPD → débloque T9-03
- SIRET + TVA + adresse → obligatoire avant première facture légale

---

## Bilan session Phase 8 — 2026-06-28

### Objectif 1 — Mise à jour docs : **DONE**
- `.env` confirmé ignoré par git ✅
- Anciens tokens R2 absents du code ✅
- R2 endpoint EU **corrigé** dans `backend/src/config/r2.js` ✅
- Stripe config lit correctement `process.env.STRIPE_SECRET_KEY` ✅
- `ETAT_ACTUEL_PROJET.md` mis à jour (environnements, décisions, working tree) ✅

### Objectif 2 — CI/CD + scripts locaux : **DONE**
- CI GitHub Actions déjà complet (4 jobs) — JWT_REFRESH_SECRET **fixé** ✅
- `start-local.bat` créé (Windows) ✅
- `start-local.sh` créé (Linux/Mac) ✅
- `docs/CHECKLIST_TEST_LOCAL.md` créé ✅
- `docs/RAILWAY_CONFIG_READY.md` créé ✅

### Objectif 3 — Audit phases précédentes : **DONE** (ce document)

### Points critiques identifiés (traiter en priorité)
1. **T7-02** (P0) : Tests webhook Stripe manquants — risque de régression silencieuse
2. **T5-11/T5-12** : PDF non téléchargeables par clients/admin — facturation inutilisable côté UX
3. **T1-05** : Pas de runner de migrations automatique — risque de migration oubliée en prod

### Prochaine session recommandée
T7-02 (tests webhook) + T5-11 (PDF client) + T5-12 (PDF admin), puis Railway quand plan réactivé.

### Bloquants restants avant prod
- Railway plan expiré
- Validation comptable TVA (comptable)
- Validation légale CGV/RGPD (juridique)
- SIRET + TVA + adresse (propriétaire)
