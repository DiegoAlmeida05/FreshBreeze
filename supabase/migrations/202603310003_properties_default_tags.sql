-- Add default_tags column to properties table
-- These tags will be pre-selected when creating a daily task for the property

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS default_tags text[] NOT NULL DEFAULT '{}';
