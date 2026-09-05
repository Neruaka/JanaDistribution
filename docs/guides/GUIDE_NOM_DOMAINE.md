# Guide d'achat et de configuration du nom de domaine jana-distribution.fr

> ⚠️ **Section 3 obsolète (2026-09-05)** — décrit le branchement sur Railway,
> abandonné depuis la Phase 14 (production sur Fly.io). Pour la configuration
> du domaine sur l'infrastructure réelle actuelle, voir
> `docs/guides/GUIDE_NOM_DOMAINE_FLYIO.md`. Les sections 1 (achat du domaine),
> 2 (comprendre le DNS) et 7 (dernier paragraphe, DNS partagé email) restent
> valables telles quelles.

Ce guide explique, étape par étape et sans jargon technique inutile, comment acheter
le nom de domaine `jana-distribution.fr` et le brancher sur les services déployés sur
Railway (frontend + backend) pour que le site soit accessible à cette adresse, en HTTPS.

Pour la configuration des emails, voir `docs/guides/GUIDE_GMAIL_SMTP.md` (Gmail SMTP, migré
depuis Brevo le 2026-07-08). Si vous utilisez un simple compte Gmail dédié (option A du
guide), **aucun enregistrement DNS supplémentaire n'est nécessaire** pour l'email. Les
enregistrements DNS SPF/DKIM/DMARC décrits plus bas ne s'appliquent que si vous choisissez
l'option B (Google Workspace avec domaine `jana-distribution.fr` propre).

---

## 1. Acheter le domaine jana-distribution.fr

### Registrar recommandé : OVH

**OVH** est recommandé ici car c'est un registrar français, très utilisé pour les
domaines en `.fr`, avec une interface en français et un support client francophone.

1. Allez sur https://www.ovhcloud.com/fr/domains/
2. Recherchez `jana-distribution.fr` dans la barre de recherche de domaine.
3. Si disponible, ajoutez-le au panier (prix approximatif : **~6 à 8 € / an** pour un
   `.fr`, hors éventuelles options).
4. Créez un compte OVH (ou connectez-vous si vous en avez déjà un) et finalisez l'achat.

### Vérification d'identité obligatoire pour les .fr (AFNIC)

Les domaines en `.fr` sont régis par l'**AFNIC** (l'organisme qui gère l'extension
française) et imposent une règle particulière : le titulaire doit être une personne ou
une entreprise **identifiable et vérifiable** (contrairement à certains `.com` qui
acceptent l'anonymat).

- Si vous achetez en tant que particulier : une pièce d'identité (carte d'identité,
  passeport) peut vous être demandée par OVH pour valider le titulaire du domaine.
- Si vous achetez au nom d'une entreprise (recommandé pour Jana Distribution) : le
  numéro SIRET de l'entreprise (déjà présent dans le projet, voir `ENTREPRISE_SIRET`
  dans `backend/.env.example`) suffit généralement à identifier le titulaire, sans
  document d'identité supplémentaire.
- Cette vérification peut prendre de quelques minutes à 24h. Le domaine n'est
  utilisable qu'une fois la vérification validée par l'AFNIC via OVH.

**Astuce** : achetez le domaine sous la structure juridique de Jana Distribution
(même nom que sur les factures / SIRET) pour éviter tout litige de propriété plus tard.

---

## 2. Comprendre les types d'enregistrements DNS (en clair)

