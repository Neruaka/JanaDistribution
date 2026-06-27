-- ============================================================
-- MIGRATION 0004 - Table audit_log
-- ============================================================
-- Trace les actions admin sensibles : changements de statut
-- commande, remboursements, suppressions.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS audit_log (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  action         VARCHAR(100) NOT NULL,
  entite_type    VARCHAR(50),
  entite_id      UUID,
  utilisateur_id UUID        REFERENCES utilisateur(id) ON DELETE SET NULL,
  details        JSONB,
  ip_address     VARCHAR(45),
  created_at     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_al_utilisateur  ON audit_log(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_al_entite       ON audit_log(entite_type, entite_id);
CREATE INDEX IF NOT EXISTS idx_al_created_at   ON audit_log(created_at);

COMMIT;
