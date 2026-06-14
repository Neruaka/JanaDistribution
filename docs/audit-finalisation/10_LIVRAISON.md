# 10 — Stratégie de Livraison

---

## État actuel

La livraison est **partiellement implémentée** avec deux modes disponibles :

### Mode FIXE (actif par défaut)

```
Frais fixes depuis configuration :
- livraison_frais_standard : 5.90 € (valeur init.sql)
- livraison_seuil_franco : 50 € (valeur init.sql)

Si totalTTC >= seuil_franco → frais = 0
Sinon → frais = frais_standard
```

### Mode DISTANCE (disponible mais non activé par défaut)

```
- Géocodage adresse livraison via BAN (adresse.data.gouv.fr)
- Géocodage adresse entreprise (mis en cache dans configuration)
- Calcul Haversine (distance vol d'oiseau)
- frais = frais_base + (distance_km × prix_par_km)
- Si distance > distance_max_km → commande refusée (hors zone)
- Si totalTTC >= seuil_franco → frais = 0 (priorité franco)
```

**Activation** : Modifier `livraison_mode_calcul` dans la table `configuration` de `FIXE` à `DISTANCE`.

### Ce qui fonctionne

- Calcul côté serveur uniquement (valeur client ignorée)
- Frais affichés en temps réel dans le checkout via `estimateShipping`
- Blocage commande si adresse hors zone
- Franco de port fonctionnel
- Paramètres modifiables depuis l'administration

---

## Tableau comparatif des stratégies

| Stratégie | Avantages | Inconvénients | Complexité tech | Impact commercial | Données nécessaires |
|---|---|---|---|---|---|
| **Frais fixes** | Simple, prévisible | Pas adapté aux grandes distances | Faible | Marge réduite sur livraisons proches | Aucune |
| **Franco de port** | Simple à communiquer | Incentive grosses commandes | Faible | Encourage panier moyen haut | Seuil décidé |
| **Frais par distance** (actuel) | Juste selon trajet | Dépend API externe (BAN) | Moyenne | Livraisons proches moins chères | Adresse départ, tarif km |
| **Frais par poids** | Équitable | Poids produits à saisir | Élevée | Cohérent pour produits lourds | Poids de chaque produit |
| **Frais par zone géographique** | Contrôle zones | Complexe à maintenir | Élevée | Zones définies explicitement | Définir zones (dép., CP...) |
| **Combinaison franco + fixe** | Simple et efficace | Perte sur longues distances | Faible | Bon équilibre | Seuil franco |
| **Retrait gratuit** | 0 coût livraison | Requiert point retrait physique | Faible | Dépend localisation entrepôt | Adresse retrait |

**Recommandation actuelle** : Valider le mode DISTANCE si Jana Distribution livre dans un rayon défini, sinon rester sur FIXE+FRANCO qui est le plus simple à maintenir.

---

## Décisions métier nécessaires

> Ces points ne peuvent pas être décidés techniquement — le propriétaire doit répondre.

| Décision | Question | Impact |
|---|---|---|
| Zones de livraison | Livraison France entière ? Région ? Rayon km ? | Mode FIXE vs DISTANCE vs ZONES |
| Seuil franco de port | À quel montant la livraison est-elle offerte ? (actuellement 50€) | Panier moyen |
| Frais de base | Quel est le coût de livraison standard ? (actuellement 5.90€) | Marge |
| Retrait sur place | Proposer retrait gratuit à l'entrepôt ? | Nouvelle option checkout |
| Livraison internationale | France métropolitaine uniquement ? DOM-TOM ? Europe ? | Complexité TVA |
| Transporteur | Colissimo, Chronopost, DPD, Mondial Relay ? | Intégration tracking |
| Produits lourds | Certains produits ont-ils des surcharges ? | Poids à saisir |
| Délais | Délais garantis ou indicatifs ? | Communication client |

---

## Modèle technique recommandé (flexible)

Le modèle actuel avec la table `configuration` est suffisamment flexible pour les modes FIXE et DISTANCE. Pour une gestion par zones ou par poids, une table dédiée serait nécessaire.

### Extension pour zones géographiques (si nécessaire)

```sql
CREATE TABLE livraison_zone (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'DEPARTEMENT',  -- DEPARTEMENT, CODE_POSTAL, REGION
  valeurs TEXT[] NOT NULL,  -- ['75', '92', '93', '94'] pour Île-de-France
  frais DECIMAL(10,2) NOT NULL,
  est_actif BOOLEAN NOT NULL DEFAULT true,
  ordre INTEGER NOT NULL DEFAULT 0  -- Priorité si zones se chevauchent
);
```

### Extension pour poids (si nécessaire)

```sql
-- Ajouter sur la table produit
ALTER TABLE produit ADD COLUMN poids_kg DECIMAL(6,3);

-- Table tranches de poids
CREATE TABLE livraison_tranche_poids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poids_min_kg DECIMAL(6,3) NOT NULL,
  poids_max_kg DECIMAL(6,3) NOT NULL,
  frais DECIMAL(10,2) NOT NULL
);
```

---

## Implémentation actuelle — Points forts

1. Calcul côté serveur uniquement (sécurisé)
2. Estimation en temps réel lors du remplissage du formulaire (UX)
3. Blocage des commandes hors zone (mode DISTANCE)
4. Paramètres modifiables sans redéploiement
5. Cache coordonnées GPS du point de départ

---

## Problèmes identifiés

| ID | Priorité | Problème |
|---|---|---|
| LIV-01 | P1 | Dépendance sur BAN API externe en mode DISTANCE — un timeout peut bloquer la création de commande |
| LIV-02 | P2 | Cache de géocodage en mémoire — perdu à chaque redémarrage |
| LIV-03 | P2 | `livraison_zones` est un champ texte libre, pas de validation par code postal |
| LIV-04 | P3 | Pas de suivi de livraison / numéro de colis |
| LIV-05 | P3 | Délais affichés sont fixes (2-5 jours), pas calculés selon transporteur |

---

## Critères d'acceptation

- [ ] Frais de livraison calculés et validés côté serveur
- [ ] Franco de port fonctionnel et configurable
- [ ] Adresse hors zone bloquée avec message explicite
- [ ] Frais affichés avant validation de la commande
- [ ] Stratégie de livraison décidée par le propriétaire
- [ ] Zones de livraison documentées dans les CGV
- [ ] Délais affichés cohérents avec la réalité transporteur
