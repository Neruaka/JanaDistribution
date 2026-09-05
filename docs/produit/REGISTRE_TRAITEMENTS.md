# Registre des traitements — Jana Distribution

> Inventaire factuel des traitements de données personnelles (RGPD Art. 30),
> établi par inspection du code réel le 2026-09-05. **Ceci n'est pas un
> document juridique validé** — c'est la matière première (faits vérifiés :
> tables, colonnes, durées de conservation réellement codées) qu'un
> professionnel (avocat/DPO) doit relire et compléter (bases légales
> précises, mentions manquantes, éventuelle déclaration CNIL si applicable)
> avant mise en production définitive. Voir `docs/produit/RGPD_ACCESSIBILITE.md`
> pour l'état d'implémentation détaillé des droits RGPD.

---

## 1. Responsable de traitement

Jana Distribution (SIRET `798787784`, TVA `FR92798787784` — voir
`backend/.env.example` `ENTREPRISE_*`). Adresse à compléter par le
propriétaire (`ENTREPRISE_ADRESSE`, actuellement vide en config par défaut,
**obligatoire avant mise en ligne** — mentions légales et factures en dépendent).

---

## 2. Traitements

### 2.1 Gestion de compte client/professionnel

| | |
|---|---|
| **Finalité** | Création et gestion du compte utilisateur, authentification |
| **Données** | Email, hash bcrypt du mot de passe (jamais le mot de passe), nom, prénom, téléphone, rôle, type client, SIRET/raison sociale/n° TVA (comptes pro), consentement CGU/newsletter |
| **Base légale (à confirmer par un juriste)** | Exécution du contrat (compte nécessaire pour commander) |
| **Table** | `utilisateur` |
| **Conservation codée** | Illimitée tant que le compte est actif. Droit à l'effacement implémenté : `DELETE /api/auth/account` anonymise le compte (`userRepository.anonymize()`) plutôt que de le supprimer physiquement (l'historique de commandes doit être conservé pour la facturation légale). |
| **Destinataires** | Aucun tiers — accès interne (équipe Jana Distribution) uniquement |

### 2.2 Commandes et facturation

| | |
|---|---|
| **Finalité** | Exécution du contrat de vente, obligations comptables et fiscales |
| **Données** | Historique d'achats, adresses de livraison/facturation (JSONB), mode de paiement, montants, snapshot client/entreprise sur chaque facture (nom, email, adresse — immuable une fois la facture émise) |
| **Base légale** | Exécution du contrat (`commande`) ; obligation légale française de conservation des factures (`facture`) |
| **Tables** | `commande`, `ligne_commande`, `facture`, `facture_ligne` |
| **Conservation codée** | Aucune purge automatique codée. Durée légale usuelle en France pour les documents comptables : **10 ans** (décision `DM-08` du projet, mentionnée mais **non formellement validée par un comptable** — voir `docs/workflow/PLAN_CORRECTION_AUDIT.md` DB-03/T9-04, toujours BLOCKED). |
| **Destinataires** | Aucun tiers — accès interne uniquement |

### 2.3 Codes promo

