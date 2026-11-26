-- PalmInsight schema for a plain self-hosted Postgres instance.
-- Supersedes supabase/schema.sql (that file was stale — missing person_name,
-- verified, verify_token columns the code actually reads/writes).

create table if not exists palm_users (
  id uuid primary key,
  email text unique not null,
  password_hash text not null,
  verified boolean not null default false,
  verify_token text,
  created_at timestamptz not null default now()
);

create table if not exists palm_scans (
  id uuid primary key,
  owner_key text not null,
  result jsonb not null,
  paid boolean not null default false,
  image text,
  person_name text,
  created_at timestamptz not null default now()
);
create index if not exists palm_scans_owner_idx on palm_scans (owner_key);
create index if not exists palm_scans_created_idx on palm_scans (created_at);

create table if not exists palm_payments (
  id uuid primary key,
  scan_id uuid not null,
  owner_key text not null,
  amount_cents integer not null,
  currency text not null,
  provider text not null,
  status text not null,
  created_at timestamptz not null default now()
);
create index if not exists palm_payments_scan_idx on palm_payments (scan_id);

create table if not exists palm_events (
  id bigint generated always as identity primary key,
  name text not null,
  owner_key text,
  scan_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists palm_events_name_idx on palm_events (name);
