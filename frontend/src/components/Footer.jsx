/**
 * Composant Footer Dynamique
 * @description Pied de page public — fond encre, 5 colonnes
 * @location frontend/src/components/Footer.jsx
 * @see design_handoff_jana_refonte/JanaFooter.dc.html
 */

import { Link } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';

const FooterLink = ({ to, children }) => (
  <Link to={to} className="text-[13.5px] text-mist hover:text-white transition-colors">
    {children}
  </Link>
);

// Libellé du design sans page correspondante dans le dépôt — affiché mais inerte
const FooterStub = ({ children }) => (
  <span className="text-[13.5px] text-mist-3 cursor-default">{children}</span>
);

const Footer = () => {
  const { site, loading } = useSettings();
  const { isAuthenticated } = useAuth();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-ink-900 text-mist font-sans">
      <div className="px-4 md:px-10 pt-10 md:pt-12 pb-6 max-w-[1440px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr] gap-8 md:gap-11">

          {/* Colonne 1 : marque */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-3.5">
            <div className="flex items-center gap-[11px]">
              <div className="w-[30px] h-[30px] rounded-6 bg-green-700 flex items-center justify-center text-white font-display font-extrabold text-[15px]">
                J
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display font-extrabold text-[17px] text-white tracking-tight">JANA</span>
                <span className="text-[9px] tracking-widest text-mist-3 mt-[3px]">DISTRIBUTION</span>
              </div>
            </div>
            <p className="text-[13px] leading-relaxed text-mist-2 max-w-[280px]">
              {loading ? (
                <span className="h-16 block bg-ink-800 rounded animate-pulse" />
              ) : (
                site.description || 'Grossiste alimentaire multi-rayons. Nous livrons restaurateurs, commerces et particuliers en Île-de-France depuis notre entrepôt de Rungis.'
              )}
            </p>
            <div className="flex gap-2 flex-wrap">
              <span className="border border-[#2C4A3B] rounded-4 px-[10px] py-[5px] text-[11.5px] font-mono">Agrément CE FR-94-046</span>
              <span className="border border-[#2C4A3B] rounded-4 px-[10px] py-[5px] text-[11.5px] font-mono">HACCP</span>
            </div>
          </div>

          {/* Colonne 2 : Acheter */}
          <div className="flex flex-col gap-[11px]">
            <div className="text-[11px] tracking-wide text-mist-4 uppercase">Acheter</div>
            <FooterLink to="/catalogue">Tout le catalogue</FooterLink>
            <FooterLink to="/catalogue?orderBy=createdAt&orderDir=DESC">Arrivages du jour</FooterLink>
            <FooterLink to="/catalogue?labels=PROMO">Promotions</FooterLink>
            <FooterStub>Commande express</FooterStub>
          </div>

          {/* Colonne 3 : Mon compte */}
          <div className="flex flex-col gap-[11px]">
            <div className="text-[11px] tracking-wide text-mist-4 uppercase">Mon compte</div>
            <FooterLink to="/mes-commandes">Mes commandes</FooterLink>
            <FooterLink to="/mes-listes-recurrentes">Mes listes récurrentes</FooterLink>
            <FooterLink to="/mon-compte">Adresses de livraison</FooterLink>
          </div>

          {/* Colonne 4 : Infos */}
          <div className="flex flex-col gap-[11px]">
            <div className="text-[11px] tracking-wide text-mist-4 uppercase">Infos</div>
            <FooterLink to="/livraison">Livraison</FooterLink>
            {!isAuthenticated && <FooterLink to="/register?type=PROFESSIONNEL">Ouvrir un compte pro</FooterLink>}
            <FooterLink to="/cgv">CGV</FooterLink>
            <FooterLink to="/mentions-legales">Mentions légales</FooterLink>
          </div>

          {/* Colonne 5 : Service client */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-3">
            <div className="text-[11px] tracking-wide text-mist-4 uppercase">Service client</div>
            {loading ? (
              <span className="h-5 w-32 bg-ink-800 rounded animate-pulse" />
            ) : (
              <a href={`tel:${site.telephone?.replace(/\s/g, '')}`} className="font-mono text-[18px] text-white">
                {site.telephone}
              </a>
            )}
            <div className="text-[12.5px] text-mist-2 leading-relaxed">
              Du lundi au samedi, 6 h – 18 h
              <br />
              {loading ? (
                <span className="inline-block h-4 w-40 bg-ink-800 rounded animate-pulse mt-1" />
              ) : (
                <a href={`mailto:${site.email}`} className="hover:text-white transition-colors">{site.email}</a>
              )}
            </div>
            <div className="bg-ink-700 border border-[#2C4A3B] rounded-6 px-3.5 py-3">
              <div className="text-[12.5px] text-white font-semibold mb-0.5">Prochaine tournée</div>
              <div className="text-[12.5px] text-mist-2">Commandez avant 18 h pour être livré demain</div>
            </div>
          </div>
        </div>

        {/* Barre légale */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 mt-9 pt-[18px] border-t border-ink-600 text-[12px] text-mist-4">
          <span>© {currentYear} {site.nom}{site.siret ? ` — SIRET ${site.siret}` : ''}</span>
          <div className="flex gap-5">
            <FooterLink to="/confidentialite">Confidentialité</FooterLink>
            <FooterLink to="/accessibilite">Accessibilité</FooterLink>
            <FooterLink to="/confidentialite">Cookies</FooterLink>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
