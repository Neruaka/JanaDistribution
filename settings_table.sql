-- =============================================
-- TABLE CONFIGURATION / SETTINGS
-- =============================================
-- À exécuter dans ta base de données PostgreSQL
-- Cette table stocke les paramètres du site de manière clé/valeur

CREATE TABLE IF NOT EXISTS configuration (
    id SERIAL PRIMARY KEY,
    cle VARCHAR(100) UNIQUE NOT NULL,
    valeur TEXT,
    type VARCHAR(20) DEFAULT 'string', -- string, number, boolean, json
    categorie VARCHAR(50) NOT NULL,    -- general, delivery, orders, emails, security
    description VARCHAR(255),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour recherche rapide par catégorie
CREATE INDEX IF NOT EXISTS idx_configuration_categorie ON configuration(categorie);

-- =============================================
-- DONNÉES INITIALES
-- =============================================

-- Catégorie: GENERAL (Informations générales)
INSERT INTO configuration (cle, valeur, type, categorie, description) VALUES
('site_nom', 'Jana Distribution', 'string', 'general', 'Nom du site'),
('site_description', 'Grossiste alimentaire pour professionnels et particuliers', 'string', 'general', 'Description du site'),
('site_email', 'contact@jana-distribution.fr', 'string', 'general', 'Email de contact'),
('site_telephone', '01 23 45 67 89', 'string', 'general', 'Téléphone'),
('site_adresse', '123 Avenue des Grossistes', 'string', 'general', 'Adresse'),
('site_code_postal', '75001', 'string', 'general', 'Code postal'),
('site_ville', 'Paris', 'string', 'general', 'Ville'),
('site_siret', '123 456 789 00012', 'string', 'general', 'Numéro SIRET'),
('site_tva_intra', 'FR 12 345678901', 'string', 'general', 'N° TVA Intracommunautaire')
ON CONFLICT (cle) DO NOTHING;

-- Catégorie: DELIVERY (Livraison)
INSERT INTO configuration (cle, valeur, type, categorie, description) VALUES
('livraison_frais_standard', '15', 'number', 'delivery', 'Frais de livraison standard en euros'),
('livraison_seuil_franco', '150', 'number', 'delivery', 'Seuil franco de port en euros'),
('livraison_delai_min', '2', 'number', 'delivery', 'Délai minimum de livraison en jours'),
('livraison_delai_max', '5', 'number', 'delivery', 'Délai maximum de livraison en jours'),
('livraison_zones', 'France métropolitaine', 'string', 'delivery', 'Zones de livraison'),
('livraison_message_indisponible', 'Livraison temporairement indisponible', 'string', 'delivery', 'Message si livraison indisponible')
ON CONFLICT (cle) DO NOTHING;

-- Catégorie: ORDERS (Commandes)
INSERT INTO configuration (cle, valeur, type, categorie, description) VALUES
('commande_montant_min', '20', 'number', 'orders', 'Montant minimum de commande en euros'),
('commande_tva_defaut', '5.5', 'number', 'orders', 'Taux de TVA par défaut en %'),
('commande_stock_alerte', '10', 'number', 'orders', 'Seuil d''alerte stock'),
('commande_produits_par_page', '12', 'number', 'orders', 'Nombre de produits par page'),
('commande_autoriser_sans_stock', 'false', 'boolean', 'orders', 'Autoriser les commandes sans stock'),
('commande_email_confirmation', 'true', 'boolean', 'orders', 'Envoyer email de confirmation'),
('commande_email_expedition', 'true', 'boolean', 'orders', 'Envoyer email d''expédition')
ON CONFLICT (cle) DO NOTHING;

-- Catégorie: EMAILS
INSERT INTO configuration (cle, valeur, type, categorie, description) VALUES
('email_expediteur', 'noreply@jana-distribution.fr', 'string', 'emails', 'Adresse email expéditeur'),
('email_nom_expediteur', 'Jana Distribution', 'string', 'emails', 'Nom affiché de l''expéditeur'),
('email_copie_admin', 'true', 'boolean', 'emails', 'Envoyer copie à l''admin'),
('email_admin', 'admin@jana-distribution.fr', 'string', 'emails', 'Email admin pour les copies'),
('email_signature', 'L''équipe Jana Distribution', 'string', 'emails', 'Signature des emails')
ON CONFLICT (cle) DO NOTHING;

-- Catégorie: SECURITY
INSERT INTO configuration (cle, valeur, type, categorie, description) VALUES
('security_derniere_sauvegarde', NULL, 'string', 'security', 'Date de dernière sauvegarde'),
('security_maintenance_mode', 'false', 'boolean', 'security', 'Mode maintenance activé')
ON CONFLICT (cle) DO NOTHING;

-- =============================================
-- FONCTION TRIGGER POUR MAJ date_modification
-- =============================================
CREATE OR REPLACE FUNCTION update_configuration_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_modification = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS trigger_configuration_timestamp ON configuration;
CREATE TRIGGER trigger_configuration_timestamp
    BEFORE UPDATE ON configuration
    FOR EACH ROW
    EXECUTE FUNCTION update_configuration_timestamp();

-- =============================================
-- VÉRIFICATION
-- =============================================
SELECT categorie, COUNT(*) as nb_settings 
FROM configuration 
GROUP BY categorie 
ORDER BY categorie;
