-- 013: let an organiser read orders placed against their own events.
--
-- No migration in this repo has ever set up RLS on `orders` — it was
-- enabled directly in Supabase at some point, outside the tracked
-- migration history (same pattern found repeatedly elsewhere this
-- session). Confirmed directly: signed in as a real organiser and ran
-- the exact query the organiser dashboard uses — it returned zero rows
-- with no error, while the same query with full access returned 4 real
-- completed orders totalling ₦100,291. That's why "Gross Revenue",
-- "Tickets Sold", and "Estimated Payout" all showed ₦0/0 regardless of
-- how much an organiser's events had actually sold — the dashboard was
-- never able to see the data at all, silently.
--
-- This only adds a SELECT policy for organisers reading their own
-- events' orders; it doesn't touch INSERT (ticket purchases are already
-- completing successfully, so that policy already exists in whatever
-- form) or the buyer's own access.

DROP POLICY IF EXISTS "Organisers can view orders for their own events" ON public.orders;

CREATE POLICY "Organisers can view orders for their own events"
ON public.orders FOR SELECT
TO authenticated
USING (
  event_id IN (
    SELECT id FROM public.events WHERE organiser_id = auth.uid()
  )
);
