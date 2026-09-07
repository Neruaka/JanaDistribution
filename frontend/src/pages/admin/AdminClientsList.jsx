/**
 * Page Admin Clients
 * @description Ecran A7 — Clients
 * @see design_handoff_jana_refonte/README.md (A7 — Clients)
 *
 * Le detail client reste une modale (aucun ecran dedie dans la maquette
 * A1-A8), mais lit desormais ?clientId= pour honorer le lien "Voir la
 * fiche client" pose depuis A3. Le statut "SIRET a valider"/"En attente de
 * validation" (T16-09) est desormais un vrai workflow (statut_validation_pro),
 * plus une contrainte NOT NULL sans verification.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Loader2, X, AlertTriangle, ShoppingCart, TrendingUp, Calendar } from 'lucide-react';
import adminService from '../../services/adminService';
import { getAdminStatutStyle } from '../../utils/adminStatut';
import { getStatutInfo } from '../../services/orderService';
import { AdminTopBar } from '../../components/admin';
import Pagination from '../../components/Pagination';
import toast from 'react-hot-toast';

const formatMoney = (amount) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(amount || 0);
const formatDate = (date) => date ? new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const KPI = ({ label, value }) => (
  <div className="bg-white border border-sand-200 rounded-8 p-[18px]">
    <div className="text-[12.5px] text-graphite-500">{label}</div>
    <div className="font-mono text-[29px] font-semibold text-ink-900 mt-2 tracking-tight">{value}</div>
  </div>
);

const AdminClientsList = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 0 });

  const [search, setSearch] = useState('');
  const [typeClient, setTypeClient] = useState('');
  const [estActif, setEstActif] = useState('');

  const [openMenu, setOpenMenu] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadClients = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const response = await adminService.getClients({
        page, limit: pagination.limit, search: search || undefined,
        typeClient: typeClient || undefined, estActif: estActif || undefined,
        orderBy: 'dateCreation', orderDir: 'DESC'
      });
      setClients(response.data || []);
      setStats(response.stats || null);
      setPagination((prev) => ({ ...prev, page, total: response.pagination?.total || 0, totalPages: response.pagination?.totalPages || 0 }));
    } catch (error) {
      console.error('Erreur chargement clients:', error);
      toast.error('Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  }, [search, typeClient, estActif, pagination.limit]);

  useEffect(() => { loadClients(1); }, [typeClient, estActif]);
  useEffect(() => {
    const timer = setTimeout(() => loadClients(1), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleViewDetail = useCallback(async (client) => {
    try {
      setLoadingDetail(true);
      setShowDetailModal(true);
      setOpenMenu(null);
      const detail = await adminService.getClientById(client.id);
      setSelectedClient(detail);
    } catch (error) {
      toast.error('Erreur lors du chargement du client');
      setShowDetailModal(false);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    const clientId = searchParams.get('clientId');
    if (clientId) {
      handleViewDetail({ id: clientId });
      const params = new URLSearchParams(searchParams);
      params.delete('clientId');
      setSearchParams(params, { replace: true });
    }
  }, [searchParams]);

  const handleToggleStatus = async (client) => {
    try {
      await adminService.toggleClientStatus(client.id);
      toast.success(client.estActif ? 'Client bloqué' : 'Client activé');
      loadClients(pagination.page);
      if (selectedClient?.id === client.id) setSelectedClient((prev) => ({ ...prev, estActif: !prev.estActif }));
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
    setOpenMenu(null);
  };

  const handleValiderPro = async (client) => {
    try {
      await adminService.validerComptePro(client.id);
      toast.success('Compte professionnel validé');
      loadClients(pagination.page);
      if (selectedClient?.id === client.id) setSelectedClient((prev) => ({ ...prev, statutValidationPro: 'VALIDE' }));
    } catch (error) {
      toast.error('Erreur lors de la validation');
    }
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
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const bloques = stats ? stats.total - stats.actifs : 0;

  return (
    <>
      <AdminTopBar
        search={
          <div className="flex-1 max-w-[420px] h-[38px] flex items-center gap-2 border border-sand-250 rounded-6 px-3.5">
            <Search className="w-3.5 h-3.5 text-graphite-300 flex-shrink-0" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, email, raison sociale…" className="flex-1 bg-transparent border-none outline-none text-[13.5px] text-ink-900 placeholder-graphite-200" />
          </div>
        }
      >
        <select value={typeClient} onChange={(e) => setTypeClient(e.target.value)} className="h-[38px] border border-sand-250 rounded-6 px-3 text-[13.5px] text-graphite-900 bg-white">
          <option value="">Tous les types</option>
          <option value="PARTICULIER">Particulier</option>
          <option value="PROFESSIONNEL">Professionnel</option>
        </select>
        <select value={estActif} onChange={(e) => setEstActif(e.target.value)} className="h-[38px] border border-sand-250 rounded-6 px-3 text-[13.5px] text-graphite-900 bg-white">
          <option value="">Tous les statuts</option>
          <option value="true">Actifs</option>
          <option value="false">Bloqués</option>
        </select>
      </AdminTopBar>

      <div className="p-[26px] flex flex-col gap-3.5">
        <div>
          <h2 className="font-display text-[26px] font-extrabold tracking-tighter text-ink-900">Clients</h2>
          <p className="text-[13.5px] text-graphite-500 mt-[3px]">{pagination.total} compte{pagination.total > 1 ? 's' : ''}</p>
        </div>

        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            <KPI label="Comptes actifs" value={stats.actifs} />
            <KPI label="Professionnels" value={stats.professionnels} />
            <KPI label="Particuliers" value={stats.particuliers} />
            <KPI label="Bloqués" value={bloques} />
            <KPI label="Pros en attente" value={stats.prosEnAttente || 0} />
          </div>
        )}

        {/* pas de overflow-hidden ici (T-BUGS-2026-09) : coupait le menu "..." des
            lignes proches du bas du tableau (dropdown absolute rendu hors de la
            zone visible/clippee). rounded-t-8 sur l'en-tete suffit visuellement. */}
        <div className="bg-white border border-sand-200 rounded-8">
          <div className="hidden lg:grid gap-3 px-[18px] py-2.5 bg-sand-100 border-b border-sand-200 rounded-t-8 text-[11.5px] tracking-wide text-graphite-400" style={{ gridTemplateColumns: '1fr 220px 130px 110px 130px 120px 80px' }}>
            <span>CLIENT</span><span>CONTACT</span><span>TYPE</span><span className="text-center">CMD.</span><span className="text-right">CA TOTAL</span><span>STATUT</span><span />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 text-green-700 animate-spin" /></div>
          ) : clients.length === 0 ? (
            <div className="text-center py-16 text-[13.5px] text-graphite-400">Aucun client trouvé</div>
          ) : (
            clients.map((client) => (
              <div key={client.id} className="hidden lg:grid gap-3 items-center px-[18px] py-3 border-b border-sand-150 last:border-b-0 hover:bg-sand-50 transition-colors" style={{ gridTemplateColumns: '1fr 220px 130px 110px 130px 120px 80px' }}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-[34px] h-[34px] rounded-full bg-sand-150 text-graphite-600 flex items-center justify-center text-[12px] font-semibold flex-shrink-0">
                    {client.prenom?.[0]}{client.nom?.[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-medium text-ink-900 truncate">{client.prenom} {client.nom}</div>
                    {client.raisonSociale && <div className="text-[12px] text-graphite-400 truncate">{client.raisonSociale}</div>}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-[12.5px] text-graphite-600 truncate">{client.email}</div>
                  {client.telephone && <div className="font-mono text-[11.5px] text-graphite-300">{client.telephone}</div>}
                </div>
                <span className={`w-fit text-[12px] font-semibold px-2 py-[3px] rounded-4 ${client.typeClient === 'PROFESSIONNEL' ? 'bg-pro-bg text-pro-text' : 'bg-particulier-bg text-particulier-text'}`}>
                  {client.typeClient === 'PROFESSIONNEL' ? 'Pro' : 'Particulier'}
                </span>
                <span className="font-mono text-[13px] text-graphite-600 text-center">{client.nbCommandes || 0}</span>
                <span className="font-mono text-[13.5px] text-ink-900 text-right">{formatMoney(client.caTotal)}</span>
                <div className="flex flex-col gap-1 items-start">
                  <span className={`w-fit text-[12px] font-semibold px-2 py-[3px] rounded-4 ${client.estActif ? 'bg-success-bg text-success-text' : 'bg-danger-bg text-danger-text'}`}>
                    {client.estActif ? 'Actif' : 'Bloqué'}
                  </span>
                  {client.statutValidationPro === 'EN_ATTENTE' && (
                    <span className="w-fit text-[11px] font-semibold px-2 py-[2px] rounded-4 bg-warning-bg text-warning-text">En attente</span>
                  )}
                </div>
                <div className="relative flex justify-end">
                  <button type="button" onClick={() => setOpenMenu(openMenu === client.id ? null : client.id)} className="p-1.5 text-graphite-300 hover:text-ink-900 transition-colors">⋯</button>
                  {openMenu === client.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
                      <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-sand-200 rounded-6 shadow-modal py-1 z-50">
                        <button type="button" onClick={() => handleViewDetail(client)} className="w-full text-left px-3.5 py-2 text-[13px] text-ink-900 hover:bg-sand-50">Voir le profil</button>
                        <button type="button" onClick={() => handleToggleStatus(client)} className="w-full text-left px-3.5 py-2 text-[13px] text-ink-900 hover:bg-sand-50">{client.estActif ? 'Bloquer' : 'Activer'}</button>
                        {client.statutValidationPro === 'EN_ATTENTE' && (
                          <button type="button" onClick={() => handleValiderPro(client)} className="w-full text-left px-3.5 py-2 text-[13px] text-success-text hover:bg-sand-50">Valider ce compte pro</button>
                        )}
                        <hr className="my-1 border-sand-150" />
                        <button type="button" onClick={() => { setClientToDelete(client); setShowDeleteModal(true); setOpenMenu(null); }} className="w-full text-left px-3.5 py-2 text-[13px] text-danger-text hover:bg-danger-bg">Supprimer</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))
          )}

          {!loading && clients.length > 0 && (
            <div className="lg:hidden flex flex-col">
              {clients.map((client) => (
                <div key={`m-${client.id}`} className="flex items-center gap-2.5 px-[18px] py-3 border-b border-sand-150 last:border-b-0" onClick={() => handleViewDetail(client)}>
                  <div className="w-[34px] h-[34px] rounded-full bg-sand-150 text-graphite-600 flex items-center justify-center text-[12px] font-semibold flex-shrink-0">
                    {client.prenom?.[0]}{client.nom?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13.5px] font-medium text-ink-900 truncate">{client.prenom} {client.nom}</span>
                      <span className={`flex-shrink-0 text-[10.5px] font-semibold px-1.5 py-[1px] rounded-4 ${client.typeClient === 'PROFESSIONNEL' ? 'bg-pro-bg text-pro-text' : 'bg-particulier-bg text-particulier-text'}`}>
                        {client.typeClient === 'PROFESSIONNEL' ? 'Pro' : 'Particulier'}
                      </span>
                    </div>
                    <div className="text-[12px] text-graphite-400 truncate">{client.email}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono text-[13px] text-ink-900">{formatMoney(client.caTotal)}</div>
                    <span className={`text-[10.5px] font-semibold px-1.5 py-[1px] rounded-4 ${client.estActif ? 'bg-success-bg text-success-text' : 'bg-danger-bg text-danger-text'}`}>
                      {client.estActif ? 'Actif' : 'Bloqué'}
                    </span>
                    {client.statutValidationPro === 'EN_ATTENTE' && (
                      <span className="block mt-0.5 text-[10.5px] font-semibold px-1.5 py-[1px] rounded-4 bg-warning-bg text-warning-text">En attente</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={(p) => loadClients(p)} />
          </div>
        )}
      </div>

      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay-desktop" onClick={() => setShowDetailModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-10 shadow-modal max-w-[560px] w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between p-5 border-b border-sand-200 z-10">
              <h2 className="font-display text-[17px] font-bold text-ink-900">Fiche client</h2>
              <button type="button" onClick={() => setShowDetailModal(false)} className="text-graphite-300 hover:text-ink-900"><X className="w-4 h-4" /></button>
            </div>

            {loadingDetail ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-green-700 animate-spin" /></div>
            ) : selectedClient ? (
              <div className="p-5 flex flex-col gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-14 h-14 rounded-full bg-sand-150 text-graphite-600 flex items-center justify-center text-[18px] font-semibold flex-shrink-0">
                    {selectedClient.prenom?.[0]}{selectedClient.nom?.[0]}
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold text-ink-900">{selectedClient.prenom} {selectedClient.nom}</h3>
                    {selectedClient.raisonSociale && <p className="text-[13px] text-graphite-500">{selectedClient.raisonSociale}</p>}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[12px] font-semibold px-2 py-[3px] rounded-4 ${selectedClient.typeClient === 'PROFESSIONNEL' ? 'bg-pro-bg text-pro-text' : 'bg-particulier-bg text-particulier-text'}`}>
                        {selectedClient.typeClient === 'PROFESSIONNEL' ? 'Pro' : 'Particulier'}
                      </span>
                      <span className={`text-[12px] font-semibold px-2 py-[3px] rounded-4 ${selectedClient.estActif ? 'bg-success-bg text-success-text' : 'bg-danger-bg text-danger-text'}`}>
                        {selectedClient.estActif ? 'Actif' : 'Bloqué'}
                      </span>
                      {selectedClient.statutValidationPro === 'EN_ATTENTE' && (
                        <span className="text-[12px] font-semibold px-2 py-[3px] rounded-4 bg-warning-bg text-warning-text">En attente de validation</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-sand-50 rounded-6 p-3">
                    <div className="text-[11.5px] text-graphite-400">Email</div>
                    <div className="text-[13px] font-medium text-ink-900 truncate">{selectedClient.email}</div>
                  </div>
                  <div className="bg-sand-50 rounded-6 p-3">
                    <div className="text-[11.5px] text-graphite-400">Téléphone</div>
                    <div className="font-mono text-[13px] font-medium text-ink-900">{selectedClient.telephone || '—'}</div>
                  </div>
                  <div className="bg-sand-50 rounded-6 p-3">
                    <div className="text-[11.5px] text-graphite-400">Inscrit le</div>
                    <div className="text-[13px] font-medium text-ink-900">{formatDate(selectedClient.dateCreation)}</div>
                  </div>
                  <div className="bg-sand-50 rounded-6 p-3">
                    <div className="text-[11.5px] text-graphite-400">Dernière connexion</div>
                    <div className="text-[13px] font-medium text-ink-900">{formatDate(selectedClient.derniereConnexion)}</div>
                  </div>
                </div>

                {selectedClient.siret && (
                  <div className="bg-pro-bg rounded-6 p-3.5">
                    <div className="text-[12px] font-semibold text-pro-text mb-2">Informations professionnelles</div>
                    <div className="grid grid-cols-2 gap-3 text-[13px]">
                      <div><div className="text-graphite-500 text-[11.5px]">SIRET</div><div className="font-mono text-ink-900">{selectedClient.siret}</div></div>
                      {selectedClient.numeroTva && <div><div className="text-graphite-500 text-[11.5px]">N° TVA</div><div className="font-mono text-ink-900">{selectedClient.numeroTva}</div></div>}
                    </div>
                  </div>
                )}

                {selectedClient.statistiques && (
                  <div className="grid grid-cols-4 gap-2.5">
                    <div className="bg-white border border-sand-200 rounded-6 p-3 text-center">
                      <ShoppingCart className="w-4 h-4 text-graphite-300 mx-auto mb-1.5" />
                      <div className="font-mono text-[16px] font-semibold text-ink-900">{selectedClient.statistiques.nbCommandes}</div>
                      <div className="text-[11px] text-graphite-400">Commandes</div>
                    </div>
                    <div className="bg-white border border-sand-200 rounded-6 p-3 text-center">
                      <TrendingUp className="w-4 h-4 text-graphite-300 mx-auto mb-1.5" />
                      <div className="font-mono text-[16px] font-semibold text-ink-900">{formatMoney(selectedClient.statistiques.caTotal)}</div>
                      <div className="text-[11px] text-graphite-400">CA total</div>
                    </div>
                    <div className="bg-white border border-sand-200 rounded-6 p-3 text-center">
                      <ShoppingCart className="w-4 h-4 text-graphite-300 mx-auto mb-1.5" />
                      <div className="font-mono text-[16px] font-semibold text-ink-900">{formatMoney(selectedClient.statistiques.panierMoyen)}</div>
                      <div className="text-[11px] text-graphite-400">Panier moyen</div>
                    </div>
                    <div className="bg-white border border-sand-200 rounded-6 p-3 text-center">
                      <Calendar className="w-4 h-4 text-graphite-300 mx-auto mb-1.5" />
                      <div className="text-[12px] font-semibold text-ink-900">{formatDate(selectedClient.statistiques.derniereCommande)}</div>
                      <div className="text-[11px] text-graphite-400">Dernière cmd</div>
                    </div>
                  </div>
                )}

                {selectedClient.dernieresCommandes?.length > 0 && (
                  <div>
                    <div className="text-[13px] font-semibold text-ink-900 mb-2">Dernières commandes</div>
                    <div className="flex flex-col gap-1.5">
                      {selectedClient.dernieresCommandes.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex items-center justify-between bg-sand-50 rounded-6 px-3 py-2">
                          <div>
                            <div className="font-mono text-[12.5px] text-ink-900">{order.numeroCommande}</div>
                            <div className="text-[11.5px] text-graphite-400">{formatDate(order.dateCommande)}</div>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <span className="font-mono text-[13px] font-semibold text-ink-900">{formatMoney(order.totalTtc)}</span>
                            <span className={`text-[11px] font-semibold px-1.5 py-[2px] rounded-4 ${getAdminStatutStyle(order.statut)}`}>{getStatutInfo(order.statut).label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedClient.statutValidationPro === 'EN_ATTENTE' && (
                  <button
                    type="button"
                    onClick={() => handleValiderPro(selectedClient)}
                    className="w-full text-[13.5px] font-semibold py-2.5 rounded-6 bg-success-bg text-success-text hover:opacity-90 transition-colors"
                  >
                    Valider ce compte professionnel
                  </button>
                )}

                <div className="flex gap-2.5 pt-2 border-t border-sand-150">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(selectedClient)}
                    className={`flex-1 text-[13.5px] font-semibold py-2.5 rounded-6 transition-colors ${selectedClient.estActif ? 'bg-danger-bg text-danger-text hover:opacity-90' : 'bg-success-bg text-success-text hover:opacity-90'}`}
                  >
                    {selectedClient.estActif ? 'Bloquer' : 'Activer'}
                  </button>
                  <button type="button" onClick={() => setShowDetailModal(false)} className="flex-1 border border-sand-250 text-graphite-700 text-[13.5px] font-semibold py-2.5 rounded-6 hover:border-sand-300 transition-colors">Fermer</button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {showDeleteModal && clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay-desktop" onClick={() => setShowDeleteModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-10 shadow-modal max-w-[440px] w-full p-5">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-full bg-danger-bg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-danger-text" />
              </div>
              <div>
                <h2 className="font-display text-[17px] font-bold text-ink-900">Supprimer le client ?</h2>
                <p className="text-[13px] text-graphite-500 mt-0.5">
                  Le compte de {clientToDelete.prenom} {clientToDelete.nom} sera anonymisé (RGPD). Les commandes sont conservées mais anonymisées.
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

export default AdminClientsList;
