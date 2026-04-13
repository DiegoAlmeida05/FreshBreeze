create table if not exists public.team_time_entries_admin (
  id uuid primary key default gen_random_uuid(),
  route_group_id uuid not null references public.route_groups(id) on delete cascade,
  work_date date not null,
  worked_minutes integer not null default 0,
  note text null,
  created_by_profile_id uuid null references public.profiles(id),
  updated_by_profile_id uuid null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint team_time_entries_admin_worked_minutes_non_negative check (worked_minutes >= 0),
  constraint team_time_entries_admin_unique_group_date unique (route_group_id, work_date)
);

create index if not exists idx_team_time_entries_admin_work_date
  on public.team_time_entries_admin (work_date);

create index if not exists idx_team_time_entries_admin_route_group_id
  on public.team_time_entries_admin (route_group_id);

create table if not exists public.employee_hours_summary_adjustments_admin (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  work_date date not null,
  start_extra_minutes integer not null default 0,
  end_extra_minutes integer not null default 0,
  other_extra_minutes integer not null default 0,
  manual_adjustment_minutes integer not null default 0,
  note text null,
  created_by_profile_id uuid null references public.profiles(id),
  updated_by_profile_id uuid null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employee_hours_summary_adjustments_admin_non_negative_extras check (
    start_extra_minutes >= 0
    and end_extra_minutes >= 0
    and other_extra_minutes >= 0
  ),
  constraint employee_hours_summary_adjustments_admin_unique_employee_date unique (employee_id, work_date)
);

create index if not exists idx_employee_hours_summary_adjustments_admin_work_date
  on public.employee_hours_summary_adjustments_admin (work_date);

create index if not exists idx_employee_hours_summary_adjustments_admin_employee_id
  on public.employee_hours_summary_adjustments_admin (employee_id);