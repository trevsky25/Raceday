-- Driver intelligence: bios/career/season stats + per-track history.
-- Keyed by (season_id, car_number) to match the cars table; track stats keyed
-- by race_id since each race maps to exactly one track this season.

create table public.driver_profiles (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete cascade,
  car_number int not null,
  team text,
  hometown text,
  birth_date date,
  rookie_year int,
  championships int not null default 0,
  career_starts int,
  career_wins int,
  career_top5 int,
  career_top10 int,
  career_poles int,
  season_year int,             -- the year the season_* columns describe
  season_wins int,
  season_top5 int,
  season_top10 int,
  season_avg_finish numeric(5,2),
  photo_url text,
  one_liner text,
  unique (season_id, car_number)
);

create table public.driver_track_stats (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references public.races (id) on delete cascade,
  car_number int not null,
  starts int,
  wins int,
  top5 int,
  top10 int,
  avg_finish numeric(5,2),
  best_finish int,
  unique (race_id, car_number)
);

create index driver_track_stats_race_idx on public.driver_track_stats (race_id);

alter table public.driver_profiles enable row level security;
alter table public.driver_track_stats enable row level security;

create policy "driver_profiles_public_read" on public.driver_profiles
  for select using (true);
create policy "driver_profiles_admin_write" on public.driver_profiles
  for all using (public.is_admin()) with check (public.is_admin());

create policy "driver_track_stats_public_read" on public.driver_track_stats
  for select using (true);
create policy "driver_track_stats_admin_write" on public.driver_track_stats
  for all using (public.is_admin()) with check (public.is_admin());
