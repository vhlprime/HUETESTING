-- Run once in Supabase SQL editor. Stores every inbound email this Worker receives.
create table if not exists inbound_emails (
  id uuid primary key default gen_random_uuid(),
  from_address text not null,
  to_address text not null,
  subject text,
  text_body text,
  html_body text,
  attachment_count integer default 0,
  read boolean not null default false,
  received_at timestamptz not null default now()
);
alter table inbound_emails enable row level security;  -- service role only; browsers get nothing
