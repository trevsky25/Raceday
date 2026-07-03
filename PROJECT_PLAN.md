# RACEDAY — NASCAR Pool Management Platform

**Project Plan & Claude Code Handoff Document**
Owner: Trevor (Kist Digital) · Client: Scott Seager (pool commissioner) · Referred by: Matt MacDonald
Last updated: July 3, 2026

---

## 1. Project Context

Scott Seager runs a season-long NASCAR pool with **102 players** entirely by hand: PDF entry forms returned by email or in person, picks tracked in a spreadsheet, weekly results calculated manually, standings exported to PDF and emailed to the whole list. The 2026 first half just ended (18 races, ~$2,040 prize pool). The second half starts **July 5, 2026** with the same format.

The goal: a web platform that eliminates Scott's manual work — entry validation, pick tracking, standings math, penalty enforcement, and weekly communication — while staying dead simple for a casual, broad-demographic player base.

**Why web:** No app install, works on any phone, players just click a link. Email is already the pool's communication backbone.

---

## 2. Pool Rules (Source of Truth — from Scott's entry form and results sheets)

These rules MUST be encoded exactly. They come from the official 2026 entry form:

1. **Pick one car number per race** from the official car list (38 cars in 2026 second half).
2. **Each car number may be used only ONCE per season.** (18 races, 38 cars → each player burns 18 of 38.)
3. **All picks for the entire half-season are submitted up front** on the entry form, before the first race.
4. **No pick changes after the start of the first race.**
5. **Scoring: your points = your car's finishing position** in that race. Lower is better (golf scoring). Season winner = lowest total points.
6. **Penalties:** A duplicate car pick, or a car number that doesn't race that week, scores **last place + 1 point** for that race.
7. **Driver swaps don't matter:** "If your car number changes driver, your pick doesn't change." Picks follow the CAR NUMBER, not the driver.
8. **Payouts: top 3 positions** (1st/2nd/3rd). **Ties divide** the combined prize money for the tied positions.
9. **Entry fee: $20**, paid via Venmo (@SMSeager) or in person. The platform TRACKS payment status only — it never touches money (see §9, Legal).
10. Weekly results are emailed to all players as soon as available.

### 2026 Second Half Schedule (18 races)

| # | Race | Date | Location |
|---|------|------|----------|
| 1 | Chicagoland 400 | 7/5/2026 | Chicago, IL |
| 2 | Quaker State 400 | 7/12/2026 | Atlanta, GA |
| 3 | Window World 450 | 7/19/2026 | North Wilkesboro, NC |
| 4 | Brickyard 400 | 7/26/2026 | Indianapolis, IN |
| 5 | Iowa Corn 350 | 8/9/2026 | Newton, IA |
| 6 | Cook Out 400 | 8/15/2026 | Richmond, VA |
| 7 | New Hampshire | 8/23/2026 | Loudon, NH |
| 8 | Coke Zero 400 | 8/29/2026 | Daytona, FL |
| 9 | Southern 500 | 9/6/2026 | Darlington, SC |
| 10 | Enjoy Illinois 300 | 9/13/2026 | Madison, IL |
| 11 | Bristol Night Race | 9/19/2026 | Bristol, TN |
| 12 | Hollywood Casino 400 | 9/27/2026 | Kansas City, KS |
| 13 | South Point 400 | 10/4/2026 | Las Vegas, NV |
| 14 | Bank of America 400 | 10/11/2026 | Charlotte, NC |
| 15 | Freeway Insurance 500 | 10/18/2026 | Phoenix, AZ |
| 16 | YellaWood 500 | 10/25/2026 | Talladega, AL |
| 17 | Xfinity 500 | 11/1/2026 | Martinsville, VA |
| 18 | Championship Race | 11/8/2026 | Miami, FL |

### 2026 Car List (38 cars)

