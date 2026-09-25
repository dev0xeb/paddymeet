-- 019: let a user read and update their own ticket_reservations rows.
--
-- Found while building the new Transaction History view: ticket_reservations
-- has RLS enabled with no policy at all for the reservation's own owner —
-- confirmed directly, signed in as the real reservation holder and queried
-- their own row by user_id, got zero rows back, no error.
--
-- This is worse than just hiding "pending" entries from the new history
-- view. app/api/tickets/verify/route.ts marks a reservation 'converted'
-- after a successful purchase using the buyer's own session client, not
-- the service role — without an UPDATE policy, that update has been
-- silently matching zero rows this whole time. Every solo ticket purchase
-- has been leaving its reservation permanently stuck on 'pending' instead
-- of 'converted'. It doesn't block anything critical today (the capacity
-- check in api/tickets/reserve/route.ts runs on the service-role client
-- and only cares about expires_at, not this bug), but it's exactly the
-- kind of silently-wrong state that would make a "Pending" transaction
-- list show a stale, already-completed purchase as still pending forever.

DROP POLICY IF EXISTS "Users can view their own ticket reservations" ON public.ticket_reservations;
DROP POLICY IF EXISTS "Users can update their own ticket reservations" ON public.ticket_reservations;

CREATE POLICY "Users can view their own ticket reservations"
ON public.ticket_reservations FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own ticket reservations"
ON public.ticket_reservations FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
