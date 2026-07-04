# Guide de configuration Brevo (emails transactionnels)

Ce guide explique, étape par étape, comment configurer **Brevo** (anciennement Sendinblue)
pour que Jana Distribution puisse envoyer automatiquement ses emails : bienvenue,
suivi de commande, factures, réinitialisation de mot de passe, etc.

Aucune compétence technique n'est requise pour suivre ce guide — vous aurez seulement
besoin d'accéder à votre compte Brevo, à votre interface Railway, et au panneau de gestion
DNS de votre nom de domaine (voir `docs/GUIDE_NOM_DOMAINE.md` pour ce dernier point).

---

## 1. Créer un compte Brevo

1. Rendez-vous sur https://www.brevo.com/fr/
2. Cliquez sur **"S'inscrire gratuitement"**.
3. Renseignez l'email professionnel de Jana Distribution (par exemple
   `contact@jana-distribution.fr` une fois le domaine actif, ou un email temporaire en
   attendant).
4. Validez votre adresse email (lien reçu par email).
5. Complétez les informations de l'entreprise si Brevo les demande (nom, adresse).

**Offre gratuite ("Free")** : jusqu'à **300 emails par jour**, ce qui est largement
suffisant pour démarrer (voir la section pricing en bas de ce guide pour la suite).

---

## 2. Récupérer la clé API

1. Une fois connecté, cliquez sur votre nom/avatar en haut à droite → **"SMTP & API"**
   (ou allez directement dans **Paramètres → API Keys / Clés API**).
2. Dans l'onglet **"API Keys"**, cliquez sur **"Générer une nouvelle clé API"**.
3. Donnez-lui un nom explicite, par exemple `jana-distribution-prod`.
4. Copiez la clé générée (elle commence par `xkeysib-...`). **Vous ne pourrez plus la
   revoir en clair après avoir quitté la page** — copiez-la immédiatement dans un gestionnaire
   de mots de passe.

### Où la mettre : jamais dans le code, jamais dans Git

⚠️ **Règle absolue** : cette clé ne doit **jamais** être écrite dans un fichier commité sur
Git (pas dans `.env`, pas dans le code, pas dans un commit, même privé). Le fichier
`backend/.env.example` du projet contient uniquement un exemple vide — c'est normal et voulu.

La clé doit être configurée **uniquement** comme variable d'environnement sur Railway :

1. Ouvrez votre projet sur https://railway.app
2. Sélectionnez le **service backend**.
3. Allez dans l'onglet **"Variables"**.
4. Ajoutez une nouvelle variable :
   - Nom : `BREVO_API_KEY`
   - Valeur : la clé copiée à l'étape précédente (`xkeysib-...`)
5. Cliquez sur **"Deploy"** / laissez Railway redéployer automatiquement le service.

Si cette variable est absente, l'application démarre quand même mais n'enverra aucun
email (le backend écrit un avertissement dans ses logs : `BREVO_API_KEY manquante - les
emails ne seront pas envoyes`) — c'est un comportement volontaire pour ne jamais bloquer
le site à cause d'un souci d'email.

---

## 3. Ajouter un expéditeur vérifié ("Sender")

Avant de pouvoir envoyer un email depuis une adresse comme `noreply@jana-distribution.fr`,
Brevo doit vérifier que vous êtes bien autorisé à utiliser cette adresse.

1. Dans Brevo, allez dans **"Expéditeurs, domaines & dédiabonnement"**
   (menu : **Senders & IPs → Senders**, aussi accessible via l'icône engrenage → *Senders*).
2. Cliquez sur **"Ajouter un expéditeur"**.
3. Renseignez :
   - Nom de l'expéditeur : `Jana Distribution`
   - Email de l'expéditeur : `noreply@jana-distribution.fr` (ou `contact@jana-distribution.fr`)
4. Brevo envoie un email de confirmation à cette adresse — cliquez sur le lien de
   validation qu'il contient.

Une fois validé, cet expéditeur apparaîtra avec un badge vert "Vérifié".

**Important** : tant que vous n'avez pas encore de domaine `jana-distribution.fr` actif
(voir `docs/GUIDE_NOM_DOMAINE.md`), vous pouvez temporairement utiliser une adresse Gmail
ou autre comme expéditeur vérifié, le temps de finaliser l'achat du domaine.

---

## 4. Authentifier le domaine (SPF, DKIM, DMARC)

C'est l'étape la **plus importante** pour éviter que vos emails (confirmation de commande,
factures...) tombent dans les spams de vos clients.

### Pourquoi c'est nécessaire, en clair

Quand votre serveur (Brevo, en réalité) envoie un email "au nom de"
`jana-distribution.fr`, les grandes messageries (Gmail, Outlook, Yahoo...) vérifient
que ce domaine a bien **autorisé** Brevo à envoyer des emails en son nom. Sans cette
autorisation, l'email est soit rejeté, soit envoyé directement dans le dossier spam.

| Mécanisme | Ce qu'il fait | Ce qui se passe si vous le sautez |
|---|---|---|
| **SPF** (Sender Policy Framework) | Une liste blanche : "voici les serveurs autorisés à envoyer des emails pour mon domaine" (ici : les serveurs de Brevo). | Les messageries ne savent pas si Brevo est un expéditeur légitime → risque fort de spam. |
| **DKIM** (DomainKeys Identified Mail) | Une signature électronique invisible ajoutée à chaque email, prouvant qu'il n'a pas été modifié en chemin et qu'il vient bien de vous. | Les emails sont plus facilement suspectés de "spoofing" (usurpation) et filtrés. |
| **DMARC** (Domain-based Message Authentication) | La règle globale : "si un email prétend venir de mon domaine mais échoue SPF *et* DKIM, voici quoi en faire (rejeter, mettre en quarantaine, ou laisser passer)". | Sans DMARC, un pirate peut plus facilement usurper `jana-distribution.fr` pour du phishing, et vos propres emails ont une réputation plus faible. |

En résumé : **SPF + DKIM + DMARC = vos emails arrivent en boîte de réception au lieu du
dossier spam, et personne ne peut usurper facilement votre domaine.**

### Comment faire

1. Dans Brevo : **Senders & IPs → Domains** (ou **"Expéditeurs, domaines &
   désinscription" → onglet Domaines**).
2. Cliquez sur **"Ajouter un domaine"** et entrez `jana-distribution.fr`.
3. Brevo affiche une liste d'enregistrements DNS à créer chez votre registrar (OVH, voir
   `docs/GUIDE_NOM_DOMAINE.md`). Ils ressemblent typiquement à ceci (les valeurs exactes
   affichées par Brevo pour votre compte doivent être copiées telles quelles depuis
   l'interface — les exemples ci-dessous illustrent le **format** attendu) :

| Type | Hôte / Nom | Valeur (exemple) | Rôle |
|---|---|---|---|
| TXT | `@` (ou `jana-distribution.fr`) | `v=spf1 include:spf.sendinblue.com mx ~all` | SPF — autorise les serveurs Brevo |
| CNAME | `mail._domainkey` | `mail._domainkey.brevo.com` | DKIM — clé de signature n°1 |
| CNAME | `brevo1._domainkey` (ou nom similaire fourni par Brevo) | `b1.brevo.com` | DKIM — clé de signature n°2 |
| CNAME | `brevo2._domainkey` | `b2.brevo.com` | DKIM — clé de signature n°3 (selon compte) |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:contact@jana-distribution.fr` | DMARC — politique + adresse de rapports |

   > Si le domaine possède déjà un enregistrement SPF (par exemple pour un autre service
   > d'emailing), **ne créez pas un deuxième enregistrement TXT SPF** : fusionnez les
   > deux dans une seule ligne (un domaine ne doit avoir qu'un seul enregistrement SPF).
   > Exemple fusionné : `v=spf1 include:spf.sendinblue.com include:_spf.google.com ~all`

4. Ajoutez ces enregistrements chez votre registrar de domaine (OVH dans le cas de
   Jana Distribution — voir la section DNS de `docs/GUIDE_NOM_DOMAINE.md` pour la marche
   à suivre précise dans l'interface OVH).
5. Revenez sur Brevo et cliquez sur **"Vérifier"** / **"Authenticate this domain"**.
   La propagation DNS peut prendre de quelques minutes à 48h (généralement moins d'une
   heure avec OVH).
6. Une fois validé, Brevo affiche SPF ✅, DKIM ✅, DMARC ✅ en vert.

Pour le DMARC, commencer par `p=none` (mode "observation", n'affecte pas la délivrabilité)
est une bonne pratique ; vous pourrez durcir la politique (`p=quarantine` puis `p=reject`)
une fois certain que tous les emails légitimes passent bien SPF/DKIM.

---

## 5. Variables d'environnement Railway à configurer

Ces variables sont lues par `backend/src/services/email.service.js` et doivent être
définies dans les **Variables** du service **backend** sur Railway (jamais commitées dans
un fichier `.env` versionné — `backend/.env.example` ne contient que des exemples/valeurs
vides à titre indicatif) :

| Variable | Rôle | Exemple de valeur |
|---|---|---|
| `BREVO_API_KEY` | Clé API Brevo obtenue à l'étape 2. Sans elle, aucun email n'est envoyé. | `xkeysib-xxxxxxxx...` |
| `BREVO_SENDER_EMAIL` | Adresse "expéditeur" vérifiée à l'étape 3. | `noreply@jana-distribution.fr` |
| `BREVO_SENDER_NAME` | Nom affiché comme expéditeur dans la boîte mail du client. | `Jana Distribution` |
| `FRONTEND_URL` | URL du site utilisée dans les liens contenus dans les emails (boutons "Voir ma commande", "Réinitialiser mon mot de passe", etc.). | `https://jana-distribution.fr` |

Notes tirées du code (`backend/src/services/email.service.js`) :
- Si `BREVO_SENDER_EMAIL` n'est pas défini, le code utilise par défaut
  `noreply@jana-distribution.fr`.
- Si `BREVO_SENDER_NAME` n'est pas défini, le code utilise par défaut `Jana Distribution`.
- Si `FRONTEND_URL` n'est pas défini, le code retombe sur `http://localhost:5173`
  (adresse de développement) — **pensez donc bien à définir `FRONTEND_URL` en
  production**, sinon les liens dans les emails clients pointeront vers une adresse
  locale inutilisable.

---

## 6. Tester l'envoi avec une commande curl

Une fois la clé API obtenue, vous pouvez tester l'envoi d'un email directement, sans
attendre que le site soit branché, en utilisant l'API REST de Brevo. Ouvrez une invite de
commande (PowerShell) et remplacez `VOTRE_CLE_API` et l'adresse email de test :

```bash
curl --request POST \
  --url https://api.brevo.com/v3/smtp/email \
  --header "accept: application/json" \
  --header "api-key: VOTRE_CLE_API" \
  --header "content-type: application/json" \
  --data '{
    "sender": {"name": "Jana Distribution", "email": "noreply@jana-distribution.fr"},
    "to": [{"email": "votre-adresse-de-test@example.com"}],
    "subject": "Test Brevo - Jana Distribution",
    "htmlContent": "<html><body><h1>Ceci est un test</h1><p>Si vous recevez cet email, Brevo est bien configuré.</p></body></html>"
  }'
```

Une réponse contenant un `messageId` signifie que l'envoi a réussi. Vérifiez ensuite
votre boîte de réception (et le dossier spam, au cas où le domaine ne serait pas encore
authentifié — voir étape 4).

---

## 7. Emails envoyés par l'application

Voici la liste exacte des emails que Jana Distribution envoie aujourd'hui
(source : `backend/src/services/email.service.js`) :

| Méthode dans le code | Quand est-il envoyé | Contenu |
|---|---|---|
| `sendWelcomeEmail(user)` | Juste après la création d'un compte client. | Message de bienvenue, présentation rapide des avantages (produits frais, suivi de commande, promotions), bouton vers le catalogue. |
| `sendOrderStatusEmail(order, oldStatus, newStatus, user)` | À chaque changement de statut d'une commande (`EN_ATTENTE` → `CONFIRMEE` → `EN_PREPARATION` → `EXPEDIEE` → `LIVREE`, ou `ANNULEE`). | Badge coloré indiquant le nouveau statut, numéro de commande, date, montant total, bouton "Voir ma commande" pointant vers `FRONTEND_URL`. |
| `sendInvoiceEmail({...})` | Lorsqu'une facture est générée pour une commande. | Numéro de facture, montant TTC, date d'émission, **le PDF de la facture en pièce jointe**, mention légale de conservation 10 ans avec le SIRET de l'entreprise. |
| `sendPasswordResetEmail(user, resetToken)` | Quand un utilisateur clique sur "Mot de passe oublié". | Lien de réinitialisation (valable **1 heure**) construit à partir de `FRONTEND_URL` + le jeton de réinitialisation. |
| `sendPasswordChangedEmail(user)` | Juste après qu'un mot de passe a été changé avec succès. | Confirmation du changement avec date/heure, avertissement invitant à contacter le support si l'utilisateur n'est pas à l'origine du changement. |

Tous ces emails partagent le même gabarit visuel (bandeau vert "Jana Distribution", pied
de page avec mention "email automatique, ne pas répondre") défini dans
`getBaseTemplate()`.

---

## 8. Tarifs Brevo

À titre indicatif (les tarifs Brevo évoluent, vérifiez toujours la page officielle
https://www.brevo.com/fr/pricing/ avant de vous engager) :

| Plan | Volume d'emails | Prix approximatif | Remarques |
|---|---|---|---|
| **Free** | 300 emails/jour (~9 000/mois) | 0 € | Suffisant pour démarrer et pour tout le trafic actuel du site. Logo Brevo en pied de mail sur certains plans. |
| **Starter** | À partir de 5 000 emails/mois (volume ajustable) | À partir d'environ 9 €/mois | Retire le logo Brevo, support email. |
| **Business** | Volumes plus élevés + fonctionnalités avancées (automation, A/B testing, statistiques poussées) | À partir d'environ 18 €/mois | Utile si le volume de commandes/emails augmente fortement. |
| **Enterprise** | Sur mesure | Sur devis | Pour un très gros volume, SLA dédié. |

**Recommandation** : démarrer avec le plan **Free** (300 emails/jour). Avec le volume
actuel du projet (commandes, comptes, mots de passe), cela laisse une large marge.
Surveillez simplement le compteur d'envois dans le tableau de bord Brevo, et passez au
plan **Starter** si vous approchez régulièrement de la limite quotidienne.

---

## Récapitulatif checklist

- [ ] Compte Brevo créé et email vérifié
- [ ] Clé API générée et copiée dans un gestionnaire de mots de passe
- [ ] `BREVO_API_KEY` ajoutée dans Railway (service backend)
- [ ] Expéditeur (`noreply@jana-distribution.fr` ou équivalent) ajouté et vérifié dans Brevo
- [ ] `BREVO_SENDER_EMAIL` et `BREVO_SENDER_NAME` ajoutés dans Railway
- [ ] Domaine `jana-distribution.fr` authentifié dans Brevo (SPF/DKIM/DMARC verts)
- [ ] Enregistrements DNS correspondants créés chez le registrar (voir
      `docs/GUIDE_NOM_DOMAINE.md`)
- [ ] `FRONTEND_URL` défini sur Railway avec l'URL réelle du site en production
- [ ] Test curl effectué avec succès, email reçu (hors spam)
