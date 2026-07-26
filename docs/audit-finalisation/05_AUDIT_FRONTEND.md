# 05 — Audit Frontend

> ⚠️ **Document historique (état figé au 2026-06-14)** — Rédigé lors de l'audit initial, avant le retrait complet de Stripe (T4-07, 2026-07-02) et l'ajout de la facturation légale (Phase 5) et des tests d'intégration réels (Phase 7). Les références à Stripe, aux webhooks et aux tests 100% mockés ne reflètent plus l'état actuel du code. Voir `docs/workflow/ETAT_ACTUEL_PROJET.md` et `docs/workflow/PLAN_CORRECTION_AUDIT.md` pour l'état réel à jour.

---

## Architecture React

| Aspect | Constat | Priorité |
|---|---|---|
| Framework | React 18.2 avec hooks, Context API — pas de Redux | OK |
| Router | React Router Dom 6 | OK |
| State global | 3 contextes : Auth, Cart, Settings | OK |
| Build | Vite 7.3 | OK |
| CSS | TailwindCSS 3.4 | OK |
| Icônes | Lucide React | OK |
| Requêtes | Axios avec intercepteurs | OK |
| Pas de Redux | Contrairement à la description initiale | Info |

---

## Routes frontend

### Routes publiques (sans authentification)

| Route | Composant | État |
|---|---|---|
| `/` | `HomePage` | ✅ |
| `/catalogue` | `CataloguePage` | ✅ |
| `/produit/:slug` | `ProductDetailPage` | ✅ |
| `/panier` | `CartPage` | ✅ |
| `/login` | `LoginPage` | ✅ |
| `/register` | `RegisterPage` | ✅ |
| `/mot-de-passe-oublie` | `ForgotPasswordPage` | ✅ |
| `/reset-password` | `ResetPasswordPage` | ✅ |
| `/cgv` | `CGVPage` | ✅ |
| `/confidentialite` | `ConfidentialitePage` | ✅ |
| `/mentions-legales` | `MentionsLegalesPage` | ✅ |
| `/accessibilite` | `AccessibilitePage` | ✅ |

### Routes protégées (client connecté)

| Route | Composant | État |
|---|---|---|
| `/checkout` | `CheckoutPage` | ✅ |
| `/commande/confirmation/:orderId` | `OrderConfirmationPage` | ✅ |
| `/paiement/succes` | `PaymentSuccessPage` | ✅ |
| `/paiement/annule` | `PaymentCancelPage` | ✅ |
| `/mon-compte` | `MonComptePage` | ✅ |
| `/mes-commandes` | `OrderHistoryPage` | ✅ |
| `/mes-commandes/:orderId` | `OrderDetailPage` | ✅ |

### Routes admin (authentification ADMIN requise)

| Route | Composant | État |
|---|---|---|
| `/admin` | `AdminDashboard` | ✅ |
| `/admin/produits` | `AdminProductsList` | ✅ |
| `/admin/produits/nouveau` | `AdminProductForm` | ✅ |
| `/admin/produits/:id` | `AdminProductForm` | ✅ |
| `/admin/produits/:id/modifier` | `AdminProductForm` | ⚠️ Double route |
| `/admin/categories` | `AdminCategoriesList` | ✅ |
| `/admin/commandes` | `AdminOrdersList` | ✅ |
| `/admin/clients` | `AdminClientsList` | ✅ |
| `/admin/parametres` | `AdminSettingsPage` | ✅ |
| `/admin/profil` | `AdminProfilePage` | ✅ |

**Page manquante** : Aucune route `/admin/factures`. La facturation est absente du menu admin.

**Pages orphelines** : `PromotionsPage.jsx` existe mais n'est pas routée (supprimée de App.jsx).

---

## Constat : message checkout incohérent (P0)

**Fichier** : `frontend/src/pages/CheckoutPage.jsx`, ligne 358

```jsx
<p className="text-blue-700 text-sm mt-1">
  Après validation, vous recevrez un <strong>devis par email</strong> récapitulant votre commande.
  Notre équipe vous contactera pour confirmer la livraison.
  Le paiement s'effectue <strong>à la livraison</strong> selon le mode choisi.
</p>
```

Ce bandeau informatif décrit un flux B2B "devis" alors que le bouton de validation déclenche une vraie session Stripe Checkout pour le mode CARTE. Ce message est **faux et trompeur** pour un client qui paie par carte. Un client peut croire qu'il n'est pas débité alors qu'il l'est.

**Correction nécessaire** : Adapter le message selon le mode de paiement sélectionné.

---

## Gestion des tokens (P1)

**Fichier** : `frontend/src/services/api.js`

- Migration de `localStorage` vers `sessionStorage` : **implémentée et correcte**
- Code de migration backward-compatible : `readAuthStorage` lit sessionStorage puis localStorage (fallback)
- Refresh automatique avec intercepteur Axios : **implémenté correctement**
- Déduplication des refreshes simultanés (`refreshPromise` partagé) : **correct**
- Redirection vers `/login` après échec refresh : **correcte**

