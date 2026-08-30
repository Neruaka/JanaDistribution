/**
 * DeleteAccountModal — confirmation de suppression de compte
 * @see design_handoff_jana_refonte/README.md (pattern modal générique — voile + boîte 520px radius 10px)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Loader2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DeleteAccountModal = ({ isOpen, onClose, logout }) => {
  const navigate = useNavigate();
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setConfirmation('');
    onClose();
  };

  const handleDelete = async () => {
    if (confirmation !== 'SUPPRIMER') {
      toast.error('Veuillez taper SUPPRIMER pour confirmer');
      return;
    }
    try {
      setDeleting(true);
      toast.loading('Suppression en cours…', { id: 'delete' });
      await api.delete('/auth/account');
      toast.success('Votre compte a été supprimé', { id: 'delete' });
      await logout();
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression du compte', { id: 'delete' });
    } finally {
      setDeleting(false);
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay-desktop" onClick={handleClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-10 shadow-modal max-w-[480px] w-full">
        <div className="flex items-start gap-3.5 p-5 pb-0">
          <div className="w-10 h-10 rounded-full bg-danger-bg flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-danger-text" />
          </div>
          <div>
            <h2 className="font-display text-[17px] font-bold text-ink-900">Supprimer votre compte</h2>
            <p className="text-[13px] text-graphite-500 mt-0.5">Cette action est irréversible.</p>
          </div>
        </div>

        <div className="p-5">
          <div className="bg-danger-bg border border-danger-border rounded-6 p-3.5 mb-4">
            <p className="text-[13px] text-danger-text font-semibold">La suppression entraînera :</p>
            <ul className="mt-1.5 text-[13px] text-danger-text space-y-1">
              <li>• La perte de votre historique de commandes</li>
              <li>• La suppression de toutes vos données personnelles</li>
              <li>• L'impossibilité de récupérer votre compte</li>
            </ul>
          </div>

          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-[12.5px] text-graphite-600">
              Tapez <span className="font-bold text-danger-text">SUPPRIMER</span> pour confirmer
            </label>
            <input
              type="text"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="SUPPRIMER"
              className="border border-sand-250 rounded-6 h-11 px-3.5 text-[14px] text-ink-900 focus:outline-none focus:border-danger-text transition-colors"
            />
          </div>

          <div className="flex gap-2.5">
            <button type="button" onClick={handleClose} className="flex-1 border border-sand-250 text-graphite-700 text-[13.5px] font-semibold py-2.5 rounded-6 hover:border-sand-300 transition-colors">
              Annuler
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={confirmation !== 'SUPPRIMER' || deleting}
              className="flex-1 bg-danger-text hover:opacity-90 disabled:opacity-40 text-white text-[13.5px] font-semibold py-2.5 rounded-6 flex items-center justify-center gap-2 transition-opacity"
            >
              {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
              {deleting ? 'Suppression…' : 'Supprimer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
