// Tests d'intégration — flux authentification sur vraie DB PostgreSQL
// Utilise testcontainers-node : Docker requis en local/CI
//
// NOTE: tests/setup.js (setupFilesAfterEnv, appliqué à TOUS les fichiers de
// test jest) mock globalement '../src/config/database'. On travaille donc
// directement avec un vrai Pool `pg` connecté au conteneur testcontainers,
// sans passer par src/repositories/user.repository.js.
const { PostgreSqlContainer } = require('@testcontainers/postgresql');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

jest.setTimeout(120000); // testcontainers démarre Docker + charge le schéma

describe('Auth — integration', () => {
  let container, pool;
  let userCounter = 0;

  const uniqueEmail = () => `test.user.${Date.now()}.${++userCounter}@example.com`;

  const insertUser = async ({ email, motDePasseHash, accepteCgu = true } = {}) => {
    const result = await pool.query(
      `INSERT INTO utilisateur (email, mot_de_passe_hash, nom, prenom, accepte_cgu)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [email || uniqueEmail(), motDePasseHash, 'Doe', 'John', accepteCgu]
    );
    return result.rows[0];
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
    // Nettoyage dans l'ordre des FK (enfants avant parents)
    await pool.query('DELETE FROM refresh_token');
    await pool.query('DELETE FROM utilisateur');
  });

  describe('registration & password hashing', () => {
    test('enregistre un utilisateur avec un hash bcrypt et vérifie le mot de passe', async () => {
      const password = 'S3cur3P@ssw0rd!';
      const hash = await bcrypt.hash(password, 4);

      const user = await insertUser({ motDePasseHash: hash });

      expect(user.id).toBeDefined();
      expect(user.accepte_cgu).toBe(true);
      expect(user.mot_de_passe_hash).toBe(hash);
      // Le hash ne doit jamais être le mot de passe en clair
      expect(user.mot_de_passe_hash).not.toBe(password);

      const stored = await pool.query(
        'SELECT mot_de_passe_hash FROM utilisateur WHERE id = $1',
        [user.id]
      );

      const isValid = await bcrypt.compare(password, stored.rows[0].mot_de_passe_hash);
      expect(isValid).toBe(true);

      const isInvalid = await bcrypt.compare('WrongPassword123!', stored.rows[0].mot_de_passe_hash);
      expect(isInvalid).toBe(false);
    });

    test('rejette un email dupliqué au niveau de la contrainte UNIQUE de la DB', async () => {
      const email = uniqueEmail();
      const hash = await bcrypt.hash('SomePassword1!', 4);

      await insertUser({ email, motDePasseHash: hash });

      await expect(insertUser({ email, motDePasseHash: hash })).rejects.toThrow(
        /duplicate key value violates unique constraint/i
      );
    });
  });

  describe('refresh_token lifecycle', () => {
    const makeTokenHash = () =>
      crypto.createHash('sha256').update(crypto.randomBytes(32)).digest('hex');

    test('insère un refresh token actif (revoked_at IS NULL)', async () => {
      const hash = await bcrypt.hash('Password1!', 4);
      const user = await insertUser({ motDePasseHash: hash });

      const tokenHash = makeTokenHash();
      const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);

      await pool.query(
        `INSERT INTO refresh_token (token_hash, utilisateur_id, expires_at)
         VALUES ($1, $2, $3)`,
        [tokenHash, user.id, expiresAt]
      );

      const result = await pool.query(
        'SELECT * FROM refresh_token WHERE token_hash = $1',
        [tokenHash]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].revoked_at).toBeNull();
      expect(result.rows[0].utilisateur_id).toBe(user.id);
    });

    test('révoque un refresh token et l\'exclut des requêtes de tokens actifs', async () => {
      const hash = await bcrypt.hash('Password1!', 4);
      const user = await insertUser({ motDePasseHash: hash });

      const tokenHash = makeTokenHash();
      const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);

      await pool.query(
        `INSERT INTO refresh_token (token_hash, utilisateur_id, expires_at)
         VALUES ($1, $2, $3)`,
        [tokenHash, user.id, expiresAt]
      );

      // Avant révocation : le token apparaît dans les requêtes "actifs"
      const beforeRevoke = await pool.query(
        'SELECT * FROM refresh_token WHERE token_hash = $1 AND revoked_at IS NULL',
        [tokenHash]
      );
      expect(beforeRevoke.rows).toHaveLength(1);

      // Révocation (logout)
      await pool.query(
        `UPDATE refresh_token SET revoked_at = NOW()
         WHERE token_hash = $1 AND revoked_at IS NULL`,
        [tokenHash]
      );

      const revokedRow = await pool.query(
        'SELECT revoked_at FROM refresh_token WHERE token_hash = $1',
        [tokenHash]
      );
      expect(revokedRow.rows[0].revoked_at).not.toBeNull();

      // Après révocation : exclu des requêtes de tokens actifs
      const afterRevoke = await pool.query(
        'SELECT * FROM refresh_token WHERE utilisateur_id = $1 AND revoked_at IS NULL',
        [user.id]
      );
      expect(afterRevoke.rows).toHaveLength(0);
    });

    test('ne révoque que le token ciblé — les autres tokens actifs du même utilisateur restent valides', async () => {
      const hash = await bcrypt.hash('Password1!', 4);
      const user = await insertUser({ motDePasseHash: hash });

      const tokenA = makeTokenHash();
      const tokenB = makeTokenHash();
      const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);

      await pool.query(
        `INSERT INTO refresh_token (token_hash, utilisateur_id, expires_at) VALUES ($1, $2, $3), ($4, $2, $3)`,
        [tokenA, user.id, expiresAt, tokenB]
      );

      await pool.query(
        `UPDATE refresh_token SET revoked_at = NOW()
         WHERE token_hash = $1 AND revoked_at IS NULL`,
        [tokenA]
      );

      const activeTokens = await pool.query(
        'SELECT token_hash FROM refresh_token WHERE utilisateur_id = $1 AND revoked_at IS NULL',
        [user.id]
      );

      expect(activeTokens.rows).toHaveLength(1);
      expect(activeTokens.rows[0].token_hash).toBe(tokenB);
    });

    test('rejette un token_hash dupliqué (contrainte UNIQUE)', async () => {
      const hash = await bcrypt.hash('Password1!', 4);
      const user = await insertUser({ motDePasseHash: hash });

      const tokenHash = makeTokenHash();
      const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);

      await pool.query(
        `INSERT INTO refresh_token (token_hash, utilisateur_id, expires_at) VALUES ($1, $2, $3)`,
        [tokenHash, user.id, expiresAt]
      );

      await expect(
        pool.query(
          `INSERT INTO refresh_token (token_hash, utilisateur_id, expires_at) VALUES ($1, $2, $3)`,
          [tokenHash, user.id, expiresAt]
        )
      ).rejects.toThrow(/duplicate key value violates unique constraint/i);
    });
  });
});
