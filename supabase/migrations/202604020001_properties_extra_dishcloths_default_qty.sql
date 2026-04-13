-- Add extra dishcloth defaults to properties
-- Used as a per-property baseline in task and schedule cards

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS extra_dishcloths_default_qty integer NOT NULL DEFAULT 0;
