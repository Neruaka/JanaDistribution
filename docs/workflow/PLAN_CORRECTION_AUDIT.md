# PLAN DE CORRECTION — Jana Distribution

> Backlog technique officiel. Source de vérité pour les tâches.
> Mettre à jour les compteurs après chaque DONE ou BLOCKED.

---

## 1. Tableau de bord

| Indicateur | Valeur |
|---|---|
| Phase active | Phase 14 (déploiement Fly.io) COMPLÈTE. Les 27 tâches TODO identifiées en début de session (facturation T5-14/T5-15 + 25 items de re-vérification) sont toutes DONE. **0 tâche TODO restante dans le document** — reste uniquement DB-04 (décision propriétaire, non une tâche de code) et les 4 BLOCKED (dépendances externes : validation légale/comptable). |
| Tâche active | Session 2026-09-04/05 : re-vérification une par une des 25+2 tâches TODO. 3 reclassées CANCELLED car obsolètes (condition de dépendance jamais remplie ou décision supersédée) ; le reste corrigé et vérifié en conditions réelles (tests unitaires, builds Docker réels, requêtes live sur l'infra Fly.io, navigateur réel). Sans trailer de co-autorat, comme demandé. Détail complet dans les entrées individuelles ci-dessous. |
| Tâches totales | 134 — recompté par comptage réel des statuts dans le document (pas par arithmétique incrémentale, qui avait introduit une erreur le 2026-09-04 — voir historique de session) |
| READY | 0 |
| IN_PROGRESS | 0 |
| BLOCKED | 4 — T5-16, T5-17 (tests facture, dépendent de T5-14/15 maintenant DONE) ; T9-03 (validation légale CGV/RGPD) ; T9-04 (validation comptable TVA, = DB-03). DB-04 (secret git) est une **décision**, pas une tâche BLOCKED de ce compteur — voir §3. |
| TODO | 0 |
| DONE | 110 |
| CANCELLED | 20 (9 + Phase 8 : T8-01..T8-06 + T11-04, T11-05, T11-07, T11-09 supersédées par Fly.io + T3-03 supersédée par la décision MODE DISTANCE, le 2026-09-04/05) |
| P0 restants | 1 (DB-04 — secret réel dans l'historique git d'un dépôt GitHub public, décision propriétaire, voir §3) |
| P1 restants | 2 (npm audit frontend react-router open redirect [nécessite migration v7, breaking change non appliqué par prudence] ; rotation SMTP_USER/SMTP_PASS legacy — Phase 12 T12-10, = DB-04). Tout le reste des P1 identifiés (T5-14, T5-15, T7-05, T9-07, T9-08) sont DONE. |
| Verdict | EN PRODUCTION SUR FLY.IO et fonctionnel (jana-frontend.fly.dev / jana-backend.fly.dev), facturation légale complète (immuable + avoir), backlog de code entièrement traité (0 TODO). **PAS "terminé" pour autant** : DB-04 (P0, décision propriétaire — rotation secret + purge historique git) toujours ouvert, `.github/workflows/deploy.yml` cible un homeserver abandonné (décision propriétaire requise avant tout push, voir T9-08), 3 validations externes bloquantes (légal, comptable, tests facture), catalogue à peupler. |

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
| DB-04 | **P0 — Secret réel (`backend/.env`) committé dans l'historique git (commit `79fccb1`, scrubé plus tard par `a3ce33d` mais jamais purgé), dépôt GitHub `Neruaka/JanaDistribution` confirmé **public** (re-vérifié via l'API GitHub, `"private": false`, 2026-09-04). **Mécanisme exact confirmé (audit 2026-09-04) :** le commit `79fccb1` commente d'abord les 7 lignes `.env*` du `.gitignore` (désactivation volontaire de la protection), puis ajoute `backend/.env` réel dans le même commit ; confirmé être un ancêtre de `origin/develop` (donc réellement poussé). Valeurs concernées : `JWT_SECRET`, `JWT_REFRESH_SECRET` (chaînes de template jamais personnalisées à l'époque de ce commit), `DB_PASSWORD=postgres` (mot de passe par défaut faible), `SMTP_USER`, `SMTP_PASS` — **confirmé le 2026-09-04 qu'il s'agit d'une vraie adresse Gmail personnelle et d'un vrai mot de passe d'application Gmail (format 16 caractères), non d'un placeholder** (valeurs non répétées ici, voir règle §7 docs/workflow/CLAUDE_WORKFLOW.md). C'est la donnée la plus directement exploitable : si ce mot de passe d'application est encore actif, n'importe qui ayant cloné le dépôt public peut envoyer des emails via ce compte Gmail. Rotation nécessaire pour tout secret encore en usage (DB_PASSWORD et SMTP_USER/SMTP_PASS legacy non confirmés comme déjà rotés — priorité la plus haute vu la confirmation ci-dessus ; JWT probablement déjà régénéré via T11-05 mais à confirmer). Recherche exhaustive de l'historique git complet (214 commits, 2026-09-04) : aucun autre secret réel trouvé en dehors de ce commit. Purge de l'historique git (`git filter-repo`/BFG + force-push) = action destructive hors périmètre d'exécution automatique — décision et exécution réservées au propriétaire du dépôt. | Propriétaire | Tout commit/push ultérieur sur ce dépôt tant que la rotation n'est pas confirmée | **BLOCKED — action externe requise, voir T12-10 et Phase 13** |

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
  - [ ] `docs/workflow/PLAN_CORRECTION_AUDIT.md` — T0-01 → DONE, décrémenter P0
  - [ ] `docs/workflow/ETAT_ACTUEL_PROJET.md` — P0-A résolu, mettre à jour journal

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
  - [ ] `docs/workflow/PLAN_CORRECTION_AUDIT.md`, `docs/workflow/ETAT_ACTUEL_PROJET.md`

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
  - [ ] `docs/workflow/PLAN_CORRECTION_AUDIT.md`, `docs/workflow/ETAT_ACTUEL_PROJET.md` — P1-01 résolu

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
  - [ ] `docs/workflow/PLAN_CORRECTION_AUDIT.md`, `docs/workflow/ETAT_ACTUEL_PROJET.md` — P1-03 résolu

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
  - [ ] `docs/workflow/PLAN_CORRECTION_AUDIT.md`, `docs/workflow/ETAT_ACTUEL_PROJET.md` — P1-06 résolu

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
  - [ ] `docs/workflow/PLAN_CORRECTION_AUDIT.md`, `docs/workflow/ETAT_ACTUEL_PROJET.md`

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
  - [ ] `docs/workflow/PLAN_CORRECTION_AUDIT.md`, `docs/workflow/ETAT_ACTUEL_PROJET.md` — P0-D résolu

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
  - [ ] `docs/workflow/PLAN_CORRECTION_AUDIT.md`, `docs/workflow/ETAT_ACTUEL_PROJET.md` — P1-05 résolu

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
  - [ ] `docs/workflow/PLAN_CORRECTION_AUDIT.md`, `docs/workflow/ETAT_ACTUEL_PROJET.md` — P1-04 résolu

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

