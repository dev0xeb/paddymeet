-- 015: add the missing bank_recipient_code column on organisers.
--
-- Confirmed directly against the live database: `organisers` actually has
-- `account_number` / `account_name` (not the `bank_account_number` /
-- `bank_account_name` names migration 001 defined and the app code was
-- still written against — same drift pattern found repeatedly this
-- session, now fixed in the app code to match live reality) and has no
-- `bank_recipient_code` column at all. That second one breaks the payout
-- disbursement route for real: it tries to cache the Paystack transfer
-- recipient code back onto the organiser after creating it, and Postgres
-- REST silently can't find the column ("Could not find the
-- 'bank_recipient_code' column of 'organisers' in the schema cache"),
-- which is exactly the class of error the organiser-facing settings page
-- was surfacing raw to a real user.
--
-- Unlike the account_number/account_name mismatch (renamed in the app
-- code instead, since live data already exists under those names), this
-- column has never existed anywhere — it's a genuinely new addition.

ALTER TABLE public.organisers ADD COLUMN IF NOT EXISTS bank_recipient_code TEXT;
