# JANA DISTRIBUTION — ORCHESTRATEUR PRINCIPAL
# Lire EN PREMIER. Ce fichier gouverne tous les agents de ce projet.

## CONTEXTE PROJET
Jana Distribution est une plateforme e-commerce alimentaire B2C/B2B.
Stack : React 18 / Vite / TailwindCSS 3.4 / Node.js + Express / PostgreSQL 15 / Redis 7 / Gmail SMTP (nodemailer).
Paiement en ligne (Stripe) retiré du MVP (T4-07, 2026-07-02) — ESPECES/VIREMENT/CHEQUE manuel uniquement.
Email transactionnel migré de Brevo REST API vers Gmail SMTP (2026-07-08) — voir `docs/guides/GUIDE_GMAIL_SMTP.md`.
Déploiement : Homeserver auto-géré `tfredklab.dev` (Docker Compose + Caddy + Cloudflare Tunnel) — Railway abandonné (plan expiré), migration Phase 11.
Avancement : ~98% (52/80 tâches DONE) — NON PRÊT PRODUCTION.
Phase active : Phase 11 — Migration Railway → Homeserver (remplace Phase 8, voir docs/workflow/PLAN_CORRECTION_AUDIT.md).

## FICHIERS OPÉRATIONNELS (à lire avant toute action)
1. `docs/workflow/CLAUDE_WORKFLOW.md` — méthode de travail absolue
2. `docs/workflow/ETAT_ACTUEL_PROJET.md` — état réel du code
3. `docs/workflow/PLAN_CORRECTION_AUDIT.md` — backlog officiel avec statuts

## RÈGLES ABSOLUES POUR TOUS LES AGENTS
- NE JAMAIS modifier une migration déjà exécutée en prod — créer une nouvelle
- NE JAMAIS exposer de secrets (.env, JWT_SECRET, STRIPE_SECRET_KEY, etc.)
- NE JAMAIS commencer une tâche BLOCKED ou avec dépendance non satisfaite
- NE JAMAIS sortir de l'architecture routes → controllers → services → repositories
- NE JAMAIS faire de réécriture complète — évolution progressive UNIQUEMENT
- TOUJOURS vérifier `git status` avant toute modification
- TOUJOURS mettre à jour docs/workflow/PLAN_CORRECTION_AUDIT.md + docs/workflow/ETAT_ACTUEL_PROJET.md après chaque tâche DONE
- TOUJOURS produire un bilan de session au format défini dans docs/workflow/CLAUDE_WORKFLOW.md §9

## AGENTS DISPONIBLES
Invoquer via `Task` avec le chemin du fichier agent correspondant :

| Agent | Fichier | Responsabilité principale ce soir |
|---|---|---|
| Orchestrateur | `.Codex/agents/00_orchestrateur.md` | Dispatch + coordination + merge final |
| Expert Backend | `.Codex/agents/01_backend.md` | T2-01..T2-07, T4-01..T4-04 |
| Expert Frontend | `.Codex/agents/02_frontend.md` | T6-01..T6-05, UI admin |
| Expert Cybersécurité | `.Codex/agents/03_cybersecurity.md` | T2-03..T2-05, audit continu |
| Expert E-commerce | `.Codex/agents/04_ecommerce.md` | T4-01..T4-06, flux commande |
| Expert Full Stack | `.Codex/agents/05_fullstack.md` | Tâches cross-layer, intégrations |
| Expert Chef de Projet | `.Codex/agents/06_chef_projet.md` | Suivi avancement, blocages, doc |
| Expert SEO | `.Codex/agents/07_seo.md` | Meta tags, sitemap, perf Core Web Vitals |
| Expert Marketing | `.Codex/agents/08_marketing.md` | UX copywriting, emails transactionnels |
| Expert Web Designer | `.Codex/agents/09_designer.md` | Composants UI, cohérence visuelle |
| Prompt Architect | `.Codex/agents/prompt-architect.md` | Reformulation de demandes utilisateur en prompts structurés pour Codex |

## ORDRE D'EXÉCUTION DU 2026-06-27 (historique — chemin critique Phase 2, toutes tâches closes)
```
1. Backend (T2-01) → crée table commande_statut_historique — DONE
2. Backend (T2-02) → enregistre transitions de statut — DONE
3. Cybersécurité (T2-03) → crée table refresh_token — DONE
4. Backend (T2-04) → stocke refresh token à la connexion — DONE
5. Backend (T2-05) → révoque à la déconnexion — DONE
6. E-commerce (T4-01) → remplace charge.refunded par refund.created — CANCELLED (Stripe retiré, voir T4-07)
7. E-commerce (T4-02) → gère remboursements partiels — CANCELLED (Stripe retiré, voir T4-07)
8. Full Stack (T4-03) → interface admin remboursement — CANCELLED (remplacé par remboursement manuel, voir T4-07)
9. Backend (T2-06) → table audit_log — DONE
10. Backend (T2-07) → logger actions admin sensibles — DONE
```
Voir `docs/workflow/PLAN_CORRECTION_AUDIT.md` et `docs/workflow/ETAT_ACTUEL_PROJET.md` pour l'état réel à jour et la prochaine tâche recommandée (Phase 8/9).

## FORMAT DE RAPPORT AGENT (obligatoire en fin de chaque tâche)
```
[AGENT: <nom>] [TÂCHE: <ID>] [STATUT: DONE|BLOCKED|FAILED]
Fichiers modifiés :
Tests exécutés + résultats :
Impact DB :
Décisions prises :
Risques identifiés :
```
