/**
 * Settings Context - VERSION CORRIGÉE
 * @description Contexte React pour les paramètres globaux du site
 * 
 * ✅ CORRECTION: Mapping correct des noms de propriétés entre API et frontend
 * - L'API utilise: fraisLivraisonStandard, seuilFrancoPort, delaiLivraisonMin/Max
 * - Le frontend utilise: fraisStandard, seuilFranco, delaiMin/Max
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

// ==========================================
// CONTEXTE
// ==========================================

const SettingsContext = createContext(null);

// ==========================================
// VALEURS PAR DÉFAUT
// ==========================================

const DEFAULT_SETTINGS = {
  site: {
    nom: 'Jana Distribution',
    description: 'Grossiste alimentaire',
    email: 'contact@jana-distribution.fr',
    telephone: '01 23 45 67 89',
    adresse: '',
    codePostal: '',
    ville: '',
    siret: ''
  },
  livraison: {
    fraisStandard: 15,
    seuilFranco: 150,
    delaiMin: 2,
    delaiMax: 5
  },
  commande: {
    montantMin: 0,
    produitsParPage: 12
  }
};

// Durée du cache en millisecondes (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// ==========================================
// PROVIDER
// ==========================================

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==========================================
  // CHARGEMENT DES SETTINGS
  // ==========================================

  const loadSettings = useCallback(async (forceRefresh = false) => {
    try {
      // Vérifier le cache localStorage
      if (!forceRefresh) {
        const cached = localStorage.getItem('app_settings');
        const cachedTimestamp = localStorage.getItem('app_settings_timestamp');
        
        if (cached && cachedTimestamp) {
          const age = Date.now() - parseInt(cachedTimestamp, 10);
          if (age < CACHE_DURATION) {
            setSettings(JSON.parse(cached));
            setLoading(false);
            return;
          }
        }
      }

      // Charger depuis l'API
      const response = await api.get('/settings/public');
      
      if (response.data.success && response.data.data) {
        const newSettings = response.data.data;
        
        // ✅ CORRECTION: Mapper les noms de l'API vers les noms internes
        // L'API peut retourner soit les noms "admin" soit les noms "frontend"
        const livraisonData = newSettings.livraison || newSettings.delivery || {};
        const siteData = newSettings.site || newSettings.general || {};
        const commandeData = newSettings.commande || newSettings.orders || {};
        
        const mappedLivraison = {
          fraisStandard: livraisonData.fraisLivraisonStandard ?? livraisonData.fraisStandard ?? DEFAULT_SETTINGS.livraison.fraisStandard,
          seuilFranco: livraisonData.seuilFrancoPort ?? livraisonData.seuilFranco ?? DEFAULT_SETTINGS.livraison.seuilFranco,
          delaiMin: livraisonData.delaiLivraisonMin ?? livraisonData.delaiMin ?? DEFAULT_SETTINGS.livraison.delaiMin,
          delaiMax: livraisonData.delaiLivraisonMax ?? livraisonData.delaiMax ?? DEFAULT_SETTINGS.livraison.delaiMax
        };

        const mappedSite = {
          nom: siteData.nomSite ?? siteData.nom ?? DEFAULT_SETTINGS.site.nom,
          description: siteData.description ?? DEFAULT_SETTINGS.site.description,
          email: siteData.email ?? DEFAULT_SETTINGS.site.email,
          telephone: siteData.telephone ?? DEFAULT_SETTINGS.site.telephone,
          adresse: siteData.adresse ?? DEFAULT_SETTINGS.site.adresse,
          codePostal: siteData.codePostal ?? DEFAULT_SETTINGS.site.codePostal,
          ville: siteData.ville ?? DEFAULT_SETTINGS.site.ville,
          siret: siteData.siret ?? DEFAULT_SETTINGS.site.siret
        };

        const mappedCommande = {
          montantMin: commandeData.montantMinCommande ?? commandeData.montantMin ?? DEFAULT_SETTINGS.commande.montantMin,
          produitsParPage: commandeData.nombreProduitsParPage ?? commandeData.produitsParPage ?? DEFAULT_SETTINGS.commande.produitsParPage
        };

        // Fusionner avec les valeurs par défaut
        const mergedSettings = {
          site: mappedSite,
          livraison: mappedLivraison,
          commande: mappedCommande
        };

        console.log('✅ Settings chargés:', mergedSettings); // Debug

        setSettings(mergedSettings);
        
        // Mettre en cache
        localStorage.setItem('app_settings', JSON.stringify(mergedSettings));
        localStorage.setItem('app_settings_timestamp', Date.now().toString());
      }
    } catch (err) {
      console.error('Erreur chargement settings:', err);
      setError(err.message);
      // Garder les valeurs par défaut en cas d'erreur
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger au montage
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // ==========================================
  // HELPERS
  // ==========================================

  /**
   * Calcule les frais de livraison pour un montant donné
   * @param {number} montant - Montant TTC de la commande
   * @returns {number} Frais de livraison (0 si franco atteint)
   */
  const getFraisLivraison = useCallback((montant) => {
    const seuilFranco = settings.livraison?.seuilFranco ?? DEFAULT_SETTINGS.livraison.seuilFranco;
    const fraisStandard = settings.livraison?.fraisStandard ?? DEFAULT_SETTINGS.livraison.fraisStandard;

    if (montant >= seuilFranco) {
      return 0;
    }
    return fraisStandard;
  }, [settings.livraison]);

  /**
   * Vérifie si le montant minimum est atteint
   * @param {number} montant - Montant TTC de la commande
   * @returns {boolean}
   */
  const isMontantMinAtteint = useCallback((montant) => {
    const montantMin = settings.commande?.montantMin ?? 0;
    return montant >= montantMin;
  }, [settings.commande]);

  /**
   * Force le rechargement des settings
   */
  const refreshSettings = useCallback(() => {
    // Invalider le cache
    localStorage.removeItem('app_settings');
    localStorage.removeItem('app_settings_timestamp');
    setLoading(true);
    loadSettings(true);
  }, [loadSettings]);

  // ==========================================
  // VALEUR DU CONTEXTE
  // ==========================================

  const value = {
    // Données brutes
    settings,
    loading,
    error,

    // Sections
    site: settings.site,
    livraison: settings.livraison,
    commande: settings.commande,

    // Raccourcis utiles
    nomSite: settings.site?.nom || DEFAULT_SETTINGS.site.nom,
    emailSite: settings.site?.email || DEFAULT_SETTINGS.site.email,
    telephoneSite: settings.site?.telephone || DEFAULT_SETTINGS.site.telephone,
    
    // Livraison
    fraisLivraisonStandard: settings.livraison?.fraisStandard ?? DEFAULT_SETTINGS.livraison.fraisStandard,
    seuilFrancoPort: settings.livraison?.seuilFranco ?? DEFAULT_SETTINGS.livraison.seuilFranco,
    
    // Commande
    montantMinCommande: settings.commande?.montantMin ?? DEFAULT_SETTINGS.commande.montantMin,
    produitsParPage: settings.commande?.produitsParPage ?? DEFAULT_SETTINGS.commande.produitsParPage,

    // Helpers
    getFraisLivraison,
    isMontantMinAtteint,
    refreshSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

// ==========================================
// HOOK
// ==========================================

export const useSettings = () => {
  const context = useContext(SettingsContext);
  
  if (!context) {
    throw new Error('useSettings doit être utilisé dans un SettingsProvider');
  }
  
  return context;
};

export default SettingsContext;