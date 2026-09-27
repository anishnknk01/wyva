-- ============================================================
-- Add exact-location columns to tasks
-- Paste into Supabase SQL Editor and click Run.
--
-- These are ADDITIVE — existing columns (area, location_note,
-- location_coordinates) are untouched, so nothing that already
-- reads/writes tasks breaks. location_coordinates already stores
-- {lat, lng}; this migration adds a human-readable name + the full
-- formatted address returned by the map picker's reverse geocode,
-- so the exact pin location can be shown without relying only on
-- the freeform "area" text entered earlier in the wizard.
-- ============================================================

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS location_name text,
  ADD COLUMN IF NOT EXISTS location_address text;

-- photos column already exists from ADD_PHOTOS_COLUMN.sql — kept here
-- as a no-op safeguard in case that migration wasn't run on this DB.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS photos text[];

-- location_coordinates already exists as jsonb from ADD_PHOTOS_COLUMN.sql
-- flow — kept here as a no-op safeguard for the same reason.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS location_coordinates jsonb;

SELECT 'Exact location columns added successfully!' as result;
