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

-- Optional: create storage buckets (run with service role in SQL editor)
-- insert into storage.buckets (id, name, public) values ('child-media','child-media', false) on conflict do nothing;
-- insert into storage.buckets (id, name, public) values ('avatars','avatars', true) on conflict do nothing;
