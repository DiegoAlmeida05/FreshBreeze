-- Create property reports used by job detail flows.
create table if not exists public.property_reports (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  daily_task_id uuid null references public.daily_tasks(id) on delete set null,
  title text not null check (char_length(trim(title)) > 0),
  description text not null default '',
  photo_url text null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_by_profile_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  resolved_by_profile_id uuid null references public.profiles(id) on delete set null,
  resolved_at timestamptz null,
  constraint property_reports_resolution_consistency_check check (
    (status = 'open' and resolved_by_profile_id is null and resolved_at is null)
    or (status = 'resolved' and resolved_by_profile_id is not null and resolved_at is not null)
  )
);

create index if not exists property_reports_property_status_created_idx
  on public.property_reports (property_id, status, created_at desc);

create index if not exists property_reports_daily_task_id_idx
  on public.property_reports (daily_task_id);

create index if not exists property_reports_created_by_profile_id_idx
  on public.property_reports (created_by_profile_id);

create index if not exists property_reports_resolved_by_profile_id_idx
  on public.property_reports (resolved_by_profile_id);

alter table public.property_reports enable row level security;

drop policy if exists "property_reports_select_authenticated" on public.property_reports;
create policy "property_reports_select_authenticated"
  on public.property_reports
  for select
  to authenticated
  using (true);

drop policy if exists "property_reports_insert_authenticated" on public.property_reports;
create policy "property_reports_insert_authenticated"
  on public.property_reports
  for insert
  to authenticated
  with check (created_by_profile_id = auth.uid());

drop policy if exists "property_reports_update_authenticated" on public.property_reports;
create policy "property_reports_update_authenticated"
  on public.property_reports
  for update
  to authenticated
  using (true)
  with check (
    (
      status = 'open'
      and resolved_by_profile_id is null
      and resolved_at is null
    )
    or (
      status = 'resolved'
      and resolved_by_profile_id = auth.uid()
      and resolved_at is not null
    )
  );