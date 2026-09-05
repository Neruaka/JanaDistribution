/**
 * Page Détail d'une commande
 * @description Écran 09 — Détail d'une commande
 * @see design_handoff_jana_refonte/README.md
 */

import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2, AlertCircle, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { getOrderById, cancelOrder, getStatutInfo, canCancelOrder, MODES_PAIEMENT } from '../services/orderService';
import { useCart } from '../contexts/CartContext';
import { getImageUrl } from '../utils/imageUtils';
import { formatAmount } from '../utils/priceUtils';

const TIMELINE_STEPS = [
  { statut: 'EN_ATTENTE', titre: 'Commande reçue' },
  { statut: 'CONFIRMEE', titre: 'Confirmée' },
  { statut: 'EN_PREPARATION', titre: 'En préparation' },
  { statut: 'EXPEDIEE', titre: 'Expédiée' },
  { statut: 'LIVREE', titre: 'Livrée' }
];
const STATUT_ORDER = TIMELINE_STEPS.map((s) => s.statut);

const STATUT_BADGE = {
  EN_ATTENTE: 'bg-warning-bg text-warning-text',
  ANNULEE: 'bg-danger-bg text-danger-text',
  LIVREE: 'bg-success-bg text-success-text'
};

const formatDateTime = (dateString) => new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
}).format(new Date(dateString));

