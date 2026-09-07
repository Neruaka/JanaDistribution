/**
 * Service Listes récurrentes (T16-13)
 */

import api from './api';

const listeRecurrenteService = {
  async getMesListes() {
    const response = await api.get('/listes-recurrentes');
    return response.data;
  },

  async creerDepuisPanier(nom) {
    const response = await api.post('/listes-recurrentes', { nom });
    return response.data;
  },

  async ajouterAuPanier(id) {
    const response = await api.post(`/listes-recurrentes/${id}/ajouter-au-panier`);
    return response.data;
  },

  async supprimer(id) {
    const response = await api.delete(`/listes-recurrentes/${id}`);
    return response.data;
  }
};

export default listeRecurrenteService;
