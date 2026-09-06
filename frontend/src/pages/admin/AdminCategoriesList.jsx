/**
 * Page Admin Categories
 * @description Ecran A6 — Categories
 * @see design_handoff_jana_refonte/README.md (A6 — Categories)
 *
 * "Vignette" et la zone de depot du visuel de la maquette sont adaptees au
 * badge icone+couleur reel (aucune colonne image sur categorie). Le
 * glisser-deposer pour reordonner persiste vraiment via le champ `ordre`,
 * deja supporte par le validator update/create — pas de fabrication.
 */

import { useState, useEffect, useRef } from 'react';
import { Search, Plus, X, Check, MoreVertical, AlertTriangle, GripVertical } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { AdminTopBar } from '../../components/admin';
import Toggle from '../../components/Toggle';

const AVAILABLE_ICONS = ['📦', '🥬', '🍎', '🥩', '🧀', '🥖', '🐟', '🥛', '🍳', '🌿', '🍕', '🍝', '🥤', '🍰', '🧊'];
const AVAILABLE_COLORS = ['#1E7A46', '#2196F3', '#FF9800', '#9C27B0', '#F44336', '#00BCD4', '#795548', '#607D8B'];

const EMPTY_FORM = { nom: '', description: '', couleur: '#1E7A46', icone: '📦', estActif: true };

const AdminCategoriesList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [openMenu, setOpenMenu] = useState(null);
  const dragIndex = useRef(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories', { params: { includeInactive: true } });
      setCategories((response.data.data || []).slice().sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0)));
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
      toast.error('Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, []);

  const filtered = categories.filter((cat) => {
    const matchSearch = cat.nom.toLowerCase().includes(search.toLowerCase());
    const matchActive = showInactive ? true : cat.estActif;
    return matchSearch && matchActive;
  });

  const handleReorder = async (fromIndex, toIndex) => {
    // Reordonner une liste filtree (recherche ou masquage des inactives) rendrait les index
    // ambigus vis-a-vis de `categories` (liste complete, source de verite pour `ordre`).
    if (fromIndex === toIndex || filtered.length !== categories.length) return;
    const reordered = categories.slice();
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setCategories(reordered);
    try {
      await Promise.all(reordered.map((cat, index) => api.put(`/categories/${cat.id}`, { ordre: index })));
      toast.success('Ordre mis à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour de l\'ordre');
    } finally {
      loadCategories();
    }
  };

  const handleCreate = () => {
    setModalMode('create');
    setSelectedCategory(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const handleEdit = (category) => {
    setModalMode('edit');
    setSelectedCategory(category);
    setFormData({
      nom: category.nom, description: category.description || '',
      couleur: category.couleur || '#1E7A46', icone: category.icone || '📦', estActif: category.estActif
    });
    setShowModal(true);
    setOpenMenu(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nom.trim()) { toast.error('Le nom est requis'); return; }
    try {
      setSaving(true);
      if (modalMode === 'create') {
        await api.post('/categories', formData);
        toast.success('Catégorie créée');
      } else {
        await api.put(`/categories/${selectedCategory.id}`, formData);
        toast.success('Catégorie mise à jour');
      }
      setShowModal(false);
      loadCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (category) => {
    try {
      await api.patch(`/categories/${category.id}/toggle-active`);
      toast.success(category.estActif ? 'Catégorie désactivée' : 'Catégorie activée');
      loadCategories();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
    setOpenMenu(null);
  };

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
      toast.error(error.response?.data?.message || 'Impossible de supprimer cette catégorie');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <AdminTopBar
        search={
          <div className="flex-1 max-w-[420px] h-[38px] flex items-center gap-2 border border-sand-250 rounded-6 px-3.5">
            <Search className="w-3.5 h-3.5 text-graphite-300 flex-shrink-0" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une catégorie…" className="flex-1 bg-transparent border-none outline-none text-[13.5px] text-ink-900 placeholder-graphite-200" />
          </div>
        }
      >
        <button type="button" onClick={handleCreate} className="h-[38px] flex items-center gap-1.5 bg-green-700 hover:bg-green-800 text-white rounded-6 px-4 text-[13.5px] font-semibold transition-colors">
          <Plus className="w-3.5 h-3.5" /> Nouvelle catégorie
        </button>
      </AdminTopBar>

      <div className="p-[26px] flex flex-col gap-3.5">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-display text-[26px] font-extrabold tracking-tighter text-ink-900">Catégories</h2>
            <p className="text-[13.5px] text-graphite-500 mt-[3px]">Glissez pour réordonner — l'ordre est repris dans la navigation du site</p>
          </div>
          <label className="flex items-center gap-2 text-[13px] text-graphite-600 cursor-pointer">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="w-[15px] h-[15px] accent-green-700" />
            Afficher les inactives
          </label>
        </div>

        {/* pas de overflow-hidden ici (meme bug que la liste clients, T15-06) : ca
            coupait le menu "..." des lignes proches du bas de la liste. */}
        <div className="bg-white border border-sand-200 rounded-8">
          {loading ? (
            <div className="py-16 text-center text-[13.5px] text-graphite-400">Chargement…</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-[13.5px] text-graphite-400">Aucune catégorie trouvée</div>
          ) : (
            filtered.map((category, index) => (
              <div
                key={category.id}
                draggable
                onDragStart={() => { dragIndex.current = index; }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => { if (dragIndex.current !== null) handleReorder(dragIndex.current, index); dragIndex.current = null; }}
                className={`flex flex-col lg:flex-row lg:items-center gap-2.5 lg:gap-3.5 px-[18px] py-3.5 border-b border-sand-150 last:border-b-0 hover:bg-sand-50 transition-colors ${!category.estActif ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <GripVertical className="w-4 h-4 text-graphite-200 cursor-grab flex-shrink-0" />
                  <div className="w-[38px] h-[38px] rounded-6 flex items-center justify-center text-[18px] flex-shrink-0" style={{ backgroundColor: `${category.couleur}20` }}>
                    {category.icone || '📦'}
                  </div>
                  <div className="flex-1 lg:flex-1 min-w-0">
                    <div className="text-[13.5px] font-semibold text-ink-900 truncate">{category.nom}</div>
                    <div className="font-mono text-[11.5px] text-graphite-300 truncate">{category.slug}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 pl-[45px] lg:pl-0 flex-shrink-0">
                  <span className="font-mono text-[13px] text-graphite-500 lg:w-24 flex-shrink-0">{category.nbProduits || 0} réf.</span>
                  <span className={`text-[12px] font-semibold px-2 py-[3px] rounded-4 flex-shrink-0 ${category.estActif ? 'bg-success-bg text-success-text' : 'bg-neutral-status-bg text-neutral-status-text'}`}>
                    {category.estActif ? 'Visible' : 'Masquée'}
                  </span>
                  <div className="relative flex-shrink-0 ml-auto lg:ml-0">
                  <button type="button" onClick={() => setOpenMenu(openMenu === category.id ? null : category.id)} className="p-1.5 text-graphite-300 hover:text-ink-900 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {openMenu === category.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
                      <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-sand-200 rounded-6 shadow-modal py-1 z-50">
                        <button type="button" onClick={() => handleEdit(category)} className="w-full text-left px-3.5 py-2 text-[13px] text-ink-900 hover:bg-sand-50">Modifier</button>
                        <button type="button" onClick={() => handleToggleActive(category)} className="w-full text-left px-3.5 py-2 text-[13px] text-ink-900 hover:bg-sand-50">
                          {category.estActif ? 'Désactiver' : 'Activer'}
                        </button>
                        <hr className="my-1 border-sand-150" />
                        <button type="button" onClick={() => { setCategoryToDelete(category); setShowDeleteModal(true); setOpenMenu(null); }} className="w-full text-left px-3.5 py-2 text-[13px] text-danger-text hover:bg-danger-bg">Supprimer</button>
                      </div>
                    </>
                  )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay-desktop" onClick={() => setShowModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-10 shadow-modal max-w-[520px] w-full">
            <div className="flex items-start justify-between p-5 pb-0">
              <div>
                <h2 className="font-display text-[18px] font-bold text-ink-900">{modalMode === 'create' ? 'Nouvelle catégorie' : 'Modifier la catégorie'}</h2>
                <p className="text-[13px] text-graphite-500 mt-0.5">Rayon affiché dans la navigation du site</p>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="text-graphite-300 hover:text-ink-900"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleSave} className="p-[22px] flex flex-col gap-3.5">
              <div>
                <label className="text-[12.5px] text-graphite-600 mb-1.5 block">Nom *</label>
                <input type="text" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} placeholder="Ex : Fruits & Légumes" required className="w-full border border-sand-250 rounded-6 h-11 px-3.5 text-[14px] text-ink-900 focus:outline-none focus:border-ink-900" />
              </div>
              <div>
                <label className="text-[12.5px] text-graphite-600 mb-1.5 block">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} placeholder="Description de la catégorie…" className="w-full border border-sand-250 rounded-6 px-3.5 py-2.5 text-[13.5px] text-ink-900 focus:outline-none focus:border-ink-900 resize-none" />
              </div>
              <div>
                <label className="text-[12.5px] text-graphite-600 mb-1.5 block">Icône</label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_ICONS.map((icon) => (
                    <button key={icon} type="button" onClick={() => setFormData({ ...formData, icone: icon })} className={`w-9 h-9 rounded-6 text-[16px] flex items-center justify-center border transition-colors ${formData.icone === icon ? 'border-green-700 bg-success-bg' : 'border-sand-250 hover:border-sand-300'}`}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[12.5px] text-graphite-600 mb-1.5 block">Couleur</label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_COLORS.map((color) => (
                    <button key={color} type="button" onClick={() => setFormData({ ...formData, couleur: color })} className={`w-7 h-7 rounded-full transition-all ${formData.couleur === color ? 'ring-2 ring-offset-2 ring-ink-900' : ''}`} style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>

              <Toggle checked={formData.estActif} onChange={(v) => setFormData({ ...formData, estActif: v })} titre="Visible sur le site" desc="Affichée dans la navigation rayons" />

              <div className="bg-sand-50 rounded-6 p-3.5 flex items-center gap-3">
                <div className="w-11 h-11 rounded-6 flex items-center justify-center text-[20px] flex-shrink-0" style={{ backgroundColor: `${formData.couleur}20` }}>{formData.icone}</div>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-semibold text-ink-900 truncate">{formData.nom || 'Nom de la catégorie'}</div>
                  <div className="text-[12px] text-graphite-500 truncate">{formData.description || 'Description…'}</div>
                </div>
              </div>

              <div className="flex gap-2.5 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-sand-250 text-graphite-700 text-[13.5px] font-semibold py-2.5 rounded-6 hover:border-sand-300 transition-colors">Annuler</button>
                <button type="submit" disabled={saving} className="flex-1 bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white text-[13.5px] font-semibold py-2.5 rounded-6 flex items-center justify-center gap-1.5 transition-colors">
                  {saving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {!saving && <Check className="w-3.5 h-3.5" />}
                  {modalMode === 'create' ? 'Créer' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay-desktop" onClick={() => setShowDeleteModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-10 shadow-modal max-w-[440px] w-full p-5">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-full bg-danger-bg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-danger-text" />
              </div>
              <div>
                <h2 className="font-display text-[17px] font-bold text-ink-900">Supprimer la catégorie ?</h2>
                <p className="text-[13px] text-graphite-500 mt-0.5">
                  « {categoryToDelete.nom} »{categoryToDelete.nbProduits > 0 && ` contient ${categoryToDelete.nbProduits} produit(s).`}
                </p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <button type="button" onClick={() => setShowDeleteModal(false)} className="flex-1 border border-sand-250 text-graphite-700 text-[13.5px] font-semibold py-2.5 rounded-6 hover:border-sand-300 transition-colors">Annuler</button>
              <button type="button" onClick={handleDeleteConfirm} disabled={deleting} className="flex-1 bg-danger-text hover:opacity-90 disabled:opacity-50 text-white text-[13.5px] font-semibold py-2.5 rounded-6 transition-opacity">
                {deleting ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminCategoriesList;
