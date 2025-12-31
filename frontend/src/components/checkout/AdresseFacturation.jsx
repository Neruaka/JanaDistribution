/**
 * Composant AdresseFacturation
 * Section 3 du checkout - Adresse de facturation
 * Option: utiliser la même adresse que la livraison ou en saisir une différente
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, AlertCircle, Check } from 'lucide-react';

const AdresseFacturation = ({ 
  formData, 
  errors, 
  onChange, 
  adresseLivraison, // Pour copier depuis livraison
  stepNumber = 3 
}) => {
  const [memeAdresse, setMemeAdresse] = useState(true);

  // Copier l'adresse de livraison UNIQUEMENT quand on active le toggle
  const handleToggleMemeAdresse = (value) => {
    setMemeAdresse(value);
    if (value && adresseLivraison) {
      // Copier l'adresse de livraison
      onChange('adresseFacturation', adresseLivraison.adresse || '');
      onChange('complementFacturation', adresseLivraison.complement || '');
      onChange('codePostalFacturation', adresseLivraison.codePostal || '');
      onChange('villeFacturation', adresseLivraison.ville || '');
    } else if (!value) {
      // Réinitialiser pour saisie manuelle
      onChange('adresseFacturation', '');
      onChange('complementFacturation', '');
      onChange('codePostalFacturation', '');
      onChange('villeFacturation', '');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-white rounded-2xl shadow-sm p-6"
    >
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-green-600 font-bold text-sm">{stepNumber}</span>
        </div>
        <FileText className="w-5 h-5 text-gray-400" />
        Adresse de facturation
      </h2>

      {/* Toggle même adresse */}
      <div className="mb-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={memeAdresse}
            onChange={(e) => handleToggleMemeAdresse(e.target.checked)}
            className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
          />
          <span className="text-sm text-gray-700">
            Utiliser la même adresse que la livraison
          </span>
        </label>
      </div>

      {/* Formulaire adresse facturation (si différente) */}
      {!memeAdresse && (
        <div className="space-y-4 mt-4 pt-4 border-t border-gray-100">
          {/* Adresse */}
          <div className={errors.adresseFacturation ? 'error-field' : ''}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.adresseFacturation || ''}
              onChange={(e) => onChange('adresseFacturation', e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                errors.adresseFacturation
                  ? 'border-red-300 focus:ring-red-200 bg-red-50'
                  : 'border-gray-200 focus:ring-green-200 focus:border-green-400'
              }`}
              placeholder="15 rue de la Paix"
            />
            {errors.adresseFacturation && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.adresseFacturation}
              </p>
            )}
          </div>

          {/* Complément */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Complément d'adresse <span className="text-gray-400">(optionnel)</span>
            </label>
            <input
              type="text"
              value={formData.complementFacturation || ''}
              onChange={(e) => onChange('complementFacturation', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-colors"
              placeholder="Bâtiment A, 2ème étage..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Code postal */}
            <div className={errors.codePostalFacturation ? 'error-field' : ''}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code postal <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.codePostalFacturation || ''}
                onChange={(e) => onChange('codePostalFacturation', e.target.value.replace(/\D/g, '').slice(0, 5))}
                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                  errors.codePostalFacturation
                    ? 'border-red-300 focus:ring-red-200 bg-red-50'
                    : 'border-gray-200 focus:ring-green-200 focus:border-green-400'
                }`}
                placeholder="75001"
                maxLength={5}
              />
              {errors.codePostalFacturation && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.codePostalFacturation}
                </p>
              )}
            </div>

            {/* Ville */}
            <div className={`sm:col-span-2 ${errors.villeFacturation ? 'error-field' : ''}`}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ville <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.villeFacturation || ''}
                onChange={(e) => onChange('villeFacturation', e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                  errors.villeFacturation
                    ? 'border-red-300 focus:ring-red-200 bg-red-50'
                    : 'border-gray-200 focus:ring-green-200 focus:border-green-400'
                }`}
                placeholder="Paris"
              />
              {errors.villeFacturation && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.villeFacturation}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Affichage adresse si même que livraison */}
      {memeAdresse && adresseLivraison?.adresse && (
        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-2 text-green-600 text-sm mb-2">
            <Check className="w-4 h-4" />
            <span>Même adresse que la livraison</span>
          </div>
          <p className="text-sm text-gray-600">
            {adresseLivraison.adresse}
            {adresseLivraison.complement && `, ${adresseLivraison.complement}`}<br />
            {adresseLivraison.codePostal} {adresseLivraison.ville}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default AdresseFacturation;