-- =====================================================================
-- IKAMETI — Add multilingual translations to blog articles
-- =====================================================================
-- Run this ONCE in the Supabase SQL Editor if your database was created
-- before the blog translations feature. It is safe to run again.
--
-- It adds a `translations` JSONB column to public.blogs that stores
-- per-language overrides for the article, e.g.:
--   {
--     "ar": { "title": "...", "description": "...", "content": "<p>…</p>" },
--     "tr": { "title": "...", "description": "...", "content": "<p>…</p>" }
--   }
-- When a visitor switches the site language, the blog shows the matching
-- translation; languages left empty fall back to the default article text.
-- =====================================================================

alter table public.blogs
  add column if not exists translations jsonb not null default '{}'::jsonb;
