-- RACEDAY initial schema: pools, seasons, cars, races, profiles, entries, picks, results
-- Standings are always computed, never stored (see PROJECT_PLAN.md §4).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  full_name text,
  phone text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.pools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  commissioner_id uuid references public.profiles (id) on delete set null,
  entry_fee_cents int not null default 2000,
  venmo_handle text,
  created_at timestamptz not null default now()
);

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.pools (id) on delete cascade,
  name text not null,
  entry_deadline timestamptz,
  payout_structure jsonb not null default '[{"place":1,"pct":70},{"place":2,"pct":20},{"place":3,"pct":10}]'::jsonb,
  status text not null default 'setup' check (status in ('setup','open','locked','complete')),
  created_at timestamptz not null default now()
);

create table public.cars (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete cascade,
  car_number int not null,
  driver_name text not null,
  manufacturer text,
  is_active boolean not null default true,
  unique (season_id, car_number)
);

create table public.races (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete cascade,
  race_number int not null,
  name text not null,
  race_date date,
  location text,
  status text not null default 'upcoming' check (status in ('upcoming','complete')),
  unique (season_id, race_number)
);

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,
  display_name text not null,
  paid boolean not null default false,
  paid_at timestamptz,
  submitted_at timestamptz not null default now(),
  locked boolean not null default false,
  unique (season_id, display_name)
);

create table public.picks (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries (id) on delete cascade,
  race_id uuid not null references public.races (id) on delete cascade,
  car_number int not null,
  unique (entry_id, race_id),
  unique (entry_id, car_number) -- DB-level enforcement of the use-once rule
);

create table public.results (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references public.races (id) on delete cascade,
  car_number int not null,
  finish_position int, -- null = DNS
  unique (race_id, car_number)
);

create index picks_race_id_idx on public.picks (race_id);
create index picks_entry_id_idx on public.picks (entry_id);
create index results_race_id_idx on public.results (race_id);
create index entries_season_id_idx on public.entries (season_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- Entry window: season is open and the deadline hasn't passed
create or replace function public.entry_window_open(p_season_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.seasons s
    where s.id = p_season_id
      and s.status = 'open'
      and (s.entry_deadline is null or now() < s.entry_deadline)
  )
$$;

-- Auto-create a profile on signup; bootstrap admins by email
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, is_admin)
  values (
    new.id,
    split_part(new.email, '@', 1),
    new.email in ('trevsky1@gmail.com') -- add Scott's email here before launch
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row-Level Security (PROJECT_PLAN.md §5)
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.pools enable row level security;
alter table public.seasons enable row level security;
alter table public.cars enable row level security;
alter table public.races enable row level security;
alter table public.entries enable row level security;
alter table public.picks enable row level security;
alter table public.results enable row level security;

-- profiles: read/update own; admins everything. Non-admins cannot touch is_admin
-- (column-level grant below).
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id or public.is_admin());

revoke update on public.profiles from anon, authenticated;
grant update (display_name, full_name, phone) on public.profiles to authenticated;

-- pools / seasons / races / cars: public read, admin write
create policy "pools_public_read" on public.pools for select using (true);
create policy "pools_admin_write" on public.pools for all
  using (public.is_admin()) with check (public.is_admin());

create policy "seasons_public_read" on public.seasons for select using (true);
create policy "seasons_admin_write" on public.seasons for all
  using (public.is_admin()) with check (public.is_admin());

create policy "races_public_read" on public.races for select using (true);
create policy "races_admin_write" on public.races for all
  using (public.is_admin()) with check (public.is_admin());

create policy "cars_public_read" on public.cars for select using (true);
create policy "cars_admin_write" on public.cars for all
  using (public.is_admin()) with check (public.is_admin());

-- entries: public read (leaderboard culture), players manage their own before
-- the deadline, admin everything.
create policy "entries_public_read" on public.entries for select using (true);
create policy "entries_insert_own" on public.entries for insert
  with check (
    public.is_admin()
    or (profile_id = auth.uid() and public.entry_window_open(season_id))
  );
create policy "entries_update_own" on public.entries for update
  using (
    public.is_admin()
    or (profile_id = auth.uid() and not locked and public.entry_window_open(season_id))
  );
create policy "entries_delete_own" on public.entries for delete
  using (
    public.is_admin()
    or (profile_id = auth.uid() and not locked and public.entry_window_open(season_id))
  );

-- Players cannot flip their own paid flag
revoke update on public.entries from anon, authenticated;
grant update (display_name) on public.entries to authenticated;

-- picks: THE critical rule — future picks are hidden from everyone but the
-- owner and the admin. Anyone can read picks for completed races.
create policy "picks_select_visible" on public.picks for select
  using (
    public.is_admin()
    or exists (select 1 from public.entries e
               where e.id = entry_id and e.profile_id = auth.uid())
    or exists (select 1 from public.races r
               where r.id = race_id and r.status = 'complete')
  );

create policy "picks_insert_own" on public.picks for insert
  with check (
    public.is_admin()
    or (
      exists (select 1 from public.entries e
              where e.id = entry_id
                and e.profile_id = auth.uid()
                and not e.locked
                and public.entry_window_open(e.season_id))
      and exists (select 1 from public.entries e
                  join public.cars c on c.season_id = e.season_id
                  where e.id = entry_id
                    and c.car_number = picks.car_number
                    and c.is_active)
    )
  );

create policy "picks_update_own" on public.picks for update
  using (
    public.is_admin()
    or exists (select 1 from public.entries e
               where e.id = entry_id
                 and e.profile_id = auth.uid()
                 and not e.locked
                 and public.entry_window_open(e.season_id))
  )
  with check (
    public.is_admin()
    or exists (select 1 from public.entries e
               join public.cars c on c.season_id = e.season_id
               where e.id = entry_id
                 and c.car_number = picks.car_number
                 and c.is_active)
  );

create policy "picks_delete_own" on public.picks for delete
  using (
    public.is_admin()
    or exists (select 1 from public.entries e
               where e.id = entry_id
                 and e.profile_id = auth.uid()
                 and not e.locked
                 and public.entry_window_open(e.season_id))
  );

-- results: public read, admin write
create policy "results_public_read" on public.results for select using (true);
create policy "results_admin_write" on public.results for all
  using (public.is_admin()) with check (public.is_admin());
