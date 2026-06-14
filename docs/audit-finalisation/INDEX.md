# INDEX — Audit Jana Distribution

> Point d'entrée de l'audit complet. Généré le 14 juin 2026.

---

## Documents de l'audit

| # | Fichier | Contenu | Statut |
|---|---|---|---|
| 00 | [00_RESUME_EXECUTIF.md](00_RESUME_EXECUTIF.md) | Vue d'ensemble, verdict, problèmes P0/P1 | Complet |
| 01 | [01_INVENTAIRE_PROJET.md](01_INVENTAIRE_PROJET.md) | Fichiers, dépendances, technologies | Complet |
| 02 | [02_MATRICE_REQUIREMENTS.md](02_MATRICE_REQUIREMENTS.md) | Fonctionnalités implémentées vs manquantes | Complet |
| 03 | [03_ARCHITECTURE_ACTUELLE.md](03_ARCHITECTURE_ACTUELLE.md) | Architecture réelle en production | Complet |
| 04 | [04_ARCHITECTURE_CIBLE.md](04_ARCHITECTURE_CIBLE.md) | Architecture recommandée après corrections | Complet |
| 05 | [05_AUDIT_FRONTEND.md](05_AUDIT_FRONTEND.md) | React, pages, composants, UX | Complet |
| 06 | [06_AUDIT_BACKEND_BDD.md](06_AUDIT_BACKEND_BDD.md) | Express, services, repositories, schéma DB | Complet |
| 07 | [07_AUDIT_SECURITE.md](07_AUDIT_SECURITE.md) | JWT, CORS, rate limiting, secrets | Complet |
| 08 | [08_STRIPE_PAIEMENTS.md](08_STRIPE_PAIEMENTS.md) | Checkout, webhooks, remboursements | Complet |
| 09 | [09_FACTURATION.md](09_FACTURATION.md) | Absence facturation, modèle recommandé | Complet |
| 10 | [10_LIVRAISON.md](10_LIVRAISON.md) | Modes FIXE/DISTANCE, décisions métier | Complet |
| 11 | [11_RAILWAY_PRODUCTION.md](11_RAILWAY_PRODUCTION.md) | Déploiement, variables env, stockage | Complet |
| 12 | [12_STRATEGIE_TESTS.md](12_STRATEGIE_TESTS.md) | Tests existants, couverture manquante | Complet |
| 13 | [13_ROADMAP_FINALISATION.md](13_ROADMAP_FINALISATION.md) | 10 phases, 60+ tâches priorisées | Complet |
| 14 | [14_CHECKLIST_GO_LIVE.md](14_CHECKLIST_GO_LIVE.md) | Checklist complète avant mise en production | Complet |

---

## Contexte minimal pour les prochaines sessions

### Stack confirmée

| Couche | Technologie | Version |
|---|---|---|
| Frontend | React + Vite | 18.2 / 7.3 |
| Styles | TailwindCSS | 3.4 |
| Routing | React Router Dom | 6 |
| State | Context API | — |
| Backend | Node.js + Express | ≥18 / 4.18.2 |
| Base de données | PostgreSQL | 15 |
| Cache | Redis (via ioredis) | 7 |
| Auth | JWT access (7j) + refresh (30j) | jsonwebtoken 9 |
| Email | Brevo REST API | — |
| Paiements | Stripe Checkout Sessions | 22.0.2 |
| Géocodage | BAN API (adresse.data.gouv.fr) | gratuit |
| Déploiement | Railway (NIXPACKS backend, Dockerfile frontend) | — |
| CI/CD | GitHub Actions | — |
| Uploads | Multer → disque local | 1.4.5-lts.1 |

### Architecture retenue

```
Frontend React (Vite) → Nginx (Railway)
    ↓ HTTPS
Backend Express (Railway)
    ├── PostgreSQL 15 (Railway)
    ├── Redis 7 (Railway)
    └── Stripe / Brevo / BAN API (externes)
```

### Problèmes P0 — Bloquants avant toute production

| ID | Problème | Fichier |
|---|---|---|
| P0-01 | Message checkout trompeur ("devis/paiement à la livraison") | `CheckoutPage.jsx:358` |
| P0-02 | Images perdues à chaque redéploiement Railway (disque éphémère) | `upload.middleware.js` |
| P0-03 | Aucune facturation (table, service, PDF absents) | Absent |
| P0-04 | Tests backend mockent la DB → aucun test réel des requêtes SQL | `tests/setup.js` |

