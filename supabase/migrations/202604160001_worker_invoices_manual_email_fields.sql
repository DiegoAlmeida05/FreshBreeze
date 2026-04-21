-- Worker invoice manual email flow fields.
-- Safe migration: only adds missing columns used by weekly persistence UI.
alter table if exists public.worker_invoices
  add column if not exists recipient_name text,
  add column if not exists recipient_phone text,
  add column if not exists email_body text,
  add column if not exists notes text;
