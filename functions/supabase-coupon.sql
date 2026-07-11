-- Run once in Supabase SQL editor (Dashboard -> SQL) to enable first-order coupon enforcement.
create table if not exists coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null,
  order_id text,
  redeemed_at timestamptz not null default now()
);
create unique index if not exists one_coupon_per_email on coupon_redemptions (lower(email), code);
alter table coupon_redemptions enable row level security;  -- service role bypasses RLS; browsers get nothing
