# PLAN DE CORRECTION — Jana Distribution

> Backlog technique officiel. Source de vérité pour les tâches.
> Mettre à jour les compteurs après chaque DONE ou BLOCKED.

---

## 1. Tableau de bord

| Indicateur | Valeur |
|---|---|
| Phase active | Phase 2 — Authentification, commandes et traçabilité |
| Tâche active | Aucune — Phase 2 BLOC 1+2 terminé |
| Tâches totales | 75 |
| READY | 0 |
| IN_PROGRESS | 0 |
| BLOCKED | 3 |
| TODO | 51 |
| DONE | 21 |
| CANCELLED | 0 |
| P0 restants | 1 |
| P1 restants | 2 |
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
| DB-01 | Provider stockage images (S3 / Cloudflare R2 / Railway Volume) | Propriétaire (coût) | T0-02 | OUVERT |
| DB-02 | Stratégie de livraison définitive (FIXE ou DISTANCE) + zones | Propriétaire | T3-01, T3-02 | OUVERT |
| DB-03 | Validation TVA + règles facturation + durée conservation | Comptable | T5-01..T5-17 | OUVERT |

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
  - [ ] `PLAN_CORRECTION_AUDIT.md` — T0-01 → DONE, décrémenter P0
  - [ ] `ETAT_ACTUEL_PROJET.md` — P0-A résolu, mettre à jour journal

---

### T0-02 — Migrer les images vers un stockage persistant

- **Statut :** BLOCKED
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
  - [ ] `PLAN_CORRECTION_AUDIT.md`, `ETAT_ACTUEL_PROJET.md`

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
  - [ ] `PLAN_CORRECTION_AUDIT.md`, `ETAT_ACTUEL_PROJET.md` — P1-01 résolu

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
  - [ ] `PLAN_CORRECTION_AUDIT.md`, `ETAT_ACTUEL_PROJET.md` — P1-03 résolu

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
  - [ ] `PLAN_CORRECTION_AUDIT.md`, `ETAT_ACTUEL_PROJET.md` — P1-06 résolu

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
  - [ ] `PLAN_CORRECTION_AUDIT.md`, `ETAT_ACTUEL_PROJET.md`

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
  - [ ] `PLAN_CORRECTION_AUDIT.md`, `ETAT_ACTUEL_PROJET.md` — P0-D résolu

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
  - [ ] `PLAN_CORRECTION_AUDIT.md`, `ETAT_ACTUEL_PROJET.md` — P1-05 résolu

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
  - [ ] `PLAN_CORRECTION_AUDIT.md`, `ETAT_ACTUEL_PROJET.md` — P1-04 résolu

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

- **Statut :** BLOCKED
- **Priorité :** P1
- **Catégorie :** DÉCISION MÉTIER
- **Domaine :** Business
- **Blocage :** DB-02 — décision propriétaire (zones, mode FIXE vs DISTANCE)
- **Critères :** Décision documentée dans `ETAT_ACTUEL_PROJET.md` section décisions métier

---

### T3-02 — Configurer paramètres livraison en production

- **Statut :** TODO | **Priorité :** P1 | **Catégorie :** CONFIGURATION
- **Dépendances :** T3-01
- **Action :** Mettre à jour les valeurs dans la table `configuration` via l'admin

---

### T3-03 — Ajouter poids produit si calcul au poids

- **Statut :** TODO | **Priorité :** P2 | **Catégorie :** CODE
- **Dépendances :** T3-01 (si le mode poids est choisi)
- **Fichiers :** Migration SQL (`poids_kg` sur `produit`), admin produit

---

### T3-04 — Ajouter numéro de colis sur les expéditions

- **Statut :** TODO | **Priorité :** P3 | **Catégorie :** CODE
- **Fichiers :** Migration SQL (`numero_colis` sur `commande`), admin commandes

---

### Phase 4 — Stripe et remboursements finalisés

---

### T4-01 — Remplacer charge.refunded par refund.created