1 Ross Chastain (Chevy) · 2 Austin Cindric (Ford) · 3 Austin Dillon (Chevy) · 4 Noah Gragson (Ford) · 5 Kyle Larson (Chevy) · 6 Brad Keselowski (Ford) · 7 Daniel Suarez (Chevy) · 9 Chase Elliott (Chevy) · 10 Ty Dillon (Chevy) · 11 Denny Hamlin (Toyota) · 12 Ryan Blaney (Ford) · 16 AJ Allmendinger (Chevy) · 17 Chris Buescher (Ford) · 19 Chase Briscoe (Toyota) · 20 Christopher Bell (Toyota) · 21 Josh Berry (Ford) · 22 Joey Logano (Ford) · 23 Bubba Wallace (Toyota) · 24 William Byron (Chevy) · 33 Austin Hill (Chevy) · 34 Todd Gilliland (Ford) · 35 Riley Herbst (Toyota) · 38 Zane Smith (Ford) · 41 Cole Custer (Chevy) · 42 John H. Nemechek (Toyota) · 43 Erik Jones (Toyota) · 45 Tyler Reddick (Toyota) · 47 Ricky Stenhouse Jr (Chevy) · 48 Alex Bowman (Chevy) · 51 Cody Ware (Chevy) · 54 Ty Gibbs (Toyota) · 60 Ryan Preece (Ford) · 71 Michael McDowell (Chevy) · 77 Carson Hocevar (Chevy) · 84 Jimmy Johnson (Toyota) · 88 Connor Zilisch (Chevy) · 97 Shane Van Gisbergen (Chevy)

Note: Car 78 (Katherine Legge) appears struck through on the entry form — model car availability as a flag (`is_active`) so cars can be added/removed per season without deleting history.

### Standings Sheet Conventions (replicate these)

- Players sorted ascending by total points (lowest = 1st).
- **Name in green** = player is at or has been in 1st place at some point this season.
- **Points in green** = that pick made 1st place for that race week.
- Footer row: **average finish per race** across all players.
- Each cell shows Car # picked + Points earned for that race.

---

## 3. Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | React 18 + Vite + TypeScript | Fast dev, Trevor's stack |
| Styling | Tailwind CSS | Rapid, consistent |
| Backend / DB | Supabase (Postgres + Auth + RLS + Edge Functions) | Already in Trevor's toolchain; magic-link auth ideal for casual users |
| Hosting | Netlify | Trevor's existing deploy pipeline (trevorsworld precedent) |
| Email | Resend (or Supabase + SMTP) | Transactional + weekly blast |
| State | TanStack Query (server state) + minimal local state | Cache standings, avoid prop drilling |
| Routing | React Router v6 | Standard |

**Auth model:** Supabase magic links (email-only, no passwords). Players sign in with the email on their entry. Scott gets an `admin` role. Consider allowing anonymous/public read for standings (see RLS notes).

---

## 4. Data Model

Standings are ALWAYS computed, never stored — so late corrections to results automatically re-flow everywhere.

```sql
-- Multi-pool from day one (Phase 3 flips the switch, schema supports it now)
pools (
  id uuid pk,
  name text,                      -- e.g. "Scott's NASCAR Pool"
  commissioner_id uuid fk -> profiles,
  entry_fee_cents int,            -- display/tracking only
  venmo_handle text,
  created_at timestamptz
)

seasons (
  id uuid pk,
  pool_id uuid fk -> pools,
  name text,                      -- "2026 Second Half"
  entry_deadline timestamptz,     -- first race green flag
  payout_structure jsonb,         -- [{place:1,pct:70},{place:2,pct:20},{place:3,pct:10}]
  status text check in ('setup','open','locked','complete')
)

cars (
  id uuid pk,
  season_id uuid fk -> seasons,
  car_number int,
  driver_name text,               -- informational only; picks follow car_number
  manufacturer text,
  is_active bool default true     -- car 78 case
)

races (
  id uuid pk,
  season_id uuid fk -> seasons,
  race_number int,                -- 1..18
  name text,
  race_date date,
  location text,
  status text check in ('upcoming','complete')
)

profiles (
  id uuid pk (= auth.users.id),
  display_name text,              -- pool name, e.g. "Brother Martin"
  full_name text,
  phone text,
  is_admin bool default false
)

entries (
  id uuid pk,
  season_id uuid fk -> seasons,
  profile_id uuid fk -> profiles,
  display_name text,              -- players enter multiple entries under different pool names
  paid bool default false,
  paid_at timestamptz,
  submitted_at timestamptz,
  locked bool default false,      -- true once season locks
  unique(season_id, display_name)
)

picks (
  id uuid pk,
  entry_id uuid fk -> entries,
  race_id uuid fk -> races,
  car_number int,
  unique(entry_id, race_id),      -- one pick per race
  unique(entry_id, car_number)    -- DB-level enforcement of use-once rule
)

results (
  id uuid pk,
  race_id uuid fk -> races,
  car_number int,
  finish_position int,            -- null if DNS
  unique(race_id, car_number)
)
```

**Important modeling notes:**

