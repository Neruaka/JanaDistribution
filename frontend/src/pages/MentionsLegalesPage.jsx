/**
 * Mentions Légales
 * @description Page des mentions légales de Jana Distribution
 * @location frontend/src/pages/MentionsLegalesPage.jsx
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, Globe, Server, FileText, Scale,
  Camera, Link2, AlertCircle, Shield, MapPin, Phone, Mail
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import LegalPageLayout from '../components/LegalPageLayout';

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
          <div className="bg-sand-100 border border-sand-200 rounded-6 p-4 flex flex-col gap-2">
            <p><strong>Raison sociale :</strong> {site.nom}</p>
            {site.siret && <p><strong>SIRET :</strong> {site.siret}</p>}
            <p><strong>Forme juridique :</strong> Société par actions simplifiée (SAS)</p>
            <p><strong>Activité :</strong> Commerce de gros alimentaire, distribution de produits alimentaires</p>
            {site.adresse && (
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-graphite-400 mt-1 flex-shrink-0" />
                <span><strong>Siège social :</strong> {site.adresse}, {site.codePostal} {site.ville}</span>
              </p>
            )}
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-graphite-400 flex-shrink-0" />
              <span><strong>Téléphone :</strong>{' '}
                <a href={`tel:${site.telephone?.replace(/\s/g, '')}`} className="text-green-700 hover:text-green-800 underline">
                  {site.telephone}
                </a>
              </span>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-graphite-400 flex-shrink-0" />
              <span><strong>Email :</strong>{' '}
                <a href={`mailto:${site.email}`} className="text-green-700 hover:text-green-800 underline">
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
          <div className="bg-sand-100 border border-sand-200 rounded-6 p-4 flex flex-col gap-1">
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
            <Link to="/confidentialite" className="text-green-700 hover:text-green-800 underline">
              Politique de confidentialité
            </Link>.
          </p>
          <p>
            Conformément à la loi, vous disposez de droits sur vos données personnelles
            (accès, rectification, suppression, portabilité). Pour les exercer, contactez-nous
            à l'adresse :{' '}
            <a href={`mailto:${site.email}`} className="text-green-700 hover:text-green-800 underline">
              {site.email}
            </a>
          </p>
        </>
      )
    }
  ];

  return (
    <LegalPageLayout
      icon={FileText}
      title="Mentions légales"
      subtitle={`Informations légales relatives au site ${site.nom}`}
      intro={!loading && (
        <>
          <p className="text-[13.5px] font-semibold text-success-text">{site.nom}</p>
          <p className="text-[13px] text-graphite-700">
            {site.siret && <>SIRET : {site.siret} · </>}
            {site.adresse && <>{site.adresse}, {site.codePostal} {site.ville}</>}
          </p>
          <p className="text-[13px] text-graphite-700">Email : {site.email} · Tél : {site.telephone}</p>
        </>
      )}
      sections={sections}
      footerLinks={[
        { to: '/cgv', label: 'CGV' },
        { to: '/confidentialite', label: 'Confidentialité' },
        { to: '/accessibilite', label: 'Accessibilité' }
      ]}
    />
  );
};

export default MentionsLegalesPage;
