/**
 * Déclaration d'Accessibilité
 * @description Page d'accessibilité RGAA de Jana Distribution
 * @location frontend/src/pages/AccessibilitePage.jsx
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Eye, Keyboard, Monitor, Smartphone,
  CheckCircle, AlertCircle, Mail, Settings
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: 'easeOut' }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08
    }
  }
};

const AccessibilitePage = () => {
  const { site, loading } = useSettings();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      icon: Eye,
      title: '1. Engagement d\'accessibilité',
      content: (
        <>
          <p>
            <strong>{site.nom}</strong> s'engage à rendre son site internet accessible
            conformément à l'article 47 de la loi n°2005-102 du 11 février 2005 pour
            l'égalité des droits et des chances, la participation et la citoyenneté
            des personnes handicapées.
          </p>
          <p>
            Cette déclaration d'accessibilité s'applique au site de commerce en ligne
            de <strong>{site.nom}</strong>. Nous nous efforçons de rendre l'ensemble
            de nos contenus et services accessibles au plus grand nombre, conformément
            au Référentiel Général d'Amélioration de l'Accessibilité (RGAA) version 4.1.
          </p>
        </>
      )
    },
    {
      icon: CheckCircle,
      title: '2. État de conformité',
      content: (
        <>
          <p>
            Le site de <strong>{site.nom}</strong> est en <strong>conformité partielle</strong> avec
            le RGAA 4.1. Nous travaillons activement à l'amélioration de l'accessibilité
            de notre site.
          </p>
          <p><strong>Points de conformité :</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Structure sémantique HTML5 (titres, listes, sections)</li>
            <li>Textes alternatifs sur les images de produits</li>
            <li>Contrastes de couleurs respectant les ratios WCAG AA</li>
            <li>Navigation cohérente et prévisible</li>
            <li>Formulaires avec étiquettes associées</li>
            <li>Site responsive adapté à toutes les tailles d'écran</li>
            <li>Focus visible sur les éléments interactifs</li>
          </ul>
        </>
      )
    },
    {
      icon: AlertCircle,
      title: '3. Contenus non accessibles',
      content: (
        <>
          <p>
            Les contenus suivants ne sont pas encore pleinement accessibles et font l'objet
            d'améliorations en cours :
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Images décoratives :</strong> certaines images décoratives peuvent
              ne pas avoir d'attribut alt vide approprié
            </li>
            <li>
              <strong>Documents PDF :</strong> certains documents téléchargeables (factures)
              peuvent ne pas être entièrement accessibles
            </li>
            <li>
              <strong>Animations :</strong> certaines animations ne disposent pas encore
              d'un mécanisme de pause (préférence de mouvement réduit partiellement prise en charge)
            </li>
            <li>
              <strong>Graphiques :</strong> les graphiques de l'espace d'administration
              peuvent manquer de descriptions alternatives textuelles
            </li>
          </ul>
          <p>
            Ces non-conformités sont identifiées et leur correction est planifiée dans
            notre feuille de route d'accessibilité.
          </p>
        </>
      )
    },
    {
      icon: Monitor,
      title: '4. Technologies utilisées',
      content: (
        <>
          <p>Le site utilise les technologies suivantes :</p>
          <ul className="list-disc list-inside space-y-1">
            <li>HTML5 (structure sémantique)</li>
            <li>CSS3 / Tailwind CSS (mise en forme et responsive design)</li>
            <li>JavaScript / React (interactions et composants dynamiques)</li>
            <li>WAI-ARIA (attributs d'accessibilité pour les composants dynamiques)</li>
          </ul>
          <p>
            Le site a été conçu avec une approche « mobile-first » garantissant une expérience
            optimale sur tous les appareils, des smartphones aux écrans de bureau.
          </p>
        </>
      )
    },
    {
      icon: Keyboard,
      title: '5. Navigation au clavier',
      content: (
        <>
          <p>Le site est navigable entièrement au clavier :</p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Tab :</strong> naviguer vers l'élément interactif suivant
            </li>
            <li>
              <strong>Maj + Tab :</strong> revenir à l'élément précédent
            </li>
            <li>
              <strong>Entrée :</strong> activer un lien ou un bouton
            </li>
            <li>
              <strong>Espace :</strong> cocher/décocher une case, activer un bouton
            </li>
            <li>
              <strong>Échap :</strong> fermer les menus déroulants et les modales
            </li>
          </ul>
          <p>
            Un indicateur de focus visible est affiché sur tous les éléments interactifs
            pour faciliter la navigation au clavier.
          </p>
        </>
      )
    },
    {
      icon: Smartphone,
      title: '6. Compatibilité',
      content: (
        <>
          <p>Le site a été testé et est compatible avec :</p>
          <p><strong>Navigateurs :</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Google Chrome (dernières versions)</li>
            <li>Mozilla Firefox (dernières versions)</li>
            <li>Microsoft Edge (dernières versions)</li>
            <li>Safari (dernières versions)</li>
          </ul>
          <p className="mt-2"><strong>Technologies d'assistance :</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>NVDA (Windows)</li>
            <li>VoiceOver (macOS / iOS)</li>
            <li>TalkBack (Android)</li>
          </ul>
        </>
      )
    },
    {
      icon: Settings,
      title: '7. Améliorations prévues',
      content: (
        <>
          <p>
            <strong>{site.nom}</strong> s'engage à poursuivre ses efforts en matière
            d'accessibilité. Les améliorations suivantes sont planifiées :
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Audit complet d'accessibilité RGAA 4.1</li>
            <li>Ajout d'un mode de contraste élevé</li>
            <li>Support complet de la préférence de mouvement réduit (prefers-reduced-motion)</li>
            <li>Amélioration de l'accessibilité des graphiques (tableaux de données alternatifs)</li>
            <li>Accessibilité des documents PDF générés (factures, bons de livraison)</li>
            <li>Formation continue de l'équipe aux bonnes pratiques d'accessibilité</li>
          </ul>
        </>
      )
    },
    {
      icon: Mail,
      title: '8. Contact et voies de recours',
      content: (
        <>
          <p>
            Si vous rencontrez un problème d'accessibilité sur notre site, nous vous invitons
            à nous contacter afin que nous puissions vous apporter une assistance et travailler
            à la résolution du problème :
          </p>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p>
              <strong>Email :</strong>{' '}
              <a href={`mailto:${site.email}`} className="text-green-600 hover:text-green-700 underline">
                {site.email}
              </a>
            </p>
            <p>
              <strong>Téléphone :</strong>{' '}
              <a href={`tel:${site.telephone?.replace(/\s/g, '')}`} className="text-green-600 hover:text-green-700 underline">
                {site.telephone}
              </a>
            </p>
          </div>
          <p>
            Nous nous engageons à répondre à votre demande dans un délai raisonnable
            et à vous proposer une solution adaptée.
          </p>
          <p className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <strong>Voie de recours :</strong> Si vous constatez un défaut d'accessibilité
            vous empêchant d'accéder à un contenu ou une fonctionnalité du site et que vous
            n'obtenez pas de réponse satisfaisante, vous pouvez saisir le Défenseur des droits
            par le formulaire en ligne sur <strong>www.defenseurdesdroits.fr</strong>, par
            courrier à : Défenseur des droits, Libre réponse 71120, 75342 Paris CEDEX 07,
            ou par téléphone au 09 69 39 00 00.
          </p>
        </>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-green-600 to-emerald-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-6">
              <Users className="w-8 h-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              Déclaration d'Accessibilité
            </h1>
            <p className="text-green-100 max-w-2xl mx-auto">
              Notre engagement pour un site accessible à tous
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contenu */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Carte info entreprise */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-8"
          >
            <p className="text-green-800 font-medium">{site.nom}</p>
            <p className="text-green-700 text-sm">
              Référentiel : RGAA 4.1 | Conformité partielle
            </p>
            <p className="text-green-700 text-sm">
              Contact : {site.email}
            </p>
          </motion.div>
        )}

        {/* Sections */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="space-y-6"
        >
          {sections.map((section, index) => (
            <motion.section
              key={index}
              variants={fadeInUp}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-xl">
                  <section.icon className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
              </div>
              <div className="text-gray-600 leading-relaxed space-y-3">
                {section.content}
              </div>
            </motion.section>
          ))}
        </motion.div>

        {/* Footer navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center text-sm text-gray-400"
        >
          <p>Dernière mise à jour : février 2025</p>
          <div className="mt-4 flex justify-center gap-6 flex-wrap">
            <Link to="/cgv" className="hover:text-green-600 transition-colors">CGV</Link>
            <Link to="/confidentialite" className="hover:text-green-600 transition-colors">Confidentialité</Link>
            <Link to="/mentions-legales" className="hover:text-green-600 transition-colors">Mentions légales</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AccessibilitePage;
