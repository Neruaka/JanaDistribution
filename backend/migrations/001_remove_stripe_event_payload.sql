-- Migration 001 : Suppression de la colonne payload de stripe_event
-- Auteur : audit de sécurité Phase 0 — T0-04
-- Date   : 2026-06-14
--
-- Raison : La table stripe_event sert uniquement à garantir l'idempotence des webhooks
-- Stripe. Elle n'a pas besoin du payload complet de l'événement, qui peut contenir
-- des informations sensibles (données de session, metadata client, etc.).
-- Conserver uniquement event_id, type et processed_at est suffisant.
--
-- IMPORTANT : Ne JAMAIS exécuter init.sql sur une base existante.
-- Exécuter ce fichier à la place pour les bases déjà provisionnées.
--
-- Cette migration est idempotente grâce à la clause IF EXISTS.
--
-- Exécution :
--   psql -U <user> -d <dbname> -f 001_remove_stripe_event_payload.sql

ALTER TABLE stripe_event
  DROP COLUMN IF EXISTS payload;

-- Vérification (commentée, à décommenter si exécution manuelle)
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'stripe_event';
