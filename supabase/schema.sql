-- PalmInsight Supabase schema (full data model: Users / PalmScans / Reports /
-- Payments + analytics events). Run this in the Supabase SQL editor to enable
-- persistence. Until configured, the app uses an in-memory store (lib/store.ts).
--
-- All access is via the server using the service-role key, which bypasses RLS.
-- RLS is enabled with NO public policies, so the anon key cannot touch these
-- tables directly.

-- Users ---------------------------------------------------------------------
create table if not exists public.palm_users (
  id uuid primary key,
  email text unique not null,
  password_hash text not null,         -- scrypt salt:hash (never the raw pw)
  created_at timestamptz not null default now()
);

-- PalmScans (+ embedded Reports as JSON) ------------------------------------
create table if not exists public.palm_scans (
  id uuid primary key,
  owner_key text not null,             -- user id or anonymous device id
  result jsonb not null,               -- full analysis incl. premium report
  paid boolean not null default false,
  image text,                          -- optional palm image (opt-in only)
  created_at timestamptz not null default now()
);
create index if not exists palm_scans_owner_idx on public.palm_scans (owner_key);
create index if not exists palm_scans_created_idx on public.palm_scans (created_at);

-- Payments ------------------------------------------------------------------
create table if not exists public.palm_payments (
  id uuid primary key,
  scan_id uuid not null,
  owner_key text not null,
  amount_cents integer not null,
  currency text not null,
  provider text not null,              -- 'polar' | 'mock'
  status text not null,                -- 'paid'
  created_at timestamptz not null default now()
);
create index if not exists palm_payments_scan_idx on public.palm_payments (scan_id);

-- Analytics events ----------------------------------------------------------
create table if not exists public.palm_events (
  id bigint generated always as identity primary key,
  name text not null,
  owner_key text,
  scan_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists palm_events_name_idx on public.palm_events (name);

-- Lock everything down to server-side (service-role) access only.
alter table public.palm_users enable row level security;
alter table public.palm_scans enable row level security;
alter table public.palm_payments enable row level security;
alter table public.palm_events enable row level security;

-- Optional: auto-delete scans older than 30 days (privacy). Requires pg_cron.
-- select cron.schedule('purge-old-scans', '0 3 * * *',
--   $$ delete from public.palm_scans where created_at < now() - interval '30 days' $$);
