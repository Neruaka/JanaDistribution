# 14 — Checklist Go Live

> Valider chaque point avant toute mise en production.
> `[ ]` = non fait · `[x]` = validé · `[~]` = partiel ou à surveiller

---

## Sécurité

- [ ] `NODE_ENV=production` configuré dans Railway
- [ ] `JWT_SECRET` : chaîne aléatoire ≥ 32 caractères, unique, non partagée
- [ ] `JWT_REFRESH_SECRET` : chaîne distincte de `JWT_SECRET`, non partagée
- [ ] Aucun secret dans le code source ou les fichiers commités
- [ ] `.env` absent du dépôt git (vérifier `.gitignore`)
- [ ] `CORS_ORIGIN` limité à l'URL Railway du frontend uniquement (pas `*`)
- [ ] Uploads servis sans `Access-Control-Allow-Origin: *` ou restreint au domaine
- [ ] Helmet activé en production (headers de sécurité HTTP)
- [ ] Rate limiting actif (300/15 min global, 20/15 min auth)
- [ ] `bcrypt` configuré à ≥ 12 rounds
- [ ] Validation force mot de passe côté backend implémentée
- [ ] `hasPermission()` supprimé ou fonctionnel
- [ ] Aucune CVE critique dans `npm audit --production`

---

## Variables d'environnement

- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` configurée et fonctionnelle (PostgreSQL Railway)
- [ ] `REDIS_URL` configurée (Redis Railway)
- [ ] `JWT_SECRET` configurée
- [ ] `JWT_REFRESH_SECRET` configurée (distincte de `JWT_SECRET`)
- [ ] `CORS_ORIGIN` configurée (URL exacte du frontend avec https://)
- [ ] `FRONTEND_URL` configurée (pour liens dans emails)
- [ ] `BREVO_API_KEY` configurée
- [ ] `BREVO_SENDER_EMAIL` configurée
- [ ] `STRIPE_SECRET_KEY` : clé live `sk_live_...` configurée
- [ ] `STRIPE_PUBLISHABLE_KEY` : clé live `pk_live_...` dans le frontend
- [ ] `STRIPE_WEBHOOK_SECRET` : secret depuis Stripe Dashboard (pas CLI)
- [ ] `VITE_API_URL` configurée dans le frontend Railway (URL backend + `/api`)
- [ ] `PORT` configurée si nécessaire

---

## Base de données

- [ ] PostgreSQL Railway démarré et accessible
- [ ] Extension `uuid-ossp` activée
- [ ] Tables initialisées (init.sql exécuté une seule fois)
- [ ] Séquences créées (`commande_numero_seq`, `facture_numero_seq`, `avoir_numero_seq`)
- [ ] Données de configuration initiales insérées (`configuration` table)
- [ ] Aucun `DROP TABLE IF EXISTS` dans les scripts de migration (seulement init)
- [ ] Connexion testée depuis le backend (healthcheck `/api/health` répond)
- [ ] Index de performance présents sur les clés étrangères et colonnes filtrées

---

## Sauvegardes

- [ ] Sauvegardes automatiques PostgreSQL Railway activées (plan Pro ou cron `pg_dump`)
- [ ] Première sauvegarde manuelle effectuée avant go live
- [ ] Procédure de restauration testée
- [ ] Images produits stockées sur stockage persistant (S3, R2 ou Volume Railway)
- [ ] Rétention des sauvegardes définie (minimum 30 jours recommandé)

---

## Catalogue produits

- [ ] Catégories créées et correctement configurées
- [ ] Produits importés avec images
- [ ] Images accessibles depuis le frontend (URLs fonctionnelles)
- [ ] Stocks initiaux corrects (`stock_quantite`)
- [ ] Produits non actifs marqués `est_actif = false` (pas supprimés)
- [ ] Import Excel (si utilisé) validé côté backend

---

## Stocks

- [ ] Décrémentation stock atomique testée (transaction BEGIN/COMMIT)
- [ ] Commande refusée si stock insuffisant
- [ ] Stock ne peut pas descendre en dessous de 0
- [ ] Alertes stock bas configurées (email ou admin)

---

## Commande

- [ ] Tunnel de commande testé de bout en bout en staging
- [ ] Montants calculés côté serveur (non manipulables par le client)
- [ ] Panier vidé après création commande (dans transaction ou idempotent)
- [ ] Emails de statut envoyés à chaque transition (EN_ATTENTE, CONFIRMEE, etc.)
- [ ] Historique de statuts enregistré (`commande_statut_historique`)
- [ ] Numéro de commande lisible (`CMD-YYYYMMDD-XXXX`)
- [ ] Commande refusée si panier vide

---

## Livraison

- [ ] Stratégie de livraison décidée (FIXE ou DISTANCE)
- [ ] `livraison_mode_calcul` configuré en DB (`configuration` table)
- [ ] `livraison_frais_standard` configuré
- [ ] `livraison_seuil_franco` configuré
- [ ] Si mode DISTANCE : `livraison_adresse_entrepot` configurée
- [ ] Si mode DISTANCE : `livraison_prix_par_km` configuré
- [ ] Frais de livraison affichés avant validation
- [ ] Adresse hors zone bloquée avec message clair
- [ ] Zones de livraison documentées dans les CGV

---

## Stripe

- [ ] Compte Stripe en mode LIVE (pas test)
- [ ] Clés LIVE configurées (`sk_live_...`, `pk_live_...`)
- [ ] Checkout Session configurée correctement
- [ ] Test paiement LIVE effectué avec un vrai moyen de paiement (montant faible, 1€)
- [ ] Remboursement test effectué depuis le dashboard Stripe
- [ ] Pays et devises configurés correctement (EUR, France)
- [ ] Politique de remboursement configurée dans Stripe

---

## Webhooks

- [ ] Webhook Stripe configuré depuis le **Stripe Dashboard** (pas Stripe CLI)
- [ ] URL webhook : `https://backend-prod.railway.app/api/payment/webhook`
- [ ] `STRIPE_WEBHOOK_SECRET` (`whsec_...`) copié depuis le Dashboard Stripe
- [ ] Événements configurés dans Stripe : `checkout.session.completed`, `checkout.session.expired`, `payment_intent.payment_failed`, `refund.created`
- [ ] Test webhook envoyé depuis Stripe Dashboard et reçu
- [ ] Idempotency testée : même webhook envoyé deux fois → traité une seule fois
- [ ] Logs webhook visibles dans Railway

