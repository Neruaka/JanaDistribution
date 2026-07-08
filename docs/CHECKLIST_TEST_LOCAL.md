# Checklist Test Local — Jana Distribution

> ⚠️ **Sections Stripe obsolètes** — Stripe a été entièrement retiré du MVP (décision client T4-07, 2026-07-02). Les étapes/variables liées à Stripe (webhook, `STRIPE_SECRET_KEY`, cartes de test) mentionnées dans ce document ne s'appliquent plus. Paiement actuel : ESPECES/VIREMENT/CHEQUE, statut positionné manuellement par un admin. Voir `ETAT_ACTUEL_PROJET.md` pour l'état réel à jour.
# À valider avant toute mise en production

## Prérequis

- [ ] Docker running (PostgreSQL + Redis)
- [ ] `.env` configuré à la racine (R2, Stripe test, JWT secrets)
- [ ] `docker-compose up -d postgres redis` passé sans erreur
- [ ] Backend démarré : `cd backend && npm run dev`
- [ ] Frontend démarré : `cd frontend && npm run dev`
- [ ] Stripe CLI running : `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- [ ] STRIPE_WEBHOOK_SECRET dans `.env` = le `whsec_` affiché par Stripe CLI

---

## Tests fonctionnels

### Santé de l'API
- [ ] GET http://localhost:3000/api/health → `{ status: "ok" }`

### Catalogue
- [ ] GET /api/products — liste des produits retournée
- [ ] GET /api/products/:id — détail produit
- [ ] Recherche + filtres fonctionnels depuis le frontend
- [ ] Images produits affichées (URL R2 ou /uploads local)

### Authentification
- [ ] Inscription nouveau compte (email + mot de passe ≥ 8 chars, 1 maj, 1 chiffre)
- [ ] Mot de passe faible refusé → 400
- [ ] Login → reçoit access token + refresh token en cookie/header
- [ ] Refresh token → nouveau access token
- [ ] Logout → refresh token révoqué
- [ ] Tentative refresh après logout → 401

### Panier
- [ ] Ajouter produit au panier (utilisateur connecté)
- [ ] Modifier quantité
- [ ] Supprimer article
- [ ] Panier persistant après refresh page
- [ ] Panier vide après commande complétée

### Commande + Paiement Stripe
- [ ] Checkout → redirection Stripe (page Stripe s'ouvre)
- [ ] Carte test : `4242 4242 4242 4242` exp: `12/34` CVV: `123`
- [ ] Webhook `checkout.session.completed` reçu dans Stripe CLI
- [ ] Commande créée en DB avec statut `PAYEE`
- [ ] Stock décrémenté (vérifier via admin)
- [ ] Panier vidé
- [ ] Email confirmation envoyé (vérifier réception ou logs applicatifs — Gmail SMTP)
- [ ] Facture générée automatiquement (visible dans /api/invoices/mes-factures)

### Upload images (R2)
- [ ] Upload image produit depuis admin → pas d'erreur
- [ ] Image accessible via URL `pub-3569a5f34db44a24bcb189552621ff79.r2.dev`
- [ ] Image toujours accessible après restart backend (`Ctrl+C` puis relance)

### Remboursement
- [ ] Admin initie remboursement depuis interface orders
- [ ] Webhook `refund.created` reçu dans Stripe CLI
- [ ] Statut commande → `REMBOURSE` ou `PARTIELLEMENT_REMBOURSE`
- [ ] Entrée créée dans `audit_log`

### Livraison DISTANCE
- [ ] Estimation frais depuis checkout (code postal parisien 75000 → 0km → prix de base)
- [ ] Franco de port si commande > 80€
- [ ] Refus si distance > 80km (tester avec code postal lointain)

### Administration
- [ ] Route admin sans token → 401
- [ ] Route admin avec token user normal → 403
- [ ] Webhook sans signature Stripe → 400 (tester via curl sans header `Stripe-Signature`)
- [ ] Accès dashboard admin avec compte admin

---

## Tests sécurité rapides

```bash
# 401 sans token
curl -s http://localhost:3000/api/admin/orders | jq .status

# 400 webhook sans signature
curl -s -X POST http://localhost:3000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"type":"test"}' | jq .status

# Test npm audit
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
| Tests backend | 101/101 |
| Tests frontend | ___ |

---

## Carte de test Stripe complète

| Carte | Comportement |
|---|---|
| `4242 4242 4242 4242` | Paiement réussi |
| `4000 0000 0000 9995` | Fonds insuffisants |
| `4000 0025 0000 3155` | Authentification 3DS requise |

Date exp : n'importe quelle date future. CVV : n'importe quel 3 chiffres.
