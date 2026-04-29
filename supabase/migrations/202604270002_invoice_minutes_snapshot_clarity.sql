-- Clarify published invoice minute snapshots for default-baseline billing.
-- Keeps existing columns and adds explicit fields for normal/extra minute composition.

ALTER TABLE public.team_time_entry_tasks_admin_published
  ADD COLUMN IF NOT EXISTS default_minutes_snapshot integer,
  ADD COLUMN IF NOT EXISTS invoice_normal_minutes_snapshot integer,
  ADD COLUMN IF NOT EXISTS invoice_extra_minutes_snapshot integer;

COMMENT ON COLUMN public.team_time_entry_tasks_admin_published.default_minutes_snapshot
  IS 'Property default cleaning minutes snapshot used as client normal-time baseline.';

COMMENT ON COLUMN public.team_time_entry_tasks_admin_published.invoice_normal_minutes_snapshot
  IS 'Client normal billable minutes snapshot (baseline, usually equals default_minutes_snapshot).';

COMMENT ON COLUMN public.team_time_entry_tasks_admin_published.invoice_extra_minutes_snapshot
  IS 'Client extra billable minutes snapshot = max(actual_minutes_snapshot - default_minutes_snapshot, 0).';
