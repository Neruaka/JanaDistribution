/**
 * Admin Promo List
 * @description Page de gestion des codes promo (CRUD + stats + toggle actif/inactif)
 * @location frontend/src/pages/admin/AdminPromoList.jsx
 */

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Users,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import adminService from '../../services/adminService';
import PromoCodeModal from '../../components/admin/PromoCodeModal';

const formatCurrency = (value) => {
  const n = Number(value || 0);
  return `${n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
};

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR');
};

const isExpired = (promo) => {
  if (!promo.date_fin) return false;
  return new Date(promo.date_fin) < new Date();
};

const StatusBadge = ({ promo }) => {
  if (isExpired(promo)) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
        Expiré
      </span>
    );
  }
  if (!promo.actif) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
        Inactif
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
      Actif
    </span>
  );
};

const AdminPromoList = () => {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actifFilter, setActifFilter] = useState(''); // '', 'true', 'false'
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [saving, setSaving] = useState(false);

  const [promoToDelete, setPromoToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [togglingId, setTogglingId] = useState(null);

  // ==========================================
  // CHARGEMENT
  // ==========================================

  const loadPromos = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const response = await adminService.getCodesPromo({
        page,
        limit: pagination.limit,
        actif: actifFilter === '' ? undefined : actifFilter
      });
      setPromos(response.data || []);
      setPagination((prev) => ({
        ...prev,
        page,
        total: response.pagination?.total || (response.data || []).length,
        totalPages: response.pagination?.totalPages || 1
      }));
    } catch (error) {
      console.error('Erreur chargement codes promo:', error);
      toast.error(error.response?.data?.message || 'Erreur lors du chargement des codes promo');
    } finally {
      setLoading(false);
    }
  }, [actifFilter, pagination.limit]);

  useEffect(() => {
    loadPromos(1);
  }, [actifFilter]);

  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      loadPromos(page);
    }
  };

  // ==========================================
  // STATS RAPIDES (calculées à partir de la liste récupérée)
  // ==========================================

  const statsActifs = promos.filter((p) => p.actif && !isExpired(p)).length;
  const statsUtilisations = promos.reduce((sum, p) => sum + (Number(p.nb_utilisations) || 0), 0);
  const statsClients = promos.reduce((sum, p) => sum + (Number(p.nb_clients) || 0), 0);
  const statsCA = promos.reduce((sum, p) => sum + (Number(p.ca_genere) || 0), 0);

  // ==========================================
  // CRUD
  // ==========================================

  const handleCreate = () => {
    setModalMode('create');
    setSelectedPromo(null);
    setShowModal(true);
  };

  const handleEdit = (promo) => {
    setModalMode('edit');
    setSelectedPromo(promo);
    setShowModal(true);
  };

  const handleSubmit = async (payload) => {
    try {
      setSaving(true);
      if (modalMode === 'create') {
        await adminService.createCodePromo(payload);
        toast.success('Code promo créé avec succès');
      } else {
        await adminService.updateCodePromo(selectedPromo.id, payload);
        toast.success('Code promo mis à jour');
      }
      setShowModal(false);
      loadPromos(pagination.page);
    } catch (error) {
      console.error('Erreur sauvegarde code promo:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde du code promo');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (promo) => {
    try {
      setTogglingId(promo.id);
      await adminService.toggleCodePromo(promo.id);
      toast.success(promo.actif ? `Code "${promo.code}" désactivé` : `Code "${promo.code}" activé`);
      loadPromos(pagination.page);
    } catch (error) {
      console.error('Erreur toggle code promo:', error);
      toast.error(error.response?.data?.message || 'Erreur lors du changement de statut');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteClick = (promo) => {
    if (Number(promo.nb_utilisations) > 0) {
      toast(
        'Ce code a déjà été utilisé et ne peut pas être supprimé. Désactivez-le à la place.',
        { icon: 'ℹ️' }
      );
      return;
    }
    setPromoToDelete(promo);
  };

  const handleDeleteConfirm = async () => {
    if (!promoToDelete) return;
    try {
      setDeleting(true);
      await adminService.deleteCodePromo(promoToDelete.id);
      toast.success('Code promo supprimé');
      setPromoToDelete(null);
      loadPromos(pagination.page);
    } catch (error) {
      console.error('Erreur suppression code promo:', error);
      toast.error(
        error.response?.data?.message ||
        'Impossible de supprimer ce code promo. Désactivez-le à la place.'
      );
    } finally {
      setDeleting(false);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Codes promo</h1>
          <p className="text-gray-500 mt-1">
            Gérez les codes de réduction
            {pagination.total > 0 && (
              <span className="ml-2 text-sm">
                ({pagination.total} code{pagination.total > 1 ? 's' : ''})
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Nouveau code
        </button>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <CheckCircle2 className="w-4 h-4" />
            Codes actifs
          </div>
          <p className="text-2xl font-bold text-green-600">{statsActifs}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Tag className="w-4 h-4" />
            Utilisations totales
          </div>
          <p className="text-2xl font-bold text-blue-600">{statsUtilisations}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Users className="w-4 h-4" />
            Clients touchés
          </div>
          <p className="text-2xl font-bold text-purple-600">{statsClients}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Wallet className="w-4 h-4" />
            CA généré
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(statsCA)}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { value: '', label: 'Tous' },
            { value: 'true', label: 'Actifs' },
            { value: 'false', label: 'Inactifs' }
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setActifFilter(opt.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                actifFilter === opt.value
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
          </div>
        ) : promos.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun code promo trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Valeur</th>
                  <th className="px-4 py-3 font-medium">Utilisations</th>
                  <th className="px-4 py-3 font-medium">Clients touchés</th>
                  <th className="px-4 py-3 font-medium">CA généré</th>
                  <th className="px-4 py-3 font-medium">Date fin</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {promos.map((promo) => {
                  const hasUsage = Number(promo.nb_utilisations) > 0;
                  return (
                    <motion.tr
                      key={promo.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800">{promo.code}</div>
                        {promo.description && (
                          <div className="text-xs text-gray-400 truncate max-w-[200px]">{promo.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {promo.type_rabais === 'POURCENTAGE' ? 'Pourcentage' : 'Montant fixe'}
                      </td>
                      <td className="px-4 py-3 text-gray-800 font-medium">
                        {promo.type_rabais === 'POURCENTAGE'
                          ? `${promo.valeur_rabais}%`
                          : formatCurrency(promo.valeur_rabais)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {promo.nb_utilisations ?? 0}
                        {' / '}
                        {promo.max_utilisations_global ?? 'illimité'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{promo.nb_clients ?? 0}</td>
                      <td className="px-4 py-3 text-gray-800 font-medium">{formatCurrency(promo.ca_genere)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(promo.date_fin)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge promo={promo} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {/* Toggle actif/inactif */}
                          <button
                            onClick={() => handleToggle(promo)}
                            disabled={togglingId === promo.id}
                            title={promo.actif ? 'Désactiver' : 'Activer'}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                              promo.actif ? 'bg-green-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                promo.actif ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>

                          {/* Modifier */}
                          <button
                            onClick={() => handleEdit(promo)}
                            title="Modifier"
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Supprimer */}
                          <button
                            onClick={() => handleDeleteClick(promo)}
                            title={hasUsage
                              ? 'Ce code a déjà été utilisé : désactivez-le au lieu de le supprimer'
                              : 'Supprimer'}
                            className={`p-2 rounded-lg ${
                              hasUsage
                                ? 'text-gray-300 cursor-not-allowed opacity-60'
                                : 'text-red-500 hover:bg-red-50 hover:text-red-700'
                            }`}
                          >
                            {hasUsage ? <Info className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Page {pagination.page} sur {pagination.totalPages} ({pagination.total} codes)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => goToPage(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal création/édition */}
      <AnimatePresence>
        {showModal && (
          <PromoCodeModal
            mode={modalMode}
            promo={selectedPromo}
            saving={saving}
            onSubmit={handleSubmit}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Modal suppression */}
      <AnimatePresence>
        {promoToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setPromoToDelete(null)}
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
                  Supprimer le code promo ?
                </h3>
                <p className="text-gray-500 mb-6">
                  Êtes-vous sûr de vouloir supprimer le code "{promoToDelete.code}" ?
                  Cette action est irréversible.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPromoToDelete(null)}
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
    </div>
  );
};

export default AdminPromoList;
