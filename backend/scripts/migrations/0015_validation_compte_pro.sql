-- Migration 0015 : statut de validation des comptes professionnels (T16-09)
-- Retour de test (2026-09-07) : un compte PROFESSIONNEL etait actif
-- immediatement a l'inscription (aucune verification d'authenticite du
-- SIRET au-dela du format 14 chiffres). Colonne dediee plutot que de
-- reutiliser est_actif (deja utilise pour le blocage admin) - un pro
-- bloque et un pro non-valide doivent rester distinguables.
--
-- NON_APPLICABLE : particulier, aucune validation requise (defaut).
-- EN_ATTENTE      : professionnel fraichement inscrit, checkout bloque.
-- VALIDE          : professionnel valide par un admin, checkout autorise.
--
-- Les comptes PROFESSIONNEL deja existants sont grandfathered en VALIDE :
-- ils commandaient deja avant ce correctif, les bloquer retroactivement
-- casserait leur usage sans justification.

ALTER TABLE utilisateur ADD COLUMN IF NOT EXISTS statut_validation_pro VARCHAR(20) NOT NULL DEFAULT 'NON_APPLICABLE'
  CHECK (statut_validation_pro IN ('NON_APPLICABLE', 'EN_ATTENTE', 'VALIDE'));

UPDATE utilisateur SET statut_validation_pro = 'VALIDE' WHERE type_client = 'PROFESSIONNEL';
