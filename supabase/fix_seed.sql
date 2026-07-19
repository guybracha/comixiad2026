-- REPAIR SCRIPT — safe to run multiple times.
-- Re-creates the storage buckets, storage policies and genre seed data
-- in case migration 00002 failed partway (e.g. "policy already exists").

-- ============ STORAGE BUCKETS ============

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152,  array['image/jpeg', 'image/png', 'image/webp']),
  ('covers',  'covers',  true, 5242880,  array['image/jpeg', 'image/png', 'image/webp']),
  ('pages',   'pages',   true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- ============ STORAGE POLICIES (drop + recreate so re-runs never fail) ============

drop policy if exists "public read access" on storage.objects;
create policy "public read access"
  on storage.objects for select
  using (bucket_id in ('avatars', 'covers', 'pages'));

drop policy if exists "users upload to own folder" on storage.objects;
create policy "users upload to own folder"
  on storage.objects for insert
  with check (
    bucket_id in ('avatars', 'covers', 'pages')
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users update own files" on storage.objects;
create policy "users update own files"
  on storage.objects for update
  using (
    bucket_id in ('avatars', 'covers', 'pages')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users delete own files" on storage.objects;
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

-- ============ SANITY CHECK — should return 15 and 3 ============

select
  (select count(*) from public.genres) as genres_count,
  (select count(*) from storage.buckets where id in ('avatars','covers','pages')) as buckets_count;
