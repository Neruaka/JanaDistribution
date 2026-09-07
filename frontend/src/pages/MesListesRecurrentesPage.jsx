/**
 * Page Mes listes récurrentes (T16-13)
 * @description Listes de produits enregistrées depuis le panier, pour
 * ré-ajouter les mêmes références en un clic.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ClipboardList, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import listeRecurrenteService from '../services/listeRecurrenteService';
import AccountSidebar from '../components/mon-compte/AccountSidebar';
import { getImageUrl } from '../utils/imageUtils';

const formatDate = (dateString) => new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateString));

const MesListesRecurrentesPage = () => {
  const [listes, setListes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadListes = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listeRecurrenteService.getMesListes();
      if (result.success) setListes(result.data || []);
    } catch {
      toast.error('Erreur lors du chargement des listes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadListes(); }, [loadListes]);

  const handleAjouterAuPanier = async (liste) => {
    setAddingId(liste.id);
    try {
      const result = await listeRecurrenteService.ajouterAuPanier(liste.id);
      if (result.success) toast.success(result.message);
      else toast.error(result.message || 'Erreur lors de l\'ajout au panier');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'ajout au panier');
    } finally {
      setAddingId(null);
    }
  };

  const handleSupprimer = async (liste) => {
    if (!window.confirm(`Supprimer la liste "${liste.nom}" ?`)) return;
    setDeletingId(liste.id);
    try {
      await listeRecurrenteService.supprimer(liste.id);
      setListes((prev) => prev.filter((l) => l.id !== liste.id));
      toast.success('Liste supprimée');
    } catch {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-sand-50 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-[238px_1fr] gap-[22px] px-4 md:px-10 py-7">
        <AccountSidebar active="listes" />

        <div className="flex flex-col gap-3.5 min-w-0">
          <div>
            <h1 className="font-display text-[23px] font-extrabold text-ink-900">Mes listes récurrentes</h1>
            <p className="text-[13.5px] text-graphite-500 mt-1">Enregistrées depuis votre panier — ré-ajoutez les mêmes références en un clic.</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-green-700 animate-spin" /></div>
          ) : listes.length === 0 ? (
            <div className="bg-white border border-sand-200 rounded-8 p-10 flex flex-col items-center text-center gap-3">
              <ClipboardList className="w-8 h-8 text-graphite-300" />
              <div className="text-[14px] font-semibold text-ink-900">Aucune liste enregistrée pour l'instant</div>
              <p className="text-[13px] text-graphite-500 max-w-[380px]">Depuis votre panier, utilisez "Enregistrer comme liste récurrente" pour retrouver ici les mêmes références.</p>
              <Link to="/catalogue" className="mt-1 bg-green-700 hover:bg-green-800 text-white text-[13.5px] font-semibold px-5 py-2.5 rounded-6 transition-colors">
                Parcourir le catalogue
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {listes.map((liste) => (
                <div key={liste.id} className="bg-white border border-sand-200 rounded-8 p-[18px]">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="text-[15px] font-semibold text-ink-900">{liste.nom}</div>
                      <div className="text-[12px] text-graphite-400">{liste.produits.length} référence{liste.produits.length > 1 ? 's' : ''} · enregistrée le {formatDate(liste.dateCreation)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSupprimer(liste)}
                      disabled={deletingId === liste.id}
                      className="p-1.5 text-graphite-300 hover:text-danger-text disabled:opacity-40 transition-colors flex-shrink-0"
                      aria-label="Supprimer la liste"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5 mb-3.5">
                    {liste.produits.map((produit) => (
                      <div key={produit.produitId} className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-4 overflow-hidden placeholder-stripe flex-shrink-0">
                          {getImageUrl(produit.imageUrl) && <img src={getImageUrl(produit.imageUrl)} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="text-[13px] text-ink-900 truncate">{produit.nom}</div>
                        <div className="font-mono text-[12px] text-graphite-400 flex-shrink-0">×{produit.quantite}</div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAjouterAuPanier(liste)}
                    disabled={addingId === liste.id}
                    className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white text-[13.5px] font-semibold py-2.5 rounded-6 transition-colors"
                  >
                    {addingId === liste.id ? 'Ajout au panier…' : 'Ajouter au panier'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MesListesRecurrentesPage;
