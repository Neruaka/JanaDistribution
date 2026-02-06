/**
 * Composant ProductCard - VERSION CORRIGÉE
 * @description Carte produit pour affichage en grille
 * @location frontend/src/components/ProductCard.jsx
 * 
 * ✅ CORRECTION: Utilise getImageUrl pour les images locales
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Eye, Heart, Tag } from 'lucide-react';
import { getImageUrl } from '../utils/imageUtils'; // ✅ AJOUT

const ProductCard = ({ product, onAddToCart }) => {
  const {
    id,
    slug,
    nom,
    description,
    prix,
    prixPromo,
    imageUrl,
    stockQuantite,
    uniteMesure,
    labels = [],
    categorie
  } = product;

  // ✅ CORRECTION: Construire l'URL complète de l'image
  const fullImageUrl = getImageUrl(imageUrl);

  // Calcul du pourcentage de réduction
  const discount = prixPromo ? Math.round((1 - prixPromo / prix) * 100) : 0;

  // Vérifier si en stock
  const inStock = stockQuantite > 0;

  // Labels avec leurs couleurs
  const labelColors = {
    BIO: { bg: 'bg-green-100', text: 'text-green-700', icon: '🌱' },
    LOCAL: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '📍' },
    PROMO: { bg: 'bg-red-100', text: 'text-red-700', icon: '🏷️' },
    NOUVEAU: { bg: 'bg-purple-100', text: 'text-purple-700', icon: '✨' },
    AOP: { bg: 'bg-amber-100', text: 'text-amber-700', icon: '🏅' },
    AOC: { bg: 'bg-amber-100', text: 'text-amber-700', icon: '🏅' },
    LABEL_ROUGE: { bg: 'bg-red-100', text: 'text-red-700', icon: '🔴' }
  };

  // Formater le prix
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  // Unité de mesure lisible
  const unitLabels = {
    kg: '/kg',
    litre: '/L',
    piece: '/pièce',
    unite: '/unité'
  };

  return (
    <motion.div
      className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <Link to={`/produit/${slug}`}>
          {/* ✅ CORRECTION: Utilise fullImageUrl */}
          {fullImageUrl ? (
            <img
              src={fullImageUrl}
              alt={nom}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-gray-50 to-gray-100">
              🥬
            </div>
          )}
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {/* Badge Promo */}
          {prixPromo && (
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
              -{discount}%
            </span>
          )}
          
          {/* Labels */}
          {labels.slice(0, 2).map((label) => {
            const style = labelColors[label] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: '🏷️' };
            return (
              <span
                key={label}
                className={`${style.bg} ${style.text} text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1`}
              >
                <span className="text-xs">{style.icon}</span>
                {label}
              </span>
            );
          })}
        </div>

        {/* Stock épuisé */}
        {!inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-gray-800 font-semibold px-4 py-2 rounded-full">
              Rupture de stock
            </span>
          </div>
        )}

        {/* Actions au hover */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
            title="Ajouter aux favoris"
          >
            <Heart className="w-4 h-4 text-gray-600" />
          </motion.button>
          <Link to={`/produit/${slug}`}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
              title="Voir le produit"
            >
              <Eye className="w-4 h-4 text-gray-600" />
            </motion.button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Catégorie */}
        {categorie && (
          <Link 
            to={`/catalogue?categorie=${categorie.id || categorie.slug}`}
            className="text-xs text-green-600 hover:text-green-700 font-medium mb-1 block"
          >
            {categorie.nom}
          </Link>
        )}

        {/* Nom */}
        <Link to={`/produit/${slug}`}>
          <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2 hover:text-green-600 transition-colors">
            {nom}
          </h3>
        </Link>

        {/* Description courte */}
        {description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
            {description}
          </p>
        )}

        {/* Prix et Actions */}
        <div className="flex items-end justify-between mt-auto">
          <div>
            {/* Prix promo */}
            {prixPromo ? (
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-red-600">
                  {formatPrice(prixPromo)}
                </span>
                <span className="text-sm text-gray-400 line-through">
                  {formatPrice(prix)}
                </span>
              </div>
            ) : (
              <span className="text-xl font-bold text-gray-800">
                {formatPrice(prix)}
              </span>
            )}
            {/* Unité */}
            <span className="text-xs text-gray-500">
              {unitLabels[uniteMesure] || ''}
            </span>
          </div>

          {/* Bouton Ajouter */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onAddToCart && onAddToCart(product)}
            disabled={!inStock}
            className={`p-3 rounded-xl transition-all duration-200 ${
              inStock
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            title={inStock ? 'Ajouter au panier' : 'Produit indisponible'}
          >
            <ShoppingCart className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
