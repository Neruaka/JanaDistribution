/**
 * Composant DeleteAccountModal
 * Modal de confirmation pour suppression du compte
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DeleteAccountModal = ({ isOpen, onClose, logout }) => {
  const navigate = useNavigate();
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Réinitialiser à la fermeture
  const handleClose = () => {
    setConfirmation('');
    onClose();
  };

  // Supprimer le compte
  const handleDelete = async () => {
    if (confirmation !== 'SUPPRIMER') {
      toast.error('Veuillez taper SUPPRIMER pour confirmer');
      return;
    }

    try {
      setDeleting(true);
      toast.loading('Suppression en cours...', { id: 'delete' });

      await api.delete('/auth/account');

      toast.success('Votre compte a été supprimé', { id: 'delete' });

      await logout();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error(
        error.response?.data?.message || 'Erreur lors de la suppression du compte',
        { id: 'delete' }
      );
    } finally {
      setDeleting(false);
      handleClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Supprimer votre compte</h3>
                <p className="text-sm text-gray-500">Cette action est irréversible</p>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-red-50 rounded-xl p-4 mb-4 border border-red-100">
              <p className="text-sm text-red-800">
                <strong>Attention :</strong> La suppression entraînera :
              </p>
              <ul className="mt-2 text-sm text-red-700 space-y-1">
                <li>• La perte de votre historique de commandes</li>
                <li>• La suppression de toutes vos données personnelles</li>
                <li>• L'impossibilité de récupérer votre compte</li>
              </ul>
            </div>

            {/* Confirmation input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tapez <span className="font-bold text-red-600">SUPPRIMER</span> pour confirmer
              </label>
              <input
                type="text"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder="SUPPRIMER"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={confirmation !== 'SUPPRIMER' || deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeleteAccountModal;
