-- ============================================================
-- Jana Distribution — Schéma de référence
-- VERSION : synchronisé avec migrations 0001 à 0010 (2026-07-04)
-- USAGE : bootstrap d'un NOUVEL environnement dev uniquement
-- NE PAS exécuter sur une DB déjà provisionnée (utiliser npm run migrate)
-- ============================================================
-- Exécuter avec: psql -U postgres -d jana_distribution -f init.sql
-- Ou via Docker: docker exec -i postgres psql -U postgres -d jana_distribution < init.sql
-- ============================================================

-- Extension pour les UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- SUPPRESSION DES TABLES EXISTANTES (reset)
-- ============================================================
DROP TABLE IF EXISTS code_promo_utilisation CASCADE;
DROP TABLE IF EXISTS code_promo CASCADE;
DROP TABLE IF EXISTS facture_ligne CASCADE;
DROP TABLE IF EXISTS facture CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS refresh_token CASCADE;
DROP TABLE IF EXISTS commande_statut_historique CASCADE;
DROP TABLE IF EXISTS ligne_commande CASCADE;
DROP TABLE IF EXISTS commande CASCADE;
DROP TABLE IF EXISTS ligne_panier CASCADE;
DROP TABLE IF EXISTS panier CASCADE;
DROP TABLE IF EXISTS produit CASCADE;
DROP TABLE IF EXISTS categorie CASCADE;
DROP TABLE IF EXISTS adresse CASCADE;
DROP TABLE IF EXISTS configuration CASCADE;
DROP TABLE IF EXISTS utilisateur CASCADE;
DROP TABLE IF EXISTS schema_migrations CASCADE;

-- Suppression des types existants
DROP TYPE IF EXISTS role_utilisateur CASCADE;
DROP TYPE IF EXISTS type_client CASCADE;
DROP TYPE IF EXISTS statut_commande CASCADE;
DROP TYPE IF EXISTS statut_paiement CASCADE;
DROP TYPE IF EXISTS mode_paiement CASCADE;
DROP TYPE IF EXISTS type_adresse CASCADE;

-- Suppression séquences
DROP SEQUENCE IF EXISTS commande_numero_seq;
DROP SEQUENCE IF EXISTS facture_seq;

-- ============================================================
-- ENUMS
-- ============================================================

-- Rôles utilisateur
CREATE TYPE role_utilisateur AS ENUM ('CLIENT', 'ADMIN');

-- Types de client
CREATE TYPE type_client AS ENUM ('PARTICULIER', 'PROFESSIONNEL');

-- Statuts de commande (inclut les statuts de remboursement manuel — migration 0005)
CREATE TYPE statut_commande AS ENUM (
  'EN_ATTENTE',
  'CONFIRMEE',
  'EN_PREPARATION',
  'EXPEDIEE',
  'LIVREE',
  'ANNULEE',
  'PARTIELLEMENT_REMBOURSE',
  'REMBOURSE'
);

-- Modes de paiement — Stripe/CARTE retiré du MVP (migration 0009)
CREATE TYPE mode_paiement AS ENUM ('ESPECES', 'VIREMENT', 'CHEQUE');

-- Statut paiement
CREATE TYPE statut_paiement AS ENUM (
  'PENDING',
  'AUTHORIZED',
  'PAID',
  'FAILED',
  'REFUNDED'
);

-- Types d'adresse
CREATE TYPE type_adresse AS ENUM ('LIVRAISON', 'FACTURATION');

-- ============================================================
-- TABLE: utilisateur
-- ============================================================
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
  -- Validation compte pro (migration 0015, T16-09) : NON_APPLICABLE pour un
  -- particulier, EN_ATTENTE a l'inscription d'un compte PROFESSIONNEL
  -- (checkout bloque tant que non VALIDE par un admin).
  statut_validation_pro VARCHAR(20) NOT NULL DEFAULT 'NON_APPLICABLE'
    CHECK (statut_validation_pro IN ('NON_APPLICABLE', 'EN_ATTENTE', 'VALIDE')),
  reset_token VARCHAR(255),
  reset_token_expiry TIMESTAMP,
  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  derniere_connexion TIMESTAMP,
  CONSTRAINT chk_siret_pro CHECK (type_client != 'PROFESSIONNEL' OR siret IS NOT NULL)
);

-- Index utilisateur
CREATE INDEX idx_utilisateur_email ON utilisateur(email);
CREATE INDEX idx_utilisateur_role ON utilisateur(role);
CREATE INDEX idx_utilisateur_type_client ON utilisateur(type_client);
CREATE INDEX idx_utilisateur_est_actif ON utilisateur(est_actif);
CREATE INDEX idx_utilisateur_reset_token ON utilisateur(reset_token) WHERE reset_token IS NOT NULL;

