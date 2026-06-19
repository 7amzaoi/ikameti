-- =====================================================================
-- IKAMETI — Restrict admin access to a single email
-- =====================================================================
-- Run this ONCE in the Supabase SQL Editor (after schema.sql).
-- It makes ONLY the email below able to read submissions and manage blogs.
-- Any other Supabase Auth user — even if created later — gets nothing.
--
-- To change the admin later: edit the email inside is_admin() and re-run
-- this file (it is safe to run again).
-- =====================================================================

-- Central check used by every admin policy.
create or replace function public.is_admin()
returns boolean
language sql
stable
as $func$
  select coalesce(auth.jwt() ->> 'email', '') = 'hmzaaslan77@gmail.com'
$func$;


-- ---- CATEGORIES (admin write) --------------------------------------
drop policy if exists "categories_admin_write" on public.categories;
create policy "categories_admin_write"
  on public.categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---- BLOGS (admin read drafts + write) -----------------------------
drop policy if exists "blogs_admin_read_all" on public.blogs;
create policy "blogs_admin_read_all"
  on public.blogs for select
  to authenticated
  using (public.is_admin());

drop policy if exists "blogs_admin_write" on public.blogs;
create policy "blogs_admin_write"
  on public.blogs for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---- RESIDENCY SUBMISSIONS (admin read/update/delete) --------------
drop policy if exists "residency_admin_read" on public.residency_submissions;
create policy "residency_admin_read"
  on public.residency_submissions for select
  to authenticated
  using (public.is_admin());

drop policy if exists "residency_admin_update" on public.residency_submissions;
create policy "residency_admin_update"
  on public.residency_submissions for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "residency_admin_delete" on public.residency_submissions;
create policy "residency_admin_delete"
  on public.residency_submissions for delete
  to authenticated
  using (public.is_admin());

-- ---- REMINDER SUBMISSIONS (admin read/update/delete) ---------------
drop policy if exists "reminder_admin_read" on public.reminder_submissions;
create policy "reminder_admin_read"
  on public.reminder_submissions for select
  to authenticated
  using (public.is_admin());

drop policy if exists "reminder_admin_update" on public.reminder_submissions;
create policy "reminder_admin_update"
  on public.reminder_submissions for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "reminder_admin_delete" on public.reminder_submissions;
create policy "reminder_admin_delete"
  on public.reminder_submissions for delete
  to authenticated
  using (public.is_admin());

-- NOTE: the public policies are intentionally left unchanged:
--   * anonymous visitors can still READ published blogs + categories
--   * anonymous visitors can still INSERT into the two form tables
-- Only the admin-only capabilities above are now locked to your email.
