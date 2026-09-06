/**
 * TabAdresses — carte "Adresses de livraison" de Mon compte
 * @see design_handoff_jana_refonte/README.md ("10 — Mon compte")
 *
 * Pas d'API adresses côté backend (table réelle mais sans CRUD exposé) : la persistance
 * reste 100% localStorage, comme dans le checkout. On le signale explicitement à l'écran
 * plutôt que de laisser croire à une synchronisation serveur.
 *
 * localStorage (pas sessionStorage) : le texte "enregistrées sur cet appareil" promettait
 * une persistance par appareil, mais sessionStorage est isole par ONGLET - une adresse
 * enregistree ici pouvait ne jamais apparaitre au checkout ouvert dans un autre onglet.
 */

import { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Checkbox from '../Checkbox';
import { formatPhoneInput, isValidFrenchPhone } from '../../utils/phoneUtils';

const inputClass = 'border border-sand-250 rounded-6 h-11 px-3.5 text-[14px] text-ink-900 focus:outline-none focus:border-ink-900 transition-colors';
const EMPTY_FORM = { id: null, nom: '', adresse: '', complement: '', codePostal: '', ville: '', telephone: '', estDefaut: false };

const TabAdresses = ({ userId }) => {
  const [adresses, setAdresses] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!userId) return;
    const storageKey = `addresses_${userId}`;
    // localStorage prioritaire ; ancien sessionStorage lu en repli + migre.
    const saved = localStorage.getItem(storageKey) || sessionStorage.getItem(storageKey);
    if (saved) {
      setAdresses(JSON.parse(saved));
      localStorage.setItem(storageKey, saved);
      sessionStorage.removeItem(storageKey);
    }
  }, [userId]);

  const saveToStorage = (newAdresses) => {
    const storageKey = `addresses_${userId}`;
    localStorage.setItem(storageKey, JSON.stringify(newAdresses));
    sessionStorage.removeItem(storageKey);
    setAdresses(newAdresses);
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setShowForm(false);
    setEditingIndex(null);
  };

  const handleAdd = () => { resetForm(); setShowForm(true); };
  const handleEdit = (index) => { setForm({ ...adresses[index] }); setEditingIndex(index); setShowForm(true); };

  const handleSave = () => {
    if (!form.nom || !form.adresse || !form.codePostal || !form.ville) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (form.telephone && !isValidFrenchPhone(form.telephone)) {
      toast.error('Numéro de téléphone invalide');
      return;
    }
    setSaving(true);
    let newAdresses;
    const addressData = { ...form, id: form.id || `addr_${Date.now()}` };

    if (editingIndex !== null) {
      newAdresses = adresses.map((addr, idx) => (idx === editingIndex ? addressData : addr));
    } else {
      if (adresses.length >= 3) {
        toast.error('Vous ne pouvez pas avoir plus de 3 adresses');
        setSaving(false);
        return;
      }
      newAdresses = [...adresses, addressData];
    }

    if (addressData.estDefaut) {
      const targetIndex = editingIndex ?? newAdresses.length - 1;
      newAdresses = newAdresses.map((addr, idx) => ({ ...addr, estDefaut: idx === targetIndex }));
    }

    saveToStorage(newAdresses);
    resetForm();
    setSaving(false);
    toast.success(editingIndex !== null ? 'Adresse modifiée !' : 'Adresse ajoutée !');
  };

  const handleDelete = (index) => {
    saveToStorage(adresses.filter((_, idx) => idx !== index));
    toast.success('Adresse supprimée');
  };

  const handleSetDefault = (index) => {
    saveToStorage(adresses.map((addr, idx) => ({ ...addr, estDefaut: idx === index })));
    toast.success('Adresse par défaut mise à jour');
  };

  return (
    <div id="adresses" className="bg-white border border-sand-200 rounded-8 p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="font-display text-[16px] font-bold text-ink-900">Adresses de livraison</div>
        {adresses.length < 3 && !showForm && (
          <button type="button" onClick={handleAdd} className="text-[13px] font-semibold text-green-700 hover:text-green-800">
            + Ajouter une adresse
          </button>
        )}
      </div>
      <p className="text-[12px] text-graphite-400 mb-4">Jusqu'à 3 adresses, enregistrées sur cet appareil uniquement.</p>

      {showForm && (
        <div className="bg-sand-50 rounded-8 p-4 mb-4 flex flex-col gap-3.5">
          <div className="font-semibold text-[13.5px] text-ink-900">{editingIndex !== null ? 'Modifier l\'adresse' : 'Nouvelle adresse'}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <span className="text-[12.5px] text-graphite-600">Nom de l'adresse</span>
              <input type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Domicile, Bureau…" className={`${inputClass} bg-white`} />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[12.5px] text-graphite-600">Téléphone</span>
              <input type="tel" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: formatPhoneInput(e.target.value) })} placeholder="06 12 34 56 78" className={`${inputClass} bg-white`} />
            </div>
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <span className="text-[12.5px] text-graphite-600">Adresse</span>
              <input type="text" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} placeholder="15 rue de la Paix" className={`${inputClass} bg-white`} />
            </div>
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <span className="text-[12.5px] text-graphite-600">Complément <span className="text-graphite-300">(optionnel)</span></span>
              <input type="text" value={form.complement} onChange={(e) => setForm({ ...form, complement: e.target.value })} className={`${inputClass} bg-white`} />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[12.5px] text-graphite-600">Code postal</span>
              <input type="text" value={form.codePostal} onChange={(e) => setForm({ ...form, codePostal: e.target.value.replace(/\D/g, '').slice(0, 5) })} maxLength={5} className={`${inputClass} bg-white`} />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[12.5px] text-graphite-600">Ville</span>
              <input type="text" value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} className={`${inputClass} bg-white`} />
            </div>
          </div>
          <button type="button" onClick={() => setForm({ ...form, estDefaut: !form.estDefaut })} className="flex items-center gap-2.5 text-left w-fit">
            <Checkbox checked={form.estDefaut} />
            <span className="text-[13px] text-graphite-700">Définir comme adresse par défaut</span>
          </button>
          <div className="flex gap-2.5">
            <button type="button" onClick={resetForm} className="flex-1 border border-sand-250 text-graphite-700 text-[13px] font-semibold py-2.5 rounded-6 hover:border-sand-300 transition-colors">
              Annuler
            </button>
            <button type="button" onClick={handleSave} disabled={saving} className="flex-1 bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white text-[13px] font-semibold py-2.5 rounded-6 flex items-center justify-center gap-1.5 transition-colors">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Enregistrer
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {adresses.map((addr, idx) => (
          <div key={addr.id || idx} className={`rounded-6 p-3.5 ${addr.estDefaut ? 'border-[1.5px] border-green-700 bg-selection-bg' : 'border border-sand-200'}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13.5px] font-bold text-ink-900">{addr.nom}</span>
              {addr.estDefaut && <span className="text-[11px] text-success-text bg-success-bg px-2 py-0.5 rounded-3 flex-shrink-0">Par défaut</span>}
            </div>
            <div className="text-[13px] text-graphite-700 leading-[1.55] mt-1.5">
              {addr.adresse}{addr.complement && `, ${addr.complement}`}<br />
              {addr.codePostal} {addr.ville}
            </div>
            <div className="flex gap-3 mt-2.5 text-[12px]">
              {!addr.estDefaut && (
                <button type="button" onClick={() => handleSetDefault(idx)} className="text-graphite-500 hover:text-green-700 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Par défaut
                </button>
              )}
              <button type="button" onClick={() => handleEdit(idx)} className="text-graphite-500 hover:text-ink-900">Modifier</button>
              <button type="button" onClick={() => handleDelete(idx)} className="text-graphite-500 hover:text-danger-text">Supprimer</button>
            </div>
          </div>
        ))}
        {adresses.length < 3 && (
          <button
            type="button"
            onClick={handleAdd}
            className="rounded-6 border border-dashed border-[#D6D2C6] flex items-center justify-center text-[13.5px] text-graphite-300 hover:text-graphite-500 hover:border-sand-300 transition-colors min-h-[88px]"
          >
            + Nouvelle adresse
          </button>
        )}
      </div>
    </div>
  );
};

export default TabAdresses;
