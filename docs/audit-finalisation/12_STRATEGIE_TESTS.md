# 12 — Stratégie de Tests

---

## Tests existants

### Backend

| Emplacement | Type | Contenu |
|---|---|---|
| `backend/tests/setup.js` | Configuration | Mocks globaux DB, Redis, logger ; données de test réutilisables |
| `backend/coverage/` | Rapport | Rapport de couverture présent (commité) |
| `backend/reports/junit.xml` | Rapport CI | Rapport JUnit présent |

**Problème majeur** : Le fichier `setup.js` mocke entièrement la base de données :

```javascript
jest.mock('../src/config/database', () => mockPool);
jest.mock('../src/config/redis', () => mockRedis);
```

Tous les tests backend s'exécutent contre une **base de données simulée**, jamais contre une vraie DB. Cela signifie que les requêtes SQL ne sont jamais réellement testées. Une migration cassée ou une requête incorrecte ne sera pas détectée par les tests.

### Frontend

| Emplacement | Type | Contenu |
|---|---|---|
| `frontend/src/utils/imageUtils.test.js` | Unitaire | Test utilitaire images |

Un seul fichier de test frontend, portant sur une fonction utilitaire.

---

## Couverture manquante (critique)

| Fonctionnalité | Type test manquant | Priorité |
|---|---|---|
| Création de commande avec transaction | Intégration (vraie DB) | P0 |
| Décrémentation stock atomique | Intégration | P0 |
| Webhook Stripe complet | Intégration | P0 |
| Idempotency webhook (double envoi) | Intégration | P0 |
| Authentification login/register | Intégration | P1 |
| Calcul frais de livraison serveur | Unitaire / Intégration | P1 |
| Frais non falsifiables (valeur client ignorée) | Intégration | P1 |
| Calcul montants commande | Unitaire | P1 |
| Validation admin vs client sur routes | Intégration | P1 |
| Génération facture (à implémenter) | Unitaire + Intégration | P1 |
| Remboursement et avoir | Intégration | P1 |
| Double paiement bloqué | Intégration | P1 |
| Overflow stock (race condition) | Intégration avec concurrence | P2 |

---

## Stratégie recommandée

### Principe directeur

> Un test qui mocke la base de données ne teste pas le comportement réel de l'application en production.

Les tests d'intégration **doivent** utiliser une vraie base de données PostgreSQL de test.

### Configuration recommandée

```javascript
// backend/tests/setup.integration.js (à créer)
// Connexion à jana_test (base de données dédiée aux tests)
// Exécute init.sql avant les tests
// Vide les tables entre chaque test avec TRUNCATE ... CASCADE

process.env.DB_NAME = 'jana_test';
// Ne pas mocker la DB
```

```javascript
// jest.config.js — séparer unitaires et intégration
module.exports = {
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
      setupFilesAfterFramework: ['./tests/setup.unit.js']  // mock DB
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
      setupFilesAfterFramework: ['./tests/setup.integration.js']  // vraie DB
    }
  ]
};
```

---

## Tests prioritaires à implémenter

### P0 — Avant tout déploiement

```javascript
// tests/integration/order.create.test.js
describe('Création de commande', () => {
  it('crée une commande et décrémente le stock en transaction atomique');
  it('annule la commande si stock insuffisant');
  it('refuse de créer si panier vide');
  it('calcule les montants côté serveur (ignore valeur client)');
  it('refuse deux commandes simultanées sur le même stock limité');
});

// tests/integration/webhook.stripe.test.js
describe('Webhook Stripe', () => {
  it('refuse un webhook sans signature');
  it('traite checkout.session.completed et marque PAID');
  it('ignore un webhook déjà traité (idempotency)');
  it('traite checkout.session.expired et marque FAILED');
  it('traite payment_intent.payment_failed et marque FAILED');
  it('traite refund.created et marque REFUNDED');
});
```

### P1 — Avant acceptation de vrais paiements

```javascript
// tests/integration/auth.test.js
describe('Authentification', () => {
  it('inscrit un utilisateur et génère un token valide');
  it('refuse le login avec mauvais mot de passe');
  it('rafraîchit le token avec un refresh token valide');
  it('refuse une route admin avec un token client');
  it('refuse après expiration du token');
});

// tests/integration/shipping.test.js
describe('Frais de livraison', () => {
  it('calcule franco si montant >= seuil');
  it('applique frais fixes si montant < seuil');
  it('ignore les frais envoyés par le client');
  it('refuse les adresses hors zone en mode DISTANCE');
});

// tests/unit/invoice.service.test.js (une fois implémenté)
describe('Facturation', () => {
  it('génère un numéro de facture séquentiel unique');
  it('snapshot les données entreprise au moment de l\'émission');
  it('génère un avoir après remboursement');
  it('refuse de modifier une facture déjà émise');
});
```

### P2 — Qualité

```javascript
// tests/integration/payment.double.test.js
describe('Protection double paiement', () => {
  it('refuse deux sessions Stripe pour la même commande PAID');
  it('ignore deux webhooks identiques');
});

// tests/integration/admin.test.js
describe('Accès admin', () => {
  it('refuse accès routes admin à un CLIENT');
  it('accepte accès routes admin à un ADMIN');
  it('permet modification statut commande EN_ATTENTE → CONFIRMEE');
  it('refuse transition invalide LIVREE → EN_ATTENTE');
});
```

---

## Outils recommandés

### Backend

| Outil | Usage |
|---|---|
| **Jest** | Framework test (déjà installé) |
| **supertest** | Tests API HTTP (déjà installé) |
| **testcontainers-node** | PostgreSQL dans Docker pour tests intégration |
| **stripe-mock** ou Stripe test mode | Tests webhook Stripe |

### Frontend

| Outil | Usage |
|---|---|
| **Vitest** | Framework test (déjà installé) |
| **@testing-library/react** | Tests composants (déjà installé) |
| **msw** (Mock Service Worker) | Mock API pour tests frontend |

### End-to-End

| Outil | Usage |
|---|---|
| **Playwright** | Tests E2E navigateur (recommandé) |
| **Cypress** | Alternative E2E |

### Stripe

| Outil | Usage |
|---|---|
| **Stripe CLI** | `stripe trigger checkout.session.completed` pour tester webhooks localement |
| **Stripe test cards** | `4242 4242 4242 4242` pour paiements de test |

---

## Stratégie CI recommandée

```yaml
# .github/workflows/ci.yml (mise à jour recommandée)
jobs:
  test-unit:
    runs-on: ubuntu-latest
    steps:
      - run: npm test:unit   # Rapide, pas de DB

  test-integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: jana_test
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
    steps:
      - run: npm test:integration   # Contre vraie DB

  test-e2e:
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:e2e   # Playwright (futur)
```

---

## Commandes npm à ajouter

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest tests/unit --coverage",
    "test:integration": "jest tests/integration --coverage",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --coverage --reporters=default --reporters=jest-junit"
  }
}
```
