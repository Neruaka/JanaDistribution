-- ============================================
-- MIGRATION 0012 - Immuabilité des factures + type AVOIR (T5-14, T5-15)
-- ============================================
-- Contexte : de vraies factures seront émises à de vrais clients. Une facture
-- modifiable après émission est un problème légal direct (Code de commerce),
-- pas une dette technique. Le code applicatif n'a jamais exposé de route
-- UPDATE/DELETE sur facture/facture_ligne (vérifié en audit T12-07 et
-- ré-vérifié ici), mais rien n'empêchait un futur bug ou une route ajoutée
-- par erreur de le faire. Cette migration ajoute un filet de sécurité au
-- niveau base de données, sur le même principe que 0011 (stock >= 0).
--
-- 1. Ajoute facture.type ('FACTURE' | 'AVOIR') — permet de distinguer un
--    avoir (montants négatifs, généré par T5-15) d'une facture normale sans
--    ambiguïté sur le signe des montants.
-- 2. Trigger sur facture : bloque toute UPDATE qui changerait numero,
--    commande_id, utilisateur_id, les snapshots client/entreprise, les
--    montants ou le type. Autorise UNIQUEMENT : statut EMISE -> ANNULEE
--    (une fois), et avoir_id NULL -> une valeur (une fois). Bloque toute
--    DELETE sans exception.
-- 3. Trigger sur facture_ligne : bloque toute UPDATE et DELETE sans
--    exception — une ligne de facture ne doit jamais changer après création.
-- ============================================

BEGIN;

-- 1. Colonne type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'facture' AND column_name = 'type'
  ) THEN
    ALTER TABLE facture ADD COLUMN type VARCHAR(10) NOT NULL DEFAULT 'FACTURE'
      CHECK (type IN ('FACTURE', 'AVOIR'));
  END IF;
END $$;

-- 2. Trigger d'immuabilité sur facture
CREATE OR REPLACE FUNCTION facture_immutable_guard() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Suppression interdite : une facture ne peut jamais être supprimée (conservation légale 10 ans). Utilisez un avoir pour corriger.';
  END IF;

  -- TG_OP = 'UPDATE' à partir d'ici
  IF NEW.numero IS DISTINCT FROM OLD.numero
     OR NEW.commande_id IS DISTINCT FROM OLD.commande_id
     OR NEW.utilisateur_id IS DISTINCT FROM OLD.utilisateur_id
     OR NEW.client_nom IS DISTINCT FROM OLD.client_nom
     OR NEW.client_email IS DISTINCT FROM OLD.client_email
     OR NEW.client_adresse IS DISTINCT FROM OLD.client_adresse
     OR NEW.entreprise_nom IS DISTINCT FROM OLD.entreprise_nom
     OR NEW.entreprise_siret IS DISTINCT FROM OLD.entreprise_siret
     OR NEW.entreprise_tva_numero IS DISTINCT FROM OLD.entreprise_tva_numero
     OR NEW.entreprise_adresse IS DISTINCT FROM OLD.entreprise_adresse
     OR NEW.total_ht IS DISTINCT FROM OLD.total_ht
     OR NEW.total_tva IS DISTINCT FROM OLD.total_tva
     OR NEW.total_ttc IS DISTINCT FROM OLD.total_ttc
     OR NEW.type IS DISTINCT FROM OLD.type
     OR NEW.date_emission IS DISTINCT FROM OLD.date_emission
  THEN
    RAISE EXCEPTION 'Facture immuable : seuls statut (EMISE -> ANNULEE) et avoir_id (une seule fois) peuvent changer après émission. Toute correction financière passe par un avoir.';
  END IF;

  IF OLD.avoir_id IS NOT NULL AND NEW.avoir_id IS DISTINCT FROM OLD.avoir_id THEN
    RAISE EXCEPTION 'avoir_id ne peut être défini qu''une seule fois sur une facture.';
  END IF;

  IF OLD.statut = 'ANNULEE' AND NEW.statut IS DISTINCT FROM OLD.statut THEN
    RAISE EXCEPTION 'Une facture déjà ANNULEE ne peut pas changer de statut à nouveau.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_facture_immutable ON facture;
CREATE TRIGGER trg_facture_immutable
  BEFORE UPDATE OR DELETE ON facture
  FOR EACH ROW EXECUTE FUNCTION facture_immutable_guard();

-- 3. Trigger d'immuabilité sur facture_ligne (aucune exception)
CREATE OR REPLACE FUNCTION facture_ligne_immutable_guard() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'facture_ligne est immuable : aucune modification ni suppression après création. Utilisez un avoir pour corriger.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_facture_ligne_immutable ON facture_ligne;
CREATE TRIGGER trg_facture_ligne_immutable
  BEFORE UPDATE OR DELETE ON facture_ligne
  FOR EACH ROW EXECUTE FUNCTION facture_ligne_immutable_guard();

COMMIT;
