# Handoff — Refonte UX/UI Jana Distribution

## Vue d'ensemble
Refonte complète du site e-commerce **Jana Distribution** (grossiste alimentaire multi-rayons, Rungis, livraison Île-de-France) : côté client public + back-office administrateur, en desktop 1440 px et mobile 390 px.

Repo cible : `Neruaka/JanaDistribution`, branche `main`. Front actuel : React + Vite + Tailwind (`frontend/`).

## À propos des fichiers de design
Les fichiers `.dc.html` de ce dossier sont des **références de design en HTML** — des prototypes qui montrent l'apparence et le comportement attendus. **Ce n'est pas du code de production à copier tel quel.** La tâche est de **recréer ces écrans dans l'environnement existant du dépôt** (React + Tailwind), avec ses conventions, ses composants et son routing actuels.

Ils s'ouvrent directement dans un navigateur (ils chargent `support.js`, présent dans ce dossier).

## Fidélité
**Haute fidélité (hifi).** Couleurs, typographies, espacements et tailles sont définitifs. À reproduire au pixel près, en les traduisant dans le thème Tailwind du projet plutôt qu'en dupliquant des styles inline.

---

## Design tokens

### Couleurs
| Rôle | Hex | Usage |
| --- | --- | --- |
| `green-700` **primaire** | `#1E7A46` | boutons principaux, liens, accents, jauges de stock OK |
| `green-800` hover | `#155C34` | hover des liens et boutons primaires |
| `ink-900` **encre** | `#10231A` | fonds sombres (barre utilitaire, hero, sidebar admin, footer), titres |
| `ink-800` | `#152A20` | cartes sur fond sombre |
| `ink-700` | `#1C3A2C` | pastilles sur fond sombre |
| `ink-600` | `#22402F` | bordures sur fond sombre |
| `ink-500` | `#38584A` | bordures de boutons secondaires sur fond sombre |
| texte sombre 1 | `#28352E` | nav rayons |
| texte sombre 2 | `#3D4A43` | corps de texte |
| texte gris | `#5E6B63` | labels de formulaire |
| texte gris clair | `#6B7A72` | métadonnées |
| texte gris très clair | `#7C8981` / `#8D978F` | références mono, sous-titres |
| placeholder | `#9AA69F` / `#8B968F` | champs vides |
| sur fond sombre | `#B9CCC1` (texte), `#8FA89B` (secondaire), `#7E9C8D` / `#6B8779` (tertiaire), `#6FBF8E` / `#8FD8A9` (accent clair), `#CDEBD8` (pastille) | |
| `sand-50` **fond de page** | `#F6F4EE` | fond des écrans |
| `sand-100` | `#FAF9F5` | en-têtes de tableau, zones inertes |
| `sand-150` | `#F4F2EC` / `#F2F1EC` | champs de recherche mobile, pastilles neutres |
| `sand-200` bordure | `#E6E3DA` | bordure de carte standard |
| `sand-250` | `#E0DDD3` / `#DDD9CE` | bordure de champ / bouton secondaire |
| `sand-300` | `#EDEAE1` / `#EFEDE6` | séparateurs, pistes de jauge |
| séparateur léger | `#F0EEE7` / `#F4F2EC` | lignes de tableau |
| fond du canevas | `#EAE7DE` | fond derrière les maquettes (hors app) |
| succès (fond / texte / bordure) | `#EAF3EC` / `#155C34` / `#CBE2D3` | statuts positifs, filtres actifs, sélection légère |
| sélection forte | `#F4FAF6` + bordure `1.5px #1E7A46` | option choisie (adresse, créneau, paiement) |
| avertissement | `#FBF4E4` / `#8A5A16` — variante `#FBF1E4` + bordure `#EBD8BC` | « En attente », stock bas, labels origine |
| danger | `#FBEDE9` / `#9A3A2E` — bordure `#E7CFCF` | « Annulée », bloqué, déconnexion |
| neutre (statut) | `#F2F1EC` / `#3D4A43` | « Livrée », « Masquée » |
| type client pro | `#F0EDF7` / `#4A3B7A` | badge « Pro » |
| type particulier | `#EDF1F5` / `#2F4A63` | badge « Particulier » |
| jauges stock | `#1E7A46` (ok) · `#C88A2E` (moyen) · `#C4523E` (bas) | |
| dégradés camembert rayons | `#1E7A46`, `#4E9E6E`, `#88BFA0`, `#B9D9C6`, `#DCEAE1` | répartition CA |
| barres de graphe | `#9CC9AE` (barres) · `#10231A` (jour courant) — sur fond sombre : `#3D7A55` / `#fff` | |

