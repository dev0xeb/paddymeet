-- 022: fix two gaps found while cross-checking admin announcements and the
-- organiser follows feature.

-- ============================================================================
-- PART 1: notifications.user_id pointed only at public.users, so any admin
-- "push" or "both" announcement sent to an organiser/host audience silently
-- failed the whole insert (organisers only have a public.organisers row, not
-- a public.users one) — the route never checked the insert error, so it
-- still reported success with a nonzero "sent" count while delivering zero
-- notifications. Both public.users.id and public.organisers.id reference
-- auth.users(id) directly, so repointing this FK there (instead of creating
-- dummy public.users rows for organisers) lets a notification go to either
-- kind of account without muddying the explorer/organiser data model.
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================================================
-- PART 2: public.users had RLS disabled entirely — confirmed live, an
-- unauthenticated anon-key request could read every column of every user's
-- row with no login at all. These three policies close that off while
-- preserving every currently-working authenticated behavior exactly as it
-- is today:
--   - SELECT is intentionally "any authenticated user, any row" (not just
--     your own) because several already-working features depend on reading
--     OTHER users' basic profile fields while logged in: the organiser
--     followers page, the ticket scanner's attendee-name lookup, group chat
--     display names, the attendees dashboard. Scoping SELECT to self-only
--     would break all of those. This only removes anonymous/public access.
--   - INSERT (self row only) is needed for signup, which inserts the new
--     user's own row via their own just-established session
--     (app/(public)/signup/actions.ts).
--   - UPDATE (self row only) is needed for the explorer settings page,
--     which updates the caller's own row via their own session client.
--   - The one cross-user users UPDATE in the app (crediting a referrer's
--     discount in lib/referral.ts) already runs on the service-role admin
--     client everywhere it's called, so it bypasses RLS regardless and
--     needs no policy here.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

CREATE POLICY "Authenticated users can read all profiles"
ON public.users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own profile"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
