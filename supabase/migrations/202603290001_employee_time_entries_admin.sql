create table if not exists public.employee_time_entries_admin (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  route_stop_id uuid not null references public.route_stops(id) on delete cascade,
  daily_task_id uuid not null references public.daily_tasks(id) on delete cascade,
  work_date date not null,
  planned_minutes integer not null default 0 check (planned_minutes >= 0),
  actual_minutes integer not null default 0 check (actual_minutes >= 0),
  manual_extra_minutes integer not null default 0 check (manual_extra_minutes >= 0),
  note text null,
  created_by_profile_id uuid not null references public.profiles(id),
  updated_by_profile_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, route_stop_id)
);

create index if not exists employee_time_entries_admin_work_date_idx
  on public.employee_time_entries_admin (work_date);

create index if not exists employee_time_entries_admin_employee_work_date_idx
  on public.employee_time_entries_admin (employee_id, work_date);

create index if not exists employee_time_entries_admin_route_stop_idx
  on public.employee_time_entries_admin (route_stop_id);

alter table public.employee_time_entries_admin enable row level security;

drop policy if exists "employee_time_entries_admin_select_authenticated" on public.employee_time_entries_admin;
create policy "employee_time_entries_admin_select_authenticated"
  on public.employee_time_entries_admin
  for select
  to authenticated
  using (true);

drop policy if exists "employee_time_entries_admin_insert_authenticated" on public.employee_time_entries_admin;
create policy "employee_time_entries_admin_insert_authenticated"
  on public.employee_time_entries_admin
  for insert
  to authenticated
  with check (true);

drop policy if exists "employee_time_entries_admin_update_authenticated" on public.employee_time_entries_admin;
create policy "employee_time_entries_admin_update_authenticated"
  on public.employee_time_entries_admin
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "employee_time_entries_admin_delete_authenticated" on public.employee_time_entries_admin;
create policy "employee_time_entries_admin_delete_authenticated"
  on public.employee_time_entries_admin
  for delete
  to authenticated
  using (true);
