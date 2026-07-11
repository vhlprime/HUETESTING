-- Run once in Supabase SQL editor. Creates the payment-truth tables.
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,              -- human order code e.g. HV-1234
  payment_id text unique,                 -- Stripe payment_intent / PayPal capture id (idempotency key)
  method text,                            -- 'PayPal' | 'Apple Pay' | 'Card'
  status text not null default 'pending', -- pending -> paid (only via server verification)
  amount_cents integer,
  currency text default 'usd',
  email text, phone text, customer_name text,
  items jsonb, totals jsonb, pickup text,
  notified boolean not null default false,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists webhook_events (
  event_id text primary key,              -- provider event id; PK = processed exactly once
  provider text not null,                 -- 'stripe' | 'paypal'
  received_at timestamptz not null default now()
);

alter table orders enable row level security;         -- service role bypasses; browsers get nothing
alter table webhook_events enable row level security;