- **Statut :** CANCELLED (2026-09-04) — condition de dépendance jamais remplie : T3-01 a tranché pour le MODE DISTANCE (rayon 80km, 5€+0.80/km), pas le mode poids. Sans objet tant que cette décision business n'est pas révisée. | **Priorité :** P2 | **Catégorie :** CODE
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

- **Statut :** DONE (2026-09-04) | **Priorité :** P0 (relevé depuis P1 le 2026-09-04, confirmation utilisateur que de vraies factures seront émises à de vrais clients) | **Catégorie :** CODE + DB
- **Fichiers :** `backend/scripts/migrations/0012_facture_immutable_avoir.sql` (nouveau), `backend/scripts/init.sql`
- **Détail :** aucune route UPDATE/DELETE n'existait déjà (confirmé T12-07), mais rien n'empêchait un futur bug ou une route ajoutée par erreur de modifier une facture émise. Migration 0012 : trigger `facture_immutable_guard` bloque toute UPDATE de `facture` hors `statut` (EMISE → ANNULEE, une fois) et `avoir_id` (une fois), et toute DELETE ; trigger `facture_ligne_immutable_guard` rend `facture_ligne` totalement immuable (aucune exception).
- **Vérifié en conditions réelles (SQL direct, pas seulement des mocks) :** tentative de modifier `total_ttc` → rejetée ; tentative de `DELETE` → rejetée ; transition `statut` EMISE → ANNULEE → acceptée ; nouvelle tentative de transition après ANNULEE → rejetée ; `UPDATE facture_ligne` → rejetée ; `avoir_id` réglable une seule fois, tentative de le changer vers une autre valeur → rejetée. Migration appliquée en local et en production (Fly Postgres).

---

### T5-15 — Générer un avoir après remboursement

- **Statut :** DONE (2026-09-04) | **Priorité :** P1 (relevé depuis P2 le 2026-09-04, même raison que T5-14) | **Catégorie :** CODE
- **Fichiers :** `invoice.service.js` (`generateCreditNote`), `invoice.repository.js` (`create` accepte `type`, `linkAvoir`, `findOriginalByCommande`, `getNextNumber(prefix)`), `invoice-pdf.generator.js` (titre AVOIR), `email.service.js` (formulation avoir), `admin.order.routes.js` (branché sur la route de remboursement)
- **Détail :** `generateCreditNote(commandeId, montantTtc, raison)` génère un avoir (montants négatifs, numérotation `AV-` sur la même séquence que les factures) lié à la facture d'origine via `avoir_id`, avec répartition HT/TVA au prorata du taux moyen pondéré de la facture d'origine (le flux de remboursement ne redescend pas au niveau ligne). PDF et email envoyés au client — **couvre au passage T13-12** (absence d'email au client lors d'un remboursement, trouvée par l'audit Phase 13).
- **Deux bugs réels trouvés en testant ce flux de bout en bout** (jamais exercé jusqu'ici — aucune facture n'avait été générée via la vraie route avant cette session) : (1) `generateForOrder()` lisait des colonnes d'adresse inexistantes sur `utilisateur` (l'adresse vit uniquement en JSON sur `commande.adresse_livraison`, figée au moment de l'achat) — corrigé ; (2) l'idempotence de `generateForOrder()` cherchait la dernière facture toutes types confondus (`findByCommande`), donc renvoyait à tort l'avoir au lieu de la facture d'origine dès qu'un avoir existait — corrigé via `findOriginalByCommande` (filtre `type = 'FACTURE'`).
- **Vérifié en conditions réelles (API réelle, environnement de dev local) :** génération facture → remboursement partiel de 20€ → avoir `AV-2026-0002` généré avec montants HT/TVA/TTC corrects, lié à `FAC-2026-0001`, PDF généré, email réellement envoyé (messageId Gmail confirmé) ; nouvelle génération de facture pour la même commande → renvoie bien la facture d'origine (pas l'avoir).
- **Tests :** 139/139 ✓ backend.

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

- **Statut :** DONE (2026-09-04) | **Priorité :** P2 | **Catégorie :** CODE
- **Fichiers :** `backend/src/services/product.service.js`, `backend/src/controllers/product.controller.js`
- **Détail :** `importProducts()` validait déjà les champs au niveau contrôleur (tableau non vide, catégorie par défaut) mais pas ligne par ligne : une ligne Excel sans référence/nom créait silencieusement un produit avec un nom vide, et un prix non numérique tombait à 0€ (`parseFloat(...) || 0`). Ajout d'une validation par ligne (référence/nom obligatoires, prix > 0) qui rejette la ligne dans `results.errors` au lieu de créer un produit invalide, plus un plafond de 1000 lignes par import.

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

- **Statut :** DONE (2026-09-05) | **Priorité :** P1 | **Catégorie :** CODE
- **Fichiers :** `backend/tests/unit/invoice.service.test.js`
- **Détail :** couverture déjà présente pour `generateForOrder()` (arrondi TVA ligne par ligne, reprise du taux figé, absence de NaN) et l'immutabilité des routes. Ajouté cette session : 4 tests pour `generateCreditNote()` (T5-15, jusque-là sans aucune couverture) — absence de facture d'origine (pas d'exception), proratisation HT/TVA au taux moyen avec montants négatifs, remboursement total annulant exactement HT/TVA, garde-fou division par zéro. `invoice.service.js` : 92,3% statements (contre couverture partielle avant). 143/143 tests passent.

---

### T7-06 — Tests race condition stock

- **Statut :** DONE (2026-07-04 — suite complète, 3 tests) | **Priorité :** P2 | **Catégorie :** CODE
- **Fichiers :** `backend/tests/integration/stock.concurrent.test.js` — 2/10/8 achats concurrents via `SELECT ... FOR UPDATE`, une seule réussite sur dernier stock — nécessite Docker (`npm run test:integration`)

---

### T7-07 — Tests E2E tunnel de commande (Playwright)

- **Statut :** DONE (2026-09-05) | **Priorité :** P2 | **Catégorie :** CODE
- **Dépendances :** T7-01, T5-07 (tous deux DONE)
- **Fichiers :** `frontend/playwright.config.js`, `frontend/e2e/checkout.spec.js`, `frontend/package.json` (script `test:e2e`)
- **Détail :** premier E2E Playwright du projet (aucune infra existante). Parcours réel piloté via l'UI : inscription (setup via API), connexion, ajout au panier, panier → checkout, remplissage formulaire, acceptation CGV, soumission, vérification de la page de confirmation avec numéro de commande. Nécessite la stack dev démarrée (`docker compose up`, produits seedés) — même contrat que `test:integration` côté backend. **3 exécutions consécutives réussies** (aucune flakiness), 3 commandes réelles créées en base (`CMD-20260904-0005/6/7`). Deux bugs de stabilisation trouvés et documentés en commentaire dans le test (pas des bugs applicatifs) : le montant minimum de commande (15€ TTC) exclut les produits bon marché du panier de test ; chaque `page.goto()` recharge la page et relance `AuthProvider` de façon asynchrone (`GET /auth/me`), un clic prématuré tombe sur le toast "Connectez-vous" — geré avec `waitForLoadState('networkidle')`. **Effet de bord découvert en testant** : le rate limiter `/api/auth` (20/15min, partagé par `/auth/me`) peut déconnecter silencieusement un utilisateur légitime dont le token est valide si son quota est épuisé (ex. onglets multiples, navigation agressive) — comportement du rate limiter tel que conçu, pas un bug de ce test, mais à garder à l'esprit si des faux logouts sont signalés en usage réel.

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

## Phase 11 — Migration Railway → Homeserver (`tfredklab.dev`) — SUPERSÉDÉE

> **⚠️ Décision utilisateur (2026-09-04) : le homeserver auto-géré est abandonné au profit
> d'un hébergeur managé (Fly.io), voir Phase 14 ci-dessous.** Cette phase est conservée
> pour l'historique (infrastructure Docker/Caddy/Cloudflare Tunnel déployée et documentée
> dans `docs/deploiement/DEPLOY-HOMESERVER.md`) mais n'est plus le chemin de production
> actif — T11-04, T11-05, T11-07, T11-09 ne seront plus poursuivis sur cette base.
>
> Remplace la Phase 8. Railway EN PAUSE (plan expiré) — hébergement auto-géré
> sur le homeserver personnel de l'utilisateur (Debian 13, Docker Compose,
> Caddy, Cloudflare Tunnel). Détails complets : `docs/deploiement/DEPLOY-HOMESERVER.md`.
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

