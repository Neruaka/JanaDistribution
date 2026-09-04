-- =============================================
-- MIGRATION : Frais de livraison par distance
-- =============================================
-- Script auto-suffisant : crée la table configuration si elle n'existe pas,
-- garantit la présence des paramètres "livraison" de base, puis ajoute les
-- nouveaux paramètres pour le calcul des frais selon la distance Haversine
-- entre le point de départ (adresse du site) et l'adresse de livraison.
--
-- IMPORTANT : ce script ne crée QUE la table configuration. Si la base est
-- complètement vide, il faut aussi exécuter backend/scripts/init.sql pour
-- les autres tables (utilisateur, produit, commande, ...).
--
-- Idempotent : peut être exécuté plusieurs fois sans erreur.
-- =============================================

-- 1. Table configuration (si absente)
CREATE TABLE IF NOT EXISTS configuration (
  cle VARCHAR(100) PRIMARY KEY,
  valeur TEXT,
  type VARCHAR(20) NOT NULL DEFAULT 'string',
  categorie VARCHAR(50) NOT NULL,
  description TEXT,
  date_modification TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_configuration_categorie ON configuration(categorie);

-- 2. Paramètres livraison de base (si absents)
-- La catégorie en BDD est 'livraison' (comme dans init.sql). Le mapping
-- vers le nom 'delivery' attendu par le frontend est fait par le backend.
INSERT INTO configuration (cle, valeur, type, categorie, description) VALUES
  ('livraison_frais_standard',       '15',  'number', 'livraison', 'Frais de livraison standard en euros'),
  ('livraison_seuil_franco',         '150', 'number', 'livraison', 'Seuil franco de port en euros'),
  ('livraison_delai_min',            '2',   'number', 'livraison', 'Délai minimum de livraison en jours'),
  ('livraison_delai_max',            '5',   'number', 'livraison', 'Délai maximum de livraison en jours'),
  ('livraison_zones',                'France métropolitaine', 'string', 'livraison', 'Zones de livraison'),
  ('livraison_message_indisponible', '',    'string', 'livraison', 'Message si livraison indisponible')
ON CONFLICT (cle) DO NOTHING;

-- 3. Nouveaux paramètres pour le calcul par distance
INSERT INTO configuration (cle, valeur, type, categorie, description) VALUES
  ('livraison_mode_calcul',     'FIXE', 'string', 'livraison', 'Mode de calcul : FIXE ou DISTANCE'),
  ('livraison_prix_par_km',     '0.80', 'number', 'livraison', 'Tarif au kilomètre (€/km) si mode DISTANCE'),
  ('livraison_frais_base',      '5',    'number', 'livraison', 'Frais fixes ajoutés au prix par km (€)'),
  ('livraison_distance_max_km', '200',  'number', 'livraison', 'Distance maximale livrable en km (0 = illimité)'),
  ('livraison_depart_lat',      '',     'string', 'livraison', 'Latitude du point de départ (cache géocodage)'),
  ('livraison_depart_lng',      '',     'string', 'livraison', 'Longitude du point de départ (cache géocodage)')
ON CONFLICT (cle) DO NOTHING;

-- 4. Vérification
SELECT cle, valeur, type, categorie FROM configuration
WHERE categorie = 'livraison'
ORDER BY cle;
