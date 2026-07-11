-- Run once in Supabase SQL editor. Powers the employee clock-in/out + payroll portal.

-- Staff accounts. Passwords are stored ONLY as salted SHA-256 hashes (never raw).
create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  display_name text not null,
  pass_salt text not null,
  pass_hash text not null,
  hourly_rate numeric(10,2),          -- optional, for the manager's payroll totals
  active boolean not null default true,
  is_manager boolean not null default false,
  created_at timestamptz not null default now()
);

-- One row per clock-in; clock_out is filled when they sign off. Duration is derived.
create table if not exists shifts (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff(id),
  clock_in timestamptz not null default now(),
  clock_out timestamptz,
  minutes integer,                    -- filled on clock-out = round((out-in)/60)
  note text,
  created_at timestamptz not null default now()
);
create index if not exists shifts_staff_time on shifts (staff_id, clock_in desc);
create index if not exists shifts_open on shifts (staff_id) where clock_out is null;

alter table staff  enable row level security;   -- service role only; browser never touches these
alter table shifts enable row level security;
