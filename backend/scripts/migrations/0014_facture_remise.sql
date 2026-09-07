-- Migration 0014 : trace la remise (code promo) appliquee sur un devis/facture
-- Retour de test (T16-12, 2026-09-07) : le total HT/TVA/TTC d'un devis/facture
-- ignorait completement commande.montant_rabais, produisant un montant
-- different de celui reellement du par le client (commande.total_ttc).
-- Colonnes ajoutees en snapshot immuable (meme logique que client_nom/
-- entreprise_nom deja sur cette table) pour que le PDF puisse afficher la
-- remise appliquee sans dependre d'une jointure vers commande/code_promo
-- (qui peuvent evoluer apres emission du document).

ALTER TABLE facture ADD COLUMN IF NOT EXISTS remise_montant NUMERIC(10,2);
ALTER TABLE facture ADD COLUMN IF NOT EXISTS remise_code VARCHAR(50);
