-- 023: record what Paystack actually deducted on each order.
--
-- The buyer's service fee and Paystack's own processing fee are two
-- separate things that were getting conflated — this app had no record
-- anywhere of what Paystack itself took per transaction, only what the
-- buyer was charged. Paystack already returns this on every transaction
-- (the `fees` field, in kobo) in the exact same verify/webhook responses
-- this app already reads — it just wasn't being captured.
--
-- Purely a reconciliation record: never used in any amount check, payout
-- math, or organiser-facing figure. Defaults to 0 so existing rows (and
-- any future insert that doesn't set it) aren't null.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS paystack_fee NUMERIC(10, 2) NOT NULL DEFAULT 0;
