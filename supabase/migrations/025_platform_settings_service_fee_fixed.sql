-- 025: add the flat ₦ service fee back alongside the percentage one.
--
-- The buyer service fee was always meant to be a percentage PLUS a fixed
-- amount per transaction, not just a percentage — the fixed part fell out
-- when pricing moved from a hardcoded constant to a live platform_settings
-- lookup. This restores it as its own admin-editable column instead of
-- hardcoding it again.

ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS service_fee_fixed NUMERIC(10, 2) NOT NULL DEFAULT 100;
