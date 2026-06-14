# 03 — Architecture Actuelle

> Confirmé = vérifié dans le code. Déduit = cohérent avec le code mais non testé en live. Supposé = non confirmé localement.

---

## Description générale

Jana Distribution est un **monorepo** composé de deux applications distinctes déployées séparément sur Railway :

- Un backend **Node.js / Express** exposant une API REST
- Un frontend **React / Vite** servi par **Nginx**

Les deux applications s'appuient sur une base de données **PostgreSQL** et un cache **Redis**. Le tout est dockerisé pour le développement local avec `docker-compose`.

---

## Diagramme d'architecture globale

```mermaid
graph TB
    subgraph Client
        BROWSER[Navigateur]
    end

    subgraph Railway
        subgraph FrontendService["Service Frontend (Nginx)"]
            NGINX[Nginx]
            REACT[React SPA / dist]
        end
        subgraph BackendService["Service Backend (Node.js)"]
            EXPRESS[Express API]
        end
        subgraph DataServices["Services de données"]
            POSTGRES[(PostgreSQL 15)]
            REDIS[(Redis 7)]
        end
    end

    subgraph External["Services externes"]
        STRIPE[Stripe]
        BREVO[Brevo / Email]
        BAN[BAN API / Géocodage]
    end

    BROWSER --> NGINX
    NGINX -- "SPA HTML/JS/CSS" --> BROWSER
    BROWSER -- "VITE_API_URL = /api ou URL Railway" --> EXPRESS
    EXPRESS --> POSTGRES
    EXPRESS --> REDIS
    EXPRESS -- "Checkout Sessions" --> STRIPE
    STRIPE -- "Webhooks POST /api/webhooks/stripe" --> EXPRESS
    EXPRESS -- "Emails via API REST" --> BREVO
    EXPRESS -- "Géocodage adresses" --> BAN
    NGINX -- "Proxy /api → backend (si même domaine)" --> EXPRESS
```

**Confirmé** : Architecture générale, tous services, Docker Compose.

---

## Diagramme du flux d'authentification actuel

```mermaid
sequenceDiagram
    participant C as Client (Browser)
    participant A as API Express
    participant DB as PostgreSQL
    participant SS as sessionStorage

    Note over C,SS: Inscription
    C->>A: POST /api/auth/register (email, mdp, nom, prenom...)
    A->>DB: SELECT email (vérif unicité)
    A->>A: bcrypt.hash(mdp, 12 rounds)
    A->>DB: INSERT utilisateur
    A-->>C: { user, token (7j), refreshToken (30j) }
    C->>SS: sessionStorage.setItem('token', token)
    C->>SS: sessionStorage.setItem('refreshToken', refreshToken)

    Note over C,SS: Connexion
    C->>A: POST /api/auth/login (email, mdp)
    A->>DB: SELECT utilisateur WHERE email
    A->>A: bcrypt.compare(mdp, hash)
    A->>DB: UPDATE derniere_connexion
    A-->>C: { user, token, refreshToken }
    C->>SS: Stockage sessionStorage

    Note over C,A: Requête authentifiée
    C->>A: GET /api/orders (Header: Bearer <token>)
    A->>A: jwt.verify(token, JWT_SECRET)
    A->>DB: SELECT utilisateur WHERE id (vérif actif)
    A-->>C: Données

    Note over C,A: Refresh automatique
    C->>A: Requête → 401 token expiré
    A-->>C: 401
    C->>A: POST /api/auth/refresh { refreshToken }
    A->>A: jwt.verify(refreshToken, JWT_REFRESH_SECRET)
    A-->>C: { token, refreshToken (nouveau) }
    C->>SS: Mise à jour tokens
    C->>A: Répète requête originale
```

**Confirmé** : `auth.service.js`, `auth.middleware.js`, `api.js` (intercepteurs).

**Faiblesses** :
- Tokens stockés en `sessionStorage` (correct, migration depuis localStorage présente)
- Refresh token non stocké en DB → impossible à révoquer
- JWT access token 7 jours → longue durée sans révocation

---

## Diagramme du flux de commande actuel

```mermaid
sequenceDiagram
    participant C as Client
    participant FE as Frontend React
    participant BE as Backend Express
    participant DB as PostgreSQL
    participant S as Stripe
    participant WH as Webhook Handler
    participant EM as Brevo

    C->>FE: Remplit checkout
    FE->>BE: POST /api/orders { adresseLivraison, modePaiement }
    BE->>DB: SELECT panier + items + produits (prix DB)
    BE->>BE: Calcule totaux HT/TVA/TTC côté serveur
    BE->>BE: Calcule frais livraison côté serveur
    BE->>DB: BEGIN TRANSACTION
    BE->>DB: INSERT commande (statut=EN_ATTENTE)
    loop Pour chaque ligne
        BE->>DB: UPDATE produit SET stock = stock - qty WHERE stock >= qty
        BE->>DB: INSERT ligne_commande
    end
    BE->>DB: DELETE panier_items
    BE->>DB: COMMIT
    BE->>EM: Email confirmation EN_ATTENTE (async)
    BE-->>FE: { orderId, numeroCommande }

    alt modePaiement = CARTE
        FE->>BE: POST /api/payment/checkout-session { orderId }
        BE->>DB: SELECT commande WHERE id (vérif owner)
        BE->>S: Create Checkout Session (line_items depuis DB)
        S-->>BE: { url, sessionId }
        BE->>DB: UPDATE commande SET stripe_session_id
        BE-->>FE: { url, sessionId }
        FE->>S: window.location.href = url (redirection)
        C->>S: Paie sur Stripe
        S->>WH: POST /api/webhooks/stripe checkout.session.completed
        WH->>WH: Vérifie signature stripe-signature
        WH->>DB: INSERT stripe_event ON CONFLICT DO NOTHING
        WH->>DB: UPDATE commande SET paiement_statut=PAID, paye_le
        WH->>BE: orderService.updateStatus(CONFIRMEE)
        WH->>EM: Email CONFIRMEE
        S->>FE: Redirection /paiement/succes?session_id=...
        FE->>BE: GET /api/payment/session/:sessionId (polling)
        BE-->>FE: { paiementStatut: PAID }
        FE-->>C: "Paiement confirmé !"
    else modePaiement != CARTE
        FE-->>C: Redirection /commande/confirmation/:orderId
    end
```

