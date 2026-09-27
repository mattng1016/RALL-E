# RALL-E authentication

This React/Vite app uses Supabase Auth for email/password signup, login, persisted
sessions, and logout. Passwords are handled and hashed by Supabase; they never pass
through this repository's database or browser storage directly.

## Local setup

1. Create a Supabase project.
2. In its SQL editor, run `supabase/schema.sql`.
3. Copy `.env.example` to `.env` and enter the project URL and anonymous key from
   Supabase **Project Settings → API**. Never put a service-role key in this file.
4. In Supabase **Authentication → URL Configuration**, add
   `http://localhost:5173` to the allowed redirect URLs.
5. Run `npm install` and `npm run dev`.

Supabase email confirmation is supported. If it is enabled, a new player receives a
confirmation email and then logs in after confirming. If disabled, signup takes the
player straight to `/dashboard`.

## Commands

```bash
npm run dev
npm run lint
npm run build
```
