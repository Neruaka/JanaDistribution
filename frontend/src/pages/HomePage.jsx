/**
 * Page d'accueil
 * @description Écran 01 — Accueil (hero, dernière commande, rail rayons, plus commandés, encarts)
 * @see design_handoff_jana_refonte/README.md
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useSettings } from '../contexts/SettingsContext';
import productService from '../services/productService';
import categoryService from '../services/categoryService';
import orderService from '../services/orderService';
import ProductCard from '../components/ProductCard';
import { getImageUrl } from '../utils/imageUtils';
import { formatAmount } from '../utils/priceUtils';
import toast from 'react-hot-toast';

const formatOrderDate = (dateStr) => {
  if (!dateStr) return '';
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(new Date(dateStr));
};

const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const { montantMinCommande } = useSettings();

  const [rayons, setRayons] = useState([]);
  const [loadingRayons, setLoadingRayons] = useState(true);

  const [populaires, setPopulaires] = useState([]);
  const [loadingPopulaires, setLoadingPopulaires] = useState(true);

  const [totalReferences, setTotalReferences] = useState(null);

  const [lastOrder, setLastOrder] = useState(null);
  const [loadingLastOrder, setLoadingLastOrder] = useState(isAuthenticated);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    let mounted = true;
    categoryService.getAll({ includeProductCount: true }).then((response) => {
      if (mounted && response.success && Array.isArray(response.data)) {
        setRayons(response.data.filter((c) => c.estActif !== false));
      }
    }).catch(() => {}).finally(() => mounted && setLoadingRayons(false));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    productService.getAll({ estMisEnAvant: true, limit: 5, orderBy: 'createdAt', orderDir: 'DESC' }).then((response) => {
      if (!mounted || !response.success) return;
      if (response.data.length > 0) {
        setPopulaires(response.data);
      } else {
        // Pas encore de produit mis en avant : on retombe sur les plus récents
        return productService.getAll({ limit: 5, orderBy: 'createdAt', orderDir: 'DESC' }).then((fallback) => {
          if (mounted && fallback.success) setPopulaires(fallback.data);
        });
      }
    }).catch(() => {}).finally(() => mounted && setLoadingPopulaires(false));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    productService.getAll({ limit: 1 }).then((response) => {
      if (mounted && response.success) setTotalReferences(response.pagination?.total ?? null);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setLastOrder(null);
      setLoadingLastOrder(false);
      return;
    }
    let mounted = true;
    setLoadingLastOrder(true);
    orderService.getUserOrders({ limit: 1 }).then((response) => {
      const latest = response?.data?.[0];
      if (!latest) return null;
      return orderService.getOrderById(latest.id);
    }).then((detail) => {
      if (mounted && detail?.data) setLastOrder(detail.data);
    }).catch(() => {}).finally(() => mounted && setLoadingLastOrder(false));
    return () => { mounted = false; };
  }, [isAuthenticated]);

  const handleReorder = async () => {
    if (!lastOrder?.lignes?.length) return;
    setReordering(true);
    let added = 0;
    let skipped = 0;
    for (const ligne of lastOrder.lignes) {
      if (!ligne.produitId) { skipped += 1; continue; }
      const ok = await addItem(ligne.produitId, ligne.quantite, false);
      if (ok) added += 1; else skipped += 1;
    }
    setReordering(false);
    if (added > 0) {
      toast.success(
        `${added} référence${added > 1 ? 's' : ''} ajoutée${added > 1 ? 's' : ''} au panier` +
        (skipped ? ` (${skipped} indisponible${skipped > 1 ? 's' : ''})` : '')
      );
    } else {
      toast.error('Aucune référence n\'a pu être ajoutée au panier');
    }
  };

  const showReorder = isAuthenticated && !loadingLastOrder && !!lastOrder;
  const minStat = montantMinCommande > 0 ? montantMinCommande : 50;
  const visibleLines = lastOrder?.lignes?.slice(0, 3) || [];
  const extraLines = Math.max(0, (lastOrder?.lignes?.length || 0) - visibleLines.length);

  return (
    <div className="bg-sand-50">
      {/* Hero */}
      <section className={`bg-ink-900 px-4 md:px-10 py-8 md:py-[34px] grid gap-8 md:gap-11 items-center ${showReorder ? 'md:grid-cols-[1.25fr_1fr]' : 'md:grid-cols-1'}`}>
        <div className="flex flex-col gap-4">
          <span className="font-mono text-[11.5px] tracking-wider text-accent-light">
            GROSSISTE ALIMENTAIRE · RUNGIS
          </span>
          <h1 className="font-display text-[32px] md:text-[44px] leading-[1.04] font-extrabold tracking-tighter text-white">
            Le prix de gros,<br />sans carte de grossiste.
          </h1>
          <p className="text-[15.5px] leading-[1.6] text-[#A6BEB1] max-w-[520px]">
            {totalReferences ? `${totalReferences.toLocaleString('fr-FR')} références` : 'Des centaines de références'} en frais, sec et surgelé. Mêmes tarifs pour les restaurateurs et les particuliers, livrés en 24–48 h du lundi au samedi.
          </p>
          <div className="flex gap-3 mt-1.5">
            <Link to="/catalogue" className="bg-green-700 hover:bg-green-800 text-white text-[14.5px] font-semibold px-6 py-[13px] rounded-6 transition-colors">
              Parcourir le catalogue
            </Link>
            {!isAuthenticated && (
              <Link to="/register?type=PROFESSIONNEL" className="border border-ink-500 hover:bg-white/5 text-white text-[14.5px] font-semibold px-6 py-[13px] rounded-6 transition-colors">
                Ouvrir un compte pro
              </Link>
            )}
          </div>
          <div className="flex flex-wrap gap-[26px] mt-3 pt-4 border-t border-ink-600">
            <Stat value={totalReferences ? totalReferences.toLocaleString('fr-FR') : '—'} label="références" />
            <Stat value="24–48 h" label="livraison" />
            <Stat value={`${minStat} €`} label="minimum HT" />
          </div>
        </div>

        {showReorder && (
          <div className="bg-white rounded-10 p-[22px] flex flex-col">
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <h2 className="font-display text-[17px] font-bold tracking-tight text-ink-900">Votre dernière commande</h2>
              <span className="font-mono text-[11.5px] text-graphite-400 flex-shrink-0">{lastOrder.numeroCommande}</span>
            </div>
            <p className="text-[13px] text-graphite-600 mb-3.5">
              {lastOrder.statut === 'LIVREE' ? 'Livrée' : 'Commandée'} le {formatOrderDate(lastOrder.dateCommande)} · {lastOrder.lignes.length} référence{lastOrder.lignes.length > 1 ? 's' : ''} · {formatAmount(lastOrder.totalHt)} HT
            </p>
            <div className="border border-sand-250 rounded-6 bg-sand-100 overflow-hidden">
              {visibleLines.map((ligne) => (
                <div key={ligne.id} className="flex items-center gap-[11px] px-3 py-[9px] border-b border-sand-300 last:border-b-0">
                  <div className="w-[34px] h-[34px] rounded-4 flex-shrink-0 overflow-hidden placeholder-stripe">
                    {ligne.produit?.imageUrl && (
                      <img src={getImageUrl(ligne.produit.imageUrl)} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <span className="flex-1 text-[13px] text-ink-900 truncate">{ligne.produit?.nom || ligne.nomProduit}</span>
                  <span className="font-mono text-[12px] text-graphite-500">×{ligne.quantite}</span>
                </div>
              ))}
              {extraLines > 0 && (
                <div className="px-3 py-2 text-[12.5px] text-graphite-400">+ {extraLines} autre{extraLines > 1 ? 's' : ''} référence{extraLines > 1 ? 's' : ''}</div>
              )}
            </div>
            <div className="flex gap-2.5 mt-3">
              <button
                type="button"
                onClick={handleReorder}
                disabled={reordering}
                className="flex-1 bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white text-center text-[13.5px] font-semibold py-[11px] rounded-6 transition-colors"
              >
                {reordering ? 'Ajout…' : 'Tout remettre au panier'}
              </button>
              <Link to={`/mes-commandes/${lastOrder.id}`} className="border border-sand-250 text-ink-900 text-[13.5px] font-semibold px-4 py-[11px] rounded-6 hover:border-sand-300 transition-colors">
                Détail
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Rail rayons — grille 2×3 sur mobile (M1), rangée horizontale au-dela */}
      <section className="grid grid-cols-2 md:flex gap-2.5 px-4 md:px-10 py-4 bg-white border-b border-sand-200 md:overflow-x-auto">
        {loadingRayons ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="md:flex-1 md:min-w-[110px] border border-sand-200 rounded-8 p-3 flex flex-col gap-2 animate-pulse">
              <div className="h-[52px] rounded-5 bg-sand-100" />
              <div className="h-3 w-2/3 bg-sand-100 rounded" />
            </div>
          ))
        ) : (
          rayons.map((rayon) => (
            <Link
              key={rayon.id}
              to={`/catalogue?categorie=${rayon.id}`}
              className="md:flex-1 md:min-w-[110px] border border-sand-200 hover:border-sand-250 rounded-8 p-3 flex flex-col gap-2 bg-sand-50 transition-colors"
            >
              <div className="h-[52px] rounded-5 placeholder-stripe" />
              <span className="text-[13px] font-semibold text-ink-900">{rayon.nom}</span>
              <span className="font-mono text-[11px] text-graphite-400">{rayon.productCount ?? 0} réf.</span>
            </Link>
          ))
        )}
      </section>

      {/* Deux encarts */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 md:px-10 py-6 md:py-[26px]">
        <Link to="/catalogue?labels=PROMO" className="bg-green-700 rounded-8 px-7 py-[26px] flex flex-col gap-2 min-h-[150px] justify-center">
          <span className="font-mono text-[11px] tracking-wider text-[#B7E3C6]">OFFRE DE LA SEMAINE</span>
          <span className="font-display text-[26px] font-extrabold tracking-tight text-white">Découvrez nos promotions</span>
          <span className="text-[14px] text-[#D3ECDB]">Nouvelles offres chaque semaine, dans la limite des stocks</span>
        </Link>
        <Link to="/register" className="bg-white border border-sand-200 rounded-8 px-7 py-[26px] flex flex-col gap-2 justify-center hover:border-sand-250 transition-colors">
          <span className="font-mono text-[11px] tracking-wider text-[#A8501A]">COMPTE PROFESSIONNEL</span>
          <span className="font-display text-[26px] font-extrabold tracking-tight text-ink-900">Facturation mensuelle</span>
          <span className="text-[14px] text-graphite-600">Paiement à 30 jours, factures groupées, commandes récurrentes.</span>
        </Link>
      </section>

      {/* Les plus commandés */}
      <section className="px-4 md:px-10 pb-8 md:pb-10">
        <div className="flex items-baseline justify-between mb-3.5">
          <h2 className="font-display text-[23px] font-extrabold tracking-tight text-ink-900">Les plus commandés</h2>
          <Link to="/catalogue" className="text-[13.5px] font-semibold text-green-700 hover:text-green-800">
            Tout voir →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-[14px]">
          {loadingPopulaires ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border border-sand-200 rounded-8 overflow-hidden animate-pulse">
                <div className="h-[150px] bg-sand-100" />
                <div className="p-3 space-y-2">
                  <div className="h-3 w-1/3 bg-sand-100 rounded" />
                  <div className="h-4 w-3/4 bg-sand-100 rounded" />
                  <div className="h-5 w-1/2 bg-sand-100 rounded" />
                </div>
              </div>
            ))
          ) : populaires.length === 0 ? (
            <p className="col-span-full text-[13px] text-graphite-500 py-8 text-center">
              Aucun produit disponible pour le moment.
            </p>
          ) : (
            populaires.map((product) => <ProductCard key={product.id} product={product} />)
          )}
        </div>
      </section>
    </div>
  );
};

const Stat = ({ value, label }) => (
  <div>
    <div className="font-mono text-[21px] text-white">{value}</div>
    <div className="text-[12px] text-mist-3">{label}</div>
  </div>
);

export default HomePage;
