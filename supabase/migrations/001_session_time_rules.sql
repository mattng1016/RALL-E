-- Run once in the Supabase SQL editor on a database created before this change.
-- New databases get the same rules from schema.sql. Safe to run more than once.

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

drop trigger if exists sessions_start_time_check on sessions;
create trigger sessions_start_time_check
  before insert or update of start_time, duration_min on sessions
  for each row execute function check_session_start_time();
