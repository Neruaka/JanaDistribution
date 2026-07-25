# 00 — Résumé Exécutif — Jana Distribution

> ⚠️ **Document historique (état figé au 2026-06-14)** — Rédigé lors de l'audit initial, avant le retrait complet de Stripe (T4-07, 2026-07-02) et l'ajout de la facturation légale (Phase 5) et des tests d'intégration réels (Phase 7). Les références à Stripe, aux webhooks et aux tests 100% mockés ne reflètent plus l'état actuel du code. Voir `ETAT_ACTUEL_PROJET.md` et `PLAN_CORRECTION_AUDIT.md` pour l'état réel à jour.

> Audit réalisé le 2026-06-14. Base : inspection statique complète du code source local.
> Aucun test destructif. Aucun accès Railway direct.

---

## État général du projet

Jana Distribution est une plateforme e-commerce alimentaire B2C/B2B avec une base solide bien plus avancée que ce que l'énoncé initial laissait supposer. L'architecture backend est modulaire et cohérente. La gestion des commandes est atomique. Stripe Checkout est intégré. L'email fonctionne via Brevo. Cependant, deux absences majeures bloquent toute mise en production commerciale réelle : **l'absence totale de facturation** et **le stockage éphémère des images sur Railway**.

---

## Pourcentage estimé d'avancement

| Domaine | Avancement |
|---|---|
| Catalogue produits | 90 % |
| Panier | 85 % |
| Commande | 80 % |
| Paiement Stripe | 75 % |
| Authentification | 85 % |
| Administration | 80 % |
| Livraison | 70 % |
| Emails transactionnels | 70 % |
| Facturation | 0 % |
| Tests automatisés | 20 % |
| Infrastructure Railway | 65 % |
| **GLOBAL** | **~65 %** |

---

## Principales fonctionnalités terminées

- Inscription / connexion / déconnexion / refresh token
- Mot de passe oublié et réinitialisation (token haché en DB)
- Catalogue avec recherche, filtres, tri, pagination
- Fiche produit
- Panier (CRUD, persistance DB)
- Checkout multi-étapes avec frais de livraison dynamiques (mode FIXE + mode DISTANCE via BAN)
- Création de commande en transaction atomique avec décrémentation stock
- Stripe Checkout Sessions côté serveur
- Webhook Stripe sécurisé (signature + idempotency via `stripe_event`)
- Page de retour paiement avec polling
- Emails transactionnels : bienvenue, statut commande, reset mot de passe (via Brevo)
- Administration : dashboard, produits, catégories, commandes, clients, paramètres, profil
- Calcul livraison par distance (Haversine) via api-adresse.data.gouv.fr
- Pages légales (CGV, mentions légales, confidentialité, accessibilité)
- Espace client (profil, sécurité, adresses, préférences)

---

## Principales fonctionnalités manquantes ou incomplètes

1. **Facturation** — Aucune table, aucun service, aucune génération PDF, aucun accès admin ni client
2. **Stockage des images** — Disque local uniquement → images perdues à chaque redéploiement Railway
3. **Tokens non révocables** — Pas de blacklist JWT, refresh token non stocké en DB
4. **Pas de tests d'intégration réels** — La DB est mockée dans les tests
5. **Séquence de numéro de commande** — Globale, non remise à zéro par jour (incohérence format `CMD-YYYYMMDD-XXXX`)
6. **Environnement de staging** — Absent
7. **Sauvegardes DB** — Non configurées sur Railway
8. **Avoir en cas de remboursement** — Non implémenté
9. **Suivi de livraison / numéro de colis** — Absent
10. **Message checkout incohérent** — La page dit « devis par email / paiement à la livraison » alors que Stripe est actif

---

## Problèmes par priorité

| Priorité | Nombre | Description sommaire |
|---|---|---|
| **P0** | 4 | Bloquants production immédiate |
| **P1** | 8 | À corriger avant acceptation de vrais paiements |
| **P2** | 9 | Importants pour fiabilité et maintenance |
| **P3** | 6 | Améliorations non bloquantes |

