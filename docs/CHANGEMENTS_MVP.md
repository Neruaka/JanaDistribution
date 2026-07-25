# Changements MVP — Retrait Stripe & Codes Promo

> Document généré par inspection statique du code au 2026-07-02.
> Source : `git log`, `ETAT_ACTUEL_PROJET.md`, `PLAN_CORRECTION_AUDIT.md`, lecture directe des fichiers backend/frontend.
> ⚠️ Au moment de cette inspection, le retrait de Stripe est **committé et terminé** (commits `9ee63d0`, `7780e64`). Le système de codes promo est **en cours d'implémentation en parallèle** par d'autres agents — les fichiers listés ci-dessous existent au moment de l'inspection mais l'intégration (routes montées, UI admin) peut encore évoluer.

## Vue d'ensemble

Le 2026-07-02, une décision client a supprimé tout paiement en ligne du MVP : Stripe (Checkout Sessions, webhooks, remboursements API) est entièrement retiré du code, et seuls trois modes de paiement manuels subsistent (ESPECES, VIREMENT, CHEQUE), avec statut et remboursement positionnés manuellement par un admin. En parallèle, un système de codes promo (réduction en pourcentage ou montant fixe, appliqué au checkout) est en cours d'ajout : le schéma DB, le service de validation/calcul et les routes API backend sont déjà en place ; le champ de saisie du code au checkout existe côté frontend client ; l'interface d'administration des codes (créer/éditer/désactiver un code) reste à livrer par un agent dédié.

## Décisions techniques majeures

| Décision | Détail |
|---|---|
| Retrait de Stripe | Paiement en ligne totalement supprimé du MVP. Modes acceptés : `ESPECES` (à la livraison), `VIREMENT`, `CHEQUE`. Le statut de paiement (`paiement_statut`) et les remboursements sont positionnés manuellement par un admin via `admin.order.routes.js`, tracés dans `audit_log`. |
| Ajout codes promo | Nouvelle table `code_promo` + `code_promo_utilisation`. Réduction en `POURCENTAGE` ou `MONTANT_FIXE`, avec dates de validité, montant minimum, plafond d'utilisation global et par client. Validation et calcul recalculés côté serveur (`promo.service.js`) — le total affiché côté client est indicatif uniquement. |

## Fonctionnalités implémentées

### Backend

**Retrait Stripe (supprimé) :**
- `payment.service.js`, `payment.controller.js`, `payment.routes.js`, `webhook.routes.js`, `config/stripe.js` — supprimés
- Dépendance npm `stripe` désinstallée (`backend/package.json` ne contient plus de référence Stripe)
- `admin.order.routes.js` — logique de statut paiement et remboursement passée en mode manuel

