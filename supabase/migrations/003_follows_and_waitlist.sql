-- ============================================================================
-- PaddyMeet Multi-Event Ticketing & Management Platform
-- 003_follows_and_waitlist.sql: Organiser Follows & Event Waitlist Queue
-- ============================================================================

-- 1. ORGANISER FOLLOWS
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    organiser_id UUID NOT NULL REFERENCES public.organisers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, organiser_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_organiser ON public.follows(organiser_id);
CREATE INDEX IF NOT EXISTS idx_follows_user ON public.follows(user_id);

-- 2. EVENT WAITLIST QUEUE
CREATE TABLE IF NOT EXISTS public.event_waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    ticket_type_id UUID REFERENCES public.ticket_types(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    phone TEXT,
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'claimed', 'expired')),
    notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_event ON public.event_waitlist(event_id, status);
CREATE INDEX IF NOT EXISTS idx_waitlist_user ON public.event_waitlist(user_id);
