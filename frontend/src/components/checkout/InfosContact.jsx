/**
 * Composant InfosContact
 * Section 1 du checkout - Informations de contact
 */

import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

const InfosContact = ({ formData, errors, onChange, stepNumber = 1 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm p-6"
    >
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-green-600 font-bold text-sm">{stepNumber}</span>
        </div>
        Informations de contact
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Prénom */}
        <div className={errors.prenom ? 'error-field' : ''}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prénom <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.prenom}
            onChange={(e) => onChange('prenom', e.target.value)}
            className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
              errors.prenom
                ? 'border-red-300 focus:ring-red-200 bg-red-50'
                : 'border-gray-200 focus:ring-green-200 focus:border-green-400'
            }`}
            placeholder="Jean"
          />
          {errors.prenom && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.prenom}
            </p>
          )}
        </div>

        {/* Nom */}
        <div className={errors.nom ? 'error-field' : ''}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.nom}
            onChange={(e) => onChange('nom', e.target.value)}
            className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
              errors.nom
                ? 'border-red-300 focus:ring-red-200 bg-red-50'
                : 'border-gray-200 focus:ring-green-200 focus:border-green-400'
            }`}
            placeholder="Dupont"
          />
          {errors.nom && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.nom}
            </p>
          )}
        </div>

        {/* Entreprise */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Entreprise <span className="text-gray-400">(optionnel)</span>
          </label>
          <input
            type="text"
            value={formData.entreprise}
            onChange={(e) => onChange('entreprise', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-colors"
            placeholder="Ma Société SARL"
          />
        </div>

        {/* Téléphone */}
        <div className={errors.telephone ? 'error-field' : ''}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Téléphone <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={formData.telephone}
            onChange={(e) => onChange('telephone', e.target.value)}
            className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
              errors.telephone
                ? 'border-red-300 focus:ring-red-200 bg-red-50'
                : 'border-gray-200 focus:ring-green-200 focus:border-green-400'
            }`}
            placeholder="06 12 34 56 78"
          />
          {errors.telephone && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.telephone}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default InfosContact;
