# Guide de configuration Gmail SMTP (emails transactionnels)

Ce guide explique, étape par étape, comment configurer **Gmail SMTP** (via `nodemailer`)
pour que Jana Distribution puisse envoyer automatiquement ses emails : bienvenue,
suivi de commande, factures, réinitialisation de mot de passe, etc.

> Ce guide remplace `docs/archive/guides/GUIDE_BREVO_CONFIGURATION.md` — Brevo a été retiré du projet le
> 2026-07-08 au profit de Gmail SMTP (voir `docs/workflow/ETAT_ACTUEL_PROJET.md`).

Aucune compétence technique poussée n'est requise pour suivre ce guide — vous aurez
seulement besoin d'un compte Gmail (ou Google Workspace) et d'un accès à `flyctl`
(CLI Fly.io, voir `docs/deploiement/DEPLOY-FLYIO.md`).

---

## 1. Choisir le compte expéditeur

Deux options, selon le niveau de professionnalisme souhaité :

| Option | Adresse d'envoi | Coût | Recommandé pour |
|---|---|---|---|
| **A — Gmail gratuit dédié** | `jana.distribution.contact@gmail.com` (ou similaire) | Gratuit | Démarrage rapide, volume modéré |
| **B — Google Workspace avec domaine propre** | `contact@jana-distribution.fr` | ~6 €/mois/utilisateur | Image professionnelle, nécessaire pour envoyer "depuis" votre propre domaine |

L'option A fonctionne immédiatement avec un compte Gmail personnel dédié (ne pas utiliser
un compte Gmail personnel existant — créez un compte dédié à l'application). L'option B
nécessite un abonnement Google Workspace et la vérification de propriété du domaine
`jana-distribution.fr`, mais permet d'envoyer des emails "au nom de" votre propre domaine
avec SPF/DKIM/DMARC alignés (voir §5).

**Recommandation** : démarrer avec l'option A, migrer vers l'option B si l'image de marque
ou le volume d'envoi le justifie.

---

## 2. Activer la validation en 2 étapes

Gmail **exige** la validation en 2 étapes (2FA) sur le compte pour pouvoir générer un mot
de passe d'application (obligatoire pour l'authentification SMTP programmatique).

1. Connectez-vous au compte Gmail choisi à l'étape 1.
2. Allez sur https://myaccount.google.com/security
3. Dans la section **"Comment vous vous connectez à Google"**, activez
   **"Validation en 2 étapes"** si ce n'est pas déjà fait (numéro de téléphone requis).

---

## 3. Générer un mot de passe d'application

1. Toujours sur https://myaccount.google.com/security, une fois la validation en 2 étapes
   activée, cherchez **"Mots de passe des applications"** (ou allez directement sur
   https://myaccount.google.com/apppasswords).
2. Donnez un nom explicite, par exemple `jana-distribution-smtp`.
3. Cliquez sur **"Créer"**. Google affiche un mot de passe de **16 caractères** (sans
   espaces à l'usage, bien que affiché avec des espaces).
4. Copiez-le immédiatement dans un gestionnaire de mots de passe — **vous ne pourrez plus
   le revoir en clair après avoir quitté la page**.

### Où le mettre : jamais dans le code, jamais dans Git

⚠️ **Règle absolue** : ce mot de passe ne doit **jamais** être écrit dans un fichier
commité sur Git (pas dans `.env`, pas dans le code, pas dans un commit, même privé). Le
fichier `backend/.env.example` du projet contient uniquement un exemple vide — c'est
normal et voulu.

Le mot de passe doit être configuré **uniquement** comme secret Fly.io sur l'app backend
(`jana-backend`), jamais dans un fichier commité :

```bash
printf 'GMAIL_SENDER_EMAIL=votre.adresse@gmail.com\n' | flyctl secrets import --app jana-backend
printf 'GMAIL_APP_PASSWORD=le_mot_de_passe_genere_a_l_etape_3\n' | flyctl secrets import --app jana-backend
printf 'GMAIL_SENDER_NAME=Jana Distribution\n' | flyctl secrets import --app jana-backend
```

Poser un secret Fly.io redéploie automatiquement l'app backend (voir
`docs/deploiement/DEPLOY-FLYIO.md` §4 "Secrets").

Si `GMAIL_SENDER_EMAIL` ou `GMAIL_APP_PASSWORD` est absent, l'application démarre quand
même mais n'enverra aucun email (le backend écrit un avertissement dans ses logs :
`GMAIL_SENDER_EMAIL/GMAIL_APP_PASSWORD manquant(s) - les emails ne seront pas envoyes`) —
comportement volontaire pour ne jamais bloquer le site à cause d'un souci d'email.

---

## 4. Limites d'envoi Gmail

| Type de compte | Limite | Notes |
|---|---|---|
| Gmail gratuit | **500 emails / jour** | Limite glissante sur 24h, par compte expéditeur |
| Google Workspace | **2 000 emails / jour** | Selon la formule d'abonnement |
| Destinataires par email | 500 (Gmail) / 2 000 (Workspace) | Non pertinent ici (un destinataire par email transactionnel) |

Avec le volume actuel du projet (comptes, commandes, factures, mots de passe), 500
emails/jour est large au démarrage. Si ce volume est dépassé régulièrement, migrer vers
Google Workspace (option B, §1) ou reconsidérer un service d'envoi transactionnel dédié.

