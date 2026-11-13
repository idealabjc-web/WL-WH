-- ─────────────────────────────────────────────────────────────
-- WL-WH / SPEAKER CHAPTERS SUPABASE DATABASE & STORAGE SCHEMA
-- Run this in Supabase's SQL editor (Project → SQL Editor → New query).
-- Supports Multi-Event Architecture (Dubai Series, Paris Series, etc.)
-- ─────────────────────────────────────────────────────────────

-- 1. SPEAKERS TABLE
create table if not exists speakers (
  id text primary key,                 -- short badge ID (e.g. uid() or WL-101 / PR-01)
  name text not null,
  email text,
  phone text,
  country text,
  diet text default 'No preference',
  allergy text,
  tour text default 'yes',             -- 'yes' | 'no' | 'undecided'
  concerns text,
  qr_url text,                         -- public URL in 'qr-badges' bucket
  id_card_url text,                    -- public URL in 'id-cards' bucket
  photo_url text,                      -- public URL in 'speaker-photos' bucket
  abstract_status text,
  abstract_url text,                   -- public URL / JSON map in 'speaker-abstracts' bucket
  whose_speaker text,
  team text,
  portal_token text,                   -- 6-character access token for magic link & password
  speaker_tag text,
  role text,
  password_hash text,
  accompanying_persons jsonb,
  event_slug text not null default 'dubai', -- 'dubai' | 'paris'
  created_at timestamptz default now()
);

-- Ensure non-breaking columns exist on existing table:
alter table speakers add column if not exists country text;
alter table speakers add column if not exists photo_url text;
alter table speakers add column if not exists id_card_url text;
alter table speakers add column if not exists abstract_status text;
alter table speakers add column if not exists abstract_url text;
alter table speakers add column if not exists whose_speaker text;
alter table speakers add column if not exists team text;
alter table speakers add column if not exists portal_token text;
alter table speakers add column if not exists speaker_tag text;
alter table speakers add column if not exists role text;
alter table speakers add column if not exists password_hash text;
alter table speakers add column if not exists accompanying_persons jsonb;
alter table speakers add column if not exists event_slug text not null default 'dubai';

-- Fast index on event_slug
create index if not exists idx_speakers_event on speakers(event_slug);

-- 2. SESSIONS TABLE
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  speaker_id text references speakers(id) on delete cascade,
  session_title text,
  day text,
  time_slot text,
  conference_room text,
  room text
);

alter table sessions add column if not exists conference_room text;

-- 3. ACCOMMODATIONS TABLE (Unified across Dubai and Paris via 'event' column)
create table if not exists accommodations (
  id uuid primary key default gen_random_uuid(),
  speaker_id text,
  accommodation_status text,
  checkin_date text,
  checkout_date text,
  nights text,
  hotel_room text,
  event text default 'dubai'
);

alter table accommodations add column if not exists accommodation_status text;
alter table accommodations add column if not exists hotel_room text;
alter table accommodations add column if not exists event text default 'dubai';
alter table accommodations drop constraint if exists accommodations_speaker_id_fkey;
create index if not exists idx_accommodations_speaker_id on accommodations(speaker_id);
create index if not exists idx_accommodations_event on accommodations(event);

-- 4. ATTENDANCE TABLE
create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  speaker_id text references speakers(id) on delete cascade,
  checked_in boolean default false,
  checked_in_at timestamptz,
  checked_out boolean default false,
  checked_out_at timestamptz,
  checkout_notes text
);

-- 5. FEEDBACK TABLE
create table if not exists feedback (
  id text primary key,
  name text,
  category text,
  rating int check (rating between 1 and 5),
  comment text,
  event_slug text not null default 'dubai',
  ts timestamptz default now()
);

alter table feedback add column if not exists event_slug text not null default 'dubai';

-- 6. ANNOUNCEMENTS TABLE
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  created_by text,
  event_slug text not null default 'dubai',
  created_at timestamptz default now()
);

alter table announcements add column if not exists event_slug text not null default 'dubai';

-- 7. AUDIT LOGS TABLE
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  action text not null,
  target_id text,
  details jsonb,
  event_slug text default 'dubai',
  created_at timestamptz default now()
);

alter table audit_logs add column if not exists event_slug text default 'dubai';

