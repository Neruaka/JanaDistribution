# JANA DISTRIBUTION — ORCHESTRATEUR PRINCIPAL
# Lire EN PREMIER. Ce fichier gouverne tous les agents de ce projet.

## CONTEXTE PROJET
Jana Distribution est une plateforme e-commerce alimentaire B2C/B2B.
Stack : React 18 / Vite / TailwindCSS 3.4 / Node.js + Express / PostgreSQL 15 / Redis 7 / Stripe Checkout Sessions / Brevo API.
Déploiement : Railway (NIXPACKS backend, Dockerfile frontend).
Avancement : ~68% — NON PRÊT PRODUCTION.
Phase active : Phase 2 — Authentification, commandes et traçabilité.

## FICHIERS OPÉRATIONNELS (à lire avant toute action)
1. `CLAUDE_WORKFLOW.md` — méthode de travail absolue
2. `ETAT_ACTUEL_PROJET.md` — état réel du code
3. `PLAN_CORRECTION_AUDIT.md` — backlog officiel avec statuts

## RÈGLES ABSOLUES POUR TOUS LES AGENTS
- NE JAMAIS modifier une migration déjà exécutée en prod — créer une nouvelle
- NE JAMAIS exposer de secrets (.env, JWT_SECRET, STRIPE_SECRET_KEY, etc.)
- NE JAMAIS commencer une tâche BLOCKED ou avec dépendance non satisfaite
- NE JAMAIS sortir de l'architecture routes → controllers → services → repositories
- NE JAMAIS faire de réécriture complète — évolution progressive UNIQUEMENT
- TOUJOURS vérifier `git status` avant toute modification
- TOUJOURS mettre à jour PLAN_CORRECTION_AUDIT.md + ETAT_ACTUEL_PROJET.md après chaque tâche DONE
- TOUJOURS produire un bilan de session au format défini dans CLAUDE_WORKFLOW.md §9

## AGENTS DISPONIBLES
Invoquer via `Task` avec le chemin du fichier agent correspondant :

| Agent | Fichier | Responsabilité principale ce soir |
|---|---|---|
| Orchestrateur | `.claude/agents/00_orchestrateur.md` | Dispatch + coordination + merge final |
| Expert Backend | `.claude/agents/01_backend.md` | T2-01..T2-07, T4-01..T4-04 |
| Expert Frontend | `.claude/agents/02_frontend.md` | T6-01..T6-05, UI admin |
| Expert Cybersécurité | `.claude/agents/03_cybersecurity.md` | T2-03..T2-05, audit continu |
| Expert E-commerce | `.claude/agents/04_ecommerce.md` | T4-01..T4-06, flux commande |
| Expert Full Stack | `.claude/agents/05_fullstack.md` | Tâches cross-layer, intégrations |
| Expert Chef de Projet | `.claude/agents/06_chef_projet.md` | Suivi avancement, blocages, doc |
| Expert SEO | `.claude/agents/07_seo.md` | Meta tags, sitemap, perf Core Web Vitals |
| Expert Marketing | `.claude/agents/08_marketing.md` | UX copywriting, emails transactionnels |
| Expert Web Designer | `.claude/agents/09_designer.md` | Composants UI, cohérence visuelle |

## ORDRE D'EXÉCUTION CE SOIR (chemin critique Phase 2)
```
1. Backend (T2-01) → crée table commande_statut_historique
2. Backend (T2-02) → enregistre transitions de statut
3. Cybersécurité (T2-03) → crée table refresh_token
4. Backend (T2-04) → stocke refresh token à la connexion
5. Backend (T2-05) → révoque à la déconnexion
6. E-commerce (T4-01) → remplace charge.refunded par refund.created
7. E-commerce (T4-02) → gère remboursements partiels
8. Full Stack (T4-03) → interface admin remboursement
9. Backend (T2-06) → table audit_log
10. Backend (T2-07) → logger actions admin sensibles
```

## FORMAT DE RAPPORT AGENT (obligatoire en fin de chaque tâche)
```
[AGENT: <nom>] [TÂCHE: <ID>] [STATUT: DONE|BLOCKED|FAILED]
Fichiers modifiés :
Tests exécutés + résultats :
Impact DB :
Décisions prises :
Risques identifiés :
```
