-- Combo catalog item pricing support
-- Makes combo_catalog.combo_price derivable from item rows.

ALTER TABLE combo_catalog_items
  ADD COLUMN IF NOT EXISTS unit_price_excl_gst numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS line_total_excl_gst numeric(10,2) NOT NULL DEFAULT 0;

-- Keep line_total in sync with quantity * unit_price.
CREATE OR REPLACE FUNCTION combo_catalog_items_set_line_total()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.line_total_excl_gst := round((COALESCE(NEW.quantity, 0) * COALESCE(NEW.unit_price_excl_gst, 0))::numeric, 2);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_combo_catalog_items_set_line_total ON combo_catalog_items;
CREATE TRIGGER trg_combo_catalog_items_set_line_total
BEFORE INSERT OR UPDATE OF quantity, unit_price_excl_gst ON combo_catalog_items
FOR EACH ROW
EXECUTE FUNCTION combo_catalog_items_set_line_total();

-- Recalculate combo_catalog.combo_price whenever item rows change.
CREATE OR REPLACE FUNCTION refresh_combo_catalog_price(p_combo_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE combo_catalog
  SET
    combo_price = COALESCE((
      SELECT round(COALESCE(SUM(line_total_excl_gst), 0)::numeric, 2)
      FROM combo_catalog_items
      WHERE combo_id = p_combo_id
    ), 0),
    updated_at = now()
  WHERE id = p_combo_id;
END;
$$;

CREATE OR REPLACE FUNCTION combo_catalog_items_refresh_combo_price()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM refresh_combo_catalog_price(OLD.combo_id);
    RETURN OLD;
  END IF;

  PERFORM refresh_combo_catalog_price(NEW.combo_id);

  IF TG_OP = 'UPDATE' AND OLD.combo_id IS DISTINCT FROM NEW.combo_id THEN
    PERFORM refresh_combo_catalog_price(OLD.combo_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_combo_catalog_items_refresh_combo_price ON combo_catalog_items;
CREATE TRIGGER trg_combo_catalog_items_refresh_combo_price
AFTER INSERT OR UPDATE OR DELETE ON combo_catalog_items
FOR EACH ROW
EXECUTE FUNCTION combo_catalog_items_refresh_combo_price();

-- Backfill line totals for pre-existing rows.
UPDATE combo_catalog_items
SET
  line_total_excl_gst = round((COALESCE(quantity, 0) * COALESCE(unit_price_excl_gst, 0))::numeric, 2),
  updated_at = now();

-- Backfill combo totals after line totals are available.
UPDATE combo_catalog c
SET
  combo_price = COALESCE(items.total, 0),
  updated_at = now()
FROM (
  SELECT combo_id, round(COALESCE(SUM(line_total_excl_gst), 0)::numeric, 2) AS total
  FROM combo_catalog_items
  GROUP BY combo_id
) items
WHERE c.id = items.combo_id;