### Problèmes P1 — Importants avant production

| ID | Problème | Fichier |
|---|---|---|
| P1-01 | `JWT_REFRESH_SECRET` fallback silencieux sur `JWT_SECRET` | `auth.service.js:25` |
| P1-02 | Tokens JWT non révocables (pas stockés en DB) | `auth.service.js` |
| P1-03 | Payload Stripe stocké en DB (données potentiellement sensibles) | `payment.service.js:146` |
| P1-04 | `hasPermission()` middleware non fonctionnel | `auth.middleware.js:149` |
| P1-05 | Vidange panier hors transaction (après COMMIT) | `order.service.js:183` |
| P1-06 | `charge.refunded` au lieu de `refund.created` | `payment.service.js` |
| P1-07 | Aucun historique de statuts commande | Absent |
| P1-08 | Aucun staging Railway séparé | Absent |
| P1-09 | Aucune sauvegarde DB configurée | Absent |
| P1-10 | Pas de validation force mot de passe backend | `auth.service.js` |

### Décisions prises lors de l'audit

| Décision | Valeur choisie | Justification |
|---|---|---|
| Bibliothèque PDF | PDFKit | Légère, pure JS, pas de Chrome headless |
| Storage images | S3 ou Cloudflare R2 (ou Railway Volume) | Railway filesystem éphémère |
| Redis client | ioredis uniquement | Doublon avec package `redis` à supprimer |
| Validation | Choisir express-validator ou Joi (un seul) | Doublon actuel |
| Tests intégration | testcontainers-node + vraie DB | Mocks insuffisants |

### Décisions ouvertes (propriétaire doit décider)

| Décision | Options | Impact |
|---|---|---|
| Stratégie livraison | FIXE ou DISTANCE | Configuration `livraison_mode_calcul` |
| Zones géographiques | Rayon km ? France ? Région ? | Complexité technique |
| Retrait sur place | Oui / Non | Nouvelle option checkout |
| Taux TVA produits | 5,5% alimentaire ? 20% ? | À valider avec comptable |
| Seuil franco de port | 50€ actuel → à confirmer | Panier moyen |

### Prochaine phase recommandée

**Phase 0 — Sécurisation immédiate** (3-5 jours)

Avant tout autre travail :
1. Corriger le message checkout trompeur (`CheckoutPage.jsx:358`)
2. Migrer les images vers un stockage persistant (S3/R2 ou Railway Volume)
3. Forcer `JWT_REFRESH_SECRET` distinct avec erreur au démarrage
4. Réduire le payload stocké dans `stripe_event`
5. Ajouter validation force mot de passe backend

Ensuite : Phase 5 (Facturation) en parallèle des phases 1-4 si deux développeurs disponibles.

### Fichiers clés à lire en priorité

| Fichier | Pourquoi |
|---|---|
| `backend/scripts/init.sql` | Schéma complet de la base de données |
| `backend/src/index.js` | Point d'entrée, middlewares, ordre des routes |
| `backend/src/services/payment.service.js` | Logique Stripe, webhooks |
| `backend/src/repositories/order.repository.js` | Transaction commande, décrémentation stock |
| `frontend/src/pages/CheckoutPage.jsx` | Bug P0 ligne 358, tunnel de commande |
| `backend/src/services/auth.service.js` | JWT, refresh token, fallback silencieux |
| `backend/src/middlewares/auth.middleware.js` | hasPermission() non fonctionnel |

---

## Verdict

**Le projet n'est pas prêt pour une mise en production.**

- Frontend : fonctionnel mais contient un bug P0 (message trompeur)
- Backend : architecture solide, points de fragilité identifiés
- Base de données : schéma cohérent, manque tables facturation, refresh_token, audit_log
- Sécurité : acceptable mais JWT révocation et refresh secret à corriger
- Paiements Stripe : intégration correcte, remboursements partiels à améliorer
- Facturation : entièrement absente (P0 légal)
- Livraison : fonctionnelle, décision métier requise
- Déploiement Railway : fonctionnel mais images éphémères et pas de staging
- Tests : tous mockés, aucun test d'intégration réel
