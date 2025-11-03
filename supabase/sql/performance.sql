-- Performance / Indexing and thumbnails plan

-- 1) Common composite indexes
create index if not exists observations_user_created_idx on public.observations(user_id, created_at desc);
create index if not exists observations_child_created_idx on public.observations(child_id, created_at desc);
create index if not exists media_user_created_idx on public.media(user_id, created_at desc);
create index if not exists media_child_created_idx on public.media(child_id, created_at desc);
-- speed up classroom-scoped child lookups
create index if not exists children_user_classroom_idx on public.children(user_id, classroom);

-- Optional: assessments lookup by observation
create index if not exists assessments_observation_idx on public.assessments(observation_id, created_at desc);

-- 2) Thumbnail support
-- If you want to store thumbnails, add a column and write both files during upload.
alter table public.media add column if not exists thumb_path text;

-- Sample storage policy reminder (keep objects owned by user/bucket path rule)
-- create policy child_media_select_uidpath on storage.objects for select to authenticated
-- using (bucket_id='child-media' and split_part(name,'/',1)=auth.uid()::text);

-- 3) Vacuum/analyze (run periodically from maintenance jobs)
-- vacuum analyze public.observations;
-- vacuum analyze public.media;
