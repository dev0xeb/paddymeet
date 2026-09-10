-- 005: adds the events.scanner_passkey column referenced by
-- app/api/scanner/auth/route.ts and app/api/scanner/scan/route.ts.
--
-- This column never existed on the live database even though the app code
-- has always referenced it, so the gate-staff passkey login at /scan has
-- never actually worked via a real passkey — every attempt silently failed
-- the query and fell through to the raw-event-ID fallback. The app code has
-- been made defensive against this column being absent (falls back to
-- matching by event ID), so applying this migration is not required for
-- scanning to work, but it's required for a real short passkey (instead of
-- the full event UUID) to work as gate staff credentials.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS scanner_passkey TEXT UNIQUE;

-- Backfill a random 6-character passkey for existing events that don't have one.
UPDATE public.events
SET scanner_passkey = upper(substring(replace(uuid_generate_v4()::text, '-', '') from 1 for 6))
WHERE scanner_passkey IS NULL;
