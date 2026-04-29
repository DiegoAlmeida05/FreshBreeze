-- Add property-level extra pricing and task-level extra quantities.
-- Property default extras remain operational defaults and are not used for billing.

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS linen_combo_extra_price numeric(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amenities_combo_extra_price numeric(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS linen_queen_extra_price numeric(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS linen_single_extra_price numeric(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS linen_king_extra_price numeric(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS towel_extra_price numeric(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS chocolate_extra_price numeric(10, 2) NOT NULL DEFAULT 0;

ALTER TABLE daily_tasks
  ADD COLUMN IF NOT EXISTS extra_linen_combo_qty integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS extra_amenities_combo_qty integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS extra_linen_queen_qty integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS extra_linen_single_qty integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS extra_linen_king_qty integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS extra_towel_qty integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS extra_chocolate_qty integer NOT NULL DEFAULT 0;