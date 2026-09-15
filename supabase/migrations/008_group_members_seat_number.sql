-- 008: allow one payer to hold multiple group_members rows in the same
-- group (buying several spots for friends), without reopening the
-- duplicate-self-join bug that 006's UNIQUE (group_id, user_id)
-- constraint was added to close.
--
-- app/api/groups/[id]/pay-share/verify/route.ts lets a signed-in user pay
-- for multiple spots at once (the "pay for your friends" flow in
-- GroupSharePaymentModal.tsx) and inserts one group_members row per spot,
-- all with the same user_id. Under 006's plain (group_id, user_id)
-- unique constraint, any such multi-spot purchase fails its insert after
-- the user has already been charged via Paystack — with no rollback.
--
-- Fix: add a per-user seat counter and scope uniqueness to
-- (group_id, user_id, seat_number) instead. A normal single join always
-- uses the default seat_number of 1, so joining twice still collides and
-- is still blocked exactly as before; multi-spot purchases assign
-- sequential seat numbers so each row is distinct.

ALTER TABLE public.group_members
  ADD COLUMN IF NOT EXISTS seat_number INTEGER NOT NULL DEFAULT 1;

ALTER TABLE public.group_members
  DROP CONSTRAINT IF EXISTS group_members_group_user_unique;

ALTER TABLE public.group_members
  ADD CONSTRAINT group_members_group_user_seat_unique UNIQUE (group_id, user_id, seat_number);
