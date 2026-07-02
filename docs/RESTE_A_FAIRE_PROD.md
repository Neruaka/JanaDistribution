# Reste à faire avant mise en production

> Généré par inspection statique du code au 2026-07-02 (`ETAT_ACTUEL_PROJET.md`, `PLAN_CORRECTION_AUDIT.md`, code source).
> Avancement estimé au moment de l'inspection : ~92-95 %. Verdict actuel : **NON PRÊT PRODUCTION**.

---

## 1. BLOQUANTS ABSOLUS — actions externes requises

Ces points ne peuvent pas être résolus par du code ; ils nécessitent une décision ou une action humaine (propriétaire, comptable, hébergeur).

| # | Action requise | Responsable | Détail |
|---|---|---|---|
| 1 | Réactiver Railway | Propriétaire | Plan Railway expiré — aucun environnement staging/production actif. Config prête dans `docs/RAILWAY_CONFIG_READY.md`. |
| 2 | Activer les sauvegardes PostgreSQL Railway | Propriétaire | Railway Dashboard → PostgreSQL → Backups (tâche `T8-04`, non vérifiable en local). |
| 3 | Custom domain Cloudflare R2 en production | Propriétaire | R2 est configuré et fonctionnel (bucket `jana-products`, endpoint EU) mais un domaine personnalisé pour servir les images en prod reste optionnel/à valider. |
| 4 | Renseigner SIRET / TVA / adresse entreprise | Propriétaire | Variables `ENTREPRISE_SIRET`, `ENTREPRISE_TVA_NUMERO`, `ENTREPRISE_ADRESSE` à renseigner dans Railway — actuellement absentes, les factures générées afficheraient des champs vides/factices. |
| 5 | Validation comptable des taux de TVA | Comptable | Taux 5,5 % / 10 % / 20 % (CGI) implémentés par défaut sur chaque produit (`produit.taux_tva`) mais **non validés** — avertissement explicite dans le code (`0008_facturation.sql`). Ne pas vendre réellement avant validation. |
| 6 | Paiement en ligne (Stripe) | N/A | **Retiré du MVP** (décision client, 2026-07-02). Aucune action requise sauf si le client souhaite le réintroduire plus tard (voir `docs/FEATURES_RECOMMANDEES.md`). |
| 7 | Durée légale de conservation des factures | Comptable | 10 ans (droit français) à confirmer formellement — `DM-08` toujours ouvert. |

---

## 2. Code restant — tâches TODO / BLOCKED réelles (`PLAN_CORRECTION_AUDIT.md`)

### Facturation (bloque la Phase 5 complète)

