-- ============================================
-- MIGRATION 0009 - Retrait de Stripe
-- ============================================
-- Décision client : le MVP ne propose PAS de paiement en ligne.
-- Modes de paiement acceptés : ESPECES (livraison), VIREMENT, CHEQUE.
--
-- Contexte réel du schéma (vérifié dans init.sql + migrations 0001/0005) :
--  - `mode_paiement` est un TYPE ENUM (pas une contrainte CHECK) contenant
--    'CARTE', 'VIREMENT', 'ESPECES', 'CHEQUE'. Postgres ne permet pas de
--    retirer une valeur d'ENUM directement : on recrée le type sans 'CARTE'.
--  - `commande.stripe_session_id` / `stripe_payment_intent_id` : créés par
--    init.sql / migration 0001_add_stripe_payment.sql.
--  - `commande.stripe_refund_id` : créé par migration 0005_commande_refund.sql.
--  - `commande.montant_rembourse` (migration 0005) est CONSERVÉE : elle sert
--    au suivi métier des remboursements manuels (hors Stripe), utilisée par
--    order.repository.js#updateRefund indépendamment de tout ID Stripe.
--  - Les statuts `REMBOURSE` / `PARTIELLEMENT_REMBOURSE` de l'ENUM
--    `statut_commande` sont CONSERVÉS : des remboursements (manuels) restent
--    possibles, seul le canal Stripe est retiré.
--  - `stripe_event` (idempotency des webhooks Stripe) est supprimée : plus de
--    webhooks entrants.
-- ============================================

BEGIN;

-- 1) Sécurité : neutraliser toute commande historique en mode CARTE avant de
--    retirer cette valeur de l'ENUM (environnement de dev/test uniquement,
--    aucune commande CARTE n'a été livrée en production).
UPDATE commande SET mode_paiement = 'ESPECES' WHERE mode_paiement = 'CARTE';

-- 2) Retirer les colonnes strictement liées à l'intégration Stripe
ALTER TABLE commande DROP COLUMN IF EXISTS stripe_session_id;
ALTER TABLE commande DROP COLUMN IF EXISTS stripe_payment_intent_id;
ALTER TABLE commande DROP COLUMN IF EXISTS stripe_refund_id;

-- 3) Retirer la table d'idempotency des webhooks Stripe
DROP TABLE IF EXISTS stripe_event;

-- 4) Retirer 'CARTE' de l'ENUM mode_paiement (recréation du type)
ALTER TYPE mode_paiement RENAME TO mode_paiement_old;
CREATE TYPE mode_paiement AS ENUM ('ESPECES', 'VIREMENT', 'CHEQUE');

ALTER TABLE commande ALTER COLUMN mode_paiement DROP DEFAULT;
ALTER TABLE commande
  ALTER COLUMN mode_paiement TYPE mode_paiement
  USING mode_paiement::text::mode_paiement;
ALTER TABLE commande ALTER COLUMN mode_paiement SET DEFAULT 'ESPECES';

DROP TYPE mode_paiement_old;

COMMIT;
