/**
 * Page Checkout — devis, sans paiement en ligne
 * @description Écran 05 — Checkout
 * @see design_handoff_jana_refonte/README.md
 */

import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { createOrder, MODES_PAIEMENT } from '../services/orderService';
import { estimateShipping } from '../services/shippingService';
import { validerCodePromo } from '../services/promoService';
import { formatAmount } from '../utils/priceUtils';
import toast from 'react-hot-toast';

import { InfosContact, AdresseLivraison, CreneauLivraison, MoyenPaiement, Recapitulatif } from '../components/checkout';

const PROMO_STORAGE_KEY = 'jana_promo_code';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, subtotalHT, totalTVA, totalTTC, isEmpty, isLoading: cartLoading, resetCartLocal } = useCart();
  const { getFraisLivraison, telephoneSite, loading: settingsLoading } = useSettings();

  const today = useMemo(() => new Date(), []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [creneauIndex, setCreneauIndex] = useState(null);
  const [selectedCreneau, setSelectedCreneau] = useState(null);

  const fallbackFrais = getFraisLivraison(totalTTC);
  const [fraisLivraison, setFraisLivraison] = useState(fallbackFrais);
  const [shippingInfo, setShippingInfo] = useState(null);
  const [shippingLoading, setShippingLoading] = useState(false);

  const [codePromoValide, setCodePromoValide] = useState(null);

  const [formData, setFormData] = useState({
    prenom: '', nom: '', entreprise: '', telephone: '',
    adresse: '', complement: '', codePostal: '', ville: '',
    adresseFacturation: '', complementFacturation: '', codePostalFacturation: '', villeFacturation: '',
    modePaiement: 'ESPECES', instructions: '', acceptCGV: false
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        prenom: user.prenom || '',
        nom: user.nom || '',
        entreprise: user.raisonSociale || '',
        telephone: user.telephone || ''
      }));
    }
  }, [user]);

  useEffect(() => {
    if (!cartLoading && isEmpty) navigate('/panier');
  }, [cartLoading, isEmpty, navigate]);

  useEffect(() => {
    if (!user) {
      toast.error('Veuillez vous connecter pour passer commande');
      navigate('/login?redirect=/checkout');
    }
  }, [user, navigate]);

  // Code promo appliqué sur la page panier : on le reprend silencieusement ici
  // (pas de second champ de saisie — absent de la maquette checkout).
  useEffect(() => {
    const storedCode = sessionStorage.getItem(PROMO_STORAGE_KEY);
    if (!storedCode || totalTTC <= 0) return;
    validerCodePromo(storedCode, totalTTC).then((result) => {
      if (result.success) setCodePromoValide(result.data);
      else sessionStorage.removeItem(PROMO_STORAGE_KEY);
    }).catch(() => sessionStorage.removeItem(PROMO_STORAGE_KEY));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalTTC > 0]);

  // Estimation dynamique des frais de livraison dès que l'adresse est complète.
  useEffect(() => {
    const cp = (formData.codePostal || '').trim();
    const ville = (formData.ville || '').trim();
    const adresse = (formData.adresse || '').trim();

    if (!/^\d{5}$/.test(cp) || !ville) {
      setFraisLivraison(getFraisLivraison(totalTTC));
      setShippingInfo(null);
      return;
    }

    const t = setTimeout(async () => {
      setShippingLoading(true);
      try {
        const data = await estimateShipping({ montant: totalTTC, adresse, codePostal: cp, ville });
        setShippingInfo(data);
        setFraisLivraison(Number(data.frais) || 0);
        if (data.horsZone) {
          toast.error(`Adresse hors zone de livraison (max ${data.distanceMaxKm} km)`, { id: 'shipping-hors-zone' });
        }
      } catch (err) {
        console.error('Erreur estimation frais:', err);
        setShippingInfo(null);
        setFraisLivraison(getFraisLivraison(totalTTC));
      } finally {
        setShippingLoading(false);
      }
    }, 500);

    return () => clearTimeout(t);
  }, [formData.codePostal, formData.ville, formData.adresse, totalTTC, getFraisLivraison]);

  const totalCommande = totalTTC + fraisLivraison;
  const totalFinalMobile = codePromoValide ? codePromoValide.total_apres_rabais : totalCommande;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.prenom.trim()) newErrors.prenom = 'Prénom requis';
    if (!formData.nom.trim()) newErrors.nom = 'Nom requis';
    if (!formData.telephone.trim()) {
      newErrors.telephone = 'Téléphone requis';
    } else if (!/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/.test(formData.telephone.replace(/\s/g, ''))) {
      newErrors.telephone = 'Numéro de téléphone invalide';
    }
    if (!formData.adresse.trim()) newErrors.adresse = 'Adresse requise';
    if (!formData.codePostal.trim()) {
      newErrors.codePostal = 'Code postal requis';
    } else if (!/^\d{5}$/.test(formData.codePostal)) {
      newErrors.codePostal = 'Code postal invalide (5 chiffres)';
    }
    if (!formData.ville.trim()) newErrors.ville = 'Ville requise';
    if (!formData.acceptCGV) newErrors.acceptCGV = 'Vous devez accepter les conditions générales de vente';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs du formulaire');
      const firstError = document.querySelector('.error-field');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (shippingInfo?.horsZone) {
      toast.error(`Désolé, votre adresse est hors zone de livraison (max ${shippingInfo.distanceMaxKm} km).`);
      return;
    }

    setIsSubmitting(true);
    try {
      const instructionsAvecCreneau = selectedCreneau
        ? `Créneau souhaité : ${selectedCreneau.jour}, ${selectedCreneau.heure}\n${formData.instructions}`.trim()
        : formData.instructions;

      const result = await createOrder({ ...formData, instructions: instructionsAvecCreneau }, fraisLivraison, codePromoValide?.code || null);

      if (!result.success) {
        toast.error(result.message || 'Erreur lors de la commande');
        return;
      }

      sessionStorage.removeItem(PROMO_STORAGE_KEY);
      resetCartLocal();
      navigate(`/commande/confirmation/${result.data.id}`, { state: { order: result.data, fromCheckout: true } });
      toast.success('Commande enregistrée avec succès !');
    } catch (error) {
      console.error('Erreur commande:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la commande. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || isEmpty || settingsLoading) return null;

  return (
    <div className="bg-sand-50 min-h-screen font-sans pb-[90px] md:pb-0">
      {/* En-tête dédié checkout — pas de nav rayons, pas de footer */}
      <div className="bg-white border-b border-sand-200 px-4 md:px-10 py-4 flex flex-wrap items-center gap-6 md:gap-9">
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-6 bg-green-700 flex items-center justify-center text-white font-display font-extrabold text-[16px]">J</div>
          <span className="hidden sm:inline font-display font-extrabold text-[18px] tracking-tight text-ink-900">JANA DISTRIBUTION</span>
        </Link>
        <div className="hidden md:flex items-center gap-3.5 text-[13.5px]">
          <Link to="/panier" className="text-green-700 font-semibold hover:text-green-800">1. Panier</Link>
          <span className="text-[#C3CBC6]">—</span>
          <span className="text-ink-900 font-semibold">2. Livraison &amp; paiement</span>
          <span className="text-[#C3CBC6]">—</span>
          <span className="text-graphite-200">3. Confirmation</span>
        </div>
        <div className="ml-auto text-[13px] text-graphite-500">
          Besoin d'aide ? <span className="font-mono text-ink-900">{telephoneSite}</span>
        </div>
      </div>

      {/* Progression mobile (M6) : 3 segments + "Étape 2 sur 3" */}
      <div className="md:hidden bg-white border-b border-sand-200 px-4 pb-3.5">
        <div className="flex gap-1.5">
          <div className="flex-1 h-1 rounded-full bg-green-700" />
          <div className="flex-1 h-1 rounded-full bg-green-700" />
          <div className="flex-1 h-1 rounded-full bg-sand-300" />
        </div>
        <div className="text-[12px] text-graphite-500 mt-1.5">Étape 2 sur 3 · Livraison &amp; paiement</div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-[22px] px-4 md:px-10 py-6 pb-10">
        <div className="flex flex-col gap-3.5 min-w-0">
          <div className="bg-success-bg border border-success-border rounded-8 px-[18px] py-3.5 text-[13.5px] text-[#254534] leading-[1.6]">
            <strong className="text-ink-900">Commande sans paiement en ligne.</strong> Vous recevez un devis par email dans la minute. Notre équipe confirme la disponibilité et le créneau, puis vous réglez à la livraison.
          </div>

          <InfosContact formData={formData} errors={errors} onChange={handleChange} />
          <AdresseLivraison formData={formData} errors={errors} onChange={handleChange} userId={user?.id} />
          <CreneauLivraison
            today={today}
            selectedIndex={creneauIndex}
            onSelect={(index, slot) => { setCreneauIndex(index); setSelectedCreneau(slot); }}
          />
          <MoyenPaiement formData={formData} onChange={handleChange} modesPaiement={MODES_PAIEMENT} />
        </div>

        <Recapitulatif
          items={items}
          subtotalHT={subtotalHT}
          totalTVA={totalTVA}
          fraisLivraison={fraisLivraison}
          shippingInfo={shippingInfo}
          shippingLoading={shippingLoading}
          totalCommande={totalCommande}
          formData={formData}
          errors={errors}
          onChange={handleChange}
          isSubmitting={isSubmitting}
          codePromoValide={codePromoValide}
        />

        {/* Barre collee (mobile, M6) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-sand-200 px-4 py-2.5 flex items-center gap-3" style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-graphite-500">Total à régler</div>
            <div className="font-mono text-[20px] font-semibold text-ink-900 truncate">{formatAmount(totalFinalMobile)}</div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-shrink-0 h-[52px] px-5 bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white rounded-6 text-[14px] font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Envoi…' : 'Recevoir mon devis'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
