#!/usr/bin/env node
/**
 * Runner de migrations versionnées — Jana Distribution
 *
 * Usage : node scripts/run-migrations.js
 *         npm run migrate
 *
 * Répertoire : backend/scripts/migrations/*.sql (ordre alphabétique)
 * Table      : schema_migrations (name, checksum, applied_at)
 * Sécurité   : pg_advisory_lock empêche les exécutions concurrentes
 *
 * Chaque migration est exécutée dans une transaction qui inclut également
 * l'INSERT dans schema_migrations — atomicité totale.
 *
 * Si une migration possède ses propres BEGIN/COMMIT, ils sont retirés avant
 * exécution pour éviter les transactions imbriquées.
 *
 * NE PAS auto-exécuter au démarrage en production (Phase 8).
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const ADVISORY_LOCK_KEY = 1985734892;

function sha256(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

function stripTransactionWrappers(sql) {
  // Retire les BEGIN; et COMMIT; autonomes (transaction wrappers) mais
  // laisse intact BEGIN à l'intérieur des blocs PL/pgSQL (DO $$ BEGIN).
  return sql
    .replace(/^[ \t]*BEGIN[ \t]*;[ \t]*$/im, '')
    .replace(/^[ \t]*COMMIT[ \t]*;[ \t]*$/im, '');
}

function createPool() {
  if (process.env.DATABASE_URL) {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }
  return new Pool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT) || 5432,
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME     || 'jana_distribution'
  });
}

async function main() {
  const pool = createPool();
  const client = await pool.connect();

  try {
    console.log('[migrate] Connexion à la base de données...');

    await client.query('SELECT pg_advisory_lock($1)', [ADVISORY_LOCK_KEY]);
    console.log('[migrate] Verrou advisory acquis');

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id         SERIAL       PRIMARY KEY,
        name       VARCHAR(255) NOT NULL UNIQUE,
        checksum   VARCHAR(64)  NOT NULL,
        applied_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const { rows: applied } = await client.query(
      'SELECT name, checksum FROM schema_migrations ORDER BY name'
    );
    const appliedMap = new Map(applied.map(r => [r.name, r.checksum]));

    if (!fs.existsSync(MIGRATIONS_DIR)) {
      console.log('[migrate] Aucun répertoire migrations trouvé — rien à faire');
      return;
    }

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('[migrate] Aucune migration à appliquer');
      return;
    }

    let appliedCount = 0;
    let skippedCount = 0;

    for (const file of files) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const checksum = sha256(content);

      if (appliedMap.has(file)) {
        if (appliedMap.get(file) !== checksum) {
          console.error(`[migrate] ERREUR : ${file} modifiée après application (checksum mismatch)`);
          console.error('[migrate] Ne jamais modifier une migration déjà appliquée — créer une nouvelle migration.');
          process.exit(1);
        }
        console.log(`[migrate] Ignorée (déjà appliquée) : ${file}`);
        skippedCount++;
        continue;
      }

      console.log(`[migrate] Application : ${file}...`);
      const sql = stripTransactionWrappers(content);

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)',
          [file, checksum]
        );
        await client.query('COMMIT');
        console.log(`[migrate] ✓ ${file} appliquée`);
        appliedCount++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[migrate] ERREUR lors de ${file} : ${err.message}`);
        process.exit(1);
      }
    }

    console.log(`[migrate] Terminé : ${appliedCount} appliquée(s), ${skippedCount} ignorée(s)`);

  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock($1)', [ADVISORY_LOCK_KEY]);
    } catch (_) {
      // La fermeture de session libère le verrou automatiquement
    }
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('[migrate] ERREUR fatale :', err.message);
  process.exit(1);
});
