/**
 * Conditions Générales de Vente
 * @description Page des CGV de Jana Distribution
 * @location frontend/src/pages/CGVPage.jsx
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText, ShoppingCart, Truck, CreditCard, RotateCcw,
  AlertTriangle, Scale, Shield, Package, Clock, MapPin, Ban
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

const CGVPage = () => {
  const { site, livraison, loading, fraisLivraisonStandard, seuilFrancoPort } = useSettings();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      icon: FileText,
      title: 'Article 1 – Objet et champ d\'application',
      content: (
        <>
          <p>
            Les présentes Conditions Générales de Vente (CGV) régissent l'ensemble des ventes
            de produits proposés par <strong>{site.nom}</strong> sur son site internet.
            Toute commande passée sur le site implique l'acceptation sans réserve des présentes CGV.
          </p>
          <p>
            <strong>{site.nom}</strong> se réserve le droit de modifier les présentes CGV à tout moment.
            Les CGV applicables sont celles en vigueur à la date de passation de la commande par le client.
          </p>
        </>
      )
    },
    {
      icon: ShoppingCart,
      title: 'Article 2 – Produits et commandes',
      content: (
        <>
          <p>
            Les produits proposés à la vente sont des denrées alimentaires dont les caractéristiques
            essentielles sont décrites sur chaque fiche produit (composition, poids, origine, allergènes, DLC/DDM).
          </p>
          <p>
            Le client passe commande en ajoutant les produits souhaités à son panier, puis en validant
            sa commande après avoir renseigné ses informations de livraison et de paiement.
            Un email de confirmation est envoyé au client récapitulant les détails de la commande.
          </p>
          <p>
            <strong>{site.nom}</strong> se réserve le droit de refuser ou d'annuler toute commande
            en cas de motif légitime, notamment en cas de problème d'approvisionnement, d'erreur
            manifeste sur le prix, ou de commande anormale.
          </p>
        </>
      )
    },
    {
      icon: CreditCard,
      title: 'Article 3 – Prix et paiement',
      content: (
        <>
          <p>
            Les prix sont indiqués en euros toutes taxes comprises (TTC). Ils tiennent compte de la TVA
            applicable au jour de la commande. <strong>{site.nom}</strong> se réserve le droit de modifier
            ses prix à tout moment, les produits étant facturés sur la base du tarif en vigueur au moment
            de la validation de la commande.
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Paiement par carte bancaire (Visa, Mastercard)</li>
            <li>Paiement par virement bancaire (pour les clients professionnels)</li>
            <li>Paiement à la livraison (sous conditions)</li>
          </ul>
          <p>
            La commande est validée après confirmation du paiement. Une facture est émise
            et envoyée par email au client.
          </p>
        </>
      )
    },
    {
      icon: Truck,
      title: 'Article 4 – Livraison',
      content: (
        <>
          <p>
            <strong>{site.nom}</strong> assure la livraison des commandes dans un délai
            de <strong>{livraison.delaiMin} à {livraison.delaiMax} jours ouvrables</strong> après
            confirmation de la commande. Ce délai est donné à titre indicatif et peut varier
            selon la disponibilité des produits et la zone de livraison.
          </p>
          <p>
            Les frais de livraison standard s'élèvent à <strong>{fraisLivraisonStandard} € TTC</strong>.
            La livraison est offerte pour toute commande d'un montant supérieur ou égal
            à <strong>{seuilFrancoPort} € TTC</strong>.
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Livraison en France métropolitaine</li>
            <li>Respect de la chaîne du froid pour les produits frais et surgelés</li>
            <li>Notification par email à chaque étape de la livraison</li>
            <li>Possibilité de choisir un créneau de livraison (selon disponibilité)</li>
          </ul>
        </>
      )
    },
    {
      icon: Package,
      title: 'Article 5 – Réception et conformité',
      content: (
        <>
          <p>
            Le client est tenu de vérifier l'état des produits à la réception. En cas de produit
            endommagé, manquant ou non conforme, le client doit le signaler dans un
            délai de <strong>48 heures</strong> suivant la réception en contactant notre service client.
          </p>
          <p>
            Pour les denrées périssables, le client doit vérifier les dates de péremption et
            la température des produits dès réception. Tout problème constaté doit être
            signalé immédiatement.
          </p>
          <p>
            En cas de non-conformité avérée, <strong>{site.nom}</strong> procédera au remplacement
            du produit ou au remboursement, au choix du client.
          </p>
        </>
      )
    },
    {
      icon: RotateCcw,
      title: 'Article 6 – Droit de rétractation',
      content: (
        <>
          <p>
            Conformément aux articles L221-18 et suivants du Code de la consommation, le client
            consommateur dispose d'un délai de <strong>14 jours</strong> à compter de la réception
            des produits pour exercer son droit de rétractation, sans avoir à justifier de motif
            ni à payer de pénalités.
          </p>
          <p className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <strong>Exception importante :</strong> Conformément à l'article L221-28 du Code de la
            consommation, le droit de rétractation ne peut être exercé pour les denrées alimentaires
            périssables ou dont la date de péremption est courte, ainsi que pour les produits
            descellés ne pouvant être renvoyés pour des raisons d'hygiène ou de protection de la santé.
          </p>
          <p>
            Pour les produits non périssables éligibles, le client doit retourner les produits dans
            leur emballage d'origine, en parfait état. Les frais de retour sont à la charge du client.
          </p>
        </>
      )
    },
    {
      icon: AlertTriangle,
      title: 'Article 7 – Garanties et responsabilité',
      content: (
        <>
          <p>
            <strong>{site.nom}</strong> garantit la conformité des produits vendus aux
            réglementations alimentaires en vigueur (hygiène, traçabilité, étiquetage).
            Tous les produits respectent la chaîne du froid et les normes HACCP.
          </p>
          <p>
            La responsabilité de <strong>{site.nom}</strong> ne saurait être engagée en cas de :
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Mauvaise conservation des produits après livraison</li>
            <li>Non-respect des consignes de stockage indiquées sur l'emballage</li>
            <li>Utilisation des produits après la date limite de consommation</li>
            <li>Dommage résultant d'un cas de force majeure</li>
          </ul>
        </>
      )
    },
    {
      icon: Shield,
      title: 'Article 8 – Données personnelles',
      content: (
        <>
          <p>
            Les données personnelles collectées lors de la commande sont traitées conformément
            au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique
            et Libertés.
          </p>
          <p>
            Pour en savoir plus sur la collecte, le traitement et la protection de vos données
            personnelles, veuillez consulter notre{' '}
            <Link to="/confidentialite" className="text-green-600 hover:text-green-700 underline">
              Politique de confidentialité
            </Link>.
          </p>
        </>
      )
    },
    {
      icon: Ban,
      title: 'Article 9 – Force majeure',
      content: (
        <>
          <p>
            <strong>{site.nom}</strong> ne pourra être tenue responsable de l'inexécution totale
            ou partielle de ses obligations si cette inexécution est due à un événement de force
            majeure, tel que défini par l'article 1218 du Code civil.
          </p>
          <p>
            Sont notamment considérés comme cas de force majeure : les catastrophes naturelles,
            les épidémies, les grèves, les interruptions de transport, les pannes de réseau,
            les ruptures d'approvisionnement indépendantes de la volonté de <strong>{site.nom}</strong>.
          </p>
        </>
      )
    },
    {
      icon: Scale,
      title: 'Article 10 – Droit applicable et litiges',
      content: (
        <>
          <p>
            Les présentes CGV sont soumises au droit français. En cas de litige, une solution
            amiable sera recherchée avant toute action judiciaire.
          </p>
          <p>
            Conformément aux dispositions du Code de la consommation relatives au règlement
            amiable des litiges, le client peut recourir gratuitement au service de médiation
            de la consommation. Le médiateur peut être saisi dans un délai d'un an à compter
            de la réclamation écrite adressée à <strong>{site.nom}</strong>.
          </p>
          <p>
            À défaut de résolution amiable, tout litige sera porté devant les tribunaux
            compétents du ressort du siège social de <strong>{site.nom}</strong>.
          </p>
        </>
      )
    },
    {
      icon: Clock,
      title: 'Article 11 – Durée et modification',
      content: (
        <>
          <p>
            Les présentes CGV sont conclues pour une durée indéterminée.
            <strong> {site.nom}</strong> se réserve le droit de les modifier à tout moment.
          </p>
          <p>
            Les CGV applicables à une commande sont celles acceptées par le client au moment
            de la validation de sa commande. Il est conseillé au client de consulter régulièrement
            les CGV pour prendre connaissance des éventuelles modifications.
          </p>
        </>
      )
    },
    {
      icon: MapPin,
      title: 'Article 12 – Contact',
      content: (
        <>
          <p>
            Pour toute question relative aux présentes CGV ou à une commande, vous pouvez
            contacter <strong>{site.nom}</strong> :
          </p>
          <ul className="list-none space-y-2">
            {site.adresse && (
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>{site.adresse}, {site.codePostal} {site.ville}</span>
              </li>
            )}
            <li className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span>Email : <a href={`mailto:${site.email}`} className="text-green-600 hover:text-green-700 underline">{site.email}</a></span>
            </li>
            <li className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span>Téléphone : <a href={`tel:${site.telephone?.replace(/\s/g, '')}`} className="text-green-600 hover:text-green-700 underline">{site.telephone}</a></span>
            </li>
          </ul>
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
              Conditions Générales de Vente
            </h1>
            <p className="text-green-100 max-w-2xl mx-auto">
              Consultez les conditions régissant vos achats sur {site.nom}
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
            <Link to="/confidentialite" className="hover:text-green-600 transition-colors">Confidentialité</Link>
            <Link to="/mentions-legales" className="hover:text-green-600 transition-colors">Mentions légales</Link>
            <Link to="/accessibilite" className="hover:text-green-600 transition-colors">Accessibilité</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CGVPage;
