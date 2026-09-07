import { createClient } from '@supabase/supabase-js';

// Requires a .env file at the project root (copy .env.example) with:
//   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
//   VITE_SUPABASE_ANON_KEY=your-anon-public-key

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  // Don't throw here — EventPortal.jsx checks isSupabaseConfigured and shows
  // a clear setup screen instead of a blank white page / uncaught error.
  console.warn(
    'Supabase env vars missing. Copy .env.example to .env, fill in your project URL + anon key, then restart the dev server.'
  );
}

export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;
