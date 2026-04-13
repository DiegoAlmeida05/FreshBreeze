import { useAuth } from './useAuth'
import { useHolidays } from './useHolidays'
import { useRoutePlans } from './useRoutePlans'
import { useSupabaseClient } from './useSupabaseClient'
import type { SaveDayTeamTaskInput, TeamTimeEntryTaskAdminDTO } from '../../shared/types/TeamTimeEntryTaskAdminDTO'
import { fmtTime } from '../utils/formatTime'

const TEAM_TASKS_TABLE = 'team_time_entry_tasks_admin'
const PUBLISHED_TEAM_TASKS_TABLE = 'team_time_entry_tasks_admin_published'
const EMPLOYEE_ADJUSTMENTS_TABLE = 'employee_hours_summary_adjustments_admin'
const DEFAULT_MINUTES_FALLBACK = 0

interface TeamTimeEntryTaskRow {
  id: string
  work_date: string
  route_group_id: string
  route_stop_id: string
  daily_task_id: string
  planned_minutes: number | null
  actual_minutes: number | null
  note: string | null
  created_by_profile_id: string | null
  updated_by_profile_id: string | null
  created_at: string | null
  updated_at: string | null
}

interface PublishedTeamTimeEntryTaskRow {
  work_date: string
  employee_id: string
  route_group_id: string
  route_stop_id: string
  daily_task_id: string
  planned_minutes: number | null
  actual_minutes: number | null
  note: string | null
  published_at: string | null
}

interface EmployeeRateSnapshotRow {
  id: string
  full_name: string
  hourly_rate_weekday: number | null
  hourly_rate_sunday: number | null
  hourly_rate_holiday: number | null
}

interface EmployeeAdjustmentSnapshotRow {
  employee_id: string
  work_date: string
  start_extra_minutes: number | null
  end_extra_minutes: number | null
  other_extra_minutes: number | null
  manual_adjustment_minutes: number | null
}

interface RoutePlanRow {
  id: string
}

interface RouteGroupRow {
  id: string
  label: string | null
  sort_order: number | null
  start_time: string | null
}

interface RouteGroupMemberRow {
  route_group_id: string
  employee_id: string
}

interface RouteStopRow {
  id: string
  route_group_id: string
  daily_task_id: string
  order_index: number | null
  planned_start_time: string | null
  planned_end_time: string | null
}

interface DailyTaskInfoRow {
  id: string
  property_id: string
  guest_name: string | null
  task_type: string | null
  cleaning_minutes_override: number | null
}

interface PropertyInfoRow {
  id: string
  name: string
  default_cleaning_minutes: number | null
}

interface EmployeeRow {
  id: string
  full_name: string
}

interface SaveDayTeamHoursResult {
  updatedCount: number
  insertedCount: number
}

export type TeamHoursPublicationStatus = 'unsaved' | 'draft' | 'published'

export interface TeamHoursPublicationState {
  status: TeamHoursPublicationStatus
  lastSavedAt: string | null
  lastPublishedAt: string | null
}

export interface TeamHoursWeekDay {
  date: string
  totalMinutes: number
  totalHours: number
  isHoliday: boolean
  holidayNames: string[]
}

export interface TeamHoursTaskRow {
  entry: TeamTimeEntryTaskAdminDTO
  routeStopId: string
  dailyTaskId: string
  orderIndex: number
  taskLabel: string
  plannedStartTime: string | null
  plannedEndTime: string | null
  plannedMinutes: number
  actualMinutes: number
  diffMinutes: number
}

export interface TeamHoursDayItem {
  teamLabel: string
  routeGroupId: string
  sortOrder: number
  memberIds: string[]
  memberNames: string[]
  membersSummary: string
  startTime: string | null
  endTime: string | null
  totalPlannedMinutes: number
  totalActualMinutes: number
  totalDiffMinutes: number
  tasks: TeamHoursTaskRow[]
}

export interface TeamHoursDayResult {
  date: string
  teams: TeamHoursDayItem[]
  totalPlannedMinutes: number
  totalActualMinutes: number
  totalHours: number
  isHoliday: boolean
  holidayNames: string[]
}

export interface SeedTeamHoursResult {
  createdCount: number
  existingCount: number
}