-- 8. SUPPORT TEAM TABLE
create table if not exists support_team (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  role text default 'support',
  password_hash text,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ─────────────────────────────────────────────────────────────
alter table speakers enable row level security;
alter table sessions enable row level security;
alter table accommodations enable row level security;
alter table attendance enable row level security;
alter table feedback enable row level security;
alter table announcements enable row level security;
alter table audit_logs enable row level security;
alter table support_team enable row level security;

-- Public read/write policies for event ops:
do $$ begin
  create policy "public read speakers" on speakers for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public insert speakers" on speakers for insert with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public update speakers" on speakers for update using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public delete speakers" on speakers for delete using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public read sessions" on sessions for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public insert sessions" on sessions for insert with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public update sessions" on sessions for update using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public delete sessions" on sessions for delete using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public read accommodations" on accommodations for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public insert accommodations" on accommodations for insert with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public update accommodations" on accommodations for update using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public read attendance" on attendance for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public insert attendance" on attendance for insert with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public update attendance" on attendance for update using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public read feedback" on feedback for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public insert feedback" on feedback for insert with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public read announcements" on announcements for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public insert announcements" on announcements for insert with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public delete announcements" on announcements for delete using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public read audit_logs" on audit_logs for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public insert audit_logs" on audit_logs for insert with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public delete audit_logs" on audit_logs for delete using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public read support team" on support_team for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public update support team" on support_team for update using (true);
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────────────────────
-- SUPABASE STORAGE BUCKETS (ALL 5 REQUIRED BUCKETS)
-- ─────────────────────────────────────────────────────────────

-- Bucket 1: qr-badges
insert into storage.buckets (id, name, public)
values ('qr-badges', 'qr-badges', true)
on conflict (id) do nothing;

do $$ begin
  create policy "public read qr badges" on storage.objects for select using (bucket_id = 'qr-badges');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public upload qr badges" on storage.objects for insert with check (bucket_id = 'qr-badges');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public overwrite qr badges" on storage.objects for update using (bucket_id = 'qr-badges');
exception when duplicate_object then null; end $$;

-- Bucket 2: id-cards
insert into storage.buckets (id, name, public)
values ('id-cards', 'id-cards', true)
on conflict (id) do nothing;

do $$ begin
  create policy "public read id cards" on storage.objects for select using (bucket_id = 'id-cards');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public upload id cards" on storage.objects for insert with check (bucket_id = 'id-cards');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public overwrite id cards" on storage.objects for update using (bucket_id = 'id-cards');
exception when duplicate_object then null; end $$;

-- Bucket 3: speaker-photos
insert into storage.buckets (id, name, public)
values ('speaker-photos', 'speaker-photos', true)
on conflict (id) do nothing;

do $$ begin
  create policy "public read speaker photos" on storage.objects for select using (bucket_id = 'speaker-photos');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public upload speaker photos" on storage.objects for insert with check (bucket_id = 'speaker-photos');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public overwrite speaker photos" on storage.objects for update using (bucket_id = 'speaker-photos');
exception when duplicate_object then null; end $$;

-- Bucket 4: speaker-abstracts
insert into storage.buckets (id, name, public)
values ('speaker-abstracts', 'speaker-abstracts', true)
on conflict (id) do nothing;

do $$ begin
  create policy "public read abstracts" on storage.objects for select using (bucket_id = 'speaker-abstracts');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public upload abstracts" on storage.objects for insert with check (bucket_id = 'speaker-abstracts');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public overwrite abstracts" on storage.objects for update using (bucket_id = 'speaker-abstracts');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public delete abstracts" on storage.objects for delete using (bucket_id = 'speaker-abstracts');
exception when duplicate_object then null; end $$;

-- Bucket 5: peercite_proceedings
insert into storage.buckets (id, name, public)
values ('peercite_proceedings', 'peercite_proceedings', true)
on conflict (id) do nothing;

do $ begin
  create policy "public read peercite" on storage.objects for select using (bucket_id = 'peercite_proceedings');
exception when duplicate_object then null; end $;
do $ begin
  create policy "public upload peercite" on storage.objects for insert with check (bucket_id = 'peercite_proceedings');
exception when duplicate_object then null; end $;
do $ begin
  create policy "public overwrite peercite" on storage.objects for update using (bucket_id = 'peercite_proceedings');
exception when duplicate_object then null; end $;
do $ begin
  create policy "public delete peercite" on storage.objects for delete using (bucket_id = 'peercite_proceedings');
exception when duplicate_object then null; end $;

alter table speakers add column if not exists country text;
alter table speakers add column if not exists whose_speaker text;
alter table speakers add column if not exists team text;
alter table speakers add column if not exists portal_token text;
alter table speakers add column if not exists speaker_tag text;
alter table speakers add column if not exists accompanying_persons jsonb;
alter table speakers add column if not exists abstract_status text;
alter table speakers add column if not exists abstract_url text;
alter table speakers add column if not exists photo_url text;
