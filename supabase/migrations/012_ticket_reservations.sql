-- 012: (re)create the ticket_reservations table.
--
-- This table was defined in 002_reservations_refunds_scanner.sql, but the
-- live database never actually got it — confirmed directly: querying it
-- returns "Could not find the table 'public.ticket_reservations' in the
-- schema cache", while refund_requests (defined right after it in the same
-- migration file) does exist live. So the two tables in that migration
-- were applied inconsistently at some point, not a code bug.
--
-- The practical impact: every call to app/api/tickets/reserve/route.ts's
-- insert has been silently failing and falling back to a "soft"
-- reservation (a fake id, no real hold), which the code was written to
-- tolerate — so checkout doesn't outright break — but it means the
-- temporary-hold safety net that's supposed to stop two buyers grabbing
-- the last ticket at the same time has not actually been active at all.

CREATE TABLE IF NOT EXISTS public.ticket_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_type_id UUID NOT NULL REFERENCES public.ticket_types(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    quantity INT NOT NULL DEFAULT 1,
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'released', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservations_ticket_type ON public.ticket_reservations(ticket_type_id, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_reservations_event ON public.ticket_reservations(event_id);
