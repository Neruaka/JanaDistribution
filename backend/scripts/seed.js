/**
 * Script de Seed
 * @description Crée des données de test pour la base de données
 */

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'jana_distribution',
  user: process.env.DB_USER || 'jana_user',
  password: process.env.DB_PASSWORD || 'jana_secret_2024'
});

// ==========================================
// DONNÉES DE SEED
// ==========================================

const categories = [
  { nom: 'Fruits & Légumes', slug: 'fruits-legumes', description: 'Fruits et légumes frais de saison', couleur: '#22C55E', icone: '🥬', ordre: 1 },
  { nom: 'Produits Laitiers', slug: 'produits-laitiers', description: 'Fromages, yaourts, lait et crème', couleur: '#3B82F6', icone: '🧀', ordre: 2 },
  { nom: 'Boucherie', slug: 'boucherie', description: 'Viandes fraîches et charcuterie', couleur: '#EF4444', icone: '🥩', ordre: 3 },
  { nom: 'Poissonnerie', slug: 'poissonnerie', description: 'Poissons et fruits de mer', couleur: '#06B6D4', icone: '🐟', ordre: 4 },
  { nom: 'Épicerie', slug: 'epicerie', description: 'Produits d\'épicerie fine', couleur: '#F59E0B', icone: '🫒', ordre: 5 },
  { nom: 'Boulangerie', slug: 'boulangerie', description: 'Pains, viennoiseries et pâtisseries', couleur: '#D97706', icone: '🥖', ordre: 6 }
];

const generateProducts = (categorieId, categorieName) => {
  const productTemplates = {
    'fruits-legumes': [
      { nom: 'Pommes Gala Bio', reference: 'FRL-001', prix: 3.50, unite: 'kg', labels: ['BIO', 'LOCAL'] },
      { nom: 'Tomates Cerises', reference: 'FRL-002', prix: 4.90, unite: 'kg', labels: ['LOCAL'] },
      { nom: 'Bananes Bio', reference: 'FRL-003', prix: 2.80, unite: 'kg', labels: ['BIO'] },
      { nom: 'Carottes de saison', reference: 'FRL-004', prix: 1.90, unite: 'kg', labels: ['LOCAL'] },
      { nom: 'Fraises Gariguette', reference: 'FRL-005', prix: 6.50, prixPromo: 5.20, unite: 'kg', labels: ['LOCAL', 'PROMO'] },
      { nom: 'Avocats', reference: 'FRL-006', prix: 2.50, unite: 'piece', labels: [] },
      { nom: 'Citrons Bio', reference: 'FRL-007', prix: 3.20, unite: 'kg', labels: ['BIO'] },
      { nom: 'Salade Batavia', reference: 'FRL-008', prix: 1.50, unite: 'piece', labels: ['LOCAL'] }
    ],
    'produits-laitiers': [
      { nom: 'Comté AOP 18 mois', reference: 'LAI-001', prix: 28.00, unite: 'kg', labels: ['AOP'] },
      { nom: 'Beurre de Baratte', reference: 'LAI-002', prix: 6.50, unite: 'piece', labels: ['LOCAL'] },
      { nom: 'Yaourt Nature Bio x6', reference: 'LAI-003', prix: 3.90, unite: 'piece', labels: ['BIO'] },
      { nom: 'Crème fraîche épaisse', reference: 'LAI-004', prix: 2.80, unite: 'piece', labels: [] },
      { nom: 'Roquefort AOP', reference: 'LAI-005', prix: 24.00, unite: 'kg', labels: ['AOP'] },
      { nom: 'Lait frais entier', reference: 'LAI-006', prix: 1.80, unite: 'litre', labels: ['LOCAL'] }
    ],
    'boucherie': [
      { nom: 'Entrecôte de bœuf', reference: 'BOU-001', prix: 32.00, unite: 'kg', labels: ['LABEL_ROUGE'] },
      { nom: 'Poulet fermier', reference: 'BOU-002', prix: 12.50, unite: 'kg', labels: ['LABEL_ROUGE', 'LOCAL'] },
      { nom: 'Côtelettes d\'agneau', reference: 'BOU-003', prix: 28.00, unite: 'kg', labels: [] },
      { nom: 'Jambon blanc tranché', reference: 'BOU-004', prix: 18.00, unite: 'kg', labels: [] },
      { nom: 'Saucisses de Toulouse', reference: 'BOU-005', prix: 14.00, prixPromo: 11.90, unite: 'kg', labels: ['PROMO', 'LOCAL'] }
    ],
    'poissonnerie': [
      { nom: 'Saumon frais', reference: 'POI-001', prix: 22.00, unite: 'kg', labels: [] },
      { nom: 'Crevettes roses', reference: 'POI-002', prix: 18.00, unite: 'kg', labels: [] },
      { nom: 'Moules de bouchot', reference: 'POI-003', prix: 6.50, unite: 'kg', labels: ['AOP'] },
      { nom: 'Filet de cabillaud', reference: 'POI-004', prix: 19.00, unite: 'kg', labels: [] }
    ],
    'epicerie': [
      { nom: 'Huile d\'olive vierge extra', reference: 'EPI-001', prix: 12.00, unite: 'litre', labels: [] },
      { nom: 'Pâtes artisanales', reference: 'EPI-002', prix: 4.50, unite: 'kg', labels: ['LOCAL'] },
      { nom: 'Miel de lavande', reference: 'EPI-003', prix: 15.00, unite: 'kg', labels: ['LOCAL'] },
      { nom: 'Confiture de fraises', reference: 'EPI-004', prix: 5.90, unite: 'piece', labels: [] }
    ],
    'boulangerie': [
      { nom: 'Baguette tradition', reference: 'BOU-001', prix: 1.30, unite: 'piece', labels: [] },
      { nom: 'Pain de campagne', reference: 'BOU-002', prix: 3.50, unite: 'piece', labels: [] },
      { nom: 'Croissants x6', reference: 'BOU-003', prix: 6.00, prixPromo: 4.80, unite: 'piece', labels: ['PROMO'] },
      { nom: 'Pain au chocolat x6', reference: 'BOU-004', prix: 7.20, unite: 'piece', labels: [] }
    ]
  };

  const categoryKey = Object.keys(productTemplates).find(key => 
    categories.find(c => c.slug === key)?.nom === categorieName
  );

  return (productTemplates[categoryKey] || []).map(p => ({
    ...p,
    categorieId,
    slug: p.nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
    description: `${p.nom} de qualité premium, sélectionné avec soin par nos équipes.`,
    stockQuantite: Math.floor(Math.random() * 200) + 50,
    stockMinAlerte: 10,
    tauxTva: 5.5,
    origine: 'France'
  }));
};

// ==========================================
// FONCTIONS DE SEED
// ==========================================

