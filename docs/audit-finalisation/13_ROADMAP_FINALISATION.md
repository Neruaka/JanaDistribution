# 13 — Roadmap de Finalisation

> Durées estimées en jours-développeur. Les décisions métier (livraison, TVA, etc.) ne sont pas comptées.

---

## Phase 0 — Sécurisation immédiate
**Durée estimée : 3-5 jours**
**Prérequis : Aucun**

Ces tâches doivent être réalisées **avant toute mise en production**, même en staging.

| ID | Priorité | Description | Fichiers concernés | Risque | Complexité | Critères d'acceptation |
|---|---|---|---|---|---|---|
| T0-01 | P0 | Corriger message checkout (bandeau "devis/paiement à la livraison") | `CheckoutPage.jsx:358` | Faible | Faible | Message adapté selon `modePaiement` |
| T0-02 | P0 | Migrer images vers stockage persistant (S3 ou Railway Volume) | `upload.middleware.js`, `product.controller.js` | Élevé | Élevée | Images survivent au redéploiement |
| T0-03 | P1 | Forcer `JWT_REFRESH_SECRET` distinct (erreur démarrage si absent) | `auth.service.js:25` | Faible | Faible | Erreur explicite si variable manquante |
| T0-04 | P1 | Réduire payload `stripe_event` (ne stocker que id, type, date) | `payment.service.js:146` | Faible | Faible | Payload non stocké en DB |
| T0-05 | P1 | Valider force du mot de passe côté backend | `auth.service.js`, `auth.validator.js` | Faible | Faible | Rejet si MDP < 8 chars ou trop simple |
| T0-06 | P2 | Corriger encodage UTF-8 dans les fichiers source | Multiples | Faible | Faible | Accents corrects partout |

---

## Phase 1 — Stabilisation de l'existant
**Durée estimée : 3-5 jours**
**Prérequis : Phase 0**

| ID | Priorité | Description | Fichiers concernés | Risque | Complexité | Critères d'acceptation |
|---|---|---|---|---|---|---|
| T1-01 | P1 | Inclure vidange panier dans la transaction de commande | `order.service.js:183`, `order.repository.js` | Moyen | Moyenne | Panier vidé ou commande non créée |
| T1-02 | P1 | Supprimer `hasPermission()` ou l'implémenter réellement | `auth.middleware.js:149` | Faible | Faible | Middleware cohérent avec le modèle |
| T1-03 | P2 | Supprimer doublon package Redis (garder ioredis uniquement) | `package.json` | Faible | Faible | Un seul package Redis |
| T1-04 | P2 | Unifier validation (choisir express-validator OU Joi) | `package.json`, validators | Faible | Moyenne | Un seul système de validation |
| T1-05 | P2 | Mettre en place migrations versionnées | `backend/migrations/` | Élevé | Moyenne | Schéma versionné, pas de DROP TABLE |
| T1-06 | P2 | Corriger `npm audit --production` | `package.json` | Faible | Faible | Aucune CVE critique |
| T1-07 | P2 | Corriger double route admin produit | `App.jsx` | Faible | Faible | Route `:id/modifier` supprimée |
| T1-08 | P3 | Corriger accents dans templates email | `email.service.js` | Faible | Faible | Emails lisibles avec accents |

---

## Phase 2 — Architecture commandes et stocks
**Durée estimée : 5-7 jours**
**Prérequis : Phase 1**

| ID | Priorité | Description | Fichiers concernés | Risque | Complexité | Critères d'acceptation | Tests |
|---|---|---|---|---|---|---|---|
| T2-01 | P1 | Créer table `commande_statut_historique` | Migration SQL | Faible | Faible | Toutes transitions tracées | Test intégration transition |
| T2-02 | P1 | Enregistrer historique statuts à chaque transition | `order.service.js` | Faible | Faible | Historique visible admin | Test unitaire |
| T2-03 | P1 | Ajouter table `refresh_token` en DB | Migration SQL | Moyen | Moyenne | Tokens révocables | Test intégration auth |
| T2-04 | P1 | Stocker refresh token en DB à la connexion | `auth.service.js` | Moyen | Moyenne | Token invalidé à déconnexion | Test intégration |
| T2-05 | P1 | Révoquer refresh token à la déconnexion | `auth.routes.js`, `user.repository.js` | Moyen | Moyenne | Déconnexion effective | Test intégration |
| T2-06 | P2 | Ajouter table `audit_log` pour actions admin | Migration SQL | Faible | Faible | Actions admin tracées | Test unitaire |
| T2-07 | P2 | Logger actions sensibles (modif statut, remboursement) | `order.service.js`, middleware | Faible | Faible | Audit log alimenté | Test unitaire |

