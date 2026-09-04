-- ============================================
-- MIGRATION 0001 - Intégration paiement Stripe
-- ============================================
-- Ajoute les colonnes nécessaires à la gestion du paiement sur la table `commande`
-- et la table `stripe_event` pour l'idempotency des webhooks.
--
-- Exécution :
--   psql -U postgres -d jana_distribution -f migrations/0001_add_stripe_payment.sql
-- Ou via Docker :
--   docker exec -i postgres psql -U postgres -d jana_distribution \
--     < backend/scripts/migrations/0001_add_stripe_payment.sql
-- ============================================

BEGIN;

-- 1) Nouveau type pour le statut de paiement
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'statut_paiement') THEN
    CREATE TYPE statut_paiement AS ENUM (
      'PENDING',    -- créée, en attente de paiement
      'AUTHORIZED', -- autorisée (pré-capture), non utilisée en Checkout mais prévu pour PaymentIntents manuels
      'PAID',       -- payée avec succès
      'FAILED',     -- échec de paiement
      'REFUNDED'    -- remboursée
    );
  END IF;
END
$$;

-- 2) Colonnes paiement sur `commande`
ALTER TABLE commande
  ADD COLUMN IF NOT EXISTS stripe_session_id        VARCHAR(255),
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS paiement_statut          statut_paiement NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS paye_le                  TIMESTAMP NULL;

CREATE INDEX IF NOT EXISTS idx_commande_stripe_session    ON commande(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_commande_stripe_intent     ON commande(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_commande_paiement_statut   ON commande(paiement_statut);

-- 3) Table d'idempotency des webhooks Stripe
CREATE TABLE IF NOT EXISTS stripe_event (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id     VARCHAR(255) NOT NULL UNIQUE,
  type         VARCHAR(100) NOT NULL,
  payload      JSONB       NOT NULL,
  processed_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stripe_event_type ON stripe_event(type);

COMMIT;
