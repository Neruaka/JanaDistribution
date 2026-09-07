/**
 * Page Admin — Traitement d'une commande
 * @description Ecran A3 — Traitement d'une commande
 * @see design_handoff_jana_refonte/README.md (A3 — Traitement d'une commande)
 *
 * Remplace l'ancienne OrderDetailModal (modale) : la maquette montre une page
 * dediee, pas une superposition. La logique metier (statuts, remboursement,
 * facture) est reprise a l'identique.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
// X, RotateCcw retires avec le bouton "Rembourser" (desactive - paiement face-a-face
// a la livraison, pas de remboursement admin, voir plus bas dans ce fichier)
import toast from 'react-hot-toast';
import adminService from '../../services/adminService';
import { getStatutInfo, MODES_PAIEMENT } from '../../services/orderService';
import { getAdminStatutStyle } from '../../utils/adminStatut';
import { getImageUrl } from '../../utils/imageUtils';
import CommandeStatutTimeline from '../../components/admin/CommandeStatutTimeline';

const TIMELINE_STEPS = [
  { statut: 'EN_ATTENTE', titre: 'Reçue' },
  { statut: 'CONFIRMEE', titre: 'Confirmée' },
  { statut: 'EN_PREPARATION', titre: 'En préparation' },
  { statut: 'EXPEDIEE', titre: 'Expédiée' },
  { statut: 'LIVREE', titre: 'Livrée' }
];
const STATUT_ORDER = TIMELINE_STEPS.map((s) => s.statut);
const NEXT_STATUT = { EN_ATTENTE: 'CONFIRMEE', CONFIRMEE: 'EN_PREPARATION', EN_PREPARATION: 'EXPEDIEE', EXPEDIEE: 'LIVREE' };
// Remboursement admin desactive (paiement face-a-face a la livraison, decision
// proprietaire 2026-09-06) - const conservee pour reactivation eventuelle.
// const STATUTS_REMBOURSABLES = ['CONFIRMEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE', 'PARTIELLEMENT_REMBOURSE'];

const formatMoney = (amount) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount || 0);
const formatDateTime = (isoDate) => new Date(isoDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const parseCreneau = (instructions) => {
  if (!instructions?.startsWith('Créneau souhaité : ')) return null;
  return instructions.split('\n')[0].replace('Créneau souhaité : ', '');
};

const stockColor = (stock) => {
  if (stock == null) return 'text-graphite-400';
  if (stock <= 0) return 'text-danger-text';
  if (stock <= 10) return 'text-warning-text';
  return 'text-success-text';
};

const AdminOrderDetail = () => {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  // Remboursement admin desactive (paiement face-a-face a la livraison, decision
  // proprietaire 2026-09-06) - state conserve pour reactivation eventuelle.
  // const [showRefundModal, setShowRefundModal] = useState(false);
  // const [refundMontant, setRefundMontant] = useState('');
  // const [refundRaison, setRefundRaison] = useState('');
  // const [refunding, setRefunding] = useState(false);

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true);
      const detail = await adminService.getOrderById(id);
      setOrder(detail);
    } catch (error) {
      console.error('Erreur chargement commande:', error);
      toast.error('Erreur lors du chargement de la commande');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const data = await adminService.getOrderHistory(id);
      setHistory(data || []);
    } catch (error) {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [id]);

  useEffect(() => { loadOrder(); loadHistory(); }, [loadOrder, loadHistory]);

  if (loading) {
    return (
      <div className="p-[26px] flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-green-700 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-[26px] text-center text-[13.5px] text-graphite-500">
        Commande introuvable. <Link to="/admin/commandes" className="text-green-700 hover:text-green-800 font-semibold">← Retour aux commandes</Link>
      </div>
    );
  }

  const statutInfo = getStatutInfo(order.statut);
  const canChangeStatus = !['ANNULEE', 'LIVREE', 'REMBOURSE'].includes(order.statut);
  const nextStatut = NEXT_STATUT[order.statut];
  const montantDejaRembourse = order.montantRembourse || 0;
  // Remboursement admin desactive (paiement face-a-face a la livraison, decision
  // proprietaire 2026-09-06) - conserve pour reactivation eventuelle.
  // const resteARembourser = Math.max(0, Math.round((order.totalTtc - montantDejaRembourse) * 100) / 100);
  // const canRefund = STATUTS_REMBOURSABLES.includes(order.statut) && order.paiementStatut === 'PAID' && resteARembourser > 0;
  const currentIndex = order.statut === 'ANNULEE' ? -1 : STATUT_ORDER.indexOf(order.statut);
  const modePaiement = MODES_PAIEMENT.find((m) => m.id === order.modePaiement);
  const creneau = parseCreneau(order.instructionsLivraison);

  const stepTimestamp = (statut) => history.find((h) => h.nouveau_statut === statut)?.created_at
    || (statut === 'EN_ATTENTE' ? order.dateCommande : null);

  const handleAdvance = async () => {
    if (!nextStatut) return;
    try {
      setUpdating(true);
      await adminService.updateOrderStatus(order.id, nextStatut);
      toast.success(`Commande passée en "${getStatutInfo(nextStatut).label}"`);
      loadOrder();
      loadHistory();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors du changement de statut');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) return;
    try {
      setUpdating(true);
      await adminService.updateOrderStatus(order.id, 'ANNULEE');
      toast.success('Commande annulée');
      loadOrder();
      loadHistory();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'annulation');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadInvoice = async () => {
    setDownloadingInvoice(true);
    try {
      const factures = await adminService.getFactureByCommande(order.id);
      const facture = Array.isArray(factures) ? factures[0] : factures;
      if (!facture) {
        toast.error('Aucune facture disponible pour cette commande');
        return;
      }
      await adminService.downloadFacturePDF(facture.id, facture.numero);
    } catch {
      toast.error('Erreur lors du téléchargement de la facture');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  // Remboursement admin desactive (paiement face-a-face a la livraison, decision
  // proprietaire 2026-09-06) - handler conserve pour reactivation eventuelle.
  // const handleRefundSubmit = async (e) => {
  //   e.preventDefault();
  //   const montant = parseFloat(refundMontant);
  //   if (!montant || montant <= 0) { toast.error('Montant invalide'); return; }
  //   if (montant > resteARembourser) { toast.error(`Le montant ne peut pas dépasser ${formatMoney(resteARembourser)} (reste à rembourser)`); return; }
  //   try {
  //     setRefunding(true);
  //     await adminService.initiateRefund(order.id, { montant, raison: refundRaison });
  //     toast.success(`Remboursement de ${formatMoney(montant)} initié`);
  //     setShowRefundModal(false);
  //     setRefundMontant('');
  //     setRefundRaison('');
  //     loadOrder();
  //     loadHistory();
  //   } catch (error) {
  //     toast.error(error.response?.data?.message || 'Erreur lors du remboursement');
  //   } finally {
  //     setRefunding(false);
  //   }
  // };

  return (
    <div className="p-[26px] flex flex-col gap-3.5 pb-[86px] lg:pb-[26px]">
      <Link to="/admin/commandes" className="text-[13.5px] font-semibold text-ink-900 hover:text-green-800 w-fit">← Commandes</Link>

      <div className="bg-white border border-sand-200 rounded-8 p-5 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1 flex items-center gap-3 flex-wrap">
          <h1 className="font-mono text-[14px] font-semibold text-ink-900">{order.numeroCommande}</h1>
          <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-4 ${getAdminStatutStyle(order.statut)}`}>{statutInfo.label}</span>
        </div>
        <div className="hidden lg:flex gap-2.5 flex-wrap">
          <button type="button" disabled title="Bientôt disponible" className="border border-sand-250 text-ink-900 text-[13.5px] font-semibold px-4 py-2.5 rounded-6 opacity-40 cursor-not-allowed">
            Imprimer bon de préparation
          </button>
          <button type="button" onClick={handleDownloadInvoice} disabled={downloadingInvoice} className="border border-sand-250 text-ink-900 text-[13.5px] font-semibold px-4 py-2.5 rounded-6 hover:border-sand-300 disabled:opacity-50 transition-colors">
            {downloadingInvoice ? 'Téléchargement…' : 'Facture PDF'}
          </button>
          {canChangeStatus && (
            <button type="button" onClick={handleCancel} disabled={updating} className="border border-danger-border text-danger-text text-[13.5px] font-semibold px-4 py-2.5 rounded-6 hover:bg-danger-bg disabled:opacity-50 transition-colors">
              Annuler
            </button>
          )}
          {canChangeStatus && nextStatut && (
            <button type="button" onClick={handleAdvance} disabled={updating} className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white text-[13.5px] font-semibold px-[18px] py-2.5 rounded-6 transition-colors">
              {updating ? 'Mise à jour…' : `Passer en "${getStatutInfo(nextStatut).label}"`}
            </button>
          )}
        </div>
        <button type="button" onClick={handleDownloadInvoice} disabled={downloadingInvoice} className="lg:hidden w-full border border-sand-250 text-ink-900 text-[13.5px] font-semibold px-4 py-2.5 rounded-6 disabled:opacity-50 transition-colors">
          {downloadingInvoice ? 'Téléchargement…' : 'Facture PDF'}
        </button>
      </div>

      {order.statut !== 'ANNULEE' && (
        <div className="bg-white border border-sand-200 rounded-8 p-[22px]">
          <div className="font-display text-[16px] font-bold text-ink-900 mb-5">Avancement</div>
          <div className="flex flex-col gap-3.5 sm:hidden">
            {TIMELINE_STEPS.map((step, index) => {
              const ts = stepTimestamp(step.statut);
              const done = index <= currentIndex;
              const isCurrent = index === currentIndex;
              return (
                <div key={step.statut} className="flex gap-3 items-start">
                  <div className="flex flex-col items-center pt-1 flex-shrink-0">
                    <span className={`w-[10px] h-[10px] rounded-full ${done ? 'bg-green-700' : 'bg-sand-300'}`} />
                    {index < TIMELINE_STEPS.length - 1 && <span className={`w-[2px] flex-1 min-h-[20px] mt-1 ${index < currentIndex ? 'bg-green-700' : 'bg-sand-300'}`} />}
                  </div>
                  <div className="pb-0.5">
                    <span className={`text-[13px] ${isCurrent ? 'font-bold text-[#10231A]' : done ? 'font-semibold text-ink-900' : 'text-[#9AA69F]'}`}>{step.titre}</span>
                    <span className="font-mono text-[11px] text-graphite-400 block">{ts ? formatDateTime(ts) : ''}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="hidden sm:grid grid-cols-5 gap-3.5">
            {TIMELINE_STEPS.map((step, index) => {
              const ts = stepTimestamp(step.statut);
              return (
                <div key={step.statut} className="flex flex-col gap-2.5 pr-3.5">
                  <div className={`h-1 rounded-full ${index <= currentIndex ? 'bg-green-700' : 'bg-sand-300'}`} />
                  <span className="text-[13px] font-semibold text-ink-900">{step.titre}</span>
                  <span className="font-mono text-[11px] text-graphite-400">{ts ? formatDateTime(ts) : ''}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-3.5">
        <div className="flex flex-col gap-3.5">
          <div className="bg-white border border-sand-200 rounded-8 overflow-hidden">
            <div className="hidden lg:grid gap-3 px-[18px] py-2.5 bg-sand-100 border-b border-sand-200 text-[11.5px] tracking-wide text-graphite-400" style={{ gridTemplateColumns: '52px 1fr 110px 90px 100px 110px' }}>
              <span /><span>PRODUIT</span><span>PRIX HT</span><span>QTÉ</span><span>STOCK</span><span className="text-right">TOTAL HT</span>
            </div>
            {order.lignes?.map((ligne) => (
              <div key={ligne.id} className="hidden lg:grid gap-3 px-[18px] py-3 border-b border-sand-150 last:border-b-0 items-center" style={{ gridTemplateColumns: '52px 1fr 110px 90px 100px 110px' }}>
                <div className="w-[52px] h-[52px] rounded-4 overflow-hidden placeholder-stripe flex-shrink-0">
                  {getImageUrl(ligne.produit?.imageUrl) && <img src={getImageUrl(ligne.produit.imageUrl)} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium text-ink-900 truncate">{ligne.produit?.nom}</div>
                  {ligne.produit?.reference && <div className="font-mono text-[11px] text-graphite-300">{ligne.produit.reference}</div>}
                </div>
                <span className="font-mono text-[13px] text-graphite-700">{formatMoney(ligne.prixUnitaireHt)}</span>
                <span className="font-mono text-[13px] text-graphite-700">{ligne.quantite}</span>
                <span className={`font-mono text-[12.5px] font-semibold ${stockColor(ligne.produit?.stockQuantite)}`}>
                  {ligne.produit?.stockQuantite ?? '—'}
                </span>
                <span className="font-mono text-[13.5px] text-ink-900 text-right">{formatMoney(ligne.totalHt)}</span>
              </div>
            ))}
            {order.lignes?.map((ligne) => (
              <div key={`m-${ligne.id}`} className="lg:hidden flex items-center gap-3 px-[18px] py-3 border-b border-sand-150 last:border-b-0">
                <div className="w-11 h-11 rounded-4 overflow-hidden placeholder-stripe flex-shrink-0">
                  {getImageUrl(ligne.produit?.imageUrl) && <img src={getImageUrl(ligne.produit.imageUrl)} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-medium text-ink-900 truncate">{ligne.produit?.nom}</div>
                  <div className="text-[11.5px] text-graphite-400">
                    {formatMoney(ligne.prixUnitaireHt)} × {ligne.quantite} · stock{' '}
                    <span className={`font-mono font-semibold ${stockColor(ligne.produit?.stockQuantite)}`}>{ligne.produit?.stockQuantite ?? '—'}</span>
                  </div>
                </div>
                <span className="font-mono text-[13.5px] text-ink-900 flex-shrink-0">{formatMoney(ligne.totalHt)}</span>
              </div>
            ))}
            <div className="bg-sand-100 px-[18px] py-3.5 flex flex-col gap-1.5 items-end">
              <div className="flex justify-between w-full max-w-[220px] text-[13px]"><span className="text-graphite-600">Sous-total HT</span><span className="font-mono text-ink-900">{formatMoney(order.totalHt)}</span></div>
              <div className="flex justify-between w-full max-w-[220px] text-[13px]"><span className="text-graphite-600">TVA</span><span className="font-mono text-ink-900">{formatMoney(order.totalTva)}</span></div>
              <div className="flex justify-between w-full max-w-[220px] text-[13px]"><span className="text-graphite-600">Livraison</span><span className="font-mono text-ink-900">{formatMoney(order.fraisLivraison)}</span></div>
              {order.montantRabais > 0 && (
                <div className="flex justify-between w-full max-w-[220px] text-[13px]">
                  <span className="text-amber-700">Remise{order.codePromoCode ? ` (code ${order.codePromoCode})` : ''}</span>
                  <span className="font-mono text-amber-700">-{formatMoney(order.montantRabais)}</span>
                </div>
              )}
              <div className="flex justify-between w-full max-w-[220px] text-[15px] pt-1.5"><span className="font-semibold text-ink-900">Total TTC</span><span className="font-mono font-semibold text-ink-900">{formatMoney(order.totalTtc)}</span></div>
            </div>
          </div>

          <div className="bg-white border border-sand-200 rounded-8 p-[18px]">
            <div className="font-display text-[15px] font-bold text-ink-900 mb-3.5">Journal</div>
            <CommandeStatutTimeline history={history} loading={loadingHistory} />
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="bg-white border border-sand-200 rounded-8 p-[18px]">
            <div className="text-[12px] tracking-wide text-graphite-400 mb-2">CLIENT</div>
            <div className="text-[13.5px] font-semibold text-ink-900">{order.client?.prenom} {order.client?.nom}</div>
            <div className="text-[12.5px] text-graphite-500 mt-1">{order.client?.email}</div>
            {order.client?.telephone && <div className="text-[12.5px] text-graphite-500">{order.client.telephone}</div>}
            {order.client?.id && (
              <Link to={`/admin/clients?clientId=${order.client.id}`} className="hidden lg:inline-block text-[12.5px] font-semibold text-green-700 hover:text-green-800 mt-2">
                Voir la fiche client →
              </Link>
            )}
            <div className="lg:hidden flex gap-2 mt-3">
              {order.client?.telephone && (
                <a href={`tel:${order.client.telephone}`} className="flex-1 text-center bg-green-700 hover:bg-green-800 text-white text-[13px] font-semibold h-10 rounded-6 flex items-center justify-center transition-colors">
                  Appeler
                </a>
              )}
              {order.client?.id && (
                <Link to={`/admin/clients?clientId=${order.client.id}`} className="flex-1 text-center bg-sand-100 hover:bg-sand-150 text-graphite-700 text-[13px] font-semibold h-10 rounded-6 flex items-center justify-center transition-colors">
                  Fiche client
                </Link>
              )}
            </div>
          </div>

          <div className="bg-white border border-sand-200 rounded-8 p-[18px]">
            <div className="text-[12px] tracking-wide text-graphite-400 mb-2">LIVRAISON</div>
            {creneau && <div className="text-[13px] text-graphite-700 mb-1.5">Créneau : <span className="font-medium text-ink-900">{creneau}</span></div>}
            {order.adresseLivraison ? (
              <div className="text-[13px] text-graphite-700 leading-[1.6]">
                {order.adresseLivraison.prenom} {order.adresseLivraison.nom}<br />
                {order.adresseLivraison.adresse}<br />
                {order.adresseLivraison.codePostal} {order.adresseLivraison.ville}
              </div>
            ) : (
              <div className="text-[13px] text-graphite-400">Adresse non renseignée</div>
            )}
            {order.instructionsLivraison && !creneau && (
              <div className="text-[12.5px] text-graphite-500 mt-2">{order.instructionsLivraison}</div>
            )}
          </div>

          <div className="bg-white border border-sand-200 rounded-8 p-[18px]">
            <div className="text-[12px] tracking-wide text-graphite-400 mb-2">RÈGLEMENT</div>
            <div className="text-[13.5px] font-semibold text-ink-900">{modePaiement?.label || order.modePaiement}</div>
            {modePaiement?.description && <div className="text-[12.5px] text-graphite-500 mt-1">{modePaiement.description}</div>}
            {montantDejaRembourse > 0 && (
              <div className="text-[12.5px] text-warning-text mt-2">Déjà remboursé : {formatMoney(montantDejaRembourse)}</div>
            )}
            {/* Remboursement admin desactive (paiement face-a-face a la livraison,
                decision proprietaire 2026-09-06) - bouton conserve en commentaire
                pour reactivation eventuelle.
            {canRefund && (
              <button
                type="button"
                onClick={() => { setRefundMontant(String(resteARembourser)); setShowRefundModal(true); }}
                className="mt-3.5 w-full flex items-center justify-center gap-1.5 border border-warning-border bg-warning-bg text-warning-text text-[13px] font-semibold py-2 rounded-6 hover:opacity-90 transition-opacity"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Rembourser
              </button>
            )}
            */}
          </div>
        </div>
      </div>

      {/* Remboursement admin desactive (paiement face-a-face a la livraison, decision
          proprietaire 2026-09-06) - modal conservee en commentaire pour reactivation
          eventuelle.
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay-desktop" onClick={() => setShowRefundModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-10 shadow-modal max-w-[440px] w-full p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-display text-[16px] font-bold text-ink-900 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-warning-text" /> Initier un remboursement
              </h3>
              <button type="button" onClick={() => setShowRefundModal(false)} className="text-graphite-300 hover:text-ink-900"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-[13px] text-graphite-500 mb-4">
              Commande <span className="font-mono font-medium text-ink-900">{order.numeroCommande}</span> — Total : <span className="font-mono font-medium text-ink-900">{formatMoney(order.totalTtc)}</span>
              {montantDejaRembourse > 0 && (
                <> · Déjà remboursé : <span className="font-mono font-medium text-ink-900">{formatMoney(montantDejaRembourse)}</span> · Reste : <span className="font-mono font-medium text-ink-900">{formatMoney(resteARembourser)}</span></>
              )}
            </p>
            <form onSubmit={handleRefundSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-[12.5px] text-graphite-600 mb-1.5">Montant à rembourser (€)</label>
                <input
                  type="number" step="0.01" min="0.01" max={resteARembourser}
                  value={refundMontant} onChange={(e) => setRefundMontant(e.target.value)} required
                  className="w-full border border-sand-250 rounded-6 h-11 px-3.5 text-[14px] text-ink-900 focus:outline-none focus:border-ink-900"
                />
              </div>
              <div>
                <label className="block text-[12.5px] text-graphite-600 mb-1.5">Raison (optionnel)</label>
                <textarea
                  rows={2} maxLength={500} value={refundRaison} onChange={(e) => setRefundRaison(e.target.value)}
                  placeholder="Ex : produit endommagé, erreur de commande…"
                  className="w-full border border-sand-250 rounded-6 px-3.5 py-2.5 text-[13.5px] text-ink-900 focus:outline-none focus:border-ink-900 resize-none"
                />
              </div>
              <div className="flex gap-2.5 pt-1">
                <button type="button" onClick={() => setShowRefundModal(false)} className="flex-1 border border-sand-250 text-graphite-700 text-[13.5px] font-semibold py-2.5 rounded-6 hover:border-sand-300 transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={refunding} className="flex-1 bg-warning-text hover:opacity-90 disabled:opacity-50 text-white text-[13.5px] font-semibold py-2.5 rounded-6 transition-opacity">
                  {refunding ? 'Envoi…' : 'Confirmer le remboursement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      */}

      {canChangeStatus && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-sand-200 px-4 py-2.5 flex gap-2.5" style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
          <button
            type="button"
            onClick={handleCancel}
            disabled={updating}
            className="flex-1 h-[52px] border border-danger-border text-danger-text text-[13.5px] font-semibold rounded-6 disabled:opacity-50 transition-colors"
          >
            Annuler
          </button>
          {nextStatut && (
            <button
              type="button"
              onClick={handleAdvance}
              disabled={updating}
              className="flex-1 h-[52px] bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white text-[13.5px] font-semibold rounded-6 transition-colors"
            >
              {updating ? 'Mise à jour…' : getStatutInfo(nextStatut).label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminOrderDetail;
