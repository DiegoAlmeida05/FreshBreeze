-- Item-based pricing transition schema.
-- Keeps combo tables intact during migration while introducing the active pricing model.

CREATE TABLE IF NOT EXISTS pricing_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('linen', 'amenities')),
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pricing_items_name_category_unique
  ON pricing_items ((lower(btrim(name))), category);

CREATE INDEX IF NOT EXISTS idx_pricing_items_category_active_sort
  ON pricing_items (category, active, sort_order, name);

CREATE TABLE IF NOT EXISTS property_pricing_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  pricing_item_id uuid NOT NULL REFERENCES pricing_items(id) ON DELETE RESTRICT,
  scope text NOT NULL CHECK (scope IN ('base', 'default_extra')),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT property_pricing_items_unique_scope UNIQUE (property_id, pricing_item_id, scope)
);

CREATE INDEX IF NOT EXISTS idx_property_pricing_items_property_id
  ON property_pricing_items (property_id);

CREATE INDEX IF NOT EXISTS idx_property_pricing_items_pricing_item_id
  ON property_pricing_items (pricing_item_id);

CREATE INDEX IF NOT EXISTS idx_property_pricing_items_scope
  ON property_pricing_items (scope);

CREATE TABLE IF NOT EXISTS daily_task_extra_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_task_id uuid NOT NULL REFERENCES daily_tasks(id) ON DELETE CASCADE,
  pricing_item_id uuid NOT NULL REFERENCES pricing_items(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  note text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_task_extra_items_task_id
  ON daily_task_extra_items (daily_task_id);

CREATE INDEX IF NOT EXISTS idx_daily_task_extra_items_pricing_item_id
  ON daily_task_extra_items (pricing_item_id);

ALTER TABLE public.team_time_entry_tasks_admin_published
  ADD COLUMN IF NOT EXISTS normal_time_amount_snapshot numeric(10,2),
  ADD COLUMN IF NOT EXISTS extra_time_amount_snapshot numeric(10,2),
  ADD COLUMN IF NOT EXISTS linen_amount_snapshot numeric(10,2),
  ADD COLUMN IF NOT EXISTS amenities_amount_snapshot numeric(10,2),
  ADD COLUMN IF NOT EXISTS total_amount_snapshot numeric(10,2),
  ADD COLUMN IF NOT EXISTS pricing_items_snapshot jsonb;

COMMENT ON TABLE pricing_items IS 'Active item-based pricing catalog used by admin property/task pricing flows.';
COMMENT ON TABLE property_pricing_items IS 'Item assignments per property, separated into base and default_extra scopes.';
COMMENT ON TABLE daily_task_extra_items IS 'Task-specific extra pricing items for one-off charges.';
COMMENT ON COLUMN public.team_time_entry_tasks_admin_published.pricing_items_snapshot IS 'Published invoice pricing snapshot for historical stability.';