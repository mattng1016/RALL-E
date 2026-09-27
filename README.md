# RALL-E

RALL-E helps people find a tennis or badminton game without knowing anyone in the city. Sessions are the main thing: open the map, see the time, price, level, and spots left, and join with one tap. Hosts can post a pickup game or a paid coach session. Players skip the awkward group chat and the fear of getting turned down.

## Getting Started

1. Install dependencies and start the app:

```bash
cd web
npm install
npm run dev
```

2. Open the local host that is given in the terminal.

With no `web/.env` file, the app uses the mock data in `web/src/data/mock.js`.

3. Connect the shared Supabase project when you want live data by adding .env file inside the `web` file:

4. Put the project URL and publishable key in `web/.env`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-key
```

5. In the Supabase SQL editor, run `supabase/schema.sql`, then `supabase/seed.sql`, on a new database. On the existing project, run the files in `supabase/migrations/` instead.

6. In the Supabase dashboard, turn off **Confirm email** under Authentication → Sign In / Providers → Email, and set the Site URL to the one given in the terminal.

7. Restart `npm run dev`. The yellow “Using mock data” banner goes away.


## Usage

Sign up, pick a sport and level, then use the app like this:

1. **Discover** shows upcoming sessions on the map and in the list. Filters narrow by sport and level.
2. Open a session to see the court, time, price, spots, and who is going. **Join** adds you and opens the session chat.
3. **My sessions** lists games you are hosting or have joined.
4. **+ Create session** posts a new game: court, start hour, length, capacity, price, and an optional coach badge.
5. The name menu opens **Profile** (bio, sports, and private details) and **Settings**.

## Tech Stack

- React and Vite for the web app
- React Router for pages
- Tailwind CSS for styling
- Leaflet and OpenStreetMap for the session map
- Supabase for Postgres, Auth, Row Level Security, and Realtime chat
