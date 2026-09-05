# Nom de domaine personnalisé sur Fly.io — Jana Distribution

> Complète `docs/guides/GUIDE_NOM_DOMAINE.md` (achat du domaine, notions DNS) : ce
> guide couvre uniquement le branchement sur l'infrastructure réelle actuelle
> (Fly.io, voir `docs/deploiement/DEPLOY-FLYIO.md`), qui remplace la section 3
> (Railway) de l'ancien guide.

---

## 1. Rappel : ce que vous achetez et où

Achetez le domaine (ex. `jana-distribution.fr`) chez le registrar de votre choix —
voir `docs/guides/GUIDE_NOM_DOMAINE.md` §1 pour la démarche complète (OVH recommandé,
vérification d'identité AFNIC pour les `.fr`). Cette partie ne change pas avec Fly.io.

Organisation recommandée (identique à l'ancien guide) :
- `jana-distribution.fr` (ou `www.`) → frontend
- `api.jana-distribution.fr` → backend

---

## 2. Ajouter le certificat côté Fly

Fly génère et renouvelle automatiquement un certificat Let's Encrypt par domaine, une
fois le DNS pointé correctement (§3). Pour chaque sous-domaine :

```bash
flyctl certs add jana-distribution.fr --app jana-frontend
flyctl certs add www.jana-distribution.fr --app jana-frontend
flyctl certs add api.jana-distribution.fr --app jana-backend
```

Chaque commande affiche immédiatement les enregistrements DNS exacts à créer (ça
dépend de si c'est la racine du domaine ou un sous-domaine — Fly vous les donne au
bon format, inutile de les deviner) :

```bash
flyctl certs show jana-distribution.fr --app jana-frontend
```

---

## 3. Créer les enregistrements DNS chez le registrar

Chez OVH (zone DNS du domaine) : ajouter les enregistrements affichés par `flyctl
certs show` — généralement :
- Un `CNAME` pour un sous-domaine (`www`, `api`) pointant vers `<app>.fly.dev`
- Un `A` + `AAAA` pour la racine du domaine (`jana-distribution.fr` sans `www`),
  Fly fournissant les adresses IP à utiliser (visibles aussi dans la sortie de
  `flyctl certs show`)

---

## 4. Vérifier la validation

```bash
flyctl certs check jana-distribution.fr --app jana-frontend
```

Passe de "en attente" à validé une fois le DNS propagé (quelques minutes à
quelques heures, comme pour n'importe quel changement DNS — voir
`docs/guides/GUIDE_NOM_DOMAINE.md` §4 pour vérifier la propagation via
dnschecker.org ou `nslookup`/`dig`).

---

## 5. Mettre à jour les variables d'environnement

Une fois les deux domaines actifs en HTTPS :

### Backend (`jana-backend`)

```bash
printf 'CORS_ORIGIN=https://jana-distribution.fr\n' | flyctl secrets import --app jana-backend
printf 'FRONTEND_URL=https://jana-distribution.fr\n' | flyctl secrets import --app jana-backend
```

(Voir `docs/deploiement/DEPLOY-FLYIO.md` §4 pour la logique — préférer `import`
via stdin à un argument de commande en clair.)

### Frontend (`jana-frontend`)

`VITE_API_URL` est un **build arg**, pas un secret runtime — modifier
`frontend/fly.toml` :

```toml
[build.args]
  VITE_API_URL = "https://api.jana-distribution.fr/api"
```

Puis redéployer (`cd frontend && flyctl deploy`, voir `docs/deploiement/DEPLOY-FLYIO.md`
§2) — un build arg n'est pris en compte qu'au moment du build de l'image, un simple
redémarrage ne suffit pas.

---

## 6. Checklist de vérification finale

- [ ] `curl -I https://jana-distribution.fr` → `200 OK` (ou redirection propre)
- [ ] `curl https://api.jana-distribution.fr/api/health` → `{"success":true,...,"services":{"database":"up"}}`
- [ ] Connexion sur le site en HTTPS, une action qui appelle l'API (catalogue, connexion) fonctionne
- [ ] Déclencher un email (mot de passe oublié) et vérifier que les liens pointent vers `https://jana-distribution.fr`, pas vers `jana-frontend.fly.dev`
- [ ] Les anciennes URLs `*.fly.dev` restent fonctionnelles en parallèle (Fly ne les désactive pas) — pratique pour debug, mais penser à mettre à jour tout lien externe (release GitHub, README, favoris) vers le nouveau domaine
