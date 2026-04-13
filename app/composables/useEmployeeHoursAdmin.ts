import { useAuth } from './useAuth'
import { useHolidays } from './useHolidays'
import { useSupabaseClient } from './useSupabaseClient'
import type { EmployeeTimeEntryAdminDTO, UpdateEmployeeTimeEntryAdminDTO, TimeEntryType } from '../../shared/types/EmployeeTimeEntryAdminDTO'

const ADMIN_TIME_ENTRIES_TABLE = 'employee_time_entries_admin'
const DEFAULT_MINUTES_FALLBACK = 0

interface TimeEntryAdminRow {
  id: string
  employee_id: string
  entry_type: TimeEntryType
  route_stop_id: string | null
  daily_task_id: string | null
  work_date: string
  planned_minutes: number | null
  actual_minutes: number | null
  start_extra_minutes: number | null
  other_extra_minutes: number | null
  end_extra_minutes: number | null
  note: string | null
  created_by_profile_id: string
  updated_by_profile_id: string
  created_at: string | null
  updated_at: string | null
}

interface RoutePlanRow {
  id: string
}

interface RouteGroupRow {
  id: string
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

interface DailyTaskDurationRow {
  id: string
  property_id: string
  cleaning_minutes_override: number | null
}

interface PropertyDurationRow {
  id: string
  default_cleaning_minutes: number | null
}

interface EmployeeRow {
  id: string
  full_name: string
  hourly_rate_weekday: number | null
  hourly_rate_sunday: number | null
  hourly_rate_holiday: number | null
}

interface DailyTaskInfoRow {
  id: string
  property_id: string
}

interface PropertyInfoRow {
  id: string
  name: string
  client_id: string
}

interface ClientInfoRow {
  id: string
  name: string | null
}

export interface WeekDayOverview {
  date: string
  totalMinutes: number
  totalHours: number
  isHoliday: boolean
  holidayNames: string[]
}

export interface DayEntryItem {
  entry: EmployeeTimeEntryAdminDTO
  propertyName: string
  clientName: string
  plannedMinutes: number
  actualMinutes: number
  differenceMinutes: number
  totalMinutes: number
  totalHours: number
  rateLabel: 'Weekday' | 'Sunday' | 'Holiday'
  rateUsed: number
  estimatedPay: number
}

export interface DayEntriesByEmployee {
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
  adjustmentEntry: EmployeeTimeEntryAdminDTO | null
}

export interface DayEntriesResult {
  groups: DayEntriesByEmployee[]
  dayTotalTaskMinutes: number
  dayTotalAdjustmentMinutes: number
  dayTotalMinutes: number
  dayTotalHours: number
  dayTotalPay: number
  isHoliday: boolean
  holidayNames: string[]
}

export interface SeedDayEntriesResult {
  createdCount: number
  existingCount: number
  skippedCount: number
}

function toIsoDate(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseIsoDate(value: string): Date {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date format. Expected YYYY-MM-DD.')
  }
  return date
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function toSafeMinutes(value: number | null | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0
  }

  if (value < 0) {
    return 0
  }

  return Math.round(value)
}

function toCurrency(value: number): number {
  return Number(value.toFixed(2))
}

function toHours(totalMinutes: number): number {
  return Number((totalMinutes / 60).toFixed(2))
}

function toTimeEntryAdminDTO(row: TimeEntryAdminRow): EmployeeTimeEntryAdminDTO {
  return {
    id: row.id,
    employee_id: row.employee_id,
    entry_type: row.entry_type,
    route_stop_id: row.route_stop_id,
    daily_task_id: row.daily_task_id,
    work_date: row.work_date,
    planned_minutes: toSafeMinutes(row.planned_minutes),
    actual_minutes: toSafeMinutes(row.actual_minutes),
    start_extra_minutes: toSafeMinutes(row.start_extra_minutes),
    other_extra_minutes: toSafeMinutes(row.other_extra_minutes),
    end_extra_minutes: toSafeMinutes(row.end_extra_minutes),
    note: row.note,
    created_by_profile_id: row.created_by_profile_id,
    updated_by_profile_id: row.updated_by_profile_id,
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
  }
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

function calculateEstimatedPay(totalMinutes: number, hourlyRateWeekday: number): number {
  const hours = totalMinutes / 60
  return toCurrency(hours * hourlyRateWeekday)
}

function isSunday(date: string): boolean {
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) {
    return false
  }
  return parsed.getDay() === 0
}

function selectRateForDate(args: {
  date: string
  isHoliday: boolean
  hourlyRateWeekday: number
  hourlyRateSunday: number
  hourlyRateHoliday: number
}): { rateUsed: number; rateLabel: 'Weekday' | 'Sunday' | 'Holiday' } {
  if (args.isHoliday) {
    return {
      rateUsed: args.hourlyRateHoliday,
      rateLabel: 'Holiday',
    }
  }

  if (isSunday(args.date)) {
    return {
      rateUsed: args.hourlyRateSunday,
      rateLabel: 'Sunday',
    }
  }

  return {
    rateUsed: args.hourlyRateWeekday,
    rateLabel: 'Weekday',
  }
}

function createEmptyDayAdjustment(employeeId: string, date: string): EmployeeTimeEntryAdminDTO {
  return {
    id: '',
    employee_id: employeeId,
    entry_type: 'day_adjustment',
    route_stop_id: null,
    daily_task_id: null,
    work_date: date,
    planned_minutes: 0,
    actual_minutes: 0,
    start_extra_minutes: 0,
    other_extra_minutes: 0,
    end_extra_minutes: 0,
    note: null,
    created_by_profile_id: '',
    updated_by_profile_id: '',
    created_at: '',
    updated_at: '',
  }
}

function totalAdjustmentMinutes(entry: EmployeeTimeEntryAdminDTO | null | undefined): number {
  if (!entry || entry.entry_type !== 'day_adjustment') {
    return 0
  }

  return entry.start_extra_minutes + entry.other_extra_minutes + entry.end_extra_minutes
}

export function useEmployeeHoursAdmin() {
  const supabase = useSupabaseClient()
  const auth = useAuth()
  const { getHolidaysByRange } = useHolidays()

  async function getWeekOverview(startDate: string): Promise<WeekDayOverview[]> {
    const weekStart = parseIsoDate(startDate)
    const weekDates = Array.from({ length: 7 }, (_, index) => toIsoDate(addDays(weekStart, index)))
    const weekEnd = weekDates[6] ?? startDate

    const [entriesResult, holidays] = await Promise.all([
      supabase
        .from(ADMIN_TIME_ENTRIES_TABLE)
        .select('work_date, actual_minutes, start_extra_minutes, other_extra_minutes, end_extra_minutes')
        .gte('work_date', startDate)
        .lte('work_date', weekEnd),
      getHolidaysByRange(startDate, weekEnd),
    ])

    if (entriesResult.error) {
      throw new Error(entriesResult.error.message)
    }

    const holidayNamesByDate = holidays.reduce<Record<string, string[]>>((acc, holiday) => {
      if (!acc[holiday.date]) {
        acc[holiday.date] = []
      }

      acc[holiday.date]?.push(holiday.name)
      return acc
    }, {})

    const totalsByDate = ((entriesResult.data ?? []) as Array<{
      work_date: string
      actual_minutes: number | null
      start_extra_minutes: number | null
      other_extra_minutes: number | null
      end_extra_minutes: number | null
    }>).reduce<Record<string, number>>((acc, row) => {
      const taskMinutes = toSafeMinutes(row.actual_minutes)
      const adjustmentMinutes = toSafeMinutes(row.start_extra_minutes) + toSafeMinutes(row.other_extra_minutes) + toSafeMinutes(row.end_extra_minutes)
      acc[row.work_date] = (acc[row.work_date] ?? 0) + taskMinutes + adjustmentMinutes
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

  async function getDayEntries(date: string): Promise<DayEntriesResult> {
    const [entriesResult, holidays] = await Promise.all([
      supabase
        .from(ADMIN_TIME_ENTRIES_TABLE)
        .select('id, employee_id, entry_type, route_stop_id, daily_task_id, work_date, planned_minutes, actual_minutes, start_extra_minutes, other_extra_minutes, end_extra_minutes, note, created_by_profile_id, updated_by_profile_id, created_at, updated_at')
        .eq('work_date', date)
        .order('created_at', { ascending: true }),
      getHolidaysByRange(date, date),
    ])

    if (entriesResult.error) {
      throw new Error(entriesResult.error.message)
    }

    const rows = (entriesResult.data ?? []) as TimeEntryAdminRow[]
    const holidayDates = new Set(holidays.map((holiday) => holiday.date))
    const holidayNames = holidays.map((holiday) => holiday.name)

    // Separate task and adjustment entries
    const taskRows = rows.filter((row) => row.entry_type === 'task')
    const adjustmentRows = rows.filter((row) => row.entry_type === 'day_adjustment')

    if (taskRows.length === 0 && adjustmentRows.length === 0) {
      return {
        groups: [],
        dayTotalTaskMinutes: 0,
        dayTotalAdjustmentMinutes: 0,
        dayTotalMinutes: 0,
        dayTotalHours: 0,
        dayTotalPay: 0,
        isHoliday: holidayDates.has(date),
        holidayNames,
      }
    }

    const employeeIds = Array.from(new Set([
      ...taskRows.map((row) => row.employee_id),
      ...adjustmentRows.map((row) => row.employee_id),
    ]))
    const taskIds = Array.from(new Set(taskRows.map((row) => row.daily_task_id).filter((id) => id !== null)))

    const [employeesResult, taskResult] = await Promise.all([
      supabase
        .from('employees')
        .select('id, full_name, hourly_rate_weekday, hourly_rate_sunday, hourly_rate_holiday')
        .in('id', employeeIds),
      taskIds.length === 0
        ? Promise.resolve({ data: [], error: null })
        : supabase
          .from('daily_tasks')
          .select('id, property_id')
          .in('id', taskIds),
    ])

    if (employeesResult.error) {
      throw new Error(employeesResult.error.message)
    }

    if (taskResult.error) {
      throw new Error(taskResult.error.message)
    }

    const employeeMap = new Map(
      ((employeesResult.data ?? []) as EmployeeRow[]).map((employee) => [employee.id, employee]),
    )

    const tasks = (taskResult.data ?? []) as DailyTaskInfoRow[]
    const taskMap = new Map(tasks.map((task) => [task.id, task]))
    const propertyIds = Array.from(new Set(tasks.map((task) => task.property_id)))

    const propertiesResult = propertyIds.length === 0
      ? { data: [], error: null }
      : await supabase
        .from('properties')
        .select('id, name, client_id')
        .in('id', propertyIds)

    if (propertiesResult.error) {
      throw new Error(propertiesResult.error.message)
    }

    const properties = (propertiesResult.data ?? []) as PropertyInfoRow[]
    const propertyMap = new Map(properties.map((property) => [property.id, property]))
    const clientIds = Array.from(new Set(properties.map((property) => property.client_id)))

    let clients: ClientInfoRow[] = []

    if (clientIds.length > 0) {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id, name')
        .in('id', clientIds)

      if (clientError) {
        throw new Error(clientError.message)
      }

      clients = (clientData ?? []) as ClientInfoRow[]
    }

    const clientMap = new Map(clients.map((client) => [client.id, client]))
    const adjustmentsByEmployee = new Map(
      adjustmentRows.map((row) => [row.employee_id, toTimeEntryAdminDTO(row)]),
    )
    const entriesByEmployee = new Map<string, DayEntriesByEmployee>()

    for (const employeeId of employeeIds) {
      const employee = employeeMap.get(employeeId)
      const adjustment = adjustmentsByEmployee.get(employeeId) ?? createEmptyDayAdjustment(employeeId, date)
      const hourlyRateWeekday = Number(employee?.hourly_rate_weekday ?? 0)
      const hourlyRateSunday = Number(employee?.hourly_rate_sunday ?? 0)
      const hourlyRateHoliday = Number(employee?.hourly_rate_holiday ?? 0)
      const rate = selectRateForDate({
        date,
        isHoliday: holidayDates.has(date),
        hourlyRateWeekday,
        hourlyRateSunday,
        hourlyRateHoliday,
      })
      const adjustmentMinutes = totalAdjustmentMinutes(adjustment)

      entriesByEmployee.set(employeeId, {
        employeeId,
        employeeName: employee?.full_name ?? 'Unknown employee',
        rateLabel: rate.rateLabel,
        rateUsed: rate.rateUsed,
        taskMinutesTotal: 0,
        adjustmentMinutesTotal: adjustmentMinutes,
        totalPaidMinutes: adjustmentMinutes,
        subtotalHours: toHours(adjustmentMinutes),
        subtotalPay: calculateEstimatedPay(adjustmentMinutes, rate.rateUsed),
        entries: [],
        adjustmentEntry: adjustment,
      })
    }

    for (const row of taskRows) {
      const entry = toTimeEntryAdminDTO(row)
      const task = taskMap.get(entry.daily_task_id ?? '')
      const property = task ? propertyMap.get(task.property_id) : undefined
      const client = property ? clientMap.get(property.client_id) : undefined
      const current = entriesByEmployee.get(entry.employee_id)

      if (!current) {
        continue
      }

      const totalMinutes = entry.actual_minutes
      const item: DayEntryItem = {
        entry,
        propertyName: property?.name ?? 'Unknown property',
        clientName: client?.name?.trim() || 'Unknown client',
        plannedMinutes: entry.planned_minutes,
        actualMinutes: entry.actual_minutes,
        differenceMinutes: entry.actual_minutes - entry.planned_minutes,
        totalMinutes,
        totalHours: toHours(totalMinutes),
        rateLabel: current.rateLabel,
        rateUsed: current.rateUsed,
        estimatedPay: calculateEstimatedPay(totalMinutes, current.rateUsed),
      }

      current.entries.push(item)
      current.taskMinutesTotal += totalMinutes
      current.totalPaidMinutes = current.taskMinutesTotal + current.adjustmentMinutesTotal
      current.subtotalHours = toHours(current.totalPaidMinutes)
      current.subtotalPay = calculateEstimatedPay(current.totalPaidMinutes, current.rateUsed)
    }

    const groups = Array.from(entriesByEmployee.values())
      .sort((a, b) => a.employeeName.localeCompare(b.employeeName))
      .map((group) => ({
        ...group,
        entries: [...group.entries].sort((a, b) => a.propertyName.localeCompare(b.propertyName)),
      }))

    const dayTotalTaskMinutes = groups.reduce((acc, group) => acc + group.taskMinutesTotal, 0)
    const dayTotalAdjustmentMinutes = groups.reduce((acc, group) => acc + group.adjustmentMinutesTotal, 0)
    const dayTotalMinutes = dayTotalTaskMinutes + dayTotalAdjustmentMinutes
    const dayTotalPay = toCurrency(groups.reduce((acc, group) => acc + group.subtotalPay, 0))

    return {
      groups,
      dayTotalTaskMinutes,
      dayTotalAdjustmentMinutes,
      dayTotalMinutes,
      dayTotalHours: toHours(dayTotalMinutes),
      dayTotalPay,
      isHoliday: holidayDates.has(date),
      holidayNames,
    }
  }

  async function seedDayEntriesFromPublishedPlan(date: string): Promise<SeedDayEntriesResult> {
    const profile = await auth.getProfile()

    const { data: planData, error: planError } = await supabase
      .from('route_plans')
      .select('id')
      .eq('date', date)
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(1)

    if (planError) {
      throw new Error(planError.message)
    }

    const plan = ((planData ?? []) as RoutePlanRow[])[0]

    if (!plan) {
      return {
        createdCount: 0,
        existingCount: 0,
        skippedCount: 0,
      }
    }

    const { data: groupData, error: groupError } = await supabase
      .from('route_groups')
      .select('id')
      .eq('route_plan_id', plan.id)

    if (groupError) {
      throw new Error(groupError.message)
    }

    const groups = (groupData ?? []) as RouteGroupRow[]

    if (groups.length === 0) {
      return {
        createdCount: 0,
        existingCount: 0,
        skippedCount: 0,
      }
    }

    const groupIds = groups.map((group) => group.id)

    const [membersResult, stopsResult] = await Promise.all([
      supabase
        .from('route_group_members')
        .select('route_group_id, employee_id')
        .in('route_group_id', groupIds),
      supabase
        .from('route_stops')
        .select('id, route_group_id, daily_task_id, order_index, planned_start_time, planned_end_time')
        .in('route_group_id', groupIds)
        .order('order_index', { ascending: true }),
    ])

    if (membersResult.error) {
      throw new Error(membersResult.error.message)
    }

    if (stopsResult.error) {
      throw new Error(stopsResult.error.message)
    }

    const members = (membersResult.data ?? []) as RouteGroupMemberRow[]
    const stops = (stopsResult.data ?? []) as RouteStopRow[]

    if (members.length === 0 || stops.length === 0) {
      return {
        createdCount: 0,
        existingCount: 0,
        skippedCount: 0,
      }
    }

    const employeeIdsByGroup = members.reduce<Record<string, string[]>>((acc, member) => {
      if (!acc[member.route_group_id]) {
        acc[member.route_group_id] = []
      }
      acc[member.route_group_id]?.push(member.employee_id)
      return acc
    }, {})

    const stopIds = stops.map((stop) => stop.id)
    const allEmployeeIds = Array.from(new Set(members.map((member) => member.employee_id)))

    const { data: existingRows, error: existingError } = await supabase
      .from(ADMIN_TIME_ENTRIES_TABLE)
      .select('employee_id, route_stop_id')
      .eq('work_date', date)
      .in('route_stop_id', stopIds)
      .in('employee_id', allEmployeeIds)

    if (existingError) {
      throw new Error(existingError.message)
    }

    const existingKeys = new Set(
      (existingRows ?? []).map((row) => {
        const item = row as { employee_id: string; route_stop_id: string }
        return `${item.employee_id}::${item.route_stop_id}`
      }),
    )

    const taskIds = Array.from(new Set(stops.map((stop) => stop.daily_task_id)))

    const { data: taskRows, error: taskError } = await supabase
      .from('daily_tasks')
      .select('id, property_id, cleaning_minutes_override')
      .in('id', taskIds)

    if (taskError) {
      throw new Error(taskError.message)
    }

    const tasks = (taskRows ?? []) as DailyTaskDurationRow[]
    const taskMap = new Map(tasks.map((task) => [task.id, task]))
    const propertyIds = Array.from(new Set(tasks.map((task) => task.property_id)))

    let propertyMap = new Map<string, PropertyDurationRow>()

    if (propertyIds.length > 0) {
      const { data: propertyRows, error: propertyError } = await supabase
        .from('properties')
        .select('id, default_cleaning_minutes')
        .in('id', propertyIds)

      if (propertyError) {
        throw new Error(propertyError.message)
      }

      propertyMap = new Map(
        ((propertyRows ?? []) as PropertyDurationRow[]).map((property) => [property.id, property]),
      )
    }

    const inserts: Array<Record<string, unknown>> = []
    let existingCount = 0
    let skippedCount = 0

    for (const stop of stops) {
      const employeeIds = Array.from(new Set(employeeIdsByGroup[stop.route_group_id] ?? []))

      if (employeeIds.length === 0) {
        skippedCount += 1
        continue
      }

      const task = taskMap.get(stop.daily_task_id)
      const property = task ? propertyMap.get(task.property_id) : undefined
      const fallbackDuration = Number(task?.cleaning_minutes_override ?? property?.default_cleaning_minutes ?? DEFAULT_MINUTES_FALLBACK)
      const plannedFromStop = calculatePlannedMinutesFromStop(date, stop)
      const plannedMinutes = toSafeMinutes(plannedFromStop ?? fallbackDuration)

      for (const employeeId of employeeIds) {
        const pairKey = `${employeeId}::${stop.id}`

        if (existingKeys.has(pairKey)) {
          existingCount += 1
          continue
        }

        existingKeys.add(pairKey)

        inserts.push({
          employee_id: employeeId,
          entry_type: 'task',
          route_stop_id: stop.id,
          daily_task_id: stop.daily_task_id,
          work_date: date,
          planned_minutes: plannedMinutes,
          actual_minutes: plannedMinutes,
          start_extra_minutes: 0,
          other_extra_minutes: 0,
          end_extra_minutes: 0,
          note: null,
          created_by_profile_id: profile.id,
          updated_by_profile_id: profile.id,
        })
      }
    }

    if (inserts.length > 0) {
      const { error: insertError } = await supabase
        .from(ADMIN_TIME_ENTRIES_TABLE)
        .insert(inserts)

      if (insertError) {
        throw new Error(insertError.message)
      }
    }

    return {
      createdCount: inserts.length,
      existingCount,
      skippedCount,
    }
  }

  async function updateTimeEntry(id: string, payload: UpdateEmployeeTimeEntryAdminDTO): Promise<EmployeeTimeEntryAdminDTO> {
    const profile = await auth.getProfile()

    const updatePayload: Record<string, unknown> = {
      updated_by_profile_id: profile.id,
      updated_at: new Date().toISOString(),
    }

    if (payload.actual_minutes !== undefined) {
      updatePayload.actual_minutes = toSafeMinutes(payload.actual_minutes)
    }

    if (payload.start_extra_minutes !== undefined) {
      updatePayload.start_extra_minutes = toSafeMinutes(payload.start_extra_minutes)
    }

    if (payload.other_extra_minutes !== undefined) {
      updatePayload.other_extra_minutes = toSafeMinutes(payload.other_extra_minutes)
    }

    if (payload.end_extra_minutes !== undefined) {
      updatePayload.end_extra_minutes = toSafeMinutes(payload.end_extra_minutes)
    }

    if (payload.note !== undefined) {
      updatePayload.note = payload.note?.trim() || null
    }

    const { data, error } = await supabase
      .from(ADMIN_TIME_ENTRIES_TABLE)
      .update(updatePayload)
      .eq('id', id)
      .select('id, employee_id, entry_type, route_stop_id, daily_task_id, work_date, planned_minutes, actual_minutes, start_extra_minutes, other_extra_minutes, end_extra_minutes, note, created_by_profile_id, updated_by_profile_id, created_at, updated_at')
      .single()

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to update time entry.')
    }

    return toTimeEntryAdminDTO(data as TimeEntryAdminRow)
  }

  async function getOrCreateAdjustmentEntry(employeeId: string, date: string): Promise<EmployeeTimeEntryAdminDTO> {
    if (!employeeId || !date) {
      throw new Error('Employee and date are required to manage adjustments.')
    }

    const { data, error } = await supabase
      .from(ADMIN_TIME_ENTRIES_TABLE)
      .select('id, employee_id, entry_type, route_stop_id, daily_task_id, work_date, planned_minutes, actual_minutes, start_extra_minutes, other_extra_minutes, end_extra_minutes, note, created_by_profile_id, updated_by_profile_id, created_at, updated_at')
      .eq('employee_id', employeeId)
      .eq('work_date', date)
      .eq('entry_type', 'day_adjustment')
      .maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    if (data) {
      return toTimeEntryAdminDTO(data as TimeEntryAdminRow)
    }

    const profile = await auth.getProfile()
    const { data: insertedData, error: insertError } = await supabase
      .from(ADMIN_TIME_ENTRIES_TABLE)
      .insert({
        employee_id: employeeId,
        entry_type: 'day_adjustment',
        route_stop_id: null,
        daily_task_id: null,
        work_date: date,
        planned_minutes: 0,
        actual_minutes: 0,
        start_extra_minutes: 0,
        other_extra_minutes: 0,
        end_extra_minutes: 0,
        note: null,
        created_by_profile_id: profile.id,
        updated_by_profile_id: profile.id,
      })
      .select('id, employee_id, entry_type, route_stop_id, daily_task_id, work_date, planned_minutes, actual_minutes, start_extra_minutes, other_extra_minutes, end_extra_minutes, note, created_by_profile_id, updated_by_profile_id, created_at, updated_at')
      .single()

    if (insertError || !insertedData) {
      throw new Error(insertError?.message ?? 'Failed to create adjustment entry.')
    }

    return toTimeEntryAdminDTO(insertedData as TimeEntryAdminRow)
  }

  return {
    getWeekOverview,
    getDayEntries,
    seedDayEntriesFromPublishedPlan,
    updateTimeEntry,
    getOrCreateAdjustmentEntry,
  }
}
