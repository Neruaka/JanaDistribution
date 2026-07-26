# PLAN DE CORRECTION — Jana Distribution

> Backlog technique officiel. Source de vérité pour les tâches.
> Mettre à jour les compteurs après chaque DONE ou BLOCKED.

---

## 1. Tableau de bord

| Indicateur | Valeur |
|---|---|
| Phase active | Phase 12 — Tests, règles de gestion et audit pré-production (Phase 11 en parallèle, T11-09 toujours ouvert) |
| Tâche active | Session 2026-07-26 : Phase 12 complète (T12-01..T12-13). Reste : décision propriétaire sur le secret git historique (P0, voir §3) avant tout commit/push. |
| Tâches totales | 103 (90 + 13 Phase 12) |
| READY | 0 |
| IN_PROGRESS | 1 (T11-05) |
| BLOCKED | 3 (T11-04, T11-07 — actions externes utilisateur ; DB-04 — décision propriétaire sur secret git historique, voir §3) |
| TODO | 20 (19 + T11-09) |
| DONE | 70 (57 + Phase 12 : T12-01..T12-13, 13 tâches) |
| CANCELLED | 15 (9 + Phase 8 : T8-01..T8-06) |
| P0 restants | 1 (DB-04 — secret réel dans l'historique git d'un dépôt GitHub public, voir §3) |
| P1 restants | 2 (npm audit frontend react-router open redirect ; rotation SMTP_USER/SMTP_PASS legacy à confirmer — voir Phase 12 T12-10) |
| Verdict | NON PRÊT POUR LA PRODUCTION |

---

## 2. Chemin critique

Tâches qui empêchent directement la mise en production :

```
T0-01  Message checkout trompeur        → DONE ✓
T0-02  Stockage images persistant       → BLOCKED (décision DB-01)
T0-03  JWT_REFRESH_SECRET distinct      → DONE ✓
T0-04  Payload stripe_event réduit      → DONE ✓
T0-05  Validation mot de passe          → DONE ✓
T0-06  Encodage UTF-8                   → DONE ✓
T0-07  CORS * sur /uploads             → DONE ✓
  ↓
T1-01  Panier dans transaction          → DONE ✓
T1-02  hasPermission fonctionnel        → DONE ✓
T1-05  Migrations versionnées           → TODO
  ↓
T2-03..T2-05  Refresh tokens DB         → TODO (Phase 2)
  ↓
T4-01  refund.created webhook           → TODO (Phase 4)
T4-03  Interface remboursement admin    → TODO
  ↓
T5-01  Validation comptable TVA         → BLOCKED (comptable)
T5-02..T5-17  Facturation complète      → BLOCKED (cascade T5-01)
  ↓
T7-01..T7-02  Tests intégration         → TODO (Phase 7)
  ↓
T8-01..T8-06  Staging Railway           → TODO (Phase 8)
  ↓
T9-01..T9-08  Go-live                   → TODO (Phase 9)
```

---

## 3. Décisions bloquantes

| ID | Décision | Responsable | Tâches bloquées | Statut |
|---|---|---|---|---|
| DB-01 | Provider stockage images (S3 / Cloudflare R2 / Railway Volume) | Propriétaire (coût) | T0-02 | RÉSOLU — Cloudflare R2 |
| DB-02 | Stratégie de livraison définitive (FIXE ou DISTANCE) + zones | Propriétaire | T3-01, T3-02 | RÉSOLU — MODE DISTANCE, rayon 80km, 5€+0.80/km, franco 80€ |
| DB-03 | Validation TVA + règles facturation + durée conservation | Comptable | T5-01..T5-17 | RÉSOLU — taux 5.5/10/20% CGI implémentés (⚠️ validation comptable requise avant prod) |
| DB-04 | **P0 — Secret réel (`backend/.env`) committé dans l'historique git (commit `79fccb1`, scrubé plus tard par `a3ce33d` mais jamais purgé), dépôt GitHub `Neruaka/JanaDistribution` confirmé **public** (vérifié via l'API GitHub, `"private": false`, 2026-07-26). Valeurs concernées : `JWT_SECRET`, `JWT_REFRESH_SECRET`, `DB_PASSWORD`, `SMTP_USER`, `SMTP_PASS` (valeurs non répétées ici, voir règle §7 docs/CLAUDE_WORKFLOW.md). Rotation nécessaire pour tout secret encore en usage (DB_PASSWORD et SMTP_USER/SMTP_PASS legacy non confirmés comme déjà rotés ; JWT probablement déjà régénéré via T11-05 mais à confirmer). Purge de l'historique git (`git filter-repo`/BFG + force-push) = action destructive hors périmètre d'exécution automatique — décision et exécution réservées au propriétaire du dépôt. | Propriétaire | Tout commit/push ultérieur sur ce dépôt tant que la rotation n'est pas confirmée | **BLOCKED — action externe requise, voir T12-10** |

---

## 4. Phase active — tâches immédiatement exécutables

| ID | Tâche | Statut | Priorité |
|---|---|---|---|
| T0-01 | Corriger message checkout trompeur | DONE | P0 |
| T0-02 | Migrer images vers stockage persistant | BLOCKED (DB-01) | P0 |
| T0-03 | Forcer JWT_REFRESH_SECRET distinct | DONE | P1 |
| T0-04 | Réduire payload stripe_event stocké | DONE | P1 |
| T0-05 | Valider force mot de passe backend | DONE | P1 |
| T0-06 | Corriger encodage UTF-8 fichiers source | DONE | P2 |
| T0-07 | Corriger CORS * sur /uploads | DONE | P0 |

---

## 5. Phases de correction

---

### Phase 0 — Sécurisation immédiate

---

### T0-01 — Corriger le message checkout trompeur

- **Statut :** DONE (2026-06-14)
- **Priorité :** P0
- **Catégorie :** CODE
- **Domaine :** Frontend
- **Objectif :** Rendre le bandeau "Comment ça marche" conditionnel selon `formData.modePaiement`
- **Raison :** Les utilisateurs choisissant CARTE voient un message "devis par email / paiement à la livraison" alors que Stripe les facture immédiatement. Risque juridique et confusion client.
- **Source audit :** `docs/audit-finalisation/05_AUDIT_FRONTEND.md`, `docs/audit-finalisation/00_RESUME_EXECUTIF.md` P0-3
- **Prérequis :** Aucun
- **Dépendances :** Aucune
- **Bloque :** Rien (correction indépendante)
- **Décision requise :** Aucune
- **Documents à lire :** `docs/audit-finalisation/05_AUDIT_FRONTEND.md`
- **Fichiers d'entrée :** `frontend/src/pages/CheckoutPage.jsx` (lignes 347-362, ligne 83)
- **Autres fichiers potentiellement concernés :** `frontend/src/components/checkout/Recapitulatif.jsx` (à confirmer par recherche ciblée)
- **Requirements :**
  - Le bandeau affiche un message adapté selon le mode de paiement sélectionné
  - Mode CARTE → message "Vous allez être redirigé vers Stripe pour payer en ligne"
  - Modes VIREMENT/CHEQUE/ESPECES → message "devis par email" conservé tel quel
  - Le sous-titre à la ligne 343 ("pour recevoir votre devis par email") doit aussi être conditionnel
- **Étapes d'implémentation :**
  1. Lire `CheckoutPage.jsx` lignes 80-100 pour confirmer la valeur initiale de `formData.modePaiement`
  2. Localiser le rendu conditionnel existant (ligne 267) pour comprendre la structure déjà en place
  3. Envelopper le bandeau lignes 348-362 dans `{formData.modePaiement !== 'CARTE' && (...)}`
  4. Ajouter un bandeau alternatif pour CARTE : information sur le paiement sécurisé Stripe
  5. Rendre le sous-titre ligne 343 conditionnel selon le même critère
  6. Vérifier qu'aucun autre texte "devis" ou "livraison" n'est affiché pour les utilisateurs CARTE
- **Risques :** Faible — modification d'affichage uniquement, aucun impact backend
- **Critères d'acceptation :**
  - [ ] Utilisateur avec mode CARTE ne voit PAS le texte "devis par email"
  - [ ] Utilisateur avec mode CARTE voit un message cohérent avec un paiement immédiat
  - [ ] Utilisateur avec mode VIREMENT/CHEQUE voit le message "devis" inchangé
  - [ ] Le formulaire et le bouton de soumission restent fonctionnels dans les deux cas
- **Tests à exécuter :**
  - [ ] `cd frontend && npm run test -- CheckoutPage` (si test unitaire existe)
  - [ ] Test manuel : sélectionner CARTE → vérifier bandeau ; sélectionner VIREMENT → vérifier bandeau
- **Validation manuelle :**
  - [ ] Vérification visuelle en développement local
- **Rollback :** `git checkout frontend/src/pages/CheckoutPage.jsx`
- **Mise à jour documentaire après réalisation :**
  - [ ] `docs/PLAN_CORRECTION_AUDIT.md` — T0-01 → DONE, décrémenter P0
  - [ ] `docs/ETAT_ACTUEL_PROJET.md` — P0-A résolu, mettre à jour journal

---

### T0-02 — Migrer les images vers un stockage persistant

- **Statut :** DONE (2026-06-27)
- **Priorité :** P0
- **Catégorie :** CODE + CONFIGURATION
- **Domaine :** Backend / Infrastructure
- **Objectif :** Remplacer le stockage Multer sur disque local par un stockage persistant
- **Raison :** Railway utilise un système de fichiers éphémère. Toutes les images uploadées sont perdues à chaque redéploiement. Le catalogue devient visuellement cassé.
- **Source audit :** `docs/audit-finalisation/11_RAILWAY_PRODUCTION.md`
- **Prérequis :** Décision DB-01 (provider : S3 / Cloudflare R2 / Railway Volume)
- **Bloque :** T0-02 est un prérequis implicite de T8-01 (staging) et T9-01 (go-live)
- **Décision requise :** DB-01 — choix du provider
- **Fichiers d'entrée :** `backend/src/middlewares/upload.middleware.js`, `backend/src/controllers/product.controller.js`
- **Autres fichiers potentiellement concernés :** `backend/package.json` (nouvelle dépendance), `backend/src/index.js`
- **Requirements :**
  - Les images survivent à un redéploiement Railway
  - L'URL de l'image est stockée dans `produit.image_url` en DB
  - L'accès aux images est restreint (pas CORS `*`) — voir T0-07
- **Étapes d'implémentation (selon provider choisi) :**
  1. (S3/R2) Installer `@aws-sdk/client-s3` ou `@aws-sdk/lib-storage`
  2. Modifier `upload.middleware.js` pour utiliser multer-s3 ou upload direct SDK
  3. Adapter `product.controller.js` pour stocker l'URL S3/R2 dans `produit.image_url`
  4. Supprimer la route `express.static('/uploads')` de `index.js`
  5. Tester l'upload d'une image et vérifier qu'elle est accessible après restart
  6. Documenter les nouvelles variables d'env requises (`S3_BUCKET`, `S3_REGION`, etc.)
- **Critères d'acceptation :**
  - [ ] Image uploadée accessible après restart du serveur
  - [ ] URL correctement stockée en DB
  - [ ] Ancienne route `/uploads` désactivée ou sécurisée
- **Mise à jour documentaire :**
  - [ ] `docs/PLAN_CORRECTION_AUDIT.md`, `docs/ETAT_ACTUEL_PROJET.md`

---

### T0-03 — Forcer JWT_REFRESH_SECRET distinct

- **Statut :** DONE (2026-06-14)
- **Priorité :** P1
- **Catégorie :** CODE
- **Domaine :** Backend — Sécurité
- **Objectif :** Remplacer le fallback silencieux par une erreur explicite au démarrage
- **Raison :** Si `JWT_REFRESH_SECRET` n'est pas configuré, les refresh tokens sont signés avec la même clé que les access tokens, réduisant la sécurité sans aucun avertissement.
- **Source audit :** `docs/audit-finalisation/07_AUDIT_SECURITE.md`
- **Fichiers d'entrée :** `backend/src/services/auth.service.js` (ligne 24)
- **Étapes d'implémentation :**
  1. Remplacer la ligne 24 : `this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;`
  2. Par : `if (!process.env.JWT_REFRESH_SECRET) throw new Error('[FATAL] JWT_REFRESH_SECRET must be set and distinct from JWT_SECRET');`
  3. Puis : `this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;`
  4. Ajouter `JWT_REFRESH_SECRET` dans `.env.example` avec un commentaire
- **Critères d'acceptation :**
  - [ ] Démarrage du serveur échoue si `JWT_REFRESH_SECRET` est absent
  - [ ] Message d'erreur explicite dans les logs
  - [ ] `.env.example` documenté
- **Tests à exécuter :**
  - [ ] Démarrer le serveur sans `JWT_REFRESH_SECRET` → erreur attendue
  - [ ] `cd backend && npm test -- auth`
- **Mise à jour documentaire :**
  - [ ] `docs/PLAN_CORRECTION_AUDIT.md`, `docs/ETAT_ACTUEL_PROJET.md` — P1-01 résolu

---

### T0-04 — Réduire le payload stripe_event stocké

- **Statut :** DONE (2026-06-14)
- **Priorité :** P1
- **Catégorie :** CODE
- **Domaine :** Backend — Sécurité / Stripe
- **Objectif :** Ne stocker que `event_id`, `type`, `processed_at` dans `stripe_event` — pas le payload complet
- **Raison :** `event.data` (le payload JSONB complet) peut contenir des données sensibles Stripe. L'idempotency ne nécessite que l'event_id.
- **Source audit :** `docs/audit-finalisation/08_STRIPE_PAIEMENTS.md`
- **Fichiers d'entrée :** `backend/src/services/payment.service.js` (ligne 146-149), `backend/scripts/init.sql` (table stripe_event)
- **Étapes d'implémentation :**
  1. Dans `init.sql` : retirer la colonne `payload JSONB NOT NULL` de `stripe_event` — créer une migration `backend/migrations/001_stripe_event_no_payload.sql`
  2. Dans `payment.service.js` ligne 146 : modifier le INSERT pour n'insérer que `event_id`, `type`, `processed_at`
  3. Supprimer toute référence à `payload` dans les autres fichiers (rg `payload` backend/src/)
- **Critères d'acceptation :**
  - [ ] La table `stripe_event` ne contient plus de colonne `payload`
  - [ ] Le INSERT ne stocke que `event_id`, `type`, `processed_at`
  - [ ] Idempotency toujours fonctionnelle (ON CONFLICT sur `event_id`)
- **Tests à exécuter :**
  - [ ] Test webhook double-envoi → un seul traitement
- **Mise à jour documentaire :**
  - [ ] `docs/PLAN_CORRECTION_AUDIT.md`, `docs/ETAT_ACTUEL_PROJET.md` — P1-03 résolu

---

### T0-05 — Valider la force du mot de passe côté backend

- **Statut :** DONE (2026-06-14)
- **Priorité :** P1
- **Catégorie :** CODE
- **Domaine :** Backend — Sécurité
- **Objectif :** Rejeter les mots de passe trop faibles à l'inscription et au changement de mot de passe
- **Source audit :** `docs/audit-finalisation/07_AUDIT_SECURITE.md`
- **Fichiers d'entrée :** `backend/src/services/auth.service.js`, `backend/src/validators/auth.validator.js` (à confirmer par `rg`)
- **Étapes d'implémentation :**
  1. Définir les règles : longueur ≥ 8 caractères, au moins 1 chiffre, 1 majuscule (à valider avec le propriétaire)
  2. Ajouter une validation avant `bcrypt.hash` dans `register()` et `changePassword()`
  3. Retourner `ApiError.badRequest` si le mot de passe ne respecte pas les règles
- **Critères d'acceptation :**
  - [ ] Inscription refusée avec mot de passe `"azerty"` ou `"12345678"`
  - [ ] Message d'erreur explicite retourné à l'API
  - [ ] Changement de mot de passe soumis aux mêmes règles
- **Mise à jour documentaire :**
  - [ ] `docs/PLAN_CORRECTION_AUDIT.md`, `docs/ETAT_ACTUEL_PROJET.md` — P1-06 résolu

---

### T0-06 — Corriger l'encodage UTF-8 dans les fichiers source

- **Statut :** DONE (2026-06-14)
- **Priorité :** P2
- **Catégorie :** CODE
- **Domaine :** Backend / Frontend
- **Objectif :** Remplacer les séquences corrompues `Ã©`, `â‚¬`, `â€™` par les caractères corrects
- **Source audit :** `docs/audit-finalisation/01_INVENTAIRE_PROJET.md`
- **Fichiers d'entrée :** À identifier via `rg "Ã©\|â€™\|â‚¬" backend/src/`
- **Étapes d'implémentation :**
  1. `rg "Ã©" backend/src/ --files-with-matches`
  2. Corriger chaque occurrence (é, è, à, ê, €, etc.)
  3. Vérifier l'encodage des templates email dans `email.service.js`
- **Critères d'acceptation :**
  - [ ] Aucune séquence `Ã©`, `â‚¬`, `â€™` dans les fichiers source
  - [ ] Emails envoyés avec accents corrects
- **Mise à jour documentaire :**
  - [ ] `docs/PLAN_CORRECTION_AUDIT.md`, `docs/ETAT_ACTUEL_PROJET.md`

---

### T0-07 — Corriger Access-Control-Allow-Origin: * sur /uploads

- **Statut :** DONE (2026-06-14)
- **Priorité :** P0
- **Catégorie :** CODE
- **Domaine :** Backend — Sécurité
- **Objectif :** Remplacer `Access-Control-Allow-Origin: *` sur la route `/uploads` par l'origine autorisée
- **Raison :** Toute origine peut lire les images, y compris des sites tiers. Risque de hotlinking et d'exposition non contrôlée.
- **Source audit :** `docs/audit-finalisation/07_AUDIT_SECURITE.md`, `docs/audit-finalisation/00_RESUME_EXECUTIF.md` P0-4
- **Source dans le code :** `backend/src/index.js` ligne 117
- **Prérequis :** Aucun (indépendant de T0-02)
- **Décision requise :** Aucune (remplacer `*` par `process.env.CORS_ORIGIN`)
- **Fichiers d'entrée :** `backend/src/index.js` (ligne 113-119)
- **Étapes d'implémentation :**
  1. Lire le bloc actuel `app.use('/uploads', (req, res, next) => {...})`
  2. Remplacer `'*'` par `process.env.CORS_ORIGIN || 'http://localhost:5173'`
  3. Vérifier que le frontend peut toujours charger les images produits