### Typographie
Google Fonts, poids 400–800 :
- **Archivo** (700 / 800) — titres. `letter-spacing: -0.02em` à `-0.035em`. Tailles : 44 px (hero desktop), 30–31 px (titre de page), 26–27 px, 23 px, 21 px, 19 px, 17 px, 16 px, 15 px.
- **Instrument Sans** (400 / 500 / 600 / 700) — interface et corps. Tailles : 15,5 px (chapô), 14,5 px, 14 px, 13,5 px (référence UI), 13 px, 12,5 px (labels), 12 px, 11,5 px (micro-labels avec `letter-spacing: 0.06em`–`0.14em`, souvent en majuscules).
- **IBM Plex Mono** (400 / 500 / 600) — **tous** les prix, références produit, numéros de commande, quantités, téléphones, KPI chiffrés. Tailles : 34 px (prix fiche), 29 px (KPI), 25–26 px (totaux), 19–21 px, 15 px, 13 px, 11–12 px.

Règle : jamais de prix ni de référence en sans-serif.

### Espacements
Échelle utilisée : 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 26, 28, 34, 36, 40, 44 px.
- Gouttière de page desktop : `40px` (client) / `26px` (admin).
- Gouttière mobile : `16px`.
- Gap de grille produits : `14px` desktop / `10px` mobile.
- Padding de carte : `18–22px` desktop / `13–15px` mobile.

### Rayons
`3px` (micro-pastille) · `4px` (badge) · `5px` (vignette) · `6px` (bouton, champ) · `7px` (bouton mobile) · `8px` (carte) · `9–10px` (carte mobile) · `11–12px` (interrupteur) · `14px` (cadre téléphone) · `16px 16px 0 0` (feuille modale) · `50%` (avatar).

### Ombres
- Carte d'écran (maquette uniquement) : `0 18px 40px rgba(16,35,26,0.08)`.
- Modal : `0 30px 70px rgba(16,35,26,0.35)`.
- Voile modal : `rgba(16,35,26,0.55)` (desktop) / `rgba(16,35,26,0.45)` (feuille mobile).
- **Aucune ombre sur les cartes de contenu** : elles sont délimitées par `1px solid #E6E3DA`.

### Bordures
- Carte : `1px solid #E6E3DA`.
- Champ : `1px solid #DDD9CE` (ou `#E0DDD3`).
- Option sélectionnée : `1.5px solid #1E7A46`.
- Zone de dépôt : `1px dashed #D6D2C6`.
- Barre de recherche desktop : `1.5px solid #10231A`.

### Hauteurs de contrôle
CTA principal desktop `50px` · mobile `52px` · bouton secondaire `42–44px` · champ `42–48px` · bouton de barre d'outils admin `38px` · stepper de quantité `36–38px` (grille) / `50px` (fiche produit). **Aucune cible tactile mobile sous 40px, CTA à 48–52px.**

---

## Principes de la refonte (le « pourquoi »)
1. **Le vert n'est plus un aplat de fond généralisé** : fond neutre chaud (`#F6F4EE`), vert réservé aux actions et aux accents, encre `#10231A` pour les zones sombres.
2. **Densité marchande** : 5 produits par ligne desktop (4 en catalogue avec filtres), 2 en mobile ; ajout au panier directement depuis la carte, avec stepper.
3. **Prix HT par défaut**, TTC en second niveau, bascule HT/TTC dans la barre utilitaire (cible mixte pros / particuliers, mêmes prix pour tous).
4. **Le mono porte les chiffres** : c'est ce qui donne le ton « grossiste » plutôt que « projet étudiant ».
5. **Pas de paiement en ligne** : le tunnel produit un devis, réglé à la livraison. Le message est explicite à chaque étape.
6. **Livraison uniquement** (pas de retrait entrepôt), créneaux confirmés par téléphone.
7. **Photos réelles à venir** : tous les emplacements image sont des placeholders rayés (`repeating-linear-gradient(135deg,#F1EFE9 0 8px,#E7E4DC 8px 16px)`) avec la taille attendue en légende mono. **À remplacer par de vraies photos, pas par des emojis.**
8. **Pas d'emoji** dans l'interface.

---

## Écrans — côté client (desktop 1440)
Fichier : `Jana Distribution - Refonte.dc.html`

### En-tête global (`JanaHeader.dc.html`)
Trois bandes :
1. **Barre utilitaire** — fond `#10231A`, hauteur `38px`, texte `12,5px` `#9FB8AA` : promesses (livraison 24–48 h, minimum 50 € HT), téléphone en mono, lien aide, bascule **HT / TTC** (segment `#1C3A2C`, actif `#F6F4EE` sur texte `#10231A`).
2. **Barre principale** — fond blanc, padding `18px 40px`, bordure basse `#E6E3DA` : logo (carré `34px` radius `7px` fond `#1E7A46` lettre « J » Archivo 800 + « JANA » 19px / « DISTRIBUTION » 9,5px `letter-spacing:0.22em`), **recherche scopée** (`44px`, bordure `1.5px #10231A`, radius `6px` : sélecteur « Tout le catalogue » sur fond `#F6F4EE`, champ, bouton « Rechercher » sur `#10231A`), puis « Mes commandes », « Mon compte » (avec « Bonjour, <prénom> » en 11px au-dessus), et le **panier** (`#1E7A46`, `44px`, radius `6px`) affichant nombre d'articles en pastille et total mono.
3. **Nav rayons** — hauteur `46px`, bouton « ☰ Rayons » sur `#10231A`, 7 rayons en `13,5px`, « Promotions » en `#A8501A` gras, et à droite un lien vert.

### Pied de page global (`JanaFooter.dc.html`)
Fond `#10231A`, grille `1.4fr 1fr 1fr 1fr 1.2fr`, padding `48px 40px 26px` : bloc marque + agréments (CE, HACCP) en mono encadré, colonnes Acheter / Mon compte / Infos, bloc service client (téléphone `18px` mono, horaires, encart « Prochaine tournée » sur `#17301F`), barre légale finale séparée par `1px solid #22402F`.

### 01 — Accueil
- **Hero** : fond `#10231A`, grille `1.25fr 1fr`, padding `34px 40px`. À gauche : surtitre mono `11,5px` `#6FBF8E`, H1 Archivo 44px/1.04 « Le prix de gros, sans carte de grossiste. », chapô, 2 CTA (plein `#1E7A46` / contour `#38584A`), et 4 statistiques en mono (1 240 références · 24–48 h · 50 € · 6 h–18 h) séparées par une règle `#22402F`.
- À droite, **carte « Votre dernière commande »** (fond blanc, radius `10px`) : numéro mono, date + total, aperçu de 3 lignes avec vignettes `34px` + « + 11 autres références », CTA vert « Tout remettre au panier » et bouton contour « Détail ». **Visible uniquement si l'utilisateur est connecté ET a déjà commandé** ; sinon masquer le bloc (le hero passe alors en pleine largeur).
- **Rail rayons** : 8 cartes égales sur fond blanc, vignette `52px`, nom `13px` 600, compteur mono.
- **Les plus commandés** : grille 5 colonnes, cartes produit (voir ci-dessous), lien « Tout voir ».
- **Deux encarts** 50/50 : offre de la semaine (fond `#1E7A46`) et compte professionnel (blanc, surtitre `#A8501A`).

### Carte produit (motif réutilisé partout)
Fond blanc, bordure `#E6E3DA`, radius `8px`, colonne flex :
1. Image `150px` (168px en catalogue) placeholder rayé, légende mono `9,5px` en bas à gauche, **badge** en haut à gauche (`#10231A`, texte blanc `10px`, `letter-spacing:0.06em`, radius `3px`).
2. Corps `12–13px 13–14px` : référence mono `10,5px` `#8D978F` → nom `14–14,5px` 600 → sous-titre (conditionnement + origine) `12px` `#6B7A72` → **prix mono `19–20px` 600** + unité `12px` → prix secondaire (TTC) `11,5px` `#8D978F` → point de stock (disque `6px` `#1E7A46` + libellé `11,5px`) → ligne d'action : stepper (`36–38px`, bordure `#E0DDD3`, « – / valeur mono / + ») + bouton « Ajouter » vert en `flex:1`.

### 02 — Catalogue & filtres
- Barre de titre blanche : fil d'Ariane `12,5px`, H2 `29px`, compteur mono + « prix affichés HT », tri en dropdown `38px`, bascule Grille/Liste (segment, actif `#10231A`).
- Grille `262px 1fr`, gap `22px`.
- **Colonne filtres** : carte « Filtres actifs » (pastilles `#EAF3EC` / bordure `#CBE2D3` / texte `#155C34` avec ✕, lien « Tout effacer ») puis carte des groupes (Sous-rayon, Labels, Conditionnement, Disponibilité) — case `15px` bordure `1.5px #CFCBC0`, libellé `13px`, compteur mono `11,5px` à droite — puis bornes de prix HT.
- **Résultats** : grille 4 colonnes + barre de pagination (compteur « Affichage de 1–24 sur 218 références », pages `34px`, active `#10231A`).

