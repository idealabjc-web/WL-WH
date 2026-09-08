-- Run this in Supabase's SQL editor (Project → SQL Editor → New query).

create table if not exists speakers (
  id text primary key,                 -- short badge ID, generated client-side (uid())
  name text not null,
  email text,
  phone text,
  session_title text,
  day text,
  time_slot text,
  room text,
  checkin_date text,
  checkout_date text,
  nights text,
  diet text default 'No preference',
  allergy text,
  tour text default 'yes',             -- 'yes' | 'no' | 'undecided'
  concerns text,
  checked_in boolean default false,
  checked_in_at timestamptz,
  qr_url text,                         -- public URL of the stored QR badge image
  id_card_url text,                    -- public URL of the full official ID Card JPEG image
  created_at timestamptz default now()
);

-- In case the table already exists, add the column if missing:
alter table speakers add column if not exists id_card_url text;

create table if not exists feedback (
  id text primary key,
  name text,
  category text,
  rating int check (rating between 1 and 5),
  comment text,
  ts timestamptz default now()
);

-- Public, no-login dashboard: anon key can read/write both tables.
-- (You chose a fully public link — no PIN gate. Keep in mind this means
-- anyone with the URL can see names, rooms, phone numbers, emails.)
alter table speakers enable row level security;
alter table feedback enable row level security;

create policy "public read speakers" on speakers for select using (true);
create policy "public insert speakers" on speakers for insert with check (true);
create policy "public update speakers" on speakers for update using (true);

create policy "public read feedback" on feedback for select using (true);
create policy "public insert feedback" on feedback for insert with check (true);

-- After running this, go to Database → Replication and enable Realtime
-- for both the `speakers` and `feedback` tables.

-- Storage bucket for QR badge images, so each speaker's badge is a real
-- stored file (not regenerated from a third-party API on every page load).
insert into storage.buckets (id, name, public)
values ('qr-badges', 'qr-badges', true)
on conflict (id) do nothing;

create policy "public read qr badges" on storage.objects
  for select using (bucket_id = 'qr-badges');

create policy "public upload qr badges" on storage.objects
  for insert with check (bucket_id = 'qr-badges');

create policy "public overwrite qr badges" on storage.objects
  for update using (bucket_id = 'qr-badges');

-- Dedicated storage bucket for full official ID Card JPEG images
insert into storage.buckets (id, name, public)
values ('id-cards', 'id-cards', true)
on conflict (id) do nothing;

create policy "public read id cards" on storage.objects
  for select using (bucket_id = 'id-cards');

create policy "public upload id cards" on storage.objects
  for insert with check (bucket_id = 'id-cards');

create policy "public overwrite id cards" on storage.objects
  for update using (bucket_id = 'id-cards');