- `unique(entry_id, car_number)` enforces the no-duplicates rule at the database level — the UI validates, the DB guarantees.
- One person can own multiple entries (the results sheet shows "Conchita" and "Conchita 2", "MFL" and "MFL Too", "Swervin' Irvan I/II/III"). Entries are the unit of competition, not profiles.
- DNS/penalty: if a picked `car_number` has no result row OR `finish_position is null` for that race → score = (max finish_position in that race) + 1.
- Historical import: seed the **2026 First Half** as a completed season from the WK 18 results PDF so the archive has data on day one.

### Standings computation (SQL view or edge function)

```
score(entry, race) =
  if pick exists and result.finish_position is not null → finish_position
  else → (SELECT max(finish_position) FROM results WHERE race_id = X) + 1

total(entry) = sum(score) over completed races
rank = dense ordering by total ascending; ties share rank
"green name" flag = entry held rank 1 after any completed race
"green points" flag = score(entry, race) == 1
avg_finish(race) = avg(score) across all entries
```

---

## 5. Row-Level Security (Supabase RLS)

| Table | Public (anon) | Authenticated player | Admin (Scott) |
|-------|---------------|----------------------|----------------|
| pools/seasons/races/cars | read | read | full |
| entries | read (leaderboard is public in current pool culture — results go to everyone) | read all; insert own before deadline; update own before deadline | full |
| picks | read ONLY for completed races (CRITICAL: hide future picks — knowing opponents' remaining cars is a strategic edge) | read own (all); read others' picks for completed races only | full |
| results | read | read | insert/update |
| profiles | none | read/update own | full |

**The picks-visibility rule is the most important security detail in the app.** Current PDF distribution reveals all picks retroactively per week; the platform must not leak future picks. Implement as an RLS policy joining `picks -> races.status = 'complete'` for non-owners.

---

## 6. Build Phases

### Phase 1 — MVP: Kill the Manual Work (target: launch-ready ASAP)

**1.1 Project scaffold**
- Vite + React + TS + Tailwind + React Router + TanStack Query
- Supabase project, schema migration, RLS policies, seed script (cars, races, 2026 second half)
- Netlify deploy pipeline + env config

**1.2 Auth**
- Magic-link sign-in, profile creation on first login
- Admin flag for Scott (set via SQL, no admin-management UI yet)

**1.3 Entry flow (the crown jewel)**
- `/enter` — pick grid: 18 races × car selector
- Live validation: cars gray out once used; running "cars remaining" tray (38 → 20)
- Mobile-first: most players will do this on a phone
- Review screen → submit → confirmation email
- Editable until `entry_deadline`, then hard lock
- Payment instructions (Venmo deep link `venmo://paycharge?txn=pay&recipients=SMSeager&amount=20`) + "payment pending" badge until Scott confirms

**1.4 Admin dashboard** (`/admin`, admin-only)
- Entry list: paid toggle, view picks, delete entry
- Results entry: per race, a 38-row grid (car → finish position); mark race complete
- Season controls: lock entries, edit deadline

**1.5 Standings**
- `/standings` — the replacement for the PDF. Table: rank, name (green rule), per-race car+points cells (green rule), total. Sticky name column, horizontal scroll on mobile
- Average finish footer row
- `/entry/:id` — per-entry detail: picks, scores, cars remaining (own entry only for future picks)

**1.6 First-half archive import**
- One-time seed of the 2026 first half standings (102 entries × 18 races) so history exists

**Definition of done for Phase 1:** Scott can run week 1 of the second half — collect entries online, mark payments, enter Sonoma... er, Chicagoland results, and email a standings LINK instead of a PDF.

### Phase 2 — Premium Feel

- **2.1 Weekly results email** (Resend): triggered when Scott marks a race complete. Template: top 3 movers, your score, standings link. Match Scott's voice (sign-off: "Keep your foot on the gas and your picks out of the wall!")
- **2.2 Race hub**: next-race countdown, lock timer, this week's most/least picked cars (revealed AFTER lock)
- **2.3 Analytics page**: pick distribution heatmap, biggest weekly movers, "value picks" (low-usage cars that finished well), average finish trend
- **2.4 Season archive UI**: browse past seasons/standings
- **2.5 Entry-form PDF export** for the die-hards who want paper

### Phase 3 — Product-ize

- **3.1 Multi-pool**: commissioner onboarding, pool creation wizard, custom car lists/schedules/payouts, invite links
- **3.2 Results auto-import**: sports data API for finishing positions (Scott reviews/confirms rather than typing 38 rows)
- **3.3 Custom rule variants**: pick-count limits, mulligans, worst-week-dropped, etc.
- **3.4 Notifications**: SMS reminders before lock (Twilio), "you haven't submitted" nags

---

## 7. Key Edge Cases (encode as tests)

1. **Tie in total points** → shared rank; payout division happens offline but display should show "T-2nd".
2. **Car doesn't race (DNS)** → last + 1. "Last" = highest finish position recorded IN THAT RACE (field size varies).
3. **Duplicate pick** — should be impossible via UI + DB constraint, but the scoring function must still handle legacy/imported data: score last + 1.
4. **Driver swap mid-season** → update `cars.driver_name` for display; picks unaffected (keyed on car_number).
5. **Car withdrawn from season** (car 78) → `is_active = false`; existing picks of that car become DNS-penalty picks each week; UI should warn player at entry time if picking inactive car (block it).
6. **Late entry** — Scott's call. Admin can create/unlock an entry after deadline; UI never allows it.
7. **Result corrections** — NASCAR penalties sometimes change official finishes days later. Because standings are computed, admin edits a result and everything re-flows. Consider a "results revised" note on the standings page.
8. **Multiple entries per person** — supported natively (entries ≠ profiles).
9. **Race postponement** — admin can edit race_date; no scoring impact.

---

## 8. Design Direction

- **Personality: race-day energy, not corporate.** Checkered-flag motifs, bold condensed display type (think Bebas/Anton style headers), high-contrast leaderboard.
- Palette: asphalt dark base, white, caution-flag yellow accent, green for the "leader" conventions carried over from Scott's sheets, red for penalties/DNS.
- The standings table is the heart of the product — obsess over its density, scannability, and mobile behavior (sticky rank+name columns, swipeable race columns).
- Keep Scott's tone. The Talladega Nights quote on the entry form ("...it's the fastest who get paid...") belongs in the footer.
- Read `/mnt/skills/public/frontend-design/SKILL.md` in the Claude Code session before building UI.

---

## 9. Legal / Business Guardrails

1. **Never touch money.** No entry fee collection, no payout distribution, no wallet balances. Venmo links out; Scott confirms payment manually. Real-money pool operation has state-by-state gambling implications — the platform is a scorekeeping tool. Add a footer disclaimer: "This site tracks scores only and does not process payments or wagers."
2. **NASCAR IP:** Don't use NASCAR logos, official marks, or "NASCAR" in the product name/branding. Driver names and race names as factual data are fine. Working name "RACEDAY" (or pick another) — not "NASCAR Pool Manager."
3. **Trevor's employment:** Higharc start date July 20. Build on personal time/hardware; consider adding to Exhibit C (invention assignment carve-out) alongside FORGE/Kist Digital.
4. **Privacy:** Emails and phone numbers of 100+ people. Don't expose emails on public pages (display names only). Add a simple privacy note.

---

## 10. Claude Code Session Kickoff

Suggested first prompt for the Claude Code session:

```
Read PROJECT_PLAN.md in full. We're building Phase 1 of RACEDAY.

Order of operations:
1. Scaffold: Vite + React + TS + Tailwind + Router + TanStack Query
2. Write the Supabase migration (schema + RLS from §4–5) and seed
   script (2026 second-half races + 38 cars from §2)
3. Build the standings computation as a Postgres view + typed client hook
4. Entry flow UI (§6.1.3) — mobile-first
5. Admin dashboard (§6.1.4)
6. Standings page (§6.1.5)

Write tests for every edge case in §7 before implementing scoring.
Use the frontend-design skill before any UI work.
```

Suggested repo structure:

```
raceday/
├── PROJECT_PLAN.md            ← this file
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── src/
│   ├── components/            (ui primitives, StandingsTable, PickGrid)
│   ├── pages/                 (Home, Enter, Standings, EntryDetail, Admin)
│   ├── hooks/                 (useStandings, useEntry, usePicks)
│   ├── lib/                   (supabase client, scoring types)
│   └── styles/
├── tests/                     (scoring edge cases first)
└── netlify.toml
```

### Open questions to resolve with Scott before/while building

1. Does he want the leaderboard fully public (shareable link) or behind sign-in?
2. Payout structure percentages — confirm (first half looks like ~70/20/10).
3. Does he want first-half history imported? (Recommend yes.)
4. Domain name — buy something fun (e.g., checkeredflagpool.com)?
5. Timing reality check: second-half entries are due 7/5 — this half likely starts on paper, platform launches mid-half with data imported, then runs live. Frame it that way so nobody expects a 48-hour miracle.

---

## 11. Success Metrics

- Scott's weekly admin time: from hours → under 15 minutes (enter results, hit send)
- Zero invalid entries (duplicates impossible)
- Standings live within minutes of results entry
- 80%+ of players using the site directly by mid-season (vs. waiting for email)
