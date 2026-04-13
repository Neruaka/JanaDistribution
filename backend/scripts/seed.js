/**
 * Script de Seed - Jana Distribution
 * @description Crée des données de test pour la base de données
 */

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const getEnv = (...keys) => {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }
  return undefined;
};

const hasExplicitLocalDbConfig = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'PGHOST', 'PGPORT', 'PGDATABASE', 'PGUSER', 'PGPASSWORD'].some((key) => {
  const value = process.env[key];
  return typeof value === 'string' && value.trim() !== '';
});
const hasDatabaseUrl = typeof process.env.DATABASE_URL === 'string' && process.env.DATABASE_URL.trim() !== '';
const shouldUseDatabaseUrl = hasDatabaseUrl && (process.env.NODE_ENV === 'production' || !hasExplicitLocalDbConfig);
const parsedLocalPort = parseInt(getEnv('DB_PORT', 'PGPORT') || '5432', 10);
const localDbConfig = {
  host: getEnv('DB_HOST', 'PGHOST') || 'localhost',
  port: Number.isNaN(parsedLocalPort) ? 5432 : parsedLocalPort,
  database: getEnv('DB_NAME', 'PGDATABASE') || 'jana_distribution',
  user: getEnv('DB_USER', 'PGUSER') || 'postgres',
  password: getEnv('DB_PASSWORD', 'PGPASSWORD') || 'postgres'
};

// Configuration de la connexion - supporte DATABASE_URL ou variables séparées
const pool = new Pool(
  shouldUseDatabaseUrl
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : localDbConfig
);

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

const produitsParCategorie = {
  'fruits-legumes': [
    { reference: 'FRL-001', nom: 'Pommes Gala Bio', prix: 3.50, unite: 'kg', labels: ['BIO', 'LOCAL'], stock: 150 },
    { reference: 'FRL-002', nom: 'Tomates Cerises', prix: 4.90, unite: 'kg', labels: ['LOCAL'], stock: 80 },
    { reference: 'FRL-003', nom: 'Bananes Bio', prix: 2.80, unite: 'kg', labels: ['BIO'], stock: 200 },
    { reference: 'FRL-004', nom: 'Carottes de saison', prix: 1.90, unite: 'kg', labels: ['LOCAL'], stock: 180 },
    { reference: 'FRL-005', nom: 'Fraises Gariguette', prix: 6.50, prixPromo: 5.20, unite: 'kg', labels: ['LOCAL', 'PROMO'], stock: 60 },
    { reference: 'FRL-006', nom: 'Avocats', prix: 2.50, unite: 'piece', labels: [], stock: 100 },
    { reference: 'FRL-007', nom: 'Citrons Bio', prix: 3.20, unite: 'kg', labels: ['BIO'], stock: 90 },
    { reference: 'FRL-008', nom: 'Salade Batavia', prix: 1.50, unite: 'piece', labels: ['LOCAL'], stock: 70 }
  ],
  'produits-laitiers': [
    { reference: 'LAI-001', nom: 'Comté AOP 18 mois', prix: 28.00, unite: 'kg', labels: ['AOP'], stock: 25 },
    { reference: 'LAI-002', nom: 'Beurre de Baratte', prix: 6.50, unite: 'piece', labels: ['LOCAL'], stock: 45 },
    { reference: 'LAI-003', nom: 'Yaourt Nature Bio x6', prix: 3.90, unite: 'piece', labels: ['BIO'], stock: 80 },
    { reference: 'LAI-004', nom: 'Crème fraîche épaisse', prix: 2.80, unite: 'piece', labels: [], stock: 60 },
    { reference: 'LAI-005', nom: 'Roquefort AOP', prix: 24.00, unite: 'kg', labels: ['AOP'], stock: 20 },
    { reference: 'LAI-006', nom: 'Lait frais entier', prix: 1.80, unite: 'litre', labels: ['LOCAL'], stock: 100 }
  ],
  'boucherie': [
    { reference: 'BOU-001', nom: 'Entrecôte de bœuf', prix: 32.00, unite: 'kg', labels: ['LABEL_ROUGE'], stock: 30 },
    { reference: 'BOU-002', nom: 'Poulet fermier', prix: 12.50, unite: 'kg', labels: ['LABEL_ROUGE', 'LOCAL'], stock: 40 },
    { reference: 'BOU-003', nom: 'Côtelettes d\'agneau', prix: 28.00, unite: 'kg', labels: [], stock: 25 },
    { reference: 'BOU-004', nom: 'Jambon blanc tranché', prix: 18.00, unite: 'kg', labels: [], stock: 35 },
    { reference: 'BOU-005', nom: 'Saucisses de Toulouse', prix: 14.00, prixPromo: 11.90, unite: 'kg', labels: ['PROMO', 'LOCAL'], stock: 50 }
  ],
  'poissonnerie': [
    { reference: 'POI-001', nom: 'Saumon frais', prix: 22.00, unite: 'kg', labels: [], stock: 30 },
    { reference: 'POI-002', nom: 'Crevettes roses', prix: 18.00, unite: 'kg', labels: [], stock: 25 },
    { reference: 'POI-003', nom: 'Moules de bouchot', prix: 6.50, unite: 'kg', labels: ['AOP'], stock: 60 },
    { reference: 'POI-004', nom: 'Filet de cabillaud', prix: 19.00, unite: 'kg', labels: [], stock: 35 }
  ],
  'epicerie': [
    { reference: 'EPI-001', nom: 'Huile d\'olive vierge extra', prix: 12.00, unite: 'litre', labels: [], stock: 70 },
    { reference: 'EPI-002', nom: 'Pâtes artisanales', prix: 4.50, unite: 'kg', labels: ['LOCAL'], stock: 90 },
    { reference: 'EPI-003', nom: 'Miel de lavande', prix: 15.00, unite: 'kg', labels: ['LOCAL'], stock: 40 },
    { reference: 'EPI-004', nom: 'Confiture de fraises', prix: 5.90, unite: 'piece', labels: [], stock: 55 }
  ],
  'boulangerie': [
    { reference: 'BLG-001', nom: 'Baguette tradition', prix: 1.30, unite: 'piece', labels: [], stock: 100 },
    { reference: 'BLG-002', nom: 'Pain de campagne', prix: 3.50, unite: 'piece', labels: [], stock: 50 },
    { reference: 'BLG-003', nom: 'Croissants x6', prix: 6.00, prixPromo: 4.80, unite: 'piece', labels: ['PROMO'], stock: 40 },
    { reference: 'BLG-004', nom: 'Pain au chocolat x6', prix: 7.20, unite: 'piece', labels: [], stock: 45 }
  ]
};

