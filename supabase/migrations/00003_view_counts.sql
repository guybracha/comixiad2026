-- View counters for series.
-- Run after 00002 in the Supabase SQL Editor.

alter table public.series
  add column if not exists view_count bigint not null default 0;

-- Security-definer RPC so anonymous readers can bump the counter even though
-- RLS only lets owners update series rows.
create or replace function public.increment_series_views(sid uuid)
returns void
language sql
security definer set search_path = ''
as $$
  update public.series set view_count = view_count + 1 where id = sid;
$$;

grant execute on function public.increment_series_views(uuid) to anon, authenticated;
