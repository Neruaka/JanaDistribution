/**
 * Mentions Légales
 * @description Page des mentions légales de Jana Distribution
 * @location frontend/src/pages/MentionsLegalesPage.jsx
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2, Globe, Server, FileText, Scale,
  Camera, Link2, AlertCircle, Shield, MapPin, Phone, Mail
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

const MentionsLegalesPage = () => {
  const { site, loading } = useSettings();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      icon: Building2,
      title: '1. Éditeur du site',
      content: (
        <>
          <p>Le présent site est édité par :</p>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p><strong>Raison sociale :</strong> {site.nom}</p>
            {site.siret && <p><strong>SIRET :</strong> {site.siret}</p>}
            <p><strong>Forme juridique :</strong> Société par actions simplifiée (SAS)</p>
            <p><strong>Activité :</strong> Commerce de gros alimentaire, distribution de produits alimentaires</p>
            {site.adresse && (
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
                <span><strong>Siège social :</strong> {site.adresse}, {site.codePostal} {site.ville}</span>
              </p>
            )}
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span><strong>Téléphone :</strong>{' '}
                <a href={`tel:${site.telephone?.replace(/\s/g, '')}`} className="text-green-600 hover:text-green-700 underline">
                  {site.telephone}
                </a>
              </span>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span><strong>Email :</strong>{' '}
                <a href={`mailto:${site.email}`} className="text-green-600 hover:text-green-700 underline">
                  {site.email}
                </a>
              </span>
            </p>
          </div>
          <p>
            Directeur de la publication : le représentant légal de <strong>{site.nom}</strong>.
          </p>
        </>
      )
    },
    {
      icon: Server,
      title: '2. Hébergement',
      content: (
        <>
          <p>Le site est hébergé par :</p>
          <div className="bg-gray-50 rounded-xl p-4 space-y-1">
            <p><strong>Hébergeur :</strong> Prestataire d'hébergement web</p>
            <p><strong>Localisation des serveurs :</strong> France / Union Européenne</p>
          </div>
          <p>
            L'hébergeur assure la continuité de service et la sécurité des données
            conformément aux obligations légales en vigueur.
          </p>
        </>
      )
    },
    {
      icon: Globe,
      title: '3. Activité',
      content: (
        <>
          <p>
            <strong>{site.nom}</strong> est un grossiste alimentaire spécialisé dans la distribution
            de produits alimentaires frais, secs et surgelés à destination des professionnels
            de la restauration et des particuliers.
          </p>
          <p>
            Notre activité comprend :
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>La vente en gros et demi-gros de produits alimentaires</li>
            <li>La vente au détail via notre site de commerce en ligne</li>
            <li>La livraison de commandes en France métropolitaine</li>
            <li>Le conseil et l'accompagnement des professionnels de la restauration</li>
          </ul>
        </>
      )
    },
    {
      icon: Scale,
      title: '4. Propriété intellectuelle',
      content: (
        <>
          <p>
            L'ensemble du contenu du site (textes, images, graphismes, logo, icônes,
            vidéos, base de données, structure) est protégé par les dispositions du Code
            de la propriété intellectuelle et appartient à <strong>{site.nom}</strong> ou fait
            l'objet d'une autorisation d'utilisation.
          </p>
          <p>
            Toute reproduction, représentation, modification, publication ou adaptation de tout
            ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé,
            est interdite sans l'autorisation écrite préalable de <strong>{site.nom}</strong>.
          </p>
          <p>
            Toute exploitation non autorisée du site ou de son contenu sera considérée comme
            constitutive d'une contrefaçon et poursuivie conformément aux dispositions des
            articles L.335-2 et suivants du Code de la propriété intellectuelle.
          </p>
        </>
      )
    },
    {
      icon: Camera,
      title: '5. Crédits et médias',
      content: (
        <>
          <p>
            Les photographies de produits présentées sur le site sont fournies à titre indicatif.
            L'apparence réelle des produits peut différer légèrement des visuels présentés
            (emballage, taille, couleur).
          </p>
          <p>
            Les images utilisées sur le site sont la propriété de <strong>{site.nom}</strong> ou
            sont utilisées sous licence. Toute reproduction est interdite sans autorisation.
          </p>
        </>
      )
    },
    {
      icon: Link2,
      title: '6. Liens hypertextes',
      content: (
        <>
          <p>
            Le site peut contenir des liens vers d'autres sites internet.
            <strong> {site.nom}</strong> n'exerce aucun contrôle sur le contenu de ces sites tiers
            et décline toute responsabilité quant à leur contenu ou aux éventuels dommages
            pouvant résulter de leur utilisation.
          </p>
          <p>
            La mise en place de liens hypertextes vers le site de <strong>{site.nom}</strong> est
            autorisée sans demande préalable, à condition que ces liens n'aient pas un caractère
            trompeur et qu'ils ne portent pas atteinte aux intérêts de <strong>{site.nom}</strong>.
          </p>
        </>
      )
    },
    {
      icon: AlertCircle,
      title: '7. Limitation de responsabilité',
      content: (
        <>
          <p>
            <strong>{site.nom}</strong> s'efforce de fournir sur le site des informations aussi
            précises que possible. Toutefois, l'entreprise ne pourra être tenue responsable des
            omissions, inexactitudes ou carences dans la mise à jour, qu'elles soient de son fait
            ou du fait de tiers partenaires.
          </p>
          <p>
            <strong>{site.nom}</strong> ne pourra être tenue responsable :
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Des interruptions temporaires du site pour maintenance ou mise à jour</li>
            <li>Des dommages résultant d'une intrusion frauduleuse d'un tiers</li>
            <li>De l'impossibilité temporaire d'accéder au site en raison de problèmes techniques</li>
            <li>Des dommages directs ou indirects causés au matériel de l'utilisateur lors de l'accès au site</li>
          </ul>
        </>
      )
    },
    {
      icon: Shield,
      title: '8. Protection des données personnelles',
      content: (
        <>
          <p>
            Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi
            Informatique et Libertés, <strong>{site.nom}</strong> s'engage à protéger les données
            personnelles de ses utilisateurs.
          </p>
          <p>
            Pour connaître en détail notre politique en matière de collecte, traitement et
            protection des données personnelles, veuillez consulter notre{' '}
            <Link to="/confidentialite" className="text-green-600 hover:text-green-700 underline">
              Politique de confidentialité
            </Link>.
          </p>
          <p>
            Conformément à la loi, vous disposez de droits sur vos données personnelles
            (accès, rectification, suppression, portabilité). Pour les exercer, contactez-nous
            à l'adresse :{' '}
            <a href={`mailto:${site.email}`} className="text-green-600 hover:text-green-700 underline">
              {site.email}
            </a>
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
              <FileText className="w-8 h-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              Mentions Légales
            </h1>
            <p className="text-green-100 max-w-2xl mx-auto">
              Informations légales relatives au site {site.nom}
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
              {site.siret && <>SIRET : {site.siret} | </>}
              {site.adresse && <>{site.adresse}, {site.codePostal} {site.ville}</>}
            </p>
            <p className="text-green-700 text-sm">
              Email : {site.email} | Tél : {site.telephone}
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
            <Link to="/accessibilite" className="hover:text-green-600 transition-colors">Accessibilité</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MentionsLegalesPage;
