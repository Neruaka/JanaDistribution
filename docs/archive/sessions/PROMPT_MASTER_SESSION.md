Tu es l'orchestrateur principal de Jana Distribution.

## ÉTAPE 0 — LECTURE OBLIGATOIRE (avant tout)
```bash
cat docs/workflow/CLAUDE_WORKFLOW.md
cat docs/workflow/ETAT_ACTUEL_PROJET.md
cat docs/workflow/PLAN_CORRECTION_AUDIT.md
git status
git log --oneline -5
```

## ÉTAT CONNU AU DÉMARRAGE DE CETTE SESSION
- Phase 0 : TERMINÉE (T0-01..T0-07 DONE, T0-02 BLOCKED)
- Phase 1 : TERMINÉE (T1-01..T1-08 DONE)
- Tests backend : 5/5 suites, 97/97 tests
- Build frontend : PASS
- Phase active : Phase 2 — Authentification, commandes et traçabilité
- Tâche suivante recommandée dans docs/workflow/ETAT_ACTUEL_PROJET.md : T2-01

## MISSION DE CE SOIR
Exécuter un maximum de tâches des Phases 2, 4, 6, et SEO/UX.
Objectif cible : passer de ~68% à ~80% d'avancement.

## ORDRE D'EXÉCUTION (chemin critique — respecter la séquence)

### BLOC 1 — Traçabilité commandes (séquentiel)
1. **T2-01** → agent Backend : créer migration + table commande_statut_historique + endpoint admin
2. **T2-02** → agent Backend : logger chaque updateStatus() vers cette table
3. **T2-06** → agent Backend : créer migration + table audit_log
4. **T2-07** → agent Backend : logger actions admin sensibles

### BLOC 2 — Sécurité refresh tokens (séquentiel, peut démarrer en parallèle avec BLOC 1 sauf conflit sur auth.service.js)
5. **T2-03** → agent Cybersécurité : migration table refresh_token
6. **T2-04** → agent Cybersécurité : stocker refresh token au login
7. **T2-05** → agent Cybersécurité : révoquer au logout

### BLOC 3 — Stripe remboursements (démarre après T2-01 car besoin de audit_log)
8. **T4-01** → agent E-commerce : remplacer charge.refunded par refund.created
9. **T4-02** → agent E-commerce : gérer remboursements partiels
10. **T4-03** → agent E-commerce (backend) + agent Frontend (UI admin) : interface remboursement
11. **T4-04** → agent E-commerce : stocker stripe_refund_id

### BLOC 4 — Frontend admin (peut démarrer après BLOC 1 complété)
12. **T6-01** → agent Frontend : timeline historique statuts
13. **T6-02** → agent Frontend : dashboard stats + graphiques
14. **T6-03** → agent Frontend : export CSV commandes

### BLOC 5 — SEO et UX (parallélisable avec BLOC 3 et 4)
15. **SEO-01..SEO-03** → agent SEO : meta tags + sitemap
16. **MKT-01..MKT-02** → agent Marketing : emails + copywriting checkout
17. **DESIGN-01..DESIGN-03** → agent Designer : système UI + timeline

## RÈGLES D'ORCHESTRATION

### Conflits de fichiers — vérifier avant dispatch parallèle
Ces fichiers sont touchés par plusieurs agents — NE PAS paralléliser :
- `backend/src/services/auth.service.js` → T2-04 PUIS T2-05 (séquentiel)
- `backend/src/services/order.service.js` → T2-02 PUIS T2-07 (séquentiel)
- `frontend/src/pages/admin/AdminOrdersList.jsx` → T6-01 PUIS T4-03 UI (séquentiel)

Ces fichiers sont sans conflit — OK en parallèle :
- Migrations SQL (chacune dans son propre fichier numéroté)
- `frontend/src/components/admin/DashboardStats.jsx` (nouveau fichier)
- `frontend/src/components/admin/CommandeStatutTimeline.jsx` (nouveau fichier)
- `backend/src/services/email.service.js` (MKT uniquement)

### Validation après chaque tâche
```bash
cd backend && npm test   # toujours passer
cd frontend && npm run build  # toujours passer
git diff | grep -iE "sk_live|jwt_secret|whsec_" # jamais de secrets
```

### Si un agent échoue
1. Lire le message d'erreur complet
2. Rollback : `git checkout <fichier>`
3. Dispatcher à nouveau avec le contexte d'erreur inclus dans le prompt

## LANCEMENT DES SUB-AGENTS
Invoquer chaque agent via l'outil `Task` avec :
- `agent_file` : chemin vers `.claude/agents/XX_nom.md`
- `task_id` : identifiant de la tâche
- `mission` : ce que l'agent doit faire EXACTEMENT
- `constraints` : ce qu'il ne doit PAS faire
- `success_criteria` : comment je sais que c'est DONE

## BILAN FINAL OBLIGATOIRE
En fin de session, l'agent Chef de Projet produit un bilan complet
au format docs/workflow/CLAUDE_WORKFLOW.md §9 et met à jour :
1. docs/workflow/PLAN_CORRECTION_AUDIT.md (compteurs + statuts)
2. docs/workflow/ETAT_ACTUEL_PROJET.md (journal + prochaine action)
3. Commit final : `chore(docs): session bilan [DATE]`

---

**Lance maintenant en commençant par lire les trois fichiers opérationnels,
puis dispatch T2-01 vers l'agent Backend.**
