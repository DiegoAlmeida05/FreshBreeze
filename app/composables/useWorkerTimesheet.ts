import { useAuth } from './useAuth'
import { useHolidays } from './useHolidays'
import { useSupabaseClient } from './useSupabaseClient'
import type { WorkerProfileSettings } from './useWorkerProfileSettings'

interface RoutePlanRow {
  id: string
  date: string
}

interface RouteGroupRow {
  id: string
  route_plan_id: string
}

interface RouteGroupMemberRow {
  route_group_id: string
}

interface EmployeeRow {
  id: string
}

interface RouteStopRow {
  route_group_id: string
  daily_task_id: string
}

interface DailyTaskHoursRow {
  id: string
  property_id: string
  cleaning_minutes_override: number | null
}

interface PropertyHoursRow {
  id: string
  default_cleaning_minutes: number | null
}

interface TimesheetEntryRow {
  id: string
  employee_id: string
  work_date: string
  source_task_hours: number | null
  start_time: string | null
  end_time: string | null
  extra_hours: number | null
  worked_hours: number | null
  is_holiday: boolean | null
  applied_hourly_rate: number | null
  applied_rate_type: string | null
  estimated_pay: number | null
  note: string | null
}

export interface WorkerTimesheetDay {
  id: string | null
  date: string
  source_task_hours: number
  start_time: string
  end_time: string
  extra_hours: number
  worked_hours: number
  hourly_rate: number
  estimated_daily_pay: number
  is_holiday: boolean
  applied_hourly_rate: number
  applied_rate_type: 'holiday' | 'sunday' | 'weekday'
  estimated_pay: number
  note: string
}

export interface WorkerTimesheetSummary {
  total_task_hours: number
  total_worked_hours: number
  total_extra_hours: number
  estimated_weekly_pay: number
}

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatTimeOrEmpty(value: string | null): string {
  return value?.slice(0, 5) ?? ''
}

function toNumber(value: number | null | undefined): number {
  return Number.isFinite(value) ? Number(value) : 0
}

function diffHours(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0

  const [startHourRaw, startMinRaw] = startTime.split(':')
  const [endHourRaw, endMinRaw] = endTime.split(':')
  const startHour = Number(startHourRaw ?? NaN)
  const startMin = Number(startMinRaw ?? NaN)
  const endHour = Number(endHourRaw ?? NaN)
  const endMin = Number(endMinRaw ?? NaN)

  if (!Number.isFinite(startHour) || !Number.isFinite(startMin) || !Number.isFinite(endHour) || !Number.isFinite(endMin)) {
    return 0
  }

  const start = (startHour * 60) + startMin
  const end = (endHour * 60) + endMin

  if (end <= start) return 0

  return Number(((end - start) / 60).toFixed(2))
}

function round2(value: number): number {
  return Number(value.toFixed(2))
}

function getDayRateType(dateIso: string, isHoliday: boolean): 'holiday' | 'sunday' | 'weekday' {
  if (isHoliday) {
    return 'holiday'
  }

  const date = new Date(`${dateIso}T00:00:00`)
  return date.getDay() === 0 ? 'sunday' : 'weekday'
}

function getRateByType(settings: WorkerProfileSettings, rateType: 'holiday' | 'sunday' | 'weekday'): number {
  if (rateType === 'holiday') {
    return round2(settings.hourly_rate_holiday_override)
  }

  if (rateType === 'sunday') {
    return round2(settings.hourly_rate_sunday_override)
  }

  return round2(settings.hourly_rate_weekday_override)
}

