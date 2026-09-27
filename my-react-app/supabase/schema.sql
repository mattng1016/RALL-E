-- Run this in the Supabase SQL editor after creating your project.
-- User passwords and sessions are managed securely by Supabase Auth.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  created_at timestamptz not null default now()
);

-- Runs with the Auth insert, so profile creation also works when email
-- confirmation is enabled and the browser does not have a session yet.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', 'Player'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
create policy "Users can read their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can create their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
