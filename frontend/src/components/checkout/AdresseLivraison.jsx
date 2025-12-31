/**
 * Composant AdresseLivraison
 * Section 2 du checkout - Adresse de livraison avec sélection d'adresses enregistrées
 * 
 * ✅ FIX: Correction bug sélection multiple sur première ligne
 *    - Utilisation de l'INDEX au lieu de l'ID pour la sélection
 *    - Séparation du bouton "Nouvelle adresse" de la map
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, AlertCircle, Plus, Home, Briefcase, Check } from 'lucide-react';

const AdresseLivraison = ({ 
  formData, 
  errors, 
  onChange, 
  userId,
  stepNumber = 2 
}) => {
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1); // ✅ Utiliser l'index au lieu de l'ID
  const [useNewAddress, setUseNewAddress] = useState(false);

  // Charger les adresses enregistrées depuis localStorage
  useEffect(() => {
    if (userId) {
      const storedAddresses = localStorage.getItem(`addresses_${userId}`);
      if (storedAddresses) {
        try {
          const addresses = JSON.parse(storedAddresses);
          setSavedAddresses(addresses);
          
          // Trouver l'index de l'adresse par défaut
          const defaultIndex = addresses.findIndex(a => a.estDefaut);
          if (defaultIndex !== -1) {
            setSelectedIndex(defaultIndex);
            applyAddress(addresses[defaultIndex]);
          } else if (addresses.length > 0) {
            setSelectedIndex(0);
            applyAddress(addresses[0]);
          } else {
            setUseNewAddress(true);
          }
        } catch (e) {
          console.error('Erreur parsing adresses:', e);
          setUseNewAddress(true);
        }
      } else {
        setUseNewAddress(true);
      }
    }
  }, [userId]);

  // Appliquer une adresse au formulaire
  const applyAddress = (address) => {
    onChange('adresse', address.adresse || '');
    onChange('complement', address.complement || '');
    onChange('codePostal', address.codePostal || '');
    onChange('ville', address.ville || '');
  };

  // ✅ Sélectionner une adresse par son INDEX (plus fiable que l'ID)
  const handleSelectAddress = (index) => {
    const address = savedAddresses[index];
    if (!address) return;
    
    setSelectedIndex(index);
    setUseNewAddress(false);
    applyAddress(address);
  };

  // Utiliser une nouvelle adresse
  const handleUseNewAddress = () => {
    setUseNewAddress(true);
    setSelectedIndex(-1);
    onChange('adresse', '');
    onChange('complement', '');
    onChange('codePostal', '');
    onChange('ville', '');
  };

  // ✅ Vérifier si une adresse est sélectionnée (par index strict)
  const isSelected = (index) => {
    return selectedIndex === index && !useNewAddress;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-2xl shadow-sm p-6"
    >
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-green-600 font-bold text-sm">{stepNumber}</span>
        </div>
        <MapPin className="w-5 h-5 text-gray-400" />
        Adresse de livraison
      </h2>

      {/* Sélection d'adresses enregistrées */}
      {savedAddresses.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Choisir une adresse enregistrée
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* ✅ Liste des adresses avec INDEX comme clé et comparaison */}
            {savedAddresses.map((address, index) => (
              <button
                key={`saved-address-${index}`}
                type="button"
                onClick={() => handleSelectAddress(index)}
                className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected(index)
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {isSelected(index) && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  {address.nom?.toLowerCase().includes('bureau') || 
                   address.nom?.toLowerCase().includes('travail') ? (
                    <Briefcase className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Home className="w-4 h-4 text-gray-500" />
                  )}
                  <span className="font-medium text-gray-800">{address.nom}</span>
                  {address.estDefaut && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Par défaut
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {address.adresse}
                  {address.complement && `, ${address.complement}`}
                </p>
                <p className="text-sm text-gray-600">
                  {address.codePostal} {address.ville}
                </p>
              </button>
            ))}
            
            {/* ✅ Bouton nouvelle adresse (HORS de la map pour éviter les conflits) */}
            <button
              type="button"
              onClick={handleUseNewAddress}
              className={`p-4 rounded-xl border-2 border-dashed text-left transition-all ${
                useNewAddress
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-gray-700">Nouvelle adresse</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Saisir une adresse différente
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Formulaire d'adresse (visible si nouvelle adresse ou pas d'adresses) */}
      {(useNewAddress || savedAddresses.length === 0) && (
        <div className="space-y-4">
          {/* Adresse */}
          <div className={errors.adresse ? 'error-field' : ''}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.adresse}
              onChange={(e) => onChange('adresse', e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                errors.adresse
                  ? 'border-red-300 focus:ring-red-200 bg-red-50'
                  : 'border-gray-200 focus:ring-green-200 focus:border-green-400'
              }`}
              placeholder="15 rue de la Paix"
            />
            {errors.adresse && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.adresse}
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
              value={formData.complement}
              onChange={(e) => onChange('complement', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-colors"
              placeholder="Bâtiment A, 2ème étage..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Code postal */}
            <div className={errors.codePostal ? 'error-field' : ''}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code postal <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.codePostal}
                onChange={(e) => onChange('codePostal', e.target.value.replace(/\D/g, '').slice(0, 5))}
                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                  errors.codePostal
                    ? 'border-red-300 focus:ring-red-200 bg-red-50'
                    : 'border-gray-200 focus:ring-green-200 focus:border-green-400'
                }`}
                placeholder="75001"
                maxLength={5}
              />
              {errors.codePostal && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.codePostal}
                </p>
              )}
            </div>

            {/* Ville */}
            <div className={`sm:col-span-2 ${errors.ville ? 'error-field' : ''}`}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ville <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.ville}
                onChange={(e) => onChange('ville', e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                  errors.ville
                    ? 'border-red-300 focus:ring-red-200 bg-red-50'
                    : 'border-gray-200 focus:ring-green-200 focus:border-green-400'
                }`}
                placeholder="Paris"
              />
              {errors.ville && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.ville}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Affichage de l'adresse sélectionnée (mode lecture) */}
      {!useNewAddress && selectedIndex >= 0 && savedAddresses.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
          <p className="text-sm text-gray-700">
            <strong>Adresse sélectionnée :</strong><br />
            {formData.adresse}
            {formData.complement && <>, {formData.complement}</>}<br />
            {formData.codePostal} {formData.ville}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default AdresseLivraison;