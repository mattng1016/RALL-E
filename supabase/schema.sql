-- Run this first in the Supabase SQL editor, then seed.sql.

create table users (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  sport text not null check (sport in ('tennis', 'badminton')),
  level text not null check (level in ('beginner', 'intermediate', 'advanced')),
  bio varchar(160) not null default '',
  created_at timestamptz not null default now()
);

create table user_profile_private (
  user_id text primary key references users (id) on delete cascade,
  sex text,
  age smallint check (age is null or age between 13 and 120),
  sex_public boolean not null default false,
  age_public boolean not null default false,
  is_coach boolean not null default false,
  coach_public boolean not null default false,
  coach_certificate_path text,
  updated_at timestamptz not null default now()
);

create table user_sports (
  user_id text not null references users (id) on delete cascade,
  sport text not null,
  skill_level text not null check (skill_level in ('Just starting', 'Casual', 'Intermediate', 'Advanced', 'Competitive')),
  position smallint not null default 0,
  primary key (user_id, sport)
);

create table courts (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  sport text not null check (sport in ('tennis', 'badminton')),
  lat double precision not null,
  lng double precision not null,
  price_per_hour numeric not null default 0
);

create table sessions (
  id text primary key default gen_random_uuid()::text,
  host_id text not null references users (id) on delete cascade,
  court_id text not null references courts (id),
  sport text not null check (sport in ('tennis', 'badminton')),
  level text not null check (level in ('beginner', 'intermediate', 'advanced')),
  start_time timestamptz not null,
  duration_min int not null default 60,
  capacity int not null check (capacity > 0),
  price numeric not null default 0,
  is_coach boolean not null default false,
  description text,
  created_at timestamptz not null default now()
);

create table session_participants (
  session_id text not null references sessions (id) on delete cascade,
  user_id text not null references users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

create table messages (
  id text primary key default gen_random_uuid()::text,
  session_id text not null references sessions (id) on delete cascade,
  user_id text not null references users (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

-- Locks the session row so two people can't take the last spot at the same time.
create or replace function join_session(p_session_id text, p_user_id text)
returns void
language plpgsql
as $$
declare
  v_capacity int;
  v_count int;
begin
  select capacity into v_capacity from sessions where id = p_session_id for update;
  if v_capacity is null then
    raise exception 'Session not found';
  end if;

  if exists (select 1 from session_participants where session_id = p_session_id and user_id = p_user_id) then
    return;
  end if;

  select count(*) into v_count from session_participants where session_id = p_session_id;
  if v_count >= v_capacity then
    raise exception 'Session is full';
  end if;

  insert into session_participants (session_id, user_id) values (p_session_id, p_user_id);
end;
$$;

-- Hackathon MVP: activity tables are open for demo use; profile details and certificates are owner-restricted.
alter table users enable row level security;
alter table user_profile_private enable row level security;
alter table user_sports enable row level security;
alter table courts enable row level security;
alter table sessions enable row level security;
alter table session_participants enable row level security;
alter table messages enable row level security;

create policy "profiles are viewable by everyone" on users for select using (true);
create policy "users can create their own profile" on users for insert with check (auth.uid()::text = id);
create policy "users can update their own profile" on users for update using (auth.uid()::text = id) with check (auth.uid()::text = id);
create policy "users can manage their own private profile details" on user_profile_private for all using (auth.uid()::text = user_id) with check (auth.uid()::text = user_id);
create policy "sports preferences are viewable by everyone" on user_sports for select using (true);
create policy "users can add their own sports preferences" on user_sports for insert with check (auth.uid()::text = user_id);
create policy "users can update their own sports preferences" on user_sports for update using (auth.uid()::text = user_id) with check (auth.uid()::text = user_id);
create policy "users can remove their own sports preferences" on user_sports for delete using (auth.uid()::text = user_id);
create policy "public access" on courts for all using (true) with check (true);
create policy "public access" on sessions for all using (true) with check (true);
create policy "public access" on session_participants for all using (true) with check (true);
create policy "public access" on messages for all using (true) with check (true);

alter publication supabase_realtime add table messages, sessions, session_participants;

create or replace function get_public_profile_details(target_user_id text)
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
  from user_profile_private
  where user_id = target_user_id;
$$;

revoke all on function get_public_profile_details(text) from public;
grant execute on function get_public_profile_details(text) to anon, authenticated;

create or replace function save_user_sports(sports_data jsonb)
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

  delete from user_sports where user_id = auth.uid()::text;
  insert into user_sports (user_id, sport, skill_level, position)
    select auth.uid()::text, item->>'sport', item->>'skill_level', (ordinality - 1)::smallint
    from jsonb_array_elements(sports_data) with ordinality as entries(item, ordinality);
end;
$$;

revoke all on function save_user_sports(jsonb) from public;
grant execute on function save_user_sports(jsonb) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('coach-certificates', 'coach-certificates', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "users can upload their own coach certificate"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'coach-certificates' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users can read their own coach certificate"
  on storage.objects for select to authenticated
  using (bucket_id = 'coach-certificates' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users can delete their own coach certificate"
  on storage.objects for delete to authenticated
  using (bucket_id = 'coach-certificates' and (storage.foldername(name))[1] = auth.uid()::text);
