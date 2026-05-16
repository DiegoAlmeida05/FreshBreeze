-- Enforce one employee per profile and avoid duplicate employee emails.
-- These constraints prevent cross-user data reflection caused by accidental link reuse.

create unique index if not exists employees_profile_id_unique_idx
  on public.employees (profile_id)
  where profile_id is not null;

create unique index if not exists employees_email_lower_unique_idx
  on public.employees (lower(email))
  where email is not null;
