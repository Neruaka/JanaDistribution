# CLAUDE_WORKFLOW — Jana Distribution

> Lire ce fichier EN PREMIER au début de toute session travaillant sur Jana Distribution.
> Il définit la méthode de travail. Il ne liste pas les tâches (voir `PLAN_CORRECTION_AUDIT.md`).

---

## 1. Contexte technique minimal

| Couche | Technologie | Version | Note |
|---|---|---|---|
| Frontend | React + Vite | 18.2 / 7.3 | Context API (pas Redux) |
| Styles | TailwindCSS | 3.4 | Pas MUI, pas Chakra |
| Routing | React Router Dom | 6 | |
| Backend | Node.js + Express | ≥18 / 4.18.2 | |
| Base de données | PostgreSQL | 15 | uuid-ossp requis |
| Cache | Redis | 7 | via ioredis (doublon avec `redis` à supprimer) |
| Auth | JWT | jsonwebtoken 9 | access 7j + refresh 30j — non révocables (P1) |
| Email | Brevo REST API | — | Pas nodemailer/SMTP |
| Paiements | Stripe Checkout Sessions | 22.0.2 | côté serveur uniquement |
| Géocodage | BAN API (adresse.data.gouv.fr) | gratuit | pour mode DISTANCE |
| Déploiement | Railway | — | NIXPACKS backend, Dockerfile frontend |
| Tests | Jest (backend) + Vitest (frontend) | — | DB mockée — P1 |

Architecture détaillée : `ETAT_ACTUEL_PROJET.md`
Tâches et corrections : `PLAN_CORRECTION_AUDIT.md`
Audits détaillés : `docs/audit-finalisation/`

---

## 2. Protocole de démarrage de session

```
1. Lire CLAUDE_WORKFLOW.md          (ce fichier — méthode)
2. Lire ETAT_ACTUEL_PROJET.md       (état réel du projet)
3. Lire tableau de bord + phase active dans PLAN_CORRECTION_AUDIT.md
4. Lire uniquement la fiche de la tâche sélectionnée
5. Lire les audits spécialisés liés à cette tâche (liens dans la fiche)
6. Inspecter uniquement les fichiers applicatifs liés à la tâche
7. Vérifier `git status` avant toute modification
```

**Interdit** : relire automatiquement les quinze rapports complets à chaque session.
**Interdit** : démarrer une tâche BLOCKED ou IN_PROGRESS par une autre session.

---

## 3. Lecture sélective — table de référence

| Domaine | Documents à lire | Audit détaillé |
|---|---|---|
| Frontend | `ETAT_ACTUEL_PROJET.md` → fichiers clés | `docs/audit-finalisation/05_AUDIT_FRONTEND.md` |
| Backend / API | `ETAT_ACTUEL_PROJET.md` → points d'entrée | `docs/audit-finalisation/06_AUDIT_BACKEND_BDD.md` |
| Sécurité | `PLAN_CORRECTION_AUDIT.md` phase 0 + 2 | `docs/audit-finalisation/07_AUDIT_SECURITE.md` |
| Stripe | Fiche tâche T4-xx | `docs/audit-finalisation/08_STRIPE_PAIEMENTS.md` |
| Facturation | Fiche tâche T5-xx | `docs/audit-finalisation/09_FACTURATION.md` |
| Livraison | Fiche tâche T3-xx | `docs/audit-finalisation/10_LIVRAISON.md` |
| Railway | Fiche tâche T8-xx | `docs/audit-finalisation/11_RAILWAY_PRODUCTION.md` |
| Tests | Fiche tâche T7-xx | `docs/audit-finalisation/12_STRATEGIE_TESTS.md` |
| Base de données | `ETAT_ACTUEL_PROJET.md` + `backend/scripts/init.sql` | `docs/audit-finalisation/06_AUDIT_BACKEND_BDD.md` |
| Roadmap / priorisation | `PLAN_CORRECTION_AUDIT.md` | `docs/audit-finalisation/13_ROADMAP_FINALISATION.md` |

---

## 4. Cycle d'une tâche

### A — Sélectionner

- Prendre une tâche `READY` dans `PLAN_CORRECTION_AUDIT.md`
- Vérifier ses dépendances (ne pas commencer si un prérequis est `TODO` ou `BLOCKED`)
- Ne travailler que sur une tâche principale à la fois
- Passer la tâche à `IN_PROGRESS` dans le plan

### B — Préanalyse (avant toute modification)

Répondre à ces questions :
1. Quel est l'objectif précis ?
2. Quels sont les critères d'acceptation ?
3. Quels fichiers sont concernés ?
4. Y a-t-il un impact base de données (migration nécessaire) ?
5. Y a-t-il un impact sur l'API (contrat changé) ?
6. Y a-t-il un impact sécurité ?
7. Une décision propriétaire / comptable / juridique est-elle requise ?

Si une décision externe est requise : marquer `BLOCKED`, documenter le blocage, ne pas inventer de règle.

### C — Inspection ciblée

```bash
# Chercher un symbole sans ouvrir tous les fichiers
rg "nomDeLaFonction" backend/src/
rg "nom_table" backend/scripts/

# Lire un fichier ciblé
# Lire les imports réellement utilisés, pas les modules entiers
```

