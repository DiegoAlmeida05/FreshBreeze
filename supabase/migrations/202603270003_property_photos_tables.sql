create table if not exists public.property_report_photos (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.property_reports(id) on delete cascade,
  photo_url text not null,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now()
);

create index if not exists property_report_photos_report_sort_idx
  on public.property_report_photos (report_id, sort_order, created_at);

alter table public.property_report_photos enable row level security;

drop policy if exists "property_report_photos_select_authenticated" on public.property_report_photos;
create policy "property_report_photos_select_authenticated"
  on public.property_report_photos
  for select
  to authenticated
  using (true);

drop policy if exists "property_report_photos_insert_authenticated" on public.property_report_photos;
create policy "property_report_photos_insert_authenticated"
  on public.property_report_photos
  for insert
  to authenticated
  with check (true);

drop policy if exists "property_report_photos_delete_authenticated" on public.property_report_photos;
create policy "property_report_photos_delete_authenticated"
  on public.property_report_photos
  for delete
  to authenticated
  using (true);

create table if not exists public.property_key_photos (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  photo_url text not null,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now()
);

create index if not exists property_key_photos_property_sort_idx
  on public.property_key_photos (property_id, sort_order, created_at);

alter table public.property_key_photos enable row level security;

drop policy if exists "property_key_photos_select_authenticated" on public.property_key_photos;
create policy "property_key_photos_select_authenticated"
  on public.property_key_photos
  for select
  to authenticated
  using (true);

drop policy if exists "property_key_photos_insert_authenticated" on public.property_key_photos;
create policy "property_key_photos_insert_authenticated"
  on public.property_key_photos
  for insert
  to authenticated
  with check (true);

drop policy if exists "property_key_photos_delete_authenticated" on public.property_key_photos;
create policy "property_key_photos_delete_authenticated"
  on public.property_key_photos
  for delete
  to authenticated
  using (true);
