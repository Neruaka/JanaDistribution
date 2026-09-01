/**
 * Page Admin Parametres
 * @description Ecran A8 — Parametres
 * @see design_handoff_jana_refonte/README.md (A8 — Parametres)
 *
 * La maquette prevoit 7 onglets (dont "Utilisateurs & roles" et une table de
 * creneaux avec interrupteur par jour) ; seuls 5 ont un support reel cote
 * backend (table `configuration`, endpoint /settings/admin). Aucune gestion
 * de comptes admin ni de configuration des creneaux de livraison n'existe
 * (les creneaux affiches au checkout sont codes en dur cote client) : ces
 * deux elements sont omis plutot que fabriques, "TVA & facturation" reste
 * dans l'onglet Commandes (seul le taux par defaut est reellement configurable).
 * "Sauvegarder la base" (deja fictif avant la refonte, juste un setTimeout)
 * est desactive avec infobulle au lieu de continuer a mentir sur un succes.
 */

import { useState, useEffect } from 'react';
import {
  Store, Mail, Truck, Package, Shield, Database, Save, Loader2,
  Info, AlertCircle, RefreshCw
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useSettings } from '../../contexts/SettingsContext';
import Toggle from '../../components/Toggle';

const SECTIONS = [
  { id: 'general', label: 'Informations générales', icon: Store },
  { id: 'delivery', label: 'Livraison', icon: Truck },
  { id: 'orders', label: 'Commandes & devis', icon: Package },
  { id: 'emails', label: 'Emails', icon: Mail },
  { id: 'security', label: 'Sécurité', icon: Shield }
];

const inputClass = 'w-full border border-sand-250 rounded-6 h-11 px-3.5 text-[14px] text-ink-900 focus:outline-none focus:border-ink-900';
const labelClass = 'text-[12.5px] text-graphite-600 mb-1.5 block';

const Field = ({ label, icon: Icon, children, hint }) => (
  <div>
    <label className={labelClass}>{Icon && <Icon className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}{label}</label>
    {children}
    {hint && <p className="text-[11.5px] text-graphite-400 mt-1">{hint}</p>}
  </div>
);

const Callout = ({ children }) => (
  <div className="bg-selection-bg border border-success-border rounded-6 p-3.5 flex gap-2.5">
    <Info className="w-4 h-4 text-success-text flex-shrink-0 mt-0.5" />
    <div className="text-[12.5px] text-graphite-700">{children}</div>
  </div>
);