| ID | Tâche | Statut | Dépendance bloquante |
|---|---|---|---|
| T5-08 | Génération facture pour paiements VIREMENT/CHEQUE (hors CARTE) | BLOCKED | T5-04 |
| T5-13 | Envoi facture par email (pièce jointe Brevo base64) | BLOCKED | T5-06 |
| T5-14 | Rendre les factures immuables (pas d'UPDATE, correctifs via avoir) | BLOCKED | T5-04 |
| T5-15 | Générer un avoir après remboursement | BLOCKED | T5-04, ex-T4-01 (Stripe, obsolète — refaire en logique manuelle) |
| T5-16 | Tests unitaires service facture | BLOCKED | T5-06 |
| T5-17 | Tests intégration flux facture complet | BLOCKED | T5-07, T7-01 |

Note : plusieurs dépendances (`T5-04`, `T5-06`, `T5-07`) sont marquées `DONE` dans le journal mais les tâches qui en dépendent restent `BLOCKED` dans le plan — à re-vérifier/déclencher en séance de triage, ce sont probablement des `READY` non recalculés.

### Livraison / Produits

| ID | Tâche | Statut |
|---|---|---|
| T3-03 | Ajouter poids produit si calcul de livraison au poids (actuellement mode DISTANCE, non nécessaire sauf changement de stratégie) | TODO (P2) |
| T6-04 | Validation import produits Excel côté backend | TODO (P2) |

### Tests

| ID | Tâche | Statut |
|---|---|---|
| T7-05 | Tests unitaires génération facture | TODO (P1) |
| T7-07 | Tests E2E tunnel de commande (Playwright) | TODO (P2) |
| Tests d'intégration DB réelle (T7-01, T7-03, T7-06) | Scaffolding présent (testcontainers-node) mais nécessite Docker — non exécuté par défaut dans `npm test` | DONE partiel |

### Infrastructure Railway (Phase 8)

| ID | Tâche | Statut |
|---|---|---|
| T8-01 | Créer services Railway staging | TODO (action externe) |
| T8-02 | Configurer variables d'environnement staging | TODO |
| T8-03 | Stratégie de branches staging→staging / main→prod | TODO |
| T8-04 | Activer sauvegardes PostgreSQL production | TODO (action externe) |
| T8-05 | Configurer monitoring (Better Uptime / UptimeRobot sur `/api/health`) | TODO |
| T8-06 | Stockage images persistant en prod | TODO (dépend de T0-02, déjà résolu via R2 — à re-router) |

### Codes promo (en cours au moment de l'inspection)

- Backend (migration, service, repository, routes) : en place.
- Frontend client (checkout) : en place.
- **Interface admin de gestion des codes promo : absente** — aucune page dans `frontend/src/pages/admin/` au moment de l'inspection. À livrer avant d'activer la fonctionnalité en production (sans cette UI, les codes ne peuvent être créés qu'en SQL direct).

### Dette technique constatée

- `backend/scripts/init.sql` n'est pas synchronisé avec les migrations récentes (0009 retrait Stripe, et plus généralement 0002 à 0010 absentes du fichier de référence). Un nouvel environnement initialisé uniquement via `init.sql` recréerait un schéma incorrect (colonnes Stripe présentes, tables `refresh_token`/`audit_log`/`facture`/`code_promo`/`commande_statut_historique` absentes). À corriger avant tout nouveau provisionnement d'environnement de référence.

---

## 3. Recommandé avant lancement (non bloquant mais important)

- [ ] Exécuter les tests d'intégration testcontainers (Docker requis) au moins une fois avant le go-live — actuellement seuls les tests Jest avec DB mockée tournent en CI (101/101 ✓, mais aucune requête SQL réelle vérifiée).
- [ ] Compléter les tests facture (T5-16, T5-17) avant d'activer réellement la facturation en clientèle.
- [ ] Ajouter un test E2E du tunnel de commande complet (T7-07).
- [ ] Vérifier la cohérence `init.sql` / migrations (voir dette technique ci-dessus) pour fiabiliser tout futur environnement de développement.
- [ ] Confirmer la durée de conservation des logs applicatifs (Winston écrit en fichiers rotatifs 5 Mo × 5, sans politique de purge documentée).
- [ ] Terminer et tester l'interface admin codes promo avant d'annoncer la fonctionnalité aux clients.
- [ ] Revalider le message d'avertissement TVA dans le code (`taux_tva` par défaut 5,5 %) une fois la validation comptable obtenue, et retirer le commentaire d'avertissement.

---

## 4. Procédure de déploiement

Voir `docs/RAILWAY_CONFIG_READY.md` (présent dans le dépôt) pour la configuration Railway prête à l'emploi (variables d'environnement, structure des services backend/frontend/PostgreSQL/Redis). Le déploiement est actuellement **en pause** faute de plan Railway actif.

## 5. Checklist go-live

Voir `docs/CHECKLIST_TEST_LOCAL.md` (présent dans le dépôt) pour la checklist de validation locale avant toute mise en ligne. Une checklist Go-Live plus large existe également dans `docs/audit-finalisation/14_CHECKLIST_GO_LIVE.md` (référencée dans `PLAN_CORRECTION_AUDIT.md`, Phase 9).
