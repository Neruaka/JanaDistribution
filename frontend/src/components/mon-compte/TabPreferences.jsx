/**
 * TabPreferences — carte "Préférences" de Mon compte
 * @see design_handoff_jana_refonte/README.md ("10 — Mon compte")
 */

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Toggle from '../Toggle';

const TabPreferences = ({ user, updateProfile }) => {
  const [preferences, setPreferences] = useState({ accepteNewsletter: false, notificationsCommandes: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setPreferences({
        accepteNewsletter: user.accepteNewsletter || false,
        notificationsCommandes: user.notificationsCommandes !== false
      });
    }
  }, [user]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateProfile(preferences);
      toast.success('Préférences mises à jour !');
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la mise à jour des préférences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="preferences" className="bg-white border border-sand-200 rounded-8 p-5">
      <div className="flex items-center justify-between mb-3.5">
        <div className="font-display text-[16px] font-bold text-ink-900">Préférences</div>
        <button type="button" onClick={handleSave} disabled={saving} className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white text-[13px] font-semibold px-4 py-2.5 rounded-6 flex items-center gap-1.5 transition-colors">
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>

      <Toggle
        checked={preferences.accepteNewsletter}
        onChange={(v) => setPreferences({ ...preferences, accepteNewsletter: v })}
        titre="Offres et nouveautés par email"
        desc="Promotions et actualités du catalogue."
      />
      <Toggle
        checked={preferences.notificationsCommandes}
        onChange={(v) => setPreferences({ ...preferences, notificationsCommandes: v })}
        titre="Suivi de commande par email"
        desc="Confirmation, préparation, expédition, livraison."
      />
    </div>
  );
};

export default TabPreferences;
