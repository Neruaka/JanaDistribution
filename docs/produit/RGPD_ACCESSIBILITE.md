# État RGPD et Accessibilité

> Généré par inspection statique du code au 2026-07-02 (`backend/scripts/init.sql`, migrations, `frontend/index.html`, pages légales, historique du projet).

---

## Partie 1 — RGPD

### Données personnelles collectées (tables réelles inspectées)

| Table | Données personnelles | Finalité |
|---|---|---|
| `utilisateur` (`init.sql`) | email, hash mot de passe (`mot_de_passe_hash`), nom, prénom, téléphone, rôle, type client, SIRET, raison sociale, n° TVA, consentement CGU/newsletter, dates de connexion | Compte client/pro, authentification, marketing (si opt-in) |
| `adresse` | adresses de livraison/facturation liées à l'utilisateur | Livraison, facturation |
| `commande` | historique d'achats, adresse de livraison/facturation en JSONB, mode de paiement | Exécution du contrat de vente |
| `facture` (migration `0008_facturation.sql`) | nom, email, adresse client en snapshot immuable | Obligation légale (facturation France) |
| `refresh_token` (migration `0003_refresh_token.sql`) | hash SHA-256 du token, utilisateur_id, IP non stockée ici | Authentification, sécurité de session |
| `audit_log` (migration `0004_audit_log.sql`) | utilisateur_id (acteur admin), action, entité concernée, `ip_address` | Traçabilité actions admin sensibles |
| `code_promo_utilisation` (migration `0010_codes_promo.sql`, en cours) | utilisateur_id, montant du rabais appliqué | Suivi d'utilisation des codes promo |

### Ce qui est implémenté

- **Mots de passe :** hachés avec bcrypt (12 rounds, `auth.service.js`), jamais stockés en clair.
- **JWT :** access token à durée limitée (7 jours par défaut, configurable via `JWT_EXPIRES_IN`), refresh token distinct (30 jours).
- **Refresh tokens révocables :** table `refresh_token` dédiée — stockage du hash SHA-256 (pas le token en clair), révocation possible individuellement (déconnexion) et rotation à chaque refresh (implémenté T2-03..T2-05, confirmé dans `docs/workflow/ETAT_ACTUEL_PROJET.md`).
- **CORS restreint :** `backend/src/index.js` configure `cors()` avec `origin: process.env.CORS_ORIGIN || 'http://localhost:5173'` (plus de wildcard `*`, corrigé T0-07 — anciennement un problème P0 sur `/uploads`).
- **Droit à l'effacement (déjà codé) :** `DELETE /api/auth/account` → `authService.deleteAccount()` → anonymisation du compte (`userRepository.anonymize()`), avec protection empêchant la suppression d'un compte ADMIN par cette voie. L'historique de commandes est conservé (nécessaire pour la facturation légale) mais le compte est anonymisé plutôt que supprimé physiquement.
- **Pages légales déjà rédigées et routées** (`frontend/src/App.jsx`) : `/cgv` (CGVPage.jsx), `/confidentialite` (ConfidentialitePage.jsx, inclut une section Cookies), `/mentions-legales` (MentionsLegalesPage.jsx), `/accessibilite` (AccessibilitePage.jsx). Ces pages existent avec un contenu substantiel (300+ lignes chacune) — contrairement à une hypothèse de document manquant, elles sont présentes au moment de l'inspection.

### Ce qui manque

- [x] ~~**Bannière de consentement cookies (opt-in actif)**~~ — **RÉSOLU (2026-07-04)** : `frontend/src/components/CookieBanner.jsx` créé et monté dans `App.jsx`. Les cookies utilisés étant strictement techniques (JWT/session), un bandeau d'information dismissible suffit — la CNIL n'exige pas de consentement actif pour les cookies exemptés.
- [ ] **Droit d'accès / export des données personnelles** — aucun endpoint identifié (type `GET /api/auth/mes-donnees` ou export JSON/CSV). Le droit à l'effacement existe, pas le droit d'accès formalisé.
- [ ] **Registre des traitements** — aucun document identifié listant formellement les traitements, bases légales et durées de conservation par catégorie de données.
- [ ] **Politique de conservation explicite pour les logs applicatifs** (voir point Winston ci-dessous).
- [ ] **Conditions de traitement des données Google (Gmail SMTP)** formalisées (à vérifier — voir points ci-dessous, hors périmètre du code source). Migration depuis Brevo le 2026-07-08, voir `docs/guides/GUIDE_GMAIL_SMTP.md`.

### Points à vérifier (hors code, ou nécessitant confirmation)

