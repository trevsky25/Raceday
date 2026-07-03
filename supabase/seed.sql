-- RACEDAY seed: Scott's pool, 2026 Second Half season, 18 races, 38 cars (+ car 78 inactive)

with new_pool as (
  insert into public.pools (name, entry_fee_cents, venmo_handle)
  values ('Scott''s NASCAR Pool', 2000, 'SMSeager')
  returning id
),
new_season as (
  insert into public.seasons (pool_id, name, entry_deadline, status, payout_structure)
  select id, '2026 Second Half', '2026-07-05 18:00:00+00', 'open',
         '[{"place":1,"pct":70},{"place":2,"pct":20},{"place":3,"pct":10}]'::jsonb
  from new_pool
  returning id
),
new_races as (
  insert into public.races (season_id, race_number, name, race_date, location)
  select new_season.id, r.race_number, r.name, r.race_date::date, r.location
  from new_season,
  (values
    (1,  'Chicagoland 400',       '2026-07-05', 'Chicago, IL'),
    (2,  'Quaker State 400',      '2026-07-12', 'Atlanta, GA'),
    (3,  'Window World 450',      '2026-07-19', 'North Wilkesboro, NC'),
    (4,  'Brickyard 400',         '2026-07-26', 'Indianapolis, IN'),
    (5,  'Iowa Corn 350',         '2026-08-09', 'Newton, IA'),
    (6,  'Cook Out 400',          '2026-08-15', 'Richmond, VA'),
    (7,  'New Hampshire',         '2026-08-23', 'Loudon, NH'),
    (8,  'Coke Zero 400',         '2026-08-29', 'Daytona, FL'),
    (9,  'Southern 500',          '2026-09-06', 'Darlington, SC'),
    (10, 'Enjoy Illinois 300',    '2026-09-13', 'Madison, IL'),
    (11, 'Bristol Night Race',    '2026-09-19', 'Bristol, TN'),
    (12, 'Hollywood Casino 400',  '2026-09-27', 'Kansas City, KS'),
    (13, 'South Point 400',       '2026-10-04', 'Las Vegas, NV'),
    (14, 'Bank of America 400',   '2026-10-11', 'Charlotte, NC'),
    (15, 'Freeway Insurance 500', '2026-10-18', 'Phoenix, AZ'),
    (16, 'YellaWood 500',         '2026-10-25', 'Talladega, AL'),
    (17, 'Xfinity 500',           '2026-11-01', 'Martinsville, VA'),
    (18, 'Championship Race',     '2026-11-08', 'Miami, FL')
  ) as r(race_number, name, race_date, location)
  returning id
)
insert into public.cars (season_id, car_number, driver_name, manufacturer, is_active)
select new_season.id, c.car_number, c.driver_name, c.manufacturer, c.is_active
from new_season,
(values
  (1,  'Ross Chastain',        'Chevy',  true),
  (2,  'Austin Cindric',       'Ford',   true),
  (3,  'Austin Dillon',        'Chevy',  true),
  (4,  'Noah Gragson',         'Ford',   true),
  (5,  'Kyle Larson',          'Chevy',  true),
  (6,  'Brad Keselowski',      'Ford',   true),
  (7,  'Daniel Suarez',        'Chevy',  true),
  (9,  'Chase Elliott',        'Chevy',  true),
  (10, 'Ty Dillon',            'Chevy',  true),
  (11, 'Denny Hamlin',         'Toyota', true),
  (12, 'Ryan Blaney',          'Ford',   true),
  (16, 'AJ Allmendinger',      'Chevy',  true),
  (17, 'Chris Buescher',       'Ford',   true),
  (19, 'Chase Briscoe',        'Toyota', true),
  (20, 'Christopher Bell',     'Toyota', true),
  (21, 'Josh Berry',           'Ford',   true),
  (22, 'Joey Logano',          'Ford',   true),
  (23, 'Bubba Wallace',        'Toyota', true),
  (24, 'William Byron',        'Chevy',  true),
  (33, 'Austin Hill',          'Chevy',  true),
  (34, 'Todd Gilliland',       'Ford',   true),
  (35, 'Riley Herbst',         'Toyota', true),
  (38, 'Zane Smith',           'Ford',   true),
  (41, 'Cole Custer',          'Chevy',  true),
  (42, 'John H. Nemechek',     'Toyota', true),
  (43, 'Erik Jones',           'Toyota', true),
  (45, 'Tyler Reddick',        'Toyota', true),
  (47, 'Ricky Stenhouse Jr',   'Chevy',  true),
  (48, 'Alex Bowman',          'Chevy',  true),
  (51, 'Cody Ware',            'Chevy',  true),
  (54, 'Ty Gibbs',             'Toyota', true),
  (60, 'Ryan Preece',          'Ford',   true),
  (71, 'Michael McDowell',     'Chevy',  true),
  (77, 'Carson Hocevar',       'Chevy',  true),
  (78, 'Katherine Legge',      'Chevy',  false), -- struck through on the entry form
  (84, 'Jimmy Johnson',        'Toyota', true),
  (88, 'Connor Zilisch',       'Chevy',  true),
  (97, 'Shane Van Gisbergen',  'Chevy',  true)
) as c(car_number, driver_name, manufacturer, is_active);
