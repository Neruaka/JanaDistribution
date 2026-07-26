-- ============================================
-- MIGRATION 0011 - Contrainte CHECK stock >= 0 (T12-06)
-- ============================================
-- Durcissement de la règle métier "le stock ne doit jamais être négatif".
--
-- Le code applicatif (order.repository.js#create) décrémente déjà le stock
-- de façon atomique via :
--   UPDATE produit SET stock_quantite = stock_quantite - $1
--   WHERE id = $2 AND est_actif = true AND stock_quantite >= $1
-- en vérifiant rowCount pour détecter un stock insuffisant.
--
-- Cette migration ajoute un filet de sécurité au niveau base de données :
-- même en cas de bug applicatif futur (ex: nouveau code qui déciderait de
-- décrémenter sans la clause WHERE stock_quantite >= $1), Postgres rejettera
-- toute écriture qui ferait passer stock_quantite sous 0.
--
-- Aucune donnée existante ne devrait être négative (la contrainte applicative
-- l'a toujours empêché), mais on vérifie explicitement avant d'ajouter la
-- contrainte pour éviter un échec de migration en prod.
-- ============================================

BEGIN;

DO $$
DECLARE
  negative_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO negative_count FROM produit WHERE stock_quantite < 0;

  IF negative_count > 0 THEN
    RAISE EXCEPTION
      'Migration 0011 annulée : % produit(s) avec stock_quantite négatif détecté(s). Corriger les données avant de réappliquer cette migration.',
      negative_count;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'produit_stock_quantite_non_negatif'
  ) THEN
    ALTER TABLE produit
      ADD CONSTRAINT produit_stock_quantite_non_negatif CHECK (stock_quantite >= 0);
  END IF;
END $$;

COMMIT;