---

## Remboursement

- [ ] Processus de remboursement documenté en interne
- [ ] Interface admin pour initier un remboursement (ou procédure manuelle depuis Stripe Dashboard)
- [ ] Webhook `refund.created` (ou `charge.refunded`) traité
- [ ] Statut commande mis à jour après remboursement
- [ ] Email client envoyé après remboursement
- [ ] Avoir généré si facturation implémentée

---

## Factures

- [ ] Facturation implémentée (tables `facture`, `facture_ligne`, `avoir`)
- [ ] Facture générée automatiquement après webhook `checkout.session.completed`
- [ ] Numérotation séquentielle unique (`FAC-YYYY-NNNN`)
- [ ] PDF généré et accessible
- [ ] Facture envoyée par email avec pièce jointe
- [ ] Facture téléchargeable par le client depuis son espace
- [ ] Facture téléchargeable par l'admin
- [ ] Factures immutables (pas de modification après émission)
- [ ] Mentions légales obligatoires dans la facture (SIRET, TVA, adresse...)
- [ ] Avoir généré après remboursement
- [ ] Validation comptable effectuée par un professionnel

---

## Emails

- [ ] `BREVO_API_KEY` valide et active
- [ ] Email de bienvenue envoyé à l'inscription (testé)
- [ ] Email de confirmation de commande envoyé (testé)
- [ ] Email de mise à jour statut envoyé (testé)
- [ ] Email de réinitialisation de mot de passe envoyé (testé)
- [ ] Email de remboursement envoyé (testé)
- [ ] Encodage UTF-8 correct dans tous les templates (accents, symbole €)
- [ ] Expéditeur configuré (`BREVO_SENDER_EMAIL`) avec domaine validé dans Brevo
- [ ] Emails ne tombent pas en spam (validation SPF/DKIM sur le domaine)

---

## Administration

