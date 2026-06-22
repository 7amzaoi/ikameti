-- =====================================================================
-- IKAMETI — News feature
-- =====================================================================
-- Run this whole file once in the Supabase SQL Editor (it is idempotent).
-- It creates the `news` table used by:
--   * the homepage news box (below the hero) — shows status='published' only
--   * the admin dashboard "News" page — full create/edit/delete + drafts
--
-- Mirrors the security model of the blogs table:
--   * anonymous visitors  -> can READ published news only
--   * the admin email      -> full access (incl. drafts), via public.is_admin()
--
-- Requires public.is_admin() and public.set_updated_at(), which already exist
-- (created by supabase/schema.sql). If you have not run schema.sql yet, run it
-- first, then run this file.
-- =====================================================================

create table if not exists public.news (
  id             bigint generated always as identity primary key,
  title          text        not null,
  body           text,                          -- short article shown in the box (HTML/plain)
  image          text,                          -- optional cover image URL
  translations   jsonb       not null default '{}'::jsonb,  -- {"ar":{"title","body"}, ...}
  published_date date        not null default current_date,
  show_date      boolean     not null default true,         -- show/hide the date on the public box
  status         text        not null default 'draft'
                             check (status in ('draft', 'published')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Added after the first release: lets each item hide its date on the public box.
alter table public.news add column if not exists show_date boolean not null default true;

comment on table public.news is 'Homepage news items. status=published are shown publicly; draft are admin-only.';

create index if not exists news_status_idx         on public.news (status);
create index if not exists news_published_date_idx on public.news (published_date desc);

drop trigger if exists news_set_updated_at on public.news;
create trigger news_set_updated_at
  before update on public.news
  for each row execute function public.set_updated_at();

-- ---- ROW LEVEL SECURITY --------------------------------------------
alter table public.news enable row level security;

-- Public visitors can only read PUBLISHED news.
drop policy if exists "news_public_read_published" on public.news;
create policy "news_public_read_published"
  on public.news for select
  to anon
  using (status = 'published');

-- Admins can read everything (including drafts).
drop policy if exists "news_admin_read_all" on public.news;
create policy "news_admin_read_all"
  on public.news for select
  to authenticated
  using (public.is_admin());

-- Admins can create / edit / delete.
drop policy if exists "news_admin_write" on public.news;
create policy "news_admin_write"
  on public.news for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---- OPTIONAL SEED -------------------------------------------------
insert into public.news (title, body, status, published_date) values
  ('Welcome to IKAMETI News',
   'This is where we will post the latest updates about residency rules, housing offers and important announcements. Stay tuned!',
   'published', current_date)
on conflict do nothing;