- **Note :** Cette tâche devient obsolète si T0-02 est réalisé (migration vers S3 supprime la route `/uploads`). Dans ce cas, marquer CANCELLED avec note.
- **Critères d'acceptation :**
  - [ ] Header `Access-Control-Allow-Origin` limité à `CORS_ORIGIN`
  - [ ] Images toujours accessibles depuis le frontend
- **Mise à jour documentaire :**
  - [ ] `docs/PLAN_CORRECTION_AUDIT.md`, `docs/ETAT_ACTUEL_PROJET.md` — P0-D résolu

---

### Phase 1 — Stabilisation et migrations

---

### T1-01 — Inclure la vidange panier dans la transaction commande

- **Statut :** DONE (2026-06-14)
- **Priorité :** P1
- **Catégorie :** CODE
- **Domaine :** Backend
- **Objectif :** S'assurer que le panier est vidé atomiquement avec la création de commande, ou gérer l'incohérence de manière idempotente
- **Source audit :** `docs/audit-finalisation/06_AUDIT_BACKEND_BDD.md`
- **Fichiers d'entrée :** `backend/src/services/order.service.js` (ligne 183), `backend/src/repositories/order.repository.js`, `backend/src/repositories/cart.repository.js`
- **Étapes d'implémentation :**
  1. Inspecter `cart.repository.js` pour vérifier si `clearCart` accepte un client de transaction
  2. Option A : passer le client de transaction à `clearCart` et l'inclure avant COMMIT
  3. Option B : rendre `clearCart` idempotent et le retenter après la commande avec retry
  4. Ajouter un log si le clearCart échoue après commit (incident non bloquant mais traçable)
- **Critères d'acceptation :**
  - [ ] Si la commande est créée, le panier est toujours vide
  - [ ] Si la commande échoue, le panier reste intact
- **Mise à jour documentaire :**
  - [ ] `docs/PLAN_CORRECTION_AUDIT.md`, `docs/ETAT_ACTUEL_PROJET.md` — P1-05 résolu

---

### T1-02 — Supprimer ou implémenter hasPermission()

- **Statut :** DONE (2026-06-14)
- **Priorité :** P1
- **Catégorie :** CODE
- **Domaine :** Backend — Sécurité
- **Objectif :** Rendre `hasPermission()` cohérent avec le modèle DB
- **Raison :** `auth.middleware.js:159` teste `req.user.permissions` qui n'existe pas dans la table `utilisateur` (vérification `init.sql`). Ce middleware retourne toujours 403 si appelé.
- **Source audit :** `docs/audit-finalisation/07_AUDIT_SECURITE.md`
- **Fichiers d'entrée :** `backend/src/middlewares/auth.middleware.js` (lignes 149-165), `backend/scripts/init.sql` (table utilisateur)
- **Étapes d'implémentation :**
  1. `rg "hasPermission" backend/src/` — identifier tous les appelants
  2. Si aucun appelant : supprimer `hasPermission` du middleware
  3. Si des appelants existent : soit supprimer les appels, soit implémenter réellement un système de permissions (décision scope)
- **Critères d'acceptation :**
  - [ ] Aucun middleware ne teste un champ inexistant en DB
  - [ ] Toutes les routes admin sont protégées par `isAdmin` (fonctionnel)
- **Mise à jour documentaire :**
  - [ ] `docs/PLAN_CORRECTION_AUDIT.md`, `docs/ETAT_ACTUEL_PROJET.md` — P1-04 résolu

---

### T1-03 — Supprimer le doublon package Redis

- **Statut :** DONE (2026-06-14)
- **Priorité :** P2
- **Catégorie :** CODE
- **Domaine :** Backend
- **Objectif :** Garder uniquement `ioredis`, supprimer le package `redis`
- **Fichiers d'entrée :** `backend/package.json`, `backend/src/config/redis.js`
- **Étapes :**
  1. `rg "require.*'redis'" backend/src/` — vérifier qu'aucun fichier n'importe directement le package `redis`
  2. `npm uninstall redis` dans `backend/`
  3. Vérifier que `backend/src/config/redis.js` utilise uniquement `ioredis`
- **Critères d'acceptation :**
  - [ ] `package.json` ne contient plus `redis` (le package npm), uniquement `ioredis`
  - [ ] Application démarre sans erreur

---

### T1-04 — Unifier le système de validation

- **Statut :** DONE (2026-06-14) — express-validator seul (5/5 validators) ; joi supprimé (jamais importé dans src)
- **Priorité :** P2
- **Catégorie :** CODE
- **Domaine :** Backend
- **Objectif :** Choisir `express-validator` OU `joi` et supprimer l'autre
- **Fichiers d'entrée :** `backend/package.json`, `backend/src/validators/`
- **Étapes :**
  1. `rg "require.*joi\|require.*express-validator" backend/src/` — cartographier l'usage réel
  2. Choisir celui le plus utilisé (garder la cohérence)
  3. Migrer les validators minoritaires vers le système retenu
  4. `npm uninstall` le paquet supprimé
- **Critères d'acceptation :**
  - [ ] Un seul système de validation dans `package.json`
  - [ ] Aucun import de l'ancien système restant

---

### T1-05 — Mettre en place les migrations versionnées

- **Statut :** DONE (2026-06-14)
- **Priorité :** P2
- **Catégorie :** CODE
- **Domaine :** Backend — Base de données
- **Objectif :** Créer un répertoire `backend/migrations/` avec un système de migration incrémental
- **Raison :** `init.sql` contient des `DROP TABLE IF EXISTS` — destructif en production. Toute modification de schéma doit passer par une migration versionnée.
- **Source audit :** `docs/audit-finalisation/06_AUDIT_BACKEND_BDD.md`, `docs/audit-finalisation/11_RAILWAY_PRODUCTION.md`
- **Fichiers d'entrée :** `backend/package.json`, `backend/scripts/init.sql`
- **Étapes :**
  1. Choisir un outil : `node-pg-migrate` (recommandé) ou script custom
  2. Créer `backend/migrations/001_initial_schema.sql` basé sur `init.sql` sans les DROP
  3. Créer `backend/migrations/002_stripe_columns.sql` pour les colonnes Stripe ajoutées dans le working tree
  4. Configurer le script de migration au démarrage (avant `app.listen`)
  5. Documenter : `init.sql` réservé au premier démarrage local uniquement
- **Critères d'acceptation :**
  - [ ] `backend/migrations/` contient les migrations versionnées
  - [ ] Un nouveau `npm start` applique les migrations manquantes
  - [ ] `init.sql` marqué "DEV ONLY — ne pas exécuter en production"

---

### T1-06 — Corriger les CVE npm en production

- **Statut :** DONE (2026-06-14)
- **Priorité :** P2
- **Catégorie :** CODE
- **Domaine :** Backend / Frontend
- **Objectif :** Résoudre les vulnérabilités détectées par `npm audit --production`
- **Étapes :**
  1. `cd backend && npm audit --production`
  2. `cd frontend && npm audit --production`
  3. Corriger les CVE critiques et hautes
- **Critères d'acceptation :**
  - [ ] `npm audit --production` : aucune CVE critique

---

### T1-07 — Corriger double route admin produit

- **Statut :** DONE (2026-06-14)
- **Priorité :** P2
- **Catégorie :** CODE
- **Domaine :** Frontend
- **Objectif :** Supprimer la route en double `:id/modifier` dans `App.jsx`
- **Fichiers d'entrée :** `frontend/src/App.jsx`
- **Critères d'acceptation :**
  - [ ] Une seule route pour la modification de produit admin

---

### T1-08 — Corriger accents dans templates email

- **Statut :** DONE (2026-06-14) — email.service.js inspecté : aucune corruption UTF-8 (déjà propre depuis T0-06)
- **Priorité :** P3
- **Catégorie :** CODE
- **Domaine :** Backend
- **Fichiers d'entrée :** `backend/src/services/email.service.js`
- **Critères d'acceptation :**
  - [ ] Emails envoyés avec accents corrects et symbole €

---

### Phase 2 — Authentification, commandes et traçabilité

---

### T2-01 — Créer table commande_statut_historique

- **Statut :** DONE (2026-06-27) | **Priorité :** P1 | **Catégorie :** CODE | **Domaine :** Backend/DB
- **Fichiers modifiés :** `scripts/migrations/0002_commande_statut_historique.sql` (créé), `order.repository.js` (updateStatus + cancel + getHistory), `admin.order.routes.js` (GET /:id/history)
- **Tests :** 5/5 suites, 97/97 ✓

---

### T2-02 — Enregistrer historique statuts à chaque transition

- **Statut :** DONE (2026-06-27) | **Priorité :** P1 | **Catégorie :** CODE
- **Note :** Inclus dans T2-01 — updateStatus() et cancel() loguent chaque transition
- **Tests :** 5/5 suites, 97/97 ✓

---

### T2-03 — Créer table refresh_token en DB

- **Statut :** DONE (2026-06-27) | **Priorité :** P1 | **Catégorie :** CODE | **Domaine :** Backend/DB
- **Fichiers modifiés :** `scripts/migrations/0003_refresh_token.sql` (créé)
- **Tests :** 5/5 suites, 97/97 ✓

---

### T2-04 — Stocker refresh token en DB à la connexion

