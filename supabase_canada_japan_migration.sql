-- ─────────────────────────────────────────────────────────────
-- WL-WH / SPEAKER CHAPTERS: CANADA & JAPAN SERIES MIGRATION
-- Run this standalone SQL in Supabase's SQL Editor (New Query).
-- Completely isolated from Dubai (`speakers`, `sessions`, `attendance`)
-- and Paris (`paris_speakers`, `paris_sessions`, `paris_attendance`).
-- ─────────────────────────────────────────────────────────────

-- =============================================================
-- 1. CANADA SERIES TABLES (canada_speakers, canada_sessions, canada_attendance)
-- =============================================================
create table if not exists canada_speakers (
  id text primary key,
  name text not null,
  email text,
  phone text,
  country text,
  diet text default 'No preference',
  allergy text,
  tour text default 'yes',
  concerns text,
  qr_url text,
  id_card_url text,
  photo_url text,
  abstract_status text,
  abstract_url text,
  whose_speaker text,
  team text,
  portal_token text,
  speaker_tag text,
  role text,
  password_hash text,
  id_card_position jsonb,
  accompanying_persons jsonb,
  event_slug text not null default 'canada',
  created_at timestamptz default now()
);

create index if not exists idx_canada_speakers_email on canada_speakers(email);
create index if not exists idx_canada_speakers_event on canada_speakers(event_slug);

create table if not exists canada_sessions (
  id uuid primary key default gen_random_uuid(),
  speaker_id text references canada_speakers(id) on delete cascade,
  session_title text,
  day text,
  time_slot text,
  conference_room text,
  room text
);

create index if not exists idx_canada_sessions_speaker_id on canada_sessions(speaker_id);

create table if not exists canada_attendance (
  id uuid primary key default gen_random_uuid(),
  speaker_id text references canada_speakers(id) on delete cascade,
  checked_in boolean default false,
  checked_in_at timestamptz,
  checked_out boolean default false,
  checked_out_at timestamptz,
  checkout_notes text
);

create index if not exists idx_canada_attendance_speaker_id on canada_attendance(speaker_id);

-- =============================================================
-- 2. JAPAN SERIES TABLES (japan_speakers, japan_sessions, japan_attendance)
-- =============================================================
create table if not exists japan_speakers (
  id text primary key,
  name text not null,
  email text,
  phone text,
  country text,
  diet text default 'No preference',
  allergy text,
  tour text default 'yes',
  concerns text,
  qr_url text,
  id_card_url text,
  photo_url text,
  abstract_status text,
  abstract_url text,
  whose_speaker text,
  team text,
  portal_token text,
  speaker_tag text,
  role text,
  password_hash text,
  id_card_position jsonb,
  accompanying_persons jsonb,
  event_slug text not null default 'japan',
  created_at timestamptz default now()
);

create index if not exists idx_japan_speakers_email on japan_speakers(email);
create index if not exists idx_japan_speakers_event on japan_speakers(event_slug);

create table if not exists japan_sessions (
  id uuid primary key default gen_random_uuid(),
  speaker_id text references japan_speakers(id) on delete cascade,
  session_title text,
  day text,
  time_slot text,
  conference_room text,
  room text
);

create index if not exists idx_japan_sessions_speaker_id on japan_sessions(speaker_id);

create table if not exists japan_attendance (
  id uuid primary key default gen_random_uuid(),
  speaker_id text references japan_speakers(id) on delete cascade,
  checked_in boolean default false,
  checked_in_at timestamptz,
  checked_out boolean default false,
  checked_out_at timestamptz,
  checkout_notes text
);

create index if not exists idx_japan_attendance_speaker_id on japan_attendance(speaker_id);

-- =============================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES FOR CANADA & JAPAN
-- =============================================================
alter table canada_speakers enable row level security;
alter table canada_sessions enable row level security;
alter table canada_attendance enable row level security;

alter table japan_speakers enable row level security;
alter table japan_sessions enable row level security;
alter table japan_attendance enable row level security;

do $$ begin
  create policy "public read canada_speakers" on canada_speakers for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public insert canada_speakers" on canada_speakers for insert with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public update canada_speakers" on canada_speakers for update using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public delete canada_speakers" on canada_speakers for delete using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public read canada_sessions" on canada_sessions for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public insert canada_sessions" on canada_sessions for insert with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public update canada_sessions" on canada_sessions for update using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public delete canada_sessions" on canada_sessions for delete using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public read canada_attendance" on canada_attendance for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public insert canada_attendance" on canada_attendance for insert with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public update canada_attendance" on canada_attendance for update using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public delete canada_attendance" on canada_attendance for delete using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public read japan_speakers" on japan_speakers for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public insert japan_speakers" on japan_speakers for insert with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public update japan_speakers" on japan_speakers for update using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public delete japan_speakers" on japan_speakers for delete using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public read japan_sessions" on japan_sessions for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public insert japan_sessions" on japan_sessions for insert with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public update japan_sessions" on japan_sessions for update using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public delete japan_sessions" on japan_sessions for delete using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public read japan_attendance" on japan_attendance for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public insert japan_attendance" on japan_attendance for insert with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public update japan_attendance" on japan_attendance for update using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public delete japan_attendance" on japan_attendance for delete using (true);
exception when duplicate_object then null; end $$;

-- =============================================================
-- 4. SHARED TABLE SAFEGUARDS FOR MULTI-EVENT ISOLATION
-- =============================================================
-- Ensure unified accommodations table works cleanly for Canada/Japan IDs
-- without foreign-key conflicts against Dubai's `speakers` table.
alter table if exists accommodations add column if not exists event text default 'dubai';
alter table if exists accommodations drop constraint if exists accommodations_speaker_id_fkey;
create index if not exists idx_accommodations_event on accommodations(event);

do $$ begin
  create policy "public delete accommodations" on accommodations for delete using (true);
exception when duplicate_object then null; end $$;

-- Ensure feedback, announcements, and audit_logs include event_slug isolation
alter table if exists feedback add column if not exists event_slug text not null default 'dubai';
alter table if exists announcements add column if not exists event_slug text not null default 'dubai';
alter table if exists audit_logs add column if not exists event_slug text default 'dubai';


