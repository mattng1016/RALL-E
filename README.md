# RALL-E

Find people to play sports with, even if you don't know anyone in the city. RALL-E is built around activities, not people: browse open tennis and badminton sessions on a map, see the time, price, level and spots left, and join with one tap. No awkward texting, no fear of rejection.

## Run it

```bash
cd web
npm install
npm run dev
```

Open http://localhost:5173. Without a `.env` file the app runs on mock data (`web/src/data/mock.js`), so you can build screens before the database is ready.

## Connect Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run `supabase/schema.sql`, then `supabase/seed.sql`.
3. Copy `web/.env.example` to the repository root as `.env` and fill in the URL and publishable key from Project Settings → API.
4. Restart `npm run dev`. The yellow "Using mock data" banner disappears.

## Project structure

```
supabase/
  schema.sql        tables, join_session() capacity check, permissive policies
  seed.sql          courts, users, sessions (times relative to now)
web/src/
  lib/api.js        every data call; switches between mock and Supabase
  data/mock.js      mock data, same shape as the tables
  pages/            Onboarding, Discover (map + list), SessionDetail (join + chat), CreateSession
  components/       Layout, SessionMap, SessionCard
```

Screens only talk to `lib/api.js`. If you need new data, add a function there with both a mock and a Supabase branch.

## MVP flow (the demo)

Onboard (name, sport, level) → see sessions on the map → open one → join → chat with the group → create your own session. Coach sessions show a "Coach" badge.

Out of scope for the MVP (roadmap slide): communities, ratings and comments, real court booking, payments, real auth.

## Who owns what

| Person | Area | Files |
|---|---|---|
| 1 | Onboarding, session detail, create session | `pages/Onboarding.jsx`, `pages/SessionDetail.jsx`, `pages/CreateSession.jsx` |
| 2 | Map and discovery: pins, filters, list | `pages/Discover.jsx`, `components/SessionMap.jsx`, `components/SessionCard.jsx` |
| 3 | Supabase, seed data, realtime chat, deploy | `supabase/`, `lib/api.js`, `data/mock.js` |
| 4 | Design, copy, pitch, demo script, testing | `index.css`, slides, seed descriptions |

## Git workflow

- `git pull` before you start and before you push.
- Commit small and push often. Stay inside your own files where you can to avoid merge conflicts.
- Never commit `web/.env`.