- **Statut :** DONE (2026-06-27) | **Priorité :** P1 | **Catégorie :** CODE
- **Fichiers modifiés :** `auth.service.js` (login + register + _storeRefreshToken), `user.repository.js` (saveRefreshToken)
- **Tests :** 5/5 suites, 97/97 ✓

---

### T2-05 — Révoquer refresh token à la déconnexion

- **Statut :** DONE (2026-06-27) | **Priorité :** P1 | **Catégorie :** CODE
- **Fichiers modifiés :** `auth.service.js` (logout + refreshTokens), `auth.controller.js` (logout + refreshToken), `user.repository.js` (revokeRefreshToken + revokeAllUserRefreshTokens)
- **Tests :** 5/5 suites, 97/97 ✓

---

### T2-06 — Créer table audit_log

- **Statut :** DONE (2026-06-27) | **Priorité :** P2 | **Catégorie :** CODE
- **Fichiers modifiés :** `scripts/migrations/0004_audit_log.sql` (créé), `repositories/audit.repository.js` (créé)
- **Tests :** 5/5 suites, 97/97 ✓

---

### T2-07 — Logger actions sensibles admin

- **Statut :** DONE (2026-06-27) | **Priorité :** P2 | **Catégorie :** CODE
- **Fichiers modifiés :** `admin.order.routes.js` (audit log sur PATCH /:id/status)
- **Tests :** 5/5 suites, 97/97 ✓

---

### Phase 3 — Stratégie de livraison

---

### T3-01 — Valider et documenter la stratégie de livraison

- **Statut :** DONE (2026-06-27) — MODE DISTANCE, rayon 80km, région parisienne, 5€+0.80/km, franco 80€
- **Priorité :** P1
- **Catégorie :** DÉCISION MÉTIER
- **Domaine :** Business

---

### T3-02 — Configurer paramètres livraison en production

- **Statut :** DONE (2026-06-27) — Migration 0006 insère les paramètres en DB
- **Priorité :** P1 | **Catégorie :** CONFIGURATION

---

### T3-03 — Ajouter poids produit si calcul au poids

- **Statut :** TODO | **Priorité :** P2 | **Catégorie :** CODE
- **Dépendances :** T3-01 (si le mode poids est choisi)
- **Fichiers :** Migration SQL (`poids_kg` sur `produit`), admin produit

---

### T3-04 — Ajouter numéro de colis sur les expéditions

- **Statut :** DONE (2026-06-27) — Migration 0007 ajoute numero_colis + date_expedition sur commande
- **Priorité :** P3 | **Catégorie :** CODE

---

### Phase 4 — Stripe et remboursements finalisés

> ⚠️ **Décision client (2026-07-02) : le MVP n'a PAS de paiement en ligne.**
> Stripe a été retiré entièrement du projet (code, DB, package npm, env, tests).
> Modes de paiement acceptés : ESPECES (livraison), VIREMENT, CHEQUE.
> T4-01 à T4-06 sont **CANCELLED** (décision métier, plus de canal Stripe).
> Voir T4-07 pour le détail du retrait.

---

### T4-01 — Remplacer charge.refunded par refund.created

- **Statut :** CANCELLED (2026-07-02) — Stripe retiré du projet, voir T4-07 | **Priorité :** P1 | **Catégorie :** CODE | **Domaine :** Backend / Stripe
- **Objectif :** Utiliser l'événement Stripe `refund.created` pour une gestion plus précise (remboursements partiels)
- **Source audit :** `docs/audit-finalisation/08_STRIPE_PAIEMENTS.md`
- **Fichiers d'entrée :** `backend/src/services/payment.service.js` (ligne 174), `backend/src/routes/webhook.routes.js`
- **Étapes :**
  1. Inspecter le handler `_onChargeRefunded` actuel
  2. Créer un handler `_onRefundCreated(refund)` qui distingue remboursement total et partiel
  3. Mettre à jour la liste des événements écoutés dans le webhook handler
  4. Configurer l'événement `refund.created` dans Stripe Dashboard (via ACTION EXTERNE)
- **Critères :**
  - [ ] Remboursement partiel → statut `PARTIELLEMENT_REMBOURSE` (ou équivalent)
  - [ ] Remboursement total → statut `REFUNDED`
  - [ ] Webhook idempotent (double envoi ignoré)

---

### T4-02 — Gérer les remboursements partiels

- **Statut :** CANCELLED (2026-07-02) — Stripe retiré du projet, voir T4-07 | **Priorité :** P1 | **Catégorie :** CODE
- **Dépendances :** T4-01
- **Fichiers :** `payment.service.js`, `order.repository.js`

---

### T4-03 — Interface admin d'initiation de remboursement

- **Statut :** CANCELLED (2026-07-02) — remplacé par un remboursement manuel (voir T4-07) | **Priorité :** P1 | **Catégorie :** CODE
- **Domaine :** Frontend Admin + Backend
- **Fichiers :** `frontend/src/pages/admin/AdminOrdersList.jsx`, `backend/src/routes/payment.routes.js`
- **Critères :** Admin peut déclencher un remboursement depuis l'interface, action loguée en audit_log

---

### T4-04 — Stocker stripe_refund_id sur la commande

- **Statut :** CANCELLED (2026-07-02) — colonne `stripe_refund_id` supprimée (migration 0009), voir T4-07 | **Priorité :** P1 | **Catégorie :** CODE
- **Fichiers :** Migration SQL (`stripe_refund_id` sur `commande`), `order.repository.js`

---

### T4-05 — Enrichir les métadonnées Stripe

- **Statut :** CANCELLED (2026-07-02) — Stripe retiré du projet, voir T4-07 | **Priorité :** P2 | **Catégorie :** CODE
- **Fichiers :** `backend/src/services/payment.service.js` (section metadata)

---

### T4-06 — Configurer webhook Stripe en production

- **Statut :** CANCELLED (2026-07-02) — plus de webhook Stripe à configurer, voir T4-07 | **Priorité :** P2 | **Catégorie :** ACTION EXTERNE
- **Action :** ~~Stripe Dashboard → Webhooks → ajouter URL production → copier `STRIPE_WEBHOOK_SECRET`~~
- **Ne nécessite pas de code**

---

### T4-07 — Retrait complet de Stripe (décision client : pas de paiement en ligne au MVP)

