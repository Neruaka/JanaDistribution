# Features recommandées après le MVP

> Recommandations basées sur l'état réel du code au 2026-07-02. Le MVP couvre catalogue, panier, commande, paiement manuel (ESPECES/VIREMENT/CHEQUE), livraison DISTANCE, facturation, authentification avec refresh tokens révocables, et un système de codes promo en cours de finalisation.

---

## Priorité HAUTE

### Notifications SMS livraison

- **Pourquoi :** Le suivi de commande existe déjà (`numero_colis`, `date_expedition` sur `commande`, historique de statuts via `commande_statut_historique`) mais la notification au client se limite aux emails (Gmail SMTP). Un SMS au moment de l'expédition/livraison réduit fortement les appels au support et améliore la perception du service, particulièrement en B2B où la fenêtre de livraison compte.
- **Stack suggérée :** L'email étant désormais Gmail SMTP (migré depuis Brevo le 2026-07-08, voir `docs/GUIDE_GMAIL_SMTP.md`), l'argument « même compte, même clé » ne tient plus — un SMS transactionnel nécessiterait un nouveau fournisseur dédié (ex. OVH SMS, Twilio, Brevo SMS en tant que nouveau compte) à évaluer indépendamment de l'email.
- **Effort estimé :** Faible à moyen (2-4 jours) — ajouter `sms.service.js` sur le modèle de `email.service.js`, déclencher sur les mêmes transitions de statut déjà loguées.

### Avis clients (reviews produits)

- **Pourquoi :** Le catalogue produit (`produit`, `product.service.js`) n'a aucune notion d'avis/notation. C'est un standard e-commerce qui influence directement le taux de conversion, et la base clients existe déjà (`utilisateur`, historique de commandes) pour vérifier les avis « achat confirmé ».
- **Stack suggérée :** Nouvelle table `avis_produit` (produit_id, utilisateur_id, note, commentaire, commande_id pour vérifier l'achat), endpoints CRUD Express classiques (routes → controllers → services → repositories, cohérent avec l'architecture existante), modération admin simple (statut PUBLIE/MASQUE).
- **Effort estimé :** Moyen (1-2 semaines) — migration DB + API + UI produit + modération admin.

### Programme de fidélité

- **Pourquoi :** Le système de codes promo en cours d'ajout (table `code_promo`) fournit déjà la brique de calcul de rabais ; un programme de fidélité (points, paliers) est une extension naturelle qui réutilise cette logique de réduction et incite à la récurrence d'achat, pertinent pour la clientèle B2B/B2C mixte de Jana.
- **Stack suggérée :** Table `points_fidelite` (utilisateur_id, solde, historique), règle d'accumulation (ex. 1 point / euro TTC) déclenchée à la validation de commande (même endroit que le calcul de code promo dans `order.service.js`), conversion en codes promo automatiques pour rester dans l'architecture existante.
- **Effort estimé :** Moyen à élevé (2-3 semaines) — logique métier, UI compte client, UI admin de paramétrage.

### Dashboard analytics avancé