export function useWorkerTimesheet() {
  const supabase = useSupabaseClient()
  const auth = useAuth()
  const { getHolidaysByRange } = useHolidays()

  async function getEmployeeIdForCurrentUser(): Promise<string> {
    const user = await auth.getCurrentUser()

    const { data, error } = await supabase
      .from('employees')
      .select('id')
      .eq('profile_id', user.id)
      .maybeSingle<EmployeeRow>()

    if (error) {
      throw new Error(error.message)
    }

    if (!data) {
      throw new Error('No employee record found for current user.')
    }

    return data.id
  }

  async function getWeekTimesheet(
    weekBaseDate: string,
    settings: WorkerProfileSettings,
  ): Promise<{ days: WorkerTimesheetDay[]; summary: WorkerTimesheetSummary }> {
    const user = await auth.getCurrentUser()
    const baseDate = startOfWeek(new Date(`${weekBaseDate}T00:00:00`))

    const weekDates: string[] = []
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(baseDate)
      d.setDate(baseDate.getDate() + i)
      weekDates.push(toIsoDate(d))
    }

    const weekStart = weekDates[0] ?? ''
    const weekEnd = weekDates[6] ?? ''

    const [{ data: employeeData, error: employeeError }, holidays] = await Promise.all([
      supabase
        .from('employees')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle<EmployeeRow>(),
      getHolidaysByRange(weekStart, weekEnd).catch(() => []),
    ])

    if (employeeError) {
      throw new Error(employeeError.message)
    }

    const holidaySet = new Set((holidays ?? []).map((h) => h.date))

    const sourceTaskHoursByDate: Record<string, number> = Object.fromEntries(weekDates.map((date) => [date, 0]))

    if (employeeData?.id) {
      const { data: plans, error: plansError } = await supabase
        .from('route_plans')
        .select('id, date')
        .in('date', weekDates)
        .eq('status', 'published')

      if (plansError) {
        throw new Error(plansError.message)
      }

      const routePlans = (plans ?? []) as RoutePlanRow[]
      const routePlanIds = routePlans.map((plan) => plan.id)
      const dateByPlanId = new Map(routePlans.map((plan) => [plan.id, plan.date]))

      if (routePlanIds.length > 0) {
        const [{ data: groups, error: groupsError }, { data: members, error: membersError }] = await Promise.all([
          supabase
            .from('route_groups')
            .select('id, route_plan_id')
            .in('route_plan_id', routePlanIds),
          supabase
            .from('route_group_members')
            .select('route_group_id')
            .eq('employee_id', employeeData.id),
        ])

        if (groupsError) {
          throw new Error(groupsError.message)
        }

        if (membersError) {
          throw new Error(membersError.message)
        }

        const groupRows = (groups ?? []) as RouteGroupRow[]
        const memberGroupIds = new Set(((members ?? []) as RouteGroupMemberRow[]).map((m) => m.route_group_id))
        const workerGroupRows = groupRows.filter((group) => memberGroupIds.has(group.id))

        const workerGroupIds = workerGroupRows.map((g) => g.id)
        const routePlanByGroupId = new Map(workerGroupRows.map((g) => [g.id, g.route_plan_id]))

        if (workerGroupIds.length > 0) {
          const { data: stops, error: stopsError } = await supabase
            .from('route_stops')
            .select('route_group_id, daily_task_id')
            .in('route_group_id', workerGroupIds)

          if (stopsError) {
            throw new Error(stopsError.message)
          }

          const stopRows = (stops ?? []) as RouteStopRow[]
          const taskIds = [...new Set(stopRows.map((stop) => stop.daily_task_id))]

          if (taskIds.length > 0) {
            const { data: tasks, error: tasksError } = await supabase
              .from('daily_tasks')
              .select('id, property_id, cleaning_minutes_override')
              .in('id', taskIds)

            if (tasksError) {
              throw new Error(tasksError.message)
            }

            const dailyTaskRows = (tasks ?? []) as DailyTaskHoursRow[]
            const propertyIds = [...new Set(dailyTaskRows.map((task) => task.property_id))]

            const { data: properties, error: propertiesError } = await supabase
              .from('properties')
              .select('id, default_cleaning_minutes')
              .in('id', propertyIds)

            if (propertiesError) {
              throw new Error(propertiesError.message)
            }

            const propertyMap = new Map(((properties ?? []) as PropertyHoursRow[]).map((property) => [property.id, property]))
            const taskHoursByTaskId = new Map<string, number>()

            for (const task of dailyTaskRows) {
              const defaultMinutes = toNumber(propertyMap.get(task.property_id)?.default_cleaning_minutes)
              const sourceMinutes = toNumber(task.cleaning_minutes_override) > 0 ? toNumber(task.cleaning_minutes_override) : defaultMinutes
              taskHoursByTaskId.set(task.id, round2(sourceMinutes / 60))
            }

            for (const stop of stopRows) {
              const routePlanId = routePlanByGroupId.get(stop.route_group_id)
              const date = routePlanId ? dateByPlanId.get(routePlanId) : null

              if (!date) continue

              const taskHours = taskHoursByTaskId.get(stop.daily_task_id) ?? 0
              sourceTaskHoursByDate[date] = round2((sourceTaskHoursByDate[date] ?? 0) + taskHours)
            }
          }
        }
      }
    }

    let entriesByDate = new Map<string, TimesheetEntryRow>()

    if (employeeData?.id) {
      const { data: entriesData, error: entriesError } = await supabase
        .from('worker_timesheet_entries')
        .select('id, employee_id, work_date, source_task_hours, start_time, end_time, extra_hours, worked_hours, is_holiday, applied_hourly_rate, applied_rate_type, estimated_pay, note')
        .eq('employee_id', employeeData.id)
        .in('work_date', weekDates)

      if (entriesError) {
        throw new Error(entriesError.message)
      }

      entriesByDate = new Map(((entriesData ?? []) as TimesheetEntryRow[]).map((entry) => [entry.work_date, entry]))
    }

    const days: WorkerTimesheetDay[] = weekDates.map((date) => {
      const entry = entriesByDate.get(date)
      const sourceTaskHours = round2(sourceTaskHoursByDate[date] ?? 0)
      const startTime = formatTimeOrEmpty(entry?.start_time ?? null)
      const endTime = formatTimeOrEmpty(entry?.end_time ?? null)
      const extraHours = round2(toNumber(entry?.extra_hours))
      const workedHours = Number.isFinite(entry?.worked_hours)
        ? round2(toNumber(entry?.worked_hours))
        : round2(diffHours(startTime, endTime) + extraHours)
      const isHoliday = typeof entry?.is_holiday === 'boolean' ? entry.is_holiday : holidaySet.has(date)
      const computedRateType = getDayRateType(date, isHoliday)
      const savedRateType = entry?.applied_rate_type === 'holiday' || entry?.applied_rate_type === 'sunday' || entry?.applied_rate_type === 'weekday'
        ? entry.applied_rate_type
        : null
      const appliedRateType: 'holiday' | 'sunday' | 'weekday' = savedRateType ?? computedRateType
      const hourlyRate = Number.isFinite(entry?.applied_hourly_rate)
        ? round2(toNumber(entry?.applied_hourly_rate))
        : getRateByType(settings, computedRateType)
      const estimatedDailyPay = Number.isFinite(entry?.estimated_pay)
        ? round2(toNumber(entry?.estimated_pay))
        : round2(workedHours * hourlyRate)

      return {
        id: entry?.id ?? null,
        date,
        source_task_hours: sourceTaskHours,
        start_time: startTime,
        end_time: endTime,
        extra_hours: extraHours,
        worked_hours: workedHours,
        hourly_rate: round2(hourlyRate),
        estimated_daily_pay: estimatedDailyPay,
        is_holiday: isHoliday,
        applied_hourly_rate: round2(hourlyRate),
        applied_rate_type: appliedRateType,
        estimated_pay: estimatedDailyPay,
        note: entry?.note ?? '',
      }
    })

    const summary: WorkerTimesheetSummary = {
      total_task_hours: round2(days.reduce((sum, day) => sum + day.source_task_hours, 0)),
      total_worked_hours: round2(days.reduce((sum, day) => sum + day.worked_hours, 0)),
      total_extra_hours: round2(days.reduce((sum, day) => sum + day.extra_hours, 0)),
      estimated_weekly_pay: round2(days.reduce((sum, day) => sum + day.estimated_daily_pay, 0)),
    }

    return { days, summary }
  }

  async function saveDayEntry(day: WorkerTimesheetDay): Promise<void> {
    const employeeId = await getEmployeeIdForCurrentUser()

    const payload = {
      employee_id: employeeId,
      work_date: day.date,
      source_task_hours: day.source_task_hours,
      start_time: day.start_time || null,
      end_time: day.end_time || null,
      extra_hours: day.extra_hours,
      worked_hours: day.worked_hours,
      is_holiday: day.is_holiday,
      applied_hourly_rate: day.applied_hourly_rate,
      applied_rate_type: day.applied_rate_type,
      estimated_pay: day.estimated_pay,
      note: day.note.trim() || null,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('worker_timesheet_entries')
      .upsert(payload, { onConflict: 'employee_id,work_date' })

    if (error) {
      throw new Error(error.message)
    }
  }

  return {
    getWeekTimesheet,
    saveDayEntry,
  }
}