- **Statut :** DONE (2026-07-02) | **Priorité :** P0 | **Catégorie :** CODE + DB | **Domaine :** Backend / Frontend / E-commerce
- **Objectif :** Retirer entièrement Stripe (code applicatif, colonnes DB, package npm, variables d'env, tests) — seuls ESPECES (livraison), VIREMENT et CHEQUE restent des modes de paiement valides.
- **Fichiers supprimés :** `backend/src/services/payment.service.js`, `backend/src/controllers/payment.controller.js`, `backend/src/routes/payment.routes.js`, `backend/src/routes/webhook.routes.js`, `backend/src/config/stripe.js`, `frontend/src/services/paymentService.js`, `frontend/src/pages/PaymentSuccessPage.jsx`, `frontend/src/pages/PaymentCancelPage.jsx`, `backend/tests/integration/webhook.stripe.test.js`
- **Fichiers modifiés :** `backend/src/index.js`, `backend/src/routes/admin.order.routes.js` (payment-status et refund passent en logique manuelle, sans Stripe), `backend/src/repositories/order.repository.js`, `backend/src/services/order.service.js`, `backend/src/validators/order.validator.js`, `frontend/src/App.jsx`, `frontend/src/pages/CheckoutPage.jsx` (option CARTE retirée, plus de redirection Stripe), `frontend/src/components/checkout/MoyenPaiement.jsx`, `frontend/src/components/checkout/Recapitulatif.jsx`, `frontend/src/pages/OrderConfirmationPage.jsx`, `frontend/src/pages/OrderDetailPage.jsx`, `frontend/src/services/orderService.js`, `frontend/src/services/adminService.js`, `backend/.env.example`, `frontend/.env.example`
- **Impact DB :** Migration `backend/scripts/migrations/0009_remove_stripe.sql` — retire `stripe_session_id`, `stripe_payment_intent_id`, `stripe_refund_id` de `commande`, supprime la table `stripe_event`, recrée l'ENUM `mode_paiement` sans `'CARTE'`. `montant_rembourse` et les statuts `REMBOURSE` / `PARTIELLEMENT_REMBOURSE` sont **conservés** (suivi manuel des remboursements, indépendant de Stripe).
- **Package npm :** `stripe` retiré du backend, `@stripe/stripe-js` retiré du frontend.
- **Tests :** 101/101 tests backend passés après retrait. Build frontend OK.
- **Décision prise :** Le remboursement admin (`POST /api/admin/orders/:id/refund`) est conservé mais devient purement déclaratif : l'admin enregistre un remboursement effectué hors système (espèces rendues, virement émis, chèque annulé) ; aucun appel à une API de paiement.
- **Commit :** `9ee63d0`

---

### Phase 5 — Facturation

Voir détails comptables : `docs/audit-finalisation/09_FACTURATION.md`

---

### T5-01 — Validation comptable et juridique des requirements facture

- **Statut :** DONE (2026-06-27) — Taux 5.5/10/20% CGI implémentés avec avertissement comptable dans le code
- **Priorité :** P0 | **Catégorie :** DÉCISION MÉTIER
- **⚠️ AVERTISSEMENT :** Validation comptable requise avant première vente réelle pour chaque référence produit

---

### T5-02 — Migration tables facture, facture_ligne, avoir

- **Statut :** DONE (2026-06-27) | **Priorité :** P0 | **Catégorie :** CODE
- **Fichiers modifiés :** `scripts/migrations/0008_facturation.sql`

---

### T5-03 — Repository facture

- **Statut :** DONE (2026-06-27) | **Priorité :** P0 | **Catégorie :** CODE
- **Fichiers :** `backend/src/repositories/invoice.repository.js`

---

### T5-04 — Service génération facture (invoice.service.js)

- **Statut :** DONE (2026-06-27) | **Priorité :** P0 | **Catégorie :** CODE
- **Fichiers :** `backend/src/services/invoice.service.js`

---

### T5-05 — Numérotation séquentielle par année (FAC-YYYY-NNNN)

- **Statut :** DONE (2026-06-27) | **Priorité :** P0 | **Catégorie :** CODE
- **Fichiers :** Séquence `facture_seq` dans 0008_facturation.sql, getNextNumber() dans invoice.repository.js

---

### T5-06 — Générateur PDF (PDFKit)

- **Statut :** DONE (2026-06-27) | **Priorité :** P0 | **Catégorie :** CODE
- **Fichiers :** `backend/src/services/invoice-pdf.generator.js`, pdfkit installé

---

### T5-07 — Déclencher génération facture après webhook checkout.session.completed

- **Statut :** DONE (2026-06-27) | **Priorité :** P0 | **Catégorie :** CODE
- **Fichiers :** `backend/src/services/payment.service.js` (_onCheckoutCompleted appelle invoiceService.generateForOrder)

---

### T5-08 — Gérer génération facture pour paiements non-CARTE (VIREMENT/CHEQUE)

- **Statut :** DONE (2026-07-04) | **Priorité :** P1 | **Catégorie :** CODE
- **Dépendances :** T5-04
- **Fichiers :** `backend/src/routes/admin.order.routes.js` (PATCH /:id/status) — génération auto : VIREMENT/CHEQUE à la CONFIRMEE, ESPECES à la LIVREE

---

### T5-09 — Endpoints API factures côté client

- **Statut :** DONE (2026-06-27) | **Priorité :** P1 | **Catégorie :** CODE
- **Fichiers :** `backend/src/routes/invoice.routes.js` — GET /api/invoices/mes-factures, GET /api/invoices/:id/pdf

---

### T5-10 — Endpoints API factures côté admin

- **Statut :** DONE (2026-06-27) | **Priorité :** P1 | **Catégorie :** CODE
- **Routes :** GET /api/invoices/admin, POST /api/invoices/admin/generer/:commandeId

---

### T5-11 — Téléchargement PDF client (espace Mon Compte)

- **Statut :** DONE (2026-06-28) | **Priorité :** P1 | **Catégorie :** CODE
- **Dépendances :** T5-09
- **Fichiers :** `frontend/src/pages/MesFacturesPage.jsx` (créé), `frontend/src/services/api.js`, `frontend/src/App.jsx`, `frontend/src/components/Navbar.jsx`

---

### T5-12 — Téléchargement PDF admin

- **Statut :** DONE (2026-06-28) | **Priorité :** P1 | **Catégorie :** CODE
- **Dépendances :** T5-10
- **Fichiers :** `frontend/src/components/admin/OrderDetailModal.jsx`, `frontend/src/services/adminService.js`, `backend/src/routes/invoice.routes.js` (ajout ?commande_id=)

---

### T5-13 — Envoi facture par email avec pièce jointe

- **Statut :** DONE (2026-07-04) | **Priorité :** P1 | **Catégorie :** CODE
- **Dépendances :** T5-06
- **Fichiers :** `backend/src/services/email.service.js` (sendMail supporte les pièces jointes + nouvelle méthode sendInvoiceEmail), `backend/src/services/invoice.service.js` (fire-and-forget après generateForOrder)
- **Note :** Brevo supporte les pièces jointes base64 via son API REST

---

### T5-14 — Rendre les factures immuables

- **Statut :** BLOCKED | **Priorité :** P1 | **Catégorie :** CODE
- **Dépendances :** T5-04
- **Objectif :** Aucun endpoint UPDATE sur `facture`. Tout correctif passe par un avoir.

---

### T5-15 — Générer un avoir après remboursement

- **Statut :** BLOCKED | **Priorité :** P2 | **Catégorie :** CODE
- **Dépendances :** T5-04, T4-01
- **Fichiers :** `invoice.service.js` méthode `generateCreditNote(orderId, motif, montant)`

---

### T5-16 — Tests unitaires service facture

- **Statut :** BLOCKED | **Priorité :** P1 | **Catégorie :** CODE
- **Dépendances :** T5-06

---

### T5-17 — Tests intégration flux facture complet

- **Statut :** BLOCKED | **Priorité :** P1 | **Catégorie :** CODE
- **Dépendances :** T5-07, T7-01

---

### Phase 6 — Finalisation administration

---

### T6-01 — Afficher historique statuts dans admin (timeline)

- **Statut :** DONE (2026-06-27) | **Priorité :** P2 | **Catégorie :** CODE
- **Dépendances :** T2-01
- **Fichiers :** `frontend/src/pages/admin/AdminOrdersList.jsx`, `backend/src/routes/admin.order.routes.js`

---

### T6-02 — Dashboard graphiques CA par période

- **Statut :** DONE (pré-existant — AdminDashboard.jsx + admin.stats.routes.js déjà implémentés) | **Priorité :** P2 | **Catégorie :** CODE
- **Fichiers :** `frontend/src/pages/admin/AdminDashboard.jsx`, `backend/src/services/stats.service.js`

---

### T6-03 — Export commandes CSV/Excel

- **Statut :** DONE (2026-06-27) | **Priorité :** P2 | **Catégorie :** CODE
- **Fichiers :** `frontend/src/pages/admin/AdminOrdersList.jsx` (ExcelJS déjà installé)

---

### T6-04 — Validation import produits Excel côté backend

- **Statut :** TODO | **Priorité :** P2 | **Catégorie :** CODE
- **Fichiers :** `backend/src/routes/product.routes.js`

---

### T6-05 — Supprimer composants orphelins (PromotionsPage)

- **Statut :** DONE (2026-06-28) | **Priorité :** P3 | **Catégorie :** CODE
- **Fichiers :** `frontend/src/pages/PromotionsPage.jsx` (supprimé — aucune référence dans le router)

---

### Phase 7 — Tests automatisés

Détails : `docs/audit-finalisation/12_STRATEGIE_TESTS.md`

---

### T7-01 — Tests intégration création commande (vraie DB)

- **Statut :** DONE (2026-07-04 — suite complète, 3 tests) | **Priorité :** P0 | **Catégorie :** CODE
- **Fichiers :** `backend/tests/integration/order.create.test.js` — décrément atomique du stock, rollback stock insuffisant, rollback complet sur commande multi-lignes partiellement invalide — nécessite Docker (`npm run test:integration`)

---

### T7-02 — Tests intégration webhook Stripe

- **Statut :** CANCELLED (2026-07-02) — Stripe retiré du projet (voir T4-07), fichier de test supprimé | **Priorité :** P0 | **Catégorie :** CODE
- **Fichiers :** ~~`backend/tests/integration/webhook.stripe.test.js`~~ (supprimé)
- **Critères :** Signature vérifiée ✓, idempotency (rowCount) ✓, checkout.session.completed ✓, refund.created ✓, event inconnu ✓

---

### T7-03 — Tests intégration authentification

- **Statut :** DONE (2026-07-04 — suite complète, 6 tests) | **Priorité :** P1 | **Catégorie :** CODE
- **Fichiers :** `backend/tests/integration/auth.test.js` — register/login bcrypt, contrainte unique email, cycle de vie refresh_token (émission, révocation, exclusion des tokens révoqués) — nécessite Docker (`npm run test:integration`)

---

### T7-04 — Tests intégration calcul livraison

- **Statut :** DONE (2026-06-27) | **Priorité :** P1 | **Catégorie :** CODE
- **Fichiers :** `backend/tests/integration/shipping.test.js` — 4 tests unitaires Haversine (pas de Docker)

---

### T7-05 — Tests unitaires génération facture

- **Statut :** TODO | **Priorité :** P1 | **Catégorie :** CODE

---

### T7-06 — Tests race condition stock

- **Statut :** DONE (2026-07-04 — suite complète, 3 tests) | **Priorité :** P2 | **Catégorie :** CODE
- **Fichiers :** `backend/tests/integration/stock.concurrent.test.js` — 2/10/8 achats concurrents via `SELECT ... FOR UPDATE`, une seule réussite sur dernier stock — nécessite Docker (`npm run test:integration`)

---

### T7-07 — Tests E2E tunnel de commande (Playwright)

- **Statut :** TODO | **Priorité :** P2 | **Catégorie :** CODE
- **Dépendances :** T7-01, T5-07

---

### Phase 8 — Staging Railway

- **Statut : CANCELLED (2026-07-26)** — Railway abandonné comme chemin critique vers la production (plan expiré, décision de migrer vers un homeserver auto-géré). Remplacée par la **Phase 11 — Migration Railway → Homeserver**, voir plus bas.

Détails : `docs/audit-finalisation/11_RAILWAY_PRODUCTION.md` *(obsolète)*

---

### T8-01 — Créer services Railway staging

- **Statut :** CANCELLED (2026-07-26) — voir Phase 11 | **Priorité :** P1 | **Catégorie :** ACTION EXTERNE

---

### T8-02 — Configurer variables d'environnement staging

- **Statut :** CANCELLED (2026-07-26) — voir Phase 11 | **Priorité :** P1 | **Catégorie :** CONFIGURATION

---

### T8-03 — Branching strategy staging → staging / main → prod

- **Statut :** CANCELLED (2026-07-26) — remplacé par T11-08 (déploiement CI/CD vers le homeserver, déclenché sur push `develop`) | **Priorité :** P1 | **Catégorie :** CONFIGURATION

---

### T8-04 — Activer sauvegardes PostgreSQL en production

- **Statut :** CANCELLED (2026-07-26) — remplacé par T11-06 (script `pg_dump` + cron sur le homeserver, DONE) | **Priorité :** P1 | **Catégorie :** ACTION EXTERNE

---

### T8-05 — Configurer monitoring

- **Statut :** CANCELLED (2026-07-26) — remplacé par T11-07 (moniteurs Uptime Kuma, déjà instance existante sur le homeserver) | **Priorité :** P2 | **Catégorie :** ACTION EXTERNE

---

### T8-06 — Configurer stockage images persistant en prod

- **Statut :** CANCELLED (2026-07-26) — Cloudflare R2 déjà configuré et indépendant de Railway (voir T11-05, nouveau token R2 dédié à générer) | **Priorité :** P0 | **Catégorie :** CONFIGURATION

---

## Phase 11 — Migration Railway → Homeserver (`tfredklab.dev`)

> Remplace la Phase 8. Railway EN PAUSE (plan expiré) — hébergement auto-géré
> sur le homeserver personnel de l'utilisateur (Debian 13, Docker Compose,
> Caddy, Cloudflare Tunnel). Détails complets : `docs/DEPLOY-HOMESERVER.md`.
> Session du 2026-07-26.