**Codes promo (en cours, fichiers présents au moment de l'inspection) :**
- `backend/src/services/promo.service.js` — `validerCode()` : vérifie existence, statut actif, dates de validité, montant minimum, plafonds d'utilisation (global et par client), puis calcule le rabais (`_calculerRabais`)
- `backend/src/repositories/promo.repository.js` — accès DB (`findByCode`, `countUtilisationsGlobal`, `countUtilisationsByUser`, etc.)
- `backend/src/routes/promo.routes.js` — expose `POST /api/promo/valider` (client) et un jeu de routes `/api/promo/admin*` (CRUD + toggle actif) déjà présentes dans le fichier, prêtes à être consommées par une future UI admin
- `backend/src/index.js` — route montée (`promoRoutes` importé et déclaré), donc l'API est active dès maintenant même sans UI admin
- Note : le projet possède déjà une notion distincte et préexistante de « promotion produit » (`produit.prix_promo`, route `GET /api/products/promos`) — mécanisme de prix barré par produit, sans rapport avec les codes promo transversaux ajoutés ici. Les deux coexistent sans conflit.

### Frontend

- `frontend/src/pages/CheckoutPage.jsx` — champ de saisie code promo (état `codePromo`, `codePromoValide`, `codePromoLoading`, `codePromoError`), boutons appliquer/retirer, total recalculé à l'affichage ; le code validé est transmis à `createOrder()`
- `frontend/src/services/promoService.js` — appel `POST /promo/valider`
- Pages de paiement Stripe supprimées : `PaymentSuccessPage.jsx`, `PaymentCancelPage.jsx`
- Dépendance `@stripe/stripe-js` désinstallée du frontend
- Interface admin de gestion des codes promo : **absente** au moment de l'inspection (`frontend/src/pages/admin/` ne contient aucun fichier lié aux promos) — à livrer par un agent dédié

### Base de données — migrations réelles (`backend/scripts/migrations/`)

| Migration | Objet |
|---|---|
| `0001_add_stripe_payment.sql` | Ajout initial des colonnes/table liées à Stripe (historique — en grande partie annulé par 0009) |
| `0002_commande_statut_historique.sql` | Table d'historique des transitions de statut de commande |
| `0003_refresh_token.sql` | Table `refresh_token` (hash SHA-256, révocation, expiration) |
| `0004_audit_log.sql` | Table `audit_log` (traçabilité actions admin sensibles) |
| `0005_commande_refund.sql` | Ajout `montant_rembourse` et statuts REMBOURSE/PARTIELLEMENT_REMBOURSE sur `commande` |
| `0006_livraison_distance_config.sql` | Paramètres de livraison en mode DISTANCE (barème, franco de port, rayon) |
| `0007_commande_numero_colis.sql` | Ajout `numero_colis` + `date_expedition` sur `commande` |
| `0008_facturation.sql` | Tables `facture`, `facture_ligne`, `facture_seq` + `produit.taux_tva` |
| `0009_remove_stripe.sql` | Suppression colonnes `stripe_session_id`/`stripe_payment_intent_id`/`stripe_refund_id`, suppression table `stripe_event`, recréation de l'ENUM `mode_paiement` sans `CARTE` |
| `0010_codes_promo.sql` | Tables `code_promo` et `code_promo_utilisation`, colonnes `code_promo_id`/`montant_rabais`/`total_avant_rabais` sur `commande` |

**Constat d'inspection important :** `backend/scripts/init.sql` (schéma de référence pour un premier démarrage local) n'a **pas** été synchronisé avec la migration `0009` : il contient toujours la table `stripe_event`, les colonnes `stripe_session_id`/`stripe_payment_intent_id` sur `commande`, et le mode paiement par défaut `'CARTE'`. Un commentaire dans le fichier précise que `init.sql` est réservé au tout premier démarrage local et que les bases déjà provisionnées doivent utiliser les migrations — mais un nouvel environnement initialisé uniquement via `init.sql` recréerait un schéma avec Stripe. De même, les tables `refresh_token`, `audit_log`, `facture`, `code_promo`, `commande_statut_historique` n'existent que dans les migrations, pas dans `init.sql`. À corriger avant tout nouvel environnement de référence (voir `docs/RESTE_A_FAIRE_PROD.md`).

> **Mise à jour 2026-07-04 :** `init.sql` a été régénéré et resynchronisé avec les migrations 0001 à 0010 (voir `ETAT_ACTUEL_PROJET.md` §12, entrée du 2026-07-04). Ce constat d'inspection est désormais historique.

## Modifications de sécurité pertinentes

- Le calcul du rabais (codes promo) est entièrement recalculé côté serveur ; le frontend n'affiche qu'une estimation.
- Les remboursements et changements de statut de commande (manuels, sans Stripe) restent tracés dans `audit_log` (comportement conservé depuis T2-06/T2-07/T4-03).
- Aucun secret Stripe résiduel identifié dans le code (`STRIPE_SECRET_KEY` non référencé dans `backend/src` après retrait).

## Ce qui a été retiré (Stripe)

- `backend/src/services/payment.service.js`, `payment.controller.js`, routes `payment.routes.js` et `webhook.routes.js`, `config/stripe.js`
- `frontend/src/services/paymentService.js`, `PaymentSuccessPage.jsx`, `PaymentCancelPage.jsx`
- Colonnes DB : `stripe_session_id`, `stripe_payment_intent_id`, `stripe_refund_id` (migration 0009)
- Table DB : `stripe_event`
- Dépendances npm : `stripe` (backend), `@stripe/stripe-js` (frontend)
- Test d'intégration webhook Stripe (`webhook.stripe.test.js`, ajouté le 2026-06-28, supprimé le 2026-07-02)
- Tâches du backlog `T4-01` à `T4-06`, `T9-01`, `T9-05` passées `CANCELLED` dans `PLAN_CORRECTION_AUDIT.md`
