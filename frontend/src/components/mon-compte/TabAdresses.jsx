/**
 * Composant TabAdresses
 * Gestion des adresses de livraison (3 max)
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Edit2, Trash2, Check, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const TabAdresses = ({ userId }) => {
  // États
  const [adresses, setAdresses] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    id: null,
    nom: '',
    adresse: '',
    complement: '',
    codePostal: '',
    ville: '',
    telephone: '',
    estDefaut: false
  });

  // Charger les adresses
  useEffect(() => {
    if (userId) {
      const saved = localStorage.getItem(`addresses_${userId}`);
      if (saved) {
        setAdresses(JSON.parse(saved));
      }
    }
  }, [userId]);

  // Sauvegarder dans localStorage
  const saveToStorage = (newAdresses) => {
    localStorage.setItem(`addresses_${userId}`, JSON.stringify(newAdresses));
    setAdresses(newAdresses);
  };

  // Reset form
  const resetForm = () => {
    setForm({
      id: null,
      nom: '',
      adresse: '',
      complement: '',
      codePostal: '',
      ville: '',
      telephone: '',
      estDefaut: false
    });
    setShowForm(false);
    setEditingIndex(null);
  };

  // Ouvrir le formulaire pour ajout
  const handleAdd = () => {
    resetForm();
    setShowForm(true);
  };

  // Ouvrir le formulaire pour modification
  const handleEdit = (index) => {
    const addr = adresses[index];
    setForm({ ...addr });
    setEditingIndex(index);
    setShowForm(true);
  };

  // Sauvegarder l'adresse
  const handleSave = () => {
    // Validation
    if (!form.nom || !form.adresse || !form.codePostal || !form.ville) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSaving(true);

    let newAdresses;
    const addressData = {
      ...form,
      id: form.id || `addr_${Date.now()}`
    };

    if (editingIndex !== null) {
      // Modification
      newAdresses = adresses.map((addr, idx) => 
        idx === editingIndex ? addressData : addr
      );
    } else {
      // Ajout
      if (adresses.length >= 3) {
        toast.error('Vous ne pouvez pas avoir plus de 3 adresses');
        setSaving(false);
        return;
      }
      newAdresses = [...adresses, addressData];
    }

    // Si défaut, retirer le défaut des autres
    if (addressData.estDefaut) {
      const targetIndex = editingIndex ?? newAdresses.length - 1;
      newAdresses = newAdresses.map((addr, idx) => ({
        ...addr,
        estDefaut: idx === targetIndex
      }));
    }

    saveToStorage(newAdresses);
    resetForm();
    setSaving(false);
    toast.success(editingIndex !== null ? 'Adresse modifiée !' : 'Adresse ajoutée !');
  };

  // Supprimer une adresse
  const handleDelete = (index) => {
    const newAdresses = adresses.filter((_, idx) => idx !== index);
    saveToStorage(newAdresses);
    toast.success('Adresse supprimée');
  };

  // Définir par défaut
  const handleSetDefault = (index) => {
    const newAdresses = adresses.map((addr, idx) => ({
      ...addr,
      estDefaut: idx === index
    }));
    saveToStorage(newAdresses);
    toast.success('Adresse par défaut mise à jour');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-green-600" />
          Adresses de livraison
        </h3>
        {adresses.length < 3 && !showForm && (
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        )}
      </div>

      <p className="text-sm text-gray-500">
        Vous pouvez enregistrer jusqu'à 3 adresses de livraison.
      </p>

      {/* Formulaire */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 rounded-xl p-4 space-y-4"
          >
            <h4 className="font-medium text-gray-800">
              {editingIndex !== null ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l'adresse <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  placeholder="Ex: Domicile, Bureau..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={form.telephone}
                  onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                  placeholder="06 12 34 56 78"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.adresse}
                onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                placeholder="15 rue de la Paix"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Complément</label>
              <input
                type="text"
                value={form.complement}
                onChange={(e) => setForm({ ...form, complement: e.target.value })}
                placeholder="Bâtiment A, 2ème étage..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code postal <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.codePostal}
                  onChange={(e) => setForm({ ...form, codePostal: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                  placeholder="75001"
                  maxLength={5}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ville <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.ville}
                  onChange={(e) => setForm({ ...form, ville: e.target.value })}
                  placeholder="Paris"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.estDefaut}
                onChange={(e) => setForm({ ...form, estDefaut: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Définir comme adresse par défaut</span>
            </label>

            <div className="flex gap-3 pt-2">
              <button
                onClick={resetForm}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Enregistrer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Liste des adresses */}
      {adresses.length === 0 && !showForm ? (
        <div className="text-center py-8 text-gray-500">
          <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Aucune adresse enregistrée</p>
          <p className="text-sm">Ajoutez une adresse pour faciliter vos commandes</p>
        </div>
      ) : (
        <div className="space-y-4">
          {adresses.map((addr, idx) => (
            <div
              key={addr.id || idx}
              className={`p-4 rounded-xl border-2 transition-colors ${
                addr.estDefaut ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-800">{addr.nom}</h4>
                    {addr.estDefaut && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        Par défaut
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">{addr.adresse}</p>
                  {addr.complement && <p className="text-gray-500 text-sm">{addr.complement}</p>}
                  <p className="text-gray-600 text-sm">{addr.codePostal} {addr.ville}</p>
                  {addr.telephone && <p className="text-gray-500 text-sm mt-1">📞 {addr.telephone}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {!addr.estDefaut && (
                    <button
                      onClick={() => handleSetDefault(idx)}
                      className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                      title="Définir par défaut"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(idx)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Modifier"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(idx)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default TabAdresses;
