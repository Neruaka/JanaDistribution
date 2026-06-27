-- ============================================================
-- MIGRATION 0003 - Table refresh_token
-- ============================================================
-- Stocke les refresh tokens (hash SHA-256) pour permettre
-- leur révocation individuelle à la déconnexion.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS refresh_token (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_hash     VARCHAR(64) NOT NULL UNIQUE,
  utilisateur_id UUID        NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
  expires_at     TIMESTAMP   NOT NULL,
  revoked_at     TIMESTAMP   NULL,
  created_at     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rt_token_hash   ON refresh_token(token_hash);
CREATE INDEX IF NOT EXISTS idx_rt_utilisateur  ON refresh_token(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_rt_expires_at   ON refresh_token(expires_at);

COMMIT;
