# Checklist Test Local — Jana Distribution

> Mise à jour 2026-07-26 (T12-11, Phase 12) — Stripe entièrement retiré de ce document
> (décision client T4-07, 2026-07-02). Paiement actuel : ESPECES/VIREMENT/CHEQUE,
> statut positionné manuellement par un admin. Voir `docs/workflow/ETAT_ACTUEL_PROJET.md` pour
> l'état réel à jour du projet.

# À valider avant toute mise en production

## Prérequis

- [ ] Docker Desktop démarré (icône "Engine running") — requis pour PostgreSQL/Redis locaux ET pour les tests d'intégration réels (testcontainers)
- [ ] `.env` configuré à la racine de `backend/` (R2, Gmail SMTP, JWT secrets — voir `backend/.env.example`)
- [ ] `docker-compose up -d postgres redis` passé sans erreur
- [ ] Backend démarré : `cd backend && npm run dev`
- [ ] Frontend démarré : `cd frontend && npm run dev`

---

## Tests automatisés

### Suite Jest mockée (non-régression rapide, ne nécessite pas Docker)
```bash
cd backend && npm test
```
- [ ] 112/112 tests passés (référence de base — peut être plus élevé si des tests ont été ajoutés depuis, voir `docs/workflow/PLAN_CORRECTION_AUDIT.md` pour le dernier total connu)

### Suite d'intégration réelle (vraie PostgreSQL via testcontainers, Docker Desktop requis)
```bash
cd backend && npm run test:integration
```
- [ ] Toutes les suites passent : `order.create.test.js`, `order.idempotency.test.js`, `order.status.routes.test.js`, `auth.test.js`, `auth.routes.test.js`, `stock.concurrent.test.js`, `product.routes.test.js`, `admin.clients.routes.test.js`, `shipping.test.js`
- [ ] Si `testcontainers` échoue à démarrer un conteneur (permissions, réseau Docker, timeout) : documenter l'erreur exacte, ne pas désactiver les tests
- Exécuté pour la première fois avec succès sur cette machine le 2026-07-26 (T12-03) — voir `docs/audit-finalisation/12_STRATEGIE_TESTS.md`. Pas encore automatisé en CI.

---

## Tests fonctionnels manuels

### Santé de l'API
- [ ] GET http://localhost:3000/api/health → `{ status: "ok" }`

### Catalogue
- [ ] GET /api/products — liste des produits retournée
- [ ] GET /api/products/:id — détail produit
- [ ] Recherche + filtres fonctionnels depuis le frontend
- [ ] Images produits affichées (URL R2 ou /uploads local)

### Authentification
- [ ] Inscription nouveau compte (email + mot de passe ≥ 8 chars, 1 maj, 1 min, 1 chiffre, 1 caractère spécial)
- [ ] Mot de passe faible refusé → 400 (backend, pas seulement le formulaire React)
- [ ] Login → reçoit access token + refresh token
- [ ] Login avec email inconnu ET avec mot de passe incorrect → même message générique "Email ou mot de passe incorrect" (pas de fuite d'information)
- [ ] Refresh token → nouveau access token, ancien refresh token révoqué (rotation)
- [ ] Logout → refresh token révoqué en DB
- [ ] Tentative refresh après logout → 401

### Panier
- [ ] Ajouter produit au panier (utilisateur connecté)
- [ ] Modifier quantité
- [ ] Supprimer article
- [ ] Panier persistant après refresh page
- [ ] Panier vide après commande complétée
- [ ] Double soumission rapide (double clic) du même panier → une seule commande créée, pas de doublon (protégé par verrou DB depuis T12-05)

### Commande et paiement manuel (ESPECES / VIREMENT / CHEQUE)
- [ ] Checkout → choix du mode de paiement (ESPECES, VIREMENT ou CHEQUE)
- [ ] Récapitulatif checkout cohérent avec le mode choisi (pas de mention de paiement en ligne immédiat)
- [ ] Commande créée en DB avec statut `EN_ATTENTE`, montants recalculés côté serveur (indépendants de ce qu'affichait le frontend)
- [ ] Stock décrémenté de façon atomique (vérifier via admin)
- [ ] Commande refusée si stock insuffisant au moment de la validation finale (pas seulement à l'ajout panier), message clair
- [ ] Panier vidé après création de la commande
- [ ] Email de confirmation de commande envoyé (vérifier réception ou logs applicatifs — Gmail SMTP)
- [ ] Admin positionne manuellement le statut (`CONFIRMEE` → `EXPEDIEE` → `LIVREE`) depuis l'interface admin
- [ ] Transition de statut invalide (ex: `EN_ATTENTE` → `LIVREE` directement) rejetée côté serveur, pas seulement côté UI admin
- [ ] Facture générée automatiquement lors du passage au statut pertinent (VIREMENT/CHEQUE → `CONFIRMEE`, ESPECES → `LIVREE`) et envoyée par email en pièce jointe PDF
- [ ] Facture visible dans `/api/invoices/mes-factures`
- [ ] Aucune route ne permet de modifier une facture déjà émise (immuabilité)

### Upload images (R2)
- [ ] Upload image produit depuis admin → pas d'erreur
- [ ] Image accessible via l'URL R2 publique configurée
- [ ] Image toujours accessible après restart backend (`Ctrl+C` puis relance)

### Remboursement manuel
- [ ] Admin initie un remboursement (total ou partiel) depuis l'interface commandes — action manuelle, aucun appel à un prestataire de paiement externe
- [ ] Montant remboursé ≤ montant total de la commande
- [ ] Statut commande → `REMBOURSE` ou `PARTIELLEMENT_REMBOURSE`
- [ ] Entrée créée dans `audit_log` (action, montant, raison, admin_id)

### Livraison DISTANCE
- [ ] Estimation frais depuis checkout (code postal parisien 75000 → ~0km → prix de base)
- [ ] Franco de port si commande > 80€
- [ ] Refus si distance > 80km (tester avec code postal lointain)
- [ ] Frais de livraison envoyés par le client ignorés — toujours recalculés côté serveur

### Administration
- [ ] Toute route `/api/admin/*` sans token → 401
- [ ] Toute route `/api/admin/*` avec token utilisateur non-admin → 403
- [ ] Accès dashboard admin avec compte admin
- [ ] Actions sensibles (changement de statut commande, remboursement, création/modification/suppression produit, modification/blocage client) tracées dans `audit_log`

---

## Tests sécurité rapides

```bash
# 401 sans token sur une route admin
curl -s http://localhost:3000/api/admin/orders | jq .status

# npm audit (dépendances)
cd backend && npm audit --production --audit-level=high
cd ../frontend && npm audit --production --audit-level=high
```

---

## Métriques à noter après validation

| Métrique | Valeur |
|---|---|
| Temps démarrage backend | ___ ms |
| Temps build frontend | ___ s |
| Taille bundle JS | ~1.2 MB (warning non bloquant) |
| Tests backend (mockés) | voir `docs/workflow/PLAN_CORRECTION_AUDIT.md` pour le dernier total connu |
| Tests backend (intégration réelle) | voir `docs/audit-finalisation/12_STRATEGIE_TESTS.md` |
| Tests frontend | ___ |
