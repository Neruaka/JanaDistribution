# 06 — Audit Backend et Base de Données

---

## Organisation Express

L'architecture backend suit un pattern **Routes → Controllers → Services → Repositories** cohérent et bien appliqué. C'est l'une des forces du projet.

```
Routes      : Définissent les endpoints, appliquent middlewares et validations
Controllers : Extraient les paramètres, délèguent au service, formatent la réponse
Services    : Logique métier, orchestration
Repositories: Requêtes SQL, mapping données
```

---

## Middlewares globaux

**Fichier** : `backend/src/index.js`

| Middleware | Configuré | Note |
|---|---|---|
| `helmet()` | ✅ | Headers sécurité HTTP |
| `cors()` | ✅ | Origine depuis `CORS_ORIGIN` env |
| Rate limit global `/api/` | ✅ | 300 req / 15 min |
| Rate limit auth `/api/auth` | ✅ | 20 req / 15 min |
| `express.json({ limit: '10mb' })` | ✅ | Parsing JSON |
| `express.static` pour uploads | ✅ | Avec CORS headers |
| `notFoundHandler` | ✅ | 404 catch-all |
| `errorHandler` | ✅ | Gestion erreurs centralisée |

**Attention** : `express.json()` est monté **après** `webhookRoutes`. C'est intentionnel et correct — le webhook Stripe nécessite le body brut avant parsing JSON.

---

## Authentification et autorisations

**Fichier** : `backend/src/middlewares/auth.middleware.js`

| Middleware | Fonctionnement | Note |
|---|---|---|
| `authenticate` | Vérifie JWT + user actif en DB | Correct |
| `optionalAuth` | Attache user si token présent, sinon continue | Correct |
| `isAdmin` | Vérifie `req.user.role === 'ADMIN'` | Correct |
| `requireAdmin` | Alias de `isAdmin` | OK |
| `hasPermission(perm)` | Vérifie permission dans `req.user.permissions` | Stub — `permissions` n'est pas dans la table utilisateur |
| `isOwnerOrAdmin` | Admin peut tout, client vérifie ownership | Correct |

**Problème** : `hasPermission` teste `req.user.permissions` qui n'existe pas dans le modèle utilisateur actuel. Ce middleware est mort ou non fonctionnel.

---

## Gestion des commandes — Transaction atomique

**Fichier** : `backend/src/repositories/order.repository.js`, méthode `create()`

La création de commande est **correctement atomique** :

```
BEGIN
  INSERT commande
  Pour chaque ligne:
    UPDATE produit SET stock = stock - qty WHERE est_actif = true AND stock >= qty
    → Si 0 ligne mise à jour → THROW ApiError → ROLLBACK
    INSERT ligne_commande
  DELETE panier items
COMMIT
```

**Points positifs** :
- Décrémentation stock atomique avec vérification en une seule requête (pas de race condition)
- ROLLBACK en cas d'erreur → commande jamais dans état partiel
- Lignes de commande créées dans la même transaction

**Point faible** : La vidange du panier (`cartRepository.clearCart`) est appelée dans `order.service.js` **après** le `commit` (ligne 183). Si la vidange échoue, la commande est créée mais le panier n'est pas vidé. Ce n'est pas critique (le stock est déjà décrémenté) mais peut créer une incohérence UI.

---

## Requêtes SQL et injections

Toutes les requêtes SQL analysées utilisent des **paramètres positionnels** (`$1`, `$2`, etc.) :

```javascript
// Exemple correct — order.repository.js
const result = await query(
  'SELECT id FROM commande WHERE numero_commande = $1',
  [numero]
);
```

**Aucune concaténation de chaîne SQL identifiée** dans les fichiers analysés.

**Attention** : La génération de la clause `ORDER BY` utilise un mapping whitelist :

```javascript
// admin.order.routes.js
const orderByMapping = {
  createdAt: 'c.date_commande',
  total: 'c.total_ttc',
  statut: 'c.statut'
};
const orderColumn = orderByMapping[orderBy] || 'c.date_commande';
```

