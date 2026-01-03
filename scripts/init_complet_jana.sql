-- ============================================
-- SCRIPT COMPLET - JANA DISTRIBUTION
-- Structure + Reset Token + Données de test
-- 
-- Exécution : psql -U postgres -f init_complet.sql
-- ============================================

-- Création de la base si elle n'existe pas
-- (à exécuter séparément si besoin)
-- CREATE DATABASE jana_distribution;

-- Se connecter à la base
\c jana_distribution;

-- Extension pour les UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- SUPPRESSION DES TABLES EXISTANTES
-- ============================================

DROP TABLE IF EXISTS ligne_commande CASCADE;
DROP TABLE IF EXISTS commande CASCADE;
DROP TABLE IF EXISTS ligne_panier CASCADE;
DROP TABLE IF EXISTS panier CASCADE;
DROP TABLE IF EXISTS produit CASCADE;
DROP TABLE IF EXISTS categorie CASCADE;
DROP TABLE IF EXISTS adresse CASCADE;
DROP TABLE IF EXISTS utilisateur CASCADE;

-- Suppression des types
DROP TYPE IF EXISTS role_utilisateur CASCADE;
DROP TYPE IF EXISTS type_client CASCADE;
DROP TYPE IF EXISTS statut_commande CASCADE;
DROP TYPE IF EXISTS type_adresse CASCADE;

-- ============================================
-- TYPES ÉNUMÉRÉS
-- ============================================

CREATE TYPE role_utilisateur AS ENUM ('CLIENT', 'ADMIN');
CREATE TYPE type_client AS ENUM ('PARTICULIER', 'PROFESSIONNEL');
CREATE TYPE statut_commande AS ENUM ('EN_ATTENTE', 'CONFIRMEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE', 'ANNULEE');
CREATE TYPE type_adresse AS ENUM ('LIVRAISON', 'FACTURATION');

-- ============================================
-- TABLE: UTILISATEUR (avec reset_token)
-- ============================================

CREATE TABLE utilisateur (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    mot_de_passe_hash VARCHAR(255) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    telephone VARCHAR(20),
    role role_utilisateur NOT NULL DEFAULT 'CLIENT',
    type_client type_client DEFAULT 'PARTICULIER',
    est_actif BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Champs spécifiques Pro
    siret VARCHAR(14),
    raison_sociale VARCHAR(255),
    numero_tva VARCHAR(20),
    
    -- CGU
    accepte_cgu BOOLEAN DEFAULT FALSE,
    accepte_newsletter BOOLEAN DEFAULT FALSE,
    
    -- ✅ Reset Password (Nodemailer)
    reset_token VARCHAR(64),
    reset_token_expiry TIMESTAMP WITH TIME ZONE,
    
    -- Métadonnées
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    derniere_connexion TIMESTAMP WITH TIME ZONE,
    
    -- Contrainte SIRET pour pro
    CONSTRAINT chk_siret_professionnel CHECK (
        (type_client = 'PROFESSIONNEL' AND siret IS NOT NULL) OR
        (type_client = 'PARTICULIER')
    )
);

CREATE INDEX idx_utilisateur_email ON utilisateur(email);
CREATE INDEX idx_utilisateur_role ON utilisateur(role);
CREATE INDEX idx_utilisateur_reset_token ON utilisateur(reset_token) WHERE reset_token IS NOT NULL;

-- ============================================
-- TABLE: ADRESSE
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
    est_defaut BOOLEAN NOT NULL DEFAULT FALSE,
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_adresse_utilisateur ON adresse(utilisateur_id);

-- ============================================
-- TABLE: CATEGORIE
-- ============================================

