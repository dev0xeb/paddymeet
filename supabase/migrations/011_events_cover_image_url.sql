-- 011: document/ensure events.cover_image_url exists.
--
-- The original schema (001_initial_schema.sql) only ever defined
-- events.image_url, but the app has always been written against a
-- differently-named events.cover_image_url column instead (event cards,
-- the public event page, the organiser event form, admin pages — nothing
-- in the app reads image_url at all). The live database already has
-- cover_image_url as a real column (added directly, outside the tracked
-- migration history), which is why this is additive/idempotent rather
-- than a rename — but that meant every organiser's uploaded cover photo
-- was being uploaded to storage successfully and then silently discarded,
-- since app/api/organiser/submit-event/route.ts never included the field
-- in its insert. That insert is now fixed to actually save it.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
