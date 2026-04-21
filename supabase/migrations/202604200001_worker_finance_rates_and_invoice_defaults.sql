-- Worker finance updates:
-- 1) Timesheet rates: weekday/sunday/holiday overrides in worker_profiles.
-- 2) Invoice defaults: one default recipient + default email subject/body for worker invoice flow.
-- 3) Historical rate type support: allow 'sunday' in worker_timesheet_entries.applied_rate_type.

alter table if exists public.worker_profiles
  add column if not exists hourly_rate_sunday_override numeric,
  add column if not exists default_recipient_name text,
  add column if not exists default_recipient_email text,
  add column if not exists default_recipient_phone text,
  add column if not exists default_email_subject text,
  add column if not exists default_email_body text;

update public.worker_profiles
set
  hourly_rate_sunday_override = coalesce(hourly_rate_sunday_override, hourly_rate_weekday_override, 0),
  default_recipient_name = coalesce(default_recipient_name, legal_name, ''),
  default_recipient_email = coalesce(default_recipient_email, invoice_email, ''),
  default_recipient_phone = coalesce(default_recipient_phone, invoice_phone, ''),
  default_email_subject = coalesce(default_email_subject, ''),
  default_email_body = coalesce(default_email_body, '')
where
  hourly_rate_sunday_override is null
  or default_recipient_name is null
  or default_recipient_email is null
  or default_recipient_phone is null
  or default_email_subject is null
  or default_email_body is null;

alter table if exists public.worker_profiles
  alter column hourly_rate_sunday_override set default 0;

-- If a strict check constraint exists for applied_rate_type, recreate it including 'sunday'.
do $$
begin
  if exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'worker_timesheet_entries'
      and c.conname = 'worker_timesheet_entries_applied_rate_type_check'
  ) then
    alter table public.worker_timesheet_entries
      drop constraint worker_timesheet_entries_applied_rate_type_check;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'worker_timesheet_entries'
      and column_name = 'applied_rate_type'
  ) then
    alter table public.worker_timesheet_entries
      add constraint worker_timesheet_entries_applied_rate_type_check
      check (applied_rate_type is null or applied_rate_type in ('weekday', 'sunday', 'holiday'));
  end if;
end $$;
