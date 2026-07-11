-- Run once in Supabase SQL editor. Stores any payment whose captured amount
-- did not match the server-computed order total, for owner review.
create table if not exists payment_discrepancies (
  id uuid primary key default gen_random_uuid(),
  order_id text,
  order_code text,
  expected_total numeric(10,2),
  paid_total numeric(10,2),
  email text,
  raw jsonb,
  reviewed boolean not null default false,
  created_at timestamptz not null default now()
);
alter table payment_discrepancies enable row level security;  -- service role only; browsers get nothing
