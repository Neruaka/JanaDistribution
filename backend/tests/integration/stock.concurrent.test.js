// Tests race condition stock — vraie DB PostgreSQL
const { PostgreSqlContainer } = require('@testcontainers/postgresql');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

jest.setTimeout(120000);

describe('Stock — race conditions', () => {
  let container, pool;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:15').start();
    pool = new Pool({ connectionString: container.getConnectionUri() });

    const initSql = fs.readFileSync(
      path.join(__dirname, '../../scripts/init.sql'), 'utf8'
    );
    const safeSql = initSql.replace(/DROP TABLE IF EXISTS[^;]+;/g, '');
    await pool.query(safeSql);
  });

  afterAll(async () => {
    await pool?.end();
    await container?.stop();
  });

  test('deux commandes simultanées sur dernier article — au plus une réussit', async () => {
    // Créer un produit avec stock = 1
    const { rows } = await pool.query(
      `INSERT INTO produit (nom, prix, stock, actif) VALUES ('DernierArticle', 10.00, 1, true) RETURNING id`
    );
    const produitId = rows[0].id;

    // Deux clients tentent de décrémenter le stock en même temps via SELECT FOR UPDATE
    const attemptPurchase = async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const res = await client.query(
          `SELECT stock FROM produit WHERE id = $1 FOR UPDATE`,
          [produitId]
        );
        if (res.rows[0].stock < 1) {
          await client.query('ROLLBACK');
          return false; // Échec
        }
        await client.query(
          `UPDATE produit SET stock = stock - 1 WHERE id = $1`,
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

    const [r1, r2] = await Promise.all([attemptPurchase(), attemptPurchase()]);

    // Au maximum 1 des deux commandes réussit
    expect(r1 && r2).toBe(false);

    const after = await pool.query('SELECT stock FROM produit WHERE id = $1', [produitId]);
    expect(after.rows[0].stock).toBeGreaterThanOrEqual(0);
  });
});
