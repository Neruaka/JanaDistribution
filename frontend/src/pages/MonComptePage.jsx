/**
 * Page Mon Compte - REFACTORISÉE
 * @description Gestion du profil utilisateur avec composants modulaires
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { User, MapPin, Lock, Bell, Package, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Composants
import {
  ProfilHeader,
  TabProfil,
  TabAdresses,
  TabSecurite,
  TabPreferences,
  DeleteAccountModal
} from '../components/mon-compte';

// ==========================================
// CONFIGURATION ONGLETS
// ==========================================

const TABS = [
  { id: 'profil', label: 'Mon profil', icon: User },
  { id: 'adresses', label: 'Adresses', icon: MapPin },
  { id: 'securite', label: 'Sécurité', icon: Lock },
  { id: 'preferences', label: 'Préférences', icon: Bell }
];

// ==========================================
// COMPOSANT PRINCIPAL
// ==========================================

const MonComptePage = () => {
  const { user, updateProfile, changePassword, logout } = useAuth();

  // Onglet actif
  const [activeTab, setActiveTab] = useState('profil');
  
  // Modal suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Mon compte</h1>
          <p className="text-gray-500 mt-1">Gérez vos informations personnelles et préférences</p>
        </div>

        {/* Carte profil rapide */}
        <ProfilHeader user={user} />

        {/* Navigation onglets + contenu */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {TABS.map((tab) => {
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
              {activeTab === 'profil' && (
                <TabProfil 
                  key="profil"
                  user={user} 
                  updateProfile={updateProfile} 
                />
              )}

              {activeTab === 'adresses' && (
                <TabAdresses 
                  key="adresses"
                  userId={user?.id} 
                />
              )}

              {activeTab === 'securite' && (
                <TabSecurite 
                  key="securite"
                  changePassword={changePassword} 
                />
              )}

              {activeTab === 'preferences' && (
                <TabPreferences 
                  key="preferences"
                  user={user}
                  updateProfile={updateProfile}
                  onOpenDeleteModal={() => setShowDeleteModal(true)}
                />
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
      <DeleteAccountModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        logout={logout}
      />
    </div>
  );
};

export default MonComptePage;