Le DNS, c'est l'annuaire d'Internet : il traduit un nom lisible par un humain
(`jana-distribution.fr`) en informations que les ordinateurs savent utiliser (une
adresse serveur, une règle d'email, etc.). Voici les types que vous manipulerez :

| Type | À quoi ça sert (en clair) | Exemple concret pour Jana Distribution |
|---|---|---|
| **A** | Pointe un nom de domaine vers une **adresse IP** (un numéro identifiant un serveur). | Rarement utilisé directement avec Railway (qui préfère les CNAME), mais peut être requis pour la racine du domaine (`jana-distribution.fr` sans `www`). |
| **CNAME** | Redirige un nom de domaine vers un **autre nom de domaine** (un alias). C'est ce que Railway utilise le plus souvent. | `www.jana-distribution.fr` → `xxxxx.up.railway.app` (le frontend Railway) |
| **TXT** | Stocke du **texte libre**, utilisé pour des preuves de propriété ou des règles (SPF, DMARC, vérification de propriété d'un domaine). | Règles SPF/DMARC pour Gmail SMTP — uniquement si option B/Google Workspace (voir `docs/guides/GUIDE_GMAIL_SMTP.md` §5). |
| **MX** | Indique **quel serveur reçoit les emails** envoyés à `@jana-distribution.fr`. | Nécessaire uniquement si vous recevez des emails `@jana-distribution.fr` (ex. Google Workspace, option B). Pas requis pour un simple envoi via un compte Gmail dédié (option A) — MX ne concerne que la *réception*. |

---

## 3. Configurer le domaine personnalisé sur Railway

Railway héberge deux services distincts pour Jana Distribution : le **frontend**
(Dockerfile) et le **backend** (NIXPACKS). Chacun doit avoir son propre sous-domaine.

Organisation recommandée :
- `jana-distribution.fr` (ou `www.jana-distribution.fr`) → service **frontend**
- `api.jana-distribution.fr` → service **backend**

### Étapes pour chaque service

1. Connectez-vous à https://railway.app et ouvrez votre projet Jana Distribution.
2. Cliquez sur le service concerné (par ex. **frontend**).
3. Allez dans l'onglet **"Settings"** → section **"Networking"**.
4. Cliquez sur **"Custom Domain"** / **"+ Custom Domain"**.
5. Entrez le nom souhaité, par exemple `jana-distribution.fr` (pour le frontend) ou
   `api.jana-distribution.fr` (pour le backend).
6. Railway affiche l'enregistrement DNS à créer chez le registrar — généralement un
   **CNAME** pointant vers une adresse du type `xxxxxxx.up.railway.app` (parfois un
   enregistrement **A** avec une IP si vous utilisez le domaine racine sans `www`, car
   certains registrars n'acceptent pas de CNAME sur la racine — dans ce cas, préférez
   utiliser `www.jana-distribution.fr` en CNAME et faites une redirection depuis la
   racine).
7. Recopiez cet enregistrement dans la zone DNS OVH (voir ci-dessous).
8. Répétez pour le second service (backend → `api.jana-distribution.fr`).

### Ajouter les enregistrements chez OVH

1. Connectez-vous sur https://www.ovh.com/manager/
2. Allez dans **"Web Cloud" → "Noms de domaine"** → sélectionnez `jana-distribution.fr`.
3. Onglet **"Zone DNS"**.
4. Cliquez sur **"Ajouter une entrée"**, choisissez le type indiqué par Railway
   (CNAME le plus souvent), puis renseignez :
   - Sous-domaine : `www` (ou `api` pour le backend, ou vide/`@` pour la racine)
   - Cible : la valeur `xxxxxxx.up.railway.app` fournie par Railway
   - TTL : laisser la valeur par défaut
5. Validez. Répétez pour chaque enregistrement demandé par Railway (frontend et
   backend).

---

## 4. Propagation DNS : attendre et vérifier

Un changement DNS ne se répercute pas instantanément partout dans le monde — c'est la
**propagation**. Chez OVH, comptez généralement **quelques minutes à quelques heures**
(le maximum théorique étant 48h).

### Comment vérifier que ça a bien pris

**Option simple (recommandée pour un non-développeur)** : allez sur
https://dnschecker.org, entrez `jana-distribution.fr` (ou `api.jana-distribution.fr`),
sélectionnez le type d'enregistrement (CNAME/A), et regardez si le résultat correspond
à la cible Railway partout dans le monde (coches vertes).

**Option ligne de commande (si vous êtes à l'aise) :**

Sous Windows (PowerShell) :
```powershell
nslookup jana-distribution.fr
nslookup api.jana-distribution.fr
```

Sous Mac/Linux :
```bash
dig jana-distribution.fr
dig api.jana-distribution.fr
```

Si la réponse renvoie bien l'adresse/le nom Railway attendu, la propagation est
terminée pour votre position réseau (elle peut encore être en cours ailleurs dans le
monde, sans que cela vous impacte).

---

## 5. HTTPS automatique (Let's Encrypt) via Railway

Une fois le domaine personnalisé validé côté Railway (le statut passe de "En attente"
à **"Actif"** / coche verte dans Settings → Networking), Railway génère et renouvelle
automatiquement un certificat **Let's Encrypt** pour ce domaine. Concrètement :

- Vous n'avez **rien à faire manuellement** pour le certificat SSL.
- Le site sera automatiquement accessible en `https://jana-distribution.fr` (le `http://`
  redirige normalement vers `https://`).
- Si le certificat n'apparaît pas actif après quelques heures, vérifiez d'abord que le
  DNS pointe bien vers Railway (étape 4) — c'est la cause la plus fréquente de blocage,
  Railway ne peut valider le certificat que si le DNS est correctement configuré.

---

## 6. Mettre à jour les variables d'environnement Railway une fois le domaine actif

Une fois `jana-distribution.fr` (frontend) et `api.jana-distribution.fr` (backend) actifs
et en HTTPS, mettez à jour les variables suivantes pour que l'application les utilise
au lieu des adresses `railway.app` par défaut :

### Sur le service **backend** (onglet Variables) :

| Variable | Nouvelle valeur | Pourquoi (source : code) |
|---|---|---|
| `CORS_ORIGIN` | `https://jana-distribution.fr` | Le backend n'autorise que cette origine à appeler l'API (protection CORS) — voir `backend/.env.example`, valeur par défaut actuelle : `http://localhost:5173`. |
| `FRONTEND_URL` | `https://jana-distribution.fr` | Utilisée pour construire les liens dans les emails envoyés (confirmation de commande, réinitialisation de mot de passe...) — voir `backend/src/services/email.service.js` et `docs/guides/GUIDE_GMAIL_SMTP.md`. |

### Sur le service **frontend** (onglet Variables) :

| Variable | Nouvelle valeur | Pourquoi (source : code) |
|---|---|---|
| `VITE_API_URL` | `https://api.jana-distribution.fr/api` | URL utilisée par le frontend pour appeler le backend — voir `frontend/.env.example` (valeur d'exemple actuelle : `https://ton-backend.railway.app/api`). |

Après avoir modifié ces variables, redéployez les deux services (Railway le fait
généralement automatiquement dès qu'une variable change).

---

## 7. Checklist de vérification finale

Une fois tout configuré, vérifiez dans cet ordre :

- [ ] `https://jana-distribution.fr` s'ouvre dans un navigateur et affiche bien le site
      (pas d'erreur de certificat, cadenas vert/HTTPS visible)
- [ ] Test rapide en ligne de commande :
  ```bash
  curl -I https://jana-distribution.fr
  ```
  doit renvoyer un code `200 OK` (ou une redirection `30x` propre).
- [ ] Le backend répond correctement sur son endpoint de santé :
  ```bash
  curl https://api.jana-distribution.fr/api/health
  ```
  doit renvoyer un JSON du type :
  ```json
  {"success": true, "message": "API Jana Distribution operationnelle", "services": {"database": "up"}}
  ```
  (cet endpoint est défini dans `backend/src/index.js`, route `GET /api/health` — il
  vérifie aussi que la base de données PostgreSQL répond).
- [ ] Se connecter sur le site en HTTPS, passer une action qui appelle l'API (par
      exemple se connecter à un compte ou consulter le catalogue) pour confirmer que le
      frontend communique bien avec le backend via `VITE_API_URL`.
- [ ] Créer un compte de test ou déclencher un email (mot de passe oublié) pour vérifier
      que les liens dans l'email pointent bien vers `https://jana-distribution.fr` et
      non vers `localhost`.

---

## Rappel : DNS partagé avec la configuration email (Gmail SMTP, option B uniquement)

Si vous utilisez un simple compte Gmail dédié comme expéditeur (option A de
`docs/guides/GUIDE_GMAIL_SMTP.md`), **cette section ne s'applique pas** — aucun enregistrement
DNS email n'est nécessaire.

Si vous utilisez Google Workspace avec le domaine `jana-distribution.fr` (option B), le
domaine acheté ici sert **à la fois** :
- aux enregistrements **A/CNAME** pointant vers Railway (ce guide), et
- aux enregistrements **TXT** d'authentification email SPF/DKIM/DMARC pour Google
  (voir `docs/guides/GUIDE_GMAIL_SMTP.md`, section 5).

Ces enregistrements coexistent dans la **même zone DNS OVH**, sans conflit, tant que
les noms d'hôtes ne se chevauchent pas (par exemple `@`/`www` pour Railway, `_dmarc` et
`google._domainkey` pour Google Workspace). Il est recommandé de configurer les deux à la
suite, dans la même session sur l'interface OVH, pour éviter les allers-retours.
