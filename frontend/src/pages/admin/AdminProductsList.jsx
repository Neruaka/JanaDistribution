/**
 * Liste des Produits Admin - VERSION CORRIGÉE
 * @description Tableau de gestion des produits avec export/import Excel
 * 
 * ✅ CORRECTIONS:
 * - Bouton supprimer unitaire fonctionne
 * - Bouton supprimer multiple fonctionne
 * - Export Excel fonctionne
 * - Import Excel fonctionne
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Package,
  AlertTriangle,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  FileSpreadsheet
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import productService from '../../services/productService';
import categoryService from '../../services/categoryService';

const AdminProductsList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef(null);
  
  // États
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Filtres
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categorie') || '');
  const [stockFilter, setStockFilter] = useState(searchParams.get('stock') || '');
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Charger les catégories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoryService.getAll(true);
        if (response.success) {
          setCategories(response.data);
        }
      } catch (err) {
        console.error('Erreur chargement catégories:', err);
      }
    };
    loadCategories();
  }, []);

  // Charger les produits
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: parseInt(searchParams.get('page')) || 1,
        limit: 10,
        search: search || undefined,
        categorieId: selectedCategory || undefined,
        estActif: 'all',
        orderBy: 'createdAt',
        orderDir: 'DESC'
      };

      if (stockFilter === 'low') {
        params.enStock = true;
      } else if (stockFilter === 'out') {
        params.enStock = false;
      }

      const response = await productService.getAll(params);
      if (response.success) {
        setProducts(response.data);
        setPagination(response.pagination || {
          page: params.page,
          limit: params.limit,
          total: response.data.length,
          totalPages: 1
        });
      }
    } catch (err) {
      console.error('Erreur chargement produits:', err);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  }, [searchParams, search, selectedCategory, stockFilter]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Handlers
  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (search) {
      params.set('q', search);
    } else {
      params.delete('q');
    }
    params.delete('page');
    setSearchParams(params);
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('categorie', value);
    } else {
      params.delete('categorie');
    }
    params.delete('page');
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage);
    setSearchParams(params);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedProducts(products.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (id) => {
    setSelectedProducts(prev => {
      if (prev.includes(id)) {
        return prev.filter(p => p !== id);
      }
      return [...prev, id];
    });
  };

  // ✅ CORRIGÉ: Suppression unitaire
  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await productService.delete(id);
      if (response.success) {
        toast.success('Produit supprimé avec succès');
        loadProducts();
      } else {
        toast.error(response.message || 'Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('Erreur suppression:', err);
      toast.error('Erreur lors de la suppression du produit');
    } finally {
      setDeleting(false);
    }
  };

  // ✅ NOUVEAU: Suppression multiple
  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Sélectionnez au moins un produit');
      return;
    }

    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedProducts.length} produit(s) ?`)) {
      return;
    }

    setDeleting(true);
    try {
      const response = await productService.bulkDelete(selectedProducts);
      if (response.success) {
        toast.success(`${response.data.success.length} produit(s) supprimé(s)`);
        setSelectedProducts([]);
        loadProducts();
        
        if (response.data.errors.length > 0) {
          toast.error(`${response.data.errors.length} erreur(s) lors de la suppression`);
        }
      } else {
        toast.error(response.message || 'Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('Erreur suppression multiple:', err);
      toast.error('Erreur lors de la suppression des produits');
    } finally {
      setDeleting(false);
    }
  };

  // ✅ NOUVEAU: Export Excel
  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await productService.exportAll();
      if (response.success) {
        const data = response.data;
        
        // Préparer les données pour Excel
        const excelData = data.map(p => ({
          'Référence': p.reference,
          'Nom': p.nom,
          'Catégorie': p.categorie,
          'Origine': p.origine,
          'Prix': p.prix,
          'Description': p.description,
          'Unité de mesure': p.uniteMesure
        }));

        // Créer le workbook
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Produits');

        // Ajuster la largeur des colonnes
        const colWidths = [
          { wch: 15 }, // Référence
          { wch: 40 }, // Nom
          { wch: 20 }, // Catégorie
          { wch: 15 }, // Origine
          { wch: 10 }, // Prix
          { wch: 50 }, // Description
          { wch: 15 }  // Unité
        ];
        ws['!cols'] = colWidths;

        // Télécharger le fichier
        const fileName = `produits_jana_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        toast.success(`${data.length} produits exportés`);
      }
    } catch (err) {
      console.error('Erreur export:', err);
      toast.error('Erreur lors de l\'export');
    } finally {
      setExporting(false);
    }
  };

  // ✅ NOUVEAU: Import Excel
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    try {
      // Lire le fichier Excel
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast.error('Le fichier est vide');
        return;
      }

      // Trouver la catégorie TBD
      const tbdCategory = categories.find(c => c.nom.toUpperCase() === 'TBD');
      if (!tbdCategory) {
        toast.error('Catégorie "TBD" non trouvée. Créez-la d\'abord.');
        return;
      }

      // Mapper les données Excel vers le format attendu
      const products = jsonData.map(row => ({
        reference: row['Référence'] || row['reference'] || row['Reference'] || '',
        nom: row['Nom'] || row['nom'] || row['Name'] || '',
        categorie: row['Catégorie'] || row['categorie'] || row['Categorie'] || row['Category'] || '',
        origine: row['Origine'] || row['origine'] || row['Origin'] || '',
        prix: parseFloat(row['Prix'] || row['prix'] || row['Price'] || 0),
        description: row['Description'] || row['description'] || '',
        uniteMesure: row['Unité de mesure'] || row['unite_mesure'] || row['uniteMesure'] || row['Unit'] || 'kg'
      })).filter(p => p.reference && p.nom); // Filtrer les lignes vides

      if (products.length === 0) {
        toast.error('Aucun produit valide trouvé (référence et nom requis)');
        return;
      }

      // Envoyer au backend
      const response = await productService.importProducts(products, tbdCategory.id);
      
      if (response.success) {
        toast.success(`${response.data.created.length} produit(s) importé(s)`);
        
        if (response.data.errors.length > 0) {
          console.log('Erreurs import:', response.data.errors);
          toast.error(`${response.data.errors.length} produit(s) en erreur (voir console)`);
        }
        
        loadProducts();
      }
    } catch (err) {
      console.error('Erreur import:', err);
      toast.error('Erreur lors de l\'import du fichier');
    } finally {
      setImporting(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Formater le prix
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  // Stock badge
  const StockBadge = ({ quantity, threshold }) => {
    if (quantity === 0) {
      return (
        <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-medium">
          <X className="w-3 h-3" />
          Rupture
        </span>
      );
    }
    if (quantity <= threshold) {
      return (
        <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-xs font-medium">
          <AlertTriangle className="w-3 h-3" />
          {quantity}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium">
        <Check className="w-3 h-3" />
        {quantity}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Produits</h1>
          <p className="text-gray-500">Gérez votre catalogue de produits</p>
        </div>
        <div className="flex gap-3">
          {/* Input caché pour import */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".xlsx,.xls"
            className="hidden"
          />
          
          {/* Bouton Import */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-600 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {importing ? 'Import...' : 'Importer'}
          </button>
          
          {/* Bouton Export */}
          <button 
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-600 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Export...' : 'Exporter'}
          </button>
          
          <Link
            to="/admin/produits/nouveau"
            className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouveau produit
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </form>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white min-w-[180px]"
          >
            <option value="">Toutes les catégories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.icone} {cat.nom}
              </option>
            ))}
          </select>

          {/* Stock filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white min-w-[150px]"
          >
            <option value="">Tous les stocks</option>
            <option value="low">Stock faible</option>
            <option value="out">Rupture</option>
          </select>
        </div>

        {/* Active filters summary */}
        {(search || selectedCategory || stockFilter) && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500">Filtres actifs:</span>
            {search && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-sm">
                Recherche: "{search}"
                <button onClick={() => { setSearch(''); }}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedCategory && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-sm">
                Catégorie: {categories.find(c => c.id === selectedCategory)?.nom}
                <button onClick={() => handleCategoryChange('')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bulk actions */}
      {selectedProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between"
        >
          <span className="text-blue-700">
            {selectedProducts.length} produit(s) sélectionné(s)
          </span>
          <div className="flex gap-2">
            <button 
              onClick={() => setSelectedProducts([])}
              className="px-3 py-1.5 text-sm bg-white border border-blue-200 rounded-lg hover:bg-blue-50 text-blue-700"
            >
              Désélectionner
            </button>
            <button 
              onClick={handleBulkDelete}
              disabled={deleting}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === products.length && products.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Prix
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4"><div className="w-4 h-4 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                        <div>
                          <div className="w-32 h-4 bg-gray-200 rounded mb-2" />
                          <div className="w-20 h-3 bg-gray-200 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4"><div className="w-24 h-4 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-4"><div className="w-16 h-4 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-4"><div className="w-16 h-6 bg-gray-200 rounded-full" /></td>
                    <td className="px-4 py-4"><div className="w-16 h-6 bg-gray-200 rounded-full" /></td>
                    <td className="px-4 py-4"><div className="w-8 h-8 bg-gray-200 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Aucun produit trouvé</p>
                    <Link
                      to="/admin/produits/nouveau"
                      className="text-green-600 hover:text-green-700 mt-2 inline-block"
                    >
                      Créer un produit →
                    </Link>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product.id}
                    className={`hover:bg-gray-50 transition-colors ${!product.estActif ? 'bg-gray-50/50 opacity-75' : ''}`}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => handleSelectProduct(product.id)}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.nom} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <Link
                            to={`/admin/produits/${product.id}`}
                            className="font-medium text-gray-800 hover:text-green-600"
                          >
                            {product.nom}
                          </Link>
                          <p className="text-sm text-gray-500">{product.reference}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-gray-600">
                        {product.categorie?.icone} {product.categorie?.nom || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        {product.prixPromo ? (
                          <>
                            <span className="font-semibold text-red-600">{formatPrice(product.prixPromo)}</span>
                            <span className="text-sm text-gray-400 line-through ml-2">{formatPrice(product.prix)}</span>
                          </>
                        ) : (
                          <span className="font-semibold text-gray-800">{formatPrice(product.prix)}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StockBadge quantity={product.stockQuantite} threshold={product.stockMinAlerte} />
                    </td>
                    <td className="px-4 py-4">
                      {product.estActif ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                          <Check className="w-3 h-3" />
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                          <X className="w-3 h-3" />
                          Inactif
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/produit/${product.slug}`}
                          target="_blank"
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Voir sur le site"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/admin/produits/${product.id}/modifier`}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          disabled={deleting}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Affichage de {((pagination.page - 1) * pagination.limit) + 1} à {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total} produits
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1.5 rounded-lg font-medium ${
                      page === pagination.page
                        ? 'bg-green-600 text-white'
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info import */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-800">Format d'import Excel</h3>
            <p className="text-sm text-blue-600 mt-1">
              Colonnes attendues : <strong>Référence</strong> | <strong>Nom</strong> | Catégorie | Origine | Prix | Description | Unité de mesure
            </p>
            <p className="text-sm text-blue-600 mt-1">
              Les produits sans catégorie existante seront assignés à "TBD". Référence et Nom sont obligatoires.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProductsList;
