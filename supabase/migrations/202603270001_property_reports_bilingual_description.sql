alter table public.property_reports
  add column if not exists description_pt text,
  add column if not exists description_en text;

update public.property_reports
set
  description_pt = coalesce(description_pt, description, ''),
  description_en = coalesce(description_en, description_pt, description, '')
where description_pt is null
   or description_en is null;

alter table public.property_reports
  alter column description_pt set default '',
  alter column description_en set default '';

alter table public.property_reports
  alter column description_pt set not null,
  alter column description_en set not null;