function toIsoDate(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseIsoDate(value: string): Date {
  return new Date(`${value}T00:00:00`)
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function toSafeMinutes(value: number | null | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
    return 0
  }

  return Math.round(value)
}

function toHours(totalMinutes: number): number {
  return Number((totalMinutes / 60).toFixed(2))
}

function parsePlannedDateTime(date: string, value: string): Date | null {
  if (!value) {
    return null
  }

  if (value.includes('T')) {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const timeWithSeconds = value.length === 5 ? `${value}:00` : value
  const parsed = new Date(`${date}T${timeWithSeconds}`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function calculatePlannedMinutesFromStop(date: string, stop: RouteStopRow): number | null {
  if (!stop.planned_start_time || !stop.planned_end_time) {
    return null
  }

  const start = parsePlannedDateTime(date, stop.planned_start_time)
  const end = parsePlannedDateTime(date, stop.planned_end_time)

  if (!start || !end) {
    return null
  }

  let diffMinutes = Math.round((end.getTime() - start.getTime()) / 60000)

  if (diffMinutes < 0) {
    diffMinutes += 24 * 60
  }

  if (diffMinutes <= 0) {
    return null
  }

  return diffMinutes
}

function toTaskEntryDTO(row: TeamTimeEntryTaskRow): TeamTimeEntryTaskAdminDTO {
  return {
    id: row.id,
    work_date: row.work_date,
    route_group_id: row.route_group_id,
    route_stop_id: row.route_stop_id,
    daily_task_id: row.daily_task_id,
    planned_minutes: toSafeMinutes(row.planned_minutes),
    actual_minutes: toSafeMinutes(row.actual_minutes),
    note: row.note,
    created_by_profile_id: row.created_by_profile_id ?? '',
    updated_by_profile_id: row.updated_by_profile_id ?? '',
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
  }
}

function createEmptyTaskEntry(stop: RouteStopRow, date: string, plannedMinutes: number): TeamTimeEntryTaskAdminDTO {
  return {
    id: '',
    work_date: date,
    route_group_id: stop.route_group_id,
    route_stop_id: stop.id,
    daily_task_id: stop.daily_task_id,
    planned_minutes: plannedMinutes,
    actual_minutes: plannedMinutes,
    note: null,
    created_by_profile_id: '',
    updated_by_profile_id: '',
    created_at: '',
    updated_at: '',
  }
}

function getLatestTimestamp(rows: Array<{ updated_at: string | null; created_at: string | null }>): string | null {
  const timestamps = rows
    .flatMap((row) => [row.updated_at, row.created_at])
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => b.localeCompare(a))

  return timestamps[0] ?? null
}

function buildComparableKey(row: Pick<TeamTimeEntryTaskRow, 'route_stop_id' | 'route_group_id' | 'daily_task_id' | 'planned_minutes' | 'actual_minutes' | 'note'>): string {
  return [
    row.route_stop_id,
    row.route_group_id,
    row.daily_task_id,
    String(toSafeMinutes(row.planned_minutes)),
    String(toSafeMinutes(row.actual_minutes)),
    row.note?.trim() || '',
  ].join('::')
}

function buildComparablePublishedKey(row: PublishedTeamTimeEntryTaskRow): string {
  return [
    row.route_stop_id,
    row.route_group_id,
    row.daily_task_id,
    String(toSafeMinutes(row.planned_minutes)),
    String(toSafeMinutes(row.actual_minutes)),
    row.note?.trim() || '',
  ].join('::')
}

function rowsMatchDraftAndPublished(draftRows: TeamTimeEntryTaskRow[], publishedRows: PublishedTeamTimeEntryTaskRow[]): boolean {
  const draftKeys = [...draftRows].map(buildComparableKey).sort()
  const publishedKeys = Array.from(new Set([...publishedRows].map(buildComparablePublishedKey))).sort()

  if (draftKeys.length !== publishedKeys.length) {
    return false
  }

  return draftKeys.every((key, index) => key === publishedKeys[index])
}

function toCurrency(value: number): number {
  return Number(value.toFixed(2))
}

function isSunday(date: string): boolean {
  const parsed = new Date(`${date}T00:00:00`)

  if (Number.isNaN(parsed.getTime())) {
    return false
  }

  return parsed.getDay() === 0
}

function getSnapshotRateType(date: string, isHoliday: boolean): 'weekday' | 'sunday' | 'holiday' {
  if (isHoliday) {
    return 'holiday'
  }

  if (isSunday(date)) {
    return 'sunday'
  }

  return 'weekday'
}

function getEmployeeSnapshotRate(rateType: 'weekday' | 'sunday' | 'holiday', employee: EmployeeRateSnapshotRow | undefined): number {
  if (!employee) {
    return 0
  }

  if (rateType === 'holiday') {
    return Number(employee.hourly_rate_holiday ?? 0)
  }

  if (rateType === 'sunday') {
    return Number(employee.hourly_rate_sunday ?? 0)
  }

  return Number(employee.hourly_rate_weekday ?? 0)
}

function getLatestPublishedTimestamp(rows: Array<{ published_at: string | null }>): string | null {
  const timestamps = rows
    .map((row) => row.published_at)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => b.localeCompare(a))

  return timestamps[0] ?? null
}

function toPublishedSchemaError(error: { message?: string } | null | undefined): Error {
  const source = error?.message?.trim() || 'Unknown error'
  return new Error(`Published hours schema mismatch in ${PUBLISHED_TEAM_TASKS_TABLE}. Apply migration 202604030002_fix_team_hours_published_schema.sql. Details: ${source}`)
}

async function selectPublishedRowsByDate(
  supabase: ReturnType<typeof useSupabaseClient>,
  date: string,
): Promise<PublishedTeamTimeEntryTaskRow[]> {
  const result = await supabase
    .from(PUBLISHED_TEAM_TASKS_TABLE)
    .select('work_date, employee_id, route_group_id, route_stop_id, daily_task_id, planned_minutes, actual_minutes, note, published_at')
    .eq('work_date', date)

  if (result.error) {
    throw toPublishedSchemaError(result.error)
  }

  return (result.data ?? []) as PublishedTeamTimeEntryTaskRow[]
}

async function deletePublishedRowsByDate(
  supabase: ReturnType<typeof useSupabaseClient>,
  date: string,
): Promise<void> {
  const result = await supabase
    .from(PUBLISHED_TEAM_TASKS_TABLE)
    .delete()
    .eq('work_date', date)

  if (result.error) {
    throw toPublishedSchemaError(result.error)
  }
}

async function insertPublishedRows(
  supabase: ReturnType<typeof useSupabaseClient>,
  rows: Array<Record<string, unknown>>,
) {
  return supabase
    .from(PUBLISHED_TEAM_TASKS_TABLE)
    .insert(rows)
}

function buildTaskLabel(task: DailyTaskInfoRow | undefined, property: PropertyInfoRow | undefined): string {
  const propertyName = property?.name?.trim() || 'Task'
  return propertyName
}

async function getPreferredPlanIdForDate(supabase: ReturnType<typeof useSupabaseClient>, date: string): Promise<string | null> {
  const publishedResult = await supabase
    .from('route_plans')
    .select('id')
    .eq('date', date)
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
    .limit(1)

  if (publishedResult.error) {
    throw new Error(publishedResult.error.message)
  }

  const publishedPlan = ((publishedResult.data ?? []) as RoutePlanRow[])[0]

  if (publishedPlan?.id) {
    return publishedPlan.id
  }

  const fallbackResult = await supabase
    .from('route_plans')
    .select('id')
    .eq('date', date)
    .order('updated_at', { ascending: false })
    .limit(1)

  if (fallbackResult.error) {
    throw new Error(fallbackResult.error.message)
  }

  const fallbackPlan = ((fallbackResult.data ?? []) as RoutePlanRow[])[0]
  return fallbackPlan?.id ?? null
}

async function loadStopsForPlan(
  supabase: ReturnType<typeof useSupabaseClient>,
  planId: string,
): Promise<{ groups: RouteGroupRow[]; stops: RouteStopRow[] }> {
  const { data: groupData, error: groupError } = await supabase
    .from('route_groups')
    .select('id, label, sort_order, start_time')
    .eq('route_plan_id', planId)
    .order('sort_order', { ascending: true })

  if (groupError) {
    throw new Error(groupError.message)
  }

  const groups = (groupData ?? []) as RouteGroupRow[]

  if (groups.length === 0) {
    return { groups: [], stops: [] }
  }

  const groupIds = groups.map((group) => group.id)

  const { data: stopData, error: stopError } = await supabase
    .from('route_stops')
    .select('id, route_group_id, daily_task_id, order_index, planned_start_time, planned_end_time')
    .in('route_group_id', groupIds)
    .order('order_index', { ascending: true })

  if (stopError) {
    throw new Error(stopError.message)
  }

  return {
    groups,
    stops: (stopData ?? []) as RouteStopRow[],
  }
}

async function buildTaskAndPlannedMaps(
  supabase: ReturnType<typeof useSupabaseClient>,
  date: string,
  stops: RouteStopRow[],
): Promise<{
    taskById: Map<string, DailyTaskInfoRow>
    propertyById: Map<string, PropertyInfoRow>
    plannedByStopId: Record<string, number>
  }> {
  const taskIds = Array.from(new Set(stops.map((stop) => stop.daily_task_id)))

  const { data: taskData, error: taskError } = await supabase
    .from('daily_tasks')
    .select('id, property_id, guest_name, task_type, cleaning_minutes_override')
    .in('id', taskIds)

  if (taskError) {
    throw new Error(taskError.message)
  }

  const tasks = (taskData ?? []) as DailyTaskInfoRow[]
  const taskById = new Map(tasks.map((task) => [task.id, task]))
  const propertyIds = Array.from(new Set(tasks.map((task) => task.property_id)))

  let propertyById = new Map<string, PropertyInfoRow>()

  if (propertyIds.length > 0) {
    const { data: propertyData, error: propertyError } = await supabase
      .from('properties')
      .select('id, name, default_cleaning_minutes')
      .in('id', propertyIds)

    if (propertyError) {
      throw new Error(propertyError.message)
    }

    propertyById = new Map(
      ((propertyData ?? []) as PropertyInfoRow[]).map((property) => [property.id, property]),
    )
  }

  const plannedByStopId = stops.reduce<Record<string, number>>((acc, stop) => {
    const task = taskById.get(stop.daily_task_id)
    const property = task ? propertyById.get(task.property_id) : undefined
    const fallbackDuration = Number(task?.cleaning_minutes_override ?? property?.default_cleaning_minutes ?? DEFAULT_MINUTES_FALLBACK)
    const plannedFromStop = calculatePlannedMinutesFromStop(date, stop)
    acc[stop.id] = toSafeMinutes(plannedFromStop ?? fallbackDuration)
    return acc
  }, {})

  return {
    taskById,
    propertyById,
    plannedByStopId,
  }
}

export function useTeamHoursAdmin() {
  const supabase = useSupabaseClient()
  const auth = useAuth()
  const { getHolidaysByRange } = useHolidays()
  const { getRoutePlanByDate } = useRoutePlans()

  async function loadGroupsAndStopsForDate(date: string): Promise<{ groups: RouteGroupRow[]; stops: RouteStopRow[] }> {
    const routePlan = await getRoutePlanByDate(date)

    if (!routePlan || routePlan.groups.length === 0) {
      return { groups: [], stops: [] }
    }

    const groups: RouteGroupRow[] = routePlan.groups.map((group) => ({
      id: group.id,
      label: group.label,
      sort_order: group.sort_order,
      start_time: group.start_time,
    }))

    const stops: RouteStopRow[] = routePlan.groups.flatMap((group) =>
      group.stops.map((stop) => ({
        id: stop.id,
        route_group_id: group.id,
        daily_task_id: stop.daily_task_id,
        order_index: stop.order_index,
        planned_start_time: stop.planned_start_time,
        planned_end_time: stop.planned_end_time,
      })),
    )

    return { groups, stops }
  }

  async function seedDayTeamHoursFromPublishedPlan(date: string): Promise<SeedTeamHoursResult> {
    const { groups, stops } = await loadGroupsAndStopsForDate(date)

    if (groups.length === 0 || stops.length === 0) {
      return { createdCount: 0, existingCount: 0 }
    }

    const { plannedByStopId } = await buildTaskAndPlannedMaps(supabase, date, stops)
    const stopIds = stops.map((stop) => stop.id)

    const { data: existingRows, error: existingError } = await supabase
      .from(TEAM_TASKS_TABLE)
      .select('id, route_stop_id')
      .eq('work_date', date)
      .in('route_stop_id', stopIds)

    if (existingError) {
      throw new Error(existingError.message)
    }

    const existingByStopId = new Map(
      ((existingRows ?? []) as Array<{ id: string; route_stop_id: string }>).map((row) => [row.route_stop_id, row.id]),
    )

    const profile = await auth.getProfile()
    const missingStops = stops.filter((stop) => !existingByStopId.has(stop.id))

    if (missingStops.length === 0) {
      return {
        createdCount: 0,
        existingCount: existingByStopId.size,
      }
    }

    const insertPayload = missingStops.map((stop) => {
      const plannedMinutes = plannedByStopId[stop.id] ?? 0

      return {
        work_date: date,
        route_group_id: stop.route_group_id,
        route_stop_id: stop.id,
        daily_task_id: stop.daily_task_id,
        planned_minutes: plannedMinutes,
        actual_minutes: plannedMinutes,
        note: null,
        created_by_profile_id: profile.id,
        updated_by_profile_id: profile.id,
      }
    })

    const { error: insertError } = await supabase
      .from(TEAM_TASKS_TABLE)
      .insert(insertPayload)

    if (insertError) {
      throw new Error(insertError.message)
    }

    return {
      createdCount: insertPayload.length,
      existingCount: existingByStopId.size,
    }
  }

  async function getDayTeamHours(date: string): Promise<TeamHoursDayResult> {
    const holidays = await getHolidaysByRange(date, date)

    const holidayNames = holidays.map((holiday) => holiday.name)

    const { groups, stops } = await loadGroupsAndStopsForDate(date)

    if (groups.length === 0) {
      return {
        date,
        teams: [],
        totalPlannedMinutes: 0,
        totalActualMinutes: 0,
        totalHours: 0,
        isHoliday: holidayNames.length > 0,
        holidayNames,
      }
    }

    const groupIds = groups.map((group) => group.id)
    const { taskById, propertyById, plannedByStopId } = await buildTaskAndPlannedMaps(supabase, date, stops)

    const [memberResult, taskRowsResult] = await Promise.all([
      supabase
        .from('route_group_members')
        .select('route_group_id, employee_id')
        .in('route_group_id', groupIds),
      supabase
        .from(TEAM_TASKS_TABLE)
        .select('id, work_date, route_group_id, route_stop_id, daily_task_id, planned_minutes, actual_minutes, note, created_by_profile_id, updated_by_profile_id, created_at, updated_at')
        .eq('work_date', date)
        .in('route_group_id', groupIds),
    ])

    if (memberResult.error) {
      throw new Error(memberResult.error.message)
    }

    if (taskRowsResult.error) {
      throw new Error(taskRowsResult.error.message)
    }

    const members = (memberResult.data ?? []) as RouteGroupMemberRow[]
    const employeeIds = Array.from(new Set(members.map((member) => member.employee_id)))

    let employeeMap = new Map<string, EmployeeRow>()

    if (employeeIds.length > 0) {
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('id, full_name')
        .in('id', employeeIds)

      if (employeeError) {
        throw new Error(employeeError.message)
      }

      employeeMap = new Map(((employeeData ?? []) as EmployeeRow[]).map((employee) => [employee.id, employee]))
    }

    const membersByGroup = members.reduce<Record<string, string[]>>((acc, member) => {
      if (!acc[member.route_group_id]) {
        acc[member.route_group_id] = []
      }

      acc[member.route_group_id]?.push(member.employee_id)
      return acc
    }, {})

    const rowsByStopId = new Map(
      ((taskRowsResult.data ?? []) as TeamTimeEntryTaskRow[]).map((row) => [row.route_stop_id, toTaskEntryDTO(row)]),
    )

    const stopsByGroup = stops.reduce<Record<string, RouteStopRow[]>>((acc, stop) => {
      if (!acc[stop.route_group_id]) {
        acc[stop.route_group_id] = []
      }

      acc[stop.route_group_id]?.push(stop)
      return acc
    }, {})

    const teams = groups.map((group, index) => {
      const memberIds = Array.from(new Set(membersByGroup[group.id] ?? []))
      const memberNames = memberIds
        .map((memberId) => employeeMap.get(memberId)?.full_name ?? 'Unknown employee')
        .sort((a, b) => a.localeCompare(b))

      const groupStops = [...(stopsByGroup[group.id] ?? [])].sort((a, b) => Number(a.order_index ?? 0) - Number(b.order_index ?? 0))
      const taskRows = groupStops.map((stop, stopIndex) => {
        const plannedMinutes = plannedByStopId[stop.id] ?? 0
        const entry = rowsByStopId.get(stop.id) ?? createEmptyTaskEntry(stop, date, plannedMinutes)
        const task = taskById.get(stop.daily_task_id)
        const property = task ? propertyById.get(task.property_id) : undefined
        const actualMinutes = toSafeMinutes(entry.actual_minutes)

        return {
          entry,
          routeStopId: stop.id,
          dailyTaskId: stop.daily_task_id,
          orderIndex: Number(stop.order_index ?? stopIndex + 1),
          taskLabel: buildTaskLabel(task, property),
          plannedStartTime: fmtTime(stop.planned_start_time),
          plannedEndTime: fmtTime(stop.planned_end_time),
          plannedMinutes,
          actualMinutes,
          diffMinutes: actualMinutes - plannedMinutes,
        }
      })

      const totalPlannedMinutes = taskRows.reduce((acc, row) => acc + row.plannedMinutes, 0)
      const totalActualMinutes = taskRows.reduce((acc, row) => acc + row.actualMinutes, 0)
      const rawLabel = group.label?.trim() || String(index + 1)
      const teamLabel = /^[A-Z]$/i.test(rawLabel) ? `Team ${rawLabel}` : rawLabel

      const startTime = fmtTime(group.start_time)
      const lastStop = groupStops[groupStops.length - 1]
      const endTime = fmtTime(lastStop?.planned_end_time)

      return {
        teamLabel,
        routeGroupId: group.id,
        sortOrder: Number(group.sort_order ?? index + 1),
        memberIds,
        memberNames,
        membersSummary: memberNames.join(', '),
        startTime,
        endTime,
        totalPlannedMinutes,
        totalActualMinutes,
        totalDiffMinutes: totalActualMinutes - totalPlannedMinutes,
        tasks: taskRows,
      }
    })

    const totalPlannedMinutes = teams.reduce((acc, team) => acc + team.totalPlannedMinutes, 0)
    const totalActualMinutes = teams.reduce((acc, team) => acc + team.totalActualMinutes, 0)

    return {
      date,
      teams,
      totalPlannedMinutes,
      totalActualMinutes,
      totalHours: toHours(totalActualMinutes),
      isHoliday: holidayNames.length > 0,
      holidayNames,
    }
  }

  async function getWeekTeamHours(startDate: string): Promise<TeamHoursWeekDay[]> {
    const weekStart = parseIsoDate(startDate)
    const weekDates = Array.from({ length: 7 }, (_, index) => toIsoDate(addDays(weekStart, index)))
    const weekEnd = weekDates[6] ?? startDate

    const [entriesResult, holidays] = await Promise.all([
      supabase
        .from(TEAM_TASKS_TABLE)
        .select('work_date, actual_minutes')
        .gte('work_date', startDate)
        .lte('work_date', weekEnd),
      getHolidaysByRange(startDate, weekEnd),
    ])

    if (entriesResult.error) {
      throw new Error(entriesResult.error.message)
    }

    const totalsByDate = ((entriesResult.data ?? []) as Array<{ work_date: string; actual_minutes: number | null }>).reduce<Record<string, number>>((acc, row) => {
      acc[row.work_date] = (acc[row.work_date] ?? 0) + toSafeMinutes(row.actual_minutes)
      return acc
    }, {})

    const holidayNamesByDate = holidays.reduce<Record<string, string[]>>((acc, holiday) => {
      if (!acc[holiday.date]) {
        acc[holiday.date] = []
      }

      acc[holiday.date]?.push(holiday.name)
      return acc
    }, {})

    return weekDates.map((date) => {
      const totalMinutes = totalsByDate[date] ?? 0
      const holidayNames = holidayNamesByDate[date] ?? []

      return {
        date,
        totalMinutes,
        totalHours: toHours(totalMinutes),
        isHoliday: holidayNames.length > 0,
        holidayNames,
      }
    })
  }

  async function getDayTeamHoursPublicationState(date: string): Promise<TeamHoursPublicationState> {
    if (!date) {
      return {
        status: 'unsaved',
        lastSavedAt: null,
        lastPublishedAt: null,
      }
    }

    console.debug('[hours] checking publication state', {
      draftTable: TEAM_TASKS_TABLE,
      publishedTable: PUBLISHED_TEAM_TASKS_TABLE,
      date,
    })

    const [draftResult, publishedResult] = await Promise.all([
      supabase
        .from(TEAM_TASKS_TABLE)
        .select('id, work_date, route_group_id, route_stop_id, daily_task_id, planned_minutes, actual_minutes, note, created_by_profile_id, updated_by_profile_id, created_at, updated_at')
        .eq('work_date', date),
      selectPublishedRowsByDate(supabase, date),
    ])

    if (draftResult.error) {
      console.error('[hours] failed reading draft hours state', {
        table: TEAM_TASKS_TABLE,
        date,
        error: draftResult.error,
      })
      throw new Error(draftResult.error.message)
    }

    const draftRows = (draftResult.data ?? []) as TeamTimeEntryTaskRow[]
    const publishedRows = publishedResult
    const lastSavedAt = getLatestTimestamp(draftRows)
    const lastPublishedAt = getLatestPublishedTimestamp(publishedRows)

    if (draftRows.length === 0 && publishedRows.length === 0) {
      return {
        status: 'unsaved',
        lastSavedAt,
        lastPublishedAt,
      }
    }

    if (publishedRows.length > 0 && rowsMatchDraftAndPublished(draftRows, publishedRows)) {
      return {
        status: 'published',
        lastSavedAt,
        lastPublishedAt,
      }
    }

    return {
      status: 'draft',
      lastSavedAt,
      lastPublishedAt,
    }
  }

  async function saveDayTeamHours(date: string, rows: SaveDayTeamTaskInput[]): Promise<SaveDayTeamHoursResult> {
    if (!date) {
      throw new Error('Date is required.')
    }

    if (rows.length === 0) {
      return { updatedCount: 0, insertedCount: 0 }
    }

    const profile = await auth.getProfile()
    let updatedCount = 0
    let insertedCount = 0

    for (const row of rows) {
      const actualMinutes = toSafeMinutes(row.actual_minutes)
      const note = row.note?.trim() || null

      if (row.id) {
        const { error } = await supabase
          .from(TEAM_TASKS_TABLE)
          .update({
            actual_minutes: actualMinutes,
            note,
            updated_by_profile_id: profile.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id)

        if (error) {
          throw new Error(error.message)
        }

        updatedCount += 1
        continue
      }

      const { error } = await supabase
        .from(TEAM_TASKS_TABLE)
        .insert({
          work_date: date,
          route_group_id: row.route_group_id,
          route_stop_id: row.route_stop_id,
          daily_task_id: row.daily_task_id,
          planned_minutes: toSafeMinutes(row.planned_minutes),
          actual_minutes: actualMinutes,
          note,
          created_by_profile_id: profile.id,
          updated_by_profile_id: profile.id,
        })

      if (error) {
        throw new Error(error.message)
      }

      insertedCount += 1
    }

    return {
      updatedCount,
      insertedCount,
    }
  }

  async function publishDayTeamHours(date: string): Promise<{ publishedCount: number }> {
    if (!date) {
      throw new Error('Date is required.')
    }

    const { groups, stops } = await loadGroupsAndStopsForDate(date)

    if (groups.length === 0 || stops.length === 0) {
      throw new Error('No route plan groups found for this date. Save or publish Route Planner first.')
    }

    const validGroupIds = new Set(groups.map((group) => group.id))
    const validStopIds = new Set(stops.map((stop) => stop.id))

    console.debug('[hours] publishing hours', {
      sourceTable: TEAM_TASKS_TABLE,
      destinationTable: PUBLISHED_TEAM_TASKS_TABLE,
      date,
    })

    const { data, error } = await supabase
      .from(TEAM_TASKS_TABLE)
      .select('id, work_date, route_group_id, route_stop_id, daily_task_id, planned_minutes, actual_minutes, note, created_by_profile_id, updated_by_profile_id, created_at, updated_at')
      .eq('work_date', date)

    if (error) {
      console.error('[hours] failed loading draft hours for publish', {
        table: TEAM_TASKS_TABLE,
        date,
        error,
      })
      throw new Error(error.message)
    }

    const draftRows = (data ?? []) as TeamTimeEntryTaskRow[]

    const activeDraftRows = draftRows.filter((row) => validGroupIds.has(row.route_group_id) && validStopIds.has(row.route_stop_id))
    const staleDraftRows = draftRows.filter((row) => !validGroupIds.has(row.route_group_id) || !validStopIds.has(row.route_stop_id))

    if (staleDraftRows.length > 0) {
      const staleRowIds = staleDraftRows.map((row) => row.id)
      const { error: deleteStaleRowsError } = await supabase
        .from(TEAM_TASKS_TABLE)
        .delete()
        .in('id', staleRowIds)

      if (deleteStaleRowsError) {
        throw new Error(deleteStaleRowsError.message)
      }
    }

    if (activeDraftRows.length === 0) {
      throw new Error('No saved hours found for this date.')
    }

    const routeGroupIds = Array.from(new Set(activeDraftRows.map((row) => row.route_group_id)))
    const [membersResult, holidays, employeesResult, adjustmentsResult, routeGroupsResult] = await Promise.all([
      supabase
        .from('route_group_members')
        .select('route_group_id, employee_id')
        .in('route_group_id', routeGroupIds),
      getHolidaysByRange(date, date),
      supabase
        .from('employees')
        .select('id, full_name, hourly_rate_weekday, hourly_rate_sunday, hourly_rate_holiday'),
      supabase
        .from(EMPLOYEE_ADJUSTMENTS_TABLE)
        .select('employee_id, work_date, start_extra_minutes, end_extra_minutes, other_extra_minutes, manual_adjustment_minutes')
        .eq('work_date', date),
      supabase
        .from('route_groups')
        .select('id, label, group_label')
        .in('id', routeGroupIds),
    ])

    if (membersResult.error) {
      throw new Error(membersResult.error.message)
    }

    if (employeesResult.error) {
      throw new Error(employeesResult.error.message)
    }

    if (adjustmentsResult.error) {
      throw new Error(adjustmentsResult.error.message)
    }

    const members = (membersResult.data ?? []) as RouteGroupMemberRow[]
    const memberIdsByGroup = members.reduce<Record<string, string[]>>((acc, row) => {
      if (!acc[row.route_group_id]) {
        acc[row.route_group_id] = []
      }

      acc[row.route_group_id]?.push(row.employee_id)
      return acc
    }, {})

    const routeGroupLabelById = new Map(
      ((routeGroupsResult.data ?? []) as { id: string; label: string | null; group_label: string | null }[]).map((g) => [
        g.id,
        g.group_label || g.label || g.id,
      ]),
    )

    const emptyGroups = routeGroupIds.filter((id) => (memberIdsByGroup[id]?.length ?? 0) === 0)
    if (emptyGroups.length > 0) {
      const names = emptyGroups.map((id) => routeGroupLabelById.get(id) ?? id).join(', ')
      throw new Error(
        `Cannot publish: the following route groups have no members assigned: ${names}. ` +
        `Please add employees to these groups in Route Plans before publishing.`,
      )
    }

    const employeesById = new Map(
      ((employeesResult.data ?? []) as EmployeeRateSnapshotRow[]).map((employee) => [employee.id, employee]),
    )

    const adjustmentsByEmployeeDate = new Map(
      ((adjustmentsResult.data ?? []) as EmployeeAdjustmentSnapshotRow[]).map((row) => [`${row.employee_id}::${row.work_date}`, row]),
    )

    const rateType = getSnapshotRateType(date, holidays.length > 0)
    const adjustmentSnapshotTaken = new Set<string>()

    const publishedPayload = activeDraftRows.flatMap((row) => {
      const memberIds = Array.from(new Set(memberIdsByGroup[row.route_group_id] ?? []))

      return memberIds.map((employeeId) => {
        const employee = employeesById.get(employeeId)
        const adjustmentKey = `${employeeId}::${date}`
        const adjustment = adjustmentsByEmployeeDate.get(adjustmentKey)
        const shouldApplyAdjustmentOnRow = !adjustmentSnapshotTaken.has(adjustmentKey)

        if (shouldApplyAdjustmentOnRow) {
          adjustmentSnapshotTaken.add(adjustmentKey)
        }

        const baseMinutes = toSafeMinutes(row.actual_minutes)
        const startExtraMinutes = shouldApplyAdjustmentOnRow ? toSafeMinutes(adjustment?.start_extra_minutes) : 0
        const endExtraMinutes = shouldApplyAdjustmentOnRow ? toSafeMinutes(adjustment?.end_extra_minutes) : 0
        const otherExtraMinutes = shouldApplyAdjustmentOnRow ? toSafeMinutes(adjustment?.other_extra_minutes) : 0
        const manualAdjustmentMinutes = shouldApplyAdjustmentOnRow
          ? Math.round(Number(adjustment?.manual_adjustment_minutes ?? 0))
          : 0

        const totalPaidMinutes = baseMinutes + startExtraMinutes + endExtraMinutes + otherExtraMinutes + manualAdjustmentMinutes
        const appliedRate = getEmployeeSnapshotRate(rateType, employee)
        const totalPay = toCurrency((totalPaidMinutes / 60) * appliedRate)
        const plannedMinutes = toSafeMinutes(row.planned_minutes)
        const invoiceMinutes = Math.max(plannedMinutes, baseMinutes)
        const invoiceHours = Number((invoiceMinutes / 60).toFixed(2))
        const invoiceAmount = toCurrency(invoiceHours * appliedRate)

        return {
          work_date: row.work_date,
          employee_id: employeeId,
          employee_name_snapshot: employee?.full_name ?? 'Unknown employee',
          applied_rate_snapshot: appliedRate,
          rate_type_snapshot: rateType,
          base_minutes_snapshot: baseMinutes,
          start_extra_minutes_snapshot: startExtraMinutes,
          end_extra_minutes_snapshot: endExtraMinutes,
          other_extra_minutes_snapshot: otherExtraMinutes,
          manual_adjustment_minutes_snapshot: manualAdjustmentMinutes,
          total_paid_minutes_snapshot: totalPaidMinutes,
          total_pay_snapshot: totalPay,
          invoice_minutes_snapshot: invoiceMinutes,
          invoice_hours_snapshot: invoiceHours,
          invoice_amount_snapshot: invoiceAmount,
          route_group_id: row.route_group_id,
          route_stop_id: row.route_stop_id,
          daily_task_id: row.daily_task_id,
          planned_minutes: plannedMinutes,
          actual_minutes: baseMinutes,
          note: row.note?.trim() || null,
          published_at: new Date().toISOString(),
        }
      })
    })

    try {
      await deletePublishedRowsByDate(supabase, date)
    }
    catch (deleteError) {
      console.error('[hours] failed clearing published hours before publish', {
        table: PUBLISHED_TEAM_TASKS_TABLE,
        date,
        error: deleteError,
      })
      throw new Error(deleteError instanceof Error ? deleteError.message : 'Failed clearing published hours before publish.')
    }

    const { error: insertError } = await insertPublishedRows(supabase, publishedPayload)

    if (insertError) {
      console.error('[hours] failed inserting published hours snapshot', {
        table: PUBLISHED_TEAM_TASKS_TABLE,
        date,
        attemptedColumns: [
          'work_date',
          'employee_id',
          'employee_name_snapshot',
          'applied_rate_snapshot',
          'rate_type_snapshot',
          'base_minutes_snapshot',
          'start_extra_minutes_snapshot',
          'end_extra_minutes_snapshot',
          'other_extra_minutes_snapshot',
          'manual_adjustment_minutes_snapshot',
          'total_paid_minutes_snapshot',
          'total_pay_snapshot',
          'invoice_minutes_snapshot',
          'invoice_hours_snapshot',
          'invoice_amount_snapshot',
          'route_group_id',
          'route_stop_id',
          'daily_task_id',
          'planned_minutes',
          'actual_minutes',
          'note',
          'published_at',
        ],
        error: insertError,
      })
      throw toPublishedSchemaError(insertError)
    }

    return {
      publishedCount: publishedPayload.length,
    }
  }

  return {
    getWeekTeamHours,
    getDayTeamHours,
    getDayTeamHoursPublicationState,
    seedDayTeamHoursFromPublishedPlan,
    saveDayTeamHours,
    publishDayTeamHours,
  }
}
