/**
 * Composant MoyenPaiement
 * Section 4 du checkout - Mode de paiement prévu
 */

import { motion } from 'framer-motion';
import { 
  Banknote, 
  CreditCard, 
  Building2, 
  Receipt,
  CheckCircle 
} from 'lucide-react';

// Icônes pour les modes de paiement
const PAIEMENT_ICONS = {
  ESPECES: Banknote,
  CARTE: CreditCard,
  VIREMENT: Building2,
  CHEQUE: Receipt
};

const MoyenPaiement = ({ 
  formData, 
  onChange, 
  modesPaiement,
  stepNumber = 4 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-2xl shadow-sm p-6"
    >
      <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-green-600 font-bold text-sm">{stepNumber}</span>
        </div>
        <Banknote className="w-5 h-5 text-gray-400" />
        Mode de paiement prévu
      </h2>
      <p className="text-sm text-gray-500 mb-4 ml-10">
        Indiquez comment vous souhaitez régler à la livraison
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {modesPaiement.map((mode) => {
          const Icon = PAIEMENT_ICONS[mode.id] || CreditCard;
          const isSelected = formData.modePaiement === mode.id;
          
          return (
            <label
              key={mode.id}
              className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                isSelected
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="modePaiement"
                value={mode.id}
                checked={isSelected}
                onChange={(e) => onChange('modePaiement', e.target.value)}
                className="sr-only"
              />
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isSelected ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <Icon className={`w-5 h-5 ${isSelected ? 'text-green-600' : 'text-gray-500'}`} />
              </div>
              <div className="flex-1">
                <p className={`font-medium ${isSelected ? 'text-green-700' : 'text-gray-800'}`}>
                  {mode.label}
                </p>
                <p className="text-xs text-gray-500">{mode.description}</p>
              </div>
              {isSelected && (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
            </label>
          );
        })}
      </div>
    </motion.div>
  );
};

export default MoyenPaiement;