**Problème** : Le token est stocké en clair dans `sessionStorage`. C'est acceptable pour un accès token (accès limité aux scripts de la même origin), mais le refresh token (30 jours) est également là, ce qui est un risque si un tiers accède au navigateur.

---

## Contexte Auth (P1)

**Fichier** : `frontend/src/contexts/AuthContext.jsx`

- `updateProfile` ligne 147 : `sessionStorage.setItem('user', JSON.stringify(updatedUser))` puis `localStorage.removeItem('user')` — gestion manuelle redondante avec `setAuthData`. Potentiel bug de cohérence.
- Pas de gestion de l'expiration de session dans le contexte (le refresh est dans l'intercepteur Axios, ce qui est correct).

---

## Calculs financiers côté frontend (P0)

**Règle** : Le frontend ne doit jamais être la source fiable des montants.

| Calcul | Localisation | Sécurisé |
|---|---|---|
| Sous-total panier | `CartContext.jsx` — affiché uniquement | Oui, recalculé serveur avant commande |
| Frais livraison | `CheckoutPage.jsx` — calculé via API | Oui, recalculé serveur à la création |
| Total commande TTC | `CheckoutPage.jsx` — `totalTTC + fraisLivraison` | Partiellement — valeur affichée seulement |
| Montant Stripe | `payment.service.js` — reconstruit depuis DB | Oui, sécurisé |

L'affichage côté frontend peut différer légèrement du total serveur (timing), mais le montant réel utilisé pour Stripe est bien reconstruit depuis la DB. **Correct**.

---

## Composant PaymentSuccessPage (P0)

**Fichier** : `frontend/src/pages/PaymentSuccessPage.jsx`

- Ne fait pas confiance à la redirection Stripe pour confirmer le paiement : **correct**
- Effectue un polling `GET /api/payment/session/:sessionId` jusqu'à confirmation : **correct**
- Arrêt après 20 tentatives (30s) → état "pending" affiché : **bon comportement**
- Gestion état FAILED correcte : **correcte**

**Constat positif** : Cette page est un exemple de bonne pratique.

---

## Gestion des erreurs (P2)

| Composant | Gestion erreurs | Constat |
|---|---|---|
| `api.js` intercepteurs | Refresh auto, redirection login | Correct |
| `CheckoutPage.jsx` | `try/catch` avec `toast.error` | Correct |
| `PaymentSuccessPage.jsx` | États explicites | Correct |
| Pages catalogue | Non vérifié intégralement | À vérifier |
| `AdminProductsList.jsx` | Non vérifié intégralement | À vérifier |

**Problème général** : Les erreurs réseau sans réponse (timeout, CORS) sont peu gérées dans la plupart des services. Un `console.error` seul ne suffit pas.

---

## Formulaires et validation (P1)

**Validation côté client** dans `CheckoutPage.jsx` :
- Prénom, nom, téléphone : regex France correcte
- Code postal : `/^\d{5}$/` correct
- CGV obligatoires

**Manques** :
- Pas de validation de force du mot de passe côté frontend (uniquement `PasswordStrengthIndicator.jsx` visuel)
- Pas de validation format email côté frontend (seulement côté backend)

---

## ExcelJS (P2)

**Fichier** : `frontend/src/components/admin/ProductsExportImport.jsx`

ExcelJS est importé côté frontend pour l'import/export de produits. Cela signifie qu'un admin peut téléverser un fichier Excel parsé côté client. Les données sont ensuite envoyées à l'API. Ce flux est acceptable si :
- La validation serveur est robuste
- Les données parsées sont revalidées côté backend

**Point à vérifier** : La route d'import de produits depuis l'API doit valider chaque ligne de données.

---

## Accessibilité (P3)

- Pages légales existantes (CGV, Mentions, Confidentialité, Accessibilité)
- Pas d'audit d'accessibilité WCAG réalisé
- Tailwind ne garantit pas l'accessibilité par défaut

---

## Points positifs notables

1. `PrivateRoute.jsx` : protection propre des routes avec `adminOnly` prop
2. `CartContext.jsx` : totaux calculés côté client pour affichage UX uniquement, pas utilisés pour créer la commande
3. Intercepteur refresh token avec déduplication
4. Polling PaymentSuccessPage avec délai et fallback
5. Désactivation des boutons pendant les soumissions (`isSubmitting`)
6. Toast notifications cohérentes

---

## Résumé des problèmes frontend

| ID | Sévérité | Description | Fichier |
|---|---|---|---|
| FE-01 | P0 | Message checkout "devis/à la livraison" trompeur | `CheckoutPage.jsx:358` |
| FE-02 | P1 | `updateProfile` gestion storage manuelle incohérente | `AuthContext.jsx:147` |
| FE-03 | P2 | Pas de feedback erreur réseau dans pages catalogue/admin | Multiple |
| FE-04 | P2 | Pas de page admin factures | `App.jsx` |
| FE-05 | P2 | `PromotionsPage.jsx` orphelin (non routé) | `PromotionsPage.jsx` |
| FE-06 | P3 | Double route admin produit `:id` et `:id/modifier` | `App.jsx` |
| FE-07 | P3 | Accessibilité non auditée | Global |
