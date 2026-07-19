-- Comixiad initial schema
-- Run this in the Supabase SQL Editor (or via `supabase db push`).

-- ============ TABLES ============

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,30}$'),
  display_name text,
  bio text check (char_length(bio) <= 500),
  avatar_url text,
  country text,
  created_at timestamptz not null default now()
);

create table public.genres (
  id serial primary key,
  name text not null unique,
  slug text not null unique
);

create table public.series (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 150),
  slug text not null unique check (slug ~ '^[a-z0-9-]{1,160}$'),
  description text check (char_length(description) <= 2000),
  cover_url text,
  format text not null default 'pages' check (format in ('pages', 'webtoon')),
  reading_direction text not null default 'ltr' check (reading_direction in ('ltr', 'rtl')),
  language text not null default 'en',
  status text not null default 'ongoing' check (status in ('ongoing', 'completed', 'hiatus')),
  created_at timestamptz not null default now()
);

create table public.series_genres (
  series_id uuid not null references public.series (id) on delete cascade,
  genre_id int not null references public.genres (id) on delete cascade,
  primary key (series_id, genre_id)
);

create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references public.series (id) on delete cascade,
  number numeric not null,
  title text check (char_length(title) <= 150),
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (series_id, number)
);

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  page_number int not null,
  image_path text not null,
  width int,
  height int,
  unique (chapter_id, page_number)
);

create table public.likes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  series_id uuid not null references public.series (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, series_id)
);

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  series_id uuid not null references public.series (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, series_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

-- ============ INDEXES ============

create index series_creator_idx on public.series (creator_id);
create index series_created_idx on public.series (created_at desc);
create index chapters_series_idx on public.chapters (series_id);
create index pages_chapter_idx on public.pages (chapter_id);
create index comments_chapter_idx on public.comments (chapter_id);
create index likes_series_idx on public.likes (series_id);
create index follows_series_idx on public.follows (series_id);

-- ============ AUTO-CREATE PROFILE ON SIGNUP ============

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    -- derive a unique username from email/metadata; user can change it later
    coalesce(
      nullif(regexp_replace(lower(split_part(new.email, '@', 1)), '[^a-z0-9_]', '_', 'g'), ''),
      'user'
    ) || '_' || substr(replace(new.id::text, '-', ''), 1, 6),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ ROW LEVEL SECURITY ============

alter table public.profiles enable row level security;
alter table public.genres enable row level security;
alter table public.series enable row level security;
alter table public.series_genres enable row level security;
alter table public.chapters enable row level security;
alter table public.pages enable row level security;
alter table public.likes enable row level security;
alter table public.follows enable row level security;
alter table public.comments enable row level security;

-- profiles: public read, owner update
create policy "profiles are viewable by everyone"
  on public.profiles for select using (true);
create policy "users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- genres: public read (managed by admin via SQL)
create policy "genres are viewable by everyone"
  on public.genres for select using (true);

-- series: public read; owner full control
create policy "series are viewable by everyone"
  on public.series for select using (true);
create policy "creators can insert own series"
  on public.series for insert with check (auth.uid() = creator_id);
create policy "creators can update own series"
  on public.series for update using (auth.uid() = creator_id);
create policy "creators can delete own series"
  on public.series for delete using (auth.uid() = creator_id);

-- series_genres: follow series ownership
create policy "series genres are viewable by everyone"
  on public.series_genres for select using (true);
create policy "creators manage own series genres"
  on public.series_genres for all using (
    exists (
      select 1 from public.series s
      where s.id = series_id and s.creator_id = auth.uid()
    )
  );

-- chapters: published visible to all, drafts only to owner
create policy "published chapters are viewable by everyone"
  on public.chapters for select using (
    status = 'published'
    or exists (
      select 1 from public.series s
      where s.id = series_id and s.creator_id = auth.uid()
    )
  );
create policy "creators manage own chapters"
  on public.chapters for all using (
    exists (
      select 1 from public.series s
      where s.id = series_id and s.creator_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.series s
      where s.id = series_id and s.creator_id = auth.uid()
    )
  );

-- pages: visible when the parent chapter is visible
create policy "pages of published chapters are viewable by everyone"
  on public.pages for select using (
    exists (
      select 1 from public.chapters c
      join public.series s on s.id = c.series_id
      where c.id = chapter_id
        and (c.status = 'published' or s.creator_id = auth.uid())
    )
  );
create policy "creators manage own pages"
  on public.pages for all using (
    exists (
      select 1 from public.chapters c
      join public.series s on s.id = c.series_id
      where c.id = chapter_id and s.creator_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.chapters c
      join public.series s on s.id = c.series_id
      where c.id = chapter_id and s.creator_id = auth.uid()
    )
  );

-- likes / follows: public read, users manage their own rows
create policy "likes are viewable by everyone"
  on public.likes for select using (true);
create policy "users can like"
  on public.likes for insert with check (auth.uid() = user_id);
create policy "users can unlike"
  on public.likes for delete using (auth.uid() = user_id);

create policy "follows are viewable by everyone"
  on public.follows for select using (true);
create policy "users can follow"
  on public.follows for insert with check (auth.uid() = follower_id);
create policy "users can unfollow"
  on public.follows for delete using (auth.uid() = follower_id);

-- comments: readable when chapter is published; author manages own
create policy "comments on published chapters are viewable"
  on public.comments for select using (
    exists (
      select 1 from public.chapters c
      where c.id = chapter_id and c.status = 'published'
    )
  );
create policy "signed-in users can comment"
  on public.comments for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.chapters c
      where c.id = chapter_id and c.status = 'published'
    )
  );
create policy "authors can update own comments"
  on public.comments for update using (auth.uid() = user_id);
create policy "authors can delete own comments"
  on public.comments for delete using (auth.uid() = user_id);