-- ============================================================
-- TABLE: adresse
-- ============================================================
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

-- ============================================================
-- TABLE: categorie
-- ============================================================
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

-- ============================================================
-- TABLE: produit
-- ============================================================
CREATE TABLE produit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference VARCHAR(50) NOT NULL UNIQUE,
  nom VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  prix DECIMAL(10, 2) NOT NULL,
  prix_promo DECIMAL(10, 2),
  -- Taux légaux France : 5.5=alimentaire base, 10=transformé, 20=alcool/luxe (migration 0008)
  -- ⚠️ Valider chaque référence produit avec un expert-comptable avant vente réelle (CGI art. 278 et suivants)
  taux_tva NUMERIC(4, 2) NOT NULL DEFAULT 5.5,
  unite_mesure VARCHAR(20) NOT NULL DEFAULT 'piece',
  -- CHECK stock >= 0 (migration 0011) : filet de sécurité DB en complément du
  -- décrément atomique applicatif (UPDATE ... WHERE stock_quantite >= qty)
  stock_quantite INTEGER NOT NULL DEFAULT 0
    CONSTRAINT produit_stock_quantite_non_negatif CHECK (stock_quantite >= 0),
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

COMMENT ON COLUMN produit.taux_tva IS
  '⚠️ Taux TVA %. Légaux FR: 5.5=alimentaire base, 10=transformé, 20=alcool. Valider avec comptable.';

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

-- ============================================================
-- TABLE: panier
-- ============================================================
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

-- ============================================================
-- TABLE: ligne_panier
-- ============================================================
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

-- ============================================================
-- SEQUENCE: numéro de commande
-- ============================================================
CREATE SEQUENCE commande_numero_seq START 1;

-- ============================================================
-- TABLE: code_promo (migration 0010)
-- ============================================================
CREATE TABLE code_promo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  type_rabais VARCHAR(20) NOT NULL CHECK (type_rabais IN ('POURCENTAGE', 'MONTANT_FIXE')),
  valeur_rabais NUMERIC(10,2) NOT NULL CHECK (valeur_rabais > 0),
  montant_minimum NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_utilisations_global INTEGER,
  max_utilisations_par_client INTEGER DEFAULT 1,
  date_debut TIMESTAMP WITH TIME ZONE,
  date_fin TIMESTAMP WITH TIME ZONE,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES utilisateur(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_code_promo_code ON code_promo(code);
CREATE INDEX idx_code_promo_actif ON code_promo(actif, date_debut, date_fin);

-- ============================================================
-- TABLE: commande
-- ============================================================
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
  mode_paiement mode_paiement NOT NULL DEFAULT 'ESPECES',
  frais_livraison DECIMAL(10, 2) NOT NULL DEFAULT 0,
  instructions_livraison TEXT,
  paiement_statut statut_paiement NOT NULL DEFAULT 'PENDING',
  paye_le TIMESTAMP NULL,
  -- Remboursement manuel (migration 0005) — pas de canal Stripe (migration 0009)
  montant_rembourse NUMERIC(10,2) NOT NULL DEFAULT 0,
  -- Suivi expédition (migration 0007)
  numero_colis VARCHAR(100),
  date_expedition TIMESTAMP WITH TIME ZONE,
  -- Codes promo (migration 0010)
  code_promo_id UUID REFERENCES code_promo(id),
  montant_rabais NUMERIC(10,2) DEFAULT 0,
  total_avant_rabais NUMERIC(10,2),
  date_modification TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index commande
CREATE INDEX idx_commande_numero ON commande(numero_commande);
CREATE INDEX idx_commande_utilisateur_id ON commande(utilisateur_id);
CREATE INDEX idx_commande_statut ON commande(statut);
CREATE INDEX idx_commande_date ON commande(date_commande);
CREATE INDEX idx_commande_paiement_statut ON commande(paiement_statut);

-- ============================================================
-- TABLE: code_promo_utilisation (migration 0010)
-- ============================================================
CREATE TABLE code_promo_utilisation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code_promo_id UUID NOT NULL REFERENCES code_promo(id) ON DELETE RESTRICT,
  commande_id UUID NOT NULL REFERENCES commande(id) ON DELETE CASCADE,
  utilisateur_id UUID NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
  montant_rabais_applique NUMERIC(10,2) NOT NULL,
  total_avant_rabais NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (code_promo_id, commande_id)
);

CREATE INDEX idx_cpu_code_promo ON code_promo_utilisation(code_promo_id);
CREATE INDEX idx_cpu_utilisateur ON code_promo_utilisation(utilisateur_id, code_promo_id);

