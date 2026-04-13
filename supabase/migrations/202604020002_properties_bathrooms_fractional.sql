-- Support fractional bathroom values (e.g. 1.5, 2.5)

ALTER TABLE properties
  ALTER COLUMN bathrooms TYPE numeric(3,1)
  USING bathrooms::numeric(3,1);
