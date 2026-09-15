-- 006: prevents duplicate group_members rows for the same (group_id, user_id).
--
-- Every "is this user already a member?" check in the app used
-- .single()/.maybeSingle(), which errors — and was being read as "not a
-- member" — the moment more than one row matched. That let a user end up
-- with several membership rows for the same group (observed live: a user
-- re-opening a group chat repeatedly created a new row each time, because
-- the broken existence check never found the row(s) that already existed),
-- which showed up as duplicate "you joined" state and the chat repeatedly
-- asking them to join again. The app code has been fixed to check
-- existence safely, but this constraint stops the underlying bad state
-- from being possible at all, including from any code path not covered
-- by that fix.

-- De-duplicate first (constraint creation fails if duplicates exist).
-- Keeps the earliest row per (group_id, user_id) and removes the rest.
DELETE FROM public.group_members a
USING public.group_members b
WHERE a.group_id = b.group_id
  AND a.user_id = b.user_id
  AND a.id <> b.id
  AND (a.created_at, a.id) > (b.created_at, b.id);

ALTER TABLE public.group_members
  ADD CONSTRAINT group_members_group_user_unique UNIQUE (group_id, user_id);