- **Statut :** CANCELLED (2026-09-04) — Phase 11 (homeserver) supersédée par Phase 14 (Fly.io), voir décision utilisateur | **Priorité :** P0 | **Catégorie :** ACTION EXTERNE
- **Action (historique, non réalisée) :** Zero Trust → Networks → Tunnels → "homeserver" → Public Hostname → ajouter `jana.tfredklab.dev` et `jana-api.tfredklab.dev` → `localhost:80`. Tunnel géré à distance via token (pas de config.yml local éditable par SSH).

---

### T11-05 — Générer secrets prod + .env homeserver

- **Statut :** CANCELLED (2026-09-04) — Phase 11 (homeserver) supersédée par Phase 14 (Fly.io) ; l'équivalent Fly (secrets régénérés from scratch + Gmail configuré) est fait, voir T14-03 et T14-04 | **Priorité :** P0 | **Catégorie :** CONFIGURATION + ACTION EXTERNE
- **Fait (historique, sur le homeserver abandonné) :** `JWT_SECRET`, `JWT_REFRESH_SECRET`, `POSTGRES_PASSWORD` générés directement sur le homeserver (`openssl rand -hex 32/24`, jamais transités par ce poste ni affichés). `.env` aligné sur Gmail SMTP.

---

### T11-06 — Script sauvegarde PostgreSQL + test restauration

- **Statut :** DONE (2026-07-26) | **Priorité :** P1 | **Catégorie :** CODE + CONFIGURATION
- **Fichier (hors dépôt git) :** `/opt/docker/jana/backup-postgres.sh` — `pg_dump` + gzip, rotation 14 jours, cron `0 3 * * *`
- **Test :** Restauration validée dans une base temporaire (17 tables restaurées avec succès, puis nettoyée).

---

### T11-07 — Monitoring Uptime Kuma

- **Statut :** CANCELLED (2026-09-04) — Phase 11 (homeserver) supersédée par Phase 14 (Fly.io) ; monitoring à reconsidérer pour `jana-frontend.fly.dev`/`jana-backend.fly.dev` si besoin (nouvelle tâche, pas celle-ci) | **Priorité :** P2 | **Catégorie :** ACTION EXTERNE
- **Action (historique, non réalisée) :** Ajouter 2 moniteurs HTTP(s) dans `status.tfredklab.dev` : `https://jana.tfredklab.dev` et `https://jana-api.tfredklab.dev/api/health`. Pas d'API REST stable en Uptime Kuma v1 pour automatiser sans session authentifiée.

---

### T11-08 — Déploiement CI/CD réel

- **Statut :** DONE (2026-07-26) — décision utilisateur : clé SSH dédiée en secret GitHub (transport via Tailscale) | **Priorité :** P1 | **Catégorie :** CODE + CONFIGURATION
- **Fichier modifié :** `.github/workflows/deploy.yml` — simplifié à un seul job (déclenché sur push `develop`, plus de split staging/production factice), étapes : connexion Tailscale (`tailscale/github-action`) puis SSH vers le homeserver.
- **Sécurité :** clé SSH dédiée installée dans `authorized_keys` du homeserver avec **forced command** (`command="..."`) restreignant son usage au seul pipeline de déploiement, aucun accès shell interactif même en cas de fuite.
- **Reste à faire (action externe utilisateur) :** créer les 4 secrets GitHub (`TS_AUTHKEY`, `HOMESERVER_TAILSCALE_IP`, `HOMESERVER_SSH_USER`, `HOMESERVER_SSH_KEY`).

---

### T11-09 — Cutover final Railway → homeserver

- **Statut :** CANCELLED (2026-09-04) — remplacé par la mise en production Fly.io (Phase 14, T14-07), voir décision utilisateur | **Priorité :** P0 | **Catégorie :** VALIDATION
- **Objectif (historique, non réalisé) :** Valider le flux commande complet sur `jana.tfredklab.dev`, puis bascule DNS finale et arrêt (pas suppression) de Railway.

---

### T11-10 — Synchronisation documentaire complète

- **Statut :** DONE (2026-07-26) | **Priorité :** P1 | **Catégorie :** DOCUMENTATION
- **Fichiers :** `backend/railway.json` + `frontend/railway.json` supprimés, `docs/deploiement/DEPLOY-HOMESERVER.md` créé, `docs/deploiement/DEPLOY-RAILWAY.md` + `docs/deploiement/RAILWAY_CONFIG_READY.md` marqués obsolètes (bandeau, conservés en référence historique tant que Railway reste actif), `CLAUDE.md` mis à jour (déploiement homeserver, Phase 11), `docs/workflow/ETAT_ACTUEL_PROJET.md` et `docs/workflow/PLAN_CORRECTION_AUDIT.md` (ce fichier) mis à jour.

---

### Phase 9 — Go-live

Checklist complète : `docs/audit-finalisation/14_CHECKLIST_GO_LIVE.md`

---

### T9-01 — Test complet flux commande en staging (Stripe test)

- **Statut :** CANCELLED (2026-07-02) — remplacé par un test du flux ESPECES/VIREMENT/CHEQUE (pas de Stripe) | **Priorité :** P0 | **Dépendances :** T8-01, T8-02

---

### T9-02 — Vérification variables d'environnement production

- **Statut :** DONE (2026-09-05) | **Priorité :** P0 | **Catégorie :** CONFIGURATION
- **Détail :** vérifié directement sur Fly.io (`flyctl secrets list`, `flyctl apps list`), pas seulement documenté. `jana-backend` : `DATABASE_URL`, `JWT_SECRET`/`JWT_REFRESH_SECRET` (digests distincts confirmés), `CORS_ORIGIN`, `FRONTEND_URL`, `NODE_ENV`, `BCRYPT_SALT_ROUNDS`, `REDIS_URL`, `GMAIL_APP_PASSWORD`/`GMAIL_SENDER_EMAIL`/`GMAIL_SENDER_NAME` (migration Brevo→Gmail SMTP), `ENTREPRISE_*` (mentions légales factures) tous présents et déployés ; aucune clé `STRIPE_*` résiduelle (cohérent avec le retrait de Stripe). Healthcheck production répond `environment: production, database: up`. CORS testé en conditions réelles : `Origin` légitime (`jana-frontend.fly.dev`) reflété, `Origin` arbitraire non reflété (pas de wildcard). `jana-frontend/fly.toml` : `VITE_API_URL` pointe vers le bon backend.

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

