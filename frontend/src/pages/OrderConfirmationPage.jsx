/**
 * Page Confirmation de commande
 * @description Écran 07 — Confirmation de commande
 * @see design_handoff_jana_refonte/README.md
 */

import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2, AlertCircle, FileText } from 'lucide-react';
import { getOrderById, MODES_PAIEMENT } from '../services/orderService';
import { useSettings } from '../contexts/SettingsContext';
import { getImageUrl } from '../utils/imageUtils';
import { formatAmount } from '../utils/priceUtils';

const STATUT_ORDER = ['EN_ATTENTE', 'CONFIRMEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE'];

const ETAPES = [
  { titre: 'Devis envoyé', desc: 'Récapitulatif transmis par email' },
  { titre: 'Confirmation équipe', desc: 'Disponibilité et créneau vérifiés' },
  { titre: 'Préparation', desc: 'Commande préparée en entrepôt' },
  { titre: 'Livraison', desc: 'Livré à l\'adresse indiquée' }
];

const formatDate = (dateString) => new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
}).format(new Date(dateString));

// Le créneau choisi au checkout n'a pas de champ dédié côté backend (aucune capacité de
// créneaux gérée) : il est transmis dans instructionsLivraison avec un préfixe convenu
// (voir CheckoutPage). On le retrouve ici pour l'affichage, s'il est présent.
const parseCreneau = (instructions) => {
  if (!instructions?.startsWith('Créneau souhaité : ')) return { creneau: null, reste: instructions };
  const [firstLine, ...rest] = instructions.split('\n');
  return { creneau: firstLine.replace('Créneau souhaité : ', ''), reste: rest.join('\n').trim() };
};