| Point | État constaté | À faire |
|---|---|---|
| DPA (Data Processing Agreement) Google (Gmail SMTP) | Non vérifiable dans le code — Google (Gmail/Google Workspace) est désormais le sous-traitant RGPD pour les emails transactionnels depuis la migration Brevo → Gmail SMTP (2026-07-08, voir `docs/guides/GUIDE_GMAIL_SMTP.md`) | Vérifier les termes de traitement des données Google Workspace/Gmail applicables au compte utilisé |
| Localisation des données Cloudflare R2 | **Déjà en EU** d'après `docs/workflow/ETAT_ACTUEL_PROJET.md` (endpoint EU configuré, bucket `jana-products`) | Confirmer le custom domain de prod reste bien sur la même région |
| Durée de conservation des logs Winston | `backend/src/config/logger.js` : rotation par taille (5 Mo × 5 fichiers), **aucune purge par durée** trouvée dans la config | Définir une politique de rétention explicite (ex. purge après X mois) et la documenter |
| Durée de conservation des factures | 10 ans (obligation légale France) mentionnée en décision (`DM-08`) mais **à confirmer formellement** par le comptable | Validation comptable |
| Consentement newsletter | Champ `utilisateur.accepte_newsletter` existe en DB et est collecté à l'inscription — vérifier qu'il conditionne bien tout envoi marketing (actuellement Gmail SMTP n'est utilisé que pour les emails transactionnels, migré depuis Brevo le 2026-07-08) | Vérifier au moment de l'ajout d'une vraie newsletter marketing |

---

## Partie 2 — Accessibilité (RGAA / WCAG 2.1 AA)

### Ce qui est implémenté

- **`lang="fr"`** déclaré sur la balise `<html>` de `frontend/index.html` — conforme.
- **Structure HTML sémantique** via composants React (titres, listes, sections) — utilisée dans les pages légales et le catalogue produit.
- **Classes de focus visibles** : usage de `focus:ring` / `focus-visible` Tailwind trouvé dans 29 fichiers de composants/pages — effort de focus clavier déjà engagé, mais couverture non auditée exhaustivement.
- **Attributs `alt` sur les images produits** (ex. `frontend/src/components/ProductCard.jsx:79` — `alt={nom}`), bonne pratique de base respectée sur les composants inspectés.
- **Une déclaration d'accessibilité existe déjà** (`/accessibilite`) et déclare honnêtement une **conformité partielle au RGAA 4.1**, avec une liste des points conformes et des contenus non encore accessibles (images décoratives sans `alt` vide, PDF de factures non garantis accessibles, certaines animations sans option de réduction de mouvement) — ce texte est déclaratif et n'est pas basé sur un audit RGAA formel outillé.

### Ce qui manque

- [ ] **Audit de contraste systématique** — aucune preuve d'un audit outillé (type WebAIM/axe) au-delà de l'affirmation textuelle de la page `/accessibilite`.
- [ ] **Test de navigation clavier complet** (tunnel de commande, modales admin) — non vérifié par du code automatisé (pas de test Playwright/Cypress d'accessibilité trouvé).
- [ ] **`aria-label` généralisés** — seulement 8 fichiers utilisent `aria-label` sur l'ensemble du frontend ; couverture partielle, notamment probable sur les icônes cliquables sans texte visible (boutons d'action admin, icônes panier).
- [ ] **`role="alert"` sur les messages d'erreur** — aucune occurrence trouvée dans `frontend/src/` ; les erreurs de formulaire (ex. code promo invalide, erreurs de connexion) reposent sur des toasts (`toast.error`) dont l'accessibilité aux lecteurs d'écran n'est pas garantie sans `role="alert"`/`aria-live`.
- [ ] **Labels de formulaire systématiques** — 25 fichiers utilisent `<label>` mais seulement 5 utilisent `htmlFor` en association explicite avec un `id` de champ ; à vérifier que les labels restants sont bien associés (imbrication implicite) ou corrigés.
- [ ] **Test réel avec lecteur d'écran** (NVDA/VoiceOver) — non réalisé à ce jour d'après le code et les journaux du projet.
- [ ] **Audit Lighthouse/axe formel documenté** — aucun rapport trouvé dans le dépôt.

### Outils recommandés

- **axe DevTools** (extension navigateur) — audit automatisé rapide sur les pages clés (Accueil, Catalogue, Checkout, Admin).
- **Lighthouse** (Chrome DevTools ou CLI) — score accessibilité + performance, à intégrer si possible en CI.
- **NVDA** (Windows, gratuit) — test manuel de navigation au lecteur d'écran sur le tunnel de commande.
- **WebAIM Contrast Checker** — validation des couleurs de la charte Jana Distribution (vert `#4CAF50` notamment, cf. `theme-color` dans `index.html`) contre le ratio WCAG AA (4.5:1 texte normal).

### Score cible

**Lighthouse Accessibilité > 90/100** avant mise en production, sur au minimum : page d'accueil, catalogue, fiche produit, tunnel de commande (checkout), et tableau de bord admin.