---

## Phase 3 — Stratégie de livraison
**Durée estimée : 2 jours développement + décision métier**
**Prérequis : Phase 0, décision propriétaire**

| ID | Priorité | Description | Fichiers concernés | Risque | Complexité | Critères d'acceptation | Tests |
|---|---|---|---|---|---|---|---|
| T3-01 | P1 | Valider et documenter la stratégie de livraison choisie | `10_LIVRAISON.md` | Faible | Décision | Décision prise et documentée | — |
| T3-02 | P1 | Configurer paramètres livraison en production | Admin Railway settings | Faible | Faible | Frais corrects en prod | Test manuel |
| T3-03 | P2 | Ajouter poids produit si calcul au poids choisi | `init.sql`, `produit` table | Moyen | Moyenne | Poids saisi par admin | Test unitaire |
| T3-04 | P3 | Ajouter numéro de colis sur les expéditions | `commande` table, admin | Faible | Faible | Champ numéro colis dans l'admin | — |

---

## Phase 4 — Intégration Stripe finalisée
**Durée estimée : 3-5 jours**
**Prérequis : Phase 2**

| ID | Priorité | Description | Fichiers concernés | Risque | Complexité | Critères d'acceptation | Tests |
|---|---|---|---|---|---|---|---|
| T4-01 | P1 | Remplacer `charge.refunded` par `refund.created` | `payment.service.js` | Moyen | Faible | Remboursements précis | Test webhook intégration |
| T4-02 | P1 | Gérer remboursements partiels correctement | `payment.service.js` | Moyen | Moyenne | Partiel ne marque pas tout REFUNDED | Test webhook |
| T4-03 | P1 | Ajouter bouton "Initier remboursement" admin | `AdminOrdersList.jsx`, `payment.routes.js` | Élevé | Élevée | Admin peut rembourser depuis l'interface | Test E2E |
| T4-04 | P1 | Ajouter `stripe_refund_id` sur commande | Migration SQL | Faible | Faible | ID Stripe remboursement traçable | — |
| T4-05 | P2 | Enrichir metadata Stripe (email, type_client) | `payment.service.js:83` | Faible | Faible | Métadonnées visibles Stripe dashboard | Test manuel |
| T4-06 | P2 | Configurer webhook Stripe en prod (Dashboard, pas CLI) | Stripe Dashboard | Élevé | Faible | Webhook reçu en production | Test Stripe CLI |

---

## Phase 5 — Facturation
**Durée estimée : 7-10 jours**
**Prérequis : Phase 4, validation comptable**

| ID | Priorité | Description | Fichiers concernés | Risque | Complexité | Critères d'acceptation | Tests |
|---|---|---|---|---|---|---|---|
| T5-01 | P0 | Créer tables facture, facture_ligne, avoir | Migration SQL | Élevé | Faible | Schéma en place | Test migration |
| T5-02 | P0 | Implémenter `invoice.service.js` (génération) | `services/invoice.service.js` | Élevé | Élevée | Facture créée après webhook PAID | Test intégration |
| T5-03 | P0 | Installer PDFKit et générer PDF facture | `package.json`, `invoice-pdf.generator.js` | Moyen | Élevée | PDF correct et lisible | Test unitaire |
| T5-04 | P0 | Déclencher génération facture dans webhook | `payment.service.js:_onCheckoutCompleted` | Moyen | Faible | Facture créée à chaque paiement confirmé | Test intégration |
| T5-05 | P1 | Endpoints API factures (list, get, PDF) | `invoice.routes.js`, `invoice.controller.js` | Faible | Moyenne | PDF téléchargeable | Test API |
| T5-06 | P1 | Interface admin factures | `AdminInvoicesPage.jsx` | Faible | Moyenne | Admin voit et télécharge factures | Test E2E |
| T5-07 | P1 | Envoyer facture par email avec pièce jointe | `email.service.js` | Faible | Moyenne | Client reçoit facture par email | Test manuel |
| T5-08 | P2 | Implémenter avoir après remboursement | `invoice.service.js`, `avoir` table | Moyen | Élevée | Avoir généré après remboursement | Test intégration |
| T5-09 | P2 | Numérotation séquentielle par année | `facture_numero_seq` | Faible | Faible | FAC-2025-0001 → FAC-2025-0002 | Test unitaire |

---

## Phase 6 — Finalisation de l'administration
**Durée estimée : 3-5 jours**
**Prérequis : Phase 5**

| ID | Priorité | Description | Fichiers concernés | Risque | Complexité | Critères d'acceptation |
|---|---|---|---|---|---|---|
| T6-01 | P2 | Afficher historique statuts dans détail commande admin | `AdminOrdersList.jsx`, `admin.order.routes.js` | Faible | Faible | Timeline visible |
| T6-02 | P2 | Dashboard avec graphiques CA par période | `AdminDashboard.jsx`, `stats.service.js` | Faible | Moyenne | Recharts opérationnel |
| T6-03 | P2 | Export commandes CSV/Excel depuis admin | `AdminOrdersList.jsx` | Faible | Faible | Export fonctionnel |
| T6-04 | P2 | Validation import produits Excel (côté backend) | `product.routes.js` | Moyen | Moyenne | Validation serveur de chaque ligne |
| T6-05 | P3 | Nettoyage composants orphelins (PromotionsPage) | `PromotionsPage.jsx` | Faible | Faible | Aucun composant non routé |

---

## Phase 7 — Tests automatisés
**Durée estimée : 5-7 jours**
**Prérequis : Phase 5**

| ID | Priorité | Description | Fichiers concernés | Complexité |
|---|---|---|---|---|
| T7-01 | P0 | Tests intégration création commande (vraie DB) | `tests/integration/order.test.js` | Élevée |
| T7-02 | P0 | Tests intégration webhook Stripe | `tests/integration/webhook.test.js` | Élevée |
| T7-03 | P1 | Tests intégration authentification | `tests/integration/auth.test.js` | Moyenne |
| T7-04 | P1 | Tests intégration calcul frais livraison | `tests/integration/shipping.test.js` | Moyenne |
| T7-05 | P1 | Tests unitaires génération facture | `tests/unit/invoice.test.js` | Moyenne |
| T7-06 | P2 | Tests race condition stock | `tests/integration/stock.concurrent.test.js` | Élevée |
| T7-07 | P2 | Tests E2E tunnel de commande complet (Playwright) | `tests/e2e/checkout.spec.js` | Élevée |

---

## Phase 8 — Staging Railway
**Durée estimée : 3-5 jours**
**Prérequis : Phase 7**

| ID | Priorité | Description | Complexité |
|---|---|---|---|
| T8-01 | P1 | Créer services Railway staging (backend-staging, frontend-staging) | Faible |
| T8-02 | P1 | Configurer variables staging (clés Stripe test, DB séparée) | Faible |
| T8-03 | P1 | Branching strategy : `staging` → staging, `main` → prod | Faible |
| T8-04 | P1 | Activer sauvegardes PostgreSQL en prod | Faible |
| T8-05 | P1 | Configurer monitoring (Better Uptime ou Datadog) | Moyenne |
| T8-06 | P2 | Configurer stockage images persistant en prod | Voir T0-02 |

---

## Phase 9 — Audit final et mise en production
**Durée estimée : 2-3 jours**
**Prérequis : Toutes phases précédentes**

| ID | Priorité | Description |
|---|---|---|
| T9-01 | P0 | Test complet flux de commande en staging avec Stripe test |
| T9-02 | P0 | Vérification toutes variables prod configurées |
| T9-03 | P0 | Validation légale (mentions légales, CGV, politique RGPD) |
| T9-04 | P0 | Validation comptable (facturation, TVA) |
| T9-05 | P0 | Test paiement en mode LIVE (1€) |
| T9-06 | P0 | Confirmation sauvegardes DB opérationnelles |
| T9-07 | P1 | `npm audit --production` sans CVE critique |
| T9-08 | P1 | Documentation déploiement mise à jour |

---

## Récapitulatif par durée totale estimée

| Phase | Durée | Prérequis bloquants |
|---|---|---|
| Phase 0 — Sécurisation immédiate | 3-5 j | Aucun |
| Phase 1 — Stabilisation | 3-5 j | Phase 0 |
| Phase 2 — Commandes/stocks | 5-7 j | Phase 1 |
| Phase 3 — Livraison | 2-3 j + décision | Phase 0 |
| Phase 4 — Stripe finalisé | 3-5 j | Phase 2 |
| Phase 5 — Facturation | 7-10 j | Phase 4 + validation |
| Phase 6 — Admin finalisée | 3-5 j | Phase 5 |
| Phase 7 — Tests | 5-7 j | Phase 5 |
| Phase 8 — Staging Railway | 3-5 j | Phase 7 |
| Phase 9 — Go live | 2-3 j | Tout |
| **Total** | **36-55 jours** | |
