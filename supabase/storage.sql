-- =====================================================================
-- IKAMETI — Storage bucket for blog cover images
-- =====================================================================
-- Run this ONCE in the Supabase SQL Editor (after schema.sql and
-- restrict-admin.sql, because it relies on the public.is_admin() function).
--
-- It creates a PUBLIC bucket called "blog-images" so uploaded covers get a
-- normal public URL (the same kind the blog already expects), while only the
-- admin may upload / change / delete files.
-- =====================================================================

-- 1. Create the bucket (public read).
insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do update set public = true;

-- 2. Access rules on the files themselves.

-- Anyone can READ images (needed so they show on the public website).
drop policy if exists "blog_images_public_read" on storage.objects;
create policy "blog_images_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'blog-images');

-- Only the admin can UPLOAD.
drop policy if exists "blog_images_admin_insert" on storage.objects;
create policy "blog_images_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'blog-images' and public.is_admin());

-- Only the admin can REPLACE.
drop policy if exists "blog_images_admin_update" on storage.objects;
create policy "blog_images_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'blog-images' and public.is_admin())
  with check (bucket_id = 'blog-images' and public.is_admin());

-- Only the admin can DELETE.
drop policy if exists "blog_images_admin_delete" on storage.objects;
create policy "blog_images_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'blog-images' and public.is_admin());
