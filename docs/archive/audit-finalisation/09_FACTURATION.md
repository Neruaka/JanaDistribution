# 09 — Facturation

> ⚠️ **Document historique (état figé au 2026-06-14)** — Rédigé lors de l'audit initial, avant l'implémentation réelle de la facturation (Phase 5, DONE) et le retrait de Stripe (T4-07, 2026-07-02). Voir `docs/workflow/ETAT_ACTUEL_PROJET.md` et `docs/workflow/PLAN_CORRECTION_AUDIT.md` pour l'état réel à jour.

> ⚠️ Ce document contient des recommandations techniques. Les obligations légales et comptables
> doivent être validées par un professionnel du droit et/ou un expert-comptable.

---

## État actuel

**La facturation est entièrement absente du projet.**

- Aucune table `facture` en base de données
- Aucun service de génération de facture
- Aucune bibliothèque PDF installée
- Aucune interface admin pour les factures
- Aucun endpoint API `/api/invoices`

C'est un **bloquant P0** pour toute mise en production commerciale en France.

---

## Obligations légales françaises (à valider avec un comptable)

En France, un e-commerçant vendant à des particuliers ou des professionnels est soumis à l'obligation de facture (article L441-3 du Code de commerce). La facture doit notamment mentionner :

- Numéro de facture unique et séquentiel
- Date d'émission
- Identité du vendeur (nom, adresse, SIRET, numéro TVA intracommunautaire)
- Identité de l'acheteur
- Désignation des produits ou services
- Quantité, prix unitaire HT, taux de TVA
- Montant HT, montant de TVA, montant TTC
- Frais de livraison
- Mode de paiement

**Points à valider avec un professionnel** :
- Durée de conservation obligatoire des factures (10 ans en France pour la comptabilité)
- Régime de TVA applicable (franchise en base, régime réel...)
- Obligation d'archivage électronique conforme
- Format légal pour l'avoir en cas de remboursement

---

## Comparatif des stratégies

### Stratégie 1 — Factures Stripe uniquement

Stripe peut générer des reçus et invoices automatiquement.

| Avantages | Inconvénients |
|---|---|
| Zéro développement | Format anglophone par défaut |
| Intégré avec les paiements | Pas personnalisable aux exigences légales françaises |
| Conservation automatique | Ne couvre pas les commandes non-CARTE |
| | Pas d'avoir intégré |

**Non recommandé** seul — insuffisant pour les obligations françaises et les modes de paiement alternatifs.

### Stratégie 2 — Factures générées par l'application ✅ Recommandée

Génération PDF dans le backend à partir des données de la commande.

| Avantages | Inconvénients |
|---|---|
| Contrôle total sur le format | Développement nécessaire (7-10 jours) |
| Couvre tous modes de paiement | Maintenance du template |
| Numérotation personnalisée | Dépendance bibliothèque PDF |
| Stockage dans l'application | |
| Conforme aux exigences françaises | |

**Recommandée pour Jana Distribution.**

### Stratégie 3 — Service de facturation externe

Exemple : Pennylane, Qonto, Sellsy...

| Avantages | Inconvénients |
|---|---|
| Conformité légale gérée | Coût mensuel |
| Interface comptable complète | Intégration API supplémentaire |
| | Dépendance externe |

**Non recommandé au stade actuel** — surcoût pour un projet e-commerce simple.

### Stratégie 4 — Combinaison Stripe + application interne

Stripe pour les reçus carte, application pour les factures formelles.

**Trop complexe** pour le gain obtenu. Opter pour la Stratégie 2 uniquement.

---

## Architecture recommandée

### Moment de création

La facture doit être créée **immédiatement après confirmation du paiement** :
- Pour les paiements CARTE : lors du traitement du webhook `checkout.session.completed`
- Pour les paiements VIREMENT/CHÈQUE : lors de la mise à jour manuelle admin en statut PAID

```javascript
// Dans payment.service.js, après markPaid :
const invoiceService = require('../services/invoice.service');
await invoiceService.generateForOrder(orderId);
```

### Numérotation

Format recommandé : `FAC-YYYY-NNNN` (ex: `FAC-2025-0001`)

```sql
CREATE SEQUENCE facture_numero_seq START 1;

-- Dans invoice.service.js :
const numero = `FAC-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`;
```

La séquence doit être **par année** pour que la numérotation reprenne à 1 chaque année (obligatoire en France : numéros consécutifs sur une même période).

### Immutabilité

Une facture émise **ne doit jamais être modifiée**. Si un remboursement intervient, on émet un **avoir** qui annule totalement ou partiellement la facture.

Contrainte recommandée : la table `facture` n'expose pas d'endpoint UPDATE.

---

## Modèle de données

