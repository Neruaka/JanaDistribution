// Tests d'intégration — création commande sur vraie DB PostgreSQL
// Utilise testcontainers-node : Docker requis en local/CI
//
// NOTE: on n'utilise pas src/repositories/order.repository.js ici car
// tests/setup.js (setupFilesAfterEnv, chargé pour TOUS les fichiers de test
// jest, y compris ceux-ci) mock globalement '../src/config/database'.
// On reproduit donc fidèlement la logique transactionnelle du repository
// (décrément atomique du stock via UPDATE ... WHERE stock_quantite >= qty,
// rollback complet si une ligne échoue) directement en SQL, contre une vraie
// instance Postgres fournie par testcontainers.
const { PostgreSqlContainer } = require('@testcontainers/postgresql');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

jest.setTimeout(120000); // testcontainers démarre Docker + charge le schéma

describe('Order creation — integration', () => {
  let container, pool;
  let produitCounter = 0;

  const uniqueSuffix = () => `${Date.now()}-${++produitCounter}-${Math.floor(Math.random() * 100000)}`;

  const insertProduit = async ({ stock = 10, prix = 10.0, actif = true } = {}) => {
    const suffix = uniqueSuffix();
    const result = await pool.query(
      `INSERT INTO produit (reference, nom, slug, prix, stock_quantite, est_actif)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [`REF-${suffix}`, `Produit Test ${suffix}`, `produit-test-${suffix}`, prix, stock, actif]
    );
    return result.rows[0];
  };

  // numero_commande est VARCHAR(20) en DB (voir init.sql) — le format de production
  // (CMD-YYYYMMDD-0001) tient largement dedans, donc ce helper de test doit rester
  // court lui aussi plutôt que d'utiliser uniqueSuffix() (bien trop long pour la colonne).
  const uniqueNumeroCommande = () => `CMD-${Date.now().toString(36)}${(++produitCounter).toString(36)}`;

  // Reproduit la logique de OrderRepository.create() : transaction unique,
  // décrément atomique du stock par ligne (verrou implicite via la clause
  // WHERE stock_quantite >= quantite), rollback complet si une ligne échoue.
  const createOrderWithLines = async ({ numeroCommande, lignes, modePaiement = 'VIREMENT', adresseLivraison }) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const totalHt = lignes.reduce((sum, l) => sum + l.prixUnitaireHt * l.quantite, 0);
      const totalTva = lignes.reduce(
        (sum, l) => sum + l.prixUnitaireHt * l.quantite * (l.tauxTva / 100),
        0
      );
      const totalTtc = totalHt + totalTva;

      const orderResult = await client.query(
        `INSERT INTO commande (
           numero_commande, statut, total_ht, total_tva, total_ttc,
           adresse_livraison, mode_paiement
         ) VALUES ($1, 'EN_ATTENTE', $2, $3, $4, $5, $6)
         RETURNING *`,
        [numeroCommande, totalHt, totalTva, totalTtc, JSON.stringify(adresseLivraison), modePaiement]
      );
      const commande = orderResult.rows[0];

      for (const ligne of lignes) {
        const ligneTotalHt = ligne.prixUnitaireHt * ligne.quantite;
        const ligneTotalTtc = ligneTotalHt * (1 + ligne.tauxTva / 100);

        const stockUpdate = await client.query(
          `UPDATE produit
           SET stock_quantite = stock_quantite - $1, date_modification = NOW()
           WHERE id = $2 AND est_actif = true AND stock_quantite >= $1
           RETURNING id, stock_quantite`,
          [ligne.quantite, ligne.produitId]
        );

        if (stockUpdate.rowCount === 0) {
          throw new Error(`Stock insuffisant ou produit indisponible pour ${ligne.produitId}`);
        }

        await client.query(
          `INSERT INTO ligne_commande (
             commande_id, produit_id, quantite, prix_unitaire_ht,
             taux_tva, total_ht, total_ttc, nom_produit
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            commande.id,
            ligne.produitId,
            ligne.quantite,
            ligne.prixUnitaireHt,
            ligne.tauxTva,
            ligneTotalHt,
            ligneTotalTtc,
            ligne.nomProduit
          ]
        );
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
    // Nettoyage dans l'ordre des FK (enfants avant parents)
    await pool.query('DELETE FROM code_promo_utilisation');
    await pool.query('DELETE FROM ligne_commande');
    await pool.query('DELETE FROM commande_statut_historique');
    await pool.query('DELETE FROM commande');
    await pool.query('DELETE FROM produit');
  });

  test('crée une commande et décrémente le stock de façon atomique', async () => {
    const produit = await insertProduit({ stock: 10, prix: 12.5 });
    const numeroCommande = uniqueNumeroCommande();

    const commande = await createOrderWithLines({
      numeroCommande,
      adresseLivraison: { ville: 'Paris', codePostal: '75001' },
      lignes: [
        {
          produitId: produit.id,
          quantite: 3,
          prixUnitaireHt: 12.5,
          tauxTva: 5.5,
          nomProduit: produit.nom
        }
      ]
    });

    expect(commande.numero_commande).toBe(numeroCommande);
    expect(commande.statut).toBe('EN_ATTENTE');

    const produitAfter = await pool.query(
      'SELECT stock_quantite FROM produit WHERE id = $1',
      [produit.id]
    );
    expect(produitAfter.rows[0].stock_quantite).toBe(7);

    const lignes = await pool.query(
      'SELECT * FROM ligne_commande WHERE commande_id = $1',
      [commande.id]
    );
    expect(lignes.rows).toHaveLength(1);
    expect(parseFloat(lignes.rows[0].total_ht)).toBeCloseTo(37.5, 2);
    expect(parseFloat(lignes.rows[0].prix_unitaire_ht)).toBeCloseTo(12.5, 2);
    expect(lignes.rows[0].nom_produit).toBe(produit.nom);
  });

  test('rollback si stock insuffisant — commande et ligne non créées, stock inchangé', async () => {
    const produit = await insertProduit({ stock: 2 });
    const numeroCommande = uniqueNumeroCommande();

    await expect(
      createOrderWithLines({
        numeroCommande,
        adresseLivraison: { ville: 'Lyon' },
        lignes: [
          {
            produitId: produit.id,
            quantite: 5,
            prixUnitaireHt: 10,
            tauxTva: 20,
            nomProduit: produit.nom
          }
        ]
      })
    ).rejects.toThrow();

    const commandeCheck = await pool.query(
      'SELECT COUNT(*)::int AS count FROM commande WHERE numero_commande = $1',
      [numeroCommande]
    );
    expect(commandeCheck.rows[0].count).toBe(0);

    const ligneCheck = await pool.query(
      'SELECT COUNT(*)::int AS count FROM ligne_commande lc JOIN commande c ON c.id = lc.commande_id WHERE c.numero_commande = $1',
      [numeroCommande]
    );
    expect(ligneCheck.rows[0].count).toBe(0);

    const produitAfter = await pool.query(
      'SELECT stock_quantite FROM produit WHERE id = $1',
      [produit.id]
    );
    expect(produitAfter.rows[0].stock_quantite).toBe(2);
  });

  test('commande multi-lignes : rollback total (y compris décréments déjà appliqués) si une ligne échoue', async () => {
    const produitA = await insertProduit({ stock: 10 });
    const produitB = await insertProduit({ stock: 1 });
    const numeroCommande = uniqueNumeroCommande();

    await expect(
      createOrderWithLines({
        numeroCommande,
        adresseLivraison: { ville: 'Nice' },
        lignes: [
          {
            produitId: produitA.id,
            quantite: 2,
            prixUnitaireHt: 5,
            tauxTva: 5.5,
            nomProduit: produitA.nom
          },
          {
            produitId: produitB.id,
            quantite: 5, // insuffisant (stock = 1)
            prixUnitaireHt: 5,
            tauxTva: 5.5,
            nomProduit: produitB.nom
          }
        ]
      })
    ).rejects.toThrow();

    // Le décrément de la première ligne (produitA) doit être annulé par le ROLLBACK
    const produitAAfter = await pool.query(
      'SELECT stock_quantite FROM produit WHERE id = $1',
      [produitA.id]
    );
    expect(produitAAfter.rows[0].stock_quantite).toBe(10);

    const produitBAfter = await pool.query(
      'SELECT stock_quantite FROM produit WHERE id = $1',
      [produitB.id]
    );
    expect(produitBAfter.rows[0].stock_quantite).toBe(1);

    const commandeCheck = await pool.query(
      'SELECT COUNT(*)::int AS count FROM commande WHERE numero_commande = $1',
      [numeroCommande]
    );
    expect(commandeCheck.rows[0].count).toBe(0);
  });
});
