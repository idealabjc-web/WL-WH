# Speaker Check-In Portal

A 4-tab event ops app (Register / Check-In / Dashboard / Feedback) for on-site
conference check-in with QR badges, live-synced via Supabase.

## 1. Install

```bash
npm install
```

## 2. Set up Supabase

1. Create a free project at supabase.com.
2. Open **SQL Editor → New query**, paste the contents of `schema.sql`, run it.
   This creates the `speakers` and `feedback` tables plus the RLS policies that
   allow the public dashboard link to work with no login.
3. Go to **Database → Replication** and toggle **Realtime on** for both
   `speakers` and `feedback`. This is what makes the India dashboard update
   live when the front desk checks someone in.
4. Go to **Settings → API** and copy your **Project URL** and **anon public
   key**.

## 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in the two values from step 2.4:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

## 4. Run it

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). If `.env` is
missing or empty, you'll see an on-screen "Supabase isn't configured yet"
message with the same steps — not a blank page or console crash.

## 5. Build for deployment

```bash
npm run build
```

Deploy the `dist/` folder to Vercel, Netlify, or any static host. Set the same
two `VITE_SUPABASE_*` environment variables in your host's dashboard (not just
locally) — the front desk iPad and the India dashboard both need HTTPS anyway
for the camera scanner to work, so a static host with built-in HTTPS (Vercel/
Netlify) is the easy path.

## Project structure

```
conference-portal/
├── .env.example          # Copy to .env, fill in your Supabase values
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
├── schema.sql             # Run once in Supabase's SQL editor
└── src/
    ├── main.jsx            # React entry point
    ├── App.jsx             # Renders <EventPortal />
    ├── index.css           # Tailwind directives
    ├── supabaseClient.js   # Supabase client (fails gracefully if unconfigured)
    └── EventPortal.jsx     # The whole app — all 4 tabs
```

## Notes on decisions already made

- **Badge IDs**: short client-generated codes (not UUIDs), used as the QR
  payload, the search key, and the Postgres primary key. Scanning a badge just
  looks up this ID directly — no separate mapping step.
- **iPad Safari camera scanning**: uses jsQR (loaded at runtime from a CDN
  `<script>` tag) instead of the native `BarcodeDetector` API, which Safari
  doesn't implement.
- **Public dashboard link**: no login/PIN, by design, for simplicity with a
  ~200-person internal event. This also means anyone with the link can see
  names, emails, phone numbers, and room numbers, and the anon key can write
  to the tables from a browser console. If you want to tighten this later, the
  smallest fix is a shared PIN gate in front of `<EventPortal />`, without
  touching the schema.
