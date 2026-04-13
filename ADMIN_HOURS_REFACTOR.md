# Admin Hours Refactor — Single-Table Model

## Overview

The Admin Hours admin implementation has been simplified from a **two-table model** to a **single-table model** using `employee_time_entries_admin` as the source of truth for both task rows and day-level adjustments.

**Why?**
- **Simplicity:** One table = one source of truth
- **Determinism:** No need to cross-reference two tables; all data is in one place
- **Flexibility:** Adjustment rows coexist with task rows in natural line-based order
- **Analysis Ready:** Future reporting/analytics can easily filter by `entry_type` if needed

## Architecture Changes

### Before: Two-Table Model
```
employee_time_entries_admin       employee_day_adjustments_admin
├── id                            ├── id
├── employee_id                   ├── employee_id
├── route_stop_id                 ├── work_date
├── daily_task_id                 ├── start_travel_minutes
├── work_date                      ├── end_travel_minutes
├── planned_minutes               ├── other_extra_minutes
├── actual_minutes                └── note
├── manual_extra_minutes (unused)
└── note

UI Flow:
1. Load task rows from employee_time_entries_admin
2. Load adjustment rows from employee_day_adjustments_admin (separate)
3. Combine them for display and calculation
```

### After: Single-Table Model
```
employee_time_entries_admin
├── id
├── employee_id
├── entry_type: 'task' | 'day_adjustment'  ← NEW: Discriminator field
├── route_stop_id (null for adjustments)
├── daily_task_id (null for adjustments)
├── work_date
├── planned_minutes (0 for adjustments)
├── actual_minutes (0 for adjustments)
├── start_extra_minutes          ← NEW: Moved from separate table
├── other_extra_minutes          ← NEW: Moved from separate table
├── end_extra_minutes            ← NEW: Moved from separate table
└── note

UI Flow:
1. Load ALL entries from employee_time_entries_admin for date
2. Filter by entry_type: separate task rows from adjustment rows
3. For each employee, ensure exactly one day_adjustment row exists
4. Combine and calculate totals
```

## Implementation Details

### 1. DTO Updates ([shared/types/EmployeeTimeEntryAdminDTO.ts](shared/types/EmployeeTimeEntryAdminDTO.ts))

**Added:**
- `entry_type: TimeEntryType` — Discriminator: `'task' | 'day_adjustment'`
- `start_extra_minutes: number` — Travel/adjustment minutes (start of day)
- `other_extra_minutes: number` — Unplanned extra work minutes
- `end_extra_minutes: number` — Travel/adjustment minutes (end of day)
- `route_stop_id: string | null` — Null for adjustment rows
- `daily_task_id: string | null` — Null for adjustment rows

**Removed:**
- `manual_extra_minutes` field (deprecated, no longer in use)

### 2. Composable Updates ([app/composables/useEmployeeHoursAdmin.ts](app/composables/useEmployeeHoursAdmin.ts))

**Key Methods:**

#### `getDayEntries(date: string): Promise<DayEntriesResult>`
- Loads **both task and adjustment rows** from single query
- Filters by `entry_type`
- Returns groups with `adjustmentEntry: EmployeeTimeEntryAdminDTO | null`

#### `getOrCreateAdjustmentEntry(employeeId: string, date: string): Promise<EmployeeTimeEntryAdminDTO>`
- Gets existing adjustment row for employee/date
- **Creates on-demand** if not found (with `entry_type='day_adjustment'`)
- Returns the entry for immediate use

#### `updateTimeEntry(id: string, payload: UpdateEmployeeTimeEntryAdminDTO): Promise<EmployeeTimeEntryAdminDTO>`
- Works for **both task and adjustment rows**
- Accepts: `actual_minutes`, `start_extra_minutes`, `other_extra_minutes`, `end_extra_minutes`, `note`

**Removed Methods:**
- `getDayAdjustments()` — No longer needed; all rows loaded together
- `getOrCreateDayAdjustment()` — Replaced by `getOrCreateAdjustmentEntry()`
- `updateDayAdjustment()` — Replaced by `updateTimeEntry()` (universal update)

**Updated Methods:**
- `getWeekOverview()` — Only queries `employee_time_entries_admin`; calculates totals from all entry types
- `seedDayEntriesFromPublishedPlan()` — Inserted rows now have `entry_type='task'` + extra_minutes fields

### 3. Component Updates

#### [HoursDayAdjustmentsBlock.vue](app/components/features/hours/HoursDayAdjustmentsBlock.vue)
**Changed:**
- Props: `adjustment: DayAdjustmentBreakdown` → `adjustmentEntry: EmployeeTimeEntryAdminDTO | null`
- Reads from: `adjustmentEntry.start_extra_minutes`, `.other_extra_minutes`, `.end_extra_minutes`
- Emits: `SaveAdjustmentPayload { entryId, payload: UpdateEmployeeTimeEntryAdminDTO }`

