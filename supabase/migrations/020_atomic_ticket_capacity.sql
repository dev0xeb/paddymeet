-- Ticket capacity was enforced via app-level compare-and-swap loops against
-- the cached ticket_types.quantity_sold column. That column can drift from
-- the real ticket count (bad data, a failed rollback, anything that writes
-- tickets without going through the checkout routes) and once it does, the
-- capacity check silently trusts the wrong number and lets an event sell
-- past what the organiser published. These functions replace that with a
-- single locked, self-healing check per purchase attempt.

-- Individual (non-group) ticket capacity: derives quantity_sold from the
-- real, current count of non-cancelled ticket rows every time it's called,
-- so any drift self-corrects instead of quietly allowing overselling.
CREATE OR REPLACE FUNCTION public.reserve_individual_ticket_capacity(
  p_ticket_type_id UUID,
  p_quantity INT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_capacity INT;
  v_real_sold INT;
BEGIN
  SELECT quantity INTO v_capacity
  FROM public.ticket_types
  WHERE id = p_ticket_type_id
  FOR UPDATE;

  IF v_capacity IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT COUNT(*) INTO v_real_sold
  FROM public.tickets
  WHERE ticket_type_id = p_ticket_type_id
    AND status <> 'cancelled';

  IF v_real_sold + p_quantity > v_capacity THEN
    UPDATE public.ticket_types SET quantity_sold = v_real_sold WHERE id = p_ticket_type_id;
    RETURN FALSE;
  END IF;

  UPDATE public.ticket_types
  SET quantity_sold = v_real_sold + p_quantity
  WHERE id = p_ticket_type_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Group ticket "table" capacity: one unit of quantity == one table/group,
-- regardless of its group_size — a table holds its reserved unit for as
-- long as its group is 'recruiting' or 'completed'. A 'merged' or 'failed'
-- group has given that unit back.
CREATE OR REPLACE FUNCTION public.reserve_group_ticket_table(
  p_ticket_type_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_capacity INT;
  v_active_tables INT;
BEGIN
  SELECT quantity INTO v_capacity
  FROM public.ticket_types
  WHERE id = p_ticket_type_id
  FOR UPDATE;

  IF v_capacity IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT COUNT(*) INTO v_active_tables
  FROM public.groups
  WHERE ticket_type_id = p_ticket_type_id
    AND status IN ('recruiting', 'completed');

  IF v_active_tables + 1 > v_capacity THEN
    UPDATE public.ticket_types SET quantity_sold = v_active_tables WHERE id = p_ticket_type_id;
    RETURN FALSE;
  END IF;

  UPDATE public.ticket_types
  SET quantity_sold = v_active_tables + 1
  WHERE id = p_ticket_type_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recomputes quantity_sold for a group ticket type from real active-table
-- state. Used after a merge/failure releases a table's held slot, since
-- there's no single new reservation to attribute the change to.
CREATE OR REPLACE FUNCTION public.resync_group_ticket_type_sold(
  p_ticket_type_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_active_tables INT;
BEGIN
  SELECT COUNT(*) INTO v_active_tables
  FROM public.groups
  WHERE ticket_type_id = p_ticket_type_id
    AND status IN ('recruiting', 'completed');

  UPDATE public.ticket_types
  SET quantity_sold = v_active_tables
  WHERE id = p_ticket_type_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- One-time reconciliation for individual ticket types already drifted.
UPDATE public.ticket_types tt
SET quantity_sold = COALESCE(sub.real_count, 0)
FROM (
  SELECT ticket_type_id, COUNT(*) AS real_count
  FROM public.tickets
  WHERE status <> 'cancelled'
  GROUP BY ticket_type_id
) sub
WHERE tt.id = sub.ticket_type_id
  AND tt.is_group_ticket = FALSE
  AND tt.quantity_sold IS DISTINCT FROM sub.real_count;

UPDATE public.ticket_types
SET quantity_sold = 0
WHERE is_group_ticket = FALSE
  AND quantity_sold <> 0
  AND id NOT IN (
    SELECT DISTINCT ticket_type_id FROM public.tickets
    WHERE status <> 'cancelled' AND ticket_type_id IS NOT NULL
  );

-- One-time reconciliation for group ticket types (table-unit based).
UPDATE public.ticket_types tt
SET quantity_sold = COALESCE(sub.active_tables, 0)
FROM (
  SELECT ticket_type_id, COUNT(*) AS active_tables
  FROM public.groups
  WHERE status IN ('recruiting', 'completed')
  GROUP BY ticket_type_id
) sub
WHERE tt.id = sub.ticket_type_id
  AND tt.is_group_ticket = TRUE
  AND tt.quantity_sold IS DISTINCT FROM sub.active_tables;

UPDATE public.ticket_types
SET quantity_sold = 0
WHERE is_group_ticket = TRUE
  AND quantity_sold <> 0
  AND id NOT IN (
    SELECT DISTINCT ticket_type_id FROM public.groups
    WHERE status IN ('recruiting', 'completed') AND ticket_type_id IS NOT NULL
  );