```sql
CREATE SEQUENCE facture_numero_seq START 1;

CREATE TABLE facture (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_facture VARCHAR(20) NOT NULL UNIQUE,   -- FAC-2025-0001
  commande_id UUID NOT NULL REFERENCES commande(id),
  utilisateur_id UUID REFERENCES utilisateur(id) ON DELETE SET NULL,
  date_emission TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Snapshot entreprise (données au moment de l'émission)
  entreprise_nom VARCHAR(255) NOT NULL,
  entreprise_siret VARCHAR(30),
  entreprise_adresse_complete TEXT,
  entreprise_tva_intra VARCHAR(20),

  -- Snapshot client (données au moment de l'émission)
  client_nom_complet VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_adresse_facturation JSONB NOT NULL,

  -- Montants (snapshot, immutables)
  total_ht DECIMAL(10,2) NOT NULL,
  total_tva DECIMAL(10,2) NOT NULL,
  frais_livraison_ht DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_ttc DECIMAL(10,2) NOT NULL,

  -- Statut et PDF
  statut VARCHAR(20) NOT NULL DEFAULT 'EMISE',  -- EMISE | ANNULEE
  pdf_url VARCHAR(500),                          -- URL S3 ou chemin fichier
  pdf_genere_le TIMESTAMP,

  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE facture_ligne (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facture_id UUID NOT NULL REFERENCES facture(id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  quantite INTEGER NOT NULL,
  prix_unitaire_ht DECIMAL(10,2) NOT NULL,
  taux_tva DECIMAL(5,2) NOT NULL,
  total_ht DECIMAL(10,2) NOT NULL,
  total_ttc DECIMAL(10,2) NOT NULL,
  ordre INTEGER NOT NULL DEFAULT 0
);

CREATE SEQUENCE avoir_numero_seq START 1;

CREATE TABLE avoir (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_avoir VARCHAR(20) NOT NULL UNIQUE,   -- AVO-2025-0001
  facture_id UUID NOT NULL REFERENCES facture(id),
  commande_id UUID NOT NULL REFERENCES commande(id),
  motif TEXT,
  montant_ttc DECIMAL(10,2) NOT NULL,         -- Montant du remboursement
  stripe_refund_id VARCHAR(255),
  date_emission TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## Bibliothèques PDF recommandées

| Bibliothèque | Avantages | Inconvénients |
|---|---|---|
| **PDFKit** | Pure JS, légère, contrôle total | API bas niveau |
| **pdfmake** | Déclaratif, plus simple | Moins flexible |
| **Puppeteer** | HTML → PDF, template facile | Lourd (Chrome headless) |
| **@react-pdf/renderer** | Composants React pour PDF | Uniquement frontend |

**Recommandation** : **PDFKit** pour le backend Node.js — léger, bien maintenu, pas de dépendance Chrome.

---

## Service de facturation cible

```javascript
// backend/src/services/invoice.service.js

class InvoiceService {
  async generateForOrder(orderId) {
    // 1. Charger la commande avec toutes ses lignes
    // 2. Charger les settings entreprise (site_nom, site_siret, etc.)
    // 3. Générer numéro facture (séquence + année)
    // 4. Créer la facture en DB (snapshot données)
    // 5. Générer le PDF (PDFKit)
    // 6. Stocker le PDF (S3 ou disque)
    // 7. Mettre à jour facture avec pdf_url
    // 8. Déclencher envoi email avec PDF en pièce jointe
  }

  async getInvoicePdf(invoiceId, userId, isAdmin) {
    // Vérifier ownership ou admin
    // Retourner le PDF (stream ou URL S3)
  }

  async generateCreditNote(orderId, motif, montant) {
    // Générer un avoir
  }
}
```

---

## Endpoints API nécessaires

| Méthode | Route | Accès | Description |
|---|---|---|---|
| `GET` | `/api/invoices` | Admin | Liste toutes les factures |
| `GET` | `/api/invoices/:id` | Admin ou owner | Détail facture |
| `GET` | `/api/invoices/:id/pdf` | Admin ou owner | Téléchargement PDF |
| `GET` | `/api/orders/:id/invoice` | Admin ou owner | Facture d'une commande |
| `POST` | `/api/admin/invoices/:id/credit-note` | Admin | Générer un avoir |
| `GET` | `/api/user/invoices` | Client connecté | Ses propres factures |

---

## Accès admin

La page `AdminOrdersList.jsx` doit être enrichie avec :
- Bouton "Télécharger la facture" sur chaque commande PAID
- Colonne "Facture" avec indicateur si facture générée

---

## Envoi par email

La facture doit être envoyée en pièce jointe à l'email de confirmation de commande (statut CONFIRMEE). Brevo supporte les pièces jointes via son API REST.

```javascript
// email.service.js — à enrichir
async sendOrderConfirmationWithInvoice(order, user, pdfBuffer) {
  // Encoder pdfBuffer en base64
  // Ajouter attachment dans la requête Brevo
}
```

---

## Points à valider par des professionnels

### À valider avec le propriétaire de l'entreprise

- [ ] Format exact du numéro de facture (préférence personnelle)
- [ ] Mentions obligatoires supplémentaires selon l'activité
- [ ] Politique de remboursement et délais légaux
- [ ] Gestion des commandes professionnelles (TVA déductible)

### À valider avec un comptable

- [ ] Taux de TVA applicables selon les catégories de produits alimentaires
- [ ] Régime de TVA de l'entreprise (franchise, régime réel simplifié, normal)
- [ ] Format d'archivage comptable des factures
- [ ] Durée de conservation réglementaire
- [ ] Traitement des avoirs en comptabilité

### À valider avec un professionnel du droit

- [ ] Conformité avec l'article L441-3 du Code de commerce
- [ ] CGV et mentions légales adaptées à l'e-commerce alimentaire
- [ ] Droit de rétractation (14 jours) pour les denrées alimentaires (exceptions possibles)
- [ ] RGPD et conservation des données de facturation
- [ ] Facture électronique obligatoire selon calendrier 2024-2026
