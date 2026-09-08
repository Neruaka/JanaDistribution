-- Migration 0017 : corrige les cles de configuration livraison (T16-02)
-- La migration 0006 a seme les cles livraison_mode / livraison_tarif_km /
-- livraison_rayon_max_km, mais le code (settings.service.js) lit et ecrit
-- livraison_mode_calcul / livraison_prix_par_km / livraison_distance_max_km
-- depuis le debut - un decalage de nommage jamais corrige dans la migration
-- d'origine. Resultat : ces cles sont invisibles pour le code, qui retombe
-- silencieusement sur le mode FIXE par defaut malgre livraison_mode=DISTANCE
-- en base. La production a ete corrigee au fil du temps via l'interface
-- admin (upsert sur les bonnes cles) mais un nouvel environnement (local
-- dev via init.sql, ou un futur redeploiement) repart avec les mauvaises
-- cles. Cette migration aligne toute base sur l'etat reel de production
-- (verifie en direct le 2026-09-08) et supprime les cles mortes.
--
-- Egalement ajoute livraison_depart_lat/lng (coordonnees du point de
-- depart pour le calcul de distance Haversine), presentes en production
-- mais absentes de tout fichier de ce depot (ajoutees manuellement via
-- l'admin a un moment non documente).

BEGIN;

INSERT INTO configuration (cle, valeur, type, categorie, description) VALUES
  ('livraison_mode_calcul', 'DISTANCE', 'string', 'livraison', 'Mode de calcul des frais de livraison'),
  ('livraison_prix_par_km', '0.80', 'number', 'livraison', 'Tarif par kilomètre en euros'),
  ('livraison_distance_max_km', '80', 'number', 'livraison', 'Distance maximale de livraison en km (0 = illimitée)'),
  ('livraison_depart_lat', '48.860647', 'number', 'livraison', 'Latitude du point de départ (calcul Haversine)'),
  ('livraison_depart_lng', '2.34371', 'number', 'livraison', 'Longitude du point de départ (calcul Haversine)')
ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur;

DELETE FROM configuration WHERE cle IN (
  'livraison_mode', 'livraison_tarif_km', 'livraison_rayon_max_km', 'livraison_franco_seuil'
);

COMMIT;
