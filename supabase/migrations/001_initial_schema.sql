-- ============================================================================
-- PaddyMeet Multi-Event Ticketing & Management Platform
-- 001_initial_schema.sql: Core Database Schema, Tables, Indexes, and Functions
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & PROFILES
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    age INT,
    gender TEXT,
    city TEXT,
    state TEXT,
    trust_score INT DEFAULT 50,
    tier TEXT DEFAULT 'Newbie',
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    referral_points INT DEFAULT 0,
    referral_discount_percent INT DEFAULT 0,
    referral_converted BOOLEAN DEFAULT FALSE,
    is_suspended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USER INTERESTS
CREATE TABLE IF NOT EXISTS public.user_interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    interest TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ORGANISERS
CREATE TABLE IF NOT EXISTS public.organisers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    org_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    website TEXT,
    description TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_suspended BOOLEAN DEFAULT FALSE,
    bank_code TEXT,
    bank_account_number TEXT,
    bank_account_name TEXT,
    bank_recipient_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ORGANISER EVENT TYPES
CREATE TABLE IF NOT EXISTS public.organiser_event_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organiser_id UUID NOT NULL REFERENCES public.organisers(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ADMIN TEAM
CREATE TABLE IF NOT EXISTS public.admin_team (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL CHECK (department IN ('super_admin', 'finance', 'operations', 'marketing', 'support')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. EVENTS
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organiser_id UUID NOT NULL REFERENCES public.organisers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    event_type TEXT NOT NULL,
    vibe TEXT,
    description TEXT,
    age_restriction INT DEFAULT 0,
    dress_code TEXT,
    capacity INT,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    venue_name TEXT NOT NULL,
    venue_address TEXT,
    city TEXT NOT NULL,
    state TEXT,
    image_url TEXT,
    is_free BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    is_live BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_rejected BOOLEAN DEFAULT FALSE,
    cancellation_policy TEXT,
    house_rules TEXT,
    website TEXT,
    social_link TEXT,
    scanner_passkey TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TICKET TYPES
CREATE TABLE IF NOT EXISTS public.ticket_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    quantity INT NOT NULL,
    quantity_sold INT NOT NULL DEFAULT 0,
    is_group_ticket BOOLEAN DEFAULT FALSE,
    group_size INT DEFAULT 1,
    group_deadline TIMESTAMPTZ,
    group_deadline_processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    group_id UUID,
    amount NUMERIC(12, 2) NOT NULL,
    service_fee NUMERIC(12, 2) DEFAULT 0,
    total_paid NUMERIC(12, 2) NOT NULL,
    payment_method TEXT DEFAULT 'paystack',
    payment_reference TEXT UNIQUE NOT NULL,
    payment_status TEXT DEFAULT 'completed',
    discount_applied NUMERIC(5, 2) DEFAULT 0,
    promo_code_used TEXT,
    buyer_name TEXT,
    buyer_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TICKETS
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_type_id UUID REFERENCES public.ticket_types(id) ON DELETE SET NULL,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    ticket_code TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'refunded', 'cancelled')),
    attendee_name TEXT,
    attendee_email TEXT,
    attendee_phone TEXT,
    attended BOOLEAN DEFAULT FALSE,
    attendance_marked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. GROUPS & GROUP CHAT
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    ticket_type_id UUID REFERENCES public.ticket_types(id) ON DELETE SET NULL,
    creator_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    vibe TEXT,
    group_type TEXT DEFAULT 'main' CHECK (group_type IN ('main', 'ticket', 'custom')),
    max_members INT DEFAULT 20,
    gender_preference TEXT DEFAULT 'any',
    min_trust_score INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_merged BOOLEAN DEFAULT FALSE,
    merged_into_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'recruiting' CHECK (status IN ('recruiting', 'completed', 'merged', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. GROUP MEMBERS
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refund_pending', 'refunded')),
    amount_paid NUMERIC(12, 2) DEFAULT 0,
    payment_reference TEXT,
    paid_at TIMESTAMPTZ,
    attendee_name TEXT,
    attendee_email TEXT,
    attendee_phone TEXT,
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. GROUP MESSAGES (Real-time Chat)
CREATE TABLE IF NOT EXISTS public.group_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'system',
    is_read BOOLEAN DEFAULT FALSE,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. PROMO CODES
CREATE TABLE IF NOT EXISTS public.promo_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10, 2) NOT NULL,
    max_uses INT,
    uses_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. PAYOUTS
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organiser_id UUID NOT NULL REFERENCES public.organisers(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    orders_count INT DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'hold', 'failed')),
    payment_method TEXT DEFAULT 'bank_transfer',
    payment_reference TEXT,
    note TEXT,
    paid_by UUID REFERENCES public.admin_team(id) ON DELETE SET NULL,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. PLATFORM SETTINGS
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id INT PRIMARY KEY DEFAULT 1,
    platform_fee_percent NUMERIC(5, 2) DEFAULT 5.0,
    referral_discount_percent INT DEFAULT 10,
    referral_signup_points INT DEFAULT 10,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.platform_settings (id, platform_fee_percent, referral_discount_percent, referral_signup_points)
VALUES (1, 5.0, 10, 10)
ON CONFLICT (id) DO NOTHING;

-- 17. STORED PROCEDURES / RPC
CREATE OR REPLACE FUNCTION public.increment_tickets_sold(ticket_type_id UUID, amount INT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.ticket_types
    SET quantity_sold = quantity_sold + amount,
        updated_at = NOW()
    WHERE id = ticket_type_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 18. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_events_city ON public.events(city);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_organiser ON public.events(organiser_id);
CREATE INDEX IF NOT EXISTS idx_tickets_code ON public.tickets(ticket_code);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event ON public.tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_reference ON public.orders(payment_reference);
CREATE INDEX IF NOT EXISTS idx_group_messages_group ON public.group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);
