-- ============================================
-- SCRIPT D'INITIALISATION - JANA DISTRIBUTION
-- Base de données PostgreSQL
-- ============================================

-- Extension pour les UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TYPES ÉNUMÉRÉS
-- ============================================

CREATE TYPE role_utilisateur AS ENUM ('CLIENT', 'ADMIN');
CREATE TYPE type_client AS ENUM ('PARTICULIER', 'PROFESSIONNEL');
CREATE TYPE unite_produit AS ENUM ('KG', 'LITRE', 'PIECE', 'BOUTEILLE', 'BARQUETTE', 'LOT');
CREATE TYPE statut_commande AS ENUM ('EN_ATTENTE', 'CONFIRMEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE', 'ANNULEE');
CREATE TYPE mode_paiement AS ENUM ('VIREMENT', 'CHEQUE', 'PAIEMENT_LIVRAISON');

-- ============================================
-- TABLE: UTILISATEUR
-- ============================================

CREATE TABLE utilisateur (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    mot_de_passe_hash VARCHAR(255) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    telephone VARCHAR(20),
    role role_utilisateur NOT NULL DEFAULT 'CLIENT',
    est_actif BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Champs spécifiques Client
    type_client type_client DEFAULT 'PARTICULIER',
    siret VARCHAR(14),
    raison_sociale VARCHAR(255),
    numero_tva VARCHAR(20),
    accepte_cgu BOOLEAN DEFAULT FALSE,
    accepte_newsletter BOOLEAN DEFAULT FALSE,
    
    -- Champs spécifiques Admin
    permissions TEXT[],
    
    -- Métadonnées
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    derniere_connexion TIMESTAMP WITH TIME ZONE,
    
    -- Contraintes
    CONSTRAINT chk_siret_professionnel CHECK (
        (type_client = 'PROFESSIONNEL' AND siret IS NOT NULL) OR
        (type_client = 'PARTICULIER')
    )
);

-- Index pour les recherches fréquentes
CREATE INDEX idx_utilisateur_email ON utilisateur(email);
CREATE INDEX idx_utilisateur_role ON utilisateur(role);
CREATE INDEX idx_utilisateur_type_client ON utilisateur(type_client);

-- ============================================
-- TABLE: ADRESSE
-- ============================================

