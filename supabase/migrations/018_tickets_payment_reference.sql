-- 018: add payment_reference to tickets, so a ticket can be reliably
-- traced back to the transaction that issued it.
--
-- Needed for the new "Transaction History" view: showing a confirmed
-- transaction's issued ticket(s) requires actually linking them.
-- `orders` and `group_members` both already store payment_reference —
-- `tickets` never has, and there's no order_id on it either, so the only
-- way to guess which ticket came from which order was matching on
-- (user_id, event_id, close timestamp), which is fragile and breaks the
-- moment someone buys two ticket types for the same event minutes apart.
--
-- Every ticket-creation call site is updated in this same change to set
-- this column, so it's populated going forward. Existing tickets are left
-- NULL — nothing else in the schema records the real reference for
-- issued tickets, so this can't be safely backfilled by guessing.

ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS payment_reference TEXT;

CREATE INDEX IF NOT EXISTS idx_tickets_payment_reference ON public.tickets(payment_reference);