CREATE TABLE categorie (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    couleur VARCHAR(7) DEFAULT '#4CAF50',
    icone VARCHAR(50),
    ordre INTEGER DEFAULT 0,
    est_actif BOOLEAN NOT NULL DEFAULT TRUE,
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categorie_slug ON categorie(slug);

-- ============================================
-- TABLE: PRODUIT
-- ============================================

CREATE TABLE produit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    categorie_id UUID NOT NULL REFERENCES categorie(id),
    reference VARCHAR(50) NOT NULL UNIQUE,
    nom VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    prix DECIMAL(10, 2) NOT NULL CHECK (prix >= 0),
    prix_promo DECIMAL(10, 2) CHECK (prix_promo IS NULL OR prix_promo >= 0),
    taux_tva DECIMAL(4, 2) NOT NULL DEFAULT 5.50,
    unite_mesure VARCHAR(20) NOT NULL DEFAULT 'kg',
    stock_quantite INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantite >= 0),
    stock_min_alerte INTEGER NOT NULL DEFAULT 10,
    image_url VARCHAR(500),
    labels TEXT[] DEFAULT '{}',
    origine VARCHAR(100),
    est_actif BOOLEAN NOT NULL DEFAULT TRUE,
    est_mis_en_avant BOOLEAN NOT NULL DEFAULT FALSE,
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_produit_categorie ON produit(categorie_id);
CREATE INDEX idx_produit_slug ON produit(slug);
CREATE INDEX idx_produit_reference ON produit(reference);
CREATE INDEX idx_produit_actif ON produit(est_actif);

-- ============================================
-- TABLE: PANIER
-- ============================================

