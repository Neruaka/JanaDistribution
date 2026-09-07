/**
 * Service Listes récurrentes (T16-13)
 * @description Enregistrer le panier courant comme liste réutilisable, et
 * ré-ajouter les produits d'une liste au panier en un clic.
 */

const listeRecurrenteRepository = require('../repositories/liste-recurrente.repository');
const cartRepository = require('../repositories/cart.repository');
const cartService = require('./cart.service');
const logger = require('../config/logger');
const { ApiError } = require('../middlewares/errorHandler');

class ListeRecurrenteService {
  /**
   * Crée une liste récurrente à partir du panier actuel de l'utilisateur
   * (jamais depuis des données envoyées par le client — source de vérité
   * serveur, comme pour createFromCart).
   */
  async createFromCart(utilisateurId, nom) {
    if (!nom || !nom.trim()) {
      throw ApiError.badRequest('Le nom de la liste est requis');
    }

    const cart = await cartRepository.getOrCreateCart(utilisateurId);
    if (!cart.items || cart.items.length === 0) {
      throw ApiError.badRequest('Le panier est vide');
    }

    const items = cart.items.map((item) => ({ produitId: item.productId, quantite: item.quantity }));
    const liste = await listeRecurrenteRepository.create(utilisateurId, nom.trim(), items);

    logger.info(`Liste récurrente créée: ${liste.id} (${items.length} produits) pour utilisateur ${utilisateurId}`);
    return liste;
  }

  async getMesListes(utilisateurId) {
    return listeRecurrenteRepository.findAllByUser(utilisateurId);
  }

  /**
   * Ré-ajoute chaque produit de la liste au panier — même logique que
   * OrderDetailPage#handleReorder côté client : on continue sur les
   * échecs individuels (produit désactivé/rupture) plutôt que d'échouer
   * la liste entière, et on rapporte combien ont réussi.
   */
  async ajouterAuPanier(listeId, utilisateurId) {
    const liste = await listeRecurrenteRepository.findById(listeId);
    if (!liste || liste.utilisateurId !== utilisateurId) {
      throw ApiError.notFound('Liste récurrente non trouvée');
    }

    let added = 0;
    for (const item of liste.produits) {
      try {
        await cartService.addItem(utilisateurId, item.produitId, item.quantite);
        added += 1;
      } catch (error) {
        logger.warn(`Produit ${item.produitId} non ajouté depuis la liste ${listeId}: ${error.message}`);
      }
    }

    return { added, skipped: liste.produits.length - added };
  }

  async deleteListe(listeId, utilisateurId) {
    const deleted = await listeRecurrenteRepository.delete(listeId, utilisateurId);
    if (!deleted) {
      throw ApiError.notFound('Liste récurrente non trouvée');
    }
  }
}

module.exports = new ListeRecurrenteService();