C'est **correct** — la valeur utilisateur n'est jamais interpolée directement, seulement le résultat du mapping whitelist.

---

## Service payment — Webhook Stripe

**Fichier** : `backend/src/services/payment.service.js`

| Aspect | Constat |
|---|---|
| Vérification signature | ✅ `stripe.webhooks.constructEvent` avec secret |
| Idempotency | ✅ `INSERT stripe_event ON CONFLICT DO NOTHING` |
| `checkout.session.completed` | ✅ Vérifie `payment_status === 'paid'` avant de marquer |
| `checkout.session.expired` | ✅ Met FAILED |
| `payment_intent.payment_failed` | ✅ Met FAILED |
| `charge.refunded` | ⚠️ Utilise `charge.refunded`, moins précis que `refund.created` |
| Protection double PAID | ✅ `WHERE paiement_statut <> 'PAID'` dans `markPaid` |
| Auto-transition EN_ATTENTE → CONFIRMEE | ✅ Après webhook PAID |

**Problème P1** : `charge.refunded` est déclenché même pour un remboursement partiel. `refund.created` est plus précis. De plus, un remboursement partiel marque toute la commande REFUNDED, ce qui est incorrect.

**Problème P1** : La table `stripe_event` stocke le payload JSON complet de l'événement Stripe, qui peut contenir des données sensibles (emails, métadonnées). À anonymiser ou stocker partiellement.

---

## Service settings — Livraison

**Fichier** : `backend/src/services/settings.service.js`

- Mode FIXE : frais fixes depuis configuration table
- Mode DISTANCE : calcul Haversine via BAN API (adresse.data.gouv.fr)
- Cache coordonnées départ dans `configuration` table
- Franco de port vérifié en priorité
- Frais client ignorés, valeur serveur utilisée

**Problème P2** : `getFraisLivraison` appelle `settingsRepository.get()` plusieurs fois en série (seuilFranco, fraisStandard, mode, prixParKm...). En mode DISTANCE, cela représente 5-6 requêtes DB par commande. Cache Redis partiel mais non garanti.

---

## Gestion des emails

**Fichier** : `backend/src/services/email.service.js`

| Aspect | Constat |
|---|---|
| Fournisseur | Brevo (API REST, pas SMTP) |
| Initialisation | `init()` au démarrage, warn si clé absente |
| Non bloquant | Emails envoyés de manière non-bloquante dans auth.service.js |
| Templates | HTML inline dans le service |
| Statuts couverts | EN_ATTENTE, CONFIRMEE, EN_PREPARATION, EXPEDIEE, LIVREE, ANNULEE |
| Mot de passe oublié | ✅ |
| Bienvenue | ✅ |
| Facture par email | 🚫 Absent |

**Encodage** : Les templates HTML du service email contiennent des mots sans accents (`envoye`, `recu`, `veuillez`). Cela semble intentionnel pour éviter les problèmes d'encodage, mais donne un résultat peu professionnel.

---

## Base de données — Schéma

### Types de montants

**Problème P1** : Les montants sont stockés en `DECIMAL(10,2)`. En e-commerce, la recommandation est de stocker en **centimes entiers** (INTEGER) pour éviter les arrondis flottants.

```sql
-- Actuel
prix DECIMAL(10, 2) NOT NULL
total_ht DECIMAL(10, 2) NOT NULL
```

La bibliothèque `pg` retourne ces valeurs comme des **chaînes de caractères** en JavaScript, ce qui évite les erreurs IEEE 754. Les conversions `parseFloat()` dans les repositories sont donc nécessaires mais introduisent un risque d'arrondi.

**Mitigation existante** : `Math.round(...* 100) / 100` utilisé dans `settings.service.js` pour les frais. Partiellement présent.

**Recommandation** : Migrer vers INTEGER (centimes) ou maintenir les `parseFloat` avec attention. Le risque est faible avec DECIMAL PostgreSQL mais non nul.

