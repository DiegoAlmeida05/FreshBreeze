-- Pricing sets are UX-only templates that expand into pricing_items.
-- They must never be used directly in calculations or stored in pricing rows.

CREATE TABLE IF NOT EXISTS pricing_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('linen', 'amenities')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pricing_sets_name_category_unique
  ON pricing_sets ((lower(btrim(name))), category);

CREATE INDEX IF NOT EXISTS idx_pricing_sets_category_active
  ON pricing_sets (category, active, name);

CREATE TABLE IF NOT EXISTS pricing_set_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id uuid NOT NULL REFERENCES pricing_sets(id) ON DELETE CASCADE,
  pricing_item_id uuid NOT NULL REFERENCES pricing_items(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  CONSTRAINT pricing_set_items_unique UNIQUE (set_id, pricing_item_id)
);

CREATE INDEX IF NOT EXISTS idx_pricing_set_items_set_id
  ON pricing_set_items (set_id);

CREATE INDEX IF NOT EXISTS idx_pricing_set_items_pricing_item_id
  ON pricing_set_items (pricing_item_id);

COMMENT ON TABLE pricing_sets IS 'UX helper templates that expand into pricing_items for property and task forms.';
COMMENT ON TABLE pricing_set_items IS 'Expanded pricing_items and quantities belonging to a pricing set.';