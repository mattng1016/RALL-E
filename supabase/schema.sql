-- Run this first in the Supabase SQL editor, then seed.sql.

create table users (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  sport text not null check (sport in ('tennis', 'badminton')),
  level text not null check (level in ('beginner', 'intermediate', 'advanced')),
  created_at timestamptz not null default now()
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

-- Hackathon-only: anyone with the anon key can read and write everything.
alter table users enable row level security;
alter table courts enable row level security;
alter table sessions enable row level security;
alter table session_participants enable row level security;
alter table messages enable row level security;

create policy "public access" on users for all using (true) with check (true);
create policy "public access" on courts for all using (true) with check (true);
create policy "public access" on sessions for all using (true) with check (true);
create policy "public access" on session_participants for all using (true) with check (true);
create policy "public access" on messages for all using (true) with check (true);

alter publication supabase_realtime add table messages, sessions, session_participants;
