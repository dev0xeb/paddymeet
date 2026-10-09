-- Paying into a group ticket checked remaining capacity with a plain
-- SELECT COUNT(*), then inserted the paid group_members rows in a
-- separate statement. Two people paying for the same last open seat at
-- the same moment could both pass that check before either insert
-- landed, letting a group end up with more paid members than its stated
-- size — the same shape of bug already fixed at the ticket-type/table
-- level in migration 020, one level down.
--
-- This function does the capacity check AND the insert inside one
-- function call, locking the group's own row for the duration — any
-- concurrent call for the same group_id blocks until the first one
-- commits, so the second call's capacity check is guaranteed to see the
-- first one's just-inserted rows.
CREATE OR REPLACE FUNCTION public.claim_group_seats(
  p_group_id UUID,
  p_user_id UUID,
  p_role TEXT,
  p_payment_reference TEXT,
  p_amount_per_spot NUMERIC,
  p_members JSONB -- array of {"name": ..., "email": ..., "phone": ...}
)
RETURNS TABLE(claimed BOOLEAN, inserted_ids UUID[]) AS $$
DECLARE
  v_max_members INT;
  v_current_paid INT;
  v_next_seat INT;
  v_spot_count INT;
  v_ids UUID[];
BEGIN
  -- Row lock held until this function's transaction ends — serializes
  -- every concurrent seat claim for this exact group.
  PERFORM 1 FROM public.groups WHERE id = p_group_id FOR UPDATE;

  SELECT max_members INTO v_max_members FROM public.groups WHERE id = p_group_id;
  IF v_max_members IS NULL THEN
    RETURN QUERY SELECT FALSE, ARRAY[]::UUID[];
    RETURN;
  END IF;

  SELECT COUNT(*) INTO v_current_paid
  FROM public.group_members
  WHERE group_id = p_group_id AND payment_status = 'paid';

  v_spot_count := jsonb_array_length(p_members);

  IF v_current_paid + v_spot_count > v_max_members THEN
    RETURN QUERY SELECT FALSE, ARRAY[]::UUID[];
    RETURN;
  END IF;

  SELECT COALESCE(MAX(seat_number), 0) + 1 INTO v_next_seat
  FROM public.group_members
  WHERE group_id = p_group_id AND user_id = p_user_id;

  WITH inserted AS (
    INSERT INTO public.group_members (
      group_id, user_id, seat_number, role, payment_status,
      amount_paid, payment_reference, paid_at,
      attendee_name, attendee_email, attendee_phone
    )
    SELECT
      p_group_id,
      p_user_id,
      v_next_seat + (ROW_NUMBER() OVER () - 1)::INT,
      p_role,
      'paid',
      p_amount_per_spot,
      p_payment_reference,
      NOW(),
      NULLIF(m->>'name', ''),
      NULLIF(m->>'email', ''),
      NULLIF(m->>'phone', '')
    FROM jsonb_array_elements(p_members) AS m
    RETURNING id
  )
  SELECT array_agg(id) INTO v_ids FROM inserted;

  RETURN QUERY SELECT TRUE, v_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
