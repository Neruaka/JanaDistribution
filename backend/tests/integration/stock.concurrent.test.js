// Tests race condition stock — vraie DB PostgreSQL
// Utilise testcontainers-node : Docker requis en local/CI
const { PostgreSqlContainer } = require('@testcontainers/postgresql');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

jest.setTimeout(120000); // testcontainers démarre Docker + charge le schéma

describe('Stock — race conditions', () => {
  let container, pool;
  let produitCounter = 0;

  const uniqueSuffix = () => `${Date.now()}-${++produitCounter}-${Math.floor(Math.random() * 100000)}`;

  const insertProduit = async ({ stock = 1, prix = 10.0, actif = true } = {}) => {
    const suffix = uniqueSuffix();
    const result = await pool.query(
      `INSERT INTO produit (reference, nom, slug, prix, stock_quantite, est_actif)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [`REF-${suffix}`, `Produit Test ${suffix}`, `produit-test-${suffix}`, prix, stock, actif]
    );
    return result.rows[0];
  };

  // Simule un "achat" : verrouille la ligne produit (SELECT ... FOR UPDATE),
  // vérifie le stock disponible, puis décrémente dans la même transaction.
  // Les transactions concurrentes se sérialisent sur le verrou de ligne.
  const attemptPurchase = async (produitId) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const res = await client.query(
        'SELECT stock_quantite FROM produit WHERE id = $1 FOR UPDATE',
        [produitId]
      );
      if (res.rows[0].stock_quantite < 1) {
        await client.query('ROLLBACK');
        return false; // Échec — plus de stock
      }
      await client.query(
        'UPDATE produit SET stock_quantite = stock_quantite - 1 WHERE id = $1',
        [produitId]
      );
      await client.query('COMMIT');
      return true; // Succès
    } catch {
      await client.query('ROLLBACK');
      return false;
    } finally {
      client.release();
    }
  };

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:15-alpine').start();
    pool = new Pool({ connectionString: container.getConnectionUri() });

    const initSql = fs.readFileSync(
      path.join(__dirname, '../../scripts/init.sql'),
      'utf8'
    );
    await pool.query(initSql);
  });

  afterAll(async () => {
    await pool?.end();
    await container?.stop();
  });

  beforeEach(async () => {
    // Aucune commande n'est créée dans ce fichier : nettoyer produit suffit.
    await pool.query('DELETE FROM produit');
  });

  test('deux achats simultanés sur le dernier article — au plus un réussit, stock final à 0', async () => {
    const produit = await insertProduit({ stock: 1 });

    const [r1, r2] = await Promise.all([
      attemptPurchase(produit.id),
      attemptPurchase(produit.id)
    ]);

    const successes = [r1, r2].filter(Boolean).length;
    expect(successes).toBe(1);

    const after = await pool.query(
      'SELECT stock_quantite FROM produit WHERE id = $1',
      [produit.id]
    );
    expect(after.rows[0].stock_quantite).toBe(0);
  });

  test('dix tentatives simultanées sur le dernier article — exactement une réussit', async () => {
    const produit = await insertProduit({ stock: 1 });

    const attempts = Array.from({ length: 10 }, () => attemptPurchase(produit.id));
    const results = await Promise.all(attempts);

    const successes = results.filter(Boolean).length;
    expect(successes).toBe(1);

    const after = await pool.query(
      'SELECT stock_quantite FROM produit WHERE id = $1',
      [produit.id]
    );
    expect(after.rows[0].stock_quantite).toBe(0);
  });

  test('huit tentatives simultanées avec un stock de 5 — exactement cinq réussissent, stock final à 0', async () => {
    const produit = await insertProduit({ stock: 5 });

    const attempts = Array.from({ length: 8 }, () => attemptPurchase(produit.id));
    const results = await Promise.all(attempts);

    const successes = results.filter(Boolean).length;
    expect(successes).toBe(5);

    const after = await pool.query(
      'SELECT stock_quantite FROM produit WHERE id = $1',
      [produit.id]
    );
    expect(after.rows[0].stock_quantite).toBe(0);
  });
});