- **Statut :** DONE (2026-09-05) | **Priorité :** P0 | **Dépendances :** T8-04
- **Détail :** vérifié directement sur Fly.io (`flyctl volumes show`). Le volume Postgres `pg_data` (app `jana-db`) a `Scheduled snapshots: true` (snapshots automatiques quotidiens actifs). Première sauvegarde manuelle déclenchée pendant cette session (`flyctl volumes snapshots create`) pour ne pas dépendre uniquement du premier cycle automatique. **Point d'attention non bloquant :** rétention par défaut à **5 jours** (`Snapshot retention: 5`), sous la recommandation de 30 jours minimum de la checklist — décision de coût/rétention à trancher par le propriétaire (`flyctl volumes update <id> --snapshot-retention <jours>`, augmente le stockage facturé). Stockage images produits sur volume persistant confirmé (`jana_uploads`, app `jana-backend`) ; procédure de restauration non testée (nécessiterait de restaurer un snapshot sur un volume de test, hors scope de cette session).

---

### T9-07 — npm audit --production sans CVE critique

- **Statut :** DONE (2026-09-05) | **Priorité :** P1 | **Dépendances :** T1-06
- **Détail :** `npm audit --production` exécuté sur backend et frontend : aucune CVE critique dans les deux. Backend : 1 moderate (uuid, transitif). Frontend : la vulnérabilité `brace-expansion` (high, DoS) corrigée via `npm audit fix` (non-breaking, build re-vérifié) ; restent 2 moderate connues et déjà trackées (react-router — voir P1 restants §1, nécessite migration v7 ; uuid via exceljs, import Excel admin uniquement).

---

### T9-08 — Documentation déploiement à jour

- **Statut :** DONE (2026-09-05) | **Priorité :** P1
- **Détail :** `CLAUDE.md` (ligne "Déploiement") pointait encore vers le homeserver comme cible active alors que la Phase 11 a été supersédée par la Phase 14 (Fly.io) le 2026-09-04 — corrigé, plus de pourcentage d'avancement figé (source unique : ce fichier §1). Bandeaux "SUPERSÉDÉ" ajoutés sur `docs/deploiement/DEPLOY-HOMESERVER.md` et la section deploy de `docs/deploiement/README-CI-CD.md`. **Risque réel trouvé le 2026-09-05, corrigé le jour même sur autorisation explicite du propriétaire :** `.github/workflows/deploy.yml` se déclenchait sur chaque push `develop` et tentait de joindre le homeserver abandonné (Tailscale + SSH) — déclencheur `push` retiré, ne reste que `workflow_dispatch` manuel ; en-tête du fichier documente la désactivation et pourquoi (Fly.io déployé manuellement via `flyctl deploy`, décision délibérée de ne pas dépendre de GitHub Actions).

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
- **Fichiers :** `docs/workflow/ETAT_ACTUEL_PROJET.md`, `docs/audit-finalisation/12_STRATEGIE_TESTS.md`

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

### T12-11 — Réécriture `docs/checklists/CHECKLIST_TEST_LOCAL.md`
- **Statut :** DONE (2026-07-26) | **Priorité :** P2 | **Catégorie :** DOC
- **Détail :** sections Stripe (webhook, Stripe CLI, cartes de test) supprimées, remplacées par le parcours réel (commande → statut positionné manuellement par un admin ESPECES/VIREMENT/CHEQUE → email → facture). Sections auth/panier/upload R2/livraison DISTANCE/admin conservées et enrichies des durcissements de cette session (idempotence, cloisonnement rôles, audit_log). Section tests d'intégration réels ajoutée.

### T12-12 — Figer `docs/audit-finalisation/14_CHECKLIST_GO_LIVE.md`
- **Statut :** DONE (2026-07-26) | **Priorité :** P2 | **Catégorie :** DOC
- **Détail :** bandeau renforcé (« FIGÉ — ne plus mettre à jour »), pointe désormais uniquement vers `docs/workflow/ETAT_ACTUEL_PROJET.md` comme source de vérité go-live. `docs/checklists/RESTE_A_FAIRE_PROD.md` (lui aussi partiellement obsolète, antérieur à la migration homeserver) a reçu le même bandeau pour éviter toute checklist go-live contradictoire.

### T12-13 — Synchronisation documentaire finale Phase 12
- **Statut :** DONE (2026-07-26) | **Priorité :** P1 | **Catégorie :** DOC
- **Détail :** cette section, le tableau de bord (§1) et la décision bloquante DB-04 (§3) constituent la synchronisation finale. Voir `docs/workflow/ETAT_ACTUEL_PROJET.md` pour le bilan de session complet et le §13 mis à jour.
- **Points restés BLOCKED nécessitant une décision externe avant go-live final (T11-09) :**
  1. **DB-04 (P0, nouveau)** — rotation des secrets exposés dans l'historique git + décision propriétaire sur la purge d'historique (voir §3).
  2. **DB-03** — validation comptable définitive des taux de TVA (toujours ouverte, non traitée par cette session).
  3. Mécanisme d'avoir pour factures émises — non implémenté (T12-07), nouvelle fonctionnalité hors périmètre de durcissement.
  4. Rotation confirmée de `SMTP_USER`/`SMTP_PASS` legacy — à vérifier explicitement (T12-10).
  5. T11-04, T11-07 — actions externes utilisateur déjà trackées en Phase 11, non dupliquées ici.

---

## Phase 13 — Audit fonctionnel et sécurité complémentaire (2026-09-04)

> Audit read-only mené en 4 investigations parallèles (sécurité backend, logique métier backend, sécurité/cohérence frontend, infrastructure/config), chacune recoupée systématiquement avec cette même page avant de signaler un point comme nouveau. Rapport complet : voir l'artefact "Audit Sécurité Jana" publié le 2026-09-04. Aucune régression trouvée sur les points DONE de Phase 12 ; DB-04 confirmé et précisé (voir §3).

### T13-01 — Path traversal sur la suppression d'image produit
- **Statut :** DONE (2026-09-04) | **Priorité :** P1 | **Catégorie :** SÉCURITÉ | **Domaine :** Backend/Cybersécurité
- **Fichiers :** `backend/src/validators/product.validator.js` (`filenameParam`, nouveau), `backend/src/routes/product.routes.js` (validator branché sur `DELETE /image/:filename`), `backend/src/middlewares/upload.middleware.js` (`deleteImage` durci en défense en profondeur : `path.basename()` + vérification que le chemin résolu reste sous `UPLOAD_DIR`)
- **Vérifié en conditions réelles :** `DELETE /api/products/image/..%2f..%2fsrc%2findex.js` avec un token admin valide → `400 "Nom de fichier invalide"` (avant le correctif, ce chemin aurait tenté de supprimer le fichier). Un nom de fichier légitime (`product_<uuid>.jpg`) continue de fonctionner normalement.
- **Tests :** `tests/integration/product.routes.test.js` mis à jour (mock validator manquait `filenameParam`, causait un crash au chargement des routes) — 139/139 ✓.

