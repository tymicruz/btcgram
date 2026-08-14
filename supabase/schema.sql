-- One-time setup: run this whole file in Supabase's SQL Editor
-- (Dashboard -> SQL Editor -> New query -> paste all of this -> Run)

-- The "moments" table: one row per photo someone saves/posts, plus the
-- weather/location/BTC data that was captured with it.
create table moments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  photo_url text not null,
  photo_path text not null,
  city text,
  country text,
  temperature double precision,
  condition text,
  local_time text,
  btc_price_usd double precision,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now()
);

-- Row Level Security: without this, ANY logged-in user could read or
-- write ANY row, regardless of who owns it. These policies make Postgres
-- itself enforce "you only ever see/create your own moments" - the app
-- doesn't have to get this right in every query, the database guarantees it.
alter table moments enable row level security;

create policy "Users can view their own moments"
  on moments for select
  using (auth.uid() = user_id);

create policy "Users can insert their own moments"
  on moments for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own moments"
  on moments for delete
  using (auth.uid() = user_id);

-- A storage bucket to hold the actual photo files. Public means anyone
-- with a photo's URL can view it (simplest setup for now) - only the
-- upload/write side is restricted below.
insert into storage.buckets (id, name, public)
values ('moments', 'moments', true);

create policy "Public can view moment photos"
  on storage.objects for select
  using (bucket_id = 'moments');

-- Uploads must go into a folder named after the uploader's own user id
-- (e.g. "<user-id>/photo123.jpg") - this policy checks that folder name
-- matches whoever's actually logged in, so no one can upload into (or
-- overwrite) another user's folder.
create policy "Users can upload into their own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'moments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own moment photos"
  on storage.objects for delete
  using (
    bucket_id = 'moments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