Budget indicatif de départ : **5 à 8 fichiers**. Dépasser uniquement si les dépendances le justifient.

### D — Plan d'implémentation

Avant de coder, produire un plan court :

```
Fichiers à modifier :
Modifications prévues :
Impact base de données :
Impact API :
Impact frontend :
Impact sécurité :
Tests à exécuter :
Rollback si échec :
```

### E — Implémentation

- Changements atomiques, un objectif par modification
- Ne pas refactorer des modules sans rapport avec la tâche
- Ne pas modifier une migration déjà exécutée en production — créer une nouvelle
- Ne pas ajouter une dépendance sans justification dans la fiche tâche
- Ne pas modifier une interface publique sans analyser ses consommateurs (`rg`)

### F — Validation

```bash
# Tests ciblés (backend)
cd backend && npm test -- --testPathPattern="nomDuTest"

# Tests ciblés (frontend)
cd frontend && npm run test -- nomDuTest

# Vérifier qu'aucun secret n'est apparu
git diff | grep -E "sk_live|sk_test|jwt_secret|password|token" -i
```

Comparer le résultat avec les critères d'acceptation de la fiche tâche.

### G — Synchronisation documentaire (obligatoire après chaque tâche)

1. Passer le statut à `DONE` (ou `BLOCKED`) dans `PLAN_CORRECTION_AUDIT.md`
2. Mettre à jour les compteurs du tableau de bord
3. Mettre à jour le domaine concerné dans `ETAT_ACTUEL_PROJET.md`
4. Ajouter une entrée dans le journal récent
5. Mettre à jour la prochaine tâche recommandée
6. Documenter les éventuelles nouvelles dettes ou décisions découvertes
7. Ne modifier `CLAUDE_WORKFLOW.md` que si le processus de travail change

---

## 5. Statuts des tâches

| Statut | Signification |
|---|---|
| `TODO` | Non démarré, dépendances non satisfaites |
| `READY` | Prêt à démarrer — dépendances OK, aucune décision externe requise |
| `IN_PROGRESS` | En cours dans la session active |
| `BLOCKED` | Bloqué par une dépendance externe (décision métier, validation, autre tâche) |
| `DONE` | Code implémenté + critères vérifiés + tests passés + documents mis à jour |
| `CANCELLED` | Annulée (raison documentée) |

Une tâche ne passe à `DONE` que si :
- Le code est implémenté et les critères d'acceptation vérifiés
- Les tests demandés passent (ou sont documentés comme impossibles avec justification)
- `PLAN_CORRECTION_AUDIT.md` et `ETAT_ACTUEL_PROJET.md` sont mis à jour

---

## 6. Règles de gestion des tokens

- Ne pas relire tous les audits à chaque session
- Utiliser `rg` avant d'ouvrir un fichier complet
- Ne pas recopier de gros blocs de documentation dans les réponses
- Charger d'abord les fichiers d'entrée, suivre les dépendances utiles uniquement
- Budget indicatif : 5-8 fichiers applicatifs au démarrage
- Réutiliser les décisions déjà enregistrées dans ce document
- Ne pas redemander une information déjà présente dans les trois fichiers opérationnels
- Arrêter l'analyse si une décision métier est nécessaire → marquer `BLOCKED`

---

## 7. Règles de sécurité absolues

- Ne jamais afficher la valeur d'un secret (`STRIPE_SECRET_KEY`, `JWT_SECRET`, etc.)
- Ne jamais lire ou recopier un fichier `.env` complet
- Ne jamais enregistrer une clé Stripe, un secret JWT, un mot de passe, un token session
- Ne jamais stocker de données bancaires ou personnelles dans les documents
- Ne jamais considérer une redirection frontend comme preuve de paiement
- Toujours vérifier la signature des webhooks Stripe côté serveur
- Toujours recalculer prix, taxes, stock et livraison côté serveur
- Ne jamais exécuter `init.sql` destructif sur une base de production
- Ne jamais exécuter une migration destructive sans sauvegarde préalable
- Ne jamais initier un remboursement sans autorisation admin vérifiée

---

## 8. Règles spécifiques à Jana Distribution

- Conserver Stripe Checkout Sessions (sauf décision explicite contraire)
- Conserver l'architecture `routes → controllers → services → repositories`
- Privilégier une évolution progressive sans réécriture complète
- Utiliser une vraie base PostgreSQL pour les tests d'intégration (pas de mocks)
- Utiliser des migrations versionnées dans `backend/migrations/` (ne pas modifier `init.sql`)
- Rendre les images produits persistantes (S3 / Cloudflare R2 / Railway Volume)
- Générer les factures côté application (PDFKit recommandé)
- Les factures sont immuables après émission — tout correctif = avoir
- Faire valider les règles de TVA et de facturation par un professionnel comptable
- Les refresh tokens doivent être stockés en DB pour permettre la révocation
- Ne pas supprimer `ioredis` avant d'avoir supprimé le package `redis`

---

## 9. Format de fin de session

```markdown
## Bilan de session — [DATE]

- Tâche :
- Statut final :
- Fichiers modifiés :
- Tests exécutés :
- Résultat des tests :
- Décisions prises :
- Nouveaux risques identifiés :
- Documents mis à jour :
- Prochaine tâche recommandée :
```
