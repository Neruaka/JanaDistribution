-- Migration 0016 : listes recurrentes (T16-13)
-- Retour de test (2026-09-07) : bouton "Enregistrer comme liste recurrente"
-- present sur le panier depuis le debut mais jamais raccorde (disabled,
-- title="Bientot disponible") - aucun systeme ne l'a jamais soutenu.

CREATE TABLE liste_recurrente (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  utilisateur_id UUID NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
  nom VARCHAR(100) NOT NULL,
  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE liste_recurrente_produit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  liste_id UUID NOT NULL REFERENCES liste_recurrente(id) ON DELETE CASCADE,
  produit_id UUID NOT NULL REFERENCES produit(id) ON DELETE CASCADE,
  quantite INTEGER NOT NULL DEFAULT 1 CHECK (quantite > 0)
);

CREATE INDEX idx_liste_recurrente_utilisateur ON liste_recurrente(utilisateur_id);
CREATE INDEX idx_liste_recurrente_produit_liste ON liste_recurrente_produit(liste_id);
