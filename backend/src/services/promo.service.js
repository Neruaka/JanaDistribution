/**
 * Promo Service
 * @description Logique métier de validation et calcul des codes promo
 */

const promoRepository = require('../repositories/promo.repository');
const logger = require('../config/logger');
const { ApiError } = require('../middlewares/errorHandler');

class PromoService {
  /**
   * Valide un code promo pour un client et un montant de commande donnés,
   * puis calcule le rabais applicable.
   *
   * Ordre de vérification : existence -> actif -> dates -> montant minimum ->
   * limite globale -> limite par client -> calcul du rabais.
   *
   * @param {string} code - Code promo saisi par le client
   * @param {string} utilisateurId - UUID de l'utilisateur
   * @param {number} totalCommande - Total TTC de la commande avant rabais
   * @returns {Object} { codePromo, montantRabais, totalApresRabais, message }
   */
  async validerCode(code, utilisateurId, totalCommande) {
    if (!code || typeof code !== 'string') {
      throw ApiError.badRequest('Le code promo est obligatoire');
    }

    const total = Number(totalCommande);
    if (!Number.isFinite(total) || total <= 0) {
      throw ApiError.badRequest('Le total de la commande est invalide');
    }

    // 1. Le code existe
    const codePromo = await promoRepository.findByCode(code.trim());
    if (!codePromo) {
      throw ApiError.badRequest('Code promo invalide ou inexistant');
    }

    // 2. Le code est actif
    if (!codePromo.actif) {
      throw ApiError.badRequest('Ce code promo n\'est plus actif');
    }

    // 3. Dates de validité
    const now = new Date();
    if (codePromo.dateDebut && now < new Date(codePromo.dateDebut)) {
      throw ApiError.badRequest('Ce code promo n\'est pas encore valide');
    }
    if (codePromo.dateFin && now > new Date(codePromo.dateFin)) {
      throw ApiError.badRequest('Ce code promo a expiré');
    }

    // 4. Montant minimum de commande
    if (codePromo.montantMinimum > 0 && total < codePromo.montantMinimum) {
      throw ApiError.badRequest(
        `Ce code promo nécessite un montant minimum de commande de ${codePromo.montantMinimum.toFixed(2)}€`
      );
    }

    // 5. Limite globale d'utilisations
    if (codePromo.maxUtilisationsGlobal !== null && codePromo.maxUtilisationsGlobal !== undefined) {
      const totalUtilisations = await promoRepository.countUtilisationsGlobal(codePromo.id);
      if (totalUtilisations >= codePromo.maxUtilisationsGlobal) {
        throw ApiError.badRequest('Ce code promo a atteint son nombre maximum d\'utilisations');
      }
    }

    // 6. Limite d'utilisations par client
    if (codePromo.maxUtilisationsParClient !== null && codePromo.maxUtilisationsParClient !== undefined) {
      const utilisationsClient = await promoRepository.countUtilisationsByUser(codePromo.id, utilisateurId);
      if (utilisationsClient >= codePromo.maxUtilisationsParClient) {
        throw ApiError.badRequest('Vous avez déjà utilisé ce code promo le nombre maximum de fois autorisé');
      }
    }

    // 7. Calcul du rabais
    const montantRabais = this._calculerRabais(codePromo, total);
    const totalApresRabais = Math.max(0, Math.round((total - montantRabais) * 100) / 100);

    logger.info('Code promo validé', {
      code: codePromo.code,
      utilisateurId,
      montantRabais,
      totalApresRabais
    });

    return {
      codePromo,
      montantRabais,
      totalApresRabais,
      message: `Code promo "${codePromo.code}" appliqué : -${montantRabais.toFixed(2)}€`
    };
  }

  /**
   * Calcule le montant du rabais selon le type (POURCENTAGE ou MONTANT_FIXE).
   * Le rabais ne peut jamais dépasser le total de la commande.
   * @private
   */
  _calculerRabais(codePromo, total) {
    let montantRabais;

    if (codePromo.typeRabais === 'POURCENTAGE') {
      montantRabais = total * (codePromo.valeurRabais / 100);
    } else if (codePromo.typeRabais === 'MONTANT_FIXE') {
      montantRabais = Math.min(codePromo.valeurRabais, total);
    } else {
      throw ApiError.internal(`Type de rabais inconnu: ${codePromo.typeRabais}`);
    }

    // Arrondi à 2 décimales (évite les erreurs de virgule flottante)
    return Math.round(montantRabais * 100) / 100;
  }
}

module.exports = new PromoService();