### T13-02 — Filtre d'upload contournable → XSS stocké possible (mode disque local)
- **Statut :** DONE (2026-09-04) | **Priorité :** P1 | **Catégorie :** SÉCURITÉ | **Domaine :** Backend/Cybersécurité
- **Fichiers :** `backend/src/middlewares/upload.middleware.js` (`MIME_TO_EXTENSION`, `FILE_SIGNATURES`/`matchesFileSignature`, `verifyImageSignature` — nouveaux), `backend/src/routes/product.routes.js` (`verifyImageSignature` branché entre `productImageUpload.single('image')` et `uploadToR2`)
- **Correctif appliqué (double défense) :** (1) l'extension de stockage est désormais dérivée du `mimetype` validé par la whitelist (`MIME_TO_EXTENSION`), plus jamais de `file.originalname` (attaquant-contrôlé) ; (2) `verifyImageSignature` lit les premiers octets du fichier réellement écrit sur disque et vérifie une signature binaire (magic bytes JPEG/PNG/GIF/WEBP) correspondant à un des formats autorisés — sans dépendance externe (implémentation manuelle, pas de `file-type`). Rejette et supprime le fichier si le contenu réel ne correspond à aucune signature connue, indépendamment du `Content-Type` déclaré.
- **Vérifié en conditions réelles :** upload d'un fichier contenant `<script>alert(1)</script>` avec `Content-Type: image/png` déclaré → `400 "Le contenu du fichier ne correspond pas à une image valide."`, fichier absent du disque après coup (confirmé). Upload d'un vrai PNG (signature `\x89PNG...` valide) → accepté par la vérification (échec constaté ensuite au niveau R2, cause indépendante : bucket R2 mal configuré dans cet environnement de dev, hors périmètre de ce correctif).

