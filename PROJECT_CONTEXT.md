# PROJECT CONTEXT

## 1. Project Overview
FreshBreeze App is an operations platform for short-term rental cleaning workflows.
It supports planning, scheduling, execution, hours tracking, and incident/property reports for admin and worker roles.

Primary operational flow:
1. Daily tasks are created/updated.
2. Route planner groups tasks into teams and publishes a route plan.
3. Worker/admin schedule consumes only published plans.
4. Team hours are recorded per task and summarized per employee/day for payroll.
5. Property reports capture operational issues and follow-up lifecycle.

## 2. Stack
- Framework: Nuxt 4 + Vue 3 + TypeScript
- Styling: Tailwind CSS
- Backend: Supabase (Postgres + Auth)
- State style: composables-first domain logic
- Build/runtime: Node.js, npm scripts via Nuxt CLI
- PDF export (hours report): html2canvas + jsPDF

## 3. Architecture Rules
Core conventions used in this codebase:
- UI components remain focused on presentation and user interaction.
- Domain/data logic belongs in app/composables.
- Supabase access is encapsulated in composables.
- Shared types live in shared/types.
- TypeScript explicit typing is preferred, avoid any.
- Layering pattern: UI -> composables -> Supabase tables.
- For route/hour domains, keep date-driven workflows deterministic.

## 4. Main Modules
- Authentication and profile: app/composables/useAuth.ts
- Daily tasks: app/composables/useDailyTasks.ts
- Route planning: app/composables/useRoutePlans.ts + app/pages/admin/routeplanner.vue
- Team/worker schedule: app/composables/useWorkerSchedule.ts + app/components/features/schedule/ScheduleBoard.vue
- Team hours entry: app/composables/useTeamHoursAdmin.ts + app/pages/admin/hours.vue
- Hours summary/payroll view: app/composables/useHoursSummary.ts + app/pages/admin/hours-summary.vue
- Hours report preview/PDF: app/composables/useHoursReport.ts + app/pages/admin/hours-report.vue
- Property reports: app/composables/usePropertyReports.ts + app/pages/admin/reports.vue

## 5. Business Rules
- Route plans are date-based and status-based (draft, published, stale).
- Schedule visibility is based on published plans only.
- Worker sees only groups where employee is assigned.
- Daily task changes can mark published route plans as stale.
- Hours/payroll summary is employee/day based and uses rate type precedence:
  holiday > sunday > weekday.
- Team hours are task-level actual minutes; payroll totals include day adjustments.

## 6. Hours Architecture
### 6.1 Source of truth
- Team operational hours table: team_time_entry_tasks_admin
- Employee/day adjustments table: employee_hours_summary_adjustments_admin
- Group membership table: route_group_members
- Holiday source via useHolidays composable

### 6.2 Admin Hours page behavior
Implemented in useTeamHoursAdmin:
- Seeds missing task-level rows from published route plan for selected day.
- Stores planned_minutes and actual_minutes per route stop/daily task.
- Saves day changes using upsert-like create/update flow per task row.
- Weekly overview totals sum actual_minutes by date.

### 6.3 Hours Summary behavior
Implemented in useHoursSummary:
- Reads actual_minutes from team_time_entry_tasks_admin.
- Maps team minutes to employees through route_group_members.
- Adds employee adjustments from employee_hours_summary_adjustments_admin.
- Produces day-level and employee-level totals (minutes, hours, pay).
- Includes adjustment-only employee/day rows when no team rows exist.

### 6.4 Hours report behavior
Implemented in useHoursReport + HoursReportPreview:
- Reuses useHoursSummary to avoid duplicating payroll calculations.
- Produces per-employee report rows by day: Date, Job hours, Rate/Job, Total.
- Supports on-screen preview first, then PDF export from the preview node.

## 7. Reports Rules
Property reports domain (usePropertyReports):
- Table: property_reports
- Status lifecycle: open <-> resolved
- Admin has full management rights.
- Non-admin users can manage only reports they created.
- List filters include status, property, client, date range, and text search.
- Report descriptions prefer Portuguese field fallback behavior where needed.

## 8. Schedule Rules
Schedule domain (useWorkerSchedule + ScheduleBoard):
- Uses route_plans where status is published for selected date.
- Admin mode supports group filter (all or specific team label).
- Worker mode restricts groups to memberships from route_group_members.
- Schedule joins route_stops -> daily_tasks -> properties -> clients.
- Empty states differ for admin vs worker context.

## 9. Route Planner Rules
Route planner behavior (admin routeplanner + useRoutePlans):
- Date-scoped board with unassigned tasks and multiple teams.
- Team has label, start time, assigned employees, ordered tasks.
- Prevents same employee being assigned to multiple teams simultaneously in UI.
- Save Draft and Publish both replace plan snapshot for the date.
- Existing plan replacement deletes previous groups/members/stops for that date and re-inserts new snapshot.
- On load, persisted plan is reconciled with current daily tasks.
- If persisted published plan diverges from current tasks, plan is marked stale.

Compatibility decision currently in use:
- route_groups read supports both label and group_label.
- route_groups insert attempts both columns to support mixed schemas.

## 10. Daily Tasks Rules
Daily tasks (useDailyTasks):
- CRUD on daily_tasks with normalized tags.
- Fetch by date sorted by desired_start_time.
- create/update/delete marks published route plan(s) stale for impacted date(s).
- Overrides and extras (cleaning minutes, beds/towels/chocolates) are carried into scheduling/cards.

## 11. Current Data Model Decisions
- Team hours are task-level (team_time_entry_tasks_admin), not team aggregate rows.
- Payroll summary base_minutes derives from sum(actual_minutes) per employee/day via team membership.
- Employee day adjustments are stored separately in employee_hours_summary_adjustments_admin and merged in summary/report outputs.
- Route planning is snapshot-based per date (replace strategy on save/publish).
- Schedule consumes only published plans.
- Route group label schema compatibility is maintained for both label and group_label.

## 12. Historical Notes Merged
Useful historical context from ADMIN_HOURS_REFACTOR.md:
- The project has prior refactor history around simplifying hours models.
- That document reflects an employee_time_entries_admin single-table path for another hours flow.
- Current admin team-hours + payroll summary architecture in active use is the task-level team_time_entry_tasks_admin flow described above.

## 13. Key Files to Revisit Before Major Changes
- app/composables/useHoursSummary.ts
- app/composables/useTeamHoursAdmin.ts
- app/composables/usePropertyReports.ts
- app/composables/useRoutePlans.ts
- app/composables/useDailyTasks.ts
- app/composables/useWorkerSchedule.ts
- app/pages/admin/routeplanner.vue
- app/components/features/schedule/ScheduleBoard.vue
