/**
 * Page d'accueil - VERSION CORRIGÉE
 * @description Landing page avec catégories et produits vedettes
 * @location frontend/src/pages/HomePage.jsx
 *
 * ✅ CORRECTIONS:
 * - Utilise getImageUrl pour les images des produits vedettes
 * - Footer géré par PublicLayout (pas de duplication)
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, 
  Truck, 
  Shield, 
  BadgePercent, 
  ArrowRight,
  Sparkles,
  Building2,
  Loader2
} from 'lucide-react';
import productService from '../services/productService';
import toast from 'react-hot-toast';

// ✅ Import du helper pour les images
import { getImageUrl } from '../utils/imageUtils';


// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.4 }
};

const HomePage = () => {
  const { user, isAuthenticated } = useAuth();
  const { addItem } = useCart();
  
  // État pour les produits vedettes
  const [produitsVedettes, setProduitsVedettes] = useState([]);
  const [loadingProduits, setLoadingProduits] = useState(true);
  const [addingToCart, setAddingToCart] = useState(null);

  // Charger les produits vedettes depuis l'API
  useEffect(() => {
    const fetchProduits = async () => {
      try {
        const response = await productService.getAll({ limit: 4, orderBy: 'createdAt', orderDir: 'DESC' });
        if (response.success && response.data) {
          setProduitsVedettes(response.data);
        }
      } catch (error) {
        console.error('Erreur chargement produits:', error);
      } finally {
        setLoadingProduits(false);
      }
    };
    fetchProduits();
  }, []);

  // Ajouter au panier
  const handleAddToCart = async (produit) => {
    if (!isAuthenticated) {
      toast.error('Connectez-vous pour ajouter au panier');
      return;
    }
    
    setAddingToCart(produit.id);
    const success = await addItem(produit.id, 1);
    setAddingToCart(null);
  };

  // Catégories
  const categories = [
    { id: 1, nom: 'Fruits & Légumes', icone: '🥬', slug: 'fruits-legumes', color: 'from-green-400 to-emerald-500', bgLight: 'bg-green-50' },
    { id: 2, nom: 'Produits Laitiers', icone: '🧀', slug: 'produits-laitiers', color: 'from-yellow-400 to-amber-500', bgLight: 'bg-yellow-50' },
    { id: 3, nom: 'Boucherie', icone: '🥩', slug: 'boucherie', color: 'from-red-400 to-rose-500', bgLight: 'bg-red-50' },
    { id: 4, nom: 'Boulangerie', icone: '🥖', slug: 'boulangerie', color: 'from-amber-400 to-orange-500', bgLight: 'bg-amber-50' },
    { id: 5, nom: 'Épicerie', icone: '🫒', slug: 'epicerie', color: 'from-orange-400 to-red-500', bgLight: 'bg-orange-50' },
    { id: 6, nom: 'Poissonnerie', icone: '🐟', slug: 'poissonnerie', color: 'from-blue-400 to-cyan-500', bgLight: 'bg-blue-50' },
  ];

  // Avantages
  const avantages = [
    { icon: Truck, title: 'Livraison rapide', desc: 'Livraison sous 24-48h pour les professionnels', color: 'text-blue-600', bg: 'bg-blue-100' },
    { icon: Shield, title: 'Qualité garantie', desc: 'Produits frais sélectionnés avec soin', color: 'text-green-600', bg: 'bg-green-100' },
    { icon: BadgePercent, title: 'Prix compétitifs', desc: 'Tarifs grossiste pour les professionnels', color: 'text-amber-600', bg: 'bg-amber-100' },
  ];
  
  // Formater le prix
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 text-white">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-green-500/10 to-transparent rounded-full" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text content */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm mb-6"
              >
                <Sparkles className="w-4 h-4" />
                <span>Grossiste alimentaire de confiance</span>
              </motion.div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Produits frais,{' '}
                <span className="text-green-300">qualité premium</span>
                {isAuthenticated && (
                  <span className="block text-3xl md:text-4xl mt-2 font-normal text-green-200">
                    Bienvenue, {user?.prenom} ! 👋
                  </span>
                )}
              </h1>
              
              <p className="text-lg md:text-xl text-green-100 mb-8 max-w-xl">
                Votre partenaire alimentaire en ligne. Des produits soigneusement sélectionnés pour particuliers et professionnels.
              </p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Link 
                  to="/catalogue"
                  className="group inline-flex items-center justify-center gap-2 bg-white text-green-700 px-8 py-4 rounded-xl font-semibold hover:bg-green-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Voir le catalogue
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                {!isAuthenticated && (
                  <Link 
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 border-2 border-white/50 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
                  >
                    <Building2 className="w-5 h-5" />
                    Espace Pro
                  </Link>
                )}
              </motion.div>
            </motion.div>

            {/* Hero illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:flex items-center justify-center"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-500/20 rounded-3xl blur-2xl scale-110" />
                <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
                  <div className="grid grid-cols-2 gap-4">
                    {['🥬', '🍅', '🧀', '🥖'].map((emoji, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="bg-white/20 backdrop-blur rounded-2xl p-6 text-center"
                      >
                        <span className="text-5xl">{emoji}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              { icon: '🚚', text: 'Livraison 24-48h' },
              { icon: '✅', text: 'Qualité garantie' },
              { icon: '💰', text: 'Prix grossiste' },
              { icon: '🔒', text: 'Paiement sécurisé' },
            ].map((item, i) => (
              <motion.div 
                key={i}
                variants={fadeInUp}
                className="flex items-center justify-center gap-2 text-gray-600"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="font-medium">{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Catégories */}
      <section className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Nos catégories</h2>
          <p className="text-gray-600 mb-8">Découvrez notre sélection de produits frais</p>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {categories.map((cat, index) => (
            <motion.div
              key={cat.id}
              variants={scaleIn}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                to={`/catalogue?categorie=${cat.slug}`}
                className={`block ${cat.bgLight} p-6 rounded-2xl text-center transition-all duration-300 hover:shadow-lg border border-transparent hover:border-gray-200`}
              >
                <span className="text-5xl block mb-3">{cat.icone}</span>
                <span className="font-semibold text-gray-800">{cat.nom}</span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Produits vedettes */}
      <section className="bg-gray-100/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="flex justify-between items-end mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Produits vedettes</h2>
              <p className="text-gray-600">Les favoris de nos clients</p>
            </div>
            <Link 
              to="/catalogue" 
              className="group hidden sm:inline-flex items-center gap-1 text-green-600 hover:text-green-700 font-semibold"
            >
              Voir tout 
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
          
          {/* Loader */}
          {loadingProduits ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            </div>
          ) : produitsVedettes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Aucun produit disponible pour le moment</p>
              <Link to="/catalogue" className="text-green-600 hover:underline mt-2 inline-block">
                Voir le catalogue complet
              </Link>
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {produitsVedettes.map((produit) => {
                const hasPromo = produit.prixPromo && produit.prixPromo < produit.prix;
                const discount = hasPromo ? Math.round((1 - produit.prixPromo / produit.prix) * 100) : 0;
                const inStock = produit.stockQuantite > 0;
                
                // ✅ CORRECTION: Utilise getImageUrl
                const fullImageUrl = getImageUrl(produit.imageUrl);
                
                return (
                  <motion.div 
                    key={produit.id}
                    variants={fadeInUp}
                    whileHover={{ y: -8 }}
                    className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group"
                  >
                    {/* Image avec lien */}
                    <Link to={`/produit/${produit.slug}`}>
                      <div className="h-44 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative overflow-hidden">
                        {/* ✅ CORRECTION: Utilise fullImageUrl */}
                        {fullImageUrl ? (
                          <img 
                            src={fullImageUrl} 
                            alt={produit.nom} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <motion.span 
                            className="text-7xl"
                            whileHover={{ scale: 1.2, rotate: 5 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                          >
                            🥬
                          </motion.span>
                        )}
                        
                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex gap-2">
                          {hasPromo && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                              -{discount}%
                            </span>
                          )}
                          {produit.labels && produit.labels[0] && (
                            <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                              {produit.labels[0]}
                            </span>
                          )}
                        </div>
                        
                        {/* Stock épuisé */}
                        {!inStock && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="bg-white text-gray-800 font-semibold px-4 py-2 rounded-full text-sm">
                              Rupture de stock
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                    
                    {/* Content */}
                    <div className="p-5">
                      <Link to={`/produit/${produit.slug}`}>
                        <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors line-clamp-2">
                          {produit.nom}
                        </h3>
                      </Link>
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className={`text-2xl font-bold ${hasPromo ? 'text-red-600' : 'text-green-600'}`}>
                          {formatPrice(hasPromo ? produit.prixPromo : produit.prix)}
                        </span>
                        <span className="text-sm text-gray-500">/ {produit.uniteMesure || 'unité'}</span>
                        {hasPromo && (
                          <span className="text-sm text-gray-400 line-through">
                            {formatPrice(produit.prix)}
                          </span>
                        )}
                      </div>
                      <motion.button 
                        whileHover={{ scale: inStock ? 1.02 : 1 }}
                        whileTap={{ scale: inStock ? 0.98 : 1 }}
                        onClick={() => handleAddToCart(produit)}
                        disabled={!inStock || addingToCart === produit.id}
                        className={`w-full py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                          inStock 
                            ? 'bg-green-600 text-white hover:bg-green-700' 
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {addingToCart === produit.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ShoppingCart className="w-4 h-4" />
                        )}
                        {addingToCart === produit.id ? 'Ajout...' : 'Ajouter au panier'}
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
          
          <div className="sm:hidden mt-6 text-center">
            <Link 
              to="/catalogue" 
              className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 font-semibold"
            >
              Voir tout le catalogue <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Pourquoi nous choisir ?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Jana Distribution, c'est l'assurance d'un service de qualité pour vos achats alimentaires
            </p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {avantages.map((item, i) => (
              <motion.div 
                key={i}
                variants={fadeInUp}
                whileHover={{ y: -5 }}
                className="text-center p-8 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-lg transition-all duration-300"
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 ${item.bg} rounded-2xl mb-5`}>
                  <item.icon className={`w-8 h-8 ${item.color}`} />
                </div>
                <h3 className="font-bold text-xl mb-3 text-gray-900">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Pro */}
      {!isAuthenticated && (
        <motion.section 
          className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 py-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="absolute inset-0">
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-400/20 rounded-full blur-3xl" />
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <motion.h2 
                  className="text-3xl md:text-4xl font-bold text-white mb-4"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                >
                  Vous êtes professionnel ?
                </motion.h2>
                <motion.p 
                  className="text-blue-100 text-lg mb-6"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                >
                  Créez votre compte professionnel et bénéficiez de tarifs préférentiels, 
                  de la facturation à 30 jours et d'un service dédié.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <Link 
                    to="/register"
                    className="inline-flex items-center gap-2 bg-white text-blue-700 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <Building2 className="w-5 h-5" />
                    Créer un compte pro
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </motion.div>
              </div>
              <div className="hidden md:flex justify-center">
                <motion.div 
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="text-center text-white">
                    <span className="text-6xl block mb-4">🏢</span>
                    <p className="font-semibold text-xl">+150 professionnels</p>
                    <p className="text-blue-200">nous font confiance</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.section>
      )}

    </div>
  );
};

export default HomePage;
