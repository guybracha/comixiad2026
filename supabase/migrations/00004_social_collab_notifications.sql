-- Series comments, creator collaborations, notifications, social links.
-- Run after 00003 in the Supabase SQL Editor.

-- ============ SOCIAL LINKS ON PROFILES ============

alter table public.profiles
  add column if not exists social_links jsonb not null default '{}'::jsonb;

-- ============ SERIES COMMENTS ============

create table public.series_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  series_id uuid not null references public.series (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index series_comments_series_idx on public.series_comments (series_id);

alter table public.series_comments enable row level security;

create policy "series comments are viewable by everyone"
  on public.series_comments for select using (true);
create policy "signed-in users can comment on series"
  on public.series_comments for insert with check (auth.uid() = user_id);
create policy "authors can update own series comments"
  on public.series_comments for update using (auth.uid() = user_id);
create policy "authors can delete own series comments"
  on public.series_comments for delete using (auth.uid() = user_id);

-- ============ COLLABORATORS ============

create table public.series_collaborators (
  series_id uuid not null references public.series (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'Collaborator' check (char_length(role) between 1 and 40),
  created_at timestamptz not null default now(),
  primary key (series_id, user_id)
);

create index series_collaborators_user_idx on public.series_collaborators (user_id);

alter table public.series_collaborators enable row level security;

create policy "collaborators are viewable by everyone"
  on public.series_collaborators for select using (true);
create policy "series owners manage collaborators"
  on public.series_collaborators for all using (
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
create policy "collaborators can leave"
  on public.series_collaborators for delete using (auth.uid() = user_id);

-- Let collaborators manage chapters and pages too.

drop policy "published chapters are viewable by everyone" on public.chapters;
create policy "published chapters are viewable by everyone"
  on public.chapters for select using (
    status = 'published'
    or exists (
      select 1 from public.series s
      where s.id = series_id and s.creator_id = auth.uid()
    )
    or exists (
      select 1 from public.series_collaborators sc
      where sc.series_id = chapters.series_id and sc.user_id = auth.uid()
    )
  );

drop policy "creators manage own chapters" on public.chapters;
create policy "creators manage own chapters"
  on public.chapters for all using (
    exists (
      select 1 from public.series s
      where s.id = series_id and s.creator_id = auth.uid()
    )
    or exists (
      select 1 from public.series_collaborators sc
      where sc.series_id = chapters.series_id and sc.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.series s
      where s.id = series_id and s.creator_id = auth.uid()
    )
    or exists (
      select 1 from public.series_collaborators sc
      where sc.series_id = chapters.series_id and sc.user_id = auth.uid()
    )
  );

drop policy "pages of published chapters are viewable by everyone" on public.pages;
create policy "pages of published chapters are viewable by everyone"
  on public.pages for select using (
    exists (
      select 1 from public.chapters c
      join public.series s on s.id = c.series_id
      where c.id = chapter_id
        and (
          c.status = 'published'
          or s.creator_id = auth.uid()
          or exists (
            select 1 from public.series_collaborators sc
            where sc.series_id = s.id and sc.user_id = auth.uid()
          )
        )
    )
  );

drop policy "creators manage own pages" on public.pages;
create policy "creators manage own pages"
  on public.pages for all using (
    exists (
      select 1 from public.chapters c
      join public.series s on s.id = c.series_id
      where c.id = chapter_id
        and (
          s.creator_id = auth.uid()
          or exists (
            select 1 from public.series_collaborators sc
            where sc.series_id = s.id and sc.user_id = auth.uid()
          )
        )
    )
  ) with check (
    exists (
      select 1 from public.chapters c
      join public.series s on s.id = c.series_id
      where c.id = chapter_id
        and (
          s.creator_id = auth.uid()
          or exists (
            select 1 from public.series_collaborators sc
            where sc.series_id = s.id and sc.user_id = auth.uid()
          )
        )
    )
  );

-- ============ NOTIFICATIONS ============

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  data jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "users see own notifications"
  on public.notifications for select using (auth.uid() = user_id);
create policy "users update own notifications"
  on public.notifications for update using (auth.uid() = user_id);
create policy "users delete own notifications"
  on public.notifications for delete using (auth.uid() = user_id);
-- No insert policy on purpose: rows are created by security-definer triggers.

-- Notify followers when a chapter is published.
create or replace function public.notify_followers_on_publish()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare s record;
begin
  if new.status = 'published'
     and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    select id, title, slug, creator_id into s
    from public.series where id = new.series_id;

    insert into public.notifications (user_id, type, data)
    select f.follower_id, 'new_chapter', jsonb_build_object(
      'series_title', s.title,
      'series_slug', s.slug,
      'chapter_number', new.number,
      'chapter_title', new.title
    )
    from public.follows f
    where f.series_id = new.series_id and f.follower_id <> s.creator_id;
  end if;
  return new;
end;
$$;

create trigger on_chapter_published
  after insert or update of status on public.chapters
  for each row execute function public.notify_followers_on_publish();

-- Notify the series creator on a new chapter comment.
create or replace function public.notify_creator_on_chapter_comment()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  s record;
  commenter text;
begin
  select se.creator_id, se.title, se.slug, c.number as chapter_number
    into s
  from public.chapters c join public.series se on se.id = c.series_id
  where c.id = new.chapter_id;

  if s.creator_id is not null and s.creator_id <> new.user_id then
    select username into commenter from public.profiles where id = new.user_id;
    insert into public.notifications (user_id, type, data)
    values (s.creator_id, 'comment', jsonb_build_object(
      'series_title', s.title,
      'series_slug', s.slug,
      'chapter_number', s.chapter_number,
      'commenter', commenter,
      'preview', left(new.body, 80)
    ));
  end if;
  return new;
end;
$$;

create trigger on_chapter_comment
  after insert on public.comments
  for each row execute function public.notify_creator_on_chapter_comment();

-- Notify the series creator on a new series comment.
create or replace function public.notify_creator_on_series_comment()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  s record;
  commenter text;
begin
  select creator_id, title, slug into s from public.series where id = new.series_id;

  if s.creator_id is not null and s.creator_id <> new.user_id then
    select username into commenter from public.profiles where id = new.user_id;
    insert into public.notifications (user_id, type, data)
    values (s.creator_id, 'comment', jsonb_build_object(
      'series_title', s.title,
      'series_slug', s.slug,
      'commenter', commenter,
      'preview', left(new.body, 80)
    ));
  end if;
  return new;
end;
$$;

create trigger on_series_comment
  after insert on public.series_comments
  for each row execute function public.notify_creator_on_series_comment();

-- Notify a creator when they are added as a collaborator.
create or replace function public.notify_on_collaborator_added()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare s record;
begin
  select title, slug into s from public.series where id = new.series_id;
  insert into public.notifications (user_id, type, data)
  values (new.user_id, 'collab_added', jsonb_build_object(
    'series_title', s.title,
    'series_slug', s.slug,
    'role', new.role
  ));
  return new;
end;
$$;

create trigger on_collaborator_added
  after insert on public.series_collaborators
  for each row execute function public.notify_on_collaborator_added();
