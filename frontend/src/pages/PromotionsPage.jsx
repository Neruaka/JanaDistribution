/**
 * Page Promotions
 * @description Affiche tous les produits en promotion
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Tag,
  Percent,
  Clock,
  ShoppingCart,
  ChevronRight,
  Filter,
  SortAsc,
  Flame,
  Gift,
  Star,
  TrendingDown
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const PromotionsPage = () => {
  const { addItem } = useCart();
  
  // States
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('discount'); // discount, price, name
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);

  // Charger les produits en promo
  useEffect(() => {
    const loadPromotions = async () => {
      try {
        setLoading(true);
        const response = await api.get('/products', {
          params: {
            enPromotion: true,
            limit: 100
          }
        });
        
        let promoProducts = response.data.data || [];
        
        // Calculer le pourcentage de réduction pour chaque produit
        promoProducts = promoProducts.map(p => ({
          ...p,
          discountPercent: p.prixPromo ? Math.round((1 - p.prixPromo / p.prixHt) * 100) : 0
        }));
        
        setProducts(promoProducts);
        
        // Extraire les catégories uniques
        const uniqueCategories = [...new Set(promoProducts.map(p => p.categorie?.nom).filter(Boolean))];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Erreur chargement promotions:', error);
        toast.error('Erreur lors du chargement des promotions');
      } finally {
        setLoading(false);
      }
    };

    loadPromotions();
  }, []);

  // Filtrer et trier les produits
  const filteredProducts = products
    .filter(p => !categoryFilter || p.categorie?.nom === categoryFilter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'discount':
          return b.discountPercent - a.discountPercent;
        case 'price':
          return (a.prixPromo || a.prixHt) - (b.prixPromo || b.prixHt);
        case 'name':
          return a.nom.localeCompare(b.nom);
        default:
          return 0;
      }
    });

  // Ajouter au panier
  const handleAddToCart = (product) => {
    addItem({
      id: product.id,
      nom: product.nom,
      prix: product.prixPromo || product.prixHt,
      prixOriginal: product.prixHt,
      image: product.imageUrl,
      slug: product.slug
    });
    toast.success(`${product.nom} ajouté au panier !`);
  };

  // Formatter prix
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  // Carte produit promo
  const PromoProductCard = ({ product, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-lg transition-all duration-300"
    >
      {/* Image */}
      <Link to={`/produit/${product.slug}`} className="block relative aspect-square overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.nom}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <Gift className="w-16 h-16 text-gray-300" />
          </div>
        )}
        
        {/* Badge réduction */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white text-sm font-bold rounded-full shadow-lg">
            <TrendingDown className="w-4 h-4" />
            -{product.discountPercent}%
          </span>
        </div>

        {/* Badge stock faible */}
        {product.stock <= 5 && product.stock > 0 && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-full">
              <Flame className="w-3 h-3" />
              Plus que {product.stock} !
            </span>
          </div>
        )}
      </Link>

      {/* Contenu */}
      <div className="p-4">
        {/* Catégorie */}
        {product.categorie && (
          <span className="text-xs text-gray-500 font-medium">
            {product.categorie.nom}
          </span>
        )}

        {/* Nom */}
        <Link to={`/produit/${product.slug}`}>
          <h3 className="font-semibold text-gray-800 mt-1 line-clamp-2 group-hover:text-green-600 transition-colors">
            {product.nom}
          </h3>
        </Link>

        {/* Prix */}
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-red-600">
            {formatPrice(product.prixPromo)}
          </span>
          <span className="text-sm text-gray-400 line-through">
            {formatPrice(product.prixHt)}
          </span>
        </div>

        {/* Économie */}
        <p className="text-xs text-green-600 font-medium mt-1">
          Économisez {formatPrice(product.prixHt - product.prixPromo)}
        </p>

        {/* Bouton ajouter */}
        <button
          onClick={() => handleAddToCart(product)}
          disabled={product.stock === 0}
          className={`w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
            product.stock === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-md'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          {product.stock === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-sm font-medium mb-4">
              <Flame className="w-4 h-4" />
              Offres limitées
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              🔥 Promotions
            </h1>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Profitez de nos meilleures offres sur une sélection de produits frais. 
              Des économies garanties sur vos courses !
            </p>
            
            {/* Stats */}
            <div className="flex items-center justify-center gap-8 mt-8">
              <div className="text-center">
                <p className="text-3xl font-bold">{products.length}</p>
                <p className="text-sm text-white/80">Produits en promo</p>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div className="text-center">
                <p className="text-3xl font-bold">
                  -{Math.max(...products.map(p => p.discountPercent), 0)}%
                </p>
                <p className="text-sm text-white/80">Réduction max</p>
              </div>
              <div className="w-px h-12 bg-white/20 hidden sm:block"></div>
              <div className="text-center hidden sm:block">
                <p className="text-3xl font-bold">{categories.length}</p>
                <p className="text-sm text-white/80">Catégories</p>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Vague décorative */}
        <div className="h-8 bg-gray-50" style={{
          clipPath: 'ellipse(60% 100% at 50% 100%)'
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filtres */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Filtre catégorie */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">Toutes les catégories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Tri */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trier par
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="discount">Meilleure réduction</option>
                <option value="price">Prix croissant</option>
                <option value="name">Nom A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contenu */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Chargement des promotions...</p>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Aucune promotion disponible
            </h3>
            <p className="text-gray-500 mb-6">
              {categoryFilter 
                ? `Pas de promotion dans la catégorie "${categoryFilter}" pour le moment.`
                : 'Revenez bientôt pour découvrir nos nouvelles offres !'
              }
            </p>
            <Link
              to="/catalogue"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
            >
              Voir le catalogue
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Nombre de résultats */}
            <p className="text-sm text-gray-500 mb-4">
              {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} en promotion
            </p>

            {/* Grille produits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product, index) => (
                <PromoProductCard 
                  key={product.id} 
                  product={product} 
                  index={index}
                />
              ))}
            </div>
          </>
        )}

        {/* Bannière newsletter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16 bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-8 text-white text-center"
        >
          <Gift className="w-12 h-12 mx-auto mb-4 opacity-80" />
          <h3 className="text-2xl font-bold mb-2">
            Ne ratez aucune promotion !
          </h3>
          <p className="text-green-100 mb-6 max-w-xl mx-auto">
            Inscrivez-vous à notre newsletter pour recevoir en avant-première 
            nos meilleures offres et promotions exclusives.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Votre email"
              className="flex-1 px-4 py-3 rounded-xl text-gray-800 focus:ring-2 focus:ring-white"
            />
            <button className="px-6 py-3 bg-white text-green-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
              S'inscrire
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PromotionsPage;
