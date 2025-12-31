/**
 * Composant TabSecurite
 * Changement de mot de passe
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, X, Loader2 } from 'lucide-react';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import toast from 'react-hot-toast';

const TabSecurite = ({ changePassword }) => {
  // États formulaire
  const [form, setForm] = useState({
    ancienMotDePasse: '',
    nouveauMotDePasse: '',
    confirmationMotDePasse: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    ancien: false,
    nouveau: false,
    confirmation: false
  });
  const [saving, setSaving] = useState(false);

  // Vérification correspondance
  const passwordsMatch = form.confirmationMotDePasse === '' || 
    form.nouveauMotDePasse === form.confirmationMotDePasse;

  // Soumettre le changement
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
      await changePassword(
        form.ancienMotDePasse,
        form.nouveauMotDePasse,
        form.confirmationMotDePasse
      );

      toast.success('Mot de passe modifié avec succès !');
      setForm({
        ancienMotDePasse: '',
        nouveauMotDePasse: '',
        confirmationMotDePasse: ''
      });
    } catch (error) {
      toast.error(error.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setSaving(false);
    }
  };

  // Toggle visibility
  const toggleShow = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-green-600" />
            Changer le mot de passe
          </h3>

          <div className="space-y-4">
            {/* Mot de passe actuel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe actuel
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPasswords.ancien ? 'text' : 'password'}
                  value={form.ancienMotDePasse}
                  onChange={(e) => setForm({ ...form, ancienMotDePasse: e.target.value })}
                  className="w-full pl-10 pr-12 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => toggleShow('ancien')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.ancien ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Nouveau mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPasswords.nouveau ? 'text' : 'password'}
                  value={form.nouveauMotDePasse}
                  onChange={(e) => setForm({ ...form, nouveauMotDePasse: e.target.value })}
                  className="w-full pl-10 pr-12 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => toggleShow('nouveau')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.nouveau ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <PasswordStrengthIndicator password={form.nouveauMotDePasse} />
            </div>

            {/* Confirmation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPasswords.confirmation ? 'text' : 'password'}
                  value={form.confirmationMotDePasse}
                  onChange={(e) => setForm({ ...form, confirmationMotDePasse: e.target.value })}
                  className={`w-full pl-10 pr-12 py-2.5 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    !passwordsMatch ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => toggleShow('confirmation')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirmation ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {!passwordsMatch && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <X className="w-3 h-3" /> Les mots de passe ne correspondent pas
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bouton submit */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving || !passwordsMatch}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {saving ? 'Modification...' : 'Changer le mot de passe'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default TabSecurite;
