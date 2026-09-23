-- 014: let an organiser read tickets (attendees) for their own events.
--
-- Same gap as 013, on a different table: no migration in this repo has
-- ever set up RLS on `tickets` either — enabled directly in Supabase,
-- outside tracked history, with no policy letting an organiser see it.
-- Confirmed directly: signed in as a real organiser and queried tickets
-- for one of their own events that has a real, service-role-confirmed
-- ticket sold on it — the organiser's own session got zero rows back,
-- no error. That's why "Recent Attendees" always showed "No attendees
-- yet" and the "Attended" stat was always 0, regardless of real sales.
--
-- This only adds a SELECT policy for organisers reading tickets for
-- their own events; it doesn't touch INSERT (ticket purchase flows use
-- the buyer's own session or the service role already) or the ticket
-- holder's own access to their ticket.

DROP POLICY IF EXISTS "Organisers can view tickets for their own events" ON public.tickets;

CREATE POLICY "Organisers can view tickets for their own events"
ON public.tickets FOR SELECT
TO authenticated
USING (
  event_id IN (
    SELECT id FROM public.events WHERE organiser_id = auth.uid()
  )
);
