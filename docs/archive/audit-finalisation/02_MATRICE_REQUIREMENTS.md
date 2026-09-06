# 02 — Matrice des Requirements

> ⚠️ **Document historique (état figé au 2026-06-14)** — Rédigé lors de l'audit initial, avant le retrait complet de Stripe (T4-07, 2026-07-02) et l'ajout de la facturation légale (Phase 5) et des tests d'intégration réels (Phase 7). Les références à Stripe, aux webhooks et aux tests 100% mockés ne reflètent plus l'état actuel du code. Voir `docs/workflow/ETAT_ACTUEL_PROJET.md` et `docs/workflow/PLAN_CORRECTION_AUDIT.md` pour l'état réel à jour.

> Légende états : ✅ Terminé vérifié | ⚠️ Terminé non testé | 🔶 Partiellement impl. | ❌ Présent mais cassé | 🚫 Absent | ❓ Non vérifiable | 🤔 Décision métier nécessaire

---

## CATALOGUE

| ID | Domaine | Requirement | Priorité | État | Preuve | Manque | Critères d'acceptation |
|---|---|---|---|---|---|---|---|
| CAT-01 | Catalogue | Affichage des produits | P0 | ✅ | `CataloguePage.jsx`, `product.routes.js` | — | Produits chargés et affichés avec image, nom, prix |
| CAT-02 | Catalogue | Filtres par catégorie | P0 | ✅ | `CatalogFilters.jsx`, `GET /api/products?categorie=` | — | Filtre appliqué côté backend |
| CAT-03 | Catalogue | Recherche full-text | P0 | ✅ | `SearchBar.jsx`, `GET /api/products?search=` | — | Résultats pertinents |
| CAT-04 | Catalogue | Tri (prix, nom, date) | P1 | ✅ | `product.repository.js` | — | Tri appliqué serveur |
| CAT-05 | Catalogue | Pagination | P1 | ✅ | `Pagination.jsx`, `product.repository.js` | — | Page correcte, total cohérent |
| CAT-06 | Catalogue | Fiche produit | P0 | ✅ | `ProductDetailPage.jsx`, `GET /api/products/:slug` | — | Données complètes |
| CAT-07 | Catalogue | Images produits | P0 | ❌ | `upload.middleware.js`, `/uploads/products/` | Stockage éphémère Railway | Images sur stockage persistant |
| CAT-08 | Catalogue | Prix (HT + TVA) | P0 | ✅ | `produit.prix`, `produit.taux_tva` | — | Prix corrects |
| CAT-09 | Catalogue | Stock affiché | P1 | ✅ | `produit.stock_quantite` | — | "En stock" / "Rupture" visible |
| CAT-10 | Catalogue | Produits actifs / inactifs | P0 | ✅ | `est_actif`, filtré en DB | — | Inactifs non visibles |
| CAT-11 | Catalogue | Gestion ruptures de stock | P1 | ✅ | Décrémentation atomique en transaction | — | Rupture bloque commande |

---

## PANIER

| ID | Domaine | Requirement | Priorité | État | Preuve | Manque | Critères d'acceptation |
|---|---|---|---|---|---|---|---|
| PAN-01 | Panier | Ajout produit | P0 | ✅ | `cart.routes.js`, `POST /api/cart/items` | — | Produit ajouté en DB |
| PAN-02 | Panier | Modification quantité | P0 | ✅ | `CartItem.jsx`, `PATCH /api/cart/items/:id` | — | Quantité mise à jour |
| PAN-03 | Panier | Suppression article | P0 | ✅ | `DELETE /api/cart/items/:id` | — | Article retiré |
| PAN-04 | Panier | Calcul sous-total | P0 | ✅ | `cart.repository.js` | — | Montant correct |
| PAN-05 | Panier | Persistance DB | P1 | ✅ | Table `panier`, table `ligne_panier` | — | Panier restauré à reconnexion |
| PAN-06 | Panier | Vérification stock à l'ajout | P1 | 🔶 | Côté frontend uniquement | Vérification serveur à renforcer | Ajout refusé si stock = 0 |
| PAN-07 | Panier | Recalcul côté serveur | P0 | ✅ | `cart.service.js`, totaux calculés en DB | — | Frontend ne calcule pas les totaux finaux |
| PAN-08 | Panier | Vérification prix changé | P1 | ✅ | `item.effectivePrice` depuis DB | — | Prix de commande = prix DB, pas prix panier client |

---

## COMMANDE

