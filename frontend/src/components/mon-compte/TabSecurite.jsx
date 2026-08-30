/**
 * TabSecurite — mot de passe + données personnelles (RGPD) + suppression de compte
 * Pas d'écran dédié dans la maquette (seul "Mes informations" y est détaillé) : stylé par
 * cohérence avec le reste du design system.
 */

import { useState } from 'react';
import { Eye, EyeOff, Loader2, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import api from '../../services/api';

const inputClass = (hasError) =>
  `w-full border rounded-6 h-11 pl-3.5 pr-11 text-[14px] text-ink-900 focus:outline-none transition-colors ${
    hasError ? 'border-danger-border bg-danger-bg' : 'border-sand-250 focus:border-ink-900'
  }`;

const TabSecurite = ({ user, changePassword, onOpenDeleteModal }) => {
  const [form, setForm] = useState({ ancienMotDePasse: '', nouveauMotDePasse: '', confirmationMotDePasse: '' });
  const [showPasswords, setShowPasswords] = useState({ ancien: false, nouveau: false, confirmation: false });
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const passwordsMatch = form.confirmationMotDePasse === '' || form.nouveauMotDePasse === form.confirmationMotDePasse;
  const toggleShow = (field) => setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.nouveauMotDePasse !== form.confirmationMotDePasse) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (form.nouveauMotDePasse.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    try {
      setSaving(true);
      await changePassword(form.ancienMotDePasse, form.nouveauMotDePasse, form.confirmationMotDePasse);
      toast.success('Mot de passe modifié avec succès !');
      setForm({ ancienMotDePasse: '', nouveauMotDePasse: '', confirmationMotDePasse: '' });
    } catch (error) {
      toast.error(error.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadData = async () => {
    try {
      setDownloading(true);
      toast.loading('Préparation de vos données…', { id: 'download' });

      const [profileRes, ordersRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/orders').catch(() => ({ data: { data: [] } }))
      ]);

      const storageKey = `addresses_${user.id}`;
      const savedAddresses = sessionStorage.getItem(storageKey) || localStorage.getItem(storageKey);
      const adresses = savedAddresses ? JSON.parse(savedAddresses) : [];

      const userData = {
        exportDate: new Date().toISOString(),
        profile: {
          id: profileRes.data.data.id,
          email: profileRes.data.data.email,
          nom: profileRes.data.data.nom,
          prenom: profileRes.data.data.prenom,
          telephone: profileRes.data.data.telephone,
          typeClient: profileRes.data.data.typeClient,
          raisonSociale: profileRes.data.data.raisonSociale,
          siret: profileRes.data.data.siret,
          numeroTva: profileRes.data.data.numeroTva,
          dateCreation: profileRes.data.data.dateCreation,
          accepteNewsletter: profileRes.data.data.accepteNewsletter,
          notificationsCommandes: profileRes.data.data.notificationsCommandes
        },
        adresses,
        orders: ordersRes.data.data || []
      };

      const dataStr = JSON.stringify(userData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mes-donnees-jana-distribution-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Vos données ont été téléchargées !', { id: 'download' });
    } catch (error) {
      toast.error('Erreur lors du téléchargement des données', { id: 'download' });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div id="securite" className="flex flex-col gap-3.5">
      <form onSubmit={handleSubmit} className="bg-white border border-sand-200 rounded-8 p-5">
        <div className="font-display text-[16px] font-bold text-ink-900 mb-4">Changer le mot de passe</div>

        <div className="flex flex-col gap-3.5 max-w-md">
          <div className="flex flex-col gap-1.5">
            <span className="text-[12.5px] text-graphite-600">Mot de passe actuel</span>
            <div className="relative">
              <input type={showPasswords.ancien ? 'text' : 'password'} required value={form.ancienMotDePasse} onChange={(e) => setForm({ ...form, ancienMotDePasse: e.target.value })} className={inputClass(false)} />
              <button type="button" onClick={() => toggleShow('ancien')} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-graphite-300 hover:text-graphite-600">
                {showPasswords.ancien ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[12.5px] text-graphite-600">Nouveau mot de passe</span>
            <div className="relative">
              <input type={showPasswords.nouveau ? 'text' : 'password'} required minLength={8} value={form.nouveauMotDePasse} onChange={(e) => setForm({ ...form, nouveauMotDePasse: e.target.value })} className={inputClass(false)} />
              <button type="button" onClick={() => toggleShow('nouveau')} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-graphite-300 hover:text-graphite-600">
                {showPasswords.nouveau ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <PasswordStrengthIndicator password={form.nouveauMotDePasse} />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[12.5px] text-graphite-600">Confirmer le nouveau mot de passe</span>
            <div className="relative">
              <input type={showPasswords.confirmation ? 'text' : 'password'} required value={form.confirmationMotDePasse} onChange={(e) => setForm({ ...form, confirmationMotDePasse: e.target.value })} className={inputClass(!passwordsMatch)} />
              <button type="button" onClick={() => toggleShow('confirmation')} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-graphite-300 hover:text-graphite-600">
                {showPasswords.confirmation ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {!passwordsMatch && <p className="text-[12px] text-danger-text">Les mots de passe ne correspondent pas</p>}
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button type="submit" disabled={saving || !passwordsMatch} className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white text-[13.5px] font-semibold px-5 py-2.5 rounded-6 flex items-center gap-2 transition-colors">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Modification…' : 'Changer le mot de passe'}
          </button>
        </div>
      </form>

      <div className="bg-white border border-sand-200 rounded-8 p-5">
        <div className="font-display text-[16px] font-bold text-ink-900 mb-1">Vos données personnelles</div>
        <p className="text-[13px] text-graphite-500 mb-4">Conformément au RGPD, vous pouvez accéder à vos données ou supprimer votre compte.</p>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button type="button" onClick={handleDownloadData} disabled={downloading} className="flex items-center justify-center gap-2 border border-sand-250 text-ink-900 text-[13.5px] font-semibold px-4 py-2.5 rounded-6 hover:border-sand-300 disabled:opacity-60 transition-colors">
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {downloading ? 'Préparation…' : 'Télécharger mes données'}
          </button>
          <button type="button" onClick={onOpenDeleteModal} className="border border-danger-border text-danger-text text-[13.5px] font-semibold px-4 py-2.5 rounded-6 hover:bg-danger-bg transition-colors">
            Supprimer mon compte
          </button>
        </div>
      </div>
    </div>
  );
};

export default TabSecurite;
