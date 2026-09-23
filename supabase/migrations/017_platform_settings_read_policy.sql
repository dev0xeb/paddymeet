-- 017: let logged-in users read platform_settings.
--
-- Found while visually verifying the commission_rate fix from the previous
-- migration: the organiser dashboard still showed "Net 95%" (the 5.0
-- hardcoded fallback) instead of the real 90% (commission_rate = 10),
-- even after the app code was already fixed to read the right column.
-- Confirmed directly: signed in as the real organiser and queried
-- platform_settings — got nothing back, no rows, no error surfaced to the
-- caller. Same missing-RLS-policy pattern as orders/tickets, on a fourth
-- table now: platform_settings has RLS enabled with no SELECT policy for
-- ordinary logged-in users at all, only for admin routes that use the
-- service-role client and bypass RLS entirely.
--
-- This is wider than just the organiser dashboard: lib/referral.ts reads
-- this exact table (referral_discount_percent) under the *buyer's own*
-- session from both /api/tickets/verify and /api/tickets/claim-free —
-- meaning a referrer's discount has likely never actually been awarded on
-- either of those paths, silently, for the same reason.
--
-- platform_settings is a single row of non-sensitive, read-only config
-- (fee percentages, referral rates, trust-tier thresholds) that every
-- signed-in user's own pages legitimately need to read client-side
-- calculations from — there's nothing here that needs restricting to
-- admins, only writes do (and the admin write path already uses the
-- service-role client, which isn't subject to this policy anyway).

DROP POLICY IF EXISTS "Authenticated users can read platform settings" ON public.platform_settings;

CREATE POLICY "Authenticated users can read platform settings"
ON public.platform_settings FOR SELECT
TO authenticated
USING (true);
