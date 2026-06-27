BEGIN;

-- Mise à jour des paramètres de livraison selon décision propriétaire (2026-06-27)
-- Mode DISTANCE, région parisienne, rayon 80km
INSERT INTO configuration (cle, valeur, description) VALUES
  ('livraison_mode', 'DISTANCE', 'Mode de calcul des frais de livraison')
ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur;

INSERT INTO configuration (cle, valeur, description) VALUES
  ('livraison_frais_base', '5.00', 'Frais de base en euros')
ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur;

INSERT INTO configuration (cle, valeur, description) VALUES
  ('livraison_tarif_km', '0.80', 'Tarif par kilomètre en euros')
ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur;

INSERT INTO configuration (cle, valeur, description) VALUES
  ('livraison_franco_seuil', '80.00', 'Montant au-delà duquel la livraison est gratuite')
ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur;

INSERT INTO configuration (cle, valeur, description) VALUES
  ('livraison_rayon_max_km', '80', 'Distance maximale de livraison en km (0 = illimitée)')
ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur;

COMMIT;