---

### T11-01 — Confirmer sous-domaines et vérifier collisions de ports

- **Statut :** DONE (2026-07-26) | **Priorité :** P0 | **Catégorie :** CONFIGURATION
- **Résultat :** `jana.tfredklab.dev` (frontend) / `jana-api.tfredklab.dev` (backend) confirmés. Ports hôte `4000`/`4001` retenus (aucune collision avec 80/443/3000/53/3001/5055/8000/8080/8096/9000/3030/8081 déjà utilisés par les autres services du homeserver).

---

### T11-02 — Créer docker-compose.yml prod sur le homeserver

- **Statut :** DONE (2026-07-26) | **Priorité :** P0 | **Catégorie :** CODE + CONFIGURATION
- **Fichiers (hors dépôt git, sur le homeserver) :** `/opt/docker/jana/docker-compose.yml`, `/opt/docker/jana/.env`
- **Fichier modifié dans le dépôt :** `backend/src/config/database.js` — ajout du flag `DB_SSL_DISABLE=true` (SSL forcé par défaut pour Railway/Render, incompatible avec un Postgres auto-hébergé sans TLS)
- **Impact DB :** Schéma initialisé via `backend/scripts/init.sql` (17 tables). ⚠️ `run-migrations.js` et la migration `0001` ne sont pas committés dans le dépôt — dette à corriger.
- **Tests :** 112/112 (backend, suite à jour après le fix SSL), healthcheck `/api/health` → `{"database":"up"}`, build + démarrage validés de bout en bout sur le homeserver.
- **Commit :** `9116e15` (fix SSL)

---

### T11-03 — Ajouter blocs Caddy jana + jana-api