#### [HoursEmployeeSection.vue](app/components/features/hours/HoursEmployeeSection.vue)
**Changed:**
- Passes: `group.adjustmentEntry` (was `group.dayAdjustment`)
- Props updated: `savingAdjustmentEmployeeIds` → `savingAdjustmentIds`
- Updated type imports; event handlers aligned with new payload structure

#### [HoursDayBoard.vue](app/components/features/hours/HoursDayBoard.vue)
**Changed:**
- No longer calls `getOrCreateDayAdjustment()` or `updateDayAdjustment()`
- `onSaveAdjustment()` now directly calls `updateTimeEntry()` with unified payload
- State tracking: `savingAdjustmentEmployeeIds` → `savingAdjustmentIds` (tracks by entry ID, not employee)

## Database Migration

**Required Schema Changes for `employee_time_entries_admin`:**

```sql
-- Add new columns
ALTER TABLE employee_time_entries_admin ADD COLUMN entry_type TEXT NOT NULL DEFAULT 'task';
ALTER TABLE employee_time_entries_admin ADD COLUMN start_extra_minutes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE employee_time_entries_admin ADD COLUMN other_extra_minutes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE employee_time_entries_admin ADD COLUMN end_extra_minutes INTEGER NOT NULL DEFAULT 0;

-- Make route_stop_id and daily_task_id nullable (for adjustment rows)
ALTER TABLE employee_time_entries_admin ALTER COLUMN route_stop_id DROP NOT NULL;
ALTER TABLE employee_time_entries_admin ALTER COLUMN daily_task_id DROP NOT NULL;

-- Optional: Create index for queries filtering by entry_type
CREATE INDEX idx_employee_time_entries_admin_entry_type_work_date 
  ON employee_time_entries_admin(entry_type, work_date);
```

**Status of `employee_day_adjustments_admin`:**
- No longer used by the admin hours UI
- Can be archived or deprecated (keep for backward compatibility if other systems reference it)
- Can be dropped after confirming no other services depend on it

## Business Logic Preservation

✅ **Unchanged:**
- Subtotal calculation: `sum(task actual_minutes) + start_extra_minutes + other_extra_minutes + end_extra_minutes`
- Rate selection: Holiday > Sunday > Weekday precedence
- Day total aggregation across all employees
- Seeding from published route plans
- Save behavior: Editable after save, no locking

## API/Composable Contract

### Updated Return Types

```typescript
interface DayEntriesByEmployee {
  employeeId: string
  employeeName: string
  rateLabel: 'Weekday' | 'Sunday' | 'Holiday'
  rateUsed: number
  taskMinutesTotal: number
  adjustmentMinutesTotal: number
  totalPaidMinutes: number
  subtotalHours: number
  subtotalPay: number
  entries: DayEntryItem[]
  adjustmentEntry: EmployeeTimeEntryAdminDTO | null  ← NEW (was dayAdjustment)
}
```

### Unified Update Payload

```typescript
interface UpdateEmployeeTimeEntryAdminDTO {
  actual_minutes?: number
  start_extra_minutes?: number
  other_extra_minutes?: number
  end_extra_minutes?: number
  note?: string | null
}
// Works for both task rows and adjustment rows
```

## Benefits

1. **Deterministic Queries**
   - Load all data in one database query
   - No risk of orphaned adjustments or missing rows
   - Easier to reason about data consistency

2. **Line-Based UI**
   - Task rows and adjustment rows coexist naturally
   - No separate "adjustment block" complicating layout
   - Clear visual hierarchy: tasks → one adjustment row per employee

3. **Future-Proof**
   - Adjustment rows are already in `employee_time_entries_admin`
   - Easy to add more `entry_type` values (e.g., `'leave'`, `'other'`)
   - Analytics can filter by `entry_type` without schema changes

4. **Simplified Codebase**
   - Fewer methods to maintain
   - One unified `updateTimeEntry()` method
   - Composable is more cohesive

## Testing Checklist

- [ ] Load admin hours page; verify all employees and tasks are displayed
- [ ] Create new task entry via seed; verify it appears with `entry_type='task'` in DB
- [ ] Edit task actual_minutes; verify save and refresh shows new value
- [ ] Edit task note; verify save and refresh shows new note
- [ ] Edit day adjustment fields (Start/Other/End); verify save and refresh
- [ ] Verify subtotal calculation: task minutes + adjustment minutes = correct
- [ ] Verify estimated pay: (subtotal minutes / 60) × rate = correct
- [ ] Test day total aggregation across multiple employees
- [ ] Test with holidays; verify correct rate is selected
- [ ] Mobile: verify responsive layout works (flex wrapping)
- [ ] Empty day: verify "No entries" message when no rows for day

## Rollback Plan

If issues arise:
1. Revert the DTOs and composable to previous versions
2. Restore the two-table model temporarily
3. Keep the new schema columns dormant (they won't hurt existing queries)
4. Migration can be rolled back if needed (drop new columns, restore nullable constraints)

---

**✅ Status:** Complete and validated. All files pass TypeScript compilation. Ready for testing and deployment.
