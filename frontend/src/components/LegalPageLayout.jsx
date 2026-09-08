/**
 * Layout partagé des pages légales (Accessibilité, Confidentialité, CGV,
 * Mentions légales) — T16-01. Les 4 pages avaient une structure identique
 * (hero, carte info, sections, nav de bas de page), dupliquée à l'identique
 * dans chaque fichier ; factorisée ici pour que la refonte design ne soit
 * appliquée qu'une fois.
 */

import { Link } from 'react-router-dom';

const LegalPageLayout = ({ icon: Icon, title, subtitle, intro, sections, footerLinks, lastUpdated = 'septembre 2026' }) => (
  <div className="bg-sand-50 min-h-screen">
    <div className="bg-white border-b border-sand-200 px-4 md:px-10 py-8 md:py-10">
      <div className="max-w-[760px] mx-auto flex items-start gap-4">
        <div className="w-12 h-12 rounded-8 bg-success-bg flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-success-text" />
        </div>
        <div>
          <h1 className="font-display text-[26px] md:text-[30px] font-extrabold tracking-tighter text-ink-900">{title}</h1>
          <p className="text-[14px] text-graphite-600 mt-1.5">{subtitle}</p>
        </div>
      </div>
    </div>

    <div className="max-w-[760px] mx-auto px-4 md:px-10 py-8 flex flex-col gap-5">
      {intro && (
        <div className="bg-selection-bg border border-success-border rounded-8 p-5 flex flex-col gap-1">
          {intro}
        </div>
      )}

      <div className="flex flex-col gap-3.5">
        {sections.map((section, index) => (
          <section key={index} className="bg-white border border-sand-200 rounded-8 p-5 md:p-7">
            <div className="flex items-center gap-3 mb-3.5">
              <div className="w-9 h-9 rounded-6 bg-success-bg flex items-center justify-center flex-shrink-0">
                <section.icon className="w-[18px] h-[18px] text-success-text" />
              </div>
              <h2 className="font-display text-[16px] font-bold text-ink-900">{section.title}</h2>
            </div>
            <div className="text-[13.5px] text-graphite-700 leading-[1.7] flex flex-col gap-3">
              {section.content}
            </div>
          </section>
        ))}
      </div>

      <div className="text-center text-[12.5px] text-graphite-400 pt-4">
        <p>Dernière mise à jour : {lastUpdated}</p>
        <div className="mt-3 flex justify-center gap-5 flex-wrap">
          {footerLinks.map((link) => (
            <Link key={link.to} to={link.to} className="hover:text-green-700 transition-colors">{link.label}</Link>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default LegalPageLayout;
