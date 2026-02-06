-- ============================================
-- DATABASE SETUP SCRIPT - Jana Distribution
-- ============================================
-- Exécuter avec: psql -U postgres -d jana_distribution -f init.sql
-- Ou via Docker: docker exec -i postgres psql -U postgres -d jana_distribution < init.sql
-- ============================================

-- Extension pour les UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- SUPPRESSION DES TABLES EXISTANTES (reset)
-- ============================================
DROP TABLE IF EXISTS ligne_commande CASCADE;
DROP TABLE IF EXISTS commande CASCADE;
DROP TABLE IF EXISTS ligne_panier CASCADE;
DROP TABLE IF EXISTS panier CASCADE;
DROP TABLE IF EXISTS produit CASCADE;
DROP TABLE IF EXISTS categorie CASCADE;
DROP TABLE IF EXISTS adresse CASCADE;
DROP TABLE IF EXISTS configuration CASCADE;
DROP TABLE IF EXISTS utilisateur CASCADE;

-- Suppression des types existants
DROP TYPE IF EXISTS role_utilisateur CASCADE;
DROP TYPE IF EXISTS type_client CASCADE;
DROP TYPE IF EXISTS statut_commande CASCADE;
DROP TYPE IF EXISTS mode_paiement CASCADE;
DROP TYPE IF EXISTS type_adresse CASCADE;

-- Suppression séquence
DROP SEQUENCE IF EXISTS commande_numero_seq;

-- ============================================
-- ENUMS
-- ============================================

-- Rôles utilisateur
CREATE TYPE role_utilisateur AS ENUM ('CLIENT', 'ADMIN');

-- Types de client
CREATE TYPE type_client AS ENUM ('PARTICULIER', 'PROFESSIONNEL');

-- Statuts de commande
CREATE TYPE statut_commande AS ENUM (
  'EN_ATTENTE',
  'CONFIRMEE',
  'EN_PREPARATION',
  'EXPEDIEE',
  'LIVREE',
  'ANNULEE'
);

-- Modes de paiement
CREATE TYPE mode_paiement AS ENUM ('CARTE', 'VIREMENT', 'ESPECES', 'CHEQUE');

-- Types d'adresse
CREATE TYPE type_adresse AS ENUM ('LIVRAISON', 'FACTURATION');

-- ============================================
-- TABLE: utilisateur
-- ============================================
CREATE TABLE utilisateur (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  mot_de_passe_hash VARCHAR(255) NOT NULL,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  telephone VARCHAR(20),
  role role_utilisateur NOT NULL DEFAULT 'CLIENT',
  type_client type_client NOT NULL DEFAULT 'PARTICULIER',
  siret VARCHAR(14),
  raison_sociale VARCHAR(255),
  numero_tva VARCHAR(20),
  accepte_cgu BOOLEAN NOT NULL DEFAULT false,
  accepte_newsletter BOOLEAN NOT NULL DEFAULT false,
  notifications_commandes BOOLEAN NOT NULL DEFAULT true,
  est_actif BOOLEAN NOT NULL DEFAULT true,
  reset_token VARCHAR(255),
  reset_token_expiry TIMESTAMP,
  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  derniere_connexion TIMESTAMP
);

-- Index utilisateur
CREATE INDEX idx_utilisateur_email ON utilisateur(email);
CREATE INDEX idx_utilisateur_role ON utilisateur(role);
CREATE INDEX idx_utilisateur_type_client ON utilisateur(type_client);
CREATE INDEX idx_utilisateur_est_actif ON utilisateur(est_actif);
CREATE INDEX idx_utilisateur_reset_token ON utilisateur(reset_token) WHERE reset_token IS NOT NULL;

