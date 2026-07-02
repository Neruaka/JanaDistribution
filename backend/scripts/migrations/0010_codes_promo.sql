-- ============================================
-- MIGRATION 0010 - Codes promo
-- ============================================
-- Nouvelle feature demandée par le client : système de codes promo
-- (le MVP n'a pas de paiement en ligne — voir migration 0009_remove_stripe.sql —
-- mais les remises restent applicables sur les commandes ESPECES/VIREMENT/CHEQUE).
--
-- Fonctionnel :
--  - type_rabais POURCENTAGE ou MONTANT_FIXE, paramétrable par code
--  - date_debut / date_fin optionnelles
--  - applicable sur toutes les catégories (pas de restriction gérée ici)
--  - max_utilisations_global : plafond global d'utilisation (NULL = illimité)
--  - max_utilisations_par_client : plafond par client (défaut 1)
--  - montant_minimum : montant de commande requis pour appliquer le code
--  - actif : activation / désactivation manuelle par l'admin
--  - code_promo_utilisation : trace chaque utilisation (pour stats et pour
--    calculer les compteurs par client / global sans dénormaliser un compteur
--    sur code_promo, ce qui évite les problèmes de synchronisation)
-- ============================================

BEGIN;

CREATE TABLE IF NOT EXISTS code_promo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  type_rabais VARCHAR(20) NOT NULL CHECK (type_rabais IN ('POURCENTAGE', 'MONTANT_FIXE')),
  valeur_rabais NUMERIC(10,2) NOT NULL CHECK (valeur_rabais > 0),
  montant_minimum NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_utilisations_global INTEGER,
  max_utilisations_par_client INTEGER DEFAULT 1,
  date_debut TIMESTAMP WITH TIME ZONE,
  date_fin TIMESTAMP WITH TIME ZONE,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES utilisateur(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS code_promo_utilisation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code_promo_id UUID NOT NULL REFERENCES code_promo(id) ON DELETE RESTRICT,
  commande_id UUID NOT NULL REFERENCES commande(id) ON DELETE CASCADE,
  utilisateur_id UUID NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
  montant_rabais_applique NUMERIC(10,2) NOT NULL,
  total_avant_rabais NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (code_promo_id, commande_id)
);

ALTER TABLE commande ADD COLUMN IF NOT EXISTS code_promo_id UUID REFERENCES code_promo(id);
ALTER TABLE commande ADD COLUMN IF NOT EXISTS montant_rabais NUMERIC(10,2) DEFAULT 0;
ALTER TABLE commande ADD COLUMN IF NOT EXISTS total_avant_rabais NUMERIC(10,2);

CREATE INDEX IF NOT EXISTS idx_code_promo_code ON code_promo(code);
CREATE INDEX IF NOT EXISTS idx_code_promo_actif ON code_promo(actif, date_debut, date_fin);
CREATE INDEX IF NOT EXISTS idx_cpu_code_promo ON code_promo_utilisation(code_promo_id);
CREATE INDEX IF NOT EXISTS idx_cpu_utilisateur ON code_promo_utilisation(utilisateur_id, code_promo_id);

COMMIT;
