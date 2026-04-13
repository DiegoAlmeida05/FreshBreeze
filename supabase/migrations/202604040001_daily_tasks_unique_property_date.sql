-- Enforce that the same property cannot have more than one task on the same date.
-- This constraint is the database-level guarantee backing the frontend validation.
alter table public.daily_tasks
  add constraint daily_tasks_property_id_date_key unique (property_id, date);