Au-delà de ces quotas, Gmail bloque temporairement l'envoi (erreur SMTP `454` ou `550`) —
le code applicatif journalise l'échec (`logger.error`) sans faire planter le serveur.

---

## 5. SPF, DKIM, DMARC pour le domaine expéditeur

### Si vous utilisez l'option A (adresse `@gmail.com`)

Rien à faire : Google gère déjà SPF/DKIM/DMARC pour `gmail.com`. Les emails envoyés
depuis une adresse `@gmail.com` via le SMTP Gmail sont nativement authentifiés.

### Si vous utilisez l'option B (domaine `jana-distribution.fr` via Google Workspace)

Pour que les grandes messageries (Gmail, Outlook, Yahoo...) fassent confiance aux emails
envoyés "au nom de" `jana-distribution.fr`, le domaine doit autoriser explicitement les
serveurs Google à envoyer en son nom :

| Mécanisme | Ce qu'il fait | Enregistrement DNS typique (à copier depuis la console Google Workspace) |
|---|---|---|
| **SPF** | Liste blanche des serveurs autorisés à envoyer pour le domaine | TXT `@` → `v=spf1 include:_spf.google.com ~all` |
| **DKIM** | Signature électronique prouvant l'authenticité de l'email | TXT `google._domainkey` → clé fournie par Google Admin Console (Apps → Gmail → Authentifier l'email) |
| **DMARC** | Politique appliquée si SPF/DKIM échouent | TXT `_dmarc` → `v=DMARC1; p=none; rua=mailto:contact@jana-distribution.fr` |

> Si le domaine possède déjà un enregistrement SPF (par exemple un reliquat de la
> configuration Brevo), **fusionnez-le** en un seul enregistrement TXT : un domaine ne doit
> avoir qu'un seul enregistrement SPF.
> Exemple fusionné : `v=spf1 include:_spf.google.com ~all` (retirer l'ancien
> `include:spf.sendinblue.com` de Brevo s'il est encore présent).

Étapes dans Google Admin Console (nécessite Google Workspace) :
1. **Apps → Google Workspace → Gmail → Authentifier l'email** → activer DKIM, copier
   l'enregistrement TXT fourni.
2. Ajouter les enregistrements SPF/DKIM/DMARC chez votre registrar (OVH — voir
   `docs/guides/GUIDE_NOM_DOMAINE.md`).
3. Vérifier la propagation (quelques minutes à 48h) puis valider dans Google Admin Console.

Commencer le DMARC avec `p=none` (mode observation), durcir vers `p=quarantine` puis
`p=reject` une fois certain que tous les emails légitimes passent SPF/DKIM.

---

## 6. Tester l'envoi

Une fois `GMAIL_SENDER_EMAIL` et `GMAIL_APP_PASSWORD` renseignés en local (`backend/.env`,
jamais commité), un envoi de test peut être déclenché via n'importe quelle méthode publique
de `emailService` (par exemple en appelant `sendWelcomeEmail` sur un compte de test lors
d'une inscription), ou via un script Node ponctuel utilisant directement `nodemailer` avec
les mêmes identifiants pour vérifier la connexion SMTP avant intégration complète.

Une réponse contenant un `messageId` (visible dans les logs applicatifs, niveau `info`)
signifie que l'envoi a réussi. Vérifiez ensuite la boîte de réception du destinataire de
test (et le dossier spam, notamment si l'option B n'a pas encore SPF/DKIM validés).

---

## 7. Emails envoyés par l'application

Liste inchangée par la migration (source : `backend/src/services/email.service.js`) :

| Méthode dans le code | Quand est-il envoyé | Contenu |
|---|---|---|
| `sendWelcomeEmail(user)` | Juste après la création d'un compte client. | Message de bienvenue, présentation rapide des avantages, bouton vers le catalogue. |
| `sendOrderStatusEmail(order, oldStatus, newStatus, user)` | À chaque changement de statut d'une commande. | Badge coloré du nouveau statut, numéro de commande, date, montant total, bouton "Voir ma commande". |
| `sendInvoiceEmail({...})` | Lorsqu'une facture est générée pour une commande. | Numéro de facture, montant TTC, date d'émission, **PDF en pièce jointe**, mention légale de conservation 10 ans. |
| `sendPasswordResetEmail(user, resetToken)` | Quand un utilisateur clique sur "Mot de passe oublié". | Lien de réinitialisation (valable 1 heure). |
| `sendPasswordChangedEmail(user)` | Juste après un changement de mot de passe réussi. | Confirmation avec date/heure, avertissement de sécurité. |

Tous ces emails partagent le même gabarit visuel défini dans `getBaseTemplate()`.

---

## Récapitulatif checklist

- [ ] Compte Gmail dédié créé (ou Google Workspace configuré, selon l'option choisie §1)
- [ ] Validation en 2 étapes activée sur ce compte
- [ ] Mot de passe d'application généré et copié dans un gestionnaire de mots de passe
- [ ] `GMAIL_SENDER_EMAIL` et `GMAIL_APP_PASSWORD` ajoutés comme secrets Fly.io (`jana-backend`)
- [ ] `GMAIL_SENDER_NAME` ajouté comme secret Fly.io (`Jana Distribution`)
- [ ] `FRONTEND_URL` défini sur Fly.io avec l'URL réelle du site en production
- [ ] (Option B uniquement) SPF/DKIM/DMARC configurés dans Google Admin Console + DNS OVH
- [ ] Test d'envoi effectué avec succès, email reçu (hors spam)
