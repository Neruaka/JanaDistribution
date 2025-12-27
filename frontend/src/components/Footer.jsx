/**
 * Composant Footer Dynamique
 * @description Footer du site avec informations depuis les settings
 * @location frontend/src/components/Footer.jsx
 * 
 * ✅ Utilise SettingsContext pour les données dynamiques
 */

import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

const Footer = () => {
  const { site, livraison, loading } = useSettings();

  // Année courante
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Colonne 1: Logo et description */}
          <div>
            <div className="flex items-center gap-2 text-white text-lg font-bold mb-4">
              <span className="text-2xl">🥬</span>
              {loading ? (
                <span className="h-6 w-32 bg-gray-700 rounded animate-pulse"></span>
              ) : (
                site.nom
              )}
            </div>
            <p className="text-sm leading-relaxed">
              {loading ? (
                <span className="h-16 block bg-gray-700 rounded animate-pulse"></span>
              ) : (
                site.description || 'Votre partenaire alimentaire de confiance. Produits frais et de qualité pour tous.'
              )}
            </p>
            
            {/* Infos livraison */}
            <div className="mt-4 p-3 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                <Clock className="w-4 h-4" />
                Livraison {livraison.delaiMin}-{livraison.delaiMax} jours
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Gratuite dès {livraison.seuilFranco}€ d'achat
              </p>
            </div>
          </div>
          
          {/* Colonne 2: Navigation */}
          <div>
            <h4 className="text-white font-semibold mb-4">Navigation</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/catalogue" className="hover:text-white transition-colors">
                  Catalogue
                </Link>
              </li>
              <li>
                <Link to="/categories" className="hover:text-white transition-colors">
                  Catégories
                </Link>
              </li>
              <li>
                <Link to="/promotions" className="hover:text-white transition-colors">
                  Promotions
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Colonne 3: Mon compte */}
          <div>
            <h4 className="text-white font-semibold mb-4">Mon compte</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Connexion
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition-colors">
                  Inscription
                </Link>
              </li>
              <li>
                <Link to="/mes-commandes" className="hover:text-white transition-colors">
                  Mes commandes
                </Link>
              </li>
              <li>
                <Link to="/mon-compte" className="hover:text-white transition-colors">
                  Mon profil
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Colonne 4: Contact (dynamique) */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              {loading ? (
                <>
                  <li className="h-4 bg-gray-700 rounded animate-pulse"></li>
                  <li className="h-4 bg-gray-700 rounded animate-pulse"></li>
                  <li className="h-4 bg-gray-700 rounded animate-pulse"></li>
                </>
              ) : (
                <>
                  <li className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      {site.adresse}<br />
                      {site.codePostal} {site.ville}
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <a href={`tel:${site.telephone?.replace(/\s/g, '')}`} className="hover:text-white transition-colors">
                      {site.telephone}
                    </a>
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <a href={`mailto:${site.email}`} className="hover:text-white transition-colors">
                      {site.email}
                    </a>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
        
        {/* Barre du bas */}
        <div className="border-t border-gray-800 mt-10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>
              © {currentYear} {site.nom} - SIRET {site.siret}
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link to="/cgv" className="hover:text-white transition-colors">
                CGV
              </Link>
              <Link to="/confidentialite" className="hover:text-white transition-colors">
                Confidentialité
              </Link>
              <Link to="/mentions-legales" className="hover:text-white transition-colors">
                Mentions légales
              </Link>
              <Link to="/accessibilite" className="hover:text-white transition-colors">
                Accessibilité
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