async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Début du seed...\n');
    
    await client.query('BEGIN');

    // Nettoyer les tables
    console.log('🗑️  Nettoyage des tables...');
    await client.query('DELETE FROM ligne_commande');
    await client.query('DELETE FROM commande');
    await client.query('DELETE FROM produit');
    await client.query('DELETE FROM categorie');
    await client.query('DELETE FROM adresse');
    await client.query('DELETE FROM utilisateur');

    // Créer les utilisateurs
    console.log('👤 Création des utilisateurs...');
    const adminHash = await bcrypt.hash('Admin123!', 12);
    const clientHash = await bcrypt.hash('Client123!', 12);
    const proHash = await bcrypt.hash('Pro123!', 12);

    const adminResult = await client.query(`
      INSERT INTO utilisateur (email, mot_de_passe_hash, nom, prenom, role, type_client, est_actif, accepte_cgu)
      VALUES ('admin@jana-distribution.fr', $1, 'Admin', 'Jana', 'ADMIN', 'PARTICULIER', true, true)
      RETURNING id
    `, [adminHash]);
    console.log(`   ✅ Admin créé: admin@jana-distribution.fr / Admin123!`);

    const clientResult = await client.query(`
      INSERT INTO utilisateur (email, mot_de_passe_hash, nom, prenom, telephone, role, type_client, est_actif, accepte_cgu)
      VALUES ('client@test.fr', $1, 'Dupont', 'Jean', '0612345678', 'CLIENT', 'PARTICULIER', true, true)
      RETURNING id
    `, [clientHash]);
    console.log(`   ✅ Client créé: client@test.fr / Client123!`);

    const proResult = await client.query(`
      INSERT INTO utilisateur (email, mot_de_passe_hash, nom, prenom, telephone, role, type_client, siret, raison_sociale, est_actif, accepte_cgu)
      VALUES ('pro@restaurant.fr', $1, 'Martin', 'Sophie', '0698765432', 'CLIENT', 'PROFESSIONNEL', '12345678901234', 'Restaurant Le Gourmet', true, true)
      RETURNING id
    `, [proHash]);
    console.log(`   ✅ Pro créé: pro@restaurant.fr / Pro123!`);

    // Créer les catégories
    console.log('\n📁 Création des catégories...');
    const categoryIds = {};
    
    for (const cat of categories) {
      const result = await client.query(`
        INSERT INTO categorie (nom, slug, description, couleur, icone, ordre, est_actif)
        VALUES ($1, $2, $3, $4, $5, $6, true)
        RETURNING id
      `, [cat.nom, cat.slug, cat.description, cat.couleur, cat.icone, cat.ordre]);
      
      categoryIds[cat.nom] = result.rows[0].id;
      console.log(`   ✅ ${cat.icone} ${cat.nom}`);
    }

    // Créer les produits
    console.log('\n📦 Création des produits...');
    let productCount = 0;
    
    for (const [catName, catId] of Object.entries(categoryIds)) {
      const products = generateProducts(catId, catName);
      
      for (const product of products) {
        await client.query(`
          INSERT INTO produit (
            reference, nom, slug, description, prix, prix_promo,
            taux_tva, unite_mesure, stock_quantite, stock_min_alerte,
            labels, origine, categorie_id, est_actif
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
        `, [
          product.reference,
          product.nom,
          product.slug,
          product.description,
          product.prix,
          product.prixPromo || null,
          product.tauxTva,
          product.unite,
          product.stockQuantite,
          product.stockMinAlerte,
          product.labels,
          product.origine,
          product.categorieId
        ]);
        productCount++;
      }
    }
    console.log(`   ✅ ${productCount} produits créés`);

    // Créer une adresse pour le client
    console.log('\n🏠 Création des adresses...');
    await client.query(`
      INSERT INTO adresse (utilisateur_id, type, nom, prenom, adresse, code_postal, ville, pays, telephone, est_defaut)
      VALUES ($1, 'LIVRAISON', 'Dupont', 'Jean', '15 rue de la Paix', '75001', 'Paris', 'France', '0612345678', true)
    `, [clientResult.rows[0].id]);
    console.log(`   ✅ Adresse client créée`);

    await client.query('COMMIT');
    
    console.log('\n✨ Seed terminé avec succès !');
    console.log('\n📋 Récapitulatif:');
    console.log('   - 3 utilisateurs (1 admin, 1 client, 1 pro)');
    console.log(`   - ${categories.length} catégories`);
    console.log(`   - ${productCount} produits`);
    console.log('\n🔑 Comptes de test:');
    console.log('   Admin: admin@jana-distribution.fr / Admin123!');
    console.log('   Client: client@test.fr / Client123!');
    console.log('   Pro: pro@restaurant.fr / Pro123!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Erreur lors du seed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Exécution
seed().catch(err => {
  console.error(err);
  process.exit(1);
});
