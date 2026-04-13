alter table public.properties
  add column if not exists link_1 text;

alter table public.properties
  add column if not exists link_2 text;
