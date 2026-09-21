# Speaker Check-In Portal — Supabase setup

## What changed from the previous version
- `window.storage` (Claude.ai artifact-only) is gone. All reads/writes now go through
  `src/supabaseClient.js` to a real Postgres database.
- Every tab shares one `speakers` array and one `feedback` array, kept live via a
  Supabase Realtime subscription in `EventPortal.jsx` — any check-in at the front
  desk shows up on the India dashboard within a second or two, no refresh needed.
- Badge IDs are unchanged: still a short client-generated code (`uid()`), used as
  the QR payload, the search key, and now the Postgres primary key (`text`, not `uuid`).
- UI, tabs, jsQR camera scanning, CSV export — all identical to before.

## Setup

1. **Create a Supabase project** at supabase.com (free tier is plenty for ~200 speakers).
2. **Run `schema.sql`** in the Supabase SQL Editor (Project → SQL Editor → New query → paste → Run).
3. **Turn on Realtime**: Database → Replication → toggle on both `speakers` and `feedback`.
4. **Copy your credentials**: Settings → API → copy the Project URL and the `anon` `public` key.
5. **Set env vars**: copy `.env.example` to `.env` and fill in those two values.
   - Using Vite: keep the `VITE_` prefix as-is.
   - Using Create React App instead: rename to `REACT_APP_SUPABASE_URL` /
     `REACT_APP_SUPABASE_ANON_KEY` in both `.env` and `src/supabaseClient.js`
     (swap `import.meta.env.VITE_*` for `process.env.REACT_APP_*`).
6. **Install the client**: `npm install @supabase/supabase-js`
7. Drop `EventPortal.jsx` into your app and render `<EventPortal />`.

## On the "fully public dashboard link" decision
You chose no login/PIN gate for the India dashboard. The RLS policies in
`schema.sql` allow the anon key to read and write both tables — that's what makes
a link-only, no-login dashboard possible. It also means anyone who gets the URL
(or your deployed app's URL) can see every speaker's phone number, email, and
hotel room number, and could technically write bogus rows via the browser
console. For a ~200-person internal event that's a common and reasonable
trade-off for simplicity — flagging it once here so it's a documented choice,
not an oversight. If you ever want to tighten it later, the smallest change is
adding a shared PIN check before rendering `<EventPortal />`, without touching
the schema.

## Files
- `src/supabaseClient.js` — Supabase client init (reads env vars)
- `src/EventPortal.jsx` — the full app (all 4 tabs), now Supabase-backed
- `schema.sql` — table definitions + RLS policies, run once in Supabase
- `.env.example` — copy to `.env` and fill in your project's values