| ID | Domaine | Requirement | Priorité | État | Preuve | Manque | Critères d'acceptation |
|---|---|---|---|---|---|---|---|
| CMD-01 | Commande | Saisie coordonnées | P0 | ✅ | `CheckoutPage.jsx`, formulaire | — | Tous champs requis |
| CMD-02 | Commande | Adresse livraison | P0 | ✅ | `AdresseLivraison.jsx` | — | Validation côté client et serveur |
| CMD-03 | Commande | Adresse facturation | P1 | ✅ | `AdresseFacturation.jsx` | — | Peut être identique à livraison |
| CMD-04 | Commande | Validation commande | P0 | ✅ | `POST /api/orders` | — | Tous contrôles serveur |
| CMD-05 | Commande | Référence unique | P0 | ✅ | `commande_numero_seq`, `CMD-YYYYMMDD-XXXX` | Séquence non remise à zéro par jour | Format unique garanti |
| CMD-06 | Commande | Création atomique | P0 | ✅ | `order.repository.js` BEGIN/COMMIT/ROLLBACK | — | Tout ou rien |
| CMD-07 | Commande | Lignes de commande | P0 | ✅ | Table `ligne_commande` | — | Toutes lignes créées |
| CMD-08 | Commande | Email confirmation | P1 | ✅ | `email.service.js`, `sendOrderStatusEmail` | Email non envoyé si BREVO_API_KEY absent | Email reçu après commande |
| CMD-09 | Commande | Gestion erreurs stock | P0 | ✅ | `order.repository.js` UPDATE stockQuantite WHERE >= | — | Erreur lisible retournée |
| CMD-10 | Commande | Annulation client | P1 | ✅ | `POST /api/orders/:id/cancel` | Seulement EN_ATTENTE pour client | Commande annulée, stock restauré |
| CMD-11 | Commande | Annulation admin | P1 | ✅ | `admin.order.routes.js PATCH status ANNULEE` | Seulement EN_ATTENTE ou CONFIRMEE | Stock restauré |
| CMD-12 | Commande | Historique statuts | P2 | 🚫 | Aucune table `order_status_history` | À créer | Transitions tracées |
| CMD-13 | Commande | Remboursement | P1 | 🔶 | `charge.refunded` webhook → REFUNDED | Pas d'action admin pour initier remboursement Stripe | Bouton remboursement admin opérationnel |

---

## PAIEMENT

| ID | Domaine | Requirement | Priorité | État | Preuve | Manque | Critères d'acceptation |
|---|---|---|---|---|---|---|---|
| PAY-01 | Paiement | Création session Stripe | P0 | ✅ | `payment.service.js createCheckoutSession` | — | Session créée côté serveur |
| PAY-02 | Paiement | Validation montant serveur | P0 | ✅ | Lignes reconstruites depuis DB | — | Montant Stripe = montant DB |
| PAY-03 | Paiement | Webhook Stripe | P0 | ✅ | `webhook.routes.js`, `payment.service.js` | — | Webhook reçu et traité |
| PAY-04 | Paiement | Vérification signature | P0 | ✅ | `stripe.webhooks.constructEvent` | — | 400 si signature invalide |
| PAY-05 | Paiement | Idempotence webhook | P0 | ✅ | Table `stripe_event` + ON CONFLICT DO NOTHING | — | Double webhook ignoré |
| PAY-06 | Paiement | Protection double paiement | P1 | ✅ | `markPaid` avec `WHERE paiement_statut <> 'PAID'` | — | Deuxième paiement bloqué |
| PAY-07 | Paiement | Paiement échoué | P1 | ✅ | `payment_intent.payment_failed` → FAILED | — | Statut mis à jour |
| PAY-08 | Paiement | Session expirée | P1 | ✅ | `checkout.session.expired` → FAILED | — | Statut mis à jour |
| PAY-09 | Paiement | Remboursement | P1 | 🔶 | `charge.refunded` → REFUNDED | Event `charge.refunded` moins fiable que `refund.created` | Remboursement tracé en DB |
| PAY-10 | Paiement | Réconciliation Stripe/DB | P1 | ✅ | `stripe_session_id` et `stripe_payment_intent_id` stockés | — | IDs croisables |
| PAY-11 | Paiement | Page succès sécurisée | P0 | ✅ | `PaymentSuccessPage.jsx` : polling serveur | — | Succès confirmé par serveur, pas URL |
| PAY-12 | Paiement | Pas de données bancaires | P0 | ✅ | Aucun stockage carte en DB | — | Données bancaires sur Stripe uniquement |
| PAY-13 | Paiement | Paiement frontend fermé | P1 | ✅ | Webhook traite indépendamment du frontend | — | Commande confirmée même si fenêtre fermée |

