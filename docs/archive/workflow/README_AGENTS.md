# SYSTÈME MULTI-AGENTS — Jana Distribution
# Guide d'installation et d'utilisation

## STRUCTURE À COPIER DANS TON REPO

```
ton-repo/
├── CLAUDE.md                          ← copier ce fichier à la racine du projet
├── docs/sessions/PROMPT_MASTER_SESSION.md           ← ton prompt de démarrage de session
└── .claude/
    └── agents/
        ├── 00_orchestrateur.md        ← agent orchestrateur
        ├── 01_backend.md              ← expert Node.js/PostgreSQL
        ├── 02_frontend.md             ← expert React/Vite/Tailwind
        ├── 03_cybersecurity.md        ← expert sécurité/JWT/tokens
        ├── 04_ecommerce.md            ← expert Stripe/webhooks/commandes
        ├── 05_fullstack.md            ← expert intégrations cross-layer
        ├── 06_chef_projet.md          ← chef de projet/documentation
        ├── 07_seo.md                  ← expert SEO technique
        ├── 08_marketing.md            ← expert copywriting/emails
        └── 09_designer.md             ← expert UI/TailwindCSS/accessibilité
```

## COMMENT LANCER LA SESSION CE SOIR

### Option A — Prompt direct (recommandé pour démarrer vite)
1. Ouvrir Claude Code dans le répertoire racine du projet Jana Distribution
2. Copier-coller le contenu de `docs/sessions/PROMPT_MASTER_SESSION.md` dans le chat
3. Claude Code lit `CLAUDE.md` automatiquement au démarrage
4. L'orchestrateur va dispatcher les sous-agents via l'outil `Task`

### Option B — Commande Claude Code
```bash
cd /chemin/vers/jana-distribution
claude  # lance Claude Code
# Dans le chat, taper :
> /task @.claude/agents/00_orchestrateur.md "Exécuter la session Phase 2 selon docs/sessions/PROMPT_MASTER_SESSION.md"
```

## COMMENT FONCTIONNE LE SYSTÈME

### Le mécanisme sous-agents
Claude Code supporte les **sub-agents** via l'outil `Task`. Quand l'orchestrateur
appelle `Task(agent_file, mission)`, une nouvelle instance de Claude démarre avec :
- Le contenu du fichier agent comme system prompt
- La mission spécifique comme prompt utilisateur
- Accès aux mêmes fichiers du repo

L'orchestrateur attend le résultat, le valide, puis dispatch la tâche suivante.

### Les fichiers `.claude/agents/` comme "skills"
Chaque fichier agent contient :
1. L'identité et l'expertise de l'agent (son "cerveau" spécialisé)
2. Les fichiers à lire en priorité
3. Les tâches spécifiques avec le code exact attendu
4. Les règles non négociables
5. Le format de rapport de sortie

### Parallélisme vs Séquencement
L'orchestrateur gère les conflits. Règle simple :
- Deux agents sur des **fichiers différents** → parallèle OK
- Deux agents sur le **même fichier** → séquentiel obligatoire

## AJOUTER UN NOUVEL AGENT

Créer `.claude/agents/10_nouveau_agent.md` avec cette structure :
```markdown
# AGENT : [NOM] — Jana Distribution
# Spécialité : [domaine]

## IDENTITÉ
[Description de l'expert que cet agent incarne]

## LECTURE OBLIGATOIRE AVANT TOUTE ACTION
[Commandes bash à exécuter]

## TÂCHES CE SOIR
[Liste des tâches avec code exact]

## RÈGLES (non négociables)
[Contraintes spécifiques]

## FORMAT DE RAPPORT
[Template de sortie]
```

## MODIFIER UN AGENT EXISTANT
Les agents sont des fichiers markdown — modifiable directement.
Cas d'usage : ajouter de nouvelles tâches pour une prochaine session,
mettre à jour les contraintes après un changement d'architecture.

## APRÈS LA SESSION
1. Le Chef de Projet produit le bilan → commit dans git
2. Mettre à jour docs/workflow/ETAT_ACTUEL_PROJET.md avec le nouvel état
3. La prochaine session repart de l'état mis à jour

## TROUBLESHOOTING

### "L'agent a modifié un fichier qu'il ne devait pas"
```bash
git diff              # voir ce qui a changé
git checkout <fichier>  # rollback immédiat
```
Puis relancer l'agent avec une contrainte explicite dans le prompt.

### "Deux agents ont créé un conflit sur le même fichier"
```bash
git status            # identifier les fichiers en conflit
git diff              # voir les différences
# Résoudre manuellement, puis :
git add <fichier>
git commit -m "fix: résolution conflit agents [T2-XX vs T2-YY]"
```

### "Les tests ont cassé après une tâche d'agent"
```bash
cd backend && npm test -- --verbose    # voir quel test échoue
git log --oneline -3                   # identifier le commit fautif
git revert HEAD                        # si le commit est mauvais
```
