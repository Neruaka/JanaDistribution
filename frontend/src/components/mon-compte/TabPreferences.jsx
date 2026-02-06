/**
 * Composant TabPreferences
 * Préférences de notifications et données RGPD
 * 
 * ✅ Sauvegarde notificationsCommandes via API (pas localStorage)
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Shield, Save, Download, Trash2, Loader2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const TabPreferences = ({ 
  user, 
  updateProfile, 
  onOpenDeleteModal 
}) => {
  // États
  const [preferences, setPreferences] = useState({
    accepteNewsletter: false,
    notificationsCommandes: true
  });
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Charger les préférences depuis l'utilisateur
  useEffect(() => {
    if (user) {
      setPreferences({
        accepteNewsletter: user.accepteNewsletter || false,
        // ✅ Par défaut true si non défini (rétrocompatibilité)
        notificationsCommandes: user.notificationsCommandes !== false
      });
    }
  }, [user]);

  // Sauvegarder les préférences via API
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // ✅ Envoyer les deux préférences à l'API
      await updateProfile({
        accepteNewsletter: preferences.accepteNewsletter,
        notificationsCommandes: preferences.notificationsCommandes
      });
      
      toast.success('Préférences mises à jour !');
    } catch (error) {
      console.error('Erreur sauvegarde préférences:', error);
      toast.error('Erreur lors de la mise à jour des préférences');
    } finally {
      setSaving(false);
    }
  };

  // Télécharger les données (RGPD)
  const handleDownloadData = async () => {
    try {
      setDownloading(true);
      toast.loading('Préparation de vos données...', { id: 'download' });

      const [profileRes, ordersRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/orders').catch(() => ({ data: { data: [] } }))
      ]);

      // Charger les adresses depuis le stockage de session
      const storageKey = `addresses_${user.id}`;
      const savedAddresses = sessionStorage.getItem(storageKey) || localStorage.getItem(storageKey);
      if (savedAddresses) {
        sessionStorage.setItem(storageKey, savedAddresses);
        localStorage.removeItem(storageKey);
      }
      const adresses = savedAddresses ? JSON.parse(savedAddresses) : [];

      const userData = {
        exportDate: new Date().toISOString(),
        profile: {
          id: profileRes.data.data.id,
          email: profileRes.data.data.email,
          nom: profileRes.data.data.nom,
          prenom: profileRes.data.data.prenom,
          telephone: profileRes.data.data.telephone,
          typeClient: profileRes.data.data.typeClient,
          raisonSociale: profileRes.data.data.raisonSociale,
          siret: profileRes.data.data.siret,
          numeroTva: profileRes.data.data.numeroTva,
          dateCreation: profileRes.data.data.dateCreation,
          accepteNewsletter: profileRes.data.data.accepteNewsletter,
          notificationsCommandes: profileRes.data.data.notificationsCommandes
        },
        adresses: adresses,
        orders: ordersRes.data.data || [],
        preferences: {
          newsletter: preferences.accepteNewsletter,
          notificationsCommandes: preferences.notificationsCommandes
        }
      };

      // Créer et télécharger le fichier
      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `mes-donnees-jana-distribution-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Vos données ont été téléchargées !', { id: 'download' });
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      toast.error('Erreur lors du téléchargement des données', { id: 'download' });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      {/* Notifications */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-green-600" />
          Notifications et communications
        </h3>

        <div className="space-y-4">
          {/* Newsletter */}
          <label className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={preferences.accepteNewsletter}
              onChange={(e) => setPreferences({ ...preferences, accepteNewsletter: e.target.checked })}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <div>
              <p className="font-medium text-gray-800">Newsletter</p>
              <p className="text-sm text-gray-500">
                Recevez nos offres exclusives, nouveautés et conseils par email
              </p>
            </div>
          </label>

          {/* ✅ Notifications commandes - sauvegardé en BDD */}
          <label className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={preferences.notificationsCommandes}
              onChange={(e) => setPreferences({ ...preferences, notificationsCommandes: e.target.checked })}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <div>
              <p className="font-medium text-gray-800">Suivi de commande</p>
              <p className="text-sm text-gray-500">
                Notifications par email sur l'état de vos commandes (confirmation, expédition, livraison)
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* RGPD */}
      <div className="pt-6 border-t border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Vos données personnelles
        </h3>

        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 mb-4">
          <p className="text-sm text-blue-800">
            Conformément au RGPD, vous pouvez demander l'accès, la rectification ou la suppression de vos données personnelles.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleDownloadData}
            disabled={downloading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {downloading ? 'Préparation...' : 'Télécharger mes données'}
          </button>
          <button
            onClick={onOpenDeleteModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-100 text-red-700 rounded-xl font-medium hover:bg-red-200 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer mon compte
          </button>
        </div>
      </div>

      {/* Bouton sauvegarder */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Enregistrement...' : 'Enregistrer les préférences'}
        </button>
      </div>
    </motion.div>
  );
};

export default TabPreferences;