const parseCreneau = (instructions) => {
  if (!instructions?.startsWith('Créneau souhaité : ')) return null;
  return instructions.split('\n')[0].replace('Créneau souhaité : ', '');
};

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const { addItem } = useCart();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getOrderById(orderId).then((result) => {
      if (!mounted) return;
      if (result.success) setOrder(result.data);
      else setError(result.message || 'Commande non trouvée');
    }).catch((err) => mounted && setError(err.message || 'Erreur lors du chargement')).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [orderId]);

  const handleCopyNumero = () => {
    if (!order?.numeroCommande) return;
    navigator.clipboard.writeText(order.numeroCommande);
    setCopied(true);
    toast.success('Numéro copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) return;
    setCancelling(true);
    try {
      const result = await cancelOrder(orderId);
      if (result.success) {
        // La réponse d'annulation ne renvoie pas les lignes (endpoint léger) : on fusionne
        // plutôt que remplacer, pour ne pas perdre l'affichage des produits déjà chargés.
        setOrder((prev) => ({ ...prev, ...result.data }));
        toast.success('Commande annulée avec succès');
      } else {
        toast.error(result.message || 'Erreur lors de l\'annulation');
      }
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l\'annulation');
    } finally {
      setCancelling(false);
    }
  };

  const handleReorder = async () => {
    if (!order?.lignes?.length) return;
    setReordering(true);
    let added = 0;
    for (const ligne of order.lignes) {
      if (!ligne.produitId) continue;
      const ok = await addItem(ligne.produitId, ligne.quantite, false);
      if (ok) added += 1;
    }
    setReordering(false);
    const skipped = order.lignes.length - added;
    if (added > 0) {
      toast.success(`${added} référence${added > 1 ? 's' : ''} ajoutée${added > 1 ? 's' : ''} au panier` + (skipped > 0 ? ` (${skipped} indisponible${skipped > 1 ? 's' : ''})` : ''));
    } else {
      toast.error('Aucune référence n\'a pu être ajoutée au panier');
    }
  };

  if (loading) {
    return (
      <div className="bg-sand-50 min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-700 animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-sand-50 min-h-screen flex items-center justify-center px-4 py-16">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-danger-text mx-auto mb-4" />
          <h1 className="font-display text-[23px] font-extrabold text-ink-900 mb-2">Commande non trouvée</h1>
          <p className="text-[13.5px] text-graphite-500 mb-6">{error}</p>
          <Link to="/mes-commandes" className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-6 text-[13.5px] font-semibold transition-colors">
            Retour à mes commandes
          </Link>
        </div>
      </div>
    );
  }

  const statutInfo = getStatutInfo(order.statut);
  const badgeStyle = STATUT_BADGE[order.statut] || 'bg-neutral-status-bg text-neutral-status-text';
  const currentIndex = order.statut === 'ANNULEE' ? -1 : STATUT_ORDER.indexOf(order.statut);
  const canCancel = canCancelOrder(order.statut);
  const modePaiement = MODES_PAIEMENT.find((m) => m.id === order.modePaiement);
  const creneau = parseCreneau(order.instructionsLivraison);

  return (
    <div className="bg-sand-50 min-h-screen pb-[86px] md:pb-0">
      <div className="flex flex-col gap-3.5 px-4 md:px-10 py-7">
        <Link to="/mes-commandes" className="text-[13.5px] font-semibold text-ink-900 hover:text-green-800 w-fit">
          ← Retour à mes commandes
        </Link>

        <div className="bg-white border border-sand-200 rounded-8 p-5 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <h1 className="font-mono text-[24px] font-semibold tracking-tight text-ink-900">{order.numeroCommande}</h1>
                <button onClick={handleCopyNumero} className="p-1.5 text-graphite-300 hover:text-ink-900 transition-colors" aria-label="Copier le numéro">
                  {copied ? <Check className="w-4 h-4 text-green-700" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-4 ${badgeStyle}`}>{statutInfo.label}</span>
            </div>
            <p className="text-[13.5px] text-graphite-500 mt-1.5">
              Passée le {formatDateTime(order.dateCommande)}{creneau ? ` · Livraison souhaitée ${creneau}` : ''}
            </p>
          </div>
          <div className="hidden md:flex gap-2.5 flex-wrap">
            <button type="button" disabled title="Disponible dès que la commande est confirmée" className="border border-sand-250 text-ink-900 text-[13.5px] font-semibold px-4 py-2.5 rounded-6 opacity-40 cursor-not-allowed">
              Devis PDF
            </button>
            <button type="button" disabled title="Voir Mes factures une fois la facture générée" className="border border-sand-250 text-ink-900 text-[13.5px] font-semibold px-4 py-2.5 rounded-6 opacity-40 cursor-not-allowed">
              Facture
            </button>
            {canCancel && (
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="border border-danger-border text-danger-text text-[13.5px] font-semibold px-4 py-2.5 rounded-6 hover:bg-danger-bg disabled:opacity-50 transition-colors"
              >
                {cancelling ? 'Annulation…' : 'Annuler la commande'}
              </button>
            )}
            <button
              type="button"
              onClick={handleReorder}
              disabled={reordering}
              className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white text-[13.5px] font-semibold px-[18px] py-2.5 rounded-6 transition-colors"
            >
              {reordering ? 'Ajout…' : 'Recommander'}
            </button>
          </div>
          {canCancel && (
            <button
              type="button"
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="md:hidden w-full border border-danger-border text-danger-text text-[13.5px] font-semibold px-4 py-2.5 rounded-6 hover:bg-danger-bg disabled:opacity-50 transition-colors"
            >
              {cancelling ? 'Annulation…' : 'Annuler la commande'}
            </button>
          )}
        </div>

        {order.statut !== 'ANNULEE' && (
          <div className="bg-white border border-sand-200 rounded-8 p-[22px]">
            <div className="font-display text-[16px] font-bold text-ink-900 mb-5">Suivi</div>
            <div className="flex flex-col gap-3.5 sm:hidden">
              {TIMELINE_STEPS.map((step, index) => {
                const done = index <= currentIndex;
                const isCurrent = index === currentIndex;
                return (
                  <div key={step.statut} className="flex gap-3 items-start">
                    <div className="flex flex-col items-center pt-1 flex-shrink-0">
                      <span className={`w-[10px] h-[10px] rounded-full ${done ? 'bg-green-700' : 'bg-sand-300'}`} />
                      {index < TIMELINE_STEPS.length - 1 && <span className={`w-[2px] flex-1 min-h-[20px] mt-1 ${index < currentIndex ? 'bg-green-700' : 'bg-sand-300'}`} />}
                    </div>
                    <div className="pb-0.5">
                      <span className={`text-[13.5px] ${isCurrent ? 'font-bold text-[#10231A]' : done ? 'font-semibold text-ink-900' : 'text-[#9AA69F]'}`}>{step.titre}</span>
                      {isCurrent && <span className="font-mono text-[11.5px] text-graphite-400 block">En cours</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="hidden sm:grid grid-cols-5 gap-3.5">
              {TIMELINE_STEPS.map((step, index) => (
                <div key={step.statut} className="flex flex-col gap-2.5 pr-3.5">
                  <div className={`h-1 rounded-full ${index <= currentIndex ? 'bg-green-700' : 'bg-sand-300'}`} />
                  <span className="text-[13.5px] font-semibold text-ink-900">{step.titre}</span>
                  {index === currentIndex && <span className="font-mono text-[11.5px] text-graphite-400">En cours</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-[22px]">
          <div className="bg-white border border-sand-200 rounded-8 overflow-hidden h-fit">
            <div className="hidden sm:grid gap-3.5 px-[18px] py-2.5 bg-sand-100 border-b border-sand-200 text-[11.5px] tracking-wide text-graphite-400" style={{ gridTemplateColumns: '56px 1fr 120px 80px 110px' }}>
              <span /><span>PRODUIT</span><span>PRIX UNITAIRE</span><span>QTÉ</span><span className="text-right">TOTAL HT</span>
            </div>
            {order.lignes?.map((ligne) => (
              <div key={ligne.id} className="hidden sm:grid gap-3.5 px-[18px] py-3.5 border-b border-[#F0EEE7] last:border-b-0 items-center" style={{ gridTemplateColumns: '56px 1fr 120px 80px 110px' }}>
                <div className="w-14 h-14 rounded-4 overflow-hidden placeholder-stripe">
                  {getImageUrl(ligne.produit?.imageUrl) && <img src={getImageUrl(ligne.produit.imageUrl)} alt="" className="w-full h-full object-cover" />}
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-ink-900">{ligne.produit?.nom || ligne.nomProduit}</div>
                  {ligne.produit?.reference && <div className="font-mono text-[11.5px] text-graphite-300">{ligne.produit.reference}</div>}
                </div>
                <span className="font-mono text-[13.5px] text-graphite-700">{formatAmount(ligne.prixUnitaireHt)}</span>
                <span className="font-mono text-[13.5px] text-graphite-700">{ligne.quantite}</span>
                <span className="font-mono text-[14px] text-ink-900 text-right">{formatAmount(ligne.totalHt)}</span>
              </div>
            ))}
            {order.lignes?.map((ligne) => (
              <div key={`m-${ligne.id}`} className="sm:hidden flex gap-3 px-4 py-3.5 border-b border-[#F0EEE7] last:border-b-0 items-center">
                <div className="w-12 h-12 rounded-4 overflow-hidden placeholder-stripe flex-shrink-0">
                  {getImageUrl(ligne.produit?.imageUrl) && <img src={getImageUrl(ligne.produit.imageUrl)} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-ink-900">{ligne.produit?.nom || ligne.nomProduit}</div>
                  <div className="font-mono text-[11.5px] text-graphite-300">
                    {ligne.produit?.reference && `${ligne.produit.reference} · `}{formatAmount(ligne.prixUnitaireHt)} HT · ×{ligne.quantite}
                  </div>
                </div>
                <span className="font-mono text-[14px] text-ink-900 flex-shrink-0">{formatAmount(ligne.totalHt)}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <div className="bg-white border border-sand-200 rounded-8 p-[18px]">
              <div className="flex justify-between py-1.5 text-[13.5px]">
                <span className="text-graphite-600">Sous-total HT</span>
                <span className="font-mono text-ink-900">{formatAmount(order.totalHt)}</span>
              </div>
              <div className="flex justify-between py-1.5 text-[13.5px]">
                <span className="text-graphite-600">TVA</span>
                <span className="font-mono text-ink-900">{formatAmount(order.totalTva)}</span>
              </div>
              <div className="flex justify-between py-1.5 text-[13.5px] border-b border-[#F0EEE7]">
                <span className="text-graphite-600">Livraison</span>
                <span className="font-mono text-ink-900">{order.fraisLivraison > 0 ? formatAmount(order.fraisLivraison) : 'Offerte'}</span>
              </div>
              <div className="flex justify-between items-baseline pt-3.5">
                <span className="font-display text-[16px] font-bold text-ink-900">Total TTC</span>
                <span className="font-mono text-[24px] font-semibold text-ink-900">{formatAmount(order.totalTtc)}</span>
              </div>
            </div>

            {order.adresseLivraison && (
              <div className="bg-white border border-sand-200 rounded-8 p-[18px]">
                <div className="text-[12px] tracking-wide text-graphite-400 mb-2">ADRESSE DE LIVRAISON</div>
                <div className="text-[13px] text-graphite-700 leading-[1.6]">
                  {order.adresseLivraison.prenom} {order.adresseLivraison.nom}<br />
                  {order.adresseLivraison.adresse}<br />
                  {order.adresseLivraison.codePostal} {order.adresseLivraison.ville}
                  {order.adresseLivraison.telephone && <><br />{order.adresseLivraison.telephone}</>}
                </div>
              </div>
            )}

            <div className="bg-white border border-sand-200 rounded-8 p-[18px]">
              <div className="text-[12px] tracking-wide text-graphite-400 mb-2">RÈGLEMENT</div>
              <div className="text-[13.5px] font-semibold text-ink-900">{modePaiement?.label || order.modePaiement}</div>
              {modePaiement?.description && <div className="text-[12.5px] text-graphite-500 mt-1">{modePaiement.description}</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Barre collée (mobile, M10) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-sand-200 px-4 py-2.5 flex gap-2.5" style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
        <button
          type="button"
          disabled
          title="Voir Mes factures une fois la facture générée"
          className="flex-1 h-[52px] border border-sand-250 text-ink-900 text-[13.5px] font-semibold rounded-6 opacity-40 cursor-not-allowed"
        >
          Facture
        </button>
        <button
          type="button"
          onClick={handleReorder}
          disabled={reordering}
          className="flex-1 h-[52px] bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white text-[13.5px] font-semibold rounded-6 transition-colors"
        >
          {reordering ? 'Ajout…' : 'Recommander'}
        </button>
      </div>
    </div>
  );
};

export default OrderDetailPage;