### Séquence numéro commande

**Problème P2** : La séquence `commande_numero_seq` est globale et incrémentale. Le format attendu est `CMD-YYYYMMDD-XXXX`, suggérant une remise à zéro par jour. Or la séquence ne se remet pas à zéro — on peut donc avoir `CMD-20241231-0099` un jour et `CMD-20250101-0100` le lendemain, ce qui est visuellement cohérent mais peut créer de la confusion pour les comptages journaliers.

### Tables absentes

- `commande_statut_historique` — Absent
- `facture` / `facture_ligne` — Absent
- `avoir` — Absent
- `audit_log` — Absent
- `refresh_token` — Absent (tokens non révocables)
- `token_revoque` — Absent

### Tables présentes et analysées

| Table | Contraintes | Index | Note |
|---|---|---|---|
| `utilisateur` | UK email, check SIRET pro | email, role, est_actif, reset_token | Correct |
| `adresse` | FK utilisateur ON DELETE CASCADE | utilisateur_id, type | Correct |
| `categorie` | UK slug | slug, est_actif, ordre | Correct |
| `produit` | UK reference, UK slug | 10 index | Bien indexé |
| `panier` | UK utilisateur_id | session_id | Correct |
| `ligne_panier` | UK (panier_id, produit_id) | panier_id, produit_id | Correct |
| `commande` | UK numero_commande | 7 index | Bien indexé |
| `ligne_commande` | produit_id FK ON DELETE SET NULL | commande_id, produit_id | produit peut être supprimé |
| `stripe_event` | UK event_id | type | Correct |
| `configuration` | PK cle | categorie | Correct |

### Triggers

```sql
-- Mis à jour automatiquement sur UPDATE
BEFORE UPDATE ON utilisateur → update_date_modification()
BEFORE UPDATE ON produit → update_date_modification()
BEFORE UPDATE ON panier → update_date_modification()
BEFORE UPDATE ON commande → update_date_modification()
BEFORE UPDATE ON configuration → update_date_modification()
```

Les triggers sont en place et corrects.

---

## Concurrence et stock

**Race condition** : Gérée par `UPDATE produit WHERE stock >= qty` — si deux commandes sont soumises simultanément, une seule réussira. L'autre obtiendra `rowCount = 0` et une `ApiError` sera lancée → `ROLLBACK`. C'est le comportement correct.

---

## Endpoints non utilisés ou suspects

| Endpoint | Constat |
|---|---|
| `GET /api/users/...` | Route `user.routes.js` montée mais pas dans index.js (non vérifié) |
| `hasPermission()` middleware | Jamais appliqué car `permissions` non en DB |

---

## Résumé des problèmes backend

| ID | Sévérité | Description | Fichier |
|---|---|---|---|
| BE-01 | P1 | `charge.refunded` moins précis que `refund.created` | `payment.service.js:244` |
| BE-02 | P1 | `stripe_event.payload` stocke données sensibles Stripe | `payment.service.js:146` |
| BE-03 | P1 | `hasPermission()` middleware non fonctionnel (permissions absent du modèle) | `auth.middleware.js:149` |
| BE-04 | P1 | Vidange panier hors transaction commande | `order.service.js:183` |
| BE-05 | P1 | Montants en DECIMAL(10,2) au lieu de centimes entiers | `init.sql` |
| BE-06 | P2 | Séquence commande non remise à zéro par jour | `init.sql` |
| BE-07 | P2 | `getFraisLivraison` : requêtes DB séquentielles non cachées | `settings.service.js` |
| BE-08 | P2 | Doublon packages Redis (ioredis + redis) | `package.json` |
| BE-09 | P2 | Doublon validation (express-validator + Joi) | `package.json` |
| BE-10 | P2 | Encodage UTF-8 corrompu dans plusieurs fichiers source | Multiples |
| BE-11 | P3 | Templates email sans accents (présentation) | `email.service.js` |