### T13-03 — Régression `npm audit` backend : CVE en production (express/body-parser/qs)
- **Statut :** DONE (2026-09-04) | **Priorité :** P1 | **Catégorie :** CODE | **Domaine :** Backend
- **Fichiers :** `backend/package.json` (`overrides.qs: "^6.16.0"`), `backend/package-lock.json`
- **Détail :** `npm audit fix` seul n'a pas suffi — `express@4.22.2` (dernière version 4.x publiée) pin `qs@~6.15.1` en interne, hors de la plage patchée par l'avis de sécurité (`qs` vulnérable jusqu'à 6.15.3 inclus, corrigé en 6.16.0). Un override npm (`overrides.qs`) force la résolution vers `6.16.0` sans attendre une éventuelle mise à jour d'express — bump mineur de `qs`, non-breaking, compatible avec l'API utilisée par `body-parser`/`express`.
- **Résultat vérifié :** `npm audit --production` : 0 vulnérabilité sur `express`/`body-parser`/`qs` (auparavant 3 modérées). Il reste 1 CVE modérée sur `uuid@9.x` (dépendance directe de production, utilisée uniquement via `uuidv4()` sans le paramètre `buf` — le seul chemin réellement vulnérable de l'avis CVE-GHSA-w5hq-g745-h8pq porte sur `v3()/v5()/v6()` avec `buf` fourni, non utilisé dans ce code) ; correctif nécessiterait un bump majeur (`uuid@14`, breaking), non appliqué ici faute d'exploitabilité réelle — à réévaluer si le périmètre d'usage de `uuid` change.
- **Tests :** 139/139 ✓ après `npm install` (override appliqué).

### T13-04 — Remboursements partiels non cumulatifs (sur-remboursement possible)
- **Statut :** DONE (2026-09-04) | **Priorité :** P1 | **Catégorie :** CODE | **Domaine :** E-commerce/Backend
- **Décision produit (utilisateur, 2026-09-04) :** les remboursements partiels doivent se cumuler et être plafonnés strictement au total TTC de la commande — jamais un remplacement du dernier montant.
- **Fichiers :** `backend/src/repositories/order.repository.js` (`updateRefund` remplacée par `addRefund` — transaction + `SELECT ... FOR UPDATE` pour éviter qu'un remboursement concurrent dépasse le plafond), `backend/src/routes/admin.order.routes.js` (route `/refund` simplifiée, la logique de cumul/plafond vit désormais uniquement dans le repository ; `montant_rembourse` ajouté aux deux réponses GET commande admin — champ auparavant absent de toutes les réponses API), `backend/src/repositories/order.repository.js#_mapOrder` (`montantRembourse` exposé), `frontend/src/pages/admin/AdminOrderDetail.jsx` (bouton/modal de remboursement pré-remplis avec le **reste à rembourser** au lieu du total complet, affichage "Déjà remboursé : X€", `canRefund` exige désormais `resteARembourser > 0`)
- **Vérifié en conditions réelles (curl, séquence complète sur une commande à 51,05€ TTC) :** remboursement de 20€ → cumul 20€ ; second remboursement de 20€ → cumul **40€** (pas écrasé à 20€) ; troisième tentative de 20€ (40+20=60 > 51,05) → **rejeté 400** avec message explicite du cumul ; remboursement du solde exact (11,05€) → cumul 51,05€, statut bascule correctement en `REMBOURSE`. Vérifié également que `montantRembourse` (auparavant absent) apparaît bien dans la réponse `GET /api/admin/orders/:id` et s'affiche dans l'UI admin ("Déjà remboursé : 51,05 €").
- **Tests :** 139/139 ✓ (aucun test unitaire/intégration dédié au cumul — dette de test à combler si ce flux devient critique). `npm run build` frontend ✓.

### T13-05 — Changement de mot de passe ne révoque aucune session active
- **Statut :** DONE (2026-09-04) | **Priorité :** P1 | **Catégorie :** SÉCURITÉ | **Domaine :** Backend/Cybersécurité
- **Fichiers :** `backend/src/services/auth.service.js` (`changePassword`, `resetPassword`)
- **Correctif appliqué :** `revokeAllUserRefreshTokens(userId)` (déjà implémentée pour T2-05, jusqu'ici jamais appelée) est désormais invoquée à la fin de `changePassword()` et de `resetPassword()` — tout refresh token émis avant le changement de mot de passe est révoqué en base, coupant l'accès sur les autres appareils/sessions.
- **Tests :** 139/139 ✓ (aucun test unitaire dédié à cette invocation — à ajouter en dette technique si un durcissement supplémentaire est fait sur `auth.service.js`).

### T13-06 — Le franco de port désactive le contrôle de zone de livraison à 80km
- **Statut :** DONE (2026-09-04) | **Priorité :** P1 | **Catégorie :** CODE | **Domaine :** E-commerce/Backend
- **Fichiers :** `backend/src/services/order.service.js` (bloc de calcul des frais de livraison, `createOrder`)
- **Correctif appliqué :** la vérification `computeDistanceShipping()`/`hors_zone` en mode `DISTANCE` n'est plus conditionnée à `totalPanierTtc < seuil_franco` — elle s'exécute désormais systématiquement dès que le mode `DISTANCE` est actif, indépendamment du montant de la commande. Le franco de port continue de mettre les frais à 0 (via `getFraisLivraison()`, inchangée), mais ne dispense plus jamais du contrôle de zone livrable. Coût additionnel négligeable : `computeDistanceShipping()` peut être appelée une seconde fois dans le même flux (une fois pour la zone, une fois pour le tarif via `getFraisLivraison`), mais `geocodingService` cache déjà les géocodages 24h en mémoire.
- **Tests :** 139/139 ✓ (aucun test existant n'exerçait ce chemin avec mode `DISTANCE` + franco atteint — dette de test à combler si ce flux devient critique).

### T13-07 — Messages d'erreur checkout écrasés par un message générique anglais
- **Statut :** DONE (2026-09-04) | **Priorité :** P1 | **Catégorie :** CODE | **Domaine :** Frontend
- **Fichiers :** `frontend/src/pages/CheckoutPage.jsx`
- **Correctif appliqué :** `toast.error(error.message || ...)` → `toast.error(error.response?.data?.message || ...)`, aligné sur le pattern déjà utilisé dans `CartContext`/`AuthContext`/`useOrdersAdmin`. Une commande qui échoue affiche désormais le message métier français du backend (stock insuffisant, promo expirée, hors zone…) plutôt qu'un message Axios technique en anglais.
- **Build :** `npm run build` ✓ sans erreur.

### T13-08 — `PUT /api/admin/settings` contourne la validation appliquée ailleurs
- **Statut :** DONE (2026-09-04) | **Priorité :** P2 | **Catégorie :** CODE | **Domaine :** Backend
- **Fichiers :** `backend/src/services/settings.service.js`
- **Détail :** `updateAll()` appelle désormais `_validateSettings()` pour chaque catégorie (`delivery`, `orders`, `emails`) avant persistance, comme `updateCategory()`. Un admin ne peut plus pousser des valeurs invalides (frais négatifs, email malformé) via cette route.

### T13-09 — Révocation de refresh token silencieusement inopérante si l'écriture DB échoue
- **Statut :** DONE (2026-09-04) | **Priorité :** P2 | **Catégorie :** SÉCURITÉ | **Domaine :** Backend/Cybersécurité
- **Fichiers :** `backend/src/services/auth.service.js:232-253`
- **Détail :** `refreshTokens()` passe en fail-closed : si `findRefreshToken()` ne retrouve pas le hash en DB (stockage silencieusement échoué au login, ou erreur de lecture), la requête est rejetée (`401 Session introuvable`) au lieu de se fier à la seule signature JWT valable 30 jours.

### T13-10 — Recherche produits et import Excel hors du rate limiting dédié
- **Statut :** DONE (2026-09-04) | **Priorité :** P2 | **Catégorie :** SÉCURITÉ | **Domaine :** Backend
- **Fichiers :** `backend/src/routes/product.routes.js`
- **Détail :** ajout de deux limiteurs dédiés : `GET /api/products/search` (60/15min, public non authentifié) et `POST /api/products/admin/import` (10/15min, admin) en plus du plafond global générique (300/15min).

### T13-11 — `jwt.verify` sans `algorithms` épinglé explicitement
- **Statut :** DONE (2026-09-04) | **Priorité :** P2 | **Catégorie :** SÉCURITÉ | **Domaine :** Backend
- **Fichiers :** `backend/src/middlewares/auth.middleware.js:35,88`, `backend/src/services/auth.service.js:560,576`
- **Détail :** les 4 appels `jwt.verify()` du projet épinglent désormais `{ algorithms: ['HS256'] }`, éliminant tout risque de confusion d'algorithme (`alg: none`, RS256→HS256).

### T13-12 — Aucun email envoyé au client lors d'un remboursement
- **Statut :** DONE (2026-09-04, résolu comme effet de bord de T5-15) | **Priorité :** P2 | **Catégorie :** CODE | **Domaine :** E-commerce/Backend
- **Détail :** `invoiceService.generateCreditNote()` (T5-15) envoie désormais systématiquement un email au client avec le PDF de l'avoir à chaque remboursement — vérifié en conditions réelles (messageId Gmail confirmé dans les logs). Plus besoin de correctif dédié.

### T13-13 — Code promo à usage unique jamais libéré si la commande est annulée
- **Statut :** DONE (2026-09-04) | **Priorité :** P2 | **Catégorie :** CODE | **Domaine :** E-commerce/Backend
- **Fichiers :** `backend/src/repositories/order.repository.js` (`cancel`)
- **Détail :** `cancel()` supprime désormais la ligne `code_promo_utilisation` liée à la commande dans la même transaction que la restauration de stock — le client récupère son usage et les stats admin restent correctes.

### T13-14 — Changement de statut de commande sans verrou (race condition)
- **Statut :** DONE (2026-09-04) | **Priorité :** P2 | **Catégorie :** CODE | **Domaine :** E-commerce/Backend
- **Fichiers :** `backend/src/repositories/order.repository.js` (`updateStatus`), `backend/src/services/order.service.js` (`updateStatus`)
- **Détail :** `updateStatus()` du repository verrouille désormais la ligne (`SELECT ... FOR UPDATE`) dans une transaction et revérifie le statut attendu (`expectedStatut`, passé par le service) avant d'écrire — sinon `409 Conflict`. Deux requêtes admin concurrentes sur la même commande se sérialisent au lieu de produire un résultat incohérent.

### T13-15 — Incohérence HT/TTC dans `getGlobalStats()` (route actuellement morte)
- **Statut :** DONE (2026-09-04) | **Priorité :** P2 | **Catégorie :** CODE | **Domaine :** Backend
- **Fichiers :** `backend/src/repositories/stats.repository.js`
- **Détail :** `ca_total` utilisait `SUM(total_ttc)` alors que `getDashboardStats()` calcule le chiffre d'affaires en HT (`total_ht`) — aligné sur le même champ pour cohérence avant tout câblage futur de cette route.

### T13-16 — Message "Email ou mot de passe incorrect" trompeur en cas de panne réseau
- **Statut :** DONE (2026-09-05) | **Priorité :** P2 | **Catégorie :** CODE | **Domaine :** Frontend
- **Fichiers :** `frontend/src/contexts/AuthContext.jsx`
- **Détail :** `login()` distingue désormais `err.response` absent (panne réseau/timeout → "Connexion impossible, vérifiez votre réseau") de `err.response` présent (identifiants réellement rejetés par le backend).

### T13-17 — Case "Rester connecté sur cet appareil" entièrement décorative
- **Statut :** DONE (2026-09-05) | **Priorité :** P2 | **Catégorie :** CODE | **Domaine :** Frontend
- **Fichiers :** `frontend/src/pages/LoginPage.jsx`, `frontend/src/contexts/AuthContext.jsx`, `frontend/src/services/api.js`
- **Détail :** implémentée : `login(email, motDePasse, rememberMe)` transmet le flag à `setAuthData(..., persist)` qui écrit en `localStorage` (persisté) ou `sessionStorage` (session courante) selon le choix. La rotation silencieuse du refresh token (sans `persist` explicite) préserve désormais le stockage déjà utilisé pour chaque clé au lieu de retomber en session-only au premier refresh — bug qu'une implémentation naïve aurait introduit.

### T13-18 — Aucun Error Boundary React global
- **Statut :** DONE (2026-09-05) | **Priorité :** P2 | **Catégorie :** CODE | **Domaine :** Frontend
- **Fichiers :** `frontend/src/components/ErrorBoundary.jsx` (nouveau), `frontend/src/main.jsx`
- **Détail :** `ErrorBoundary` (composant classe, seule API React pour ça) enveloppe `<BrowserRouter><App /></BrowserRouter>` dans `main.jsx` — une exception de rendu affiche un écran de récupération (recharger / retour accueil) au lieu d'une page blanche.

### T13-19 — Validation de mot de passe incohérente entre inscription et changement de mot de passe
- **Statut :** DONE (2026-09-05) | **Priorité :** P2 | **Catégorie :** CODE | **Domaine :** Frontend
- **Fichiers :** `frontend/src/components/mon-compte/TabSecurite.jsx`
- **Détail :** `handleSubmit()` applique désormais les mêmes règles que `RegisterPage.jsx` (minuscule, majuscule, chiffre, caractère spécial), pas seulement la longueur minimale.

### T13-20 — Aucun header de sécurité HTTP (CSP/HSTS/X-Frame-Options)
- **Statut :** DONE partiellement (2026-09-05) | **Priorité :** P2 | **Catégorie :** INFRA | **Domaine :** Infrastructure
- **Fichiers :** `frontend/nginx.conf`
- **Détail :** `nginx.conf` ajoute désormais `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security` et un `Content-Security-Policy` (testé : build Docker réel + conteneur lancé, `nginx -t` OK, headers vérifiés via `curl -I`, page chargée dans un navigateur réel sans violation CSP en console). La config Caddy réelle du homeserver (hors dépôt, `docs/deploiement/DEPLOY-HOMESERVER.md` §9) n'est pas modifiable depuis ce dépôt — mêmes headers à répliquer manuellement si ce chemin de déploiement est encore utilisé.

### T13-21 — Node.js 20 en fin de vie depuis avril 2026
- **Statut :** DONE (2026-09-05) | **Priorité :** P2 | **Catégorie :** INFRA | **Domaine :** Infrastructure
- **Fichiers :** `backend/Dockerfile`, `backend/Dockerfile.dev`, `frontend/Dockerfile`, `frontend/Dockerfile.dev`
- **Détail :** migré vers `node:22-alpine` sur les 4 Dockerfiles (prod + dev, backend + frontend étaient sur deux fichiers distincts). Vérifié en conditions réelles : rebuild complet de la stack dev (`docker compose build backend frontend`), conteneurs relancés (`node --version` confirme v22.22.3), 139/139 tests backend passent dans le conteneur, frontend chargé et fonctionnel dans un navigateur réel.

### T13-22 — `.gitignore` sans filet pour certificats, clés SSH, dumps DB
- **Statut :** DONE (2026-09-05) | **Priorité :** P3 | **Catégorie :** INFRA | **Domaine :** Infrastructure
- **Fichiers :** `.gitignore` (racine)
- **Détail :** ajout de `*.pem`, `*.key`, `*.crt`, `*.p12`, `*.pfx`, `id_rsa`, `id_rsa.pub`, `*.sql.gz`, `*.dump`, `*.bak`. Vérifié : aucun fichier tracké ne correspondait à ces patterns (pas de perte accidentelle).

### T13-23 — Ports PostgreSQL/Redis exposés dans le compose de développement du dépôt
- **Statut :** DONE partiellement (2026-09-05) | **Priorité :** P3 | **Catégorie :** INFRA | **Domaine :** Infrastructure
- **Fichiers :** `docker-compose.yml`
- **Détail :** Redis restreint à `127.0.0.1:6379:6379`, vérifié (conteneur sain, backend s'y connecte toujours). PostgreSQL laissé en `0.0.0.0:5432:5432` : en conditions réelles sur ce poste de dev, un service PostgreSQL natif Windows préexistant squatte déjà `0.0.0.0:5432` et empêche Docker de réserver le loopback exclusivement (`bind: An attempt was made to access a socket in a way forbidden by its access permissions` à la tentative `127.0.0.1:5432:5432`) — confirmé en revenant au binding non restreint (fonctionne) puis en testant le binding restreint isolément (échoue). Sans impact en production (le compose réel n'expose aucun port sur l'hôte) ; à restreindre en `127.0.0.1` sur tout hôte sans ce conflit natif.

### T13-24 — Validateur de statut de commande accepte des valeurs toujours rejetées ensuite
- **Statut :** DONE (2026-09-05) | **Priorité :** P3 | **Catégorie :** CODE | **Domaine :** Backend
- **Fichiers :** `backend/src/routes/admin.order.routes.js`
- **Détail :** `REMBOURSE`/`PARTIELLEMENT_REMBOURSE` retirés de la whitelist `isIn(...)` — vérifié qu'aucune entrée de `STATUT_TRANSITIONS` ne les autorise comme cible (le vrai chemin reste `POST /:id/refund`).

### Constats factuels de l'audit (non actionnables, pour mémoire)
- **Prix panier hybride :** figé pour le prix normal (capturé à l'ajout au panier), dynamique pour le prix promo (relu en base au passage en caisse) — comportement voulu par l'architecture actuelle, pas un bug. `backend/src/repositories/cart.repository.js:409-441`.
- **Pas de panier invité :** toutes les routes `/api/cart/*` exigent une authentification, le frontend bloque explicitement l'ajout au panier sans connexion — il n'y a donc rien à fusionner à la connexion, contrairement à l'hypothèse initiale de l'audit. Non actionnable.

---

## Phase 14 — Mise en production sur Fly.io (2026-09-04)

> Remplace la Phase 11 (homeserver abandonné, décision utilisateur). Hébergeur managé
> choisi pour son coût quasi-nul (~5-10€/mois estimé), l'absence de dépendance à un
> repository GitHub connecté (déploiement par `flyctl deploy` depuis une image Docker
> locale — le dépôt GitHub peut être supprimé sans casser le déploiement), et parce
> qu'un seul compte héberge front + back + Postgres + Redis. Org Fly : `personal`,
> région `cdg` (Paris).

### T14-01 — Provisionner Postgres, Redis, apps frontend/backend

- **Statut :** DONE (2026-09-04) | **Priorité :** P0 | **Catégorie :** INFRA
- **Ressources créées :**
  - `jana-db` — Fly Postgres (flex), 1 nœud, `shared-cpu-1x`, volume 1GB, région `cdg`. Réseau privé uniquement (`jana-db.flycast`), aucun port exposé publiquement.
  - `jana-redis` — Upstash Redis via Fly, plan pay-as-you-go ($0.20/100K commandes, pas de coût fixe), éviction activée.
  - `jana-backend` — app Fly, `shared-cpu-1x` / 512MB, 1 machine (scale down depuis 2 par défaut pour limiter le coût), health check sur `/api/health`.
  - `jana-frontend` — app Fly (Nginx statique), `shared-cpu-1x` / 256MB, 1 machine.
  - `jana-db` attachée à `jana-backend` via `flyctl postgres attach` (crée automatiquement une base + rôle dédiés `jana_backend`, injecte `DATABASE_URL` en secret).
- **Fichiers ajoutés :** `backend/fly.toml`, `frontend/fly.toml`.

### T14-02 — Bug réel trouvé : nginx frontend proxyait vers un hostname Docker Compose inexistant sur Fly

- **Statut :** DONE (2026-09-04) | **Priorité :** P0 | **Catégorie :** CODE
- **Fichier :** `frontend/nginx.conf`
- **Détail :** les blocs `location ^~ /api/` et `location ^~ /uploads/` faisaient `proxy_pass http://backend:3000` — un hostname qui n'existe que dans le réseau Docker Compose local (nom du service). Sur Fly (apps séparées), nginx tentait de résoudre ce hostname au démarrage et **crashait immédiatement** (`exit_code=1`). Confirmé que ces blocs étaient de toute façon du code mort : le frontend appelle déjà directement l'URL absolue du backend via `VITE_API_URL` (`frontend/src/services/api.js`, `imageUtils.js`), jamais via un chemin relatif same-origin. Blocs supprimés. Probablement latent depuis la migration Railway (jamais exercé car le dev local utilise le serveur Vite, pas ce Dockerfile Nginx de prod) — pas une régression introduite par la migration Fly.
- **Vérifié :** frontend accessible (`HTTP 200`) après correctif.

### T14-03 — Secrets de production générés (jamais réutilisés depuis l'historique git compromis)

- **Statut :** DONE (2026-09-04) | **Priorité :** P0 | **Catégorie :** SÉCURITÉ
- **Détail :** `JWT_SECRET`/`JWT_REFRESH_SECRET` regénérés from scratch (`openssl rand -hex 32`, jamais transités par un fichier commité). `DB_SSL_DISABLE=true` (réseau privé Fly déjà chiffré WireGuard, cohérent avec le choix fait sur le homeserver). **Ceci constitue une rotation de fait des secrets JWT/DB exposés dans DB-04** pour ce nouvel environnement — ne lève pas DB-04 (l'historique git public reste à purger, et `SMTP_USER`/`SMTP_PASS` legacy exposés restent à révoquer, voir T14-04) mais réduit le périmètre réellement actif.
- **Reste à faire :** T14-04 (Gmail) et confirmation que les anciens secrets homeserver/Railway sont bien révoqués/inutilisés (pas de nouvelle action, ils ne sont simplement plus en usage).

### T14-04 — Configuration email Gmail SMTP

- **Statut :** DONE (2026-09-04) | **Priorité :** P1 | **Catégorie :** CONFIGURATION
- **Détail :** le compte `jannadistribpro@gmail.com` reste l'expéditeur ; nouveau mot de passe d'application Gmail généré par l'utilisateur (l'ancien étant exactement celui exposé dans l'historique git, DB-04 — inutilisable en production). Posé en secret Fly (`GMAIL_SENDER_EMAIL`, `GMAIL_APP_PASSWORD`, `GMAIL_SENDER_NAME`) sur `jana-backend`, backend redéployé.
- **Vérifié en conditions réelles :** `POST /api/auth/forgot-password` sur le compte admin réel → log applicatif confirmant l'envoi effectif (`Email envoyé à admin@jana-distribution.fr ... messageId: <...@gmail.com>`) — Gmail SMTP a bien accepté et acheminé le message, pas seulement une initialisation de transporteur sans erreur.

### T14-05 — Stockage des images produits : volume Fly persistant (pas R2)

- **Statut :** DONE (2026-09-04) | **Priorité :** P1 | **Catégorie :** INFRA
- **Décision utilisateur (2026-09-04) :** abandon de Cloudflare R2 (token cassé constaté en test, "bucket does not exist") au profit d'un volume Fly persistant attaché à `jana-backend` — un seul prestataire plutôt que deux, aucune modification de code nécessaire (`uploadToR2` bascule déjà en local disque quand les variables `R2_*` sont absentes, comportement existant réutilisé tel quel).
- **Fichiers :** `backend/fly.toml` (`[[mounts]] source="jana_uploads" destination="/app/uploads"`). Volume 1GB, chiffré, snapshots automatiques (rétention 5) inclus par Fly.
- **Vérifié en conditions réelles :** upload d'une image test → `200`, servie ensuite via `GET /uploads/products/...` → `200`, suppression via `DELETE /api/products/image/:filename` → `200` (re-vérifie au passage T13-01 en production). Image de test nettoyée après vérification.
- **Limite connue :** un seul volume = une seule machine backend possible (pas de scaling horizontal du backend sans repenser le stockage). Non bloquant vu le volume de trafic attendu.

### T14-06 — Compte admin de production réel (pas le seed de démo)

- **Statut :** DONE (2026-09-04) | **Priorité :** P0 | **Catégorie :** SÉCURITÉ + DONNÉES
- **Détail :** `backend/scripts/seed.js` n'a **pas** été exécuté en production — il crée des comptes de démo à mot de passe connu publiquement dans ce dépôt (`admin@jana-distribution.fr` / `Admin123!`, `client@test.fr` / `Client123!`) et des produits factices, en supprimant au passage toute donnée existante. Un script de seed minimal dédié (non commité, exécuté une fois via le proxy Fly Postgres) a créé : les 6 catégories réelles (mêmes que le seed de démo — ce sont les rayons réels du catalogue) et **un seul** compte admin réel avec un mot de passe fort généré aléatoirement, transmis à l'utilisateur en dehors de ce document.
- **Aucun compte client ni produit de démonstration créé.** Le catalogue de production est vide (hors catégories) — à peupler par l'utilisateur via le back-office.
- **Vérifié :** connexion admin réelle testée avec succès (`POST /api/auth/login` → 200, `role: ADMIN`).

### T14-07 — Vérification end-to-end production

- **Statut :** DONE (2026-09-04) | **Priorité :** P0 | **Catégorie :** VALIDATION
- **Vérifié :** `https://jana-backend.fly.dev/api/health` → `200`, DB `up`. `https://jana-frontend.fly.dev/` → `200`, page d'accueil rendue, catégories chargées depuis l'API (CORS correctement configuré, `CORS_ORIGIN=https://jana-frontend.fly.dev`). Connexion admin réelle. Upload/suppression d'image via volume persistant. Aucune erreur console au chargement.
- **Reste à faire :** T14-04 (email), décision optionnelle sur un nom de domaine personnalisé (actuellement `*.fly.dev` uniquement, non demandé par l'utilisateur), peuplement du catalogue réel par l'utilisateur.

---

## Appendice — Tâches annulées ou à reconsidérer

Aucune tâche annulée à ce stade. Si T0-02 (migration images S3) est réalisé, alors T0-07 (CORS uploads) devient `CANCELLED` car la route `/uploads` sera supprimée.
