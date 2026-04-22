-- Supabase migration: jobs table + RLS public read policy.
-- RLS fix note: Frontend uses anon key, so SELECT needs explicit policy.

create extension if not exists "pgcrypto";

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  state text not null,
  is_central boolean not null default false,
  location text,
  description text,
  last_date date,
  source_url text not null,
  posted_at timestamptz not null default now(),
  scraped_at timestamptz not null default now()
);

-- Composite uniqueness for dedupe during scraper upsert.
create unique index if not exists jobs_unique_title_lastdate_state
  on public.jobs (title, last_date, state);

alter table public.jobs enable row level security;

drop policy if exists "public_select" on public.jobs;
create policy "public_select"
  on public.jobs
  for select
  using (true);
