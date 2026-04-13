alter table if exists public.team_time_entry_tasks_admin_published
  add column if not exists employee_id uuid,
  add column if not exists employee_name_snapshot text,
  add column if not exists applied_rate_snapshot numeric(12,2),
  add column if not exists rate_type_snapshot text,
  add column if not exists base_minutes_snapshot integer,
  add column if not exists start_extra_minutes_snapshot integer,
  add column if not exists end_extra_minutes_snapshot integer,
  add column if not exists other_extra_minutes_snapshot integer,
  add column if not exists manual_adjustment_minutes_snapshot integer,
  add column if not exists total_paid_minutes_snapshot integer,
  add column if not exists total_pay_snapshot numeric(12,2);

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'team_time_entry_tasks_admin_published_unique_stop_date'
  ) then
    alter table public.team_time_entry_tasks_admin_published
      drop constraint team_time_entry_tasks_admin_published_unique_stop_date;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'team_time_entry_tasks_admin_published_unique_stop_date_employee'
  ) then
    alter table public.team_time_entry_tasks_admin_published
      add constraint team_time_entry_tasks_admin_published_unique_stop_date_employee
      unique (work_date, route_stop_id, employee_id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'team_time_entry_tasks_admin_published_employee_id_fkey'
  ) then
    alter table public.team_time_entry_tasks_admin_published
      add constraint team_time_entry_tasks_admin_published_employee_id_fkey
      foreign key (employee_id) references public.employees(id) on delete cascade;
  end if;
end $$;

create index if not exists idx_team_time_entry_tasks_admin_published_employee_id
  on public.team_time_entry_tasks_admin_published (employee_id);
