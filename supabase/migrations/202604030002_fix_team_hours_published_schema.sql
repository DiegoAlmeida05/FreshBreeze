create table if not exists public.team_time_entry_tasks_admin_published (
  id uuid primary key default gen_random_uuid()
);

alter table if exists public.team_time_entry_tasks_admin_published
  add column if not exists work_date date,
  add column if not exists route_group_id uuid,
  add column if not exists route_stop_id uuid,
  add column if not exists daily_task_id uuid,
  add column if not exists planned_minutes integer default 0,
  add column if not exists actual_minutes integer default 0,
  add column if not exists note text,
  add column if not exists published_at timestamptz default now();

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'team_time_entry_tasks_admin_published'
      and column_name = 'date'
  ) then
    execute '
      update public.team_time_entry_tasks_admin_published
      set work_date = "date"::date
      where work_date is null
        and "date" is not null
    ';
  end if;
end $$;

update public.team_time_entry_tasks_admin_published p
set route_group_id = rs.route_group_id
from public.route_stops rs
where p.route_group_id is null
  and p.route_stop_id = rs.id;

update public.team_time_entry_tasks_admin_published
set daily_task_id = rs.daily_task_id
from public.route_stops rs
where public.team_time_entry_tasks_admin_published.daily_task_id is null
  and public.team_time_entry_tasks_admin_published.route_stop_id = rs.id;

update public.team_time_entry_tasks_admin_published
set planned_minutes = 0
where planned_minutes is null;

update public.team_time_entry_tasks_admin_published
set actual_minutes = 0
where actual_minutes is null;

do $$
begin
  if exists (
    select 1
    from public.team_time_entry_tasks_admin_published
    where work_date is null
      or route_group_id is null
      or route_stop_id is null
      or daily_task_id is null
  ) then
    raise exception 'team_time_entry_tasks_admin_published still has null required fields after backfill';
  end if;
end $$;

alter table public.team_time_entry_tasks_admin_published
  alter column work_date set not null,
  alter column route_group_id set not null,
  alter column route_stop_id set not null,
  alter column daily_task_id set not null,
  alter column planned_minutes set not null,
  alter column actual_minutes set not null,
  alter column published_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'team_time_entry_tasks_admin_published_route_group_id_fkey'
  ) then
    alter table public.team_time_entry_tasks_admin_published
      add constraint team_time_entry_tasks_admin_published_route_group_id_fkey
      foreign key (route_group_id) references public.route_groups(id) on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'team_time_entry_tasks_admin_published_route_stop_id_fkey'
  ) then
    alter table public.team_time_entry_tasks_admin_published
      add constraint team_time_entry_tasks_admin_published_route_stop_id_fkey
      foreign key (route_stop_id) references public.route_stops(id) on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'team_time_entry_tasks_admin_published_daily_task_id_fkey'
  ) then
    alter table public.team_time_entry_tasks_admin_published
      add constraint team_time_entry_tasks_admin_published_daily_task_id_fkey
      foreign key (daily_task_id) references public.daily_tasks(id) on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'team_time_entry_tasks_admin_published_non_negative_minutes'
  ) then
    alter table public.team_time_entry_tasks_admin_published
      add constraint team_time_entry_tasks_admin_published_non_negative_minutes
      check (planned_minutes >= 0 and actual_minutes >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'team_time_entry_tasks_admin_published_unique_stop_date'
  ) then
    alter table public.team_time_entry_tasks_admin_published
      add constraint team_time_entry_tasks_admin_published_unique_stop_date
      unique (work_date, route_stop_id);
  end if;
end $$;

create index if not exists idx_team_time_entry_tasks_admin_published_work_date
  on public.team_time_entry_tasks_admin_published (work_date);

create index if not exists idx_team_time_entry_tasks_admin_published_route_group_id
  on public.team_time_entry_tasks_admin_published (route_group_id);
