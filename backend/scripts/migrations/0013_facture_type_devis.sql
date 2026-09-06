-- Migration 0013 : ajoute le type DEVIS à la contrainte facture.type
-- Retour de test (2026-09-06) : un devis doit etre genere immediatement a la
-- creation de commande (avant toute confirmation/paiement), distinct de la
-- FACTURE reelle (generee plus tard) et de l'AVOIR (remboursement).
-- Reutilise la table facture existante plutot qu'une nouvelle table : memes
-- colonnes (snapshot client/entreprise, lignes, montants), meme sequence de
-- numerotation (getNextNumber('DEV') -> DEV-YYYY-NNNN, comme AV- pour les
-- avoirs) - voir backend/src/services/invoice.service.js#generateQuoteForOrder.

ALTER TABLE facture DROP CONSTRAINT IF EXISTS facture_type_check;
ALTER TABLE facture ADD CONSTRAINT facture_type_check CHECK (type IN ('FACTURE', 'AVOIR', 'DEVIS'));
