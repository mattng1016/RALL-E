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
  v_start_time timestamptz;
  v_count int;
begin
  select capacity, start_time into v_capacity, v_start_time from sessions where id = p_session_id for update;
  if v_capacity is null then
    raise exception 'Session not found';
  end if;

  if exists (select 1 from session_participants where session_id = p_session_id and user_id = p_user_id) then
    return;
  end if;

  if v_start_time <= now() then
    raise exception 'This session has already started';
  end if;

  select count(*) into v_count from session_participants where session_id = p_session_id;
  if v_count >= v_capacity then
    raise exception 'Session is full';
  end if;

  insert into session_participants (session_id, user_id) values (p_session_id, p_user_id);
end;
$$;

-- The app asks for 30 minutes' notice; the database only rejects clearly invalid times,
-- so small clock differences between a phone and the server never block a valid session.
create or replace function check_session_start_time()
returns trigger
language plpgsql
as $$
begin
  if new.start_time < now() then
    raise exception 'Pick a start time in the future';
  end if;
  if new.start_time > now() + interval '61 days' then
    raise exception 'Sessions can be scheduled up to 60 days ahead';
  end if;
  -- Vancouver is a whole-hour offset from UTC, so local :00 stays :00 in the database.
  if extract(minute from new.start_time at time zone 'America/Vancouver') <> 0
     or extract(second from new.start_time at time zone 'America/Vancouver') <> 0 then
    raise exception 'Start times must be on the hour';
  end if;
  if new.duration_min < 60 or new.duration_min % 60 <> 0 then
    raise exception 'Duration must be a whole number of hours';
  end if;
  -- 8 PM + 4 hours ends at midnight and is allowed. Anything later is the next day.
  if (new.start_time + make_interval(mins => new.duration_min)) at time zone 'America/Vancouver'
     > date_trunc('day', new.start_time at time zone 'America/Vancouver') + interval '1 day' then
    raise exception 'Session must end by midnight';
  end if;
  return new;
end;
$$;

create trigger sessions_start_time_check
  before insert or update of start_time, duration_min on sessions
  for each row execute function check_session_start_time();

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
