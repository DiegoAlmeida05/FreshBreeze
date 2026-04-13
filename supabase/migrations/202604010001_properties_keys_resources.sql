alter table public.properties
  add column if not exists has_keys boolean not null default false;

alter table public.properties
  add column if not exists key_count integer not null default 0 check (key_count >= 0);

create table if not exists public.property_keys (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  label text not null,
  pickup_address text,
  note text,
  attachment_url text,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists property_keys_property_sort_idx
  on public.property_keys (property_id, sort_order, created_at);

create table if not exists public.property_resources (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  title text not null,
  resource_type text not null check (resource_type in ('link', 'attachment')),
  url text not null,
  attachment_url text,
  note text,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists property_resources_property_sort_idx
  on public.property_resources (property_id, sort_order, created_at);

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists property_keys_set_updated_at on public.property_keys;
create trigger property_keys_set_updated_at
before update on public.property_keys
for each row execute function public.set_updated_at_timestamp();

drop trigger if exists property_resources_set_updated_at on public.property_resources;
create trigger property_resources_set_updated_at
before update on public.property_resources
for each row execute function public.set_updated_at_timestamp();

insert into public.property_keys (property_id, label, pickup_address, sort_order)
select
  p.id,
  'Key 1',
  p.key_pickup_address,
  0
from public.properties p
where coalesce(p.has_key, false) = true
  and not exists (
    select 1
    from public.property_keys pk
    where pk.property_id = p.id
  );

insert into public.property_resources (property_id, title, resource_type, url, sort_order)
select p.id, 'Link 1', 'link', p.link_1, 0
from public.properties p
where p.link_1 is not null
  and btrim(p.link_1) <> ''
  and not exists (
    select 1
    from public.property_resources pr
    where pr.property_id = p.id
      and pr.url = p.link_1
  );

insert into public.property_resources (property_id, title, resource_type, url, sort_order)
select p.id, 'Link 2', 'link', p.link_2, 1
from public.properties p
where p.link_2 is not null
  and btrim(p.link_2) <> ''
  and not exists (
    select 1
    from public.property_resources pr
    where pr.property_id = p.id
      and pr.url = p.link_2
  );

update public.properties p
set has_keys = exists (
      select 1 from public.property_keys pk where pk.property_id = p.id
    ),
    key_count = (
      select count(*)::integer from public.property_keys pk where pk.property_id = p.id
    );

alter table public.property_keys enable row level security;
alter table public.property_resources enable row level security;

drop policy if exists "property_keys_select_authenticated" on public.property_keys;
create policy "property_keys_select_authenticated"
  on public.property_keys
  for select
  to authenticated
  using (true);

drop policy if exists "property_keys_insert_authenticated" on public.property_keys;
create policy "property_keys_insert_authenticated"
  on public.property_keys
  for insert
  to authenticated
  with check (true);

drop policy if exists "property_keys_update_authenticated" on public.property_keys;
create policy "property_keys_update_authenticated"
  on public.property_keys
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "property_keys_delete_authenticated" on public.property_keys;
create policy "property_keys_delete_authenticated"
  on public.property_keys
  for delete
  to authenticated
  using (true);

drop policy if exists "property_resources_select_authenticated" on public.property_resources;
create policy "property_resources_select_authenticated"
  on public.property_resources
  for select
  to authenticated
  using (true);

drop policy if exists "property_resources_insert_authenticated" on public.property_resources;
create policy "property_resources_insert_authenticated"
  on public.property_resources
  for insert
  to authenticated
  with check (true);

drop policy if exists "property_resources_update_authenticated" on public.property_resources;
create policy "property_resources_update_authenticated"
  on public.property_resources
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "property_resources_delete_authenticated" on public.property_resources;
create policy "property_resources_delete_authenticated"
  on public.property_resources
  for delete
  to authenticated
  using (true);