# RALL-E

**Find your people. Get out and play.**

RALL-E is a community sports app for people who want to play but do not already have a group. Discover nearby pickup games, compare the details, and join a session with other local players.

> Built as a hackathon project to make it easier for newcomers and casual athletes to find welcoming games in their community.

## What you can do

- **Discover games** on an interactive map or in a nearby-games list.
- **Filter and sort** sessions by sport, skill level, city, time, or distance. Distance sorting uses an optional, one-time browser location request.
- **Create or join a session** with a court, start time, duration, skill level, capacity, price, and optional coach-session label.
- **Coordinate with players** in session group chats and the floating session-chat launcher.
- **Build a player profile** with a bio, sports interests and per-sport skill ratings, plus optional private details and coach credentials.
- **See live updates** to sessions and chat when connected to Supabase.

The current session creation flow supports **tennis and badminton**. Profiles can list additional sports as interests while support for those sports is in progress.

## Tech stack

| Area | Technology |
| --- | --- |
| Front end | React 19, Vite 8, React Router 7 |
| Styling | Tailwind CSS 4 |
| Map | Leaflet, React Leaflet, OpenStreetMap |
| Backend | Supabase Auth, Postgres, Storage, and Realtime |

## Run locally

```bash
cd web
npm install
npm run dev
```

Open the local URL printed by Vite. Without Supabase credentials, RALL-E runs with demo data.

### Connect Supabase

Create `web/.env` and add your project URL and publishable key:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-key
```

Keep `.env` out of version control. For a new Supabase project, run `supabase/schema.sql` and then `supabase/seed.sql` in the SQL editor. For a database that already has the app schema, apply the relevant files in `supabase/migrations/` instead of recreating the schema. Review SQL changes before applying them to a shared database.

For the hackathon demo setup, disable email confirmation in Supabase Authentication settings and set the project Site URL to your local Vite URL. Restart the dev server after changing environment variables.

## Project structure

```text
web/src/
  components/   Shared layout, map, session cards, chat launcher
  lib/          Supabase client, API, auth, formatting, session time rules
  pages/        Discover, session detail, create session, profile, settings
  data/         Demo data used when Supabase is not configured
supabase/       Database schema, seed data, and migrations
```

## Resume summary

Designed and built a map-based sports matchmaking MVP with session discovery and creation, Supabase-backed authentication and data, real-time group chat, and configurable player profiles.