- **Statut :** TODO | **Priorité :** P1 | **Catégorie :** CODE | **Domaine :** Backend / Stripe
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

- **Statut :** TODO | **Priorité :** P1 | **Catégorie :** CODE
- **Dépendances :** T4-01
- **Fichiers :** `payment.service.js`, `order.repository.js`

---

### T4-03 — Interface admin d'initiation de remboursement

- **Statut :** TODO | **Priorité :** P1 | **Catégorie :** CODE
- **Domaine :** Frontend Admin + Backend
- **Fichiers :** `frontend/src/pages/admin/AdminOrdersList.jsx`, `backend/src/routes/payment.routes.js`
- **Critères :** Admin peut déclencher un remboursement depuis l'interface, action loguée en audit_log

---

### T4-04 — Stocker stripe_refund_id sur la commande

- **Statut :** TODO | **Priorité :** P1 | **Catégorie :** CODE
- **Fichiers :** Migration SQL (`stripe_refund_id` sur `commande`), `order.repository.js`

---

### T4-05 — Enrichir les métadonnées Stripe

- **Statut :** TODO | **Priorité :** P2 | **Catégorie :** CODE
- **Fichiers :** `backend/src/services/payment.service.js` (section metadata)

---

### T4-06 — Configurer webhook Stripe en production

- **Statut :** TODO | **Priorité :** P2 | **Catégorie :** ACTION EXTERNE
- **Action :** Stripe Dashboard → Webhooks → ajouter URL production → copier `STRIPE_WEBHOOK_SECRET`
- **Ne nécessite pas de code**

---

### Phase 5 — Facturation

Voir détails comptables : `docs/audit-finalisation/09_FACTURATION.md`

---

### T5-01 — Validation comptable et juridique des requirements facture

- **Statut :** BLOCKED
- **Priorité :** P0
- **Catégorie :** DÉCISION MÉTIER
- **Blocage :** DB-03 — validation comptable (TVA, mentions obligatoires, durée conservation)
- **Critères :** Taux TVA validés, numérotation approuvée, mentions légales confirmées

---

### T5-02 — Migration tables facture, facture_ligne, avoir

- **Statut :** BLOCKED (cascade T5-01) | **Priorité :** P0 | **Catégorie :** CODE
- **Fichiers :** Migration SQL — voir modèle dans `docs/audit-finalisation/09_FACTURATION.md`
- **Dépendances :** T5-01, T1-05

---

### T5-03 — Repository facture

- **Statut :** BLOCKED | **Priorité :** P0 | **Catégorie :** CODE
- **Dépendances :** T5-02
- **Fichiers :** `backend/src/repositories/invoice.repository.js` (à créer)

---

### T5-04 — Service génération facture (invoice.service.js)

- **Statut :** BLOCKED | **Priorité :** P0 | **Catégorie :** CODE
- **Dépendances :** T5-03
- **Fichiers :** `backend/src/services/invoice.service.js` (à créer)
- **Objectif :** `generateForOrder(orderId)` — charger commande, snapshot données entreprise/client, créer facture en DB

---

### T5-05 — Numérotation séquentielle par année (FAC-YYYY-NNNN)

- **Statut :** BLOCKED | **Priorité :** P0 | **Catégorie :** CODE
- **Dépendances :** T5-04
- **Fichiers :** Migration SQL (`facture_numero_seq`), `invoice.service.js`

---

### T5-06 — Générateur PDF (PDFKit)

- **Statut :** BLOCKED | **Priorité :** P0 | **Catégorie :** CODE
- **Dépendances :** T5-04
- **Fichiers :** `backend/src/services/invoice-pdf.generator.js` (à créer), `package.json` (+ pdfkit)

---

### T5-07 — Déclencher génération facture après webhook checkout.session.completed

- **Statut :** BLOCKED | **Priorité :** P0 | **Catégorie :** CODE
- **Dépendances :** T5-06
- **Fichiers :** `backend/src/services/payment.service.js` (méthode `_onCheckoutCompleted`)