| | |
|---|---|
| **Finalité** | Suivi d'utilisation des codes promo (limites par client, statistiques) |
| **Données** | utilisateur_id, montant du rabais appliqué, commande associée |
| **Base légale** | Exécution du contrat / intérêt légitime (prévention d'abus) |
| **Table** | `code_promo_utilisation` |
| **Conservation codée** | Liée au cycle de vie de la commande — libérée si la commande est annulée (T13-13, voir `PLAN_CORRECTION_AUDIT.md`), sinon pas de purge séparée. |

### 2.4 Authentification et sessions

| | |
|---|---|
| **Finalité** | Maintien de la connexion (refresh token), révocation de session |
| **Données** | Hash SHA-256 du refresh token (jamais le token en clair), utilisateur_id, dates d'expiration/révocation |
| **Base légale** | Intérêt légitime / exécution du contrat (sécurité du compte) |
| **Table** | `refresh_token` |
| **Conservation codée** | **Corrigée le 2026-09-05** : purge automatique des lignes expirées (`userRepository.purgeExpiredRefreshTokens()`, appelée au démarrage puis toutes les 24h) — durée de vie effective ≈ `JWT_REFRESH_EXPIRES_IN` (30 jours par défaut) + jusqu'à 24h. Avant cette correction, les lignes n'étaient jamais supprimées (seulement marquées `revoked_at`), accumulation indéfinie. |

### 2.5 Audit des actions admin

| | |
|---|---|
| **Finalité** | Traçabilité des actions sensibles (modification/suppression produit, actions sur les comptes clients) — sécurité et accountability |
| **Données** | utilisateur_id (acteur admin), action, entité concernée, `ip_address` |
| **Base légale** | Intérêt légitime (sécurité, preuve en cas de litige) |
| **Table** | `audit_log` |
| **Conservation codée** | **Aucune purge automatique** — accumulation indéfinie à ce jour. Contrairement au cas des refresh tokens, une durée de conservation plus longue est généralement justifiable ici (valeur probante en cas d'incident/litige), mais **une durée explicite doit être décidée** (pratique courante : 1 à 3 ans) plutôt que de laisser une conservation illimitée non documentée — décision produit/légale, pas une correction technique appliquée unilatéralement dans cette session. |

### 2.6 Emails transactionnels (Gmail SMTP)

| | |
|---|---|
| **Finalité** | Envoi d'emails transactionnels (confirmation de commande, facture, réinitialisation de mot de passe) |
| **Données transmises à Google** | Email et nom du destinataire, contenu de l'email (peut inclure des données de commande/facture) |
| **Sous-traitant** | Google (compte Gmail dédié `jannadistribpro@gmail.com` — **compte Gmail personnel/gratuit ("option A")**, pas Google Workspace, voir `docs/guides/GUIDE_GMAIL_SMTP.md` §1) |
| **⚠️ Point non résolu, vérifié le 2026-09-05** | Un compte Gmail personnel gratuit est couvert par la **Politique de confidentialité Google** (grand public), **pas** par le **Cloud/Workspace Data Processing Addendum** (DPA RGPD Art. 28, réservé aux comptes Google Workspace/Cloud avec contrat formel — confirmé via les conditions publiques Google, `cloud.google.com/terms/data-processing-addendum`). Concrètement : **il n'existe aujourd'hui aucun accord de sous-traitance RGPD formel avec Google pour ce traitement.** Deux options pour combler ce point (décision propriétaire, pas une correction de code) : passer à Google Workspace (option B du guide, ~6€/mois, inclut le DPA) ou changer de fournisseur SMTP transactionnel proposant un DPA standard (ex. Brevo, utilisé avant la migration du 2026-07-08, en propose un). |

### 2.7 Logs applicatifs

| | |
|---|---|
| **Finalité** | Débogage, sécurité (détection d'anomalies) |
| **Données** | Requêtes HTTP (méthode, URL), erreurs applicatives, `service: jana-api`. Pas d'IP loggée explicitement dans le format actuel (voir `backend/src/config/logger.js`), sauf ce que Fly.io capture à sa propre couche plateforme (hors périmètre de ce registre). |
| **Base légale** | Intérêt légitime (sécurité opérationnelle) |
| **Conservation codée** | **Corrigée le 2026-09-05** : 90 jours par ancienneté (`winston-daily-rotate-file`), auparavant purge par taille seulement (aucune garantie de durée). Sur l'infrastructure Fly.io actuelle, le filesystem des machines est éphémère (pas de volume monté) — ces fichiers ne survivent de toute façon pas à un redéploiement. |

---

## 3. Droits des personnes — état d'implémentation

Voir `docs/produit/RGPD_ACCESSIBILITE.md` §"Ce qui est implémenté" pour le détail technique. Résumé :

| Droit | État |
|---|---|
| Accès / portabilité | ✅ Implémenté ("Télécharger mes données", export JSON) |
| Effacement | ✅ Implémenté (anonymisation du compte) |
| Rectification | ✅ Implicite (formulaire "Mes informations" éditable) |
| Opposition (marketing) | ✅ Implémenté (toggle newsletter) |
| Limitation du traitement | ❌ Non implémenté (pas de mécanisme de "gel" du compte sans suppression) |

---

## 4. Ce que ce document NE couvre PAS

- Validation juridique du contenu des CGV / mentions légales / politique de confidentialité (T9-03, BLOCKED, décision propriétaire — un avocat doit relire le texte réel des pages, ce registre ne fait qu'inventorier les données, pas juger la conformité des textes).
- Validation comptable des durées de conservation des factures et des règles de TVA (T9-04/DB-03, BLOCKED).
- Décision sur la durée de conservation de `audit_log` (§2.5).
- Décision sur le sous-traitant email (§2.6, Gmail personnel vs Workspace vs autre fournisseur).
- Éventuelle obligation de désigner un DPO (dépend du volume de données traitées et de la structure de l'entreprise — question à poser au juriste).
