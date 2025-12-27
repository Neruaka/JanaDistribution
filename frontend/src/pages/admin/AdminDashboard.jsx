/**
 * Dashboard Admin
 * @description Page d'accueil de l'administration avec stats temps réel
 * ✅ FIX: Lien "Voir →" redirige vers /admin/commandes?orderId=xxx pour ouvrir le modal
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Calendar,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

// Périodes prédéfinies
const PERIODS = [
  { label: '7 derniers jours', days: 7 },
  { label: '30 derniers jours', days: 30 },
  { label: '3 derniers mois', days: 90 },
  { label: 'Cette année', days: 365 }
];

// Couleurs pour le graphique pie
const CATEGORY_COLORS = [
  '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336',
  '#00BCD4', '#FFEB3B', '#795548', '#607D8B', '#E91E63'
];

const AdminDashboard = () => {
  // States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [periodDays, setPeriodDays] = useState(30);
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);
  
  // Data states
  const [dashboardStats, setDashboardStats] = useState(null);
  const [evolution, setEvolution] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  // Calcul des dates
  const { dateDebut, dateFin } = useMemo(() => {
    const fin = new Date();
    const debut = new Date(fin.getTime() - periodDays * 24 * 60 * 60 * 1000);
    return {
      dateDebut: debut.toISOString(),
      dateFin: fin.toISOString()
    };
  }, [periodDays]);

  // Chargement des données
  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      else setRefreshing(true);
      
      const [stats, evo, cats, prods, orders, lowStock] = await Promise.all([
        adminService.getDashboardStats(dateDebut, dateFin),
        adminService.getEvolution(dateDebut, dateFin, periodDays <= 30 ? 'day' : 'week'),
        adminService.getTopCategories(dateDebut, dateFin, 5),
        adminService.getTopProducts(dateDebut, dateFin, 5),
        adminService.getRecentOrders(5),
        adminService.getLowStockProducts(5)
      ]);
      
      setDashboardStats(stats);
      setEvolution(evo.evolution || []);
      setTopCategories(cats || []);
      setTopProducts(prods || []);
      setRecentOrders(orders || []);
      setLowStockProducts(lowStock || []);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateDebut, dateFin]);

  // Formatter les montants
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Formatter les dates pour le graphique
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  // Composant carte stat
  const StatCard = ({ title, value, variation, icon: Icon, color, link, suffix = '' }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800">
            {value}{suffix}
          </p>
          {variation !== undefined && (
            <p className={`text-sm mt-2 flex items-center gap-1 ${
              parseFloat(variation) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {parseFloat(variation) >= 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              {parseFloat(variation) >= 0 ? '+' : ''}{variation}% vs période précédente
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {link && (
        <Link
          to={link}
          className="mt-4 text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
        >
          Voir tout <ArrowUpRight className="w-4 h-4" />
        </Link>
      )}
    </motion.div>
  );

  // Badge statut
  const StatusBadge = ({ statut }) => {
    const config = {
      EN_ATTENTE: { label: 'En attente', bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
      CONFIRMEE: { label: 'Confirmée', bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle },
      EN_PREPARATION: { label: 'En préparation', bg: 'bg-purple-100', text: 'text-purple-700', icon: Package },
      EXPEDIEE: { label: 'Expédiée', bg: 'bg-cyan-100', text: 'text-cyan-700', icon: Truck },
      LIVREE: { label: 'Livrée', bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      ANNULEE: { label: 'Annulée', bg: 'bg-red-100', text: 'text-red-700', icon: XCircle }
    };
    
    const { label, bg, text, icon: StatusIcon } = config[statut] || config.EN_ATTENTE;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
        <StatusIcon className="w-3 h-3" />
        {label}
      </span>
    );
  };

  // Tooltip personnalisé pour le graphique
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
          <p className="text-sm font-medium text-gray-800">{label}</p>
          <p className="text-sm text-green-600">
            CA: {formatMoney(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">Vue d'ensemble de votre activité</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Sélecteur de période */}
          <div className="relative">
            <button
              onClick={() => setPeriodMenuOpen(!periodMenuOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {PERIODS.find(p => p.days === periodDays)?.label}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            
            {periodMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50"
              >
                {PERIODS.map((period) => (
                  <button
                    key={period.days}
                    onClick={() => {
                      setPeriodDays(period.days);
                      setPeriodMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                      periodDays === period.days ? 'text-green-600 font-medium bg-green-50' : 'text-gray-700'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
          
          {/* Bouton refresh */}
          <button
            onClick={() => loadData(false)}
            disabled={refreshing}
            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          
          {/* Nouveau produit */}
          <Link
            to="/admin/produits/nouveau"
            className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveau produit</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Chiffre d'affaires"
          value={formatMoney(dashboardStats?.chiffreAffaires?.total || 0)}
          variation={dashboardStats?.chiffreAffaires?.variation}
          icon={TrendingUp}
          color="bg-green-500"
        />
        <StatCard
          title="Commandes"
          value={dashboardStats?.commandes?.total || 0}
          variation={dashboardStats?.commandes?.variation}
          icon={ShoppingCart}
          color="bg-purple-500"
          link="/admin/commandes"
        />
        <StatCard
          title="Panier moyen"
          value={formatMoney(dashboardStats?.panierMoyen?.total || 0)}
          variation={dashboardStats?.panierMoyen?.variation}
          icon={ShoppingCart}
          color="bg-blue-500"
        />
        <StatCard
          title="Clients"
          value={dashboardStats?.clients?.total || 0}
          suffix={` (${dashboardStats?.clients?.nouveaux || 0} nouveaux)`}
          icon={Users}
          color="bg-cyan-500"
          link="/admin/clients"
        />
      </div>

      {/* Statuts commandes mini */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { key: 'enAttente', label: 'En attente', color: 'bg-yellow-500' },
          { key: 'confirmees', label: 'Confirmées', color: 'bg-blue-500' },
          { key: 'enPreparation', label: 'En prépa.', color: 'bg-purple-500' },
          { key: 'expediees', label: 'Expédiées', color: 'bg-cyan-500' },
          { key: 'livrees', label: 'Livrées', color: 'bg-green-500' },
          { key: 'annulees', label: 'Annulées', color: 'bg-red-500' }
        ].map(({ key, label, color }) => (
          <div key={key} className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${color}`} />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
            <p className="text-xl font-bold text-gray-800">
              {dashboardStats?.commandes?.parStatut?.[key] || 0}
            </p>
          </div>
        ))}
      </div>

      {/* Graphiques - Evolution CA + Top Catégories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evolution CA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-gray-800">Évolution du chiffre d'affaires</h2>
              <p className="text-sm text-gray-500">CA par jour sur la période</p>
            </div>
          </div>
          
          <div className="h-[300px]">
            {evolution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="periode" 
                    tickFormatter={formatDate}
                    tick={{ fontSize: 12, fill: '#888' }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
                    tick={{ fontSize: 12, fill: '#888' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="chiffreAffaires" 
                    stroke="#4CAF50" 
                    strokeWidth={3}
                    dot={{ fill: '#4CAF50', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Aucune donnée sur cette période
              </div>
            )}
          </div>
        </motion.div>

        {/* Top Catégories - Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="mb-4">
            <h2 className="font-semibold text-gray-800">Top catégories</h2>
            <p className="text-sm text-gray-500">Répartition du CA</p>
          </div>
          
          <div className="h-[200px]">
            {topCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topCategories}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="chiffreAffaires"
                    nameKey="nom"
                  >
                    {topCategories.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.couleur || CATEGORY_COLORS[index % CATEGORY_COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatMoney(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Aucune donnée
              </div>
            )}
          </div>
          
          {/* Légende */}
          <div className="space-y-2 mt-4">
            {topCategories.slice(0, 4).map((cat, index) => (
              <div key={cat.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: cat.couleur || CATEGORY_COLORS[index] }}
                  />
                  <span className="text-gray-600 truncate max-w-[100px]">{cat.nom}</span>
                </div>
                <span className="font-medium text-gray-800">{cat.pourcentage}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Top Produits */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold text-gray-800">Top 5 produits vendus</h2>
            <p className="text-sm text-gray-500">Par quantité vendue</p>
          </div>
          <Link
            to="/admin/produits"
            className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
          >
            Voir tous <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="space-y-4">
          {topProducts.length > 0 ? (
            topProducts.map((product, index) => (
              <div key={product.id || index} className="flex items-center gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-500">
                  {product.rang}
                </div>
                
                <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.nom} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package className="w-6 h-6" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{product.nom}</p>
                  <p className="text-sm text-gray-500">{product.categorie}</p>
                </div>
                
                <div className="flex-1 hidden sm:block">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${product.pourcentageMax}%` }}
                    />
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-bold text-gray-800">{product.quantiteVendue}</p>
                  <p className="text-xs text-gray-500">ventes</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              Aucune vente sur cette période
            </div>
          )}
        </div>
      </motion.div>

      {/* Deux colonnes: Commandes récentes + Alertes stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commandes récentes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ShoppingCart className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">Commandes récentes</h2>
                  <p className="text-sm text-gray-500">Dernières commandes reçues</p>
                </div>
              </div>
              <Link to="/admin/commandes" className="text-sm text-green-600 hover:text-green-700">
                Voir toutes →
              </Link>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-800">{order.numeroCommande}</p>
                        <StatusBadge statut={order.statut} />
                      </div>
                      <p className="text-sm text-gray-500">
                        {order.client?.prenom} {order.client?.nom} • {new Date(order.dateCommande).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">{formatMoney(order.totalTtc)}</p>
                      {/* ✅ FIX: Lien avec paramètre orderId pour ouvrir le modal */}
                      <Link 
                        to={`/admin/commandes?orderId=${order.id}`} 
                        className="text-sm text-green-600 hover:text-green-700"
                      >
                        Voir →
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400">Aucune commande récente</div>
            )}
          </div>
        </motion.div>

        {/* Alertes stock */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">Alertes stock</h2>
                  <p className="text-sm text-gray-500">Produits à réapprovisionner</p>
                </div>
              </div>
              <span className="bg-amber-100 text-amber-700 text-sm font-medium px-2.5 py-1 rounded-full">
                {dashboardStats?.produits?.stockFaible || 0}
              </span>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map((product) => (
                <div key={product.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.nom} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{product.nom}</p>
                      <p className="text-sm text-gray-500">
                        Stock: <span className={product.enRupture ? 'text-red-600 font-medium' : 'text-amber-600 font-medium'}>
                          {product.stock}
                        </span> / {product.seuilAlerte} min
                      </p>
                    </div>
                  </div>
                  <Link to={`/admin/produits/${product.id}`} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <p>Tous les stocks sont OK !</p>
              </div>
            )}
          </div>

          {lowStockProducts.length > 0 && (
            <div className="p-4 border-t border-gray-100">
              <Link to="/admin/produits?stock=low" className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1">
                Voir tous les produits en stock faible <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </motion.div>
      </div>

      {/* Infos produits */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{dashboardStats?.produits?.actifs || 0}</p>
            <p className="text-sm text-gray-500">Produits actifs</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-amber-100 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{dashboardStats?.produits?.stockFaible || 0}</p>
            <p className="text-sm text-gray-500">Stock faible</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-red-100 rounded-lg">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{dashboardStats?.produits?.rupture || 0}</p>
            <p className="text-sm text-gray-500">En rupture</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
