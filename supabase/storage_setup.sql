-- Run this in Supabase SQL editor to set up Storage buckets + policies
-- If you see permission errors, ensure you run with supabase_admin role

-- Switch to admin to manage storage policies
set role supabase_admin;

-- Create buckets (id, name, public)
insert into storage.buckets (id, name, public) values ('avatars','avatars', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('child-media','child-media', false) on conflict do nothing;

-- Enable RLS on storage.objects (usually already enabled)
alter table storage.objects enable row level security;

-- Avatars: public read, owner write/update/delete
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
for select using (bucket_id = 'avatars');

drop policy if exists "avatars_owner_write" on storage.objects;
create policy "avatars_owner_write" on storage.objects
for insert to authenticated
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update" on storage.objects
for update to authenticated
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete" on storage.objects
for delete to authenticated
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Child media: private, only owner can CRUD
drop policy if exists "child_media_owner_select" on storage.objects;
create policy "child_media_owner_select" on storage.objects
for select to authenticated
  using (bucket_id = 'child-media' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "child_media_owner_insert" on storage.objects;
create policy "child_media_owner_insert" on storage.objects
for insert to authenticated
  with check (bucket_id = 'child-media' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "child_media_owner_update" on storage.objects;
create policy "child_media_owner_update" on storage.objects
for update to authenticated
  using (bucket_id = 'child-media' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'child-media' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "child_media_owner_delete" on storage.objects;
create policy "child_media_owner_delete" on storage.objects
for delete to authenticated
  using (bucket_id = 'child-media' and auth.uid()::text = (storage.foldername(name))[1]);

reset role;

