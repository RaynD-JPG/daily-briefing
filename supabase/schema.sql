-- Daily Briefing — database schema
-- Paste this whole file into the Supabase SQL Editor (Dashboard → SQL Editor → New query) and run it.
-- It is safe to re-run: it uses "if not exists" and recreates policies.

-- ============================================================
-- Tables
-- ============================================================

-- One briefing per day, shared by all users. Written only by the server (cron job).
create table if not exists public.briefings (
  id                uuid primary key default gen_random_uuid(),
  date              date not null unique,
  closing_question  text not null,
  model             text not null,
  generated_at      timestamptz not null default now()
);

-- The stories inside a briefing.
create table if not exists public.stories (
  id              uuid primary key default gen_random_uuid(),
  briefing_id     uuid not null references public.briefings (id) on delete cascade,
  section         text not null,  -- allowed values: see stories_section_check below
  position        integer not null,
  title           text not null,
  summary         text not null,
  why_it_matters  text not null,
  sources         jsonb not null default '[]'::jsonb,  -- [{ "name": "BBC", "url": "https://..." }]
  perspectives    text,                                -- only for contested stories
  unique (briefing_id, section, position)
);

create index if not exists stories_briefing_id_idx on public.stories (briefing_id);

-- Allowed sections. Recreated on every run so adding a section = edit this list and re-run.
alter table public.stories drop constraint if exists stories_section_check;
alter table public.stories add constraint stories_section_check
  check (section in ('world', 'hungary', 'jordan', 'economy', 'tech', 'positive'));

-- Bookmarks: private to each user (used in the Extras phase).
create table if not exists public.bookmarks (
  user_id     uuid not null references auth.users (id) on delete cascade,
  story_id    uuid not null references public.stories (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, story_id)
);

-- ============================================================
-- Row-Level Security
-- ============================================================
-- briefings / stories: any logged-in user can read; there are NO insert/update/delete
-- policies, so only the server's service-role key (which bypasses RLS) can write.
-- bookmarks: each user can only see and change their own rows.

alter table public.briefings enable row level security;
alter table public.stories   enable row level security;
alter table public.bookmarks enable row level security;

drop policy if exists "Logged-in users can read briefings" on public.briefings;
create policy "Logged-in users can read briefings"
  on public.briefings for select to authenticated using (true);

drop policy if exists "Logged-in users can read stories" on public.stories;
create policy "Logged-in users can read stories"
  on public.stories for select to authenticated using (true);

drop policy if exists "Users manage their own bookmarks" on public.bookmarks;
create policy "Users manage their own bookmarks"
  on public.bookmarks for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