---

### T5-08 — Gérer génération facture pour paiements non-CARTE (VIREMENT/CHEQUE)

- **Statut :** BLOCKED | **Priorité :** P1 | **Catégorie :** CODE
- **Dépendances :** T5-04
- **Fichiers :** `backend/src/services/order.service.js`, admin commandes (changement statut manuel)

---

### T5-09 — Endpoints API factures côté client

- **Statut :** BLOCKED | **Priorité :** P1 | **Catégorie :** CODE
- **Dépendances :** T5-04
- **Fichiers :** `backend/src/routes/invoice.routes.js` (à créer), `invoice.controller.js` (à créer)
- **Routes :** `GET /api/user/invoices`, `GET /api/invoices/:id/pdf`

---

### T5-10 — Endpoints API factures côté admin

- **Statut :** BLOCKED | **Priorité :** P1 | **Catégorie :** CODE
- **Dépendances :** T5-04
- **Routes :** `GET /api/invoices`, `GET /api/admin/invoices/:id/pdf`

---

### T5-11 — Téléchargement PDF client (espace Mon Compte)

- **Statut :** BLOCKED | **Priorité :** P1 | **Catégorie :** CODE
- **Dépendances :** T5-09
- **Fichiers :** `frontend/src/pages/OrderHistoryPage.jsx` ou `MonComptePage.jsx`

---

### T5-12 — Téléchargement PDF admin

- **Statut :** BLOCKED | **Priorité :** P1 | **Catégorie :** CODE
- **Dépendances :** T5-10
- **Fichiers :** `frontend/src/pages/admin/AdminOrdersList.jsx`

---

### T5-13 — Envoi facture par email avec pièce jointe

- **Statut :** BLOCKED | **Priorité :** P1 | **Catégorie :** CODE
- **Dépendances :** T5-06
- **Fichiers :** `backend/src/services/email.service.js`
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

- **Statut :** TODO | **Priorité :** P2 | **Catégorie :** CODE
- **Dépendances :** T2-01
- **Fichiers :** `frontend/src/pages/admin/AdminOrdersList.jsx`, `backend/src/routes/admin.order.routes.js`

---

### T6-02 — Dashboard graphiques CA par période

- **Statut :** TODO | **Priorité :** P2 | **Catégorie :** CODE
- **Fichiers :** `frontend/src/pages/admin/AdminDashboard.jsx`, `backend/src/services/stats.service.js`

---

### T6-03 — Export commandes CSV/Excel

- **Statut :** TODO | **Priorité :** P2 | **Catégorie :** CODE
- **Fichiers :** `frontend/src/pages/admin/AdminOrdersList.jsx` (ExcelJS déjà installé)

---

### T6-04 — Validation import produits Excel côté backend

- **Statut :** TODO | **Priorité :** P2 | **Catégorie :** CODE
- **Fichiers :** `backend/src/routes/product.routes.js`

---

### T6-05 — Supprimer composants orphelins (PromotionsPage)

- **Statut :** TODO | **Priorité :** P3 | **Catégorie :** CODE
- **Fichiers :** `frontend/src/pages/PromotionsPage.jsx`

---

### Phase 7 — Tests automatisés

Détails : `docs/audit-finalisation/12_STRATEGIE_TESTS.md`

---

### T7-01 — Tests intégration création commande (vraie DB)

- **Statut :** TODO | **Priorité :** P0 | **Catégorie :** CODE
- **Dépendances :** T1-05 (migrations)
- **Fichiers :** `backend/tests/integration/order.create.test.js` (à créer)
- **Critères :** Transaction atomique, décrémentation stock, refus si stock insuffisant

---

### T7-02 — Tests intégration webhook Stripe

- **Statut :** TODO | **Priorité :** P0 | **Catégorie :** CODE
- **Fichiers :** `backend/tests/integration/webhook.stripe.test.js` (à créer)
- **Critères :** Signature vérifiée, idempotency, tous les événements traités

