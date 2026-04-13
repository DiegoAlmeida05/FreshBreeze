create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  name text not null,
  country text null,
  state text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (date, name)
);

create index if not exists holidays_date_idx
  on public.holidays (date);

create index if not exists holidays_active_date_idx
  on public.holidays (is_active, date);

alter table public.holidays enable row level security;

drop policy if exists "holidays_select_authenticated" on public.holidays;
create policy "holidays_select_authenticated"
  on public.holidays
  for select
  to authenticated
  using (true);

drop policy if exists "holidays_insert_authenticated" on public.holidays;
create policy "holidays_insert_authenticated"
  on public.holidays
  for insert
  to authenticated
  with check (true);

drop policy if exists "holidays_update_authenticated" on public.holidays;
create policy "holidays_update_authenticated"
  on public.holidays
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "holidays_delete_authenticated" on public.holidays;
create policy "holidays_delete_authenticated"
  on public.holidays
  for delete
  to authenticated
  using (true);
