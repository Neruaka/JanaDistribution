# 07 — Audit de Sécurité

> ⚠️ **Document historique (état figé au 2026-06-14)** — Rédigé lors de l'audit initial, avant le retrait complet de Stripe (T4-07, 2026-07-02) et l'ajout de la facturation légale (Phase 5) et des tests d'intégration réels (Phase 7). Les références à Stripe, aux webhooks et aux tests 100% mockés ne reflètent plus l'état actuel du code. Voir `ETAT_ACTUEL_PROJET.md` et `PLAN_CORRECTION_AUDIT.md` pour l'état réel à jour.

> ⚠️ Ce rapport classe les risques mais ne constitue pas un audit de pénétration.
> Les vulnérabilités non confirmées sont signalées comme « risque probable » ou « point à vérifier ».

---

## Tableau des vulnérabilités et risques

| ID | Sévérité | Type | Composant | Statut | Preuve | Scénario | Impact | Correction |
|---|---|---|---|---|---|---|---|---|
| SEC-01 | Critique | Token non révocable | `auth.service.js` | Mauvaise pratique | Refresh token non stocké en DB | Token volé reste valide 7j sans possibilité de révocation | Accès non autorisé persistant | Blacklist Redis ou durée ≤ 1h |
| SEC-02 | Critique | Images éphémères | `upload.middleware.js` | Vulnérabilité confirmée | `UPLOAD_DIR` = disque local | Redéploiement Railway efface les images → catalogue visuellement cassé | Perte de données, UX dégradée | Migration vers S3/Cloudflare R2 |
| SEC-03 | Élevée | Message checkout trompeur | `CheckoutPage.jsx:358` | Vulnérabilité confirmée | Texte "devis / paiement à la livraison" | Client croit ne pas être débité alors que Stripe prélève | Confiance brisée, litiges | Adapter message selon modePaiement |
| SEC-04 | Élevée | `JWT_REFRESH_SECRET` fallback silencieux | `auth.service.js:25` | Risque probable | `process.env.JWT_REFRESH_SECRET \|\| process.env.JWT_SECRET` | Si JWT_REFRESH_SECRET non configuré, access et refresh signés avec le même secret → un refresh token peut être utilisé comme access token | Élévation de privilèges potentielle | Exiger JWT_REFRESH_SECRET distinct |
| SEC-05 | Élevée | `stripe_event` stocke payload complet | `payment.service.js:146` | Mauvaise pratique | `INSERT ... payload: event.data` | Payload Stripe peut contenir email client, derniers chiffres carte, adresse | Fuite données personnelles | Ne stocker que `event.id`, `type`, `processed_at` |
| SEC-06 | Moyenne | `hasPermission()` middleware non fonctionnel | `auth.middleware.js:149` | Vulnérabilité confirmée | `req.user.permissions` absent du modèle | Si utilisé, renverrait un faux positif ou faux négatif | Mauvais contrôle accès | Supprimer ou implémenter réellement |
| SEC-07 | Moyenne | Vidange panier hors transaction | `order.service.js:183` | Mauvaise pratique | `clearCart` appelé après `COMMIT` | Si clearCart échoue, panier non vidé mais stock décrémenté → double commande potentielle | Incohérence stock/panier | Inclure clearCart dans la transaction |
| SEC-08 | Moyenne | CORS `*` sur `/uploads` | `index.js:115-119` | Mauvaise pratique | `res.setHeader('Access-Control-Allow-Origin', '*')` | N'importe quel site peut charger les images — acceptable pour des images publiques mais potentiellement problématique | Scraping images, hotlinking | Restreindre à l'origine connue |
| SEC-09 | Moyenne | Pas de validation force MDP backend | `auth.service.js` | Point à vérifier | Aucun check regex sur `motDePasse` | Mot de passe `a` accepté côté backend | Comptes faibles | Valider longueur min 8, complexité |
| SEC-10 | Faible | `charge.refunded` vs `refund.created` | `payment.service.js:244` | Mauvaise pratique | Événement moins précis | Remboursement partiel marque toute commande REFUNDED | Incohérence comptable | Utiliser `refund.created` |
| SEC-11 | Faible | Dépendances non auditées | `package.json` | Non vérifiable | `npm audit` non lancé | CVE dans une dépendance | Variable | `npm audit --production` régulièrement |
| SEC-12 | Faible | `commande_numero_seq` non remise à 0 | `init.sql` | Information | Séquence globale | Numéros non consécutifs par jour | Confusion comptable | Séquence par jour ou format différent |

---

## Section Authentification

| Aspect | État | Détail |
|---|---|---|
| Hachage mot de passe | ✅ Bon | bcrypt 12 rounds |
| Comparaison timing-safe | ✅ Bon | `bcrypt.compare` est résistant aux timing attacks |
| JWT access token | ✅ Présent | 7 jours — trop long sans révocation |
| JWT refresh token | ⚠️ Partiel | Généré, renvoyé, mais non stocké en DB |
| Vérification user actif | ✅ Bon | `findById` à chaque requête authentifiée |
| Reset password | ✅ Bon | Token haché en SHA-256 avant stockage |
| Reset token expiry | ✅ Bon | 1 heure, nettoyé après usage |
| Réponse identique email existant/inexistant | ✅ Bon | Anti-énumération |
| Rate limiting login | ✅ Bon | 20 req / 15 min sur `/api/auth` |
| Refresh token rotation | ✅ Bon | Nouveau refresh renvoyé à chaque usage |
| Révocation à la déconnexion | 🚫 Absent | Token reste valide jusqu'à expiration |

---

## Section Autorisation

