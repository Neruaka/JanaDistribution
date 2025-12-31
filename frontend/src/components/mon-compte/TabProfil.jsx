/**
 * Composant TabProfil
 * Onglet informations personnelles du compte
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Building, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const TabProfil = ({ user, updateProfile }) => {
  // États formulaire
  const [form, setForm] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    raisonSociale: '',
    siret: '',
    numeroTva: ''
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Charger les données utilisateur
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

  // Sauvegarder le profil
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      await updateProfile(form);
      setSuccess(true);
      toast.success('Profil mis à jour avec succès !');
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations personnelles */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-green-600" />
            Informations personnelles
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input
                type="text"
                value={form.prenom}
                onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Email (non modifiable) */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">L'email ne peut pas être modifié</p>
          </div>

          {/* Téléphone */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={form.telephone}
                onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                placeholder="06 12 34 56 78"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Informations professionnelles */}
        {user?.typeClient === 'PROFESSIONNEL' && (
          <div className="pt-6 border-t border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-purple-600" />
              Informations professionnelles
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Raison sociale</label>
                <input
                  type="text"
                  value={form.raisonSociale}
                  onChange={(e) => setForm({ ...form, raisonSociale: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SIRET</label>
                  <input
                    type="text"
                    value={form.siret}
                    onChange={(e) => setForm({ ...form, siret: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">N° TVA</label>
                  <input
                    type="text"
                    value={form.numeroTva}
                    onChange={(e) => setForm({ ...form, numeroTva: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bouton submit */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Enregistrement...' : success ? 'Enregistré !' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default TabProfil;