### 03 — Fiche produit
Grille `1fr 430px`, gap `36px`.
- **Galerie** : 4 vignettes `84px` en colonne (active bordure `2px #10231A`, dernière « +3 ») + image principale `450px`.
- **Onglets** : Description (actif, soulignement `2px #1E7A46`) / Fiche technique / Allergènes & conservation / Livraison. Contenu en `1.3fr 1fr` : paragraphe `14px/1.7` + table de specs (clé `13px` gris / valeur `13px` 500, séparateurs `#F0EEE7`) : Référence, Conditionnement, Calibre, Origine, Conservation, DLC moyenne, Colis/palette, TVA.
- **Colonne d'achat** : badges labels (BIO — FR-BIO-01 vert, ORIGINE FRANCE ambre), H2 `31px`, ligne mono `FRL-114 · Val de Loire · Cat. I`, puis carte blanche : **prix mono 34px** + « HT / colis », ligne « soit … la pièce · … TTC (TVA 5,5 %) », **table de tarifs dégressifs** (en-tête `#FAF9F5` « TARIF DÉGRESSIF », 3 paliers), état de stock vert + délai d'expédition, stepper `50px` + CTA « Ajouter au panier — 28,80 € HT », deux boutons secondaires (« Ajouter à une liste », « Commande récurrente »). Sous la carte : 3 réassurances à coche verte.
- **« Souvent commandé avec »** : 5 cartes compactes (image `130px`, bouton « Ajouter » en `#EAF3EC` / `#155C34`).

### 04 — Panier
Grille `1fr 380px`.
- Titre « Mon panier » + compteur en gris, lien retour.
- **Barre de franco** : libellé « Plus que 43,80 € HT pour la livraison offerte », piste `6px` `#EDEAE1` remplie à 71 % en `#1E7A46`, ratio mono `105,20 / 149,00 € HT`.
- **Tableau de lignes** : colonnes `64px 1fr 130px 150px 110px 40px`, en-tête `#FAF9F5` en micro-caps `11,5px`. Chaque ligne : vignette `64px`, référence mono + nom 600 + conditionnement, prix unitaire mono + unité, stepper `118px`, total mono `15px` aligné à droite, ✕ `#B0B8B3`. Pied : « Vider le panier » (gris) / « Enregistrer comme liste récurrente » (vert).
- **« Complétez votre commande »** : 4 mini-cartes horizontales (vignette `52px`, nom, prix mono, « + Ajouter » vert).
- **Colonne droite** : récapitulatif (Sous-total HT 105,20 € · TVA 5,5 % 5,79 € · Livraison 9,90 € · **Total TTC 120,89 €** en mono `26px`), CTA « Valider ma commande », champ code promo ; puis carte **LIVRAISON** avec l'unique option sélectionnée (samedi, créneau, franco). *Pas d'option retrait.*

### 05 — Checkout (devis, sans paiement en ligne)
En-tête dédié (logo + fil d'étapes « 1. Panier — 2. Livraison & paiement — 3. Confirmation » + téléphone). Grille `1fr 380px`.
- Bandeau vert d'explication : **« Commande sans paiement en ligne »** → devis par email, confirmation téléphonique, règlement à la livraison.
- Cartes successives : **Coordonnées** (4 champs, raison sociale optionnelle) · **Adresse de livraison** (2 cartes sélectionnables, case « facturation identique ») · **Créneau de livraison** (4 créneaux en grille, mention « confirmé par téléphone ») · **Règlement à la livraison** (Carte bancaire / Espèces / Chèque / Virement, avec précision sous chaque option ; aucun débit immédiat) + zone d'instructions.
- **Colonne droite** : lignes de commande compactes, totaux, case CGV, CTA **« Recevoir mon devis »**, mention « Sans engagement ».

### 06 — Connexion / Inscription
Deux moitiés plein écran (`min-height:720px`).
- Gauche (blanc) : logo, H2 `32px` « Se connecter », email, mot de passe (`letter-spacing:0.18em` pour les points), case « Rester connecté », CTA, lien création de compte, et deux boutons de démo (admin / client).
- Droite (`#10231A`) : surtitre mono, H3 `30px` « Particulier ou professionnel, les mêmes prix. », **liste de 4 arguments numérotés** (cartes `#152A20` séparées de `1px`), 2 CTA (Compte particulier / Compte professionnel), mention SIRET.

### 07 — Confirmation de commande
Bandeau `#10231A` avec pastille de succès `52px`, H2 `30px`, numéro de devis en mono, deux CTA (Devis PDF / Suivre ma commande). Puis : carte **« Ce qui se passe maintenant »** (4 étapes en colonnes avec barre de progression `4px`), récapitulatif de lignes + totaux avec pied `#FAF9F5` « Total à régler à la livraison », et colonne droite (livraison, règlement prévu, encart vert « Une modification ? »).

### 08 — Mes commandes
Grille `238px 1fr`. Colonne de navigation de compte (6 entrées, active `#10231A` blanche). Contenu : titre + cumul 12 mois, 3 filtres dropdown + bouton Exporter, **tableau** `190px 1fr 110px 90px 120px 250px` : numéro mono, contenu, date, nb articles mono, total mono, puis statut (pastille) + actions « Recommander » (vert clair) et « Détail » (contour). Pagination.

### 09 — Détail d'une commande
Lien retour, carte d'en-tête (numéro mono `24px` + pastille de statut, dates, boutons Devis PDF / Facture / **Recommander**), carte **Suivi** en 5 colonnes (barre `4px` verte si franchie, `#E4E1D8` sinon), tableau de lignes `56px 1fr 120px 80px 110px`, et colonne droite (totaux, adresse, règlement).

### 10 — Mon compte
Même navigation `238px`. Carte d'identité (avatar `56px` `#EAF3EC` initiales `#155C34`, nom `20px`, email + ancienneté, 3 statistiques mono séparées par une règle), formulaire **Informations personnelles** (email non modifiable sur `#FAF9F5`), **Adresses de livraison** (3 colonnes dont une carte pointillée « + Nouvelle adresse », badge « Par défaut »), **Préférences** (3 interrupteurs `38×22px`, bouton `16px`, actif `#1E7A46` translation `left:19px`).

---

## Écrans — back-office (desktop 1440)
Fichier : `Jana Admin - Refonte.dc.html`

### Sidebar (`JanaAdminSidebar.dc.html`)
`236px`, pleine hauteur, fond `#10231A`, padding `18px 14px`. Logo « JANA / BACK-OFFICE », section « PILOTAGE » (`10,5px`, `letter-spacing:0.14em`, `#4E6B5C`), 6 entrées — **Dashboard, Commandes (3), Produits (1 240), Catégories (12), Clients (418), Paramètres** — item actif `#1E7A46` texte blanc 600, inactif `#B9CCC1`, compteur mono à droite. Pied : avatar `32px`, nom + rôle, icône de déconnexion.

### Barre supérieure (commune)
Fond blanc, padding `14px 26px`, bordure basse : recherche `38px` (max `420px`), puis à droite les actions contextuelles (`38px`, contour `#E0DDD3` ou plein `#1E7A46`).

### A1 — Dashboard
Titre + période comparée. **4 KPI** (CA HT 38 420 € · Commandes 142 · Panier moyen 270,56 € · Nouveaux clients 26) : valeur mono `29px`, delta en pastille verte ou rouge + comparatif. **Bandeau « À traiter aujourd'hui »** : 4 compteurs mono `20px` séparés par des règles + CTA « Ouvrir la file de traitement ». Ligne `1.55fr 1fr` : **histogramme CA** (30 barres `#9CC9AE`, dernière `#10231A`, hauteur `210px`, axe de dates mono) et **répartition par rayon** (barre empilée `12px` + légende avec CA mono et pourcentage). Ligne suivante : **Dernières commandes** (colonnes `170px minmax(0,1fr) 62px 92px 104px`, client tronqué en ellipse) et **Stock sous le seuil** (7 réf., ratio mono coloré par gravité).

### A2 — Commandes
Barre d'outils : recherche + « Exporter CSV » *(pas de bouton « Créer une commande » : les commandes viennent des clients)*. **Rail de statuts** en 6 cellules égales (libellé + compteur mono `22px`, cellule active teintée `#FDFBF5`). **Tableau** `30px 180px 1fr 130px 80px 120px 140px 90px` avec cases à cocher, numéro mono, client + email, date+heure, articles, total, pastille de statut, action contextuelle en vert (« Confirmer », « Préparer », « Facturer », « Archiver »).

### A3 — Traitement d'une commande
En-tête : retour, numéro mono, pastille « En attente », actions (Imprimer bon de préparation / **Annuler** en rouge contour / **Confirmer la commande** en vert). Grille `1fr 340px`.
- **Avancement** : 5 colonnes avec barre `4px`.
- **Lignes de commande** : `52px 1fr 110px 90px 100px 110px`, colonne **stock** colorée (vert / ambre) pour repérer les ruptures avant confirmation ; pied `#FAF9F5` avec Sous-total / TVA / Livraison / **Total TTC** alignés à droite.
- **Journal** : horodatage mono `110px` + événement, puis champ de note interne.
- Colonne droite : **Client** (+ lien fiche), **Livraison** (créneau, adresse, instructions), **Règlement** (mode prévu, date d'envoi du devis, boutons « Renvoyer le devis » / « Facturer »).

### A4 — Produits
Barre d'outils : recherche, Importer .xlsx, Exporter, **+ Nouveau produit**. Titre + compteurs (1 240 réf., 7 sous le seuil, 18 inactives), 3 filtres dropdown. **Barre d'actions de masse** (`#EAF3EC`) quand une sélection existe : « 3 produits sélectionnés » + Changer de rayon / Appliquer une remise / Désactiver. **Tableau** `30px 60px 1fr 150px 120px 150px 110px 90px` : case, vignette `44px`, nom + référence mono, rayon, prix mono, **jauge de stock** (piste `5px`, remplissage coloré + valeur mono), statut, « Voir · Éditer ». Pagination.

### A5 — Fiche produit (édition)
En-tête : retour, « Nouveau produit », mention brouillon auto, actions (Aperçu / Enregistrer en brouillon / **Publier**). Grille `1fr 330px`.
- **Identité** : référence interne (mono, `max-width:340px`) — *pas de code EAN* —, nom, rayon + sous-rayon, description (`96px`).
- **Prix, conditionnement et stock** : 4 + 4 champs (Prix HT, TVA, Unité de vente, Contenu du colis / Stock, Seuil d'alerte, Origine, Conservation) puis **table de tarifs dégressifs** éditable (en-tête `#FAF9F5` + « + Ajouter un palier », lignes `1fr 1fr 60px` avec ✕).
- **Labels et certifications** : pastilles sélectionnables (Bio actif en vert, Promo en ambre).
- Colonne droite : **Visibilité** (2 interrupteurs : Produit actif, Mis en avant), **Photos** (zone pointillée `150px` + 4 vignettes `56px`, la première bordée `2px #1E7A46`), **Référencement** (slug mono, titre méta).

### A6 — Catégories
Liste pleine largeur, sous-titre « Glissez pour réordonner — l'ordre est repris dans la navigation du site ». Chaque ligne : poignée `⠿` `#C3CBC6`, vignette `38px`, nom + slug mono, nb de sous-rayons, nb de références mono, pastille Visible/Masquée, `⋯`.
**Création via modal** (le formulaire n'est pas un panneau latéral) : voile `rgba(16,35,26,0.55)`, boîte `520px` radius `10px`, en-tête (titre `18px` + sous-titre + ✕) et corps `22px` : Nom, Description, zone de dépôt du visuel `96px`, interrupteur « Visible sur le site », boutons Annuler / **Créer**.

### A7 — Clients
Titre + compteurs. 4 KPI (Comptes actifs 418, Professionnels 96, En attente de validation 12, CA moyen 1 184 €). **Tableau** `1fr 220px 130px 110px 130px 120px 80px` : avatar initiales `34px` + nom + société, email + téléphone mono, **type** (pastille violette « Pro » / bleue « Particulier »), commandes, CA mono, statut (Actif / SIRET à valider / Bloqué), `⋯`.

### A8 — Paramètres
Grille `250px 1fr` : navigation d'onglets (Informations générales actif, Livraison, Commandes & devis, TVA & facturation, Emails, Utilisateurs & rôles, Sécurité) et contenu : **Identité de l'entreprise**, **Livraison** (Commande minimum HT 50 €, Franco 149 €, Frais 9,90 € + table de créneaux avec interrupteurs par jour), **Emails transactionnels** (4 lignes avec interrupteur + « Modifier le modèle »).

---

## Écrans — mobile (390 × 844)
Fichier : `Jana Mobile - Refonte.dc.html` — trois groupes : `3a` parcours d'achat (7 écrans), `3b` après-vente (4), `3c` back-office (4).

### Patterns mobiles
- **Barre d'onglets client** fixe en bas : fond blanc, bordure haute `#E6E3DA`, padding `9px 8px 14px`, 5 onglets (Accueil, Rayons, Recherche, Panier, Compte) — carré `20px` en guise d'icône (à remplacer par les icônes réelles), libellé `10,5px`, actif `#1E7A46` 600, inactif `#9AA69F`.
- **Barre d'onglets admin** : identique mais fond `#10231A`, actif `#8FD8A9`, inactif `#6B8779`, onglets Bord / Commandes / Produits / Clients / Réglages.
- **En-tête sombre** sur l'accueil et le dashboard admin ; en-têtes blancs avec `←` ailleurs.
- **Barre d'action collée en bas** (`margin-top:auto` + bordure haute) pour fiche produit, panier, checkout, confirmation, détail, traitement admin : elle contient le total et le CTA.
- **Chips horizontales** (`border-radius:16px`) pour filtres et statuts, avec débordement horizontal masqué.
- **Tableaux → cartes** côté admin : une carte par commande / produit, avec l'action principale en pleine largeur.

### 3a
- **M1 Accueil** : en-tête sombre (heure + promesse, ☰, logo, bascule HT, panier), recherche blanche `44px` ; carte « Votre dernière commande » (aperçu de 4 vignettes `44px`, CTA vert `46px`) ; rayons en grille 2×3 ; top ventes en grille 2 colonnes (image `120px`, CTA « Ajouter » `40px`) ; encart offre `#1E7A46`.
- **M2 Catalogue** : en-tête `←` + champ de rayon + `⌕`, chips « Filtres · 3 » (fond `#10231A`) puis filtres actifs, ligne compteur + tri, grille 2 colonnes (image `130px`), bouton « Charger 24 références de plus ».
- **M3 Filtres (feuille)** : contenu de fond atténué (`opacity:0.35`) + voile, feuille `border-radius:16px 16px 0 0`, `max-height:620px`, poignée `38×4px`, en-tête « Filtrer » + « Tout effacer », **corps `flex:1; min-height:0; overflow:hidden`** (important : sinon le pied dépasse), groupes de chips, bornes de prix, pied fixe « Réinitialiser » / « Voir les 218 réf. » (`48px`).
- **M4 Fiche produit** : image `300px` avec boutons ronds `36px` en surimpression et pagination de galerie ; bloc blanc (badges, H2 `23px`, référence mono, **prix mono 28px**, stock, tarifs dégressifs) ; bloc onglets + description + specs ; barre d'achat collée (stepper `50px` + « Ajouter · 28,80 € HT »).
- **M5 Panier** : en-tête `←` + compteurs, barre de franco, lignes en cartes (vignette `62px`, ✕ en haut à droite, stepper `36px` + total mono), bloc **LIVRAISON** (option unique sélectionnée), bloc de totaux, barre collée (Total TTC mono `23px` + CTA `52px`).
- **M6 Checkout** : progression en 3 segments `4px` + « Étape 2 sur 3 », bandeau vert « Aucun paiement en ligne », cartes récapitulatives modifiables (Coordonnées, Adresse), créneaux 2×2, modes de règlement 2×2, totaux + case CGV, barre collée « Recevoir mon devis ».
- **M7 Connexion** : en-tête sombre avec accroche `26px`, segment « Se connecter / Créer un compte », champs `50px`, CTA `52px`, et bas de page avec 3 arguments numérotés sur `#EDEAE1`.

### 3b
- **M8 Confirmation** : bandeau sombre + pastille `46px`, étapes numérotées en liste, récapitulatif avec pied `#FAF9F5`, blocs livraison/règlement, encart vert « Une modification ? », barre collée (Devis PDF / Suivre ma commande).
- **M9 Mes commandes** : chips de statut, une carte par commande (numéro mono + pastille, date + nb réf., contenu résumé, total mono `16px`, boutons « Détail » et « Recommander »).
- **M10 Détail** : en-tête avec numéro mono + pastille, **suivi vertical** (disque `10px`, étape courante en gras `#10231A`, étapes futures `#9AA69F`), lignes, totaux, livraison, barre collée (Facture / Recommander).
- **M11 Mon compte** : en-tête sombre avec avatar `52px` + 3 tuiles de statistiques `#152A20`, menu de compte en liste (6 entrées avec description et `›`), préférences (interrupteurs `40×24px`), bouton « Se déconnecter » en `#9A3A2E`.

### 3c
- **AM1 Dashboard** : en-tête sombre (logo, période, avatar) + carte CA (`#152A20`) avec valeur mono `26px`, delta, mini-histogramme `56px` ; KPI 2×2 ; « À traiter aujourd'hui » en liste cliquable ; répartition par rayon (barre `10px` + légende) ; stock sous le seuil.
- **AM2 Commandes** : titre + Exporter, recherche, chips de statut, une carte par commande avec **action principale en pleine largeur** (« Confirmer la commande » en vert plein, actions secondaires en teinte claire).
- **AM3 Traitement** : en-tête numéro + pastille, avancement vertical, carte Client avec boutons « Appeler » / « Fiche client », lignes avec disponibilité colorée, livraison + instructions, barre collée (Annuler contour rouge + Confirmer vert).
- **AM4 Produits** : titre + « + Nouveau », recherche, chips de filtre, cartes produit horizontales (vignette `58px`, nom + statut, référence + rayon mono, prix mono + jauge + stock).

---

## Interactions et comportement
- **Bascule HT / TTC** (barre utilitaire desktop, pastille mobile) : recalcule tous les prix affichés et l'unité (« HT / colis » ↔ « TTC / colis »), y compris le prix secondaire. Persister le choix par utilisateur.
- **Ajout au panier depuis une carte** : stepper local puis ajout ; le compteur et le total de l'en-tête se mettent à jour, ainsi que la barre de franco.
- **Barre de franco** : `min(100%, sousTotalHT / 149)`. Le message disparaît une fois le franco atteint (remplacé par « Livraison offerte »).
- **Recommander** (accueil, mes commandes, détail) : ajoute toutes les lignes disponibles au panier, signale celles en rupture.
- **Filtres catalogue** : desktop = colonne persistante avec compteurs ; mobile = feuille modale, application au tap sur « Voir les N réf. ». Les filtres actifs se retirent au tap sur le ✕ de leur pastille.
- **Tarifs dégressifs** : le palier applicable se met en évidence selon la quantité choisie et le CTA affiche le total recalculé.
- **Checkout** : validation → génération du devis PDF + email, redirection vers la confirmation. Aucun appel de paiement.
- **Admin — confirmation de commande** : vérifier la disponibilité des lignes (colonne stock) puis passage de statut ; chaque changement écrit une entrée dans le **journal**.
- **États à prévoir partout** : chargement (squelettes aux dimensions des cartes), vide (panier vide, aucun résultat de filtre, aucune commande), erreur (bandeau `#FBEDE9` / `#9A3A2E`), désactivé (`opacity` réduite, pas de changement de couleur).
- **Hover** : cartes → bordure `#DDD9CE` ; boutons verts → `#155C34` ; lignes de tableau → `#FAF9F5` ; liens → `#155C34`.

## État applicatif
- Session : utilisateur, rôle (client / admin), `hasOrders` (pilote l'affichage du bloc « dernière commande »).
- Préférence d'affichage : `priceMode` (`HT` | `TTC`).
- Panier : lignes (référence, quantité), sous-total HT, TVA, livraison, total TTC.
- Catalogue : filtres actifs, tri, pagination.
- Checkout : adresse choisie, créneau, mode de règlement prévu, acceptation CGV.
- Admin : filtres de liste, sélection multiple (actions de masse), statut courant d'une commande, journal.

## Assets
Aucun visuel définitif. Tous les emplacements image sont des **placeholders rayés** avec la taille attendue :
- Photo produit : `1200 × 1200`, fond neutre.
- Visuel de rayon / catégorie : `1200 × 600`.
- Vignettes de galerie : dérivées de la photo produit.
Le logo est typographique (carré vert + « J » Archivo 800) — à remplacer par le logo réel s'il existe. Polices via Google Fonts (Archivo, Instrument Sans, IBM Plex Mono). Icônes : aucune bibliothèque imposée, les carrés `20px` de la barre d'onglets mobile sont des emplacements.

## Fichiers de ce dossier
| Fichier | Contenu |
| --- | --- |
| `Jana Distribution - Refonte.dc.html` | 10 écrans client desktop |
| `Jana Admin - Refonte.dc.html` | 8 écrans back-office desktop |
| `Jana Mobile - Refonte.dc.html` | 15 écrans mobile (client + admin) |
| `JanaHeader.dc.html` | en-tête client desktop |
| `JanaFooter.dc.html` | pied de page client desktop |
| `JanaAdminSidebar.dc.html` | sidebar back-office |
| `support.js` | runtime nécessaire pour ouvrir les fichiers dans un navigateur |

## Correspondance avec le dépôt
| Écran | Fichiers à reprendre |
| --- | --- |
| Accueil | `frontend/src/pages/HomePage.jsx`, `frontend/src/components/PublicLayout.jsx` |
| Catalogue | `frontend/src/pages/CataloguePage.jsx` |
| Fiche produit | `frontend/src/pages/ProductDetailPage.jsx` |
| Panier | `frontend/src/pages/CartPage.jsx`, `frontend/src/components/CartDrawer.jsx` |
| Checkout / confirmation | `frontend/src/pages/CheckoutPage.jsx` |
| Connexion / Inscription | `frontend/src/pages/LoginPage.jsx`, `frontend/src/pages/RegisterPage.jsx` |
| Compte, commandes | pages compte client |
| Back-office | pages et layout admin (sidebar) |
| Thème | `frontend/tailwind.config.js`, `frontend/src/index.css` |

## Ordre d'implémentation suggéré
1. Thème Tailwind (couleurs, familles de polices, rayons) + reset et styles de liens.
2. `PublicLayout` : en-tête 3 bandes + pied de page.
3. Composant `ProductCard` (utilisé par accueil, catalogue, fiche, panier).
4. Accueil → Catalogue → Fiche produit.
5. Panier → Checkout → Confirmation.
6. Compte (commandes, détail, informations).
7. Layout admin (sidebar + barre supérieure) puis Dashboard → Commandes → Traitement → Produits → Édition → Catégories → Clients → Paramètres.
8. Mobile : les écrans mobiles sont la version responsive des mêmes routes — pas des pages séparées.
