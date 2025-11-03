-- Chat threads & messages for Teacher Assistant
create extension if not exists pgcrypto;

-- helper to update updated_at if not exists already
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  mode text not null check (mode in ('general','class','child')),
  classroom text,
  child_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chat_threads_user_idx on public.chat_threads(user_id, updated_at desc);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'chat_threads_set_updated_at'
      and tgrelid = 'public.chat_threads'::regclass
  ) then
    create trigger chat_threads_set_updated_at
      before update on public.chat_threads
      for each row execute function public.set_updated_at();
  end if;
end$$;

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_thread_idx on public.chat_messages(thread_id, created_at asc);

alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;

-- Threads policies (owner only)
drop policy if exists chat_threads_select on public.chat_threads;
create policy chat_threads_select on public.chat_threads
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists chat_threads_insert on public.chat_threads;
create policy chat_threads_insert on public.chat_threads
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists chat_threads_update on public.chat_threads;
create policy chat_threads_update on public.chat_threads
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists chat_threads_delete on public.chat_threads;
create policy chat_threads_delete on public.chat_threads
  for delete to authenticated
  using (user_id = auth.uid());

-- Messages policies (owner via thread)
drop policy if exists chat_messages_select on public.chat_messages;
create policy chat_messages_select on public.chat_messages
  for select to authenticated
  using (exists (
    select 1 from public.chat_threads t
    where t.id = chat_messages.thread_id and t.user_id = auth.uid()
  ));

drop policy if exists chat_messages_insert on public.chat_messages;
create policy chat_messages_insert on public.chat_messages
  for insert to authenticated
  with check (
    user_id = auth.uid() and exists (
      select 1 from public.chat_threads t
      where t.id = thread_id and t.user_id = auth.uid()
    )
  );

