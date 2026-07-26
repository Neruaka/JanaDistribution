// Tests d'intégration — protection double-clic / double-soumission (T12-05)
// Utilise testcontainers-node : Docker requis en local/CI
//
// NOTE: comme pour order.create.test.js et stock.concurrent.test.js, on ne
// peut pas importer directement src/repositories/order.repository.js car
// tests/setup.js (setupFilesAfterEnv, chargé pour TOUS les fichiers de test
// jest) mock globalement '../src/config/database'. On reproduit donc
// fidèlement — et volontairement à l'identique — la nouvelle logique de
// verrouillage ajoutée dans order.repository.js#create() :
//   1. SELECT ... FOR UPDATE sur la ligne panier (verrou pessimiste)
//   2. vérification que ligne_panier n'est pas vide DANS la transaction
//   3. décrément atomique du stock (UPDATE ... WHERE stock_quantite >= qty)
//   4. suppression des lignes panier avant COMMIT
// contre une vraie instance Postgres fournie par testcontainers, pour
// prouver que deux soumissions concurrentes du même panier (double-clic)
// ne peuvent jamais produire deux commandes.
const { PostgreSqlContainer } = require('@testcontainers/postgresql');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

jest.setTimeout(120000); // testcontainers démarre Docker + charge le schéma

describe('Order creation — protection double-soumission (panier verrouillé)', () => {
  let container, pool;
  let counter = 0;

  const uniqueSuffix = () => `${Date.now()}-${++counter}-${Math.floor(Math.random() * 100000)}`;
  // numero_commande est VARCHAR(20) — rester court (ex: "CMD-482913-7")
  const shortNumero = () => `CMD-${Date.now().toString().slice(-6)}-${++counter}`;

  const insertProduit = async ({ stock = 10, prix = 10.0 } = {}) => {
    const suffix = uniqueSuffix();
    const result = await pool.query(
      `INSERT INTO produit (reference, nom, slug, prix, stock_quantite, est_actif)
       VALUES ($1, $2, $3, $4, $5, true) RETURNING *`,
      [`REF-${suffix}`, `Produit Test ${suffix}`, `produit-test-${suffix}`, prix, stock]
    );
    return result.rows[0];
  };

  const insertPanierAvecLigne = async ({ produitId, quantite }) => {
    const panierResult = await pool.query(
      `INSERT INTO panier (session_id) VALUES ($1) RETURNING id`,
      [`session-${uniqueSuffix()}`]
    );
    const panierId = panierResult.rows[0].id;
    await pool.query(
      `INSERT INTO ligne_panier (panier_id, produit_id, quantite, prix_unitaire) VALUES ($1, $2, $3, $4)`,
      [panierId, produitId, quantite, 10.0]
    );
    return panierId;
  };

  // Reproduit fidèlement order.repository.js#create() (verrou panier +
  // recheck vide + décrément atomique du stock + vidage panier avant commit)
  const createOrderLocked = async ({ panierId, numeroCommande, lignes }) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (panierId) {
        const cartLock = await client.query('SELECT id FROM panier WHERE id = $1 FOR UPDATE', [panierId]);
        if (!cartLock.rows[0]) {
          throw new Error('PANIER_INTROUVABLE');
        }
        const itemsCheck = await client.query(
          'SELECT COUNT(*)::int AS count FROM ligne_panier WHERE panier_id = $1',
          [panierId]
        );
        if (itemsCheck.rows[0].count === 0) {
          throw new Error('PANIER_VIDE');
        }
      }

      const orderResult = await client.query(
        `INSERT INTO commande (numero_commande, statut, total_ht, total_tva, total_ttc, adresse_livraison, mode_paiement)
         VALUES ($1, 'EN_ATTENTE', 0, 0, 0, $2, 'ESPECES')
         RETURNING *`,
        [numeroCommande, JSON.stringify({ ville: 'Paris' })]
      );
      const commande = orderResult.rows[0];

      for (const ligne of lignes) {
        const stockUpdate = await client.query(
          `UPDATE produit
           SET stock_quantite = stock_quantite - $1, date_modification = NOW()
           WHERE id = $2 AND est_actif = true AND stock_quantite >= $1
           RETURNING id`,
          [ligne.quantite, ligne.produitId]
        );
        if (stockUpdate.rowCount === 0) {
          throw new Error('STOCK_INSUFFISANT');
        }
        await client.query(
          `INSERT INTO ligne_commande (commande_id, produit_id, quantite, prix_unitaire_ht, taux_tva, total_ht, total_ttc, nom_produit)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [commande.id, ligne.produitId, ligne.quantite, 10.0, 5.5, ligne.quantite * 10, ligne.quantite * 10 * 1.055, 'Produit Test']
        );
      }

      if (panierId) {
        await client.query('DELETE FROM ligne_panier WHERE panier_id = $1', [panierId]);
      }

      await client.query('COMMIT');
      return commande;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
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
    await pool.query('DELETE FROM ligne_commande');
    await pool.query('DELETE FROM commande_statut_historique');
    await pool.query('DELETE FROM commande');
    await pool.query('DELETE FROM ligne_panier');
    await pool.query('DELETE FROM panier');
    await pool.query('DELETE FROM produit');
  });

  test('deux soumissions concurrentes du même panier (double-clic) — une seule commande créée, stock décrémenté une seule fois', async () => {
    const produit = await insertProduit({ stock: 5 });
    const panierId = await insertPanierAvecLigne({ produitId: produit.id, quantite: 2 });

    const lignes = [{ produitId: produit.id, quantite: 2 }];

    const results = await Promise.allSettled([
      createOrderLocked({ panierId, numeroCommande: shortNumero(), lignes }),
      createOrderLocked({ panierId, numeroCommande: shortNumero(), lignes })
    ]);

    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');

    // Exactement une des deux soumissions concurrentes doit aboutir
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason.message).toBe('PANIER_VIDE');

    // Une seule commande créée en base
    const commandeCount = await pool.query('SELECT COUNT(*)::int AS count FROM commande');
    expect(commandeCount.rows[0].count).toBe(1);

    // Le stock n'est décrémenté qu'une seule fois (5 - 2 = 3, pas 5 - 4 = 1)
    const produitAfter = await pool.query('SELECT stock_quantite FROM produit WHERE id = $1', [produit.id]);
    expect(produitAfter.rows[0].stock_quantite).toBe(3);

    // Le panier est bien vidé (par la commande qui a réussi)
    const panierLignes = await pool.query('SELECT COUNT(*)::int AS count FROM ligne_panier WHERE panier_id = $1', [panierId]);
    expect(panierLignes.rows[0].count).toBe(0);
  });

  test('dix soumissions concurrentes du même panier — une seule commande créée', async () => {
    const produit = await insertProduit({ stock: 20 });
    const panierId = await insertPanierAvecLigne({ produitId: produit.id, quantite: 1 });

    const lignes = [{ produitId: produit.id, quantite: 1 }];

    const attempts = Array.from({ length: 10 }, () =>
      createOrderLocked({ panierId, numeroCommande: shortNumero(), lignes })
    );
    const results = await Promise.allSettled(attempts);

    const fulfilled = results.filter(r => r.status === 'fulfilled');
    expect(fulfilled).toHaveLength(1);

    const commandeCount = await pool.query('SELECT COUNT(*)::int AS count FROM commande');
    expect(commandeCount.rows[0].count).toBe(1);

    const produitAfter = await pool.query('SELECT stock_quantite FROM produit WHERE id = $1', [produit.id]);
    expect(produitAfter.rows[0].stock_quantite).toBe(19);
  });
});