// ==========================================
// FONCTION PRINCIPALE
// ==========================================

async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Début du seed...\n');
    
    await client.query('BEGIN');

    // ==========================================
    // 1. NETTOYAGE
    // ==========================================
    console.log('🗑️  Nettoyage des tables...');
    
    // Ordre important pour les foreign keys
    await client.query('DELETE FROM ligne_commande').catch(() => console.log('   (ligne_commande vide ou inexistante)'));
    await client.query('DELETE FROM commande').catch(() => console.log('   (commande vide ou inexistante)'));
    await client.query('DELETE FROM ligne_panier').catch(() => console.log('   (ligne_panier vide ou inexistante)'));
    await client.query('DELETE FROM panier').catch(() => console.log('   (panier vide ou inexistante)'));
    await client.query('DELETE FROM produit').catch(() => console.log('   (produit vide ou inexistante)'));
    await client.query('DELETE FROM categorie').catch(() => console.log('   (categorie vide ou inexistante)'));
    await client.query('DELETE FROM adresse').catch(() => console.log('   (adresse vide ou inexistante)'));
    await client.query('DELETE FROM utilisateur').catch(() => console.log('   (utilisateur vide ou inexistante)'));
    
    console.log('   ✅ Tables nettoyées\n');

    // ==========================================
    // 2. UTILISATEURS
    // ==========================================
    console.log('👤 Création des utilisateurs...');
    
    const adminHash = await bcrypt.hash('Admin123!', 12);
    const clientHash = await bcrypt.hash('Client123!', 12);
    const proHash = await bcrypt.hash('Pro123!', 12);

    // Admin
    const adminResult = await client.query(`
      INSERT INTO utilisateur (email, mot_de_passe_hash, nom, prenom, role, type_client, est_actif, accepte_cgu)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, ['admin@jana-distribution.fr', adminHash, 'Admin', 'Jana', 'ADMIN', 'PARTICULIER', true, true]);
    console.log('   ✅ Admin: admin@jana-distribution.fr / Admin123!');

    // Client particulier
    const clientResult = await client.query(`
      INSERT INTO utilisateur (email, mot_de_passe_hash, nom, prenom, telephone, role, type_client, est_actif, accepte_cgu, accepte_newsletter)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `, ['client@test.fr', clientHash, 'Dupont', 'Jean', '0612345678', 'CLIENT', 'PARTICULIER', true, true, true]);
    console.log('   ✅ Client: client@test.fr / Client123!');

    // Client professionnel
    const proResult = await client.query(`
      INSERT INTO utilisateur (email, mot_de_passe_hash, nom, prenom, telephone, role, type_client, siret, raison_sociale, est_actif, accepte_cgu)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, ['pro@restaurant.fr', proHash, 'Martin', 'Sophie', '0698765432', 'CLIENT', 'PROFESSIONNEL', '12345678901234', 'Restaurant Le Gourmet', true, true]);
    console.log('   ✅ Pro: pro@restaurant.fr / Pro123!\n');

    // ==========================================
    // 3. ADRESSES
    // ==========================================
    console.log('🏠 Création des adresses...');
    
    await client.query(`
      INSERT INTO adresse (utilisateur_id, type, nom, prenom, adresse, code_postal, ville, pays, telephone, est_defaut)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [clientResult.rows[0].id, 'LIVRAISON', 'Dupont', 'Jean', '15 rue de la Paix', '75001', 'Paris', 'France', '0612345678', true]);
    
    await client.query(`
      INSERT INTO adresse (utilisateur_id, type, nom, prenom, adresse, code_postal, ville, pays, telephone, est_defaut)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [proResult.rows[0].id, 'LIVRAISON', 'Restaurant Le Gourmet', 'Sophie Martin', '42 avenue des Champs-Élysées', '75008', 'Paris', 'France', '0698765432', true]);
    
    console.log('   ✅ 2 adresses créées\n');

    // ==========================================
    // 4. CATÉGORIES
    // ==========================================
    console.log('📁 Création des catégories...');
    
    const categoryIds = {};
    
    for (const cat of categories) {
      const result = await client.query(`
        INSERT INTO categorie (nom, slug, description, couleur, icone, ordre, est_actif)
        VALUES ($1, $2, $3, $4, $5, $6, true)
        RETURNING id
      `, [cat.nom, cat.slug, cat.description, cat.couleur, cat.icone, cat.ordre]);
      
      categoryIds[cat.slug] = result.rows[0].id;
      console.log(`   ✅ ${cat.icone} ${cat.nom}`);
    }
    console.log('');

    // ==========================================
    // 5. PRODUITS
    // ==========================================
    console.log('📦 Création des produits...');
    
    let productCount = 0;
    let misEnAvantCount = 0;
    
    for (const [catSlug, produits] of Object.entries(produitsParCategorie)) {
      const categorieId = categoryIds[catSlug];
      
      for (const p of produits) {
        // Créer le slug à partir du nom
        const slug = p.nom
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        // Description auto
        const description = `${p.nom} de qualité premium, sélectionné avec soin par nos équipes. Origine France.`;
        
        // Mise en avant pour certains produits
        const misEnAvant = productCount < 8;
        if (misEnAvant) misEnAvantCount++;
        
        await client.query(`
          INSERT INTO produit (
            categorie_id, reference, nom, slug, description,
            prix, prix_promo, taux_tva, unite_mesure,
            stock_quantite, stock_min_alerte, labels, origine,
            est_actif, est_mis_en_avant
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `, [
          categorieId,
          p.reference,
          p.nom,
          slug,
          description,
          p.prix,
          p.prixPromo || null,
          5.50,
          p.unite,
          p.stock,
          10,
          p.labels,
          'France',
          true,
          misEnAvant
        ]);
        
        productCount++;
      }
    }
    
    console.log(`   ✅ ${productCount} produits créés`);
    console.log(`   ✅ ${misEnAvantCount} produits mis en avant\n`);

    // ==========================================
    // COMMIT
    // ==========================================
    await client.query('COMMIT');
    
    console.log('═'.repeat(50));
    console.log('✨ SEED TERMINÉ AVEC SUCCÈS !');
    console.log('═'.repeat(50));
    console.log('\n📋 Récapitulatif:');
    console.log('   - 3 utilisateurs (1 admin, 1 client, 1 pro)');
    console.log(`   • ${categories.length} catégories`);
    console.log(`   • ${productCount} produits`);
    console.log('   - 2 adresses');
    console.log('\n🔑 Comptes de test:');
    console.log('   Admin:  admin@jana-distribution.fr / Admin123!');
    console.log('   Client: client@test.fr / Client123!');
    console.log('   Pro:    pro@restaurant.fr / Pro123!');
    console.log('\n🚀 Tu peux maintenant lancer le backend avec: npm run dev\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Erreur lors du seed:', error.message);
    console.error(error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Exécution
seed().catch(err => {
  if (err?.code === '28P01' || err?.code === '28000') {
    console.error(
      '\n[seed] Auth PostgreSQL invalide. Verifie DB_USER/DB_PASSWORD, ou reset le volume local: docker compose down -v && docker compose up -d'
    );
  }
  if (err?.code === 'ECONNRESET') {
    console.error(
      '\n[seed] Connexion coupee par PostgreSQL. Souvent cause par un redemarrage du conteneur ou des credentials invalides.'
    );
  }
  console.error(err);
  process.exit(1);
});
