/**
 * TabProfil — carte "Informations personnelles" de Mon compte
 * @see design_handoff_jana_refonte/README.md ("10 — Mon compte")
 */

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const inputClass = 'border border-sand-250 rounded-6 h-11 px-3.5 text-[14px] text-ink-900 focus:outline-none focus:border-ink-900 transition-colors';

const TabProfil = ({ user, updateProfile }) => {
  const [form, setForm] = useState({ prenom: '', nom: '', telephone: '', raisonSociale: '', siret: '', numeroTva: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        prenom: user.prenom || '',
        nom: user.nom || '',
        telephone: user.telephone || '',
        raisonSociale: user.raisonSociale || '',
        siret: user.siret || '',
        numeroTva: user.numeroTva || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateProfile(form);
      toast.success('Profil mis à jour avec succès !');
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} id="informations" className="bg-white border border-sand-200 rounded-8 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="font-display text-[16px] font-bold text-ink-900">Informations personnelles</div>
        <button type="submit" disabled={saving} className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white text-[13px] font-semibold px-4 py-2.5 rounded-6 flex items-center gap-1.5 transition-colors">
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="flex flex-col gap-1.5">
          <span className="text-[12.5px] text-graphite-600">Prénom</span>
          <input type="text" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[12.5px] text-graphite-600">Nom</span>
          <input type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className={inputClass} />
        </div>
        <div className="sm:col-span-2 flex flex-col gap-1.5">
          <span className="text-[12.5px] text-graphite-600">Email (non modifiable)</span>
          <input type="email" value={user?.email || ''} disabled className="border border-sand-300 bg-sand-100 rounded-6 h-11 px-3.5 text-[14px] text-graphite-300 cursor-not-allowed" />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[12.5px] text-graphite-600">Téléphone</span>
          <input type="tel" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} placeholder="06 12 34 56 78" className={inputClass} />
        </div>
      </div>

      {user?.typeClient === 'PROFESSIONNEL' && (
        <div className="mt-3.5 pt-3.5 border-t border-sand-200 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <span className="text-[12.5px] text-graphite-600">Raison sociale</span>
            <input type="text" value={form.raisonSociale} onChange={(e) => setForm({ ...form, raisonSociale: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[12.5px] text-graphite-600">SIRET</span>
            <input type="text" value={form.siret} onChange={(e) => setForm({ ...form, siret: e.target.value })} maxLength={14} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[12.5px] text-graphite-600">N° TVA</span>
            <input type="text" value={form.numeroTva} onChange={(e) => setForm({ ...form, numeroTva: e.target.value })} className={inputClass} />
          </div>
        </div>
      )}
    </form>
  );
};

export default TabProfil;