-- ============================================
-- TABLE: adresse
-- ============================================
CREATE TABLE adresse (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  utilisateur_id UUID NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
  type type_adresse NOT NULL DEFAULT 'LIVRAISON',
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  adresse VARCHAR(255) NOT NULL,
  complement VARCHAR(255),
  code_postal VARCHAR(10) NOT NULL,
  ville VARCHAR(100) NOT NULL,
  pays VARCHAR(100) NOT NULL DEFAULT 'France',
  telephone VARCHAR(20),
  est_defaut BOOLEAN NOT NULL DEFAULT false,
  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index adresse
CREATE INDEX idx_adresse_utilisateur_id ON adresse(utilisateur_id);
CREATE INDEX idx_adresse_type ON adresse(type);

-- ============================================
-- TABLE: categorie
-- ============================================
CREATE TABLE categorie (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  couleur VARCHAR(7) DEFAULT '#22C55E',
  icone VARCHAR(50),
  ordre INTEGER NOT NULL DEFAULT 0,
  est_actif BOOLEAN NOT NULL DEFAULT true,
  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index categorie
CREATE INDEX idx_categorie_slug ON categorie(slug);
CREATE INDEX idx_categorie_est_actif ON categorie(est_actif);
CREATE INDEX idx_categorie_ordre ON categorie(ordre);

-- ============================================
-- TABLE: produit
-- ============================================
CREATE TABLE produit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference VARCHAR(50) NOT NULL UNIQUE,
  nom VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  prix DECIMAL(10, 2) NOT NULL,
  prix_promo DECIMAL(10, 2),
  taux_tva DECIMAL(5, 2) NOT NULL DEFAULT 20.00,
  unite_mesure VARCHAR(20) NOT NULL DEFAULT 'piece',
  stock_quantite INTEGER NOT NULL DEFAULT 0,
  stock_min_alerte INTEGER NOT NULL DEFAULT 10,
  image_url VARCHAR(500),
  labels TEXT[] DEFAULT '{}',
  origine VARCHAR(100),
  categorie_id UUID REFERENCES categorie(id) ON DELETE SET NULL,
  est_actif BOOLEAN NOT NULL DEFAULT true,
  est_mis_en_avant BOOLEAN NOT NULL DEFAULT false,
  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index produit
CREATE INDEX idx_produit_reference ON produit(reference);
CREATE INDEX idx_produit_slug ON produit(slug);
CREATE INDEX idx_produit_categorie_id ON produit(categorie_id);
CREATE INDEX idx_produit_est_actif ON produit(est_actif);
CREATE INDEX idx_produit_est_mis_en_avant ON produit(est_mis_en_avant);
CREATE INDEX idx_produit_prix ON produit(prix);
CREATE INDEX idx_produit_prix_promo ON produit(prix_promo) WHERE prix_promo IS NOT NULL;
CREATE INDEX idx_produit_stock ON produit(stock_quantite);
CREATE INDEX idx_produit_labels ON produit USING GIN(labels);

-- ============================================
-- TABLE: panier
-- ============================================
CREATE TABLE panier (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  utilisateur_id UUID REFERENCES utilisateur(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT panier_user_or_session CHECK (utilisateur_id IS NOT NULL OR session_id IS NOT NULL),
  CONSTRAINT panier_unique_utilisateur UNIQUE (utilisateur_id)
);

-- Index panier
CREATE INDEX idx_panier_session_id ON panier(session_id) WHERE session_id IS NOT NULL;

-- ============================================
-- TABLE: ligne_panier
-- ============================================
CREATE TABLE ligne_panier (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  panier_id UUID NOT NULL REFERENCES panier(id) ON DELETE CASCADE,
  produit_id UUID NOT NULL REFERENCES produit(id) ON DELETE CASCADE,
  quantite INTEGER NOT NULL DEFAULT 1 CHECK (quantite > 0),
  prix_unitaire DECIMAL(10, 2) NOT NULL,
  date_ajout TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(panier_id, produit_id)
);

-- Index ligne_panier
CREATE INDEX idx_ligne_panier_panier_id ON ligne_panier(panier_id);
CREATE INDEX idx_ligne_panier_produit_id ON ligne_panier(produit_id);

-- ============================================
-- SEQUENCE: numéro de commande
-- ============================================
CREATE SEQUENCE commande_numero_seq START 1;

-- ============================================
-- TABLE: commande
-- ============================================
CREATE TABLE commande (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_commande VARCHAR(20) NOT NULL UNIQUE,
  utilisateur_id UUID REFERENCES utilisateur(id) ON DELETE SET NULL,
  statut statut_commande NOT NULL DEFAULT 'EN_ATTENTE',
  date_commande TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_ht DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_tva DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_ttc DECIMAL(10, 2) NOT NULL DEFAULT 0,
  adresse_livraison JSONB NOT NULL,
  adresse_facturation JSONB,
  mode_paiement mode_paiement NOT NULL DEFAULT 'CARTE',
  frais_livraison DECIMAL(10, 2) NOT NULL DEFAULT 0,
  instructions_livraison TEXT,
  date_modification TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index commande
CREATE INDEX idx_commande_numero ON commande(numero_commande);
CREATE INDEX idx_commande_utilisateur_id ON commande(utilisateur_id);
CREATE INDEX idx_commande_statut ON commande(statut);
CREATE INDEX idx_commande_date ON commande(date_commande);

-- ============================================
-- TABLE: ligne_commande
-- ============================================
CREATE TABLE ligne_commande (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commande_id UUID NOT NULL REFERENCES commande(id) ON DELETE CASCADE,
  produit_id UUID REFERENCES produit(id) ON DELETE SET NULL,
  quantite INTEGER NOT NULL CHECK (quantite > 0),
  prix_unitaire_ht DECIMAL(10, 2) NOT NULL,
  taux_tva DECIMAL(5, 2) NOT NULL DEFAULT 20.00,
  total_ht DECIMAL(10, 2) NOT NULL,
  total_ttc DECIMAL(10, 2) NOT NULL,
  nom_produit VARCHAR(255) NOT NULL
);

-- Index ligne_commande
CREATE INDEX idx_ligne_commande_commande_id ON ligne_commande(commande_id);
CREATE INDEX idx_ligne_commande_produit_id ON ligne_commande(produit_id);

-- ============================================
-- TABLE: configuration
-- ============================================
CREATE TABLE configuration (
  cle VARCHAR(100) PRIMARY KEY,
  valeur TEXT,
  type VARCHAR(20) NOT NULL DEFAULT 'string',
  categorie VARCHAR(50) NOT NULL,
  description TEXT,
  date_modification TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index configuration
CREATE INDEX idx_configuration_categorie ON configuration(categorie);

-- ============================================
-- DONNÉES INITIALES: configuration
-- ============================================
INSERT INTO configuration (cle, valeur, type, categorie, description) VALUES
-- Site
('site_nom', 'Jana Distribution', 'string', 'site', 'Nom du site'),
('site_description', 'Produits alimentaires de qualité', 'string', 'site', 'Description du site'),
('site_email', 'contact@jana-distribution.fr', 'string', 'site', 'Email de contact'),
('site_telephone', '+33 1 23 45 67 89', 'string', 'site', 'Téléphone de contact'),
('site_adresse', '123 Rue du Commerce', 'string', 'site', 'Adresse'),
('site_code_postal', '75001', 'string', 'site', 'Code postal'),
('site_ville', 'Paris', 'string', 'site', 'Ville'),
('site_siret', '123 456 789 00012', 'string', 'site', 'Numéro SIRET'),

-- Livraison
('livraison_frais_standard', '5.90', 'number', 'livraison', 'Frais de livraison standard'),
('livraison_seuil_franco', '50', 'number', 'livraison', 'Montant minimum pour livraison gratuite'),
('livraison_delai_min', '2', 'number', 'livraison', 'Délai minimum de livraison (jours)'),
('livraison_delai_max', '5', 'number', 'livraison', 'Délai maximum de livraison (jours)'),

-- Commande
('commande_montant_min', '15', 'number', 'commande', 'Montant minimum de commande'),
('commande_produits_par_page', '12', 'number', 'commande', 'Nombre de produits par page');

-- ============================================
-- FONCTIONS UTILITAIRES
-- ============================================

-- Fonction pour mettre à jour date_modification automatiquement
CREATE OR REPLACE FUNCTION update_date_modification()
RETURNS TRIGGER AS $$
BEGIN
  NEW.date_modification = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour date_modification
CREATE TRIGGER trigger_utilisateur_modification
  BEFORE UPDATE ON utilisateur
  FOR EACH ROW EXECUTE FUNCTION update_date_modification();

CREATE TRIGGER trigger_produit_modification
  BEFORE UPDATE ON produit
  FOR EACH ROW EXECUTE FUNCTION update_date_modification();

CREATE TRIGGER trigger_panier_modification
  BEFORE UPDATE ON panier
  FOR EACH ROW EXECUTE FUNCTION update_date_modification();

CREATE TRIGGER trigger_commande_modification
  BEFORE UPDATE ON commande
  FOR EACH ROW EXECUTE FUNCTION update_date_modification();

CREATE TRIGGER trigger_configuration_modification
  BEFORE UPDATE ON configuration
  FOR EACH ROW EXECUTE FUNCTION update_date_modification();

-- ============================================
-- MESSAGE DE FIN
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ BASE DE DONNÉES INITIALISÉE AVEC SUCCÈS !';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables créées:';
  RAISE NOTICE '  • utilisateur';
  RAISE NOTICE '  • adresse';
  RAISE NOTICE '  • categorie';
  RAISE NOTICE '  • produit';
  RAISE NOTICE '  • panier / ligne_panier';
  RAISE NOTICE '  • commande / ligne_commande';
  RAISE NOTICE '  • configuration';
  RAISE NOTICE '';
  RAISE NOTICE 'Prochaine étape: node scripts/seed.js';
  RAISE NOTICE '';
END $$;
