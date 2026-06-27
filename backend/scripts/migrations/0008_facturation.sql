BEGIN;

-- ============================================================
-- SYSTÈME DE FACTURATION — Jana Distribution
-- ⚠️ Taux TVA conformes CGI 2024 — validation comptable requise
-- avant première vente réelle (art. 278 et suivants CGI)
-- ============================================================

-- Ajouter taux_tva sur produit (T5-01)
ALTER TABLE produit ADD COLUMN IF NOT EXISTS taux_tva NUMERIC(4,2) NOT NULL DEFAULT 5.5;
-- Taux légaux France : 5.5 (alimentaire de base), 10 (transformé), 20 (alcool/luxe)

COMMENT ON COLUMN produit.taux_tva IS
  '⚠️ Taux TVA %. Légaux FR: 5.5=alimentaire base, 10=transformé, 20=alcool. Valider avec comptable.';

-- Table facture
CREATE TABLE IF NOT EXISTS facture (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero VARCHAR(20) NOT NULL UNIQUE,
  commande_id UUID NOT NULL REFERENCES commande(id),
  utilisateur_id UUID NOT NULL REFERENCES utilisateur(id),

  -- Snapshot données client (immuable après émission)
  client_nom VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_adresse TEXT,

  -- Snapshot données entreprise (immuable après émission)
  entreprise_nom VARCHAR(255) NOT NULL DEFAULT 'Jana Distribution',
  entreprise_siret VARCHAR(20),
  entreprise_tva_numero VARCHAR(20),
  entreprise_adresse TEXT,

  -- Montants
  total_ht NUMERIC(10,2) NOT NULL,
  total_tva NUMERIC(10,2) NOT NULL,
  total_ttc NUMERIC(10,2) NOT NULL,

  -- Statut
  statut VARCHAR(20) NOT NULL DEFAULT 'EMISE' CHECK (statut IN ('EMISE', 'ANNULEE')),
  avoir_id UUID REFERENCES facture(id),

  -- Dates
  date_emission TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table lignes de facture
CREATE TABLE IF NOT EXISTS facture_ligne (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facture_id UUID NOT NULL REFERENCES facture(id) ON DELETE CASCADE,
  produit_nom VARCHAR(255) NOT NULL,
  produit_ref VARCHAR(100),
  quantite INTEGER NOT NULL,
  prix_unitaire_ht NUMERIC(10,2) NOT NULL,
  taux_tva NUMERIC(4,2) NOT NULL,
  montant_ht NUMERIC(10,2) NOT NULL,
  montant_tva NUMERIC(10,2) NOT NULL,
  montant_ttc NUMERIC(10,2) NOT NULL
);

-- Séquence de numérotation par année
CREATE SEQUENCE IF NOT EXISTS facture_seq START 1;

CREATE INDEX IF NOT EXISTS idx_facture_commande ON facture(commande_id);
CREATE INDEX IF NOT EXISTS idx_facture_utilisateur ON facture(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_facture_numero ON facture(numero);
CREATE INDEX IF NOT EXISTS idx_facture_date ON facture(date_emission DESC);

COMMIT;