### P0 — Bloquants production

| # | Problème |
|---|---|
| P0-1 | Images produits sur disque local Railway (éphémère) → catalogue cassé après redéploiement |
| P0-2 | Facturation absente → illégal pour e-commerce français (obligation de facture) |
| P0-3 | Message checkout indique « devis / paiement à la livraison » → confusion client lors d'un vrai paiement Stripe |
| P0-4 | `Access-Control-Allow-Origin: *` sur `/uploads` → fuite potentielle de données via images sensibles |

### P1 — Critiques avant lancement

| # | Problème |
|---|---|
| P1-1 | Tokens JWT non révocables (pas de blacklist, refresh non stocké en DB) |
| P1-2 | `JWT_REFRESH_SECRET` fallback silencieux sur `JWT_SECRET` si variable absente |
| P1-3 | `stripe_event.payload` stocké en JSONB complet → données sensibles potentielles en clair |
| P1-4 | Tests mockent la DB → fiabilité non garantie sur intégration réelle |
| P1-5 | Aucune validation de force du mot de passe côté backend |
| P1-6 | Refactoring de webhook : `charge.refunded` utilisé alors que `refund.created` est plus fiable |
| P1-7 | Sauvegardes PostgreSQL non configurées sur Railway |
| P1-8 | Pas d'environnement de staging → déploiements directs en production |

---

## Principaux risques

1. **Images perdues en production** — Le système de fichiers Railway est éphémère. Toute image uploadée est détruite au prochain déploiement. Le catalogue sera visuellement cassé.
2. **Absence de facturation** — Obligation légale en France (article L441-3 du Code de commerce). Absence de facture = risque juridique direct dès la première commande payée.
3. **Tokens JWT non invalidables** — Un token volé reste valide pendant 7 jours sans possibilité de le révoquer.
4. **Double commande Stripe possible** — Si le frontend est rechargé après création de commande et avant redirection Stripe, une deuxième session peut être tentée. L'idempotency-key côté Stripe mitige partiellement, mais la logique de protection côté commande n'est pas complète.
5. **Pas de staging** — Les corrections sont déployées directement en production, augmentant le risque d'incident.

---

## Recommandation Go / No-Go

> **NON-GO pour une mise en production commerciale réelle.**

Le projet est **prêt uniquement pour un environnement de staging** avec paiements en mode test Stripe.

Avant tout go-live commercial :
- Migrer les images vers un stockage persistant (S3, Cloudinary, Railway Volume)
- Implémenter la facturation (PDF + numérotation séquentielle)
- Corriger le message checkout
- Révoquer les tokens à la déconnexion (blacklist ou révision courte)
- Configurer les sauvegardes PostgreSQL
- Mettre en place un staging séparé

---

## Résumé de la roadmap

| Phase | Contenu | Durée estimée |
|---|---|---|
| Phase 0 | Sécurisation immédiate (tokens, uploads, message checkout) | 3-5 jours |
| Phase 1 | Stabilisation (encodage, tests réels, séquence commande) | 3-5 jours |
| Phase 2 | Architecture commandes et stocks (historique statuts, remboursement complet) | 5-7 jours |
| Phase 3 | Stratégie livraison validée + configuration définitive | 2-3 jours décision + 2 jours impl. |
| Phase 4 | Stripe finalisé (webhook `refund.created`, remboursement admin) | 3-5 jours |
| Phase 5 | Facturation (PDF, numérotation, avoir, accès admin) | 7-10 jours |
| Phase 6 | Finalisation admin (gestion remboursements, tableau de bord complet) | 3-5 jours |
| Phase 7 | Tests automatisés (intégration réelle, Stripe webhook) | 5-7 jours |
| Phase 8 | Staging Railway + sauvegardes + monitoring | 3-5 jours |
| Phase 9 | Audit final + go-live | 2-3 jours |
| **Total** | | **~37-55 jours** |
