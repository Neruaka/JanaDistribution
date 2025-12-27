/**
 * Admin Categories List
 * @description Page de gestion des catégories côté admin
 * ✅ FIX: Menu contextuel en position fixed (hors du conteneur scrollable)
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderTree,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MoreVertical,
  Package,
  AlertTriangle,
  X,
  Check
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminCategoriesList = () => {
  // States
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // create | edit
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    couleur: '#4CAF50',
    icone: '📦',
    estActif: true
  });
  const [saving, setSaving] = useState(false);
  
  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Dropdown menu
  const [openMenu, setOpenMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 }); // ✅ Position du menu

  // Chargement des catégories
  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories', {
        params: { includeInactive: true }
      });
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
      toast.error('Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Filtrer les catégories
  const filteredCategories = categories.filter(cat => {
    const matchSearch = cat.nom.toLowerCase().includes(search.toLowerCase()) ||
                       (cat.description && cat.description.toLowerCase().includes(search.toLowerCase()));
    const matchActive = showInactive ? true : cat.estActif;
    return matchSearch && matchActive;
  });

  // ✅ Ouvrir le menu avec calcul de position
  const handleOpenMenu = (e, categoryId) => {
    if (openMenu === categoryId) {
      setOpenMenu(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right
      });
      setOpenMenu(categoryId);
    }
  };

  // Ouvrir modal création
  const handleCreate = () => {
    setModalMode('create');
    setSelectedCategory(null);
    setFormData({
      nom: '',
      description: '',
      couleur: '#4CAF50',
      icone: '📦',
      estActif: true
    });
    setShowModal(true);
  };

  // Ouvrir modal édition
  const handleEdit = (category) => {
    setModalMode('edit');
    setSelectedCategory(category);
    setFormData({
      nom: category.nom,
      description: category.description || '',
      couleur: category.couleur || '#4CAF50',
      icone: category.icone || '📦',
      estActif: category.estActif
    });
    setShowModal(true);
    setOpenMenu(null);
  };

  // Sauvegarder catégorie
  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!formData.nom.trim()) {
      toast.error('Le nom est requis');
      return;
    }

    try {
      setSaving(true);
      
      if (modalMode === 'create') {
        await api.post('/categories', formData);
        toast.success('Catégorie créée avec succès');
      } else {
        await api.put(`/categories/${selectedCategory.id}`, formData);
        toast.success('Catégorie mise à jour');
      }
      
      setShowModal(false);
      loadCategories();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // Toggle statut actif
  const handleToggleActive = async (category) => {
    try {
      await api.patch(`/categories/${category.id}/toggle-active`);
      toast.success(category.estActif ? 'Catégorie désactivée' : 'Catégorie activée');
      loadCategories();
    } catch (error) {
      console.error('Erreur toggle:', error);
      toast.error('Erreur lors de la mise à jour');
    }
    setOpenMenu(null);
  };

  // Ouvrir modal suppression
  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
    setOpenMenu(null);
  };

  // Confirmer suppression
  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    
    try {
      setDeleting(true);
      await api.delete(`/categories/${categoryToDelete.id}`);
      toast.success('Catégorie supprimée');
      setShowDeleteModal(false);
      setCategoryToDelete(null);
      loadCategories();
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error(error.response?.data?.message || 'Impossible de supprimer cette catégorie');
    } finally {
      setDeleting(false);
    }
  };

  // Icônes disponibles
  const availableIcons = ['📦', '🥬', '🍎', '🥩', '🧀', '🥖', '🐟', '🥛', '🍳', '🌿', '🍕', '🍝', '🥤', '🍰', '🧊'];

  // Couleurs disponibles
  const availableColors = [
    '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336',
    '#00BCD4', '#FFEB3B', '#795548', '#607D8B', '#E91E63'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Catégories</h1>
          <p className="text-gray-500 mt-1">Gérez les catégories de produits</p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Nouvelle catégorie
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une catégorie..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Toggle inactives */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-sm text-gray-600">Afficher les inactives</span>
          </label>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-800">{categories.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Actives</p>
          <p className="text-2xl font-bold text-green-600">
            {categories.filter(c => c.estActif).length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Inactives</p>
          <p className="text-2xl font-bold text-gray-400">
            {categories.filter(c => !c.estActif).length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Total produits</p>
          <p className="text-2xl font-bold text-blue-600">
            {categories.reduce((sum, c) => sum + (c.nbProduits || 0), 0)}
          </p>
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <FolderTree className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune catégorie trouvée</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredCategories.map((category) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-4 hover:bg-gray-50 transition-colors ${!category.estActif ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-4">
                  {/* Icône */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${category.couleur}20` }}
                  >
                    {category.icone || '📦'}
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800">{category.nom}</h3>
                      {!category.estActif && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {category.description || 'Aucune description'}
                    </p>
                  </div>

                  {/* Badge produits */}
                  <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
                    <Package className="w-4 h-4" />
                    <span>{category.nbProduits || 0} produits</span>
                  </div>

                  {/* Couleur */}
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow hidden sm:block"
                    style={{ backgroundColor: category.couleur }}
                    title={category.couleur}
                  />

                  {/* Actions - ✅ Bouton menu avec calcul de position */}
                  <button
                    onClick={(e) => handleOpenMenu(e, category.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Création/Édition */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-800">
                  {modalMode === 'create' ? 'Nouvelle catégorie' : 'Modifier la catégorie'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSave} className="p-6 space-y-4">
                {/* Nom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ex: Fruits & Légumes"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    placeholder="Description de la catégorie..."
                  />
                </div>

                {/* Icône */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icône
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableIcons.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icone: icon })}
                        className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                          formData.icone === icon
                            ? 'bg-green-100 ring-2 ring-green-500'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Couleur */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Couleur
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, couleur: color })}
                        className={`w-8 h-8 rounded-full transition-all ${
                          formData.couleur === color
                            ? 'ring-2 ring-offset-2 ring-gray-400'
                            : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Actif */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="estActif"
                    checked={formData.estActif}
                    onChange={(e) => setFormData({ ...formData, estActif: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="estActif" className="text-sm text-gray-700">
                    Catégorie active (visible sur le site)
                  </label>
                </div>

                {/* Aperçu */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-2">Aperçu</p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${formData.couleur}20` }}
                    >
                      {formData.icone}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{formData.nom || 'Nom de la catégorie'}</p>
                      <p className="text-sm text-gray-500">{formData.description || 'Description...'}</p>
                    </div>
                  </div>
                </div>

                {/* Boutons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        {modalMode === 'create' ? 'Créer' : 'Enregistrer'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Suppression */}
      <AnimatePresence>
        {showDeleteModal && categoryToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Supprimer la catégorie ?
                </h3>
                <p className="text-gray-500 mb-6">
                  Êtes-vous sûr de vouloir supprimer la catégorie "{categoryToDelete.nom}" ?
                  {categoryToDelete.nbProduits > 0 && (
                    <span className="block mt-2 text-amber-600 font-medium">
                      ⚠️ Cette catégorie contient {categoryToDelete.nbProduits} produit(s).
                    </span>
                  )}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {deleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Suppression...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ Menu contextuel - EN DEHORS de la liste (position fixed) */}
      <AnimatePresence>
        {openMenu && (
          <>
            {/* Overlay pour fermer */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpenMenu(null)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                position: 'fixed',
                top: menuPosition.top,
                right: menuPosition.right,
              }}
              className="w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50"
            >
              {(() => {
                const category = categories.find(c => c.id === openMenu);
                if (!category) return null;
                
                return (
                  <>
                    <button
                      onClick={() => handleEdit(category)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Modifier
                    </button>
                    <button
                      onClick={() => handleToggleActive(category)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      {category.estActif ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          Désactiver
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          Activer
                        </>
                      )}
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={() => handleDeleteClick(category)}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>
                  </>
                );
              })()}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCategoriesList;
