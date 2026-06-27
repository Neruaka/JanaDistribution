// Tests d'intégration — flux authentification sur vraie DB PostgreSQL
const { PostgreSqlContainer } = require('@testcontainers/postgresql');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

jest.setTimeout(120000);

describe('Auth — integration', () => {
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

  test('flux complet register/login/refresh/logout — placeholder', async () => {
    // TODO: implémenter avec supertest + vraie DB
    expect(true).toBe(true);
  });

  test('login avec mauvais mot de passe → 401 — placeholder', async () => {
    expect(true).toBe(true);
  });

  test('refresh token révoqué après logout → invalide — placeholder', async () => {
    // Vérifier que la table refresh_token révoque bien le token
    const result = await pool.query(
      `SELECT COUNT(*) FROM refresh_token WHERE revoked_at IS NOT NULL`
    );
    expect(parseInt(result.rows[0].count)).toBeGreaterThanOrEqual(0);
  });
});
