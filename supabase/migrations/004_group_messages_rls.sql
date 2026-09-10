-- 004: Row-Level Security for group_messages (event/squad chat content)
--
-- Context: group_messages had no RLS at all, so the public Supabase anon key
-- (shipped to every browser) could read/write any event's or squad's chat
-- history directly via the PostgREST API, completely bypassing the app's
-- "Ticket Holders Lounge & Squads" paywall and the app-layer checks added to
-- app/api/groups/messages/route.ts. components/GroupChatBar.tsx also talks
-- to group_messages directly from the browser client with no server-side
-- check in front of it at all, so the API-layer fix alone does not cover it.
--
-- Scope: only group_messages gets restricted here. groups/group_members are
-- deliberately left open — components/TicketGroupBrowser.tsx and the squads
-- browser (GET /api/groups/squads) intentionally let signed-out visitors
-- browse open ticket-split groups and squads before joining, and tightening
-- those tables would break that discovery flow. group_messages has no such
-- legitimate "read before you're in it" use case, so it can be locked down
-- without touching the others.
--
-- Access rule for a message's group_id:
--   - the event's organiser always has access
--   - an existing member of that specific group always has access
--     (covers squads, and 'ticket' split-payment groups whose members
--     haven't received an actual ticket yet)
--   - otherwise, for 'main'/'social'/'custom' rooms, any user holding an
--     active ticket for the event has access (squad/ticket rooms do NOT
--     fall back to this — they stay membership-only, matching the
--     "Private Squad Sub-Room" UI copy)

CREATE OR REPLACE FUNCTION public.group_chat_access(p_group_id UUID, p_uid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
  v_group_type TEXT;
BEGIN
  IF p_uid IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT event_id, group_type INTO v_event_id, v_group_type
  FROM public.groups
  WHERE id = p_group_id;

  IF v_event_id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = v_event_id AND e.organiser_id = p_uid
  ) THEN
    RETURN TRUE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = p_group_id AND gm.user_id = p_uid
  ) THEN
    RETURN TRUE;
  END IF;

  IF v_group_type IN ('squad', 'ticket') THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.event_id = v_event_id AND t.user_id = p_uid AND t.status = 'active'
  );
END;
$$;

ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS group_messages_select_access ON public.group_messages;
CREATE POLICY group_messages_select_access ON public.group_messages
  FOR SELECT
  USING (public.group_chat_access(group_id, auth.uid()));

DROP POLICY IF EXISTS group_messages_insert_access ON public.group_messages;
CREATE POLICY group_messages_insert_access ON public.group_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.group_chat_access(group_id, auth.uid())
  );