**Confirmé** : Intégralité des fichiers source analysés.

---

## Diagramme du modèle de données principal

```mermaid
erDiagram
    utilisateur {
        UUID id PK
        string email UK
        string mot_de_passe_hash
        string nom
        string prenom
        string telephone
        enum role "CLIENT|ADMIN"
        enum type_client "PARTICULIER|PROFESSIONNEL"
        string siret
        string raison_sociale
        string numero_tva
        boolean accepte_cgu
        boolean accepte_newsletter
        boolean notifications_commandes
        boolean est_actif
        string reset_token
        timestamp reset_token_expiry
        timestamp date_creation
        timestamp date_modification
        timestamp derniere_connexion
    }

    adresse {
        UUID id PK
        UUID utilisateur_id FK
        enum type "LIVRAISON|FACTURATION"
        string nom
        string prenom
        string adresse
        string code_postal
        string ville
        string pays
        boolean est_defaut
    }

    categorie {
        UUID id PK
        string nom
        string slug UK
        string couleur
        integer ordre
        boolean est_actif
    }

    produit {
        UUID id PK
        string reference UK
        string nom
        string slug UK
        decimal prix
        decimal prix_promo
        decimal taux_tva
        string unite_mesure
        integer stock_quantite
        integer stock_min_alerte
        string image_url
        text[] labels
        UUID categorie_id FK
        boolean est_actif
        boolean est_mis_en_avant
    }

    panier {
        UUID id PK
        UUID utilisateur_id FK "nullable"
        string session_id "nullable"
    }

    ligne_panier {
        UUID id PK
        UUID panier_id FK
        UUID produit_id FK
        integer quantite
        decimal prix_unitaire
    }

    commande {
        UUID id PK
        string numero_commande UK
        UUID utilisateur_id FK
        enum statut "EN_ATTENTE|CONFIRMEE|EN_PREPARATION|EXPEDIEE|LIVREE|ANNULEE"
        decimal total_ht
        decimal total_tva
        decimal total_ttc
        jsonb adresse_livraison
        jsonb adresse_facturation
        enum mode_paiement "CARTE|VIREMENT|ESPECES|CHEQUE"
        decimal frais_livraison
        string stripe_session_id
        string stripe_payment_intent_id
        enum paiement_statut "PENDING|AUTHORIZED|PAID|FAILED|REFUNDED"
        timestamp paye_le
    }

    ligne_commande {
        UUID id PK
        UUID commande_id FK
        UUID produit_id FK
        integer quantite
        decimal prix_unitaire_ht
        decimal taux_tva
        decimal total_ht
        decimal total_ttc
        string nom_produit
    }

    stripe_event {
        UUID id PK
        string event_id UK
        string type
        jsonb payload
        timestamp processed_at
    }

    configuration {
        string cle PK
        string valeur
        string type
        string categorie
        string description
    }

    utilisateur ||--o{ adresse : "possède"
    utilisateur ||--o| panier : "possède"
    utilisateur ||--o{ commande : "passe"
    categorie ||--o{ produit : "contient"
    panier ||--o{ ligne_panier : "contient"
    produit ||--o{ ligne_panier : "référencé"
    commande ||--o{ ligne_commande : "contient"
    produit ||--o{ ligne_commande : "référencé"
```

**Confirmé** : `backend/scripts/init.sql` intégralement lu.

---

## Zones inconnues et supposées

| Zone | Type | Note |
|---|---|---|
| Données réelles en production Railway | Supposé | Accès Railway non disponible lors de l'audit |
| Variables d'environnement Railway | Supposé | Non vérifiées localement |
| Stripe configuré en mode test ou live | Supposé | Dépend de la valeur de `STRIPE_SECRET_KEY` |
| Brevo configuré et opérationnel | Supposé | Dépend de `BREVO_API_KEY` |
| Nginx proxy /api en production | Déduit | `vite.config.js` et config Nginx non encore lue intégralement |

---

## Faiblesses architecturales identifiées

1. **Stockage des uploads sur disque local** — Les images sont stockées dans `backend/uploads/products/`. Railway utilise un système de fichiers éphémère, donc les images disparaissent à chaque redéploiement.

2. **Pas de système de migrations versionné** — Les modifications de schéma s'appliquent via `init.sql` qui supprime et recrée toutes les tables (`DROP TABLE IF EXISTS`), donc destructif en production.

3. **Deux packages Redis** — `ioredis` et `redis` sont tous deux installés. Seul `ioredis` est réellement utilisé dans `redis.js`.

4. **Pas de table de factures** — Absente du schéma initial.

5. **Pas d'historique des statuts de commande** — Seul le statut courant est stocké, pas les transitions.

6. **Tokens JWT non révocables** — Aucune blacklist, aucun stockage du refresh token.

7. **Encodage corrompu** — Plusieurs fichiers contiennent des séquences UTF-8 mal encodées (`Ã©`, `â‚¬`). Cela suggère une manipulation des fichiers avec un éditeur ou un environnement de mauvaise configuration d'encodage.
