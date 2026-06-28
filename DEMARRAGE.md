# Démarrage Jana Distribution

## Lancer l'environnement complet

```bash
# Une seule commande pour tout démarrer
docker-compose up

# En arrière-plan
docker-compose up -d

# Voir les logs d'un service
docker-compose logs -f backend
docker-compose logs -f frontend

# Arrêter tout
docker-compose down

# Arrêter et supprimer les volumes (reset DB)
docker-compose down -v
```

## URLs locales

| Service  | URL                              |
|----------|----------------------------------|
| Frontend | http://localhost:5173            |
| Backend  | http://localhost:3000            |
| API test | http://localhost:3000/api/health |

## Stripe CLI (terminal séparé — obligatoire pour tester les paiements)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copier le `whsec_...` affiché dans `.env` → `STRIPE_WEBHOOK_SECRET`

## Carte de test Stripe

| Carte                | Comportement          |
|----------------------|-----------------------|
| 4242 4242 4242 4242  | Paiement réussi       |
| 4000 0000 0000 9995  | Fonds insuffisants    |
| 4000 0025 0000 3155  | 3DS requis            |

Date exp : n'importe quelle date future. CVV : n'importe quel 3 chiffres.