const AdminSettingsPage = () => {
  const { refreshSettings } = useSettings();

  const [activeSection, setActiveSection] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [generalSettings, setGeneralSettings] = useState({
    nomSite: '', description: '', email: '', telephone: '', adresse: '', codePostal: '', ville: '', siret: '', tvaIntracommunautaire: ''
  });
  const [deliverySettings, setDeliverySettings] = useState({
    fraisLivraisonStandard: 15, seuilFrancoPort: 150, delaiLivraisonMin: 2, delaiLivraisonMax: 5,
    zonesLivraison: 'France métropolitaine', modeCalcul: 'FIXE', prixParKm: 0.8, fraisBase: 5, distanceMaxKm: 200
  });
  const [orderSettings, setOrderSettings] = useState({
    montantMinCommande: 20, tauxTvaDefaut: 5.5, stockAlerteSeuil: 10, nombreProduitsParPage: 12,
    autoriserCommandeSansStock: false, envoyerEmailConfirmation: true, envoyerEmailExpedition: true
  });
  const [emailSettings, setEmailSettings] = useState({ expediteur: '', nomExpediteur: '', copieAdmin: true, emailAdmin: '', signatureEmail: '' });

  useEffect(() => {
    api.get('/settings/admin').then((res) => {
      if (res.data.success) {
        const d = res.data.data;
        if (d.general) setGeneralSettings(d.general);
        if (d.delivery) setDeliverySettings(d.delivery);
        if (d.orders) setOrderSettings(d.orders);
        if (d.emails) setEmailSettings(d.emails);
      }
    }).catch((err) => {
      console.error('Erreur chargement settings:', err);
      toast.error('Erreur lors du chargement des paramètres');
    }).finally(() => setLoading(false));
  }, []);

  const change = (setter) => (field, value) => { setter((prev) => ({ ...prev, [field]: value })); setHasChanges(true); };
  const handleGeneralChange = change(setGeneralSettings);
  const handleDeliveryChange = change(setDeliverySettings);
  const handleOrderChange = change(setOrderSettings);
  const handleEmailChange = change(setEmailSettings);

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await api.put('/settings/admin', { general: generalSettings, delivery: deliverySettings, orders: orderSettings, emails: emailSettings });
      if (response.data.success) {
        toast.success('Paramètres enregistrés');
        setHasChanges(false);
        refreshSettings();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleClearCache = () => {
    localStorage.removeItem('app_settings');
    localStorage.removeItem('app_settings_timestamp');
    toast.success('Cache local des paramètres vidé');
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 text-green-700 animate-spin" /></div>;
  }

  return (
    <div className="p-[26px] flex flex-col gap-3.5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-[26px] font-extrabold tracking-tighter text-ink-900">Paramètres</h2>
          <p className="text-[13.5px] text-graphite-500 mt-[3px]">Configuration générale du site</p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && <span className="text-[12.5px] text-warning-text flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Modifications non enregistrées</span>}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="h-[38px] flex items-center gap-1.5 bg-green-700 hover:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-6 px-4 text-[13.5px] font-semibold transition-colors"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-3.5 items-start">
        <nav className="bg-white border border-sand-200 rounded-8 p-2 flex flex-col gap-0.5">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-6 text-left text-[13.5px] transition-colors ${
                activeSection === s.id ? 'bg-ink-900 text-white font-semibold' : 'text-graphite-700 hover:bg-sand-50'
              }`}
            >
              <s.icon className="w-4 h-4 flex-shrink-0" />
              {s.label}
            </button>
          ))}
        </nav>

        <div className="bg-white border border-sand-200 rounded-8 p-[22px] flex flex-col gap-4">
          {activeSection === 'general' && (
            <>
              <div>
                <div className="font-display text-[16px] font-bold text-ink-900">Informations générales</div>
                <p className="text-[12.5px] text-graphite-500 mt-0.5">Identité et coordonnées de votre entreprise</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2"><Field label="Nom du site"><input type="text" value={generalSettings.nomSite} onChange={(e) => handleGeneralChange('nomSite', e.target.value)} className={inputClass} /></Field></div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Description</label>
                  <textarea value={generalSettings.description} onChange={(e) => handleGeneralChange('description', e.target.value)} rows={2} className="w-full border border-sand-250 rounded-6 px-3.5 py-2.5 text-[13.5px] text-ink-900 focus:outline-none focus:border-ink-900 resize-none" />
                </div>
                <Field label="Email de contact"><input type="email" value={generalSettings.email} onChange={(e) => handleGeneralChange('email', e.target.value)} className={inputClass} /></Field>
                <Field label="Téléphone"><input type="tel" value={generalSettings.telephone} onChange={(e) => handleGeneralChange('telephone', e.target.value)} className={`${inputClass} font-mono`} /></Field>
                <div className="sm:col-span-2"><Field label="Adresse"><input type="text" value={generalSettings.adresse} onChange={(e) => handleGeneralChange('adresse', e.target.value)} className={inputClass} /></Field></div>
                <Field label="Code postal"><input type="text" value={generalSettings.codePostal} onChange={(e) => handleGeneralChange('codePostal', e.target.value)} className={`${inputClass} font-mono`} /></Field>
                <Field label="Ville"><input type="text" value={generalSettings.ville} onChange={(e) => handleGeneralChange('ville', e.target.value)} className={inputClass} /></Field>
                <Field label="SIRET"><input type="text" value={generalSettings.siret} onChange={(e) => handleGeneralChange('siret', e.target.value)} className={`${inputClass} font-mono`} /></Field>
                <Field label="N° TVA intracommunautaire"><input type="text" value={generalSettings.tvaIntracommunautaire} onChange={(e) => handleGeneralChange('tvaIntracommunautaire', e.target.value)} className={`${inputClass} font-mono`} /></Field>
              </div>
              <Callout>Ces informations apparaissent dans le pied de page du site, les emails transactionnels, les factures et les mentions légales.</Callout>
            </>
          )}

          {activeSection === 'delivery' && (
            <>
              <div>
                <div className="font-display text-[16px] font-bold text-ink-900">Livraison</div>
                <p className="text-[12.5px] text-graphite-500 mt-0.5">Frais de port et délais</p>
              </div>

              <div>
                <label className={labelClass}>Mode de calcul des frais</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[{ v: 'FIXE', t: 'Tarif fixe', d: 'Montant identique pour toutes les livraisons.' }, { v: 'DISTANCE', t: 'Selon la distance', d: 'frais = base + (km × prix/km), à vol d\'oiseau.' }].map((opt) => (
                    <button key={opt.v} type="button" onClick={() => handleDeliveryChange('modeCalcul', opt.v)} className={`p-3.5 rounded-6 border text-left transition-colors ${deliverySettings.modeCalcul === opt.v ? 'border-green-700 bg-success-bg' : 'border-sand-250 hover:border-sand-300'}`}>
                      <div className="text-[13.5px] font-semibold text-ink-900">{opt.t}</div>
                      <div className="text-[12px] text-graphite-500 mt-0.5">{opt.d}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Field label={deliverySettings.modeCalcul === 'DISTANCE' ? 'Frais standard (secours)' : 'Frais de livraison standard'} hint={deliverySettings.modeCalcul === 'DISTANCE' ? 'Utilisé si le géocodage échoue' : undefined}>
                  <input type="number" step="0.01" min="0" value={deliverySettings.fraisLivraisonStandard} onChange={(e) => handleDeliveryChange('fraisLivraisonStandard', parseFloat(e.target.value) || 0)} className={`${inputClass} font-mono`} />
                </Field>
                <Field label="Seuil franco de port" hint="Livraison gratuite au-dessus de ce montant">
                  <input type="number" step="0.01" min="0" value={deliverySettings.seuilFrancoPort} onChange={(e) => handleDeliveryChange('seuilFrancoPort', parseFloat(e.target.value) || 0)} className={`${inputClass} font-mono`} />
                </Field>
                <Field label="Délai minimum (jours)"><input type="number" min="1" value={deliverySettings.delaiLivraisonMin} onChange={(e) => handleDeliveryChange('delaiLivraisonMin', parseInt(e.target.value) || 1)} className={`${inputClass} font-mono`} /></Field>
                <Field label="Délai maximum (jours)"><input type="number" min="1" value={deliverySettings.delaiLivraisonMax} onChange={(e) => handleDeliveryChange('delaiLivraisonMax', parseInt(e.target.value) || 1)} className={`${inputClass} font-mono`} /></Field>
                <div className="sm:col-span-2"><Field label="Zones de livraison"><input type="text" value={deliverySettings.zonesLivraison} onChange={(e) => handleDeliveryChange('zonesLivraison', e.target.value)} className={inputClass} /></Field></div>
              </div>

              {deliverySettings.modeCalcul === 'DISTANCE' && (
                <div className="pt-3.5 border-t border-sand-150 flex flex-col gap-3.5">
                  <p className="text-[12px] text-graphite-500">Distance calculée à vol d'oiseau entre l'adresse de l'entreprise (Informations générales) et l'adresse de livraison du client.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <Field label="Frais de base" hint="Montant fixe ajouté"><input type="number" step="0.01" min="0" value={deliverySettings.fraisBase} onChange={(e) => handleDeliveryChange('fraisBase', parseFloat(e.target.value) || 0)} className={`${inputClass} font-mono`} /></Field>
                    <Field label="Tarif au km" hint="Coût par kilomètre parcouru"><input type="number" step="0.01" min="0" value={deliverySettings.prixParKm} onChange={(e) => handleDeliveryChange('prixParKm', parseFloat(e.target.value) || 0)} className={`${inputClass} font-mono`} /></Field>
                    <Field label="Distance max. (km)" hint="0 = illimité"><input type="number" min="0" value={deliverySettings.distanceMaxKm} onChange={(e) => handleDeliveryChange('distanceMaxKm', parseFloat(e.target.value) || 0)} className={`${inputClass} font-mono`} /></Field>
                  </div>
                  <div className="bg-sand-50 rounded-6 p-3 text-[12.5px] text-graphite-600">
                    Formule : <span className="font-mono text-green-700">{deliverySettings.fraisBase} € + (distance × {deliverySettings.prixParKm} €/km)</span>
                    <p className="text-[11.5px] text-graphite-400 mt-1">Ex. 30 km → {(Number(deliverySettings.fraisBase) + 30 * Number(deliverySettings.prixParKm)).toFixed(2)} € — sauf franco de port dépassé ({deliverySettings.seuilFrancoPort} €).</p>
                  </div>
                </div>
              )}

              <Callout>Livraison gratuite pour toute commande supérieure à {deliverySettings.seuilFrancoPort} €.</Callout>
            </>
          )}

          {activeSection === 'orders' && (
            <>
              <div>
                <div className="font-display text-[16px] font-bold text-ink-900">Commandes & devis</div>
                <p className="text-[12.5px] text-graphite-500 mt-0.5">Montant minimum, TVA et notifications</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Field label="Montant minimum de commande"><input type="number" step="0.01" min="0" value={orderSettings.montantMinCommande} onChange={(e) => handleOrderChange('montantMinCommande', parseFloat(e.target.value) || 0)} className={`${inputClass} font-mono`} /></Field>
                <Field label="Taux de TVA par défaut (%)"><input type="number" step="0.1" min="0" max="100" value={orderSettings.tauxTvaDefaut} onChange={(e) => handleOrderChange('tauxTvaDefaut', parseFloat(e.target.value) || 0)} className={`${inputClass} font-mono`} /></Field>
                <Field label="Seuil d'alerte stock" hint="Alerte si stock inférieur à ce seuil"><input type="number" min="0" value={orderSettings.stockAlerteSeuil} onChange={(e) => handleOrderChange('stockAlerteSeuil', parseInt(e.target.value) || 0)} className={`${inputClass} font-mono`} /></Field>
                <Field label="Produits par page">
                  <select value={orderSettings.nombreProduitsParPage} onChange={(e) => handleOrderChange('nombreProduitsParPage', parseInt(e.target.value))} className={`${inputClass} bg-white`}>
                    <option value={12}>12</option><option value={24}>24</option><option value={48}>48</option>
                  </select>
                </Field>
              </div>
              <div className="pt-3.5 border-t border-sand-150">
                <Toggle checked={orderSettings.autoriserCommandeSansStock} onChange={(v) => handleOrderChange('autoriserCommandeSansStock', v)} titre="Autoriser les commandes sans stock" desc="Les clients peuvent commander même si le stock est à 0" />
                <Toggle checked={orderSettings.envoyerEmailConfirmation} onChange={(v) => handleOrderChange('envoyerEmailConfirmation', v)} titre="Email de confirmation" desc="Envoyé à chaque commande" />
                <Toggle checked={orderSettings.envoyerEmailExpedition} onChange={(v) => handleOrderChange('envoyerEmailExpedition', v)} titre="Email d'expédition" desc="Notifie le client quand sa commande est expédiée" />
              </div>
            </>
          )}

          {activeSection === 'emails' && (
            <>
              <div>
                <div className="font-display text-[16px] font-bold text-ink-900">Emails transactionnels</div>
                <p className="text-[12.5px] text-graphite-500 mt-0.5">Paramètres d'envoi (Gmail SMTP)</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Field label="Email expéditeur"><input type="email" value={emailSettings.expediteur} onChange={(e) => handleEmailChange('expediteur', e.target.value)} className={inputClass} /></Field>
                <Field label="Nom affiché"><input type="text" value={emailSettings.nomExpediteur} onChange={(e) => handleEmailChange('nomExpediteur', e.target.value)} className={inputClass} /></Field>
                <Field label="Email admin (copies)"><input type="email" value={emailSettings.emailAdmin} onChange={(e) => handleEmailChange('emailAdmin', e.target.value)} className={inputClass} /></Field>
                <Field label="Signature"><input type="text" value={emailSettings.signatureEmail} onChange={(e) => handleEmailChange('signatureEmail', e.target.value)} className={inputClass} /></Field>
              </div>
              <div className="pt-3.5 border-t border-sand-150">
                <Toggle checked={emailSettings.copieAdmin} onChange={(v) => handleEmailChange('copieAdmin', v)} titre="Copie admin" desc="Recevoir une copie de tous les emails envoyés aux clients" />
              </div>
            </>
          )}

          {activeSection === 'security' && (
            <>
              <div>
                <div className="font-display text-[16px] font-bold text-ink-900">Sécurité</div>
                <p className="text-[12.5px] text-graphite-500 mt-0.5">Maintenance et connexion</p>
              </div>
              <div className="bg-success-bg border border-success-border rounded-6 p-3.5 flex gap-2.5">
                <Shield className="w-4 h-4 text-success-text flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-[13px] font-semibold text-success-text">Connexion sécurisée</div>
                  <div className="text-[12px] text-graphite-600 mt-0.5">Le site est servi en HTTPS et les données sont chiffrées en transit.</div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <button type="button" disabled title="Bientôt disponible" className="p-3.5 bg-sand-50 rounded-6 border border-sand-200 text-left opacity-50 cursor-not-allowed">
                  <Database className="w-5 h-5 text-graphite-400 mb-1.5" />
                  <div className="text-[13.5px] font-semibold text-ink-900">Sauvegarder la base</div>
                  <div className="text-[12px] text-graphite-500">Créer une sauvegarde manuelle</div>
                </button>
                <button type="button" onClick={handleClearCache} className="p-3.5 bg-sand-50 hover:bg-sand-100 rounded-6 border border-sand-200 text-left transition-colors">
                  <RefreshCw className="w-5 h-5 text-graphite-500 mb-1.5" />
                  <div className="text-[13.5px] font-semibold text-ink-900">Vider le cache local</div>
                  <div className="text-[12px] text-graphite-500">Réinitialise les paramètres mis en cache dans ce navigateur</div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
