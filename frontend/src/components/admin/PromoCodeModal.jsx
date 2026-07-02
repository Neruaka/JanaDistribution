/**
 * Modal Code Promo (création + édition)
 * @description Formulaire de création/édition d'un code promo, cohérent avec
 * le pattern des modals admin existants (AdminCategoriesList).
 * @location frontend/src/components/admin/PromoCodeModal.jsx
 *
 * Props :
 * @param {'create'|'edit'} mode
 * @param {Object|null} promo - code promo à éditer (null en création)
 * @param {boolean} saving - état de sauvegarde en cours
 * @param {(data: Object) => void} onSubmit - callback de soumission (payload API snake_case)
 * @param {() => void} onClose - callback de fermeture
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

const CODE_PATTERN = /^[A-Z0-9_-]+$/i;

const toDateInputValue = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

const buildInitialForm = (promo) => ({
  code: promo?.code || '',
  description: promo?.description || '',
  type_rabais: promo?.type_rabais || 'POURCENTAGE',
  valeur_rabais: promo?.valeur_rabais != null ? String(promo.valeur_rabais) : '',
  montant_minimum: promo?.montant_minimum != null ? String(promo.montant_minimum) : '0',
  max_utilisations_global: promo?.max_utilisations_global != null ? String(promo.max_utilisations_global) : '',
  max_utilisations_par_client: promo?.max_utilisations_par_client != null ? String(promo.max_utilisations_par_client) : '1',
  date_debut: toDateInputValue(promo?.date_debut),
  date_fin: toDateInputValue(promo?.date_fin),
  actif: promo?.actif !== undefined ? promo.actif : true
});

const PromoCodeModal = ({ mode = 'create', promo = null, saving = false, onSubmit, onClose }) => {
  const [formData, setFormData] = useState(buildInitialForm(promo));

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    const code = formData.code.trim();

    if (mode === 'create') {
      if (!code) {
        toast.error('Le code promo est obligatoire');
        return false;
      }
      if (code.length < 3 || code.length > 50 || !CODE_PATTERN.test(code)) {
        toast.error('Le code ne peut contenir que des lettres, chiffres, "-" et "_" (3 à 50 caractères)');
        return false;
      }
    }

    const valeur = Number(formData.valeur_rabais);
    if (!formData.valeur_rabais || Number.isNaN(valeur) || valeur <= 0) {
      toast.error('La valeur du rabais doit être supérieure à 0');
      return false;
    }
    if (formData.type_rabais === 'POURCENTAGE' && valeur > 100) {
      toast.error('Un rabais en pourcentage ne peut pas dépasser 100');
      return false;
    }

    if (formData.montant_minimum !== '' && Number(formData.montant_minimum) < 0) {
      toast.error('Le montant minimum ne peut pas être négatif');
      return false;
    }

    if (formData.max_utilisations_global !== '' && Number(formData.max_utilisations_global) < 1) {
      toast.error('Le nombre maximum d\'utilisations global doit être au moins 1');
      return false;
    }

    if (formData.max_utilisations_par_client !== '' && Number(formData.max_utilisations_par_client) < 1) {
      toast.error('Le nombre maximum d\'utilisations par client doit être au moins 1');
      return false;
    }

    if (formData.date_debut && formData.date_fin) {
      if (new Date(formData.date_fin) < new Date(formData.date_debut)) {
        toast.error('La date de fin doit être postérieure à la date de début');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      description: formData.description.trim() || undefined,
      type_rabais: formData.type_rabais,
      valeur_rabais: Number(formData.valeur_rabais),
      montant_minimum: formData.montant_minimum !== '' ? Number(formData.montant_minimum) : 0,
      max_utilisations_global: formData.max_utilisations_global !== '' ? Number(formData.max_utilisations_global) : null,
      max_utilisations_par_client: formData.max_utilisations_par_client !== '' ? Number(formData.max_utilisations_par_client) : 1,
      date_debut: formData.date_debut || null,
      date_fin: formData.date_fin || null,
      actif: formData.actif
    };

    if (mode === 'create') {
      payload.code = formData.code.trim().toUpperCase();
    }

    onSubmit(payload);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Tag className="w-5 h-5 text-green-600" />
            {mode === 'create' ? 'Nouveau code promo' : `Modifier ${promo?.code || ''}`}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
              disabled={mode === 'edit'}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent uppercase disabled:bg-gray-100 disabled:text-gray-500"
              placeholder="Ex: NOEL2026"
              maxLength={50}
              required={mode === 'create'}
            />
            {mode === 'edit' && (
              <p className="text-xs text-gray-400 mt-1">Le code ne peut pas être modifié après création.</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={2}
              maxLength={1000}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              placeholder="Ex: Offre de fin d'année -10%"
            />
          </div>

          {/* Type + valeur */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de rabais *
              </label>
              <select
                value={formData.type_rabais}
                onChange={(e) => handleChange('type_rabais', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="POURCENTAGE">Pourcentage (%)</option>
                <option value="MONTANT_FIXE">Montant fixe (€)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valeur *
              </label>
              <input
                type="number"
                min="0"
                max={formData.type_rabais === 'POURCENTAGE' ? 100 : undefined}
                step="0.01"
                value={formData.valeur_rabais}
                onChange={(e) => handleChange('valeur_rabais', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder={formData.type_rabais === 'POURCENTAGE' ? 'Ex: 10' : 'Ex: 5.00'}
                required
              />
            </div>
          </div>

          {/* Montant minimum */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant minimum de commande (€)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.montant_minimum}
              onChange={(e) => handleChange('montant_minimum', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          {/* Max utilisations */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max utilisations global
              </label>
              <input
                type="number"
                min="1"
                value={formData.max_utilisations_global}
                onChange={(e) => handleChange('max_utilisations_global', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Illimité"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max par client
              </label>
              <input
                type="number"
                min="1"
                value={formData.max_utilisations_par_client}
                onChange={(e) => handleChange('max_utilisations_par_client', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="1"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de début
              </label>
              <input
                type="date"
                value={formData.date_debut}
                onChange={(e) => handleChange('date_debut', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de fin
              </label>
              <input
                type="date"
                value={formData.date_fin}
                onChange={(e) => handleChange('date_fin', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Actif */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Code actif</p>
              <p className="text-xs text-gray-500">Utilisable immédiatement par les clients éligibles</p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('actif', !formData.actif)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.actif ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.actif ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {mode === 'create' ? 'Créer' : 'Enregistrer'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default PromoCodeModal;