-- ============================================================
-- TABLE: ligne_commande
-- ============================================================
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

-- ============================================================
-- TABLE: commande_statut_historique (migration 0002)
-- ============================================================
CREATE TABLE commande_statut_historique (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  commande_id    UUID        NOT NULL REFERENCES commande(id) ON DELETE CASCADE,
  ancien_statut  VARCHAR(50),
  nouveau_statut VARCHAR(50) NOT NULL,
  commentaire    TEXT,
  created_at     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_csh_commande    ON commande_statut_historique(commande_id);
CREATE INDEX idx_csh_created_at  ON commande_statut_historique(created_at);

-- ============================================================
-- TABLE: refresh_token (migration 0003)
-- ============================================================
CREATE TABLE refresh_token (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_hash     VARCHAR(64) NOT NULL UNIQUE,
  utilisateur_id UUID        NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
  expires_at     TIMESTAMP   NOT NULL,
  revoked_at     TIMESTAMP   NULL,
  created_at     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rt_token_hash   ON refresh_token(token_hash);
CREATE INDEX idx_rt_utilisateur  ON refresh_token(utilisateur_id);
CREATE INDEX idx_rt_expires_at   ON refresh_token(expires_at);

-- ============================================================
-- TABLE: audit_log (migration 0004)
-- ============================================================
CREATE TABLE audit_log (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  action         VARCHAR(100) NOT NULL,
  entite_type    VARCHAR(50),
  entite_id      UUID,
  utilisateur_id UUID        REFERENCES utilisateur(id) ON DELETE SET NULL,
  details        JSONB,
  ip_address     VARCHAR(45),
  created_at     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_al_utilisateur  ON audit_log(utilisateur_id);
CREATE INDEX idx_al_entite       ON audit_log(entite_type, entite_id);
CREATE INDEX idx_al_created_at   ON audit_log(created_at);

-- ============================================================
-- TABLE: facture / facture_ligne (migration 0008)
-- ⚠️ Taux TVA conformes CGI 2024 — validation comptable requise
-- avant première vente réelle (art. 278 et suivants CGI)
-- ============================================================
CREATE TABLE facture (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero VARCHAR(20) NOT NULL UNIQUE,
  commande_id UUID NOT NULL REFERENCES commande(id),
  utilisateur_id UUID NOT NULL REFERENCES utilisateur(id),

  -- Snapshot données client (immuable après émission)
  client_nom VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_adresse TEXT,

  -- Snapshot données entreprise (immuable après émission)
  entreprise_nom VARCHAR(255) NOT NULL DEFAULT 'Jana Distribution',
  entreprise_siret VARCHAR(20),
  entreprise_tva_numero VARCHAR(20),
  entreprise_adresse TEXT,

  -- Montants
  total_ht NUMERIC(10,2) NOT NULL,
  total_tva NUMERIC(10,2) NOT NULL,
  total_ttc NUMERIC(10,2) NOT NULL,

  -- Remise (migration 0014, T16-12) : snapshot de la remise code promo deja
  -- deduite dans total_ht/total_tva/total_ttc ci-dessus, uniquement pour
  -- affichage transparent sur le PDF.
  remise_montant NUMERIC(10,2),
  remise_code VARCHAR(50),

  -- Statut
  statut VARCHAR(20) NOT NULL DEFAULT 'EMISE' CHECK (statut IN ('EMISE', 'ANNULEE')),
  avoir_id UUID REFERENCES facture(id),
  -- Type (migration 0012, T5-15 ; DEVIS ajouté migration 0013) : distingue
  -- une facture normale, d'un avoir (montants négatifs, remboursement) et
  -- d'un devis (estimation non contractuelle, généré à la création de commande)
  type VARCHAR(10) NOT NULL DEFAULT 'FACTURE' CHECK (type IN ('FACTURE', 'AVOIR', 'DEVIS')),

  -- Dates
  date_emission TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE facture_ligne (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facture_id UUID NOT NULL REFERENCES facture(id) ON DELETE CASCADE,
  produit_nom VARCHAR(255) NOT NULL,
  produit_ref VARCHAR(100),
  quantite INTEGER NOT NULL,
  prix_unitaire_ht NUMERIC(10,2) NOT NULL,
  taux_tva NUMERIC(4,2) NOT NULL,
  montant_ht NUMERIC(10,2) NOT NULL,
  montant_tva NUMERIC(10,2) NOT NULL,
  montant_ttc NUMERIC(10,2) NOT NULL
);

-- Séquence de numérotation des factures
CREATE SEQUENCE facture_seq START 1;

CREATE INDEX idx_facture_commande ON facture(commande_id);
CREATE INDEX idx_facture_utilisateur ON facture(utilisateur_id);
CREATE INDEX idx_facture_numero ON facture(numero);
CREATE INDEX idx_facture_date ON facture(date_emission DESC);

-- ============================================================
-- TABLE: configuration
-- ============================================================
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

-- ============================================================
-- TABLE: schema_migrations (runner de migrations — scripts/run-migrations.js)
-- ============================================================
CREATE TABLE schema_migrations (
  id         SERIAL       PRIMARY KEY,
  name       VARCHAR(255) NOT NULL UNIQUE,
  checksum   VARCHAR(64)  NOT NULL,
  applied_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- DONNÉES INITIALES: configuration
-- ============================================================
INSERT INTO configuration (cle, valeur, type, categorie, description) VALUES
-- Site
('site_nom', 'Jana Distribution', 'string', 'site', 'Nom du site'),
('site_description', 'Produits alimentaires de qualité', 'string', 'site', 'Description du site'),
('site_email', 'contact@jana-distribution.fr', 'string', 'site', 'Email de contact'),
('site_telephone', '+33 1 23 45 67 89', 'string', 'site', 'Téléphone de contact'),
('site_adresse', '123 Rue du Commerce', 'string', 'site', 'Adresse'),
('site_code_postal', '75001', 'string', 'site', 'Code postal'),
('site_ville', 'Paris', 'string', 'site', 'Ville'),
('site_siret', '798787784', 'string', 'site', 'Numéro SIRET'),
('site_tva_intra', 'FR92798787784', 'string', 'site', 'Numéro TVA Intracommunautaire'),

-- Livraison (mode DISTANCE — décision propriétaire 2026-06-27, migration 0006)
('livraison_mode', 'DISTANCE', 'string', 'livraison', 'Mode de calcul des frais de livraison'),
('livraison_frais_base', '5.00', 'number', 'livraison', 'Frais de base en euros'),
('livraison_tarif_km', '0.80', 'number', 'livraison', 'Tarif par kilomètre en euros'),
('livraison_franco_seuil', '80.00', 'number', 'livraison', 'Montant au-delà duquel la livraison est gratuite'),
('livraison_rayon_max_km', '80', 'number', 'livraison', 'Distance maximale de livraison en km (0 = illimitée)'),
('livraison_frais_standard', '5.90', 'number', 'livraison', 'Frais de livraison standard (fallback)'),
('livraison_seuil_franco', '50', 'number', 'livraison', 'Montant minimum pour livraison gratuite (fallback)'),
('livraison_delai_min', '2', 'number', 'livraison', 'Délai minimum de livraison (jours)'),
('livraison_delai_max', '5', 'number', 'livraison', 'Délai maximum de livraison (jours)'),
('livraison_zones', 'France métropolitaine', 'string', 'livraison', 'Zones de livraison'),
('livraison_message_indisponible', '', 'string', 'livraison', 'Message si livraison indisponible'),

-- Commande
('commande_montant_min', '15', 'number', 'commande', 'Montant minimum de commande'),
('commande_produits_par_page', '12', 'number', 'commande', 'Nombre de produits par page'),
('commande_tva_defaut', '5.5', 'number', 'commande', 'Taux de TVA par défaut'),
('commande_stock_alerte', '10', 'number', 'commande', 'Seuil alerte stock'),
('commande_autoriser_sans_stock', 'false', 'boolean', 'commande', 'Autoriser commandes sans stock'),
('commande_email_confirmation', 'true', 'boolean', 'commande', 'Envoyer email de confirmation'),
('commande_email_expedition', 'true', 'boolean', 'commande', 'Envoyer email expédition'),

-- Emails
('email_expediteur', 'contact@jana-distribution.fr', 'string', 'emails', 'Email expéditeur'),
('email_nom_expediteur', 'Jana Distribution', 'string', 'emails', 'Nom affiché expéditeur'),
('email_copie_admin', 'true', 'boolean', 'emails', 'Envoyer copie à admin'),
('email_admin', 'admin@jana-distribution.fr', 'string', 'emails', 'Email admin pour copies'),
('email_signature', 'L équipe Jana Distribution', 'string', 'emails', 'Signature emails');

-- ============================================================
-- FONCTIONS UTILITAIRES
-- ============================================================

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

-- ============================================================
-- IMMUABILITÉ DES FACTURES (migration 0012, T5-14)
-- ============================================================
-- Filet de sécurité au niveau base de données : le code applicatif n'expose
-- aucune route UPDATE/DELETE sur facture/facture_ligne, mais cette contrainte
-- empêche aussi tout futur bug ou route ajoutée par erreur de violer
-- l'immuabilité légale d'une facture émise. Voir migration 0012 pour le
-- détail des règles.
CREATE OR REPLACE FUNCTION facture_immutable_guard() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Suppression interdite : une facture ne peut jamais être supprimée (conservation légale 10 ans). Utilisez un avoir pour corriger.';
  END IF;

  IF NEW.numero IS DISTINCT FROM OLD.numero
     OR NEW.commande_id IS DISTINCT FROM OLD.commande_id
     OR NEW.utilisateur_id IS DISTINCT FROM OLD.utilisateur_id
     OR NEW.client_nom IS DISTINCT FROM OLD.client_nom
     OR NEW.client_email IS DISTINCT FROM OLD.client_email
     OR NEW.client_adresse IS DISTINCT FROM OLD.client_adresse
     OR NEW.entreprise_nom IS DISTINCT FROM OLD.entreprise_nom
     OR NEW.entreprise_siret IS DISTINCT FROM OLD.entreprise_siret
     OR NEW.entreprise_tva_numero IS DISTINCT FROM OLD.entreprise_tva_numero
     OR NEW.entreprise_adresse IS DISTINCT FROM OLD.entreprise_adresse
     OR NEW.total_ht IS DISTINCT FROM OLD.total_ht
     OR NEW.total_tva IS DISTINCT FROM OLD.total_tva
     OR NEW.total_ttc IS DISTINCT FROM OLD.total_ttc
     OR NEW.type IS DISTINCT FROM OLD.type
     OR NEW.date_emission IS DISTINCT FROM OLD.date_emission
  THEN
    RAISE EXCEPTION 'Facture immuable : seuls statut (EMISE -> ANNULEE) et avoir_id (une seule fois) peuvent changer après émission. Toute correction financière passe par un avoir.';
  END IF;

  IF OLD.avoir_id IS NOT NULL AND NEW.avoir_id IS DISTINCT FROM OLD.avoir_id THEN
    RAISE EXCEPTION 'avoir_id ne peut être défini qu''une seule fois sur une facture.';
  END IF;

  IF OLD.statut = 'ANNULEE' AND NEW.statut IS DISTINCT FROM OLD.statut THEN
    RAISE EXCEPTION 'Une facture déjà ANNULEE ne peut pas changer de statut à nouveau.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_facture_immutable
  BEFORE UPDATE OR DELETE ON facture
  FOR EACH ROW EXECUTE FUNCTION facture_immutable_guard();

CREATE OR REPLACE FUNCTION facture_ligne_immutable_guard() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'facture_ligne est immuable : aucune modification ni suppression après création. Utilisez un avoir pour corriger.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_facture_ligne_immutable
  BEFORE UPDATE OR DELETE ON facture_ligne
  FOR EACH ROW EXECUTE FUNCTION facture_ligne_immutable_guard();

-- ============================================================
-- TABLE: liste_recurrente / liste_recurrente_produit (migration 0016, T16-13)
-- ============================================================
CREATE TABLE liste_recurrente (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  utilisateur_id UUID NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
  nom VARCHAR(100) NOT NULL,
  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE liste_recurrente_produit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  liste_id UUID NOT NULL REFERENCES liste_recurrente(id) ON DELETE CASCADE,
  produit_id UUID NOT NULL REFERENCES produit(id) ON DELETE CASCADE,
  quantite INTEGER NOT NULL DEFAULT 1 CHECK (quantite > 0)
);

CREATE INDEX idx_liste_recurrente_utilisateur ON liste_recurrente(utilisateur_id);
CREATE INDEX idx_liste_recurrente_produit_liste ON liste_recurrente_produit(liste_id);

-- ============================================================
-- MESSAGE DE FIN
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ BASE DE DONNÉES INITIALISÉE AVEC SUCCÈS !';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables créées:';
  RAISE NOTICE '  • utilisateur / adresse';
  RAISE NOTICE '  • categorie / produit';
  RAISE NOTICE '  • panier / ligne_panier';
  RAISE NOTICE '  • commande / ligne_commande / commande_statut_historique';
  RAISE NOTICE '  • refresh_token / audit_log';
  RAISE NOTICE '  • facture / facture_ligne';
  RAISE NOTICE '  • code_promo / code_promo_utilisation';
  RAISE NOTICE '  • liste_recurrente / liste_recurrente_produit';
  RAISE NOTICE '  • configuration / schema_migrations';
  RAISE NOTICE '';
  RAISE NOTICE 'Prochaine étape: node scripts/seed.js';
  RAISE NOTICE '';
END $$;
