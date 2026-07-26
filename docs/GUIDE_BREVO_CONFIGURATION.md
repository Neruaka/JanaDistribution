# Guide de configuration Brevo (emails transactionnels) — REMPLACÉ

> ⚠️ **Ce guide est obsolète.** Brevo a été retiré du projet le 2026-07-08 au profit de
> **Gmail SMTP** (décision produit). Voir le nouveau guide : **`docs/GUIDE_GMAIL_SMTP.md`**.
>
> Le code d'envoi Brevo (`fetch('https://api.brevo.com/...')`) a été retiré de
> `backend/src/services/email.service.js`, remplacé par un transport SMTP `nodemailer`.
> Les variables `BREVO_API_KEY`/`BREVO_SENDER_EMAIL`/`BREVO_SENDER_NAME` ne sont plus lues
> par le code — voir `backend/.env.example` pour les nouvelles variables `GMAIL_*`.
>
> Ce fichier est conservé à titre d'historique de configuration (la procédure Brevo
> elle-même reste correcte si ce service devait être réintroduit un jour) mais ne doit
> plus être suivi pour la configuration actuelle du projet.

Voir `docs/ETAT_ACTUEL_PROJET.md` et `docs/PLAN_CORRECTION_AUDIT.md` pour l'état réel à jour.
