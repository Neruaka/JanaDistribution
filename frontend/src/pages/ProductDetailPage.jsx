/**
 * Page Détail Produit - VERSION CORRIGÉE
 * @description Affiche les détails complets d'un produit
 * @location frontend/src/pages/ProductDetailPage.jsx
 * 
 * ✅ CORRECTION: Utilise getImageUrl pour les images locales
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  ChevronRight, 
  Minus, 
  Plus,
  Truck,
  Shield,
  RotateCcw,
  Package,
  AlertCircle,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';

// Services
import productService from '../services/productService';

// Context
import { useCart } from '../contexts/CartContext';

// ✅ AJOUT: Import du helper
import { getImageUrl } from '../utils/imageUtils';

const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  // États
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  // Charger le produit
  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await productService.getBySlug(slug);
        if (response.success) {
          setProduct(response.data);
        } else {
          setError('Produit non trouvé');
        }
      } catch (err) {
        console.error('Erreur chargement produit:', err);
        setError('Impossible de charger le produit');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadProduct();
    }
  }, [slug]);

  // Gestion quantité
  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity(q => q - 1);
  };

  const increaseQuantity = () => {
    if (product && quantity < product.stockQuantite) {
      setQuantity(q => q + 1);
    }
  };

  // Ajouter au panier
  const handleAddToCart = async () => {
    const success = await addItem(product.id, quantity);
    if (success) {
      setQuantity(1); // Reset quantité après ajout
    }
  };

  // Partager
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.nom,
          text: product.description,
          url: window.location.href
        });
      } catch (err) {
        console.log('Partage annulé');
      }
    } else {
      // Fallback: copier l'URL
      navigator.clipboard.writeText(window.location.href);
      toast.success('Lien copié !');
    }
  };

  // Formater le prix
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  // Labels avec leurs styles
  const labelStyles = {
    BIO: { bg: 'bg-green-100', text: 'text-green-700', icon: '🌱' },
    LOCAL: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '📍' },
    PROMO: { bg: 'bg-red-100', text: 'text-red-700', icon: '🏷️' },
    NOUVEAU: { bg: 'bg-purple-100', text: 'text-purple-700', icon: '✨' },
    AOP: { bg: 'bg-amber-100', text: 'text-amber-700', icon: '🏅' },
    AOC: { bg: 'bg-amber-100', text: 'text-amber-700', icon: '🏅' },
    LABEL_ROUGE: { bg: 'bg-red-100', text: 'text-red-700', icon: '🔴' }
  };

  // Unités de mesure
  const unitLabels = {
    kg: 'le kg',
    litre: 'le litre',
    piece: 'la pièce',
    unite: 'l\'unité'
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-8" />
            <div className="grid md:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 rounded-2xl" />
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-24 bg-gray-200 rounded" />
                <div className="h-12 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Produit non trouvé</h2>
          <p className="text-gray-600 mb-6">{error || 'Ce produit n\'existe pas ou a été supprimé.'}</p>
          <button
            onClick={() => navigate('/catalogue')}
            className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors"
          >
            Retour au catalogue
          </button>
        </div>
      </div>
    );
  }

  const discount = product.prixPromo 
    ? Math.round((1 - product.prixPromo / product.prix) * 100) 
    : 0;

  const inStock = product.stockQuantite > 0;
  const lowStock = product.stockQuantite > 0 && product.stockQuantite <= 10;

  // ✅ CORRECTION: Construire l'URL complète de l'image
  const fullImageUrl = getImageUrl(product.imageUrl);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-green-600 transition-colors">
              Accueil
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/catalogue" className="hover:text-green-600 transition-colors">
              Catalogue
            </Link>
            {product.categorie && (
              <>
                <ChevronRight className="w-4 h-4" />
                <Link 
                  to={`/catalogue?categorie=${product.categorie.id}`}
                  className="hover:text-green-600 transition-colors"
                >
                  {product.categorie.nom}
                </Link>
              </>
            )}
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-800 font-medium truncate max-w-[200px]">
              {product.nom}
            </span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Main Image */}
            <div className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-4">
              {/* ✅ CORRECTION: Utilise fullImageUrl */}
              {fullImageUrl ? (
                <img
                  src={fullImageUrl}
                  alt={product.nom}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                  <span className="text-9xl">🥬</span>
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.prixPromo && (
                  <span className="bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
                    -{discount}%
                  </span>
                )}
                {product.labels?.map(label => {
                  const style = labelStyles[label] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: '🏷️' };
                  return (
                    <span
                      key={label}
                      className={`${style.bg} ${style.text} text-sm font-medium px-3 py-1 rounded-full flex items-center gap-1.5`}
                    >
                      <span>{style.icon}</span>
                      {label}
                    </span>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button
                  className="p-3 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                  title="Ajouter aux favoris"
                >
                  <Heart className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={handleShare}
                  className="p-3 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                  title="Partager"
                >
                  <Share2 className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Stock épuisé */}
              {!inStock && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="bg-white text-gray-800 font-semibold px-6 py-3 rounded-full text-lg">
                    Rupture de stock
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col"
          >
            {/* Category */}
            {product.categorie && (
              <Link
                to={`/catalogue?categorie=${product.categorie.id}`}
                className="text-green-600 hover:text-green-700 font-medium mb-2 inline-flex items-center gap-1"
              >
                {product.categorie.icone && <span>{product.categorie.icone}</span>}
                {product.categorie.nom}
              </Link>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {product.nom}
            </h1>

            {/* Reference */}
            <p className="text-sm text-gray-500 mb-4">
              Réf: {product.reference}
              {product.origine && ` • Origine: ${product.origine}`}
            </p>

            {/* Price */}
            <div className="mb-6">
              {product.prixPromo ? (
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-red-600">
                    {formatPrice(product.prixPromo)}
                  </span>
                  <span className="text-xl text-gray-400 line-through">
                    {formatPrice(product.prix)}
                  </span>
                  <span className="bg-red-100 text-red-700 text-sm font-semibold px-2 py-1 rounded">
                    -{discount}%
                  </span>
                </div>
              ) : (
                <span className="text-4xl font-bold text-gray-900">
                  {formatPrice(product.prix)}
                </span>
              )}
              <p className="text-gray-500 mt-1">
                Prix {unitLabels[product.uniteMesure] || ''} • TVA {product.tauxTva}% incluse
              </p>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Stock Status */}
            <div className="mb-6">
              {inStock ? (
                <div className={`flex items-center gap-2 ${lowStock ? 'text-amber-600' : 'text-green-600'}`}>
                  <Check className="w-5 h-5" />
                  <span className="font-medium">
                    {lowStock 
                      ? `Plus que ${product.stockQuantite} en stock !`
                      : 'En stock'
                    }
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Rupture de stock</span>
                </div>
              )}
            </div>

            {/* Quantity & Add to Cart */}
            {inStock && (
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                {/* Quantity Selector */}
                <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                  <button
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1}
                    className="p-3 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={product.stockQuantite}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.min(Math.max(1, parseInt(e.target.value) || 1), product.stockQuantite))}
                    className="w-16 text-center py-3 font-semibold text-lg focus:outline-none"
                  />
                  <button
                    onClick={increaseQuantity}
                    disabled={quantity >= product.stockQuantite}
                    className="p-3 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <motion.button
                  onClick={handleAddToCart}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Ajouter au panier
                  <span className="text-green-200">
                    ({formatPrice((product.prixPromo || product.prix) * quantity)})
                  </span>
                </motion.button>
              </div>
            )}

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3 text-gray-600">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Truck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Livraison rapide</p>
                  <p className="text-sm">24-48h</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Qualité garantie</p>
                  <p className="text-sm">Produits frais</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <RotateCcw className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Satisfait ou remboursé</p>
                  <p className="text-sm">14 jours</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Related Products Section - Placeholder */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Package className="w-6 h-6 text-green-600" />
            Produits similaires
          </h2>
          <p className="text-gray-500 text-center py-8">
            Section à implémenter...
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
