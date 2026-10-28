-- Fixed-window request counter for rate limiting sensitive routes
-- (signup, admin login, password reset, bank verification, ticket
-- reservation). Only ever touched via the service-role client and the
-- check_rate_limit() function below, so no public RLS policy is needed —
-- same pattern as job_applications.
create table if not exists rate_limits (
  key text primary key,
  count integer not null default 1,
  window_start timestamptz not null default now()
);

alter table rate_limits enable row level security;

-- Atomic check-and-increment: resets the counter if the window has
-- expired, otherwise increments it, all in one upserted row so concurrent
-- requests for the same key can't race past the limit between a read and
-- a write.
create or replace function check_rate_limit(p_key text, p_limit int, p_window_seconds int)
returns boolean
language plpgsql
as $$
declare
  v_count int;
begin
  insert into rate_limits (key, count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update set
    count = case
      when rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval
        then 1
      else rate_limits.count + 1
    end,
    window_start = case
      when rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval
        then now()
      else rate_limits.window_start
    end
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;

-- Periodic cleanup is left to the caller (or a scheduled job later) — rows
-- are tiny (one per key) and self-resetting, so there's no correctness
-- need to delete old ones, only a storage-tidiness one.
