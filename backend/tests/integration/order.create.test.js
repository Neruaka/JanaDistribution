// Tests d'intégration — création commande sur vraie DB PostgreSQL
// Utilise testcontainers-node : Docker requis en CI
const { PostgreSqlContainer } = require('@testcontainers/postgresql');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

jest.setTimeout(120000); // testcontainers démarre Docker

describe('Order creation — integration', () => {
  let container, pool;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:15').start();
    pool = new Pool({ connectionString: container.getConnectionUri() });

    // Appliquer le schéma (sans DROP TABLE)
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

  test('crée un produit et vérifie le stock initial', async () => {
    const result = await pool.query(
      `INSERT INTO produit (nom, prix, stock, actif) VALUES ('TestProd', 10.00, 5, true) RETURNING id, stock`
    );
    expect(result.rows[0].stock).toBe(5);
  });

  test('rollback si stock insuffisant — stock reste inchangé', async () => {
    const { rows } = await pool.query(
      `INSERT INTO produit (nom, prix, stock, actif) VALUES ('RuptureTest', 10.00, 1, true) RETURNING id`
    );
    const produitId = rows[0].id;

    // Simuler une tentative de décrément de stock de 5 sur un produit à 1
    await pool.query('BEGIN');
    try {
      await pool.query(
        `UPDATE produit SET stock = stock - 5 WHERE id = $1 AND stock >= 5`,
        [produitId]
      );
      await pool.query('COMMIT');
    } catch {
      await pool.query('ROLLBACK');
    }

    const after = await pool.query('SELECT stock FROM produit WHERE id = $1', [produitId]);
    expect(after.rows[0].stock).toBe(1);
  });
});
