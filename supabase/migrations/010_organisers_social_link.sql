-- 010: add missing organisers columns that the app has always assumed exist.
--
-- app/(organiser)/organiser/dashboard/settings/page.tsx has always had a
-- working-looking "Social Link" input (Instagram/etc URL) on the Profile
-- tab, and app/api/organiser/profile/route.ts has always whitelisted
-- social_link as a savable field — but the organisers table never actually
-- had this column. Since a Postgres UPDATE with an unknown column in its
-- SET list fails as a whole, every "Save Profile" click was failing (org
-- name/phone/description/website changes included), not just the social
-- link.
--
-- Separately, both app/(organiser)/organiser/dashboard/payouts/page.tsx and
-- app/(admin)/admin/dashboard/payouts/page.tsx display `organiser.bank_name`
-- (a human-readable bank name, e.g. "GTBank") — organisers only ever stored
-- bank_code (a Paystack bank code, e.g. "058"), so this always rendered
-- blank/undefined. bank_name is resolved once client-side from the banks
-- dropdown at save time (see handleSaveBank) and stored here so the payout
-- pages can display it without an extra Paystack API call per page render.

ALTER TABLE public.organisers
  ADD COLUMN IF NOT EXISTS social_link TEXT,
  ADD COLUMN IF NOT EXISTS bank_name TEXT;
