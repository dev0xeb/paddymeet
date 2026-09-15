-- 009: allow 'processing' as a payouts.status value.
--
-- app/api/admin/payouts/[id]/disburse/route.ts sets status to 'processing'
-- as an in-flight lock while it talks to Paystack, specifically to stop a
-- second concurrent disburse call (double-click, two admin tabs) from
-- also passing its own guard and firing a second real bank transfer for
-- the same payout. But payouts.status only allowed
-- ('pending', 'paid', 'hold', 'failed') — so that update was rejected by
-- the CHECK constraint every time, its error silently unchecked, meaning
-- the lock never actually took effect and both concurrent requests could
-- proceed to call Paystack.

ALTER TABLE public.payouts
  DROP CONSTRAINT IF EXISTS payouts_status_check;

ALTER TABLE public.payouts
  ADD CONSTRAINT payouts_status_check CHECK (status IN ('pending', 'processing', 'paid', 'hold', 'failed'));
