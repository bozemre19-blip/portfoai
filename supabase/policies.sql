-- Row Level Security policies for Okul Gözlem Asistanı

-- Enable RLS
alter table public.children enable row level security;
alter table public.observations enable row level security;
alter table public.assessments enable row level security;
alter table public.media enable row level security;

-- Children policies
drop policy if exists "children_select_own" on public.children;
create policy "children_select_own" on public.children
for select using (auth.uid() = user_id);

drop policy if exists "children_insert_own" on public.children;
create policy "children_insert_own" on public.children
for insert with check (auth.uid() = user_id);

drop policy if exists "children_update_own" on public.children;
create policy "children_update_own" on public.children
for update using (auth.uid() = user_id);

drop policy if exists "children_delete_own" on public.children;
create policy "children_delete_own" on public.children
for delete using (auth.uid() = user_id);

-- Observations policies
drop policy if exists "observations_select_own" on public.observations;
create policy "observations_select_own" on public.observations
for select using (auth.uid() = user_id);

drop policy if exists "observations_insert_own" on public.observations;
create policy "observations_insert_own" on public.observations
for insert with check (auth.uid() = user_id);

drop policy if exists "observations_update_own" on public.observations;
create policy "observations_update_own" on public.observations
for update using (auth.uid() = user_id);

drop policy if exists "observations_delete_own" on public.observations;
create policy "observations_delete_own" on public.observations
for delete using (auth.uid() = user_id);

-- Assessments policies
drop policy if exists "assessments_select_own" on public.assessments;
create policy "assessments_select_own" on public.assessments
for select using (auth.uid() = user_id);

drop policy if exists "assessments_insert_own" on public.assessments;
create policy "assessments_insert_own" on public.assessments
for insert with check (auth.uid() = user_id);

drop policy if exists "assessments_update_own" on public.assessments;
create policy "assessments_update_own" on public.assessments
for update using (auth.uid() = user_id);

drop policy if exists "assessments_delete_own" on public.assessments;
create policy "assessments_delete_own" on public.assessments
for delete using (auth.uid() = user_id);

-- Media policies
drop policy if exists "media_select_own" on public.media;
create policy "media_select_own" on public.media
for select using (auth.uid() = user_id);

drop policy if exists "media_insert_own" on public.media;
create policy "media_insert_own" on public.media
for insert with check (auth.uid() = user_id);

drop policy if exists "media_update_own" on public.media;
create policy "media_update_own" on public.media
for update using (auth.uid() = user_id);

drop policy if exists "media_delete_own" on public.media;
create policy "media_delete_own" on public.media
for delete using (auth.uid() = user_id);

-- Storage policies (run in SQL editor with appropriate privileges)
-- Restrict access to storage based on JWT claims
-- Enable public READ for avatars; all other operations by owner only.

alter table storage.objects enable row level security;

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

-- Private child-media bucket: only owner can read/write
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
