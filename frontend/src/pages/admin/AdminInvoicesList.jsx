/**
 * Page Admin Devis / Factures
 * @description Liste back-office des devis et factures (avoirs inclus sous l'onglet Facture)
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Eye, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import adminService from '../../services/adminService';
import { AdminTopBar } from '../../components/admin';
import Pagination from '../../components/Pagination';

const TABS = [
  { key: 'DEVIS', label: 'Devis', type: 'DEVIS' },
  { key: 'FACTURE', label: 'Facture', type: 'FACTURE,AVOIR' }
];

const formatMoney = (amount) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount || 0);

const formatDate = (date) => date ? new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

const AdminInvoicesList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabKey = TABS.some((t) => t.key === searchParams.get('tab')) ? searchParams.get('tab') : 'DEVIS';

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [busyId, setBusyId] = useState(null);

  const activeTab = TABS.find((t) => t.key === tabKey);

  const loadDocuments = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const response = await adminService.getFactures({ page, limit: 20, type: activeTab.type });
      setDocuments(response.data || []);
      setPagination((prev) => ({
        ...prev,
        page,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 0
      }));
    } catch (error) {
      console.error('Erreur chargement documents:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [activeTab.type]);

  useEffect(() => { loadDocuments(1); }, [loadDocuments]);

  const handleTabChange = (key) => {
    setSearchParams(key === 'DEVIS' ? {} : { tab: key });
  };

  const handleView = async (doc) => {
    setBusyId(doc.id);
    try {
      await adminService.viewFacturePDF(doc.id);
    } catch {
      toast.error('Erreur lors de l\'ouverture du PDF');
    } finally {
      setBusyId(null);
    }
  };

  const handleDownload = async (doc) => {
    setBusyId(doc.id);
    try {
      await adminService.downloadFacturePDF(doc.id, doc.numero);
    } catch {
      toast.error('Erreur lors du téléchargement');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <AdminTopBar />

      <div className="p-[26px] flex flex-col gap-3.5">
        <div>
          <h2 className="font-display text-[26px] font-extrabold tracking-tighter text-ink-900">Devis / Facture</h2>
          <p className="text-[13.5px] text-graphite-500 mt-[3px]">
            Consultez et téléchargez les devis et factures émis
            {pagination.total > 0 && ` · ${pagination.total} document${pagination.total > 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="bg-white border border-sand-200 rounded-8 flex overflow-hidden w-fit">
          {TABS.map((tab, i) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={`px-6 py-2.5 text-[13.5px] font-semibold ${i > 0 ? 'border-l border-sand-150' : ''} ${tabKey === tab.key ? 'bg-ink-900 text-white' : 'text-graphite-600 hover:bg-sand-50'} transition-colors`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white border border-sand-200 rounded-8 overflow-hidden">
          <div
            className="hidden lg:grid gap-3 px-[18px] py-2.5 bg-sand-100 border-b border-sand-200 text-[11.5px] tracking-wide text-graphite-400"
            style={{ gridTemplateColumns: '150px 1fr 160px 120px 90px 140px' }}
          >
            <span>NUMÉRO</span>
            <span>CLIENT</span>
            <span>DATE</span>
            <span className="text-right">MONTANT</span>
            <span className="text-center">TYPE</span>
            <span className="text-right">ACTIONS</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 text-green-700 animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-16 text-[13.5px] text-graphite-400">Aucun document trouvé</div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                className={`grid grid-cols-1 lg:grid gap-2 lg:gap-3 items-center px-[18px] py-3.5 border-b border-sand-150 last:border-b-0 hover:bg-sand-50 transition-colors ${busyId === doc.id ? 'opacity-50' : ''}`}
                style={{ gridTemplateColumns: '150px 1fr 160px 120px 90px 140px' }}
              >
                <span className="font-mono text-[12.5px] text-ink-900">{doc.numero}</span>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium text-ink-900 truncate">{doc.client_nom}</div>
                  <div className="text-[12px] text-graphite-300 truncate">{doc.client_email}</div>
                </div>
                <span className="text-[12.5px] text-graphite-600">{formatDate(doc.date_emission)}</span>
                <span className="font-mono text-[13.5px] text-ink-900 lg:text-right">{formatMoney(doc.total_ttc)}</span>
                <span className="flex lg:justify-center">
                  <span className={`text-[11px] font-semibold px-2 py-[3px] rounded-4 ${doc.type === 'AVOIR' ? 'bg-danger-bg text-danger-text' : doc.type === 'DEVIS' ? 'bg-warning-bg text-warning-text' : 'bg-success-bg text-success-text'}`}>
                    {doc.type}
                  </span>
                </span>
                <span className="flex gap-3 lg:justify-end">
                  <button
                    type="button"
                    onClick={() => handleView(doc)}
                    disabled={busyId === doc.id}
                    title="Voir le PDF"
                    className="flex items-center gap-1 text-[12.5px] font-semibold text-ink-900 hover:text-green-700 disabled:opacity-50"
                  >
                    <Eye className="w-3.5 h-3.5" /> Voir
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(doc)}
                    disabled={busyId === doc.id}
                    title="Télécharger le PDF"
                    className="flex items-center gap-1 text-[12.5px] font-semibold text-green-700 hover:text-green-800 disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" /> Télécharger
                  </button>
                </span>
              </div>
            ))
          )}
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={(p) => loadDocuments(p)} />
          </div>
        )}
      </div>
    </>
  );
};

export default AdminInvoicesList;
