-- Combo Catalog System
-- Replaces old property-level extra pricing with a catalog-driven combo model.
-- Existing columns (linen_combo_extra_price, etc.) are NOT removed.

-- ─── combo_catalog ────────────────────────────────────────────────────────────
-- Central pricing catalog. Admin manages combos here.
CREATE TABLE IF NOT EXISTS combo_catalog (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  category    text        NOT NULL CHECK (category IN ('linen', 'amenities')),
  description text        NOT NULL DEFAULT '',
  combo_price numeric(10,2) NOT NULL DEFAULT 0,
  active      boolean     NOT NULL DEFAULT true,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── combo_catalog_items ──────────────────────────────────────────────────────
-- Visual composition of a combo (admin reference only, not used in calculations).
CREATE TABLE IF NOT EXISTS combo_catalog_items (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id   uuid        NOT NULL REFERENCES combo_catalog(id) ON DELETE CASCADE,
  item_name  text        NOT NULL,
  quantity   numeric(10,2) NOT NULL DEFAULT 1,
  unit_label text        NOT NULL DEFAULT '',
  sort_order integer     NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── property_combos ──────────────────────────────────────────────────────────
-- Combos assigned to a property.
-- scope = 'base'          → included in every clean
-- scope = 'default_extra' → recurring extras charged on top
CREATE TABLE IF NOT EXISTS property_combos (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid    NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  combo_id    uuid    NOT NULL REFERENCES combo_catalog(id) ON DELETE CASCADE,
  scope       text    NOT NULL CHECK (scope IN ('base', 'default_extra')),
  quantity    integer NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── daily_task_extra_combos ──────────────────────────────────────────────────
-- Extra combos selected for a specific task (one-off additions).
CREATE TABLE IF NOT EXISTS daily_task_extra_combos (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_task_id uuid    NOT NULL REFERENCES daily_tasks(id) ON DELETE CASCADE,
  combo_id      uuid    NOT NULL REFERENCES combo_catalog(id) ON DELETE CASCADE,
  quantity      integer NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── Alter properties ─────────────────────────────────────────────────────────
-- Pack fees are added ONCE per group (never multiplied by quantity).
-- includes_amenities = false → all amenities combos + amenities_pack_fee ignored.
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS linen_pack_fee      numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amenities_pack_fee  numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS includes_amenities  boolean       NOT NULL DEFAULT true;

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_combo_catalog_items_combo_id        ON combo_catalog_items(combo_id);
CREATE INDEX IF NOT EXISTS idx_property_combos_property_id         ON property_combos(property_id);
CREATE INDEX IF NOT EXISTS idx_property_combos_combo_id            ON property_combos(combo_id);
CREATE INDEX IF NOT EXISTS idx_daily_task_extra_combos_task_id     ON daily_task_extra_combos(daily_task_id);
CREATE INDEX IF NOT EXISTS idx_daily_task_extra_combos_combo_id    ON daily_task_extra_combos(combo_id);

-- ─── Pre-seed combo catalog ───────────────────────────────────────────────────
-- Insert only if a combo with the same name + category does not already exist.
INSERT INTO combo_catalog (name, category, description, combo_price, active, sort_order)
SELECT v.name, v.category, v.description, v.combo_price::numeric(10,2), v.active, v.sort_order
FROM (VALUES
  ('Queen set',               'linen',     'Full linen set for a queen bed',       '0.00', true, 1),
  ('Single set',              'linen',     'Full linen set for a single bed',      '0.00', true, 2),
  ('King set',                'linen',     'Full linen set for a king bed',        '0.00', true, 3),
  ('Extra towel set',         'linen',     'Extra bath towels',                    '0.00', true, 4),
  ('Bathroom amenities',      'amenities', 'Full bathroom amenities pack',         '0.00', true, 5),
  ('Half bathroom amenities', 'amenities', 'Half bathroom amenities pack',         '0.00', true, 6),
  ('Kitchen amenities',       'amenities', 'Kitchen amenities pack',              '0.00', true, 7)
) AS v(name, category, description, combo_price, active, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM combo_catalog c
  WHERE c.name = v.name AND c.category = v.category
);
