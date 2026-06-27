-- T4-02 / T4-04: Remboursements — nouveaux statuts + colonnes commande
-- Dépendances: 0001_add_stripe_payment.sql

-- Ajouter les statuts de remboursement à l'ENUM
ALTER TYPE statut_commande ADD VALUE IF NOT EXISTS 'PARTIELLEMENT_REMBOURSE';
ALTER TYPE statut_commande ADD VALUE IF NOT EXISTS 'REMBOURSE';

-- Ajouter les colonnes de suivi remboursement sur la commande
ALTER TABLE commande ADD COLUMN IF NOT EXISTS stripe_refund_id VARCHAR(255);
ALTER TABLE commande ADD COLUMN IF NOT EXISTS montant_rembourse NUMERIC(10,2) NOT NULL DEFAULT 0;
