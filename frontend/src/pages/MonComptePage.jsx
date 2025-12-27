/**
 * Page Mon Compte - VERSION CORRIGÉE
 * @description Gestion du profil utilisateur, mot de passe, préférences, adresses et RGPD
 * 
 * ✅ CORRECTIONS:
 * - Suppression "Alerte promotion" (inutile)
 * - Ajout gestion adresses de livraison (3 max)
 * - Suivi de commande fonctionnel
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Building,
  Lock,
  Bell,
  Shield,
  Save,
  Eye,
  EyeOff,
  Check,
  X,
  AlertTriangle,
  ChevronRight,
  Package,
  Download,
  Trash2,
  CheckCircle,
  Loader2,
  MapPin,
  Plus,
  Edit2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const MonComptePage = () => {
  const navigate = useNavigate();
  const { user, updateProfile, changePassword, logout } = useAuth();

  // Onglet actif
  const [activeTab, setActiveTab] = useState('profil');

  // États formulaire profil
  const [profileForm, setProfileForm] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    raisonSociale: '',
    siret: '',
    numeroTva: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // États formulaire mot de passe
  const [passwordForm, setPasswordForm] = useState({
    ancienMotDePasse: '',
    nouveauMotDePasse: '',
    confirmationMotDePasse: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    ancien: false,
    nouveau: false,
    confirmation: false
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // États préférences
  const [preferences, setPreferences] = useState({
    accepteNewsletter: false,
    notificationsCommandes: true
  });
  const [savingPreferences, setSavingPreferences] = useState(false);

  // ✅ NOUVEAU: États adresses de livraison (3 max)
  const [adresses, setAdresses] = useState([]);
  const [editingAddress, setEditingAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    nom: '',
    adresse: '',
    complement: '',
    codePostal: '',
    ville: '',
    telephone: '',
    estDefaut: false
  });
  const [savingAddress, setSavingAddress] = useState(false);

  // États RGPD
  const [downloadingData, setDownloadingData] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Charger les données utilisateur
  useEffect(() => {
    if (user) {
      setProfileForm({
        prenom: user.prenom || '',
        nom: user.nom || '',
        telephone: user.telephone || '',
        raisonSociale: user.raisonSociale || '',
        siret: user.siret || '',
        numeroTva: user.numeroTva || ''
      });
      setPreferences({
        accepteNewsletter: user.accepteNewsletter || false,
        notificationsCommandes: user.notificationsCommandes !== false // Par défaut true
      });
      
      // Charger les adresses depuis localStorage (ou API si disponible)
      const savedAddresses = localStorage.getItem(`addresses_${user.id}`);
      if (savedAddresses) {
        setAdresses(JSON.parse(savedAddresses));
      }
    }
  }, [user]);

  // Calculer la force du mot de passe
  useEffect(() => {
    const password = passwordForm.nouveauMotDePasse;
    let strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    setPasswordStrength(Math.min(strength, 5));
  }, [passwordForm.nouveauMotDePasse]);

  // Sauvegarder le profil
  const handleSaveProfile = async (e) => {
    e.preventDefault();

    try {
      setSavingProfile(true);
      await updateProfile(profileForm);
      setProfileSuccess(true);
      toast.success('Profil mis à jour avec succès !');

      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setSavingProfile(false);
    }
  };

  // Changer le mot de passe
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordForm.nouveauMotDePasse !== passwordForm.confirmationMotDePasse) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordForm.nouveauMotDePasse.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    try {
      setSavingPassword(true);
      await changePassword(
        passwordForm.ancienMotDePasse,
        passwordForm.nouveauMotDePasse,
        passwordForm.confirmationMotDePasse
      );

      toast.success('Mot de passe modifié avec succès !');
      setPasswordForm({
        ancienMotDePasse: '',
        nouveauMotDePasse: '',
        confirmationMotDePasse: ''
      });
    } catch (error) {
      toast.error(error.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setSavingPassword(false);
    }
  };

  // Sauvegarder les préférences
  const handleSavePreferences = async () => {
    try {
      setSavingPreferences(true);
      await updateProfile({
        accepteNewsletter: preferences.accepteNewsletter,
        notificationsCommandes: preferences.notificationsCommandes
      });
      toast.success('Préférences mises à jour !');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour des préférences');
    } finally {
      setSavingPreferences(false);
    }
  };

  // ✅ NOUVEAU: Gestion des adresses
  const handleSaveAddress = () => {
    if (!addressForm.nom || !addressForm.adresse || !addressForm.codePostal || !addressForm.ville) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSavingAddress(true);
    
    let newAdresses;
    if (editingAddress !== null) {
      // Modification
      newAdresses = adresses.map((addr, idx) => 
        idx === editingAddress ? { ...addressForm } : addr
      );
    } else {
      // Ajout
      if (adresses.length >= 3) {
        toast.error('Vous ne pouvez pas avoir plus de 3 adresses de livraison');
        setSavingAddress(false);
        return;
      }
      newAdresses = [...adresses, { ...addressForm }];
    }

    // Si cette adresse est défaut, retirer le défaut des autres
    if (addressForm.estDefaut) {
      newAdresses = newAdresses.map((addr, idx) => ({
        ...addr,
        estDefaut: idx === (editingAddress ?? newAdresses.length - 1)
      }));
    }

    setAdresses(newAdresses);
    localStorage.setItem(`addresses_${user.id}`, JSON.stringify(newAdresses));
    
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressForm({
      nom: '',
      adresse: '',
      complement: '',
      codePostal: '',
      ville: '',
      telephone: '',
      estDefaut: false
    });
    setSavingAddress(false);
    toast.success(editingAddress !== null ? 'Adresse modifiée !' : 'Adresse ajoutée !');
  };

  const handleEditAddress = (index) => {
    setEditingAddress(index);
    setAddressForm(adresses[index]);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = (index) => {
    const newAdresses = adresses.filter((_, idx) => idx !== index);
    setAdresses(newAdresses);
    localStorage.setItem(`addresses_${user.id}`, JSON.stringify(newAdresses));
    toast.success('Adresse supprimée');
  };

  const handleSetDefaultAddress = (index) => {
    const newAdresses = adresses.map((addr, idx) => ({
      ...addr,
      estDefaut: idx === index
    }));
    setAdresses(newAdresses);
    localStorage.setItem(`addresses_${user.id}`, JSON.stringify(newAdresses));
    toast.success('Adresse par défaut mise à jour');
  };

  // Télécharger mes données (RGPD)
  const handleDownloadData = async () => {
    try {
      setDownloadingData(true);
      toast.loading('Préparation de vos données...', { id: 'download' });

      const [profileRes, ordersRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/orders/my-orders').catch(() => ({ data: { data: [] } }))
      ]);

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
          accepteNewsletter: profileRes.data.data.accepteNewsletter
        },
        adresses: adresses,
        orders: ordersRes.data.data || [],
        preferences: {
          newsletter: preferences.accepteNewsletter,
          notificationsCommandes: preferences.notificationsCommandes
        }
      };

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
      setDownloadingData(false);
    }
  };

  // Supprimer mon compte (RGPD)
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'SUPPRIMER') {
      toast.error('Veuillez taper SUPPRIMER pour confirmer');
      return;
    }

    try {
      setDeletingAccount(true);
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
      setDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  // Indicateur de force du mot de passe
  const PasswordStrengthIndicator = () => {
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];
    const labels = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];

    return (
      <div className="mt-2">
        <div className="flex gap-1 mb-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i < passwordStrength ? colors[passwordStrength - 1] : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        {passwordForm.nouveauMotDePasse && (
          <p className={`text-xs ${passwordStrength < 3 ? 'text-orange-600' : 'text-green-600'}`}>
            {labels[passwordStrength - 1] || 'Très faible'}
          </p>
        )}
      </div>
    );
  };

  // Onglets
  const tabs = [
    { id: 'profil', label: 'Mon profil', icon: User },
    { id: 'adresses', label: 'Adresses', icon: MapPin },
    { id: 'securite', label: 'Sécurité', icon: Lock },
    { id: 'preferences', label: 'Préférences', icon: Bell }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Mon compte</h1>
          <p className="text-gray-500 mt-1">Gérez vos informations personnelles et préférences</p>
        </div>

        {/* Carte profil rapide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-800">
                {user?.prenom} {user?.nom}
              </h2>
              <p className="text-gray-500">{user?.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                  user?.typeClient === 'PROFESSIONNEL'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {user?.typeClient === 'PROFESSIONNEL' ? (
                    <><Building className="w-3 h-3" /> Professionnel</>
                  ) : (
                    <><User className="w-3 h-3" /> Particulier</>
                  )}
                </span>
              </div>
            </div>
            <Link
              to="/mes-commandes"
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors"
            >
              <Package className="w-4 h-4" />
              Mes commandes
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        {/* Navigation onglets */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-max flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Contenu onglets */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* Onglet Profil */}
              {activeTab === 'profil' && (
                <motion.div
                  key="profil"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-green-600" />
                        Informations personnelles
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                          <input
                            type="text"
                            value={profileForm.prenom}
                            onChange={(e) => setProfileForm({ ...profileForm, prenom: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                          <input
                            type="text"
                            value={profileForm.nom}
                            onChange={(e) => setProfileForm({ ...profileForm, nom: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">L'email ne peut pas être modifié</p>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="tel"
                            value={profileForm.telephone}
                            onChange={(e) => setProfileForm({ ...profileForm, telephone: e.target.value })}
                            placeholder="06 12 34 56 78"
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Informations pro */}
                    {user?.typeClient === 'PROFESSIONNEL' && (
                      <div className="pt-6 border-t border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                          <Building className="w-5 h-5 text-purple-600" />
                          Informations professionnelles
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Raison sociale</label>
                            <input
                              type="text"
                              value={profileForm.raisonSociale}
                              onChange={(e) => setProfileForm({ ...profileForm, raisonSociale: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">SIRET</label>
                              <input
                                type="text"
                                value={profileForm.siret}
                                onChange={(e) => setProfileForm({ ...profileForm, siret: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">N° TVA</label>
                              <input
                                type="text"
                                value={profileForm.numeroTva}
                                onChange={(e) => setProfileForm({ ...profileForm, numeroTva: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {savingProfile ? 'Enregistrement...' : profileSuccess ? 'Enregistré !' : 'Enregistrer'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* ✅ NOUVEAU: Onglet Adresses */}
              {activeTab === 'adresses' && (
                <motion.div
                  key="adresses"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-green-600" />
                      Adresses de livraison
                    </h3>
                    {adresses.length < 3 && !showAddressForm && (
                      <button
                        onClick={() => {
                          setEditingAddress(null);
                          setAddressForm({ nom: '', adresse: '', complement: '', codePostal: '', ville: '', telephone: '', estDefaut: false });
                          setShowAddressForm(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Ajouter
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-gray-500">Vous pouvez enregistrer jusqu'à 3 adresses de livraison.</p>

                  {/* Formulaire ajout/modification */}
                  <AnimatePresence>
                    {showAddressForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-gray-50 rounded-xl p-4 space-y-4"
                      >
                        <h4 className="font-medium text-gray-800">
                          {editingAddress !== null ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
                        </h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nom de l'adresse <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={addressForm.nom}
                              onChange={(e) => setAddressForm({ ...addressForm, nom: e.target.value })}
                              placeholder="Ex: Domicile, Bureau..."
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                            <input
                              type="tel"
                              value={addressForm.telephone}
                              onChange={(e) => setAddressForm({ ...addressForm, telephone: e.target.value })}
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
                            value={addressForm.adresse}
                            onChange={(e) => setAddressForm({ ...addressForm, adresse: e.target.value })}
                            placeholder="15 rue de la Paix"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Complément</label>
                          <input
                            type="text"
                            value={addressForm.complement}
                            onChange={(e) => setAddressForm({ ...addressForm, complement: e.target.value })}
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
                              value={addressForm.codePostal}
                              onChange={(e) => setAddressForm({ ...addressForm, codePostal: e.target.value.replace(/\D/g, '').slice(0, 5) })}
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
                              value={addressForm.ville}
                              onChange={(e) => setAddressForm({ ...addressForm, ville: e.target.value })}
                              placeholder="Paris"
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={addressForm.estDefaut}
                            onChange={(e) => setAddressForm({ ...addressForm, estDefaut: e.target.checked })}
                            className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm text-gray-700">Définir comme adresse par défaut</span>
                        </label>

                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={() => {
                              setShowAddressForm(false);
                              setEditingAddress(null);
                            }}
                            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            Annuler
                          </button>
                          <button
                            onClick={handleSaveAddress}
                            disabled={savingAddress}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {savingAddress ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Enregistrer
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Liste des adresses */}
                  {adresses.length === 0 && !showAddressForm ? (
                    <div className="text-center py-8 text-gray-500">
                      <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Aucune adresse enregistrée</p>
                      <p className="text-sm">Ajoutez une adresse pour faciliter vos commandes</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {adresses.map((addr, idx) => (
                        <div
                          key={idx}
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
                                  onClick={() => handleSetDefaultAddress(idx)}
                                  className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                                  title="Définir par défaut"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleEditAddress(idx)}
                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Modifier"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteAddress(idx)}
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
              )}

              {/* Onglet Sécurité */}
              {activeTab === 'securite' && (
                <motion.div
                  key="securite"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <form onSubmit={handleChangePassword} className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-green-600" />
                        Changer le mot de passe
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe actuel</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type={showPasswords.ancien ? 'text' : 'password'}
                              value={passwordForm.ancienMotDePasse}
                              onChange={(e) => setPasswordForm({ ...passwordForm, ancienMotDePasse: e.target.value })}
                              className="w-full pl-10 pr-12 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords({ ...showPasswords, ancien: !showPasswords.ancien })}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPasswords.ancien ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type={showPasswords.nouveau ? 'text' : 'password'}
                              value={passwordForm.nouveauMotDePasse}
                              onChange={(e) => setPasswordForm({ ...passwordForm, nouveauMotDePasse: e.target.value })}
                              className="w-full pl-10 pr-12 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              required
                              minLength={8}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords({ ...showPasswords, nouveau: !showPasswords.nouveau })}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPasswords.nouveau ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                          <PasswordStrengthIndicator />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type={showPasswords.confirmation ? 'text' : 'password'}
                              value={passwordForm.confirmationMotDePasse}
                              onChange={(e) => setPasswordForm({ ...passwordForm, confirmationMotDePasse: e.target.value })}
                              className={`w-full pl-10 pr-12 py-2.5 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                                passwordForm.confirmationMotDePasse && passwordForm.confirmationMotDePasse !== passwordForm.nouveauMotDePasse
                                  ? 'border-red-300 bg-red-50' : 'border-gray-200'
                              }`}
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords({ ...showPasswords, confirmation: !showPasswords.confirmation })}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPasswords.confirmation ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                          {passwordForm.confirmationMotDePasse && passwordForm.confirmationMotDePasse !== passwordForm.nouveauMotDePasse && (
                            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                              <X className="w-3 h-3" /> Les mots de passe ne correspondent pas
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        disabled={savingPassword || passwordForm.nouveauMotDePasse !== passwordForm.confirmationMotDePasse}
                        className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                        {savingPassword ? 'Modification...' : 'Changer le mot de passe'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* Onglet Préférences - CORRIGÉ (sans alerte promo) */}
              {activeTab === 'preferences' && (
                <motion.div
                  key="preferences"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
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

                      {/* Notifications commandes */}
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
                        disabled={downloadingData}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {downloadingData ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        {downloadingData ? 'Préparation...' : 'Télécharger mes données'}
                      </button>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-100 text-red-700 rounded-xl font-medium hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer mon compte
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={handleSavePreferences}
                      disabled={savingPreferences}
                      className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {savingPreferences ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {savingPreferences ? 'Enregistrement...' : 'Enregistrer les préférences'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Liens rapides */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/mes-commandes"
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50/50 transition-colors"
          >
            <div className="p-3 bg-green-100 rounded-lg">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800">Mes commandes</p>
              <p className="text-sm text-gray-500">Suivre et consulter vos commandes</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
          </Link>

          <Link
            to="/catalogue"
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50/50 transition-colors"
          >
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800">Catalogue</p>
              <p className="text-sm text-gray-500">Découvrir nos produits</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
          </Link>
        </div>
      </div>

      {/* Modal suppression compte */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Supprimer votre compte</h3>
                  <p className="text-sm text-gray-500">Cette action est irréversible</p>
                </div>
              </div>

              <div className="bg-red-50 rounded-xl p-4 mb-4 border border-red-100">
                <p className="text-sm text-red-800"><strong>Attention :</strong> La suppression entraînera :</p>
                <ul className="mt-2 text-sm text-red-700 space-y-1">
                  <li>• La perte de votre historique de commandes</li>
                  <li>• La suppression de toutes vos données personnelles</li>
                  <li>• L'impossibilité de récupérer votre compte</li>
                </ul>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tapez <span className="font-bold text-red-600">SUPPRIMER</span> pour confirmer
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="SUPPRIMER"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setDeleteConfirmation(''); }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmation !== 'SUPPRIMER' || deletingAccount}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {deletingAccount ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MonComptePage;
