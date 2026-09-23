-- 016: let an organiser check attendees into their own events.
--
-- Found while auditing the organiser dashboard end-to-end: the in-dashboard
-- scanner (/organiser/dashboard/scanner, api/organiser/scan-ticket) marks a
-- ticket used by running an UPDATE on `tickets` under the organiser's own
-- session. Migration 014 only added a SELECT policy for organisers on
-- tickets — there was never an UPDATE policy. Without one, RLS silently
-- matches zero rows on every check-in attempt, which the check-in code
-- (lib/ticketScan.ts) reads as "ticket already used" — meaning every
-- genuine, first-time scan through this screen would incorrectly turn a
-- real paying guest away at the door.
--
-- (The other check-in path, the passkey-based public scanner at /scan, is
-- unaffected — it already runs on the service-role client and bypasses RLS
-- entirely. This migration only matters for the organiser's own dashboard
-- scanner.)
--
-- Scoped narrowly: organisers can only update tickets for events they own,
-- and the app code only ever changes status/attended/attendance_marked_at
-- here — this policy doesn't grant them free rein to edit ticket rows.

DROP POLICY IF EXISTS "Organisers can check in tickets for their own events" ON public.tickets;

CREATE POLICY "Organisers can check in tickets for their own events"
ON public.tickets FOR UPDATE
TO authenticated
USING (
  event_id IN (
    SELECT id FROM public.events WHERE organiser_id = auth.uid()
  )
)
WITH CHECK (
  event_id IN (
    SELECT id FROM public.events WHERE organiser_id = auth.uid()
  )
);
