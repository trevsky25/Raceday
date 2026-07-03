# RACEDAY 🏁

Season-long race pool management. Built for Scott's NASCAR pool — 102 players,
18 races, one car per race, each car only once, lowest total wins.

See [PROJECT_PLAN.md](./PROJECT_PLAN.md) for the full spec.

## Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **Data:** Supabase (Postgres + magic-link auth + RLS)
- **State:** TanStack Query
- **Hosting:** Netlify

## Local development

```bash
npm install
cp .env.example .env   # fill in Supabase URL + publishable key
npm run dev
```

## Tests

Scoring edge cases (PROJECT_PLAN.md §7) are encoded in `tests/scoring.test.ts`:

```bash
npm test
```

## Database

Migrations live in `supabase/migrations/` and seed data in `supabase/seed.sql`.
The production project is `raceday` (ref `ygcdzmemhogavopbdiog`).

Key invariants enforced at the DB level:

- `unique(entry_id, car_number)` — each car used once per entry per season
- `unique(entry_id, race_id)` — one pick per race
- RLS hides **future picks** from everyone except the entry owner and admins
- Only admins can change `paid` / `locked` on entries (trigger-enforced)
- Entry inserts/updates blocked after the entry deadline (RLS)

Standings are **always computed, never stored** — result corrections re-flow
automatically.

## Admin setup

Admins are bootstrapped by email in `handle_new_user()`
(`supabase/migrations/001_initial_schema.sql`). To grant admin to an existing
user:

```sql
update public.profiles set is_admin = true
where id = (select id from auth.users where email = 'scott@example.com');
```

## One-time manual config (Supabase dashboard)

Auth → URL Configuration:

1. Set **Site URL** to the production Netlify URL.
2. Add `http://localhost:5173` to **Redirect URLs** for local dev.

Without this, magic-link emails redirect to the wrong host.

## Driver intelligence

`driver_profiles` (bio, career, current-season form, Wikimedia headshot) and
`driver_track_stats` (career record at each track on this half's schedule)
power the Garage (`/drivers`), driver detail pages (`/driver/:carNumber`), and
the per-track stat badges + tap-in stat sheets inside the pick grid. Data was
researched from public racing-stats sources in July 2026 and is admin-editable
in the DB; anything unsourced is null and renders as "no history". Live
pool-half form is computed from our own `results` table as races complete.

## Not yet built (Phase 2+)

- Weekly results email (Resend) — Scott currently shares the standings link
- First-half 2026 archive import (needs the WK18 results PDF data)
- Race hub / analytics / multi-pool onboarding

---

*This site tracks scores only and does not process payments or wagers.*
