-- Storage buckets + policies, and genre seed data.
-- Run after 00001_initial_schema.sql in the Supabase SQL Editor.

-- ============ STORAGE BUCKETS ============

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152,  array['image/jpeg', 'image/png', 'image/webp']),
  ('covers',  'covers',  true, 5242880,  array['image/jpeg', 'image/png', 'image/webp']),
  ('pages',   'pages',   true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Files are stored under a folder named after the uploader's user id:
--   avatars/{user_id}/avatar.webp
--   covers/{user_id}/{series_id}.webp
--   pages/{user_id}/{chapter_id}/{page_number}.webp
-- so ownership checks compare the first path segment to auth.uid().

create policy "public read access"
  on storage.objects for select
  using (bucket_id in ('avatars', 'covers', 'pages'));

create policy "users upload to own folder"
  on storage.objects for insert
  with check (
    bucket_id in ('avatars', 'covers', 'pages')
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users update own files"
  on storage.objects for update
  using (
    bucket_id in ('avatars', 'covers', 'pages')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users delete own files"
  on storage.objects for delete
  using (
    bucket_id in ('avatars', 'covers', 'pages')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============ GENRE SEED ============

insert into public.genres (name, slug) values
  ('Action', 'action'),
  ('Adventure', 'adventure'),
  ('Comedy', 'comedy'),
  ('Drama', 'drama'),
  ('Fantasy', 'fantasy'),
  ('Horror', 'horror'),
  ('Mystery', 'mystery'),
  ('Romance', 'romance'),
  ('Sci-Fi', 'sci-fi'),
  ('Slice of Life', 'slice-of-life'),
  ('Sports', 'sports'),
  ('Superhero', 'superhero'),
  ('Thriller', 'thriller'),
  ('Historical', 'historical'),
  ('Autobiographical', 'autobiographical')
on conflict (slug) do nothing;
