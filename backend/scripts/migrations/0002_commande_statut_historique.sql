-- ============================================================
-- MIGRATION 0002 - Table commande_statut_historique
-- ============================================================
-- Trace toutes les transitions de statut d'une commande :
-- ancien_statut → nouveau_statut avec horodatage.
-- Alimentée par order.repository.js updateStatus() et cancel().
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS commande_statut_historique (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  commande_id    UUID        NOT NULL REFERENCES commande(id) ON DELETE CASCADE,
  ancien_statut  VARCHAR(50),
  nouveau_statut VARCHAR(50) NOT NULL,
  commentaire    TEXT,
  created_at     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_csh_commande    ON commande_statut_historique(commande_id);
CREATE INDEX IF NOT EXISTS idx_csh_created_at  ON commande_statut_historique(created_at);

COMMIT;