| Aspect | État | Détail |
|---|---|---|
| Routes admin protégées | ✅ Bon | `authenticate + isAdmin` sur tous les routes admin |
| Routes client protégées | ✅ Bon | `authenticate` requis |
| Ownership commandes | ✅ Bon | `userId` vérifié sur GET /api/orders/:id |
| Ownership session Stripe | ✅ Bon | `order.utilisateurId !== req.user.id` vérifié |
| Mise à jour statut par admin | ✅ Bon | Route `/api/admin/orders/:id/status` protégée isAdmin |
| Forcer PAID manuellement (CARTE) | ✅ Bon | Refusé côté backend pour mode CARTE |
| Permissions granulaires | 🚫 Absent | `hasPermission()` non fonctionnel |

---

## Section Données Financières

| Aspect | État | Détail |
|---|---|---|
| Prix calculés côté serveur | ✅ Bon | `cart.service.js` recalcule depuis DB |
| Frais livraison côté serveur | ✅ Bon | Valeur client ignorée, log émis |
| Montants Stripe depuis DB | ✅ Bon | `line_items` construits depuis `commande.lignes` en DB |
| Double paiement protégé | ✅ Bon | `WHERE paiement_statut <> 'PAID'` idempotent |
| Remboursement partiel | ⚠️ Partiel | `charge.refunded` marque tout REFUNDED |
| Stockage montants DECIMAL | ⚠️ À améliorer | Préférer centimes entiers |

---

## Section Stripe

| Aspect | État | Détail |
|---|---|---|
| Clé secrète côté serveur uniquement | ✅ Bon | `getStripe()` côté backend uniquement |
| Signature webhook vérifiée | ✅ Bon | `constructEvent(rawBody, signature, secret)` |
| Body brut pour webhook | ✅ Bon | Monté avant `express.json()` |
| Idempotency webhooks | ✅ Bon | `stripe_event ON CONFLICT DO NOTHING` |
| Pas de validation URL retour comme preuve | ✅ Bon | `PaymentSuccessPage` poll serveur |
| Idempotency-key création session | ✅ Bon | `order_${order.id}_v1` |
| Secret webhook en env | ✅ Bon | `STRIPE_WEBHOOK_SECRET` requis |
| Erreur si STRIPE_SECRET_KEY absent | ✅ Bon | Exception explicite dans `getStripe()` |
| Payload webhook stocké intégralement | ⚠️ Problème | Données potentiellement sensibles |

---

## Section Uploads

| Aspect | État | Détail |
|---|---|---|
| Types MIME filtrés | ✅ Bon | Whitelist : jpeg, jpg, png, webp, gif |
| Taille limitée | ✅ Bon | 5 MB max |
| Nom de fichier aléatoire (UUID) | ✅ Bon | Pas de traversal de chemin |
| Chemin absolu contrôlé | ✅ Bon | `path.join(__dirname, ...)` |
| Scan antivirus | 🚫 Absent | Non implémenté |
| Stockage éphémère | ❌ Critique | Disque local Railway → données perdues |
| CORS sur /uploads | ⚠️ Large | `Access-Control-Allow-Origin: *` |

---

## Section Secrets

| Aspect | État | Détail |
|---|---|---|
| Aucun secret hardcodé | ✅ Bon | Variables d'environnement utilisées |
| `.env.example` documenté | ✅ Bon | Toutes les variables listées |
| `JWT_REFRESH_SECRET` fallback | ⚠️ Risque | Utilise `JWT_SECRET` si absent |
| `backend/.env` présent | ⚠️ À vérifier | Fichier `.env` commité possible — non lu pour éviter exposition |

---

## Section Dépendances

| Package | Version | Risque |
|---|---|---|
| `multer` | 1.4.5-lts.1 | Version LTS de maintenance, surveiller CVE |
| `jsonwebtoken` | 9.0.2 | Actuel |
| `bcrypt` | 5.1.1 | Actuel |
| `stripe` | 22.0.2 | Actuel |
| `express` | 4.18.2 | Express 5 disponible, migration future |
| `ioredis` | 5.3.2 | Actuel |
| `redis` | 4.7.1 | **Doublon — à supprimer** |

**Recommandation** : Lancer `npm audit --production` dans `backend/` et résoudre les CVE critiques ou élevées avant go-live.

---

## Section Production

| Aspect | État | Détail |
|---|---|---|
| `NODE_ENV=production` | ❓ Non vérifié | Variable Railway non vérifiée localement |
| Logs sans données sensibles | ✅ Bon | Winston, pas de log de mdp ou token |
| Messages d'erreur génériques | ✅ Bon | `ApiError` avec messages contrôlés |
| Stack traces en production | ❓ À vérifier | `errorHandler.js` à inspecter |
| HTTPS | ✅ Railway | Railway fournit TLS automatiquement |
| Headers sécurité | ✅ Bon | Helmet configuré |

---

## Recommandations prioritaires

### Immédiat (P0)

1. **Migrer les images** vers S3 ou Cloudflare R2 avant tout déploiement commercial
2. **Corriger le message checkout** pour distinguer "carte" (paiement immédiat) et autres modes

### Avant lancement (P1)

3. **Implémenter révocation tokens** : stocker refresh tokens en DB, blacklist pour access tokens ou réduire durée à 15-30 min
4. **Forcer `JWT_REFRESH_SECRET`** distinct de `JWT_SECRET` — erreur au démarrage si absent
5. **Réduire payload `stripe_event`** — ne stocker que `event_id`, `type`, `processed_at`
6. **Valider force du mot de passe** côté backend (8 chars min, au moins 1 chiffre)
7. **Inclure vidange panier dans la transaction** de création commande

### Avant mise à l'échelle (P2)

8. **Supprimer `hasPermission()` ou l'implémenter** correctement
9. **`npm audit`** + mise à jour dépendances vulnérables
10. **Restreindre CORS `/uploads`** à l'origine frontend uniquement
