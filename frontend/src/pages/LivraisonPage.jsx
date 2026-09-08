/**
 * Page Livraison
 * @description Zones desservies, délais et frais de livraison. Le libellé
 * "Livraison" existait déjà dans le footer (FooterStub) sans page
 * correspondante — T16-02.
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Truck, MapPin, Clock, Euro, Snowflake, Bell } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

const ETAPES = [
  { titre: 'Vous commandez', desc: 'Votre devis part par email dans la minute, sans paiement en ligne.' },
  { titre: 'Nous confirmons', desc: 'Notre équipe vous appelle avant 18 h pour valider la disponibilité et le créneau.' },
  { titre: 'Nous préparons', desc: 'Votre commande est préparée en entrepôt, chaîne du froid respectée pour le frais et le surgelé.' },
  { titre: 'Vous êtes livré', desc: 'Livraison au créneau choisi, réglée en espèces, virement ou chèque à réception.' }
];

const LivraisonPage = () => {
  const { livraison, loading } = useSettings();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const estDistance = livraison.modeCalcul === 'DISTANCE';

  return (
    <div className="bg-sand-50 min-h-screen">
      <div className="bg-white border-b border-sand-200 px-4 md:px-10 py-8 md:py-10">
        <div className="max-w-[760px] mx-auto flex items-start gap-4">
          <div className="w-12 h-12 rounded-8 bg-success-bg flex items-center justify-center flex-shrink-0">
            <Truck className="w-6 h-6 text-success-text" />
          </div>
          <div>
            <h1 className="font-display text-[26px] md:text-[30px] font-extrabold tracking-tighter text-ink-900">Livraison</h1>
            <p className="text-[14px] text-graphite-600 mt-1.5">Zones desservies, délais et frais — tout ce qu'il faut savoir avant de commander.</p>
          </div>
        </div>
      </div>

      <div className="max-w-[760px] mx-auto px-4 md:px-10 py-8 flex flex-col gap-3.5">
        {/* Zones + délais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="bg-white border border-sand-200 rounded-8 p-5 md:p-6">
            <div className="w-9 h-9 rounded-6 bg-success-bg flex items-center justify-center mb-3.5">
              <MapPin className="w-[18px] h-[18px] text-success-text" />
            </div>
            <h2 className="font-display text-[16px] font-bold text-ink-900 mb-1.5">Zones desservies</h2>
            <p className="text-[13.5px] text-graphite-700 leading-[1.7]">
              {!loading && (
                <>Nous livrons dans un rayon de <strong>{livraison.distanceMaxKm} km</strong> autour de notre entrepôt en Île-de-France, en France métropolitaine.</>
              )}
            </p>
            <p className="text-[12.5px] text-graphite-500 mt-2">
              Une adresse hors zone est signalée avant validation de la commande.
            </p>
          </div>

          <div className="bg-white border border-sand-200 rounded-8 p-5 md:p-6">
            <div className="w-9 h-9 rounded-6 bg-success-bg flex items-center justify-center mb-3.5">
              <Clock className="w-[18px] h-[18px] text-success-text" />
            </div>
            <h2 className="font-display text-[16px] font-bold text-ink-900 mb-1.5">Délais</h2>
            <p className="text-[13.5px] text-graphite-700 leading-[1.7]">
              {!loading && (
                <>Livraison sous <strong>{livraison.delaiMin} à {livraison.delaiMax} jours ouvrables</strong> après confirmation de votre commande par notre équipe.</>
              )}
            </p>
            <p className="text-[12.5px] text-graphite-500 mt-2">
              Créneau choisi à la commande, confirmé par téléphone.
            </p>
          </div>
        </div>

        {/* Frais */}
        <div className="bg-white border border-sand-200 rounded-8 p-5 md:p-7">
          <div className="flex items-center gap-3 mb-3.5">
            <div className="w-9 h-9 rounded-6 bg-success-bg flex items-center justify-center flex-shrink-0">
              <Euro className="w-[18px] h-[18px] text-success-text" />
            </div>
            <h2 className="font-display text-[16px] font-bold text-ink-900">Frais de livraison</h2>
          </div>

          {!loading && (
            <div className="flex flex-col gap-2.5 text-[13.5px] text-graphite-700 leading-[1.7]">
              {estDistance ? (
                <p>
                  Nos frais de livraison sont calculés au plus juste : <strong>{Number(livraison.fraisBase).toFixed(2)} € de base</strong> + <strong>{Number(livraison.prixParKm).toFixed(2)} € par kilomètre</strong> depuis notre entrepôt jusqu'à votre adresse.
                </p>
              ) : (
                <p>
                  Nos frais de livraison standard sont de <strong>{Number(livraison.fraisStandard).toFixed(2)} €</strong>.
                </p>
              )}
              <div className="bg-selection-bg border border-success-border rounded-6 p-4">
                <strong className="text-success-text">Livraison offerte</strong> dès <strong className="text-success-text">{Number(livraison.seuilFranco).toFixed(0)} € HT</strong> de commande, quelle que soit la distance.
              </div>
              <p className="text-[12.5px] text-graphite-500">
                Le montant exact est calculé et affiché avant la validation de votre commande.
              </p>
            </div>
          )}
        </div>

        {/* Comment ça se passe */}
        <div className="bg-white border border-sand-200 rounded-8 p-5 md:p-7">
          <h2 className="font-display text-[16px] font-bold text-ink-900 mb-4">Comment ça se passe</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {ETAPES.map((etape, index) => (
              <div key={etape.titre} className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-ink-900 text-white flex items-center justify-center text-[11px] font-mono font-semibold flex-shrink-0">{index + 1}</span>
                <div>
                  <div className="text-[13.5px] font-semibold text-ink-900">{etape.titre}</div>
                  <div className="text-[12.5px] text-graphite-600 mt-0.5 leading-[1.5]">{etape.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chaîne du froid + notifications */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="bg-white border border-sand-200 rounded-8 p-5 flex gap-3 items-start">
            <Snowflake className="w-5 h-5 text-success-text flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-[13.5px] font-semibold text-ink-900">Chaîne du froid respectée</div>
              <div className="text-[12.5px] text-graphite-600 mt-0.5 leading-[1.5]">Frais et surgelés transportés en conditions contrôlées jusqu'à votre porte.</div>
            </div>
          </div>
          <div className="bg-white border border-sand-200 rounded-8 p-5 flex gap-3 items-start">
            <Bell className="w-5 h-5 text-success-text flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-[13.5px] font-semibold text-ink-900">Notifié à chaque étape</div>
              <div className="text-[12.5px] text-graphite-600 mt-0.5 leading-[1.5]">Confirmation, préparation et livraison suivies par email.</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-2">
          <Link to="/catalogue" className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-6 text-[13.5px] font-semibold transition-colors">
            Parcourir le catalogue
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LivraisonPage;
