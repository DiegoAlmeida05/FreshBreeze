-- Worker Timesheet: Add extra time block fields and saved timestamp
-- Implements: Main worked time + Extra block 1 (calculated) + Extra block 2 (manual)

ALTER TABLE worker_timesheet_entries ADD COLUMN IF NOT EXISTS extra_start_time time;
ALTER TABLE worker_timesheet_entries ADD COLUMN IF NOT EXISTS extra_end_time time;
ALTER TABLE worker_timesheet_entries ADD COLUMN IF NOT EXISTS extra2_minutes integer not null default 0;
ALTER TABLE worker_timesheet_entries ADD COLUMN IF NOT EXISTS saved_at timestamptz;
ALTER TABLE worker_timesheet_entries ADD COLUMN IF NOT EXISTS saved_by_profile_id uuid;

-- Constraint: extra2_minutes cannot be negative
ALTER TABLE worker_timesheet_entries ADD CONSTRAINT check_extra2_minutes_non_negative
  CHECK (extra2_minutes >= 0) NOT VALID;

-- Foreign key for saved_by_profile_id (optional - for audit trail)
ALTER TABLE worker_timesheet_entries ADD CONSTRAINT fk_saved_by_profile
  FOREIGN KEY (saved_by_profile_id) REFERENCES auth.users(id) ON DELETE SET NULL NOT VALID;

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_worker_timesheet_saved_at
  ON worker_timesheet_entries(employee_id, saved_at DESC);

-- Add comment to explain the time calculation
COMMENT ON COLUMN worker_timesheet_entries.extra_start_time IS 'Start time for extra work block 1 (optional)';
COMMENT ON COLUMN worker_timesheet_entries.extra_end_time IS 'End time for extra work block 1 (optional)';
COMMENT ON COLUMN worker_timesheet_entries.extra2_minutes IS 'Manual extra work time block 2 in minutes (default 0)';
COMMENT ON COLUMN worker_timesheet_entries.saved_at IS 'Timestamp when entry was last saved';
COMMENT ON COLUMN worker_timesheet_entries.saved_by_profile_id IS 'Profile ID of user who saved this entry (optional audit trail)';
