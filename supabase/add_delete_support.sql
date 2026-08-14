-- Run this in Supabase's SQL Editor (New query -> paste -> Run).
-- Adds what's needed for deleting Moments, on top of the original
-- schema.sql you already ran. schema.sql has been updated to include
-- these too, so a brand new project only needs schema.sql - this file
-- is just for catching up a project that's already running.

-- Store the raw storage path alongside the public URL, so deleting a
-- photo doesn't require parsing it back out of a URL.
alter table moments add column photo_path text;

create policy "Users can delete their own moments"
  on moments for delete
  using (auth.uid() = user_id);

create policy "Users can delete their own moment photos"
  on storage.objects for delete
  using (
    bucket_id = 'moments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