CREATE TABLE adresse (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utilisateur_id UUID NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    libelle VARCHAR(100) NOT NULL,
    rue VARCHAR(255) NOT NULL,
    complement VARCHAR(255),
    code_postal VARCHAR(10) NOT NULL,
    ville VARCHAR(100) NOT NULL,
    pays VARCHAR(100) NOT NULL DEFAULT 'France',
    est_principale BOOLEAN NOT NULL DEFAULT FALSE,
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
    icone VARCHAR(50),
    est_active BOOLEAN NOT NULL DEFAULT TRUE,
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categorie_slug ON categorie(slug);

-- ============================================
-- TABLE: PRODUIT
-- ============================================

CREATE TABLE produit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    categorie_id UUID NOT NULL REFERENCES categorie(id),
    nom VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    prix_ht DECIMAL(10, 2) NOT NULL CHECK (prix_ht >= 0),
    taux_tva DECIMAL(4, 2) NOT NULL DEFAULT 20.00,
    unite unite_produit NOT NULL DEFAULT 'PIECE',
    quantite_stock INTEGER NOT NULL DEFAULT 0 CHECK (quantite_stock >= 0),
    seuil_alerte INTEGER NOT NULL DEFAULT 10,
    image_principale VARCHAR(500),
    est_actif BOOLEAN NOT NULL DEFAULT TRUE,
    est_mis_en_avant BOOLEAN NOT NULL DEFAULT FALSE,
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_produit_categorie ON produit(categorie_id);
CREATE INDEX idx_produit_slug ON produit(slug);
CREATE INDEX idx_produit_actif ON produit(est_actif);

-- ============================================
-- TABLE: TAG
-- ============================================

CREATE TABLE tag (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    couleur VARCHAR(7) DEFAULT '#4CAF50'
);

-- ============================================
-- TABLE: PRODUIT_TAG (Association N:M)
-- ============================================

CREATE TABLE produit_tag (
    produit_id UUID NOT NULL REFERENCES produit(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tag(id) ON DELETE CASCADE,
    PRIMARY KEY (produit_id, tag_id)
);

-- ============================================
-- TABLE: ALLERGENE
-- ============================================

CREATE TABLE allergene (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(100) NOT NULL UNIQUE,
    icone VARCHAR(50)
);

-- ============================================
-- TABLE: PRODUIT_ALLERGENE (Association N:M)
-- ============================================

CREATE TABLE produit_allergene (
    produit_id UUID NOT NULL REFERENCES produit(id) ON DELETE CASCADE,
    allergene_id UUID NOT NULL REFERENCES allergene(id) ON DELETE CASCADE,
    PRIMARY KEY (produit_id, allergene_id)
);

-- ============================================
-- TABLE: IMAGE_PRODUIT
-- ============================================

CREATE TABLE image_produit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    produit_id UUID NOT NULL REFERENCES produit(id) ON DELETE CASCADE,
    url_image VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    ordre INTEGER NOT NULL DEFAULT 0,
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_image_produit ON image_produit(produit_id);

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
    
    -- Paiement
    mode_paiement mode_paiement NOT NULL,
    
    -- Snapshot adresse de livraison
    adresse_livraison_snapshot JSONB NOT NULL,
    instructions_livraison TEXT,
    
    -- Métadonnées
    date_modification TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_commande_utilisateur ON commande(utilisateur_id);
CREATE INDEX idx_commande_numero ON commande(numero_commande);
CREATE INDEX idx_commande_statut ON commande(statut);
CREATE INDEX idx_commande_date ON commande(date_commande DESC);

-- ============================================
-- TABLE: LIGNE_COMMANDE
-- ============================================

CREATE TABLE ligne_commande (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commande_id UUID NOT NULL REFERENCES commande(id) ON DELETE CASCADE,
    produit_id UUID REFERENCES produit(id),
    
    -- Snapshot des données produit au moment de la commande
    quantite INTEGER NOT NULL CHECK (quantite >= 1),
    prix_unitaire_ht DECIMAL(10, 2) NOT NULL,
    taux_tva DECIMAL(4, 2) NOT NULL,
    nom_produit VARCHAR(255) NOT NULL
);

CREATE INDEX idx_ligne_commande_commande ON ligne_commande(commande_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Fonction de mise à jour de date_modification
CREATE OR REPLACE FUNCTION update_date_modification()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_modification = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers de mise à jour automatique
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
-- DONNÉES DE DÉMONSTRATION
-- ============================================

-- Catégories
INSERT INTO categorie (nom, slug, description, icone) VALUES
    ('Fruits & Légumes', 'fruits-et-legumes', 'Fruits et légumes frais de saison', '🥬'),
    ('Produits Laitiers', 'produits-laitiers', 'Lait, fromages, yaourts et crèmes', '🥛'),
    ('Boucherie', 'boucherie', 'Viandes fraîches et charcuterie', '🥩'),
    ('Boulangerie', 'boulangerie', 'Pains, viennoiseries et pâtisseries', '🍞'),
    ('Épicerie', 'epicerie', 'Produits d''épicerie fine', '🥫'),
    ('Poissonnerie', 'poissonnerie', 'Poissons et fruits de mer frais', '🐟');

-- Tags
INSERT INTO tag (nom, slug, couleur) VALUES
    ('Bio', 'bio', '#4CAF50'),
    ('Local', 'local', '#FF9800'),
    ('Promo', 'promo', '#F44336'),
    ('Nouveau', 'nouveau', '#2196F3'),
    ('Sans Gluten', 'sans-gluten', '#9C27B0');

-- Allergènes
INSERT INTO allergene (nom, icone) VALUES
    ('Gluten', '🌾'),
    ('Crustacés', '🦐'),
    ('Œufs', '🥚'),
    ('Poisson', '🐟'),
    ('Arachides', '🥜'),
    ('Soja', '🫘'),
    ('Lait', '🥛'),
    ('Fruits à coque', '🌰'),
    ('Céleri', '🥬'),
    ('Moutarde', '🟡'),
    ('Sésame', '⚪'),
    ('Sulfites', '🍷'),
    ('Lupin', '🌸'),
    ('Mollusques', '🦪');

-- Admin par défaut (mot de passe: Admin123!)
-- Hash généré avec bcrypt (12 rounds)
INSERT INTO utilisateur (
    email, 
    mot_de_passe_hash, 
    nom, 
    prenom, 
    role, 
    permissions,
    accepte_cgu
) VALUES (
    'admin@jana-distribution.fr',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4EdAM8MdT9Wz1Cmu',
    'Admin',
    'Jana',
    'ADMIN',
    ARRAY['GESTION_PRODUITS', 'GESTION_COMMANDES', 'GESTION_CLIENTS', 'GESTION_PARAMETRES'],
    TRUE
);

-- Client test (mot de passe: Client123!)
INSERT INTO utilisateur (
    email, 
    mot_de_passe_hash, 
    nom, 
    prenom, 
    role, 
    type_client,
    accepte_cgu,
    accepte_newsletter
) VALUES (
    'client@test.fr',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4EdAM8MdT9Wz1Cmu',
    'Dupont',
    'Jean',
    'CLIENT',
    'PARTICULIER',
    TRUE,
    TRUE
);

-- Produits de démonstration
INSERT INTO produit (categorie_id, nom, slug, description, prix_ht, unite, quantite_stock, est_mis_en_avant) VALUES
    ((SELECT id FROM categorie WHERE slug = 'fruits-et-legumes'), 'Pommes Gala', 'pommes-gala', 'Pommes Gala croquantes et sucrées, origine France', 2.50, 'KG', 150, TRUE),
    ((SELECT id FROM categorie WHERE slug = 'fruits-et-legumes'), 'Tomates Grappe', 'tomates-grappe', 'Tomates grappe mûries au soleil', 3.20, 'KG', 80, FALSE),
    ((SELECT id FROM categorie WHERE slug = 'fruits-et-legumes'), 'Carottes Bio', 'carottes-bio', 'Carottes biologiques de pleine terre', 2.80, 'KG', 120, TRUE),
    ((SELECT id FROM categorie WHERE slug = 'produits-laitiers'), 'Lait Entier', 'lait-entier', 'Lait entier frais pasteurisé', 1.20, 'LITRE', 200, FALSE),
    ((SELECT id FROM categorie WHERE slug = 'produits-laitiers'), 'Comté AOP 12 mois', 'comte-aop-12-mois', 'Comté AOP affiné 12 mois minimum', 18.50, 'KG', 25, TRUE),
    ((SELECT id FROM categorie WHERE slug = 'boucherie'), 'Entrecôte de Bœuf', 'entrecote-boeuf', 'Entrecôte de bœuf Charolais, race à viande', 24.90, 'KG', 30, TRUE),
    ((SELECT id FROM categorie WHERE slug = 'boulangerie'), 'Pain de Campagne', 'pain-campagne', 'Pain de campagne au levain naturel', 3.50, 'PIECE', 50, FALSE),
    ((SELECT id FROM categorie WHERE slug = 'epicerie'), 'Huile d''Olive Extra Vierge', 'huile-olive-extra-vierge', 'Huile d''olive extra vierge première pression à froid', 12.90, 'BOUTEILLE', 45, TRUE);

-- Associations produit-tag
INSERT INTO produit_tag (produit_id, tag_id) VALUES
    ((SELECT id FROM produit WHERE slug = 'carottes-bio'), (SELECT id FROM tag WHERE slug = 'bio')),
    ((SELECT id FROM produit WHERE slug = 'carottes-bio'), (SELECT id FROM tag WHERE slug = 'local')),
    ((SELECT id FROM produit WHERE slug = 'pommes-gala'), (SELECT id FROM tag WHERE slug = 'local')),
    ((SELECT id FROM produit WHERE slug = 'comte-aop-12-mois'), (SELECT id FROM tag WHERE slug = 'local')),
    ((SELECT id FROM produit WHERE slug = 'tomates-grappe'), (SELECT id FROM tag WHERE slug = 'promo'));

-- ============================================
-- FIN DU SCRIPT
-- ============================================

-- Vérification
SELECT 'Base de données Jana Distribution initialisée avec succès!' AS message;
SELECT COUNT(*) AS nb_categories FROM categorie;
SELECT COUNT(*) AS nb_produits FROM produit;
SELECT COUNT(*) AS nb_utilisateurs FROM utilisateur;
