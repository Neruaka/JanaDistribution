/**
 * Politique de Confidentialité
 * @description Page de politique de confidentialité RGPD de Jana Distribution
 * @location frontend/src/pages/ConfidentialitePage.jsx
 */

import { useEffect } from 'react';
import {
  Shield, Database, UserCheck, Lock, Cookie, Eye,
  Clock, FileText, Globe, Server
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import LegalPageLayout from '../components/LegalPageLayout';

const ConfidentialitePage = () => {
  const { site, loading } = useSettings();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      icon: Shield,
      title: '1. Introduction',
      content: (
        <>
          <p>
            <strong>{site.nom}</strong> s'engage à protéger la vie privée de ses utilisateurs
            et à traiter leurs données personnelles dans le respect du Règlement Général sur la
            Protection des Données (RGPD - Règlement UE 2016/679) et de la loi Informatique
            et Libertés du 6 janvier 1978 modifiée.
          </p>
          <p>
            La présente politique de confidentialité a pour objet d'informer les utilisateurs
            du site sur la manière dont leurs données personnelles sont collectées, traitées
            et protégées.
          </p>
        </>
      )
    },
    {
      icon: Database,
      title: '2. Données collectées',
      content: (
        <>
          <p>
            Dans le cadre de l'utilisation de notre site et de nos services, nous sommes amenés
            à collecter les catégories de données suivantes :
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Données d'identité :</strong> nom, prénom, raison sociale (pour les professionnels)</li>
            <li><strong>Données de contact :</strong> adresse email, numéro de téléphone, adresse postale</li>
            <li><strong>Données de commande :</strong> historique des achats, produits commandés, montants</li>
            <li><strong>Données de livraison :</strong> adresse de livraison, instructions de livraison</li>
            <li><strong>Données de navigation :</strong> adresse IP, type de navigateur, pages consultées</li>
            <li><strong>Données de compte :</strong> identifiant, mot de passe (hashé), préférences</li>
          </ul>
          <p className="bg-selection-bg border border-success-border rounded-6 p-4">
            <strong>Note importante :</strong> Nous ne stockons jamais vos données bancaires
            complètes. Les paiements sont traités par notre prestataire de paiement sécurisé,
            certifié PCI-DSS.
          </p>
        </>
      )
    },
    {
      icon: UserCheck,
      title: '3. Finalités du traitement',
      content: (
        <>
          <p>Vos données personnelles sont collectées et traitées pour les finalités suivantes :</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Gestion et suivi des commandes (préparation, livraison, facturation)</li>
            <li>Création et gestion de votre compte client</li>
            <li>Communication relative à vos commandes (confirmations, suivi)</li>
            <li>Envoi de newsletters et offres promotionnelles (avec votre consentement)</li>
            <li>Amélioration de nos services et de l'expérience utilisateur</li>
            <li>Respect de nos obligations légales et réglementaires</li>
            <li>Gestion des demandes de contact et du service après-vente</li>
          </ul>
        </>
      )
    },
    {
      icon: Lock,
      title: '4. Base légale du traitement',
      content: (
        <>
          <p>Le traitement de vos données repose sur les bases légales suivantes :</p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Exécution du contrat :</strong> traitement nécessaire à la gestion
              de vos commandes et à la fourniture de nos services
            </li>
            <li>
              <strong>Consentement :</strong> pour l'envoi de communications commerciales
              et le dépôt de cookies non essentiels
            </li>
            <li>
              <strong>Intérêt légitime :</strong> pour l'amélioration de nos services,
              la prévention de la fraude et la sécurité du site
            </li>
            <li>
              <strong>Obligation légale :</strong> pour la conservation des factures
              et documents comptables
            </li>
          </ul>
        </>
      )
    },
    {
      icon: Eye,
      title: '5. Destinataires des données',
      content: (
        <>
          <p>
            Vos données personnelles peuvent être communiquées aux destinataires suivants,
            dans la stricte mesure nécessaire à l'exécution des finalités décrites ci-dessus :
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Équipe interne :</strong> service commercial, logistique, service client</li>
            <li><strong>Prestataires de livraison :</strong> pour l'acheminement de vos commandes</li>
            <li><strong>Prestataire de paiement :</strong> pour le traitement sécurisé des paiements</li>
            <li><strong>Hébergeur :</strong> pour l'hébergement sécurisé du site et des données</li>
            <li><strong>Prestataire d'emailing :</strong> pour l'envoi des emails transactionnels</li>
          </ul>
          <p>
            Nous ne vendons ni ne louons vos données personnelles à des tiers.
          </p>
        </>
      )
    },
    {
      icon: Globe,
      title: '6. Transferts de données',
      content: (
        <>
          <p>
            Vos données personnelles sont hébergées en France et/ou au sein de l'Union Européenne.
          </p>
          <p>
            Dans le cas où un transfert de données hors de l'Union Européenne serait nécessaire
            (prestataires techniques), nous nous assurons que ce transfert est encadré par des
            garanties appropriées conformément au RGPD (clauses contractuelles types, décision
            d'adéquation de la Commission européenne).
          </p>
        </>
      )
    },
    {
      icon: Clock,
      title: '7. Durée de conservation',
      content: (
        <>
          <p>
            Vos données personnelles sont conservées pour une durée proportionnée aux finalités
            pour lesquelles elles sont traitées :
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Données clients actifs :</strong> pendant toute la durée de la relation
              commerciale, puis 3 ans après la dernière commande
            </li>
            <li>
              <strong>Données de facturation :</strong> 10 ans (obligation légale comptable)
            </li>
            <li>
              <strong>Données de prospection :</strong> 3 ans à compter du dernier contact
            </li>
            <li>
              <strong>Cookies :</strong> 13 mois maximum
            </li>
            <li>
              <strong>Données de navigation :</strong> 12 mois
            </li>
          </ul>
          <p>
            À l'expiration de ces délais, vos données sont supprimées ou anonymisées.
          </p>
        </>
      )
    },
    {
      icon: FileText,
      title: '8. Vos droits',
      content: (
        <>
          <p>
            Conformément au RGPD, vous disposez des droits suivants sur vos données personnelles :
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Droit d'accès :</strong> obtenir la confirmation que vos données sont traitées et en recevoir une copie</li>
            <li><strong>Droit de rectification :</strong> corriger des données inexactes ou incomplètes</li>
            <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données</li>
            <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré et lisible</li>
            <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données pour des motifs légitimes</li>
            <li><strong>Droit à la limitation :</strong> demander la limitation du traitement de vos données</li>
            <li><strong>Droit de retirer votre consentement :</strong> à tout moment, sans affecter la licéité du traitement antérieur</li>
          </ul>
          <p>
            Pour exercer ces droits, contactez-nous à l'adresse :{' '}
            <a href={`mailto:${site.email}`} className="text-green-700 hover:text-green-800 underline">
              {site.email}
            </a>
          </p>
          <p>
            Vous disposez également du droit d'introduire une réclamation auprès de la CNIL
            (Commission Nationale de l'Informatique et des Libertés) : <strong>www.cnil.fr</strong>
          </p>
        </>
      )
    },
    {
      icon: Cookie,
      title: '9. Cookies',
      content: (
        <>
          <p>
            Notre site utilise des cookies pour améliorer votre expérience de navigation.
            Les cookies sont de petits fichiers texte stockés sur votre appareil.
          </p>
          <p><strong>Types de cookies utilisés :</strong></p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Cookies strictement nécessaires :</strong> indispensables au fonctionnement
              du site (session, panier, authentification). Ils ne requièrent pas votre consentement.
            </li>
            <li>
              <strong>Cookies de performance :</strong> permettent d'analyser l'utilisation du site
              pour en améliorer le fonctionnement (statistiques de visite).
            </li>
            <li>
              <strong>Cookies de préférences :</strong> mémorisent vos choix (langue, thème)
              pour personnaliser votre expérience.
            </li>
          </ul>
          <p>
            Vous pouvez gérer vos préférences de cookies à tout moment via les paramètres
            de votre navigateur. La désactivation de certains cookies peut affecter
            le fonctionnement du site.
          </p>
        </>
      )
    },
    {
      icon: Server,
      title: '10. Sécurité',
      content: (
        <>
          <p>
            <strong>{site.nom}</strong> met en œuvre des mesures techniques et organisationnelles
            appropriées pour protéger vos données personnelles contre tout accès non autorisé,
            toute modification, divulgation ou destruction :
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Chiffrement des communications via HTTPS/TLS</li>
            <li>Hashage sécurisé des mots de passe (bcrypt)</li>
            <li>Accès restreint aux données selon le principe du moindre privilège</li>
            <li>Sauvegardes régulières et sécurisées</li>
            <li>Mises à jour de sécurité appliquées régulièrement</li>
            <li>Surveillance et journalisation des accès</li>
          </ul>
        </>
      )
    }
  ];

  return (
    <LegalPageLayout
      icon={Shield}
      title="Politique de confidentialité"
      subtitle={`Découvrez comment ${site.nom} protège vos données personnelles`}
      intro={!loading && (
        <>
          <p className="text-[13.5px] font-semibold text-success-text">Responsable du traitement : {site.nom}</p>
          <p className="text-[13px] text-graphite-700">
            {site.siret && <>SIRET : {site.siret} · </>}
            {site.adresse && <>{site.adresse}, {site.codePostal} {site.ville}</>}
          </p>
          <p className="text-[13px] text-graphite-700">Contact DPO : {site.email}</p>
        </>
      )}
      sections={sections}
      footerLinks={[
        { to: '/cgv', label: 'CGV' },
        { to: '/mentions-legales', label: 'Mentions légales' },
        { to: '/accessibilite', label: 'Accessibilité' }
      ]}
    />
  );
};

export default ConfidentialitePage;
