-- Add optional public profile bios and let authenticated users edit only their own profile.
alter table public.users add column if not exists bio varchar(160) not null default '';

drop policy if exists "public access" on public.users;
drop policy if exists "profiles are viewable by everyone" on public.users;
drop policy if exists "users can create their own profile" on public.users;
drop policy if exists "users can update their own profile" on public.users;

create policy "profiles are viewable by everyone"
  on public.users for select
  using (true);

create policy "users can create their own profile"
  on public.users for insert
  with check (auth.uid()::text = id);

create policy "users can update their own profile"
  on public.users for update
  using (auth.uid()::text = id)
  with check (auth.uid()::text = id);

create table if not exists public.user_profile_private (
  user_id text primary key references public.users (id) on delete cascade,
  sex text,
  age smallint check (age is null or age between 13 and 120),
  sex_public boolean not null default false,
  age_public boolean not null default false,
  is_coach boolean not null default false,
  coach_public boolean not null default false,
  coach_certificate_path text,
  updated_at timestamptz not null default now()
);

alter table public.user_profile_private enable row level security;
drop policy if exists "users can manage their own private profile details" on public.user_profile_private;
create policy "users can manage their own private profile details"
  on public.user_profile_private for all
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);

create or replace function public.get_public_profile_details(target_user_id text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'sex', case when sex_public then sex else null end,
    'age', case when age_public then age else null end,
    'is_coach', case when coach_public then is_coach else null end
  )
  from public.user_profile_private
  where user_id = target_user_id;
$$;

revoke all on function public.get_public_profile_details(text) from public;
grant execute on function public.get_public_profile_details(text) to anon, authenticated;

create table if not exists public.user_sports (
  user_id text not null references public.users (id) on delete cascade,
  sport text not null,
  skill_level text not null check (skill_level in ('Just starting', 'Casual', 'Intermediate', 'Advanced', 'Competitive')),
  position smallint not null default 0,
  primary key (user_id, sport)
);

alter table public.user_sports add column if not exists position smallint not null default 0;
alter table public.user_sports enable row level security;
drop policy if exists "sports preferences are viewable by everyone" on public.user_sports;
drop policy if exists "users can add their own sports preferences" on public.user_sports;
drop policy if exists "users can update their own sports preferences" on public.user_sports;
drop policy if exists "users can remove their own sports preferences" on public.user_sports;
create policy "sports preferences are viewable by everyone"
  on public.user_sports for select using (true);
create policy "users can add their own sports preferences"
  on public.user_sports for insert with check (auth.uid()::text = user_id);
create policy "users can update their own sports preferences"
  on public.user_sports for update using (auth.uid()::text = user_id) with check (auth.uid()::text = user_id);
create policy "users can remove their own sports preferences"
  on public.user_sports for delete using (auth.uid()::text = user_id);

insert into public.user_sports (user_id, sport, skill_level, position)
select id, sport,
  case level when 'beginner' then 'Just starting' when 'intermediate' then 'Intermediate' else 'Advanced' end,
  0
from public.users
on conflict (user_id, sport) do nothing;

create or replace function public.save_user_sports(sports_data jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to update sports preferences';
  end if;
  if jsonb_typeof(sports_data) <> 'array' or jsonb_array_length(sports_data) = 0 then
    raise exception 'Choose at least one sport';
  end if;

  delete from public.user_sports where user_id = auth.uid()::text;
  insert into public.user_sports (user_id, sport, skill_level, position)
    select auth.uid()::text, item->>'sport', item->>'skill_level', (ordinality - 1)::smallint
    from jsonb_array_elements(sports_data) with ordinality as entries(item, ordinality);
end;
$$;

revoke all on function public.save_user_sports(jsonb) from public;
grant execute on function public.save_user_sports(jsonb) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('coach-certificates', 'coach-certificates', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "users can upload their own coach certificate" on storage.objects;
drop policy if exists "users can read their own coach certificate" on storage.objects;
drop policy if exists "users can delete their own coach certificate" on storage.objects;
create policy "users can upload their own coach certificate"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'coach-certificates' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users can read their own coach certificate"
  on storage.objects for select to authenticated
  using (bucket_id = 'coach-certificates' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users can delete their own coach certificate"
  on storage.objects for delete to authenticated
  using (bucket_id = 'coach-certificates' and (storage.foldername(name))[1] = auth.uid()::text);
