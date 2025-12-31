/**
 * Admin Profile Page
 * @description Page de gestion du profil administrateur
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Lock,
  Shield,
  Save,
  Eye,
  EyeOff,
  Check,
  X,
  CheckCircle,
  Clock,
  LogOut,
  Key,
  Activity
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const AdminProfilePage = () => {
  const { user, updateProfile, changePassword } = useAuth();

  // États formulaire profil
  const [profileForm, setProfileForm] = useState({
    prenom: '',
    nom: '',
    telephone: ''
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

  // Charger les données utilisateur
  useEffect(() => {
    if (user) {
      setProfileForm({
        prenom: user.prenom || '',
        nom: user.nom || '',
        telephone: user.telephone || ''
      });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Mon profil</h1>
        <p className="text-gray-500 mt-1">Gérez vos informations personnelles et votre sécurité</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carte profil */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            {/* Avatar */}
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto shadow-lg">
                {user?.prenom?.[0]}{user?.nom?.[0]}
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mt-4">
                {user?.prenom} {user?.nom}
              </h2>
              <p className="text-gray-500 text-sm">{user?.email}</p>
              
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mt-3">
                <Shield className="w-4 h-4" />
                Administrateur
              </span>
            </div>

            {/* Infos connexion */}
            <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Dernière connexion</p>
                  <p className="font-medium text-gray-700">
                    {user?.derniereConnexion 
                      ? new Date(user.derniereConnexion).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Première connexion'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Activity className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Membre depuis</p>
                  <p className="font-medium text-gray-700">
                    {user?.dateCreation 
                      ? new Date(user.dateCreation).toLocaleDateString('fr-FR', {
                          month: 'long',
                          year: 'numeric'
                        })
                      : '-'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Statut sécurité */}
            <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-100">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">Compte sécurisé</span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Authentification par mot de passe activée
              </p>
            </div>
          </motion.div>
        </div>

        {/* Formulaires */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations personnelles */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Informations personnelles</h3>
                <p className="text-sm text-gray-500">Modifiez vos informations de profil</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={profileForm.prenom}
                    onChange={(e) => setProfileForm({ ...profileForm, prenom: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={profileForm.nom}
                    onChange={(e) => setProfileForm({ ...profileForm, nom: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  L'email ne peut pas être modifié
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={profileForm.telephone}
                    onChange={(e) => setProfileForm({ ...profileForm, telephone: e.target.value })}
                    placeholder="06 12 34 56 78"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {savingProfile ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Enregistrement...
                    </>
                  ) : profileSuccess ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Enregistré !
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Enregistrer
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>

          {/* Sécurité - Mot de passe */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Key className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Changer le mot de passe</h3>
                <p className="text-sm text-gray-500">Assurez-vous d'utiliser un mot de passe sécurisé</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Ancien mot de passe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe actuel
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPasswords.ancien ? 'text' : 'password'}
                    value={passwordForm.ancienMotDePasse}
                    onChange={(e) => setPasswordForm({ ...passwordForm, ancienMotDePasse: e.target.value })}
                    className="w-full pl-10 pr-12 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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

              {/* Nouveau mot de passe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPasswords.nouveau ? 'text' : 'password'}
                    value={passwordForm.nouveauMotDePasse}
                    onChange={(e) => setPasswordForm({ ...passwordForm, nouveauMotDePasse: e.target.value })}
                    className="w-full pl-10 pr-12 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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

              {/* Confirmation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer le nouveau mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPasswords.confirmation ? 'text' : 'password'}
                    value={passwordForm.confirmationMotDePasse}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmationMotDePasse: e.target.value })}
                    className={`w-full pl-10 pr-12 py-2.5 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      passwordForm.confirmationMotDePasse &&
                      passwordForm.confirmationMotDePasse !== passwordForm.nouveauMotDePasse
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200'
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
                {passwordForm.confirmationMotDePasse &&
                 passwordForm.confirmationMotDePasse !== passwordForm.nouveauMotDePasse && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <X className="w-3 h-3" />
                    Les mots de passe ne correspondent pas
                  </p>
                )}
                {passwordForm.confirmationMotDePasse &&
                 passwordForm.confirmationMotDePasse === passwordForm.nouveauMotDePasse && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Les mots de passe correspondent
                  </p>
                )}
              </div>

              {/* Conseils */}
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex gap-3">
                  <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Conseils de sécurité</p>
                    <ul className="mt-2 text-xs text-amber-700 space-y-1">
                      <li>• Au moins 8 caractères</li>
                      <li>• Mélangez majuscules, minuscules et chiffres</li>
                      <li>• Incluez des caractères spéciaux (@, #, !, etc.)</li>
                      <li>• Évitez les mots du dictionnaire</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingPassword || passwordForm.nouveauMotDePasse !== passwordForm.confirmationMotDePasse}
                  className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingPassword ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Modification...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Changer le mot de passe
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfilePage;