---

## LIVRAISON

| ID | Domaine | Requirement | Priorité | État | Preuve | Manque | Critères d'acceptation |
|---|---|---|---|---|---|---|---|
| LIV-01 | Livraison | Calcul frais | P0 | ✅ | `settings.service.js getFraisLivraison` | — | Frais calculés serveur |
| LIV-02 | Livraison | Franco de port | P0 | ✅ | `livraison_seuil_franco` depuis configuration | — | Livraison gratuite au-dessus du seuil |
| LIV-03 | Livraison | Mode distance | P1 | ✅ | `geocoding.service.js`, BAN API | Dépendance externe | Distance calculée |
| LIV-04 | Livraison | Zones | P1 | 🔶 | `livraison_zones` en config = texte | Pas de validation par département | Zone vérifiable |
| LIV-05 | Livraison | Frais non falsifiables | P0 | ✅ | Frais client ignorés, log émis | — | Montant serveur utilisé |
| LIV-06 | Livraison | Adresse hors zone | P1 | ✅ | `hors_zone` retourné, erreur en checkout | — | Commande bloquée si hors zone |
| LIV-07 | Livraison | Suivi / numéro colis | P3 | 🚫 | Absent | À implémenter | Numéro colis stocké et communiqué |
| LIV-08 | Livraison | Décision zones définitives | — | 🤔 | Paramètre texte seulement | Décision propriétaire nécessaire | Zones clairement définies |

---

## FACTURATION

| ID | Domaine | Requirement | Priorité | État | Preuve | Manque | Critères d'acceptation |
|---|---|---|---|---|---|---|---|
| FAC-01 | Facturation | Numéro unique séquentiel | P0 | 🚫 | Aucune table `facture` | Table + séquence | Numéro incrémental |
| FAC-02 | Facturation | Génération après paiement | P0 | 🚫 | Aucun service | Service PDF | Facture créée à réception webhook PAID |
| FAC-03 | Facturation | Données entreprise | P0 | 🚫 | Absentes de la facture | Template facture | SIRET, TVA sur facture |
| FAC-04 | Facturation | Données client | P0 | 🚫 | Absentes | Template | Nom, adresse facturation |
| FAC-05 | Facturation | Lignes + prix + TVA | P0 | 🚫 | Absentes | Template | Chaque ligne détaillée |
| FAC-06 | Facturation | PDF téléchargeable | P0 | 🚫 | Absent | Lib PDF (pdfkit, puppeteer…) | PDF généré à la demande |
| FAC-07 | Facturation | Accès admin | P1 | 🚫 | Absent | Interface admin | Admin peut télécharger |
| FAC-08 | Facturation | Email facture | P2 | 🚫 | Absent | Template email | Facture jointe à email confirmation |
| FAC-09 | Facturation | Avoir en cas de remboursement | P2 | 🚫 | Absent | Table `avoir` | Avoir émis après remboursement |
| FAC-10 | Facturation | Immutabilité | P0 | 🚫 | Absent | Contrainte DB | Facture non modifiable après émission |

---

## ADMINISTRATION

| ID | Domaine | Requirement | Priorité | État | Preuve | Manque | Critères d'acceptation |
|---|---|---|---|---|---|---|---|
| ADM-01 | Admin | Connexion admin | P0 | ✅ | `LoginPage.jsx`, `isAdmin` middleware | — | Admin redirigé vers `/admin` |
| ADM-02 | Admin | Gestion produits (CRUD) | P0 | ✅ | `AdminProductsList.jsx`, `AdminProductForm.jsx` | — | Produit créé, modifié, désactivé |
| ADM-03 | Admin | Gestion catégories | P0 | ✅ | `AdminCategoriesList.jsx` | — | Catégorie CRUD |
| ADM-04 | Admin | Gestion images | P1 | ❌ | `ImageUploader.jsx` | Stockage éphémère Railway | Images persistantes |
| ADM-05 | Admin | Gestion stocks | P1 | ✅ | Modifiable via formulaire produit | — | Stock mis à jour |
| ADM-06 | Admin | Gestion commandes | P0 | ✅ | `AdminOrdersList.jsx`, changement statut | — | Statut modifiable |
| ADM-07 | Admin | Changement statut commande | P0 | ✅ | `PATCH /api/admin/orders/:id/status` | — | Transition validée |
| ADM-08 | Admin | Gestion remboursements | P1 | 🔶 | Statut paiement modifiable manuellement | Bouton remboursement Stripe absent | Remboursement initié depuis admin |
| ADM-09 | Admin | Génération factures | P0 | 🚫 | Absent | Voir facturation | Facture accessible depuis admin |
| ADM-10 | Admin | Tableau de bord | P1 | ✅ | `AdminDashboard.jsx`, `stats.controller.js` | Graphiques basiques | KPIs visibles |
| ADM-11 | Admin | Gestion clients | P2 | ✅ | `AdminClientsList.jsx` | — | Liste clients, détail |
| ADM-12 | Admin | Paramètres site | P1 | ✅ | `AdminSettingsPage.jsx` | — | Config modifiable |
| ADM-13 | Admin | Journalisation actions | P2 | 🚫 | Logs Winston seulement | Table `audit_log` | Actions sensibles tracées |

