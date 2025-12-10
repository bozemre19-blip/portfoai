-- Enable RLS for goals and attendance
alter table public.goals enable row level security;
alter table public.attendance enable row level security;

-- Policies for goals
create policy "goals_select_own" on public.goals
for select using (auth.uid() = user_id);

create policy "goals_insert_own" on public.goals
for insert with check (auth.uid() = user_id);

create policy "goals_update_own" on public.goals
for update using (auth.uid() = user_id);

create policy "goals_delete_own" on public.goals
for delete using (auth.uid() = user_id);

-- Policies for attendance
create policy "attendance_select_own" on public.attendance
for select using (auth.uid() = user_id);

create policy "attendance_insert_own" on public.attendance
for insert with check (auth.uid() = user_id);

create policy "attendance_update_own" on public.attendance
for update using (auth.uid() = user_id);

create policy "attendance_delete_own" on public.attendance
for delete using (auth.uid() = user_id);
