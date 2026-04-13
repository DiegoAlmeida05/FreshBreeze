create table if not exists public.team_time_entry_tasks_admin_published (
  id uuid primary key default gen_random_uuid(),
  work_date date not null,
  route_group_id uuid not null references public.route_groups(id) on delete cascade,
  route_stop_id uuid not null references public.route_stops(id) on delete cascade,
  daily_task_id uuid not null references public.daily_tasks(id) on delete cascade,
  planned_minutes integer not null default 0,
  actual_minutes integer not null default 0,
  note text null,
  created_by_profile_id uuid null references public.profiles(id),
  updated_by_profile_id uuid null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz not null default now(),
  constraint team_time_entry_tasks_admin_published_non_negative_minutes check (
    planned_minutes >= 0
    and actual_minutes >= 0
  ),
  constraint team_time_entry_tasks_admin_published_unique_stop_date unique (work_date, route_stop_id)
);

create index if not exists idx_team_time_entry_tasks_admin_published_work_date
  on public.team_time_entry_tasks_admin_published (work_date);

create index if not exists idx_team_time_entry_tasks_admin_published_route_group_id
  on public.team_time_entry_tasks_admin_published (route_group_id);