---

## SÉCURITÉ

| ID | Domaine | Requirement | Priorité | État | Preuve | Manque | Critères d'acceptation |
|---|---|---|---|---|---|---|---|
| SEC-01 | Sécurité | Authentification JWT | P0 | ✅ | `auth.middleware.js` | — | Token vérifié + user actif en DB |
| SEC-02 | Sécurité | Rôles (ADMIN/CLIENT) | P0 | ✅ | `isAdmin` middleware | — | Routes admin protégées |
| SEC-03 | Sécurité | Refresh token | P1 | ⚠️ | Généré et renvoyé | Non stocké en DB → non révocable | Révocable |
| SEC-04 | Sécurité | Révocation token | P1 | 🚫 | Pas de blacklist | Liste noire ou durée courte | Token révocable à logout |
| SEC-05 | Sécurité | Validation entrées | P0 | ✅ | `express-validator` sur routes | Force MDP non vérifiée backend | Toutes entrées validées |
| SEC-06 | Sécurité | Protection injection SQL | P0 | ✅ | Requêtes paramétrées (`$1`, `$2`...) | — | Aucune concaténation SQL |
| SEC-07 | Sécurité | Protection XSS | P1 | ✅ | Helmet + React (escaping auto) | — | Pas d'injection HTML |
| SEC-08 | Sécurité | CORS configuré | P0 | ✅ | `CORS_ORIGIN` depuis env | — | Origine restrictive |
| SEC-09 | Sécurité | Rate limiting | P0 | ✅ | `express-rate-limit` global + auth | — | Brute force limité |
| SEC-10 | Sécurité | Uploads sécurisés | P1 | ✅ | MIME type + taille limitée | Pas de scan antivirus | Types contrôlés |
| SEC-11 | Sécurité | Secrets via env | P0 | ✅ | Aucun secret hardcodé | — | Secrets en variable d'env |
| SEC-12 | Sécurité | Montants non falsifiables | P0 | ✅ | Calcul serveur, frais client ignorés | — | Prix DB uniquement |
| SEC-13 | Sécurité | Webhook Stripe signé | P0 | ✅ | `constructEvent` avec secret | — | Signature vérifiée |
| SEC-14 | Sécurité | Dépendances vulnérables | P1 | ❓ | Non vérifiable sans audit npm | `npm audit` à lancer | Aucune critique |

---

## EXPLOITATION

| ID | Domaine | Requirement | Priorité | État | Preuve | Manque | Critères d'acceptation |
|---|---|---|---|---|---|---|---|
| EXP-01 | Exploitation | Health check | P1 | ✅ | `GET /api/health` | — | Réponse 200 avec statut DB |
| EXP-02 | Exploitation | Logs structurés | P1 | ✅ | Winston avec niveaux | — | Logs JSON en production |
| EXP-03 | Exploitation | Migrations | P1 | 🔶 | Script SQL manuel | Pas de versioning | Migrations versionnées |
| EXP-04 | Exploitation | Sauvegardes DB | P0 | 🚫 | Non configurées | Config Railway backup | Backup quotidien automatique |
| EXP-05 | Exploitation | Staging séparé | P1 | 🚫 | Absent | Service Railway staging | Test avant prod |
| EXP-06 | Exploitation | Monitoring | P2 | 🚫 | Absent | Outil monitoring | Alertes en cas d'erreur |
| EXP-07 | Exploitation | Rollback | P1 | ❓ | Non documenté | Procédure rollback | Retour version précédente documenté |
| EXP-08 | Exploitation | Variables env production | P0 | ❓ | Non vérifiable localement | Vérification Railway | Toutes variables présentes |