- [ ] Compte admin créé en production (rôle ADMIN)
- [ ] Accès admin testé (connexion, dashboard)
- [ ] Gestion des commandes testée (liste, détail, changement statut)
- [ ] Gestion des produits testée (création, modification, désactivation)
- [ ] Gestion des catégories testée
- [ ] Configuration livraison modifiable depuis l'admin
- [ ] Export commandes fonctionnel
- [ ] Aucune action admin accessible à un compte CLIENT
- [ ] Historique des statuts visible dans le détail commande

---

## Tests

- [ ] Tests unitaires passent (`npm test:unit`)
- [ ] Tests d'intégration passent contre la DB de staging (`npm test:integration`)
- [ ] Flux de commande E2E testé manuellement en staging
- [ ] Test de paiement Stripe avec carte de test (`4242 4242 4242 4242`)
- [ ] Test de refus de paiement avec carte de test (`4000 0000 0000 0002`)
- [ ] Test idempotency webhook (envoi manuel depuis Stripe Dashboard)

---

## Logs et monitoring

- [ ] Logs Winston visibles dans Railway
- [ ] Erreurs 5xx enregistrées avec contexte suffisant
- [ ] Health check `/api/health` répond `200 OK` en production
- [ ] Alerte configurée si le health check échoue (Better Uptime, UptimeRobot, ou Railway)
- [ ] Pas de secrets dans les logs
- [ ] Logs de création de commande et de paiement présents

---

## Domaine et HTTPS

- [ ] Domaine personnalisé configuré dans Railway (si applicable)
- [ ] HTTPS actif sur le frontend et le backend (Railway le gère automatiquement)
- [ ] Certificat SSL valide (auto-renouvelé par Railway)
- [ ] Redirections HTTP → HTTPS configurées
- [ ] Domaine email validé dans Brevo (SPF, DKIM, DMARC)

---

## Mentions et informations légales

- [ ] Page "Mentions légales" créée et accessible depuis le footer
  - Raison sociale, forme juridique, SIRET
  - Adresse du siège social
  - Numéro de TVA intracommunautaire
  - Coordonnées de contact
  - Hébergeur (Railway)
- [ ] Page "Qui sommes-nous" / présentation de l'entreprise

---

## Conditions générales de vente (CGV)

- [ ] CGV rédigées par un professionnel ou validées par un juriste
- [ ] CGV accessibles depuis le pied de page
- [ ] CGV mentionnent :
  - Prix (TTC, frais de livraison inclus ou non)
  - Délais de livraison
  - Zones de livraison
  - Politique de retour et droit de rétractation
  - Modalités de remboursement
  - Contact service client
- [ ] Case à cocher "J'accepte les CGV" dans le tunnel de commande
- [ ] Date de dernière mise à jour des CGV présente

---

## Politique de confidentialité (RGPD)

- [ ] Politique de confidentialité rédigée et accessible
- [ ] Mentionne :
  - Données collectées (nom, email, adresse, commandes)
  - Finalité du traitement
  - Durée de conservation
  - Droits de l'utilisateur (accès, rectification, suppression)
  - Contact DPO ou responsable traitement
  - Sous-traitants (Stripe, Brevo, Railway)
- [ ] Consentement cookies si trackers tiers utilisés
- [ ] Formulaire d'exercice des droits opérationnel

---

## Procédure de rollback

- [ ] Sauvegarde DB effectuée **avant** chaque déploiement en production
- [ ] Commit précédent identifié (git tag ou hash)
- [ ] Procédure de rollback documentée :
  1. Identifier le commit à restaurer
  2. Déclencher le redeploiement Railway depuis le commit précédent
  3. Vérifier que la DB est compatible avec l'ancienne version (pas de migration irréversible)
  4. En cas de migration irréversible : restaurer depuis la sauvegarde DB
  5. Vérifier le health check
  6. Notifier l'équipe
- [ ] Procédure de rollback testée au moins une fois en staging

---

## Score go live

> Compter les cases cochées :
>
> - 90-100% : Vert — prêt pour la mise en production
> - 70-89% : Orange — staging uniquement
> - < 70% : Rouge — pas prêt

**Cases critiques (bloquantes) :**
Les sections "Sécurité", "Stripe", "Webhooks", "Factures", et "Mentions légales" ne tolèrent aucune case non cochée avant la mise en production.