const OrderConfirmationPage = () => {
  const { orderId } = useParams();
  const { telephoneSite } = useSettings();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getOrderById(orderId).then((result) => {
      if (!mounted) return;
      if (result.success) setOrder(result.data);
      else setError(result.message || 'Commande non trouvée');
    }).catch(() => mounted && setError('Erreur lors du chargement')).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [orderId]);

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
          <Link to="/catalogue" className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-6 text-[13.5px] font-semibold transition-colors">
            Retour au catalogue
          </Link>
        </div>
      </div>
    );
  }

  const modePaiement = MODES_PAIEMENT.find((m) => m.id === order.modePaiement);
  const statutIndex = STATUT_ORDER.indexOf(order.statut);
  const completedSteps = order.statut === 'ANNULEE' ? 0 : Math.min(statutIndex + 1, 4);
  const { creneau } = parseCreneau(order.instructionsLivraison);
  const adresse = order.adresseLivraison;
  const totalRegler = order.totalTtc;

  return (
    <div className="bg-sand-50 min-h-screen pb-[86px] md:pb-0">
      {/* Bandeau succès */}
      <section className="bg-ink-900 px-4 md:px-10 py-[34px] flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="w-[46px] h-[46px] md:w-[52px] md:h-[52px] rounded-full bg-green-700 text-white flex items-center justify-center text-[22px] md:text-[24px] flex-shrink-0">✓</div>
        <div className="flex-1">
          <h1 className="font-display text-[26px] md:text-[30px] font-extrabold tracking-tighter text-white">Votre demande est enregistrée</h1>
          <p className="text-[14.5px] text-[#A6BEB1] mt-1.5">
            Le devis <span className="font-mono text-white">{order.numeroCommande}</span> vient de partir vers {order.utilisateur?.email || 'votre adresse email'}. Notre équipe vous appelle avant 18 h pour confirmer le créneau.
          </p>
        </div>
        <div className="hidden md:flex gap-2.5 flex-shrink-0">
          <button
            type="button"
            disabled
            title="Disponible dès que la commande est confirmée (voir Mes factures)"
            className="border border-ink-500 text-white text-[14px] font-semibold px-5 py-3 rounded-6 opacity-40 cursor-not-allowed"
          >
            Télécharger le devis (PDF)
          </button>
          <Link to={`/mes-commandes/${order.id}`} className="bg-green-700 hover:bg-green-800 text-white text-[14px] font-semibold px-5 py-3 rounded-6 transition-colors">
            Suivre ma commande
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-[22px] px-4 md:px-10 py-6 pb-10">
        <div className="flex flex-col gap-3.5 min-w-0">
          {/* Ce qui se passe maintenant */}
          <div className="bg-white border border-sand-200 rounded-8 p-5">
            <div className="font-display text-[16px] font-bold text-ink-900 mb-4">Ce qui se passe maintenant</div>
            <div className="flex flex-col gap-3.5 sm:hidden">
              {ETAPES.map((etape, index) => (
                <div key={etape.titre} className="flex gap-3 items-start">
                  <div className="flex flex-col items-center gap-1 pt-0.5 flex-shrink-0">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-semibold ${index < completedSteps ? 'bg-green-700 text-white' : 'bg-sand-300 text-graphite-500'}`}>{index + 1}</span>
                    {index < ETAPES.length - 1 && <span className={`w-[2px] flex-1 min-h-[24px] ${index < completedSteps - 1 ? 'bg-green-700' : 'bg-sand-300'}`} />}
                  </div>
                  <div className="pb-1">
                    <span className="text-[14px] font-semibold text-ink-900 block">{etape.titre}</span>
                    <span className="text-[12.5px] text-graphite-600 leading-[1.5]">{etape.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden sm:grid grid-cols-4 gap-3.5">
              {ETAPES.map((etape, index) => (
                <div key={etape.titre} className="flex flex-col gap-1.5">
                  <div className="h-1 rounded-full bg-sand-300 overflow-hidden">
                    <div className="h-full bg-green-700" style={{ width: index < completedSteps ? '100%' : '0%' }} />
                  </div>
                  <span className="font-mono text-[11px] text-graphite-400">{index + 1}</span>
                  <span className="text-[14px] font-semibold text-ink-900">{etape.titre}</span>
                  <span className="text-[12.5px] text-graphite-600 leading-[1.5]">{etape.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Récapitulatif */}
          <div className="bg-white border border-sand-200 rounded-8 overflow-hidden">
            <div className="px-[18px] py-3.5 border-b border-sand-200 font-display text-[16px] font-bold text-ink-900">
              Récapitulatif — {order.lignes?.length || 0} référence{(order.lignes?.length || 0) > 1 ? 's' : ''}
            </div>
            {order.lignes?.map((ligne) => (
              <div key={ligne.id} className="flex gap-3.5 px-[18px] py-3.5 border-b border-[#F0EEE7] items-center">
                <div className="w-12 h-12 rounded-4 flex-shrink-0 overflow-hidden placeholder-stripe">
                  {getImageUrl(ligne.produit?.imageUrl) && (
                    <img src={getImageUrl(ligne.produit.imageUrl)} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-ink-900">{ligne.produit?.nom || ligne.nomProduit}</div>
                  <div className="font-mono text-[11.5px] text-graphite-300">
                    {ligne.produit?.reference} · {formatAmount(ligne.prixUnitaireHt)} HT · ×{ligne.quantite}
                  </div>
                </div>
                <span className="font-mono text-[14px] text-ink-900 flex-shrink-0">{formatAmount(ligne.totalHt)}</span>
              </div>
            ))}
            <div className="flex justify-between px-[18px] pt-3.5 pb-1 text-[13.5px]">
              <span className="text-graphite-600">Sous-total HT</span>
              <span className="font-mono text-ink-900">{formatAmount(order.totalHt)}</span>
            </div>
            <div className="flex justify-between px-[18px] py-1 text-[13.5px]">
              <span className="text-graphite-600">TVA</span>
              <span className="font-mono text-ink-900">{formatAmount(order.totalTva)}</span>
            </div>
            <div className="flex justify-between px-[18px] pt-1 pb-3.5 text-[13.5px]">
              <span className="text-graphite-600">Livraison</span>
              <span className="font-mono text-ink-900">{order.fraisLivraison > 0 ? formatAmount(order.fraisLivraison) : 'Offerte'}</span>
            </div>
            <div className="flex justify-between items-baseline px-[18px] py-3.5 bg-sand-100 border-t border-sand-200">
              <span className="font-display text-[16px] font-bold text-ink-900">Total à régler à la livraison</span>
              <span className="font-mono text-[25px] font-semibold text-ink-900">{formatAmount(totalRegler)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="bg-white border border-sand-200 rounded-8 p-[18px]">
            <div className="text-[12px] tracking-wide text-graphite-400 mb-2.5">LIVRAISON</div>
            {creneau && <div className="text-[14px] font-semibold text-ink-900">{creneau}</div>}
            {adresse && (
              <div className="text-[13px] text-graphite-700 leading-[1.6] mt-1.5">
                {adresse.prenom} {adresse.nom}<br />
                {adresse.adresse}<br />
                {adresse.codePostal} {adresse.ville}<br />
                {adresse.telephone}
              </div>
            )}
          </div>

          <div className="bg-white border border-sand-200 rounded-8 p-[18px]">
            <div className="text-[12px] tracking-wide text-graphite-400 mb-2.5">RÈGLEMENT PRÉVU</div>
            <div className="text-[14px] font-semibold text-ink-900">{modePaiement?.label || order.modePaiement}</div>
            <div className="text-[13px] text-graphite-600 mt-1">{modePaiement?.description} · aucun débit avant réception</div>
          </div>

          <div className="bg-success-bg border border-success-border rounded-8 p-[18px]">
            <div className="text-[14px] font-bold text-ink-900">Une modification ?</div>
            <div className="text-[13px] text-[#40564A] mt-1.5 leading-[1.6]">
              Tant que la commande n'est pas préparée, vous pouvez ajuster les quantités par téléphone au <span className="font-mono">{telephoneSite}</span>.
            </div>
          </div>
        </div>
      </div>

      <div className="text-center pb-10 text-[13.5px] text-graphite-500 flex items-center justify-center gap-2">
        <FileText className="w-4 h-4" />
        <Link to={`/mes-commandes/${order.id}`} className="font-semibold text-green-700 hover:text-green-800">Voir le détail de la commande</Link>
        <span className="text-graphite-300">·</span>
        <Link to="/catalogue" className="font-semibold text-green-700 hover:text-green-800">Continuer mes achats</Link>
      </div>

      {/* Barre collée (mobile, M8) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-sand-200 px-4 py-2.5 flex gap-2.5" style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
        <button
          type="button"
          disabled
          title="Disponible dès que la commande est confirmée (voir Mes factures)"
          className="flex-1 h-[52px] border border-sand-250 text-ink-900 text-[13.5px] font-semibold rounded-6 opacity-40 cursor-not-allowed"
        >
          Devis (PDF)
        </button>
        <Link to={`/mes-commandes/${order.id}`} className="flex-1 h-[52px] bg-green-700 hover:bg-green-800 text-white text-[13.5px] font-semibold rounded-6 transition-colors flex items-center justify-center">
          Suivre ma commande
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
