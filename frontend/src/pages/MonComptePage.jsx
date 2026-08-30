/**
 * Page Mon compte
 * @description Écran 10 — Mon compte
 * @see design_handoff_jana_refonte/README.md
 *
 * La maquette regroupe identité + informations + adresses + préférences sur UNE page
 * défilante (sidebar = destinations, pas des onglets internes). L'implémentation actuelle
 * découpe ces 4 blocs en onglets séparés (profil/adresses/securite/preferences) : on
 * conserve ces composants réels tels quels mais on les affiche ensemble pour "Mes
 * informations" (comme la maquette), et on isole "Sécurité" (mot de passe + RGPD +
 * suppression de compte) comme sa propre destination, seule action réellement sensible.
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AccountSidebar from '../components/mon-compte/AccountSidebar';
import {
  ProfilHeader,
  TabProfil,
  TabAdresses,
  TabSecurite,
  TabPreferences,
  DeleteAccountModal
} from '../components/mon-compte';

const MonComptePage = () => {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const tab = searchParams.get('tab') || 'profil';
  const view = tab === 'securite' ? 'securite' : 'informations';
  const sidebarActive = tab === 'securite' ? 'securite' : tab === 'adresses' ? 'adresses' : 'informations';

  useEffect(() => {
    if (tab === 'adresses' || tab === 'preferences') {
      const el = document.getElementById(tab);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [tab]);

  return (
    <div className="bg-sand-50 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-[238px_1fr] gap-[22px] px-4 md:px-10 py-7">
        <AccountSidebar active={sidebarActive} />

        <div className="flex flex-col gap-3.5 min-w-0">
          <ProfilHeader user={user} />

          {view === 'informations' ? (
            <>
              <TabProfil user={user} updateProfile={updateProfile} />
              <TabAdresses userId={user?.id} />
              <TabPreferences user={user} updateProfile={updateProfile} />
            </>
          ) : (
            <TabSecurite user={user} changePassword={changePassword} onOpenDeleteModal={() => setShowDeleteModal(true)} />
          )}
        </div>
      </div>

      <DeleteAccountModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} logout={logout} />
    </div>
  );
};

export default MonComptePage;
