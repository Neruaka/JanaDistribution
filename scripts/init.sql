-- ============================================
-- SCRIPT D'INITIALISATION - JANA DISTRIBUTION
-- Compatible avec le backend Node.js
-- ============================================

-- Extension pour les UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TYPES ÉNUMÉRÉS
-- ============================================

-- Suppression des types s'ils existent (pour reset)
DROP TYPE IF EXISTS role_utilisateur CASCADE;
DROP TYPE IF EXISTS type_client CASCADE;
DROP TYPE IF EXISTS statut_commande CASCADE;
DROP TYPE IF EXISTS type_adresse CASCADE;

CREATE TYPE role_utilisateur AS ENUM ('CLIENT', 'ADMIN');
CREATE TYPE type_client AS ENUM ('PARTICULIER', 'PROFESSIONNEL');
CREATE TYPE statut_commande AS ENUM ('EN_ATTENTE', 'CONFIRMEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE', 'ANNULEE');
CREATE TYPE type_adresse AS ENUM ('LIVRAISON', 'FACTURATION');

-- ============================================
-- TABLE: UTILISATEUR
-- ============================================

DROP TABLE IF EXISTS utilisateur CASCADE;

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

-- ============================================
-- TABLE: ADRESSE
-- ============================================

DROP TABLE IF EXISTS adresse CASCADE;

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

DROP TABLE IF EXISTS categorie CASCADE;

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

DROP TABLE IF EXISTS produit CASCADE;

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

DROP TABLE IF EXISTS panier CASCADE;

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

DROP TABLE IF EXISTS ligne_panier CASCADE;

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

DROP TABLE IF EXISTS commande CASCADE;

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
    
    -- Adresse (snapshot JSON)
    adresse_livraison JSONB NOT NULL,
    instructions_livraison TEXT,
    
    date_modification TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_commande_utilisateur ON commande(utilisateur_id);
CREATE INDEX idx_commande_numero ON commande(numero_commande);
CREATE INDEX idx_commande_statut ON commande(statut);

-- ============================================
-- TABLE: LIGNE_COMMANDE
-- ============================================

DROP TABLE IF EXISTS ligne_commande CASCADE;

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
-- VÉRIFICATION
-- ============================================

SELECT 'Base de données Jana Distribution initialisée!' AS message;