- **Statut :** DONE (2026-07-26) | **Priorité :** P0 | **Catégorie :** CONFIGURATION
- **Fichier modifié (hors dépôt git) :** `/opt/docker/caddy/Caddyfile` — blocs `@jana`/`@jana_api` → `reverse_proxy 172.17.0.1:4000`/`4001`
- **Validation :** `jana.tfredklab.dev` → 200, `jana-api.tfredklab.dev/api/health` → succès, aucune régression sur les services déjà proxyfiés (status, media testés).
- **Risque documenté :** un bind-mount fichier Docker reste attaché à l'inode d'origine — un `mv` pour remplacer le Caddyfile ne suffit pas, un `docker restart caddy` a été nécessaire (quelques secondes d'interruption pour tous les services proxyfiés).

---

### T11-04 — Cloudflare Tunnel public hostnames

- **Statut :** BLOCKED (action externe utilisateur) | **Priorité :** P0 | **Catégorie :** ACTION EXTERNE
- **Action :** Zero Trust → Networks → Tunnels → "homeserver" → Public Hostname → ajouter `jana.tfredklab.dev` et `jana-api.tfredklab.dev` → `localhost:80`. Tunnel géré à distance via token (pas de config.yml local éditable par SSH).

---

### T11-05 — Générer secrets prod + .env homeserver

- **Statut :** IN_PROGRESS | **Priorité :** P0 | **Catégorie :** CONFIGURATION + ACTION EXTERNE
- **Fait :** `JWT_SECRET`, `JWT_REFRESH_SECRET`, `POSTGRES_PASSWORD` générés directement sur le homeserver (`openssl rand -hex 32/24`, jamais transités par ce poste ni affichés). `.env` aligné sur Gmail SMTP (le code a migré de Brevo vers Gmail SMTP le 2026-07-08, indépendamment de cette session — variables `BREVO_*` mortes retirées).
- **Reste à renseigner (action externe utilisateur) :** `GMAIL_SENDER_EMAIL`/`GMAIL_APP_PASSWORD` (nouveau mot de passe d'application, pas celui de Railway), `R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY` (nouveau token R2 dédié), `ENTREPRISE_ADRESSE`.

---

### T11-06 — Script sauvegarde PostgreSQL + test restauration

- **Statut :** DONE (2026-07-26) | **Priorité :** P1 | **Catégorie :** CODE + CONFIGURATION
- **Fichier (hors dépôt git) :** `/opt/docker/jana/backup-postgres.sh` — `pg_dump` + gzip, rotation 14 jours, cron `0 3 * * *`
- **Test :** Restauration validée dans une base temporaire (17 tables restaurées avec succès, puis nettoyée).

---

### T11-07 — Monitoring Uptime Kuma

- **Statut :** BLOCKED (action externe utilisateur) | **Priorité :** P2 | **Catégorie :** ACTION EXTERNE
- **Action :** Ajouter 2 moniteurs HTTP(s) dans `status.tfredklab.dev` : `https://jana.tfredklab.dev` et `https://jana-api.tfredklab.dev/api/health`. Pas d'API REST stable en Uptime Kuma v1 pour automatiser sans session authentifiée.

---

### T11-08 — Déploiement CI/CD réel

- **Statut :** DONE (2026-07-26) — décision utilisateur : clé SSH dédiée en secret GitHub (transport via Tailscale) | **Priorité :** P1 | **Catégorie :** CODE + CONFIGURATION
- **Fichier modifié :** `.github/workflows/deploy.yml` — simplifié à un seul job (déclenché sur push `develop`, plus de split staging/production factice), étapes : connexion Tailscale (`tailscale/github-action`) puis SSH vers le homeserver.
- **Sécurité :** clé SSH dédiée installée dans `authorized_keys` du homeserver avec **forced command** (`command="..."`) restreignant son usage au seul pipeline de déploiement, aucun accès shell interactif même en cas de fuite.
- **Reste à faire (action externe utilisateur) :** créer les 4 secrets GitHub (`TS_AUTHKEY`, `HOMESERVER_TAILSCALE_IP`, `HOMESERVER_SSH_USER`, `HOMESERVER_SSH_KEY`).

---

### T11-09 — Cutover final Railway → homeserver

- **Statut :** TODO | **Priorité :** P0 | **Catégorie :** VALIDATION
- **Dépendances :** T11-04, T11-05 (secrets externes complets)
- **Objectif :** Valider le flux commande complet sur `jana.tfredklab.dev`, puis bascule DNS finale et arrêt (pas suppression) de Railway.

---

### T11-10 — Synchronisation documentaire complète

- **Statut :** DONE (2026-07-26) | **Priorité :** P1 | **Catégorie :** DOCUMENTATION
- **Fichiers :** `backend/railway.json` + `frontend/railway.json` supprimés, `docs/DEPLOY-HOMESERVER.md` créé, `docs/DEPLOY-RAILWAY.md` + `docs/RAILWAY_CONFIG_READY.md` marqués obsolètes (bandeau, conservés en référence historique tant que Railway reste actif), `CLAUDE.md` mis à jour (déploiement homeserver, Phase 11), `docs/ETAT_ACTUEL_PROJET.md` et `docs/PLAN_CORRECTION_AUDIT.md` (ce fichier) mis à jour.

---

### Phase 9 — Go-live

Checklist complète : `docs/audit-finalisation/14_CHECKLIST_GO_LIVE.md`

---

### T9-01 — Test complet flux commande en staging (Stripe test)

- **Statut :** CANCELLED (2026-07-02) — remplacé par un test du flux ESPECES/VIREMENT/CHEQUE (pas de Stripe) | **Priorité :** P0 | **Dépendances :** T8-01, T8-02

---

### T9-02 — Vérification variables d'environnement production

- **Statut :** TODO | **Priorité :** P0 | **Catégorie :** CONFIGURATION

---

### T9-03 — Validation légale (mentions, CGV, RGPD)

- **Statut :** BLOCKED | **Priorité :** P0 | **Catégorie :** ACTION EXTERNE
- **Blocage :** Validation juridique requise
- **Note (2026-07-04) :** Bannière d'information cookies ajoutée (`frontend/src/components/CookieBanner.jsx`) — cookies strictement techniques uniquement (JWT/session), exemptés de consentement CNIL, fermable et persistante. Ne lève pas le blocage global (validation juridique CGV/mentions légales toujours requise).

---

### T9-04 — Validation comptable facturation et TVA

- **Statut :** BLOCKED | **Priorité :** P0 | **Catégorie :** ACTION EXTERNE
- **Blocage :** DB-03 — comptable

---

### T9-05 — Test paiement Stripe LIVE (1€)

- **Statut :** CANCELLED (2026-07-02) — pas de paiement en ligne au MVP, Stripe retiré (voir T4-07) | **Priorité :** P0
- **Dépendances :** ~~T9-02, T4-06~~

---

### T9-06 — Confirmation sauvegardes DB opérationnelles

- **Statut :** TODO | **Priorité :** P0 | **Dépendances :** T8-04

---

### T9-07 — npm audit --production sans CVE critique

- **Statut :** TODO | **Priorité :** P1 | **Dépendances :** T1-06

---

### T9-08 — Documentation déploiement à jour

- **Statut :** TODO | **Priorité :** P1

---

## Phase 10 — Codes promo (MVP, décision client 2026-07-02)

> Feature ajoutée suite à la décision client de retirer Stripe (voir T4-07) : rabais pourcentage ou montant fixe, dates de validité, limites d'utilisation globale/par client, montant minimum, activation manuelle, stats admin.

### T10-01 — Schéma DB + repository + service + API codes promo (backend)

- **Statut :** DONE (2026-07-02) | **Priorité :** P1 | **Catégorie :** CODE | **Domaine :** Backend
- **Fichiers :** `backend/scripts/migrations/0010_codes_promo.sql`, `backend/src/repositories/promo.repository.js`, `backend/src/services/promo.service.js`, `backend/src/routes/promo.routes.js`, `backend/tests/unit/promo.service.test.js`
- **Tables créées :** `code_promo`, `code_promo_utilisation` ; colonnes `commande.code_promo_id`, `commande.montant_rabais`, `commande.total_avant_rabais`
- **Routes :** `POST /api/promo/valider` (client), `GET/POST/PATCH/DELETE /api/promo/admin[/:id]`, `PATCH /api/promo/admin/:id/toggle`
- **Tests :** 112/112 (101 existants + 11 nouveaux)
- **Commit :** `586da91`
- **Risque documenté :** verrou `SELECT ... FOR UPDATE` sur `code_promo` pendant la transaction de commande pour fermer la fenêtre de course sur les limites d'utilisation ; limitation acceptée pour le volume MVP.

---

### T10-02 — Intégration code promo dans la création de commande

- **Statut :** DONE (2026-07-02) | **Priorité :** P1 | **Catégorie :** CODE | **Domaine :** Backend
- **Fichiers :** `backend/src/services/order.service.js`, `backend/src/repositories/order.repository.js`, `backend/src/controllers/order.controller.js`, `backend/src/validators/order.validator.js`
- **Détail :** total recalculé côté serveur (jamais confiance au total client), utilisation enregistrée dans la même transaction que la commande.
- **Commit :** `586da91` (même commit que T10-01)

---

### T10-03 — Champ code promo au checkout client (frontend)

- **Statut :** DONE (2026-07-02) | **Priorité :** P1 | **Catégorie :** CODE | **Domaine :** Frontend
- **Fichiers :** `frontend/src/pages/CheckoutPage.jsx`, `frontend/src/components/checkout/Recapitulatif.jsx`, `frontend/src/services/orderService.js`, `frontend/src/services/promoService.js`
- **Détail :** validation en temps réel via `POST /promo/valider`, affichage du rabais, total recalculé par le backend à la commande réelle.
- **Commit :** `5c7634d`

---

### T10-04 — Interface admin gestion codes promo (CRUD + stats)

- **Statut :** DONE (2026-07-02) | **Priorité :** P1 | **Catégorie :** CODE | **Domaine :** Frontend Admin
- **Fichiers :** `frontend/src/pages/admin/AdminPromoList.jsx`, `frontend/src/components/admin/PromoCodeModal.jsx`, `frontend/src/services/adminService.js`, `frontend/src/App.jsx`, `frontend/src/components/admin/AdminLayout.jsx`
- **Détail :** tableau avec stats (utilisations, clients touchés, CA généré), toggle actif/inactif, suppression bloquée si déjà utilisé (suggère désactivation).
- **Commits :** `dfaca2d`, `58bf032`
- **Limite documentée :** cartes de stats rapides calculées sur la page chargée (pas d'agrégation globale serveur — hors contrat API actuel).

---

## Phase 12 — Tests, règles de gestion et audit pré-production (2026-07-26)

> Session ouverte pour (1) exécuter enfin les tests d'intégration réels sur cette machine, (2) durcir les règles de gestion métier par domaine, (3) mener un audit de sécurité pré-prod, (4) mettre à jour la checklist de test manuel. Ne touche pas à l'infrastructure homeserver (Phase 11, T11-09 reste séparé).

### T12-01 — Prérequis Docker Desktop
- **Statut :** DONE (2026-07-26) | **Priorité :** P1 | **Catégorie :** INFRA
- **Détail :** Docker Desktop démarré par l'utilisateur en cours de session ; `docker info` confirme l'engine actif. Débloque T12-03.

### T12-02 — Suite Jest mockée (non-régression)
- **Statut :** DONE (2026-07-26) | **Priorité :** P0 | **Catégorie :** TEST | **Domaine :** Backend
- **Régression trouvée et corrigée :** `nodemailer` déclaré dans `backend/package.json` mais absent de `node_modules` (2/7 suites en échec de chargement au premier run). `npm install` a résolu le problème ; `package-lock.json` inchangé (pas un problème de lockfile, un environnement local désynchronisé).
- **Tests :** 112/112 ✓ après correction.

### T12-03 — Tests d'intégration réels (testcontainers)
- **Statut :** DONE (2026-07-26) | **Priorité :** P0 | **Catégorie :** TEST | **Domaine :** Backend
- **Bug de test trouvé et corrigé (pas un bug de production) :** `order.create.test.js#uniqueNumeroCommande()` générait une valeur dépassant `commande.numero_commande VARCHAR(20)` — le générateur de production (`order.repository.js#_generateNumeroCommande`, format `CMD-YYYYMMDD-0001`) était et reste conforme.
- **Tests :** exécutées pour la première fois avec succès sur cette machine — 6/6 suites, 54/54 (avant durcissement Bloc 2 ; 9/9 suites, 70/70 après, voir T12-05/06).
- **Environnement :** Docker Desktop local, pas encore automatisé en CI.

### T12-04 — Documentation résultats tests d'intégration
- **Statut :** DONE (2026-07-26) | **Priorité :** P2 | **Catégorie :** DOC
- **Fichiers :** `docs/ETAT_ACTUEL_PROJET.md`, `docs/audit-finalisation/12_STRATEGIE_TESTS.md`

### T12-05 — Durcir les transitions de statut commande
- **Statut :** DONE (2026-07-26) | **Priorité :** P0 | **Catégorie :** CODE | **Domaine :** E-commerce/Backend
- **Fichiers :** `backend/src/repositories/order.repository.js`, `backend/tests/unit/order.service.test.js`, `backend/tests/integration/order.status.routes.test.js` (nouveau), `backend/tests/integration/order.idempotency.test.js` (nouveau)
- **Détail :** machine à états déjà appliquée côté service (confirmé, pas seulement UI), panier vide déjà rejeté, recalcul serveur strict déjà en place (T1-01). Idempotence de la création de commande implémentée via verrou `SELECT ... FOR UPDATE` sur la ligne `panier` + recheck panier vide dans la transaction (pas de nouvelle colonne/clé d'idempotence nécessaire).
- **Tests :** 19/19 unitaires/routes ; 70/70 en intégration Docker (avec T12-06).

### T12-06 — Durcir les règles de stock
- **Statut :** DONE (2026-07-26) | **Priorité :** P0 | **Catégorie :** CODE + DB | **Domaine :** E-commerce/Backend
- **Fichiers :** `backend/scripts/migrations/0011_stock_check_constraint.sql` (nouveau), `backend/scripts/init.sql`, `backend/tests/integration/stock.concurrent.test.js`
- **Impact DB :** nouvelle contrainte `CHECK (stock_quantite >= 0)` sur `produit` (migration 0011, idempotente, avec garde anti-données-négatives-existantes). **À exécuter sur le homeserver de prod** (`node backend/scripts/run-migrations.js`) avant le prochain déploiement.
- **Détail :** décrémentation atomique déjà correcte côté applicatif (`UPDATE ... WHERE stock_quantite >= $1`), confirmée par test de concurrence réelle (déjà existant, pas un cas séquentiel déguisé) ; CHECK constraint ajoutée en filet de sécurité DB.

### T12-07 — Audit arrondi TVA / facturation
- **Statut :** DONE (2026-07-26) | **Priorité :** P0 | **Catégorie :** CODE | **Domaine :** Backend
- **Fichiers :** `backend/src/services/invoice.service.js`, `backend/tests/unit/invoice.service.test.js` (nouveau)
- **Bugs critiques trouvés et corrigés :**
  1. `generateForOrder()` lisait une colonne inexistante (`ligne.prix_unitaire` au lieu de `prix_unitaire_ht`) et la traitait comme un TTC à reconvertir → **NaN sur tous les montants de facture**.
  2. `SELECT lc.*, p.taux_tva, ...` : la colonne `taux_tva` du produit (JOIN) écrasait silencieusement `lc.taux_tva` (figé à la commande) — une facture émise pouvait hériter du taux TVA **courant** du produit au lieu du taux **facturé au client**, risque légal direct. Corrigé : seul `lc.taux_tva` (figé) est désormais utilisé.
- **Arrondi unifié :** ligne par ligne à 2 décimales avant sommation, cohérent avec `cart.repository.js` — plus d'écart de centime possible panier/commande/facture.
- **Immuabilité vérifiée :** aucune route PUT/PATCH/DELETE sur les factures — conforme, rien à corriger.
- **Risque documenté (non corrigé, hors périmètre — nouvelle fonctionnalité) :** le mécanisme d'avoir n'existe pas encore côté code (schéma prêt : `facture.statut`, `facture.avoir_id`, mais aucun service/route ne le crée) — une facture émise ne peut aujourd'hui être corrigée par aucun mécanisme légal.
- **Validation comptable des taux (DB-03) reste BLOCKED** — non levée par cette tâche, portée uniquement sur la cohérence technique.

### T12-08 — Durcir les règles d'authentification
- **Statut :** DONE (2026-07-26) | **Priorité :** P0 | **Catégorie :** SÉCURITÉ | **Domaine :** Cybersécurité
- **Fichiers :** `backend/src/services/auth.service.js`, `backend/tests/unit/auth.service.test.js`
- **Vulnérabilité trouvée et corrigée :** timing attack sur `login()` — quand l'email n'existait pas, `bcrypt.compare` n'était jamais appelé, rendant la réponse mesurablement plus rapide qu'un mauvais mot de passe → énumération d'emails possible. Corrigé par comparaison bcrypt factice systématique contre un hash bidon.
- **Confirmé déjà conforme :** politique mot de passe backend infranchissable, expiration JWT réelle (7j/30j), révocation refresh token effective en DB (pas seulement signature JWT), 401 uniforme sur tokens révoqués/expirés y compris routes admin.
- **Vecteur restant documenté (non corrigé, hors périmètre minimal) :** un compte désactivé renvoie 403 avec message distinct avant vérification du mot de passe → révèle qu'un email correspond à un compte désactivé. À réévaluer si le durcissement anti-énumération est jugé prioritaire.
- **Tests :** 39/39 (suites auth).

### T12-09 — Cloisonnement des rôles admin
- **Statut :** DONE (2026-07-26) | **Priorité :** P0 | **Catégorie :** SÉCURITÉ | **Domaine :** Backend/Cybersécurité
- **Fichiers :** `backend/src/controllers/product.controller.js`, `backend/src/routes/admin.clients.routes.js`, `backend/tests/integration/product.routes.test.js`, `backend/tests/integration/admin.clients.routes.test.js` (nouveau)
- **Confirmé conforme :** les 3 fichiers `admin.*.routes.js` appliquent `router.use(authenticate, isAdmin)` en tête — 401 sans token, 403 non-admin, exhaustif, pas de route oubliée.
- **Gap trouvé et corrigé :** `audit_log` n'était alimenté que par `admin.order.routes.js` et `promo.routes.js` — aucune trace pour la création/modification/suppression de produits ni les actions sensibles sur comptes clients (modification, blocage, suppression RGPD). Ajouté : `PRODUCT_CREATE/UPDATE/DELETE/HARD_DELETE/BULK_DELETE`, `CLIENT_UPDATE/TOGGLE_STATUS/DELETE_RGPD`.
- **Reste hors périmètre (documenté, non corrigé) :** `updateStock`/`importProducts`/upload/suppression d'image produit et `settings.routes.js` (config site) n'écrivent pas encore dans `audit_log`.
- **Tests :** suite complète après T12-08+T12-09 → 141/141 (sans Bloc E-commerce), 139/139 après consolidation des 3 chantiers parallèles (voir note ci-dessous).

### T12-10 — Audit de sécurité pré-production
- **Statut :** DONE (2026-07-26) | **Priorité :** P0 | **Catégorie :** SÉCURITÉ | **Domaine :** Cybersécurité
- **Fichiers :** `backend/package-lock.json`, `frontend/package-lock.json` (`npm audit fix` sans `--force`, aucun changement applicatif)
- **🔴 P0 CRITIQUE trouvé — voir DB-04 (§3) :** secret réel (`backend/.env`) committé dans l'historique git (commit `79fccb1`, scrubé plus tard par `a3ce33d` mais jamais purgé de l'historique) sur un dépôt GitHub **public** (`Neruaka/JanaDistribution`, confirmé via l'API GitHub). Valeurs concernées : `JWT_SECRET`, `JWT_REFRESH_SECRET`, `DB_PASSWORD`, `SMTP_USER`, `SMTP_PASS`. **BLOQUANT — décision et action propriétaire requises avant tout commit/push (rotation des secrets + décision sur purge d'historique).**
- **SEC-07 (vidange panier hors transaction) ré-audité : désormais DONE** — le code a changé depuis l'audit historique, `DELETE FROM ligne_panier` se fait maintenant dans la même transaction SQL que la commande (rollback complet en cas d'échec).
- **Confirmé toujours conformes (pas de régression) :** SEC-02 (R2), SEC-04 (JWT_REFRESH_SECRET distinct, fatal si absent), SEC-06 (hasPermission supprimé), SEC-08 (CORS restreint, pas de wildcard), SEC-09 (validation mdp robuste), Helmet actif, rate limiting (300/15min global + 20/15min auth + 5/15min reset mdp dédié, non documenté avant), bcrypt ≥12 rounds.
- **npm audit backend :** 1 CVE moderate restante (`uuid` via `jest-junit`, devDependency uniquement) — P2, correctif nécessiterait `--force`/breaking.
- **npm audit frontend :** 3 CVE de production restantes après fix non-breaking — `react-router` 6.0.0-7.17.0 (moderate, open redirect CVE-2025-68470) → **P1** ; `brace-expansion`/`uuid` via `exceljs` (export CSV/Excel admin T6-03, surface limitée à l'admin authentifié) → P2.
- **Secrets logs/git (hors le point P0 ci-dessus) :** sondage ciblé sur les logs Winston auth/order — aucun secret en clair loggé.
- **Tests :** 139/139 après `npm audit fix` (backend) — aucune régression.

### T12-11 — Réécriture `docs/CHECKLIST_TEST_LOCAL.md`
- **Statut :** DONE (2026-07-26) | **Priorité :** P2 | **Catégorie :** DOC
- **Détail :** sections Stripe (webhook, Stripe CLI, cartes de test) supprimées, remplacées par le parcours réel (commande → statut positionné manuellement par un admin ESPECES/VIREMENT/CHEQUE → email → facture). Sections auth/panier/upload R2/livraison DISTANCE/admin conservées et enrichies des durcissements de cette session (idempotence, cloisonnement rôles, audit_log). Section tests d'intégration réels ajoutée.

### T12-12 — Figer `docs/audit-finalisation/14_CHECKLIST_GO_LIVE.md`
- **Statut :** DONE (2026-07-26) | **Priorité :** P2 | **Catégorie :** DOC
- **Détail :** bandeau renforcé (« FIGÉ — ne plus mettre à jour »), pointe désormais uniquement vers `docs/ETAT_ACTUEL_PROJET.md` comme source de vérité go-live. `docs/RESTE_A_FAIRE_PROD.md` (lui aussi partiellement obsolète, antérieur à la migration homeserver) a reçu le même bandeau pour éviter toute checklist go-live contradictoire.

### T12-13 — Synchronisation documentaire finale Phase 12
- **Statut :** DONE (2026-07-26) | **Priorité :** P1 | **Catégorie :** DOC
- **Détail :** cette section, le tableau de bord (§1) et la décision bloquante DB-04 (§3) constituent la synchronisation finale. Voir `docs/ETAT_ACTUEL_PROJET.md` pour le bilan de session complet et le §13 mis à jour.
- **Points restés BLOCKED nécessitant une décision externe avant go-live final (T11-09) :**
  1. **DB-04 (P0, nouveau)** — rotation des secrets exposés dans l'historique git + décision propriétaire sur la purge d'historique (voir §3).
  2. **DB-03** — validation comptable définitive des taux de TVA (toujours ouverte, non traitée par cette session).
  3. Mécanisme d'avoir pour factures émises — non implémenté (T12-07), nouvelle fonctionnalité hors périmètre de durcissement.
  4. Rotation confirmée de `SMTP_USER`/`SMTP_PASS` legacy — à vérifier explicitement (T12-10).
  5. T11-04, T11-07 — actions externes utilisateur déjà trackées en Phase 11, non dupliquées ici.

---

## Appendice — Tâches annulées ou à reconsidérer

Aucune tâche annulée à ce stade. Si T0-02 (migration images S3) est réalisé, alors T0-07 (CORS uploads) devient `CANCELLED` car la route `/uploads` sera supprimée.
