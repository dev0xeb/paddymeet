-- ============================================================================
-- PaddyMeet Multi-Event Ticketing & Management Platform
-- 002_reservations_refunds_scanner.sql: Ticket Holds, Refund Requests & Scanner Passkeys
-- ============================================================================

-- 1. TICKET RESERVATIONS (Concurrency & Hold Engine)
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

-- 2. REFUND REQUESTS
CREATE TABLE IF NOT EXISTS public.refund_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_note TEXT,
    processed_by UUID REFERENCES public.admin_team(id) ON DELETE SET NULL,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refund_requests_user ON public.refund_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_event ON public.refund_requests(event_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON public.refund_requests(status);

-- 3. SCANNER PASSKEY ON EVENTS
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS scanner_passkey TEXT;
CREATE INDEX IF NOT EXISTS idx_events_scanner_passkey ON public.events(scanner_passkey);