CREATE TABLE panier (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utilisateur_id UUID REFERENCES utilisateur(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_panier_owner CHECK (
        utilisateur_id IS NOT NULL OR session_id IS NOT NULL
    )
);

CREATE INDEX idx_panier_utilisateur ON panier(utilisateur_id);
CREATE INDEX idx_panier_session ON panier(session_id);

-- ============================================
-- TABLE: LIGNE_PANIER
-- ============================================

CREATE TABLE ligne_panier (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    panier_id UUID NOT NULL REFERENCES panier(id) ON DELETE CASCADE,
    produit_id UUID NOT NULL REFERENCES produit(id),
    quantite INTEGER NOT NULL CHECK (quantite >= 1),
    prix_unitaire DECIMAL(10, 2) NOT NULL,
    date_ajout TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(panier_id, produit_id)
);

CREATE INDEX idx_ligne_panier_panier ON ligne_panier(panier_id);

-- ============================================
-- TABLE: COMMANDE
-- ============================================

CREATE TABLE commande (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utilisateur_id UUID NOT NULL REFERENCES utilisateur(id),
    numero_commande VARCHAR(20) NOT NULL UNIQUE,
    statut statut_commande NOT NULL DEFAULT 'EN_ATTENTE',
    date_commande TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Totaux
    total_ht DECIMAL(10, 2) NOT NULL,
    total_tva DECIMAL(10, 2) NOT NULL,
    total_ttc DECIMAL(10, 2) NOT NULL,
    
    -- Frais livraison
    frais_livraison DECIMAL(10, 2) DEFAULT 0,
    
    -- Adresse (snapshot JSON)
    adresse_livraison JSONB NOT NULL,
    adresse_facturation JSONB,
    instructions_livraison TEXT,
    
    -- Mode paiement
    mode_paiement VARCHAR(50) DEFAULT 'CARTE',
    
    date_modification TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_commande_utilisateur ON commande(utilisateur_id);
CREATE INDEX idx_commande_numero ON commande(numero_commande);
CREATE INDEX idx_commande_statut ON commande(statut);
CREATE INDEX idx_commande_date ON commande(date_commande);

-- ============================================
-- TABLE: LIGNE_COMMANDE
-- ============================================

CREATE TABLE ligne_commande (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commande_id UUID NOT NULL REFERENCES commande(id) ON DELETE CASCADE,
    produit_id UUID REFERENCES produit(id),
    quantite INTEGER NOT NULL CHECK (quantite >= 1),
    prix_unitaire_ht DECIMAL(10, 2) NOT NULL,
    taux_tva DECIMAL(4, 2) NOT NULL,
    nom_produit VARCHAR(255) NOT NULL
);

CREATE INDEX idx_ligne_commande_commande ON ligne_commande(commande_id);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_date_modification()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_modification = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_utilisateur_modification
    BEFORE UPDATE ON utilisateur
    FOR EACH ROW EXECUTE FUNCTION update_date_modification();

CREATE TRIGGER trg_produit_modification
    BEFORE UPDATE ON produit
    FOR EACH ROW EXECUTE FUNCTION update_date_modification();

CREATE TRIGGER trg_panier_modification
    BEFORE UPDATE ON panier
    FOR EACH ROW EXECUTE FUNCTION update_date_modification();

CREATE TRIGGER trg_commande_modification
    BEFORE UPDATE ON commande
    FOR EACH ROW EXECUTE FUNCTION update_date_modification();

-- ============================================
-- SEED : UTILISATEURS
-- ============================================
-- Mots de passe hashés avec bcrypt (12 rounds)
-- Admin123!, Client123!, Pro123!

INSERT INTO utilisateur (email, mot_de_passe_hash, nom, prenom, role, type_client, est_actif, accepte_cgu)
VALUES (
    'admin@jana-distribution.fr',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.vjU6WfzMr2CJW.',
    'Admin',
    'Jana',
    'ADMIN',
    'PARTICULIER',
    true,
    true
);

INSERT INTO utilisateur (email, mot_de_passe_hash, nom, prenom, telephone, role, type_client, est_actif, accepte_cgu, accepte_newsletter)
VALUES (
    'client@test.fr',
    '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Dupont',
    'Jean',
    '0612345678',
    'CLIENT',
    'PARTICULIER',
    true,
    true,
    true
);

INSERT INTO utilisateur (email, mot_de_passe_hash, nom, prenom, telephone, role, type_client, siret, raison_sociale, est_actif, accepte_cgu)
VALUES (
    'pro@restaurant.fr',
    '$2b$12$bPTJLnfMKfPCYm6Gc8HUfefjTR0PXsTPGthGp0w3XZMzH0F2Mfkzm',
    'Martin',
    'Sophie',
    '0698765432',
    'CLIENT',
    'PROFESSIONNEL',
    '12345678901234',
    'Restaurant Le Gourmet',
    true,
    true
);

-- ============================================
-- SEED : ADRESSES
-- ============================================

INSERT INTO adresse (utilisateur_id, type, nom, prenom, adresse, code_postal, ville, pays, telephone, est_defaut)
SELECT id, 'LIVRAISON', 'Dupont', 'Jean', '15 rue de la Paix', '75001', 'Paris', 'France', '0612345678', true
FROM utilisateur WHERE email = 'client@test.fr';

INSERT INTO adresse (utilisateur_id, type, nom, prenom, adresse, code_postal, ville, pays, telephone, est_defaut)
SELECT id, 'LIVRAISON', 'Restaurant Le Gourmet', 'Sophie Martin', '42 avenue des Champs-Élysées', '75008', 'Paris', 'France', '0698765432', true
FROM utilisateur WHERE email = 'pro@restaurant.fr';

-- ============================================
-- SEED : CATÉGORIES
-- ============================================

INSERT INTO categorie (nom, slug, description, couleur, icone, ordre, est_actif) VALUES
('Fruits & Légumes', 'fruits-legumes', 'Fruits et légumes frais de saison', '#22C55E', '🥬', 1, true),
('Produits Laitiers', 'produits-laitiers', 'Fromages, yaourts, lait et crème', '#3B82F6', '🧀', 2, true),
('Boucherie', 'boucherie', 'Viandes fraîches et charcuterie', '#EF4444', '🥩', 3, true),
('Poissonnerie', 'poissonnerie', 'Poissons et fruits de mer', '#06B6D4', '🐟', 4, true),
('Épicerie', 'epicerie', 'Produits d''épicerie fine', '#F59E0B', '🫒', 5, true),
('Boulangerie', 'boulangerie', 'Pains, viennoiseries et pâtisseries', '#D97706', '🥖', 6, true);

-- ============================================
-- SEED : PRODUITS
-- ============================================

-- Fruits & Légumes
INSERT INTO produit (categorie_id, reference, nom, slug, description, prix, prix_promo, taux_tva, unite_mesure, stock_quantite, stock_min_alerte, labels, origine, est_actif, est_mis_en_avant)
SELECT c.id, 'FRL-001', 'Pommes Gala Bio', 'pommes-gala-bio', 'Pommes Gala Bio de qualité premium, sélectionné avec soin par nos équipes. Origine France.', 3.50, NULL, 5.50, 'kg', 150, 10, ARRAY['BIO', 'LOCAL'], 'France', true, true
FROM categorie c WHERE c.slug = 'fruits-legumes';

INSERT INTO produit (categorie_id, reference, nom, slug, description, prix, prix_promo, taux_tva, unite_mesure, stock_quantite, stock_min_alerte, labels, origine, est_actif, est_mis_en_avant)
SELECT c.id, 'FRL-002', 'Tomates Cerises', 'tomates-cerises', 'Tomates Cerises de qualité premium, sélectionné avec soin par nos équipes. Origine France.', 4.90, NULL, 5.50, 'kg', 80, 10, ARRAY['LOCAL'], 'France', true, true
FROM categorie c WHERE c.slug = 'fruits-legumes';

INSERT INTO produit (categorie_id, reference, nom, slug, description, prix, prix_promo, taux_tva, unite_mesure, stock_quantite, stock_min_alerte, labels, origine, est_actif, est_mis_en_avant)
SELECT c.id, 'FRL-003', 'Bananes Bio', 'bananes-bio', 'Bananes Bio de qualité premium, sélectionné avec soin par nos équipes. Origine France.', 2.80, NULL, 5.50, 'kg', 200, 10, ARRAY['BIO'], 'France', true, true
FROM categorie c WHERE c.slug = 'fruits-legumes';

INSERT INTO produit (categorie_id, reference, nom, slug, description, prix, prix_promo, taux_tva, unite_mesure, stock_quantite, stock_min_alerte, labels, origine, est_actif, est_mis_en_avant)
SELECT c.id, 'FRL-004', 'Carottes de saison', 'carottes-de-saison', 'Carottes de saison de qualité premium, sélectionné avec soin par nos équipes. Origine France.', 1.90, NULL, 5.50, 'kg', 180, 10, ARRAY['LOCAL'], 'France', true, true
FROM categorie c WHERE c.slug = 'fruits-legumes';

INSERT INTO produit (categorie_id, reference, nom, slug, description, prix, prix_promo, taux_tva, unite_mesure, stock_quantite, stock_min_alerte, labels, origine, est_actif, est_mis_en_avant)
SELECT c.id, 'FRL-005', 'Fraises Gariguette', 'fraises-gariguette', 'Fraises Gariguette de qualité premium, sélectionné avec soin par nos équipes. Origine France.', 6.50, 5.20, 5.50, 'kg', 60, 10, ARRAY['LOCAL', 'PROMO'], 'France', true, true
FROM categorie c WHERE c.slug = 'fruits-legumes';

INSERT INTO produit (categorie_id, reference, nom, slug, description, prix, prix_promo, taux_tva, unite_mesure, stock_quantite, stock_min_alerte, labels, origine, est_actif, est_mis_en_avant)
SELECT c.id, 'FRL-006', 'Avocats', 'avocats', 'Avocats de qualité premium, sélectionné avec soin par nos équipes. Origine France.', 2.50, NULL, 5.50, 'piece', 100, 10, ARRAY[]::TEXT[], 'France', true, true
FROM categorie c WHERE c.slug = 'fruits-legumes';

INSERT INTO produit (categorie_id, reference, nom, slug, description, prix, prix_promo, taux_tva, unite_mesure, stock_quantite, stock_min_alerte, labels, origine, est_actif, est_mis_en_avant)
SELECT c.id, 'FRL-007', 'Citrons Bio', 'citrons-bio', 'Citrons Bio de qualité premium, sélectionné avec soin par nos équipes. Origine France.', 3.20, NULL, 5.50, 'kg', 90, 10, ARRAY['BIO'], 'France', true, true
FROM categorie c WHERE c.slug = 'fruits-legumes';

INSERT INTO produit (categorie_id, reference, nom, slug, description, prix, prix_promo, taux_tva, unite_mesure, stock_quantite, stock_min_alerte, labels, origine, est_actif, est_mis_en_avant)
SELECT c.id, 'FRL-008', 'Salade Batavia', 'salade-batavia', 'Salade Batavia de qualité premium, sélectionné avec soin par nos équipes. Origine France.', 1.50, NULL, 5.50, 'piece', 70, 10, ARRAY['LOCAL'], 'France', true, true
FROM categorie c WHERE c.slug = 'fruits-legumes';

-- Produits Laitiers
INSERT INTO produit (categorie_id, reference, nom, slug, description, prix, prix_promo, taux_tva, unite_mesure, stock_quantite, stock_min_alerte, labels, origine, est_actif, est_mis_en_avant)
SELECT c.id, 'LAI-001', 'Comté AOP 18 mois', 'comte-aop-18-mois', 'Comté AOP 18 mois de qualité premium, sélectionné avec soin par nos équipes. Origine France.', 28.00, NULL, 5.50, 'kg', 25, 10, ARRAY['AOP'], 'France', true, false
FROM categorie c WHERE c.slug = 'produits-laitiers';

INSERT INTO produit (categorie_id, reference, nom, slug, description, prix, prix_promo, taux_tva, unite_mesure, stock_quantite, stock_min_alerte, labels, origine, est_actif, est_mis_en_avant)
SELECT c.id, 'LAI-002', 'Beurre de Baratte', 'beurre-de-baratte', 'Beurre de Baratte de qualité premium, sélectionné avec soin par nos équipes. Origine France.', 6.50, NULL, 5.50, 'piece', 45, 10, ARRAY['LOCAL'], 'France', true, false
FROM categorie c WHERE c.slug = 'produits-laitiers';

INSERT INTO produit (categorie_id, reference, nom, slug, description, prix, prix_promo, taux_tva, unite_mesure, stock_quantite, stock_min_alerte, labels, origine, est_actif, est_mis_en_avant)
SELECT c.id, 'LAI-003', 'Yaourt Nature Bio x6', 'yaourt-nature-bio-x6', 'Yaourt Nature Bio x6 de qualité premium, sélectionné avec soin par nos équipes. Origine France.', 3.90, NULL, 5.50, 'piece', 80, 10, ARRAY['BIO'], 'France', true, false
FROM categorie c WHERE c.slug = 'produits-laitiers';

INSERT INTO produit (categorie_id, reference, nom, slug, description, prix, prix_promo, taux_tva, unite_mesure, stock_quantite, stock_min_alerte, labels, origine, est_actif, est_mis_en_avant)
SELECT c.id, 'LAI-004', 'Crème fraîche épaisse', 'creme-fraiche-epaisse', 'Crème fraîche épaisse de qualité premium, sélectionné avec soin par nos équipes. Origine France.', 2.80, NULL, 5.50, 'piece', 60, 10, ARRAY[]::TEXT[], 'France', true, false
FROM categorie c WHERE c.slug = 'produits-laitiers';

INSERT INTO produit (categorie_id, reference, nom, slug, description, prix, prix_promo, taux_tva, unite_mesure, stock_quantite, stock_min_alerte, labels, origine, est_actif, est_mis_en_avant)
SELECT c.id, 'LAI-005', 'Roquefort AOP', 'roquefort-aop', 'Roquefort AOP de qualité premium, sélectionné avec soin par nos équipes. Origine France.', 24.00, NULL, 5.50, 'kg', 20, 10, ARRAY['AOP'], 'France', true, false
FROM categorie c WHERE c.slug = 'produits-laitiers';

INSERT INTO produit (categorie_id, reference, nom, slug, description, prix, prix_promo, taux_tva, unite_mesure, stock_quantite, stock_min_alerte, labels, origine, est_actif, est_mis_en_avant)
SELECT c.id, 'LAI-006', 'Lait frais entier', 'lait-frais-entier', 'Lait frais entier de qualité premium, sélectionné avec soin par nos équipes. Origine France.', 1.80, NULL, 5.50, 'litre', 100, 10, ARRAY['LOCAL'], 'France', true, false
FROM categorie c WHERE c.slug = 'produits-laitiers';

-- Boucherie
INSERT INTO produit (categorie_id, reference, nom, slug, description, prix, prix_promo, taux_tva, unite_mesure, stock_quantite, stock_min_alerte, labels, origine, est_actif, est_mis_en_avant)
SELECT c.id, 'BOU-001', 'Entrecôte de bœuf', 'entrecote-de-boeuf', 'Entrecôte de bœuf de qualité premium, sélectionné avec soin par nos équipes. Origine France.', 32.00, NULL, 5.50, 'kg', 30, 10, ARRAY['LABEL_ROUGE'], 'France', true, false
FROM categorie c WHERE c.slug = 'boucherie';

INSERT INTO produit (categorie_id, reference, nom, slug, description, prix, prix_promo, taux_tva, unite_mesure, stock_quantite, stock_min_alerte, labels, origine, est_actif, est_mis_en_avant)
SELECT c.id, 'BOU-002', 'Poulet fermier', 'poulet-fermier', 'Poulet fermier de qualité premium, sélectionné avec soin par nos équipes. Origine France.', 12.50, NULL, 5.50, 'kg', 40, 10, ARRAY['LABEL_ROUGE', 'LOCAL'], 'France', true, false
FROM categorie c WHERE c.slug = 'boucherie';

INSERT INTO produit (categorie_id, reference, nom, slug, description, prix, prix_promo, taux_tva, unite_mesure, stock_quantite, stock_min_alerte, labels, origine, est_actif, est_mis_en_avant)
SELECT c.id, 'BOU-003', 'Côtelettes d''agneau', 'cotelettes-dagneau', 'Côtelettes d''agneau de qualité premium, sélectionné avec soin par nos équipes. Origine France.', 28.00, NULL, 5.50, 'kg', 25, 10, ARRAY[]::TEXT[], 'France', true, false
FROM categorie c WHERE c.slug = 'boucherie';

INSERT INTO produit (categorie_id, reference, nom, slug, description, prix, prix_promo, taux_tva, unite_mesure, stock_quantite, stock_min_alerte, labels, origine, est_actif, est_mis_en_avant)
SELECT c.id, 'BOU-004', 'Jambon blanc tranché', 'jambon-blanc-tranche', 'Jambon blanc tranché de qualité premium, sélectionné avec soin par nos équipes. Origine France.', 18.00, NULL, 5.50, 'kg', 35, 10, ARRAY[]::TEXT[], 'France', true, false
FROM categorie c WHERE c.slug = 'boucherie';

INSERT INTO produit (categorie_id, reference, nom, slug, description, prix, prix_promo, taux_tva, unite_mesure, stock_quantite, stock_min_alerte, labels, origine, est_actif, est_mis_en_avant)
SELECT c.id, 'BOU-005', 'Saucisses de Toulouse', 'saucisses-de-toulouse', 'Saucisses de Toulouse de qualité premium, sélectionné avec soin par nos équipes. Origine France.', 14.00, 11.90, 5.50, 'kg', 50, 10, ARRAY['PROMO', 'LOCAL'], 'France', true, false
FROM categorie c WHERE c.slug = 'boucherie';

-- Poissonnerie
INSERT INTO produit (categorie_id, reference, nom, slug, description, prix, prix_promo, taux_tva, unite_mesure, stock_quantite, stock_min_alerte, labels, origine, est_actif, est_mis_en_avant)
SELECT c.id, 'POI-001', 'Saumon frais', 'saumon-frais', 'Saumon frais de qualité premium, sélectionné avec soin par nos équipes. Origine France.', 22.00, NULL, 5.50, 'kg', 30, 10, ARRAY[]::TEXT[], 'France', true, false
FROM categorie c WHERE c.slug = 'poissonnerie';

INSERT INTO produit (categorie_id, reference, nom, slug, description, prix, prix_promo, taux_tva, unite_mesure, stock_quantite, stock_min_alerte, labels, origine, est_actif, est_mis_en_avant)
SELECT c.id, 'POI-002', 'Crevettes roses', 'crevettes-roses', 'Crevettes roses de qualité premium, sélectionné avec soin par nos équipes. Origine France.', 18.00, NULL, 5.50, 'kg', 25, 10, ARRAY[]::TEXT[], 'France', true, false
FROM categorie c WHERE c.slug = 'poissonnerie';

INSERT INTO produit (categorie_id, reference, nom, slug, description, prix, prix_promo, taux_tva, unite_mesure, stock_quantite, stock_min_alerte, labels, origine, est_actif, est_mis_en_avant)
SELECT c.id, 'POI-003', 'Moules de bouchot', 'moules-de-bouchot', 'Moules de bouchot de qualité premium, sélectionné avec soin par nos équipes. Origine France.', 6.50, NULL, 5.50, 'kg', 60, 10, ARRAY['AOP'], 'France', true, false
FROM categorie c WHERE c.slug = 'poissonnerie';

INSERT INTO produit (categorie_id, reference, nom, slug, description, prix, prix_promo, taux_tva, unite_mesure, stock_quantite, stock_min_alerte, labels, origine, est_actif, est_mis_en_avant)
SELECT c.id, 'POI-004', 'Filet de cabillaud', 'filet-de-cabillaud', 'Filet de cabillaud de qualité premium, sélectionné avec soin par nos équipes. Origine France.', 19.00, NULL, 5.50, 'kg', 35, 10, ARRAY[]::TEXT[], 'France', true, false
FROM categorie c WHERE c.slug = 'poissonnerie';

-- Épicerie
INSERT INTO produit (categorie_id, reference, nom, slug, description, prix, prix_promo, taux_tva, unite_mesure, stock_quantite, stock_min_alerte, labels, origine, est_actif, est_mis_en_avant)
SELECT c.id, 'EPI-001', 'Huile d''olive vierge extra', 'huile-dolive-vierge-extra', 'Huile d''olive vierge extra de qualité premium, sélectionné avec soin par nos équipes. Origine France.', 12.00, NULL, 5.50, 'litre', 70, 10, ARRAY[]::TEXT[], 'France', true, false
FROM categorie c WHERE c.slug = 'epicerie';

INSERT INTO produit (categorie_id, reference, nom, slug, description, prix, prix_promo, taux_tva, unite_mesure, stock_quantite, stock_min_alerte, labels, origine, est_actif, est_mis_en_avant)
SELECT c.id, 'EPI-002', 'Pâtes artisanales', 'pates-artisanales', 'Pâtes artisanales de qualité premium, sélectionné avec soin par nos équipes. Origine France.', 4.50, NULL, 5.50, 'kg', 90, 10, ARRAY['LOCAL'], 'France', true, false
FROM categorie c WHERE c.slug = 'epicerie';

INSERT INTO produit (categorie_id, reference, nom, slug, description, prix, prix_promo, taux_tva, unite_mesure, stock_quantite, stock_min_alerte, labels, origine, est_actif, est_mis_en_avant)
SELECT c.id, 'EPI-003', 'Miel de lavande', 'miel-de-lavande', 'Miel de lavande de qualité premium, sélectionné avec soin par nos équipes. Origine France.', 15.00, NULL, 5.50, 'kg', 40, 10, ARRAY['LOCAL'], 'France', true, false
FROM categorie c WHERE c.slug = 'epicerie';

INSERT INTO produit (categorie_id, reference, nom, slug, description, prix, prix_promo, taux_tva, unite_mesure, stock_quantite, stock_min_alerte, labels, origine, est_actif, est_mis_en_avant)
SELECT c.id, 'EPI-004', 'Confiture de fraises', 'confiture-de-fraises', 'Confiture de fraises de qualité premium, sélectionné avec soin par nos équipes. Origine France.', 5.90, NULL, 5.50, 'piece', 55, 10, ARRAY[]::TEXT[], 'France', true, false
FROM categorie c WHERE c.slug = 'epicerie';

-- Boulangerie
INSERT INTO produit (categorie_id, reference, nom, slug, description, prix, prix_promo, taux_tva, unite_mesure, stock_quantite, stock_min_alerte, labels, origine, est_actif, est_mis_en_avant)
SELECT c.id, 'BLG-001', 'Baguette tradition', 'baguette-tradition', 'Baguette tradition de qualité premium, sélectionné avec soin par nos équipes. Origine France.', 1.30, NULL, 5.50, 'piece', 100, 10, ARRAY[]::TEXT[], 'France', true, false
FROM categorie c WHERE c.slug = 'boulangerie';

INSERT INTO produit (categorie_id, reference, nom, slug, description, prix, prix_promo, taux_tva, unite_mesure, stock_quantite, stock_min_alerte, labels, origine, est_actif, est_mis_en_avant)
SELECT c.id, 'BLG-002', 'Pain de campagne', 'pain-de-campagne', 'Pain de campagne de qualité premium, sélectionné avec soin par nos équipes. Origine France.', 3.50, NULL, 5.50, 'piece', 50, 10, ARRAY[]::TEXT[], 'France', true, false
FROM categorie c WHERE c.slug = 'boulangerie';

INSERT INTO produit (categorie_id, reference, nom, slug, description, prix, prix_promo, taux_tva, unite_mesure, stock_quantite, stock_min_alerte, labels, origine, est_actif, est_mis_en_avant)
SELECT c.id, 'BLG-003', 'Croissants x6', 'croissants-x6', 'Croissants x6 de qualité premium, sélectionné avec soin par nos équipes. Origine France.', 6.00, 4.80, 5.50, 'piece', 40, 10, ARRAY['PROMO'], 'France', true, false
FROM categorie c WHERE c.slug = 'boulangerie';

INSERT INTO produit (categorie_id, reference, nom, slug, description, prix, prix_promo, taux_tva, unite_mesure, stock_quantite, stock_min_alerte, labels, origine, est_actif, est_mis_en_avant)
SELECT c.id, 'BLG-004', 'Pain au chocolat x6', 'pain-au-chocolat-x6', 'Pain au chocolat x6 de qualité premium, sélectionné avec soin par nos équipes. Origine France.', 7.20, NULL, 5.50, 'piece', 45, 10, ARRAY[]::TEXT[], 'France', true, false
FROM categorie c WHERE c.slug = 'boulangerie';

-- ============================================
-- VÉRIFICATION FINALE
-- ============================================

SELECT '✅ Base de données Jana Distribution initialisée !' AS message;
SELECT '📊 Statistiques :' AS info;
SELECT 'Utilisateurs' AS table_name, COUNT(*) AS count FROM utilisateur
UNION ALL
SELECT 'Catégories', COUNT(*) FROM categorie
UNION ALL
SELECT 'Produits', COUNT(*) FROM produit
UNION ALL
SELECT 'Adresses', COUNT(*) FROM adresse;

SELECT '' AS separator;
SELECT '🔑 Comptes de test :' AS info;
SELECT 'Admin: admin@jana-distribution.fr / Admin123!' AS compte
UNION ALL
SELECT 'Client: client@test.fr / Client123!'
UNION ALL
SELECT 'Pro: pro@restaurant.fr / Pro123!';