---

### T7-03 — Tests intégration authentification

- **Statut :** TODO | **Priorité :** P1 | **Catégorie :** CODE
- **Fichiers :** `backend/tests/integration/auth.test.js` (à créer)

---

### T7-04 — Tests intégration calcul livraison

- **Statut :** TODO | **Priorité :** P1 | **Catégorie :** CODE
- **Fichiers :** `backend/tests/integration/shipping.test.js` (à créer)

---

### T7-05 — Tests unitaires génération facture

- **Statut :** BLOCKED | **Priorité :** P1 | **Catégorie :** CODE
- **Dépendances :** T5-06

---

### T7-06 — Tests race condition stock

- **Statut :** TODO | **Priorité :** P2 | **Catégorie :** CODE
- **Fichiers :** `backend/tests/integration/stock.concurrent.test.js` (à créer)

---

### T7-07 — Tests E2E tunnel de commande (Playwright)

- **Statut :** TODO | **Priorité :** P2 | **Catégorie :** CODE
- **Dépendances :** T7-01, T5-07

---

### Phase 8 — Staging Railway

Détails : `docs/audit-finalisation/11_RAILWAY_PRODUCTION.md`

---

### T8-01 — Créer services Railway staging

- **Statut :** TODO | **Priorité :** P1 | **Catégorie :** ACTION EXTERNE
- **Action :** Railway Dashboard → créer backend-staging et frontend-staging

---

### T8-02 — Configurer variables d'environnement staging

- **Statut :** TODO | **Priorité :** P1 | **Catégorie :** CONFIGURATION
- **Dépendances :** T8-01
- **Action :** Clés Stripe test, DB séparée, Brevo test

---

### T8-03 — Branching strategy staging → staging / main → prod

- **Statut :** TODO | **Priorité :** P1 | **Catégorie :** CONFIGURATION
- **Fichiers :** `.github/workflows/deploy.yml`

---

### T8-04 — Activer sauvegardes PostgreSQL en production

- **Statut :** TODO | **Priorité :** P1 | **Catégorie :** ACTION EXTERNE
- **Action :** Railway Dashboard → PostgreSQL → Backups → activer

---

### T8-05 — Configurer monitoring

- **Statut :** TODO | **Priorité :** P2 | **Catégorie :** ACTION EXTERNE
- **Action :** Better Uptime ou UptimeRobot → surveiller `/api/health`

---

### T8-06 — Configurer stockage images persistant en prod

- **Statut :** TODO | **Priorité :** P0 | **Catégorie :** CONFIGURATION
- **Dépendances :** T0-02

---

### Phase 9 — Go-live

Checklist complète : `docs/audit-finalisation/14_CHECKLIST_GO_LIVE.md`

---

### T9-01 — Test complet flux commande en staging (Stripe test)

- **Statut :** TODO | **Priorité :** P0 | **Dépendances :** T8-01, T8-02

---

### T9-02 — Vérification variables d'environnement production

- **Statut :** TODO | **Priorité :** P0 | **Catégorie :** CONFIGURATION

---

### T9-03 — Validation légale (mentions, CGV, RGPD)

- **Statut :** BLOCKED | **Priorité :** P0 | **Catégorie :** ACTION EXTERNE
- **Blocage :** Validation juridique requise

---

### T9-04 — Validation comptable facturation et TVA

- **Statut :** BLOCKED | **Priorité :** P0 | **Catégorie :** ACTION EXTERNE
- **Blocage :** DB-03 — comptable

---

### T9-05 — Test paiement Stripe LIVE (1€)

- **Statut :** TODO | **Priorité :** P0
- **Dépendances :** T9-02, T4-06

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

## Appendice — Tâches annulées ou à reconsidérer

Aucune tâche annulée à ce stade. Si T0-02 (migration images S3) est réalisé, alors T0-07 (CORS uploads) devient `CANCELLED` car la route `/uploads` sera supprimée.
