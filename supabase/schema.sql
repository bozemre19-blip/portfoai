-- Supabase schema for Okul Gözlem Asistanı
-- Creates tables: children, observations, assessments, media
-- Enables UUID generation and timestamps

-- Extensions
create extension if not exists pgcrypto;

-- Helper function for updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Children
create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  first_name text not null,
  last_name text not null,
  dob date not null,
  photo_url text,
  classroom text,
  consent_obtained boolean not null default false,
  guardians jsonb,
  health jsonb,
  interests text[],
  strengths text[],
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists children_user_id_idx on public.children(user_id);

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'children_set_updated_at'
      and tgrelid = 'public.children'::regclass
  ) then
    create trigger children_set_updated_at
    before update on public.children
    for each row execute function public.set_updated_at();
  end if;
end$$;

-- Observations
create table if not exists public.observations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  user_id uuid not null,
  note text not null,
  context text,
  domains text[] not null,
  tags text[],
  media_ids text[],
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists observations_child_id_idx on public.observations(child_id);
create index if not exists observations_user_id_idx on public.observations(user_id);

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'observations_set_updated_at'
      and tgrelid = 'public.observations'::regclass
  ) then
    create trigger observations_set_updated_at
    before update on public.observations
    for each row execute function public.set_updated_at();
  end if;
end$$;

-- Assessments (AI results)
create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid not null references public.observations(id) on delete cascade,
  user_id uuid not null,
  domain_scores jsonb,
  risk text,
  summary text,
  suggestions text[],
  created_at timestamp with time zone not null default now()
);

create index if not exists assessments_observation_id_idx on public.assessments(observation_id);
create index if not exists assessments_user_id_idx on public.assessments(user_id);
-- Ensure one-to-one relationship: one assessment per observation
create unique index if not exists assessments_observation_unique on public.assessments(observation_id);

-- Media (child products/photos/videos)
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  user_id uuid not null,
  type text not null check (type in ('image','video')),
  storage_path text not null,
  name text not null,
  description text,
  domain text,
  created_at timestamp with time zone not null default now()
);

create index if not exists media_child_id_idx on public.media(child_id);
create index if not exists media_user_id_idx on public.media(user_id);

-- Goals (child development goals)
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  user_id uuid not null,
  title text not null,
  description text,
  domain text not null,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed', 'cancelled')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  target_date date,
  progress int not null default 0 check (progress >= 0 and progress <= 100),
  notes text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  completed_at timestamp with time zone
);

create index if not exists goals_child_id_idx on public.goals(child_id);
create index if not exists goals_user_id_idx on public.goals(user_id);
create index if not exists goals_status_idx on public.goals(status);

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'goals_set_updated_at'
      and tgrelid = 'public.goals'::regclass
  ) then
    create trigger goals_set_updated_at
    before update on public.goals
    for each row execute function public.set_updated_at();
  end if;
end$$;

-- Attendance (daily attendance tracking)
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  user_id uuid not null,
  date date not null,
  status text not null check (status in ('present', 'absent', 'late', 'excused')),
  notes text,
  checked_in_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists attendance_child_id_idx on public.attendance(child_id);
create index if not exists attendance_user_id_idx on public.attendance(user_id);
create index if not exists attendance_date_idx on public.attendance(date);
-- Ensure one attendance record per child per day
create unique index if not exists attendance_child_date_unique on public.attendance(child_id, date);

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'attendance_set_updated_at'
      and tgrelid = 'public.attendance'::regclass
  ) then
    create trigger attendance_set_updated_at
    before update on public.attendance
    for each row execute function public.set_updated_at();
  end if;
end$$;

-- Optional: create storage buckets (run with service role in SQL editor)
-- insert into storage.buckets (id, name, public) values ('child-media','child-media', false) on conflict do nothing;
-- insert into storage.buckets (id, name, public) values ('avatars','avatars', true) on conflict do nothing;