- **Pourquoi :** `AdminDashboard.jsx` et `stats.service.js` fournissent déjà un CA par période (graphiques recharts). Un niveau supplémentaire (cohortes clients, produits les plus rentables après TVA/remise, taux de réutilisation des codes promo une fois celle-ci en production) donne au propriétaire une vraie visibilité pilotage, sans changer d'outil.
- **Stack suggérée :** Étendre `stats.service.js` / `admin.stats.routes.js` existants avec de nouvelles requêtes agrégées (déjà en PostgreSQL, pas besoin d'un outil BI externe pour ce volume), recharts déjà utilisé côté frontend.
- **Effort estimé :** Moyen (1-2 semaines) selon le nombre d'indicateurs.

---

## Priorité MOYENNE

### Application mobile (React Native)

- **Pourquoi :** La base API REST existante (`backend/src/routes`) est découplée du frontend web et pourrait être consommée telle quelle par une app mobile, surtout utile pour la clientèle B2B qui commande en déplacement.
- **Stack suggérée :** React Native + Expo, réutilisation de `frontend/src/services/*` (logique d'appel API déjà centralisée dans `api.js`) portable avec adaptation minimale.
- **Effort estimé :** Élevé (plusieurs mois) — nouveau projet client complet, authentification mobile (stockage sécurisé des tokens), notifications push.

### Ré-intégration d'un paiement en ligne

- **Pourquoi :** Stripe a été retiré du MVP par décision client (2026-07-02, voir `docs/CHANGEMENTS_MVP.md`) au profit de paiements manuels. Si le client change d'avis (volume de commandes en ligne insuffisant sans carte, ou demande client final), la réintroduction reste possible : les statuts `paiement_statut`, `montant_rembourse`, et la structure de commande n'ont pas été fondamentalement changés, seule la couche d'intégration Stripe a été retirée.
- **Stack suggérée :** Stripe Checkout Sessions (déjà éprouvé dans l'historique git du projet — cf. commits antérieurs à `9ee63d0`), à réimplémenter en s'inspirant de l'ancienne architecture (`payment.service.js`, webhooks signés) plutôt que la reconstruire from scratch.
- **Effort estimé :** Moyen (1-2 semaines) si réintroduit rapidement après retrait (logique connue), plus élevé si le schéma DB a divergé entre-temps.

### Newsletter marketing (au-delà des emails transactionnels)

- **Pourquoi :** Gmail SMTP est intégré (`email.service.js`, migré depuis Brevo le 2026-07-08) mais uniquement pour les emails transactionnels (bienvenue, statut commande, reset mot de passe) — Gmail SMTP n'est pas conçu pour l'envoi de campagnes en masse (quotas 500-2000/jour, pas d'outil de gestion de listes). Le champ `utilisateur.accepte_newsletter` existe déjà en base mais n'est pas exploité pour des campagnes marketing.
- **Stack suggérée :** Contrairement à la situation avec Brevo, une vraie newsletter nécessiterait désormais d'introduire un **nouveau fournisseur marketing dédié** (Brevo Marketing, Mailchimp, etc.) — ce n'est plus une simple extension de l'usage existant.
- **Effort estimé :** Faible à moyen (quelques jours à 1-2 semaines) — dépend du fournisseur choisi et de la synchronisation des contacts opt-in ; l'essentiel de l'effort reste côté contenu marketing.

### Gestion des retours / SAV

- **Pourquoi :** Le remboursement manuel existe (`montant_rembourse`, statuts REMBOURSE/PARTIELLEMENT_REMBOURSE, tracé dans `audit_log`) mais il n'y a aucun flux de demande de retour initié par le client (motif, photos, validation admin avant remboursement). Pour un e-commerce alimentaire, un flux SAV structuré (produit non conforme, casse transport) réduit la charge support par email.
- **Stack suggérée :** Nouvelle table `demande_retour` (commande_id, motif, statut, pièces jointes via le pipeline R2 déjà en place), UI client (formulaire dans l'espace commande) + UI admin de traitement, branché sur le remboursement manuel existant.
- **Effort estimé :** Moyen (2-3 semaines).

---

## Priorité BASSE

### Marketplace multi-vendeurs

- **Pourquoi :** Extension de business model plus qu'évolution technique — permettrait à Jana d'héberger d'autres fournisseurs alimentaires sur la même plateforme. Non aligné avec le positionnement B2C/B2B actuel mono-fournisseur, à envisager seulement si le modèle économique évolue.
- **Stack suggérée :** Refonte significative du modèle de données produit/commande (notion de vendeur, répartition des paiements, factures séparées par vendeur) — à ne pas sous-estimer.
- **Effort estimé :** Très élevé (plusieurs mois), à traiter comme un projet à part entière plutôt qu'une feature incrémentale.

### API publique B2B

- **Pourquoi :** Les clients professionnels (`type_client = PROFESSIONNEL`, SIRET/TVA déjà en base) pourraient vouloir intégrer leurs propres systèmes d'achat (EDI, ERP) à la plateforme pour passer commande automatiquement.
- **Stack suggérée :** Couche API dédiée avec clés API par client pro (nouvelle table `api_key`), rate limiting spécifique (le middleware `express-rate-limit` est déjà en place globalement et peut être dupliqué), documentation OpenAPI.
- **Effort estimé :** Élevé (plusieurs semaines) — sécurité, quotas, documentation, support de versions d'API.

### Abonnements / box récurrentes

- **Pourquoi :** Modèle économique différent (paiement récurrent automatique) qui redeviendrait dépendant d'un moyen de paiement en ligne — contradictoire avec la décision actuelle de MVP sans paiement en ligne. À ne considérer qu'après réintroduction éventuelle d'un paiement en ligne.
- **Stack suggérée :** Stripe Billing (si paiement en ligne réintroduit) ou gestion manuelle de commandes récurrentes générées par un job planifié (moins robuste, plus complexe côté opérationnel).
- **Effort estimé :** Élevé — dépend fortement de la décision préalable sur le paiement en ligne.
