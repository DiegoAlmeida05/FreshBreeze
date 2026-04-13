alter table public.property_reports
  add column if not exists report_date date;

update public.property_reports as pr
set report_date = coalesce(
  pr.report_date,
  (
    select dt.date
    from public.daily_tasks as dt
    where dt.id = pr.daily_task_id
    limit 1
  ),
  timezone('utc', pr.created_at)::date,
  current_date
);

alter table public.property_reports
  alter column report_date set default current_date,
  alter column report_date set not null;

create index if not exists property_reports_report_date_idx
  on public.property_reports (report_date desc);