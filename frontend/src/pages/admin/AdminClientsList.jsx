/**
 * Admin Clients List
 * @description Page de gestion des clients côté admin
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  Eye,
  Ban,
  CheckCircle,
  MoreVertical,
  Mail,
  Phone,
  Building,
  User,
  Calendar,
  ShoppingCart,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

const AdminClientsList = () => {
  const navigate = useNavigate();
  
  // States
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 0
  });

  // Filtres
  const [filters, setFilters] = useState({
    search: '',
    typeClient: '',
    estActif: '',
    orderBy: 'dateCreation',
    orderDir: 'DESC'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [openMenu, setOpenMenu] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Chargement des clients
  const loadClients = async (page = 1) => {
    try {
      setLoading(true);
      const response = await adminService.getClients({
        page,
        limit: pagination.limit,
        search: filters.search || undefined,
        typeClient: filters.typeClient || undefined,
        estActif: filters.estActif || undefined,
        orderBy: filters.orderBy,
        orderDir: filters.orderDir
      });

      setClients(response.data || []);
      setStats(response.stats || null);
      setPagination(prev => ({
        ...prev,
        page,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 0
      }));
    } catch (error) {
      console.error('Erreur chargement clients:', error);
      toast.error('Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients(1);
  }, [filters.typeClient, filters.estActif, filters.orderBy, filters.orderDir]);

  // Recherche avec délai
  useEffect(() => {
    const timer = setTimeout(() => {
      loadClients(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Formatter argent
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  // Formatter date
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Toggle statut client
  const handleToggleStatus = async (client) => {
    try {
      await adminService.toggleClientStatus(client.id);
      toast.success(client.estActif ? 'Client bloqué' : 'Client activé');
      loadClients(pagination.page);
    } catch (error) {
      console.error('Erreur toggle status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
    setOpenMenu(null);
  };

  // Voir détail client
  const handleViewDetail = async (client) => {
    try {
      setLoadingDetail(true);
      setShowDetailModal(true);
      const detail = await adminService.getClientById(client.id);
      setSelectedClient(detail);
    } catch (error) {
      console.error('Erreur chargement détail:', error);
      toast.error('Erreur lors du chargement du client');
      setShowDetailModal(false);
    } finally {
      setLoadingDetail(false);
    }
    setOpenMenu(null);
  };

  // Supprimer client (anonymisation)
  const handleDeleteClick = (client) => {
    setClientToDelete(client);
    setShowDeleteModal(true);
    setOpenMenu(null);
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;

    try {
      setDeleting(true);
      await adminService.deleteClient(clientToDelete.id);
      toast.success('Client supprimé et données anonymisées');
      setShowDeleteModal(false);
      setClientToDelete(null);
      loadClients(pagination.page);
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  // Pagination
  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      loadClients(page);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Clients</h1>
          <p className="text-gray-500 mt-1">Gérez votre base clients</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-xl font-bold text-gray-800">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Particuliers</p>
                <p className="text-xl font-bold text-gray-800">{stats.particuliers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Professionnels</p>
                <p className="text-xl font-bold text-gray-800">{stats.professionnels}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Ban className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Bloqués</p>
                <p className="text-xl font-bold text-gray-800">{stats.bloques}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, email, raison sociale..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Toggle filtres */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl transition-colors ${
              showFilters ? 'bg-green-50 border-green-200 text-green-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtres
          </button>
        </div>

        {/* Filtres avancés */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 mt-4 border-t border-gray-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de client
                  </label>
                  <select
                    value={filters.typeClient}
                    onChange={(e) => setFilters({ ...filters, typeClient: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Tous</option>
                    <option value="PARTICULIER">Particulier</option>
                    <option value="PROFESSIONNEL">Professionnel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={filters.estActif}
                    onChange={(e) => setFilters({ ...filters, estActif: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Tous</option>
                    <option value="true">Actifs</option>
                    <option value="false">Bloqués</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trier par
                  </label>
                  <select
                    value={filters.orderBy}
                    onChange={(e) => setFilters({ ...filters, orderBy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"
                  >
                    <option value="dateCreation">Date d'inscription</option>
                    <option value="nom">Nom</option>
                    <option value="email">Email</option>
                    <option value="caTotal">CA total</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ordre
                  </label>
                  <select
                    value={filters.orderDir}
                    onChange={(e) => setFilters({ ...filters, orderDir: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"
                  >
                    <option value="DESC">Décroissant</option>
                    <option value="ASC">Croissant</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun client trouvé</p>
          </div>
        ) : (
          <>
            {/* Table desktop */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Client</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Contact</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Commandes</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">CA Total</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Statut</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-gray-600">
                              {client.prenom?.[0]}{client.nom?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {client.prenom} {client.nom}
                            </p>
                            {client.raisonSociale && (
                              <p className="text-sm text-gray-500">{client.raisonSociale}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-600">{client.email}</p>
                        {client.telephone && (
                          <p className="text-sm text-gray-400">{client.telephone}</p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          client.typeClient === 'PROFESSIONNEL'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {client.typeClient === 'PROFESSIONNEL' ? (
                            <><Building className="w-3 h-3" /> Pro</>
                          ) : (
                            <><User className="w-3 h-3" /> Particulier</>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-medium text-gray-800">{client.nbCommandes || 0}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-semibold text-gray-800">
                          {formatMoney(client.caTotal)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {client.estActif ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3" /> Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            <Ban className="w-3 h-3" /> Bloqué
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenu(openMenu === client.id ? null : client.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-400" />
                          </button>

                          <AnimatePresence>
                            {openMenu === client.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10"
                              >
                                <button
                                  onClick={() => handleViewDetail(client)}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4" /> Voir le profil
                                </button>
                                <button
                                  onClick={() => handleToggleStatus(client)}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  {client.estActif ? (
                                    <><Ban className="w-4 h-4" /> Bloquer</>
                                  ) : (
                                    <><CheckCircle className="w-4 h-4" /> Activer</>
                                  )}
                                </button>
                                <hr className="my-1" />
                                <button
                                  onClick={() => handleDeleteClick(client)}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" /> Supprimer
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Liste mobile */}
            <div className="lg:hidden divide-y divide-gray-100">
              {clients.map((client) => (
                <div key={client.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="font-semibold text-gray-600">
                          {client.prenom?.[0]}{client.nom?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {client.prenom} {client.nom}
                        </p>
                        <p className="text-sm text-gray-500">{client.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewDetail(client)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <Eye className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500">
                        {client.nbCommandes || 0} cmd
                      </span>
                      <span className="font-semibold text-gray-800">
                        {formatMoney(client.caTotal)}
                      </span>
                    </div>
                    {client.estActif ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        Actif
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                        Bloqué
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Page {pagination.page} sur {pagination.totalPages} ({pagination.total} clients)
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

      {/* Modal Détail Client */}
      <AnimatePresence>
        {showDetailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b z-10">
                <h2 className="text-xl font-semibold text-gray-800">Détail client</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingDetail ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                </div>
              ) : selectedClient ? (
                <div className="p-6 space-y-6">
                  {/* Info client */}
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-xl font-bold text-gray-600">
                        {selectedClient.prenom?.[0]}{selectedClient.nom?.[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {selectedClient.prenom} {selectedClient.nom}
                      </h3>
                      {selectedClient.raisonSociale && (
                        <p className="text-gray-600">{selectedClient.raisonSociale}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          selectedClient.typeClient === 'PROFESSIONNEL'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {selectedClient.typeClient}
                        </span>
                        {selectedClient.estActif ? (
                          <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            Actif
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            Bloqué
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm font-medium text-gray-800">{selectedClient.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Téléphone</p>
                        <p className="text-sm font-medium text-gray-800">
                          {selectedClient.telephone || '-'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Inscrit le</p>
                        <p className="text-sm font-medium text-gray-800">
                          {formatDate(selectedClient.dateCreation)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Dernière connexion</p>
                        <p className="text-sm font-medium text-gray-800">
                          {formatDate(selectedClient.derniereConnexion)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SIRET si pro */}
                  {selectedClient.siret && (
                    <div className="p-4 bg-purple-50 rounded-xl">
                      <p className="text-sm text-purple-600 font-medium mb-2">Informations professionnelles</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">SIRET</p>
                          <p className="font-medium text-gray-800">{selectedClient.siret}</p>
                        </div>
                        {selectedClient.numeroTva && (
                          <div>
                            <p className="text-gray-500">N° TVA</p>
                            <p className="font-medium text-gray-800">{selectedClient.numeroTva}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  {selectedClient.statistiques && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">Statistiques</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-blue-50 rounded-xl p-4 text-center">
                          <ShoppingCart className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-gray-800">
                            {selectedClient.statistiques.nbCommandes}
                          </p>
                          <p className="text-xs text-gray-500">Commandes</p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4 text-center">
                          <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-gray-800">
                            {formatMoney(selectedClient.statistiques.caTotal)}
                          </p>
                          <p className="text-xs text-gray-500">CA Total</p>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-4 text-center">
                          <ShoppingCart className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-gray-800">
                            {formatMoney(selectedClient.statistiques.panierMoyen)}
                          </p>
                          <p className="text-xs text-gray-500">Panier moyen</p>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-4 text-center">
                          <Calendar className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                          <p className="text-sm font-bold text-gray-800">
                            {formatDate(selectedClient.statistiques.derniereCommande)}
                          </p>
                          <p className="text-xs text-gray-500">Dernière cmd</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dernières commandes */}
                  {selectedClient.dernieresCommandes?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">Dernières commandes</h4>
                      <div className="space-y-2">
                        {selectedClient.dernieresCommandes.slice(0, 5).map((order) => (
                          <div
                            key={order.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                          >
                            <div>
                              <p className="font-medium text-gray-800">{order.numeroCommande}</p>
                              <p className="text-sm text-gray-500">{formatDate(order.dateCommande)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-800">{formatMoney(order.totalTtc)}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                order.statut === 'LIVREE' ? 'bg-green-100 text-green-700' :
                                order.statut === 'ANNULEE' ? 'bg-red-100 text-red-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {order.statut}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={() => {
                        handleToggleStatus(selectedClient);
                        setShowDetailModal(false);
                      }}
                      className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                        selectedClient.estActif
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {selectedClient.estActif ? (
                        <><Ban className="w-4 h-4" /> Bloquer</>
                      ) : (
                        <><CheckCircle className="w-4 h-4" /> Activer</>
                      )}
                    </button>
                    <button
                      onClick={() => setShowDetailModal(false)}
                      className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Suppression */}
      <AnimatePresence>
        {showDeleteModal && clientToDelete && (
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
                  Supprimer le client ?
                </h3>
                <p className="text-gray-500 mb-2">
                  Êtes-vous sûr de vouloir supprimer le compte de {clientToDelete.prenom} {clientToDelete.nom} ?
                </p>
                <p className="text-sm text-amber-600 bg-amber-50 rounded-lg p-3 mb-6">
                  ⚠️ Cette action anonymisera toutes les données personnelles du client (conformité RGPD).
                  Les commandes seront conservées mais anonymisées.
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

      {/* Click outside pour fermer les menus */}
      {openMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setOpenMenu(null)}
        />
      )}
    </div>
  );
};

export default AdminClientsList;
