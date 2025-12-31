/**
 * Composant Instructions
 * Section 5 du checkout - Instructions de livraison
 */

import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

const Instructions = ({ 
  formData, 
  onChange,
  stepNumber = 5 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-2xl shadow-sm p-6"
    >
      <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-green-600 font-bold text-sm">{stepNumber}</span>
        </div>
        <FileText className="w-5 h-5 text-gray-400" />
        Instructions de livraison
      </h2>
      <p className="text-sm text-gray-500 mb-4 ml-10">
        Horaires préférés, code d'accès, informations utiles...
      </p>

      <textarea
        value={formData.instructions}
        onChange={(e) => onChange('instructions', e.target.value)}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-colors resize-none"
        rows={3}
        maxLength={500}
        placeholder="Ex: Livraison le matin de préférence, code portail 1234..."
      />
      <p className="text-xs text-gray-400 mt-1 text-right">
        {formData.instructions?.length || 0}/500 caractères
      </p>
    </motion.div>
  );
};

export default Instructions;
