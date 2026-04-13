import { useAuth } from './useAuth'
import { useSupabaseClient } from './useSupabaseClient'
import type { UpdateEmployeeHoursSummaryAdjustmentAdminDTO } from '../../shared/types/EmployeeHoursSummaryAdjustmentAdminDTO'

type RateType = 'weekday' | 'sunday' | 'holiday'

const TEAM_TASK_ENTRIES_PUBLISHED_TABLE = 'team_time_entry_tasks_admin_published'
const EMPLOYEE_ADJUSTMENTS_TABLE = 'employee_hours_summary_adjustments_admin'

interface TeamTaskEntrySummaryRow {
  employee_id: string
  employee_name_snapshot: string | null
  planned_minutes: number | null
  actual_minutes: number | null
  rate_type_snapshot: RateType | null
  applied_rate_snapshot: number | null
  invoice_minutes_snapshot: number | null
  invoice_hours_snapshot: number | null
  invoice_amount_snapshot: number | null
  note: string | null
  route_group_id: string
  work_date: string
}

interface RouteGroupSummaryRow {
  id: string
  label: string | null
}

interface EmployeeAdjustmentSummaryRow {
  id: string
  employee_id: string
  work_date: string
  start_time: string | null
  end_time: string | null
  special_hours: number | null
  note: string | null
}

export interface HoursSummaryTeamSource {
  routeGroupId: string
  teamLabel: string
  jobMinutes: number
  jobsCount: number
}

export interface HoursSummaryDayBreakdown {
  adjustmentId: string | null
  date: string
  jobsCount: number
  jobMinutes: number
  jobHours: number
  startTime: string | null
  endTime: string | null
  specialHours: number
  shiftMinutes: number | null
  shiftHours: number | null
  workedMinutes: number
  workedHours: number
  diffMinutes: number
  totalMinutes: number
  totalHours: number
  invoiceMinutes: number
  invoiceHours: number
  invoiceAmount: number
  rateType: RateType
  appliedRate: number
  totalPay: number
  note: string | null
  teams: HoursSummaryTeamSource[]
}

export interface HoursSummaryEmployeeItem {
  employeeId: string
  employeeName: string
  totalMinutes: number
  totalHours: number
  totalPay: number
  workedDaysCount: number
  days: HoursSummaryDayBreakdown[]
}

export interface HoursSummaryGrandTotals {
  totalMinutes: number
  totalHours: number
  totalPay: number
  employeeCount: number
  workedDaysCount: number
}

export interface HoursSummaryResult {
  employees: HoursSummaryEmployeeItem[]
  grandTotals: HoursSummaryGrandTotals
}

interface AggregatedDayItem {
  employeeId: string
  employeeName: string
  date: string
  jobMinutes: number
  jobsCount: number
  appliedRate: number
  rateType: RateType
  invoiceMinutes: number
  invoiceHours: number
  invoiceAmount: number
  noteFromJobs: string | null
  teamsByGroup: Record<string, HoursSummaryTeamSource>
}

function toSafeMinutes(value: number | null | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
    return 0
  }

  return Math.round(value)
}

function toSafeSignedMinutes(value: number | null | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0
  }

  return Math.round(value)
}

function toSafeHours(value: number | null | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
    return 0
  }

  return Number(value.toFixed(2))
}

function normalizeTimeValue(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim()

  if (!normalized) {
    return null
  }

  const withSecondsMatch = normalized.match(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
  if (withSecondsMatch) {
    return `${withSecondsMatch[1]}:${withSecondsMatch[2]}`
  }

  const directMatch = normalized.match(/^([01]\d|2[0-3]):([0-5]\d)$/)
  if (directMatch) {
    return `${directMatch[1]}:${directMatch[2]}`
  }

  const amPmMatch = normalized.match(/^(\d{1,2})(?::?([0-5]\d))?\s*([aApP][mM])$/)
  if (amPmMatch) {
    const rawHours = Number(amPmMatch[1])
    const minutes = Number(amPmMatch[2] ?? '00')

    if (rawHours >= 1 && rawHours <= 12 && minutes >= 0 && minutes <= 59) {
      const suffix = amPmMatch[3].toUpperCase()
      const hour24 = (rawHours % 12) + (suffix === 'PM' ? 12 : 0)
      return `${String(hour24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    }
  }

  const digitsOnly = normalized.replace(/[^\d]/g, '')

  if (digitsOnly.length === 3 || digitsOnly.length === 4) {
    const padded = digitsOnly.length === 3 ? `0${digitsOnly}` : digitsOnly
    const hours = Number(padded.slice(0, 2))
    const minutes = Number(padded.slice(2, 4))

    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    }
  }

  return null
}

function timeToMinutes(value: string | null | undefined): number | null {
  const normalized = normalizeTimeValue(value)
  if (!normalized) {
    return null
  }

  const [hours, minutes] = normalized.split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null
  }

  return (hours * 60) + minutes
}

function calculateShiftMinutes(startTime: string | null | undefined, endTime: string | null | undefined): number | null {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)

  if (startMinutes === null || endMinutes === null) {
    return null
  }

  let diff = endMinutes - startMinutes

  if (diff < 0) {
    diff += 24 * 60
  }

  return diff
}

function toCurrency(value: number): number {
  return Number(value.toFixed(2))
}

function toHours(totalMinutes: number): number {
  return Number((totalMinutes / 60).toFixed(2))
}

function toPublishedSchemaError(error: { message?: string } | null | undefined): Error {
  const source = error?.message?.trim() || 'Unknown error'
  return new Error(`Published hours schema mismatch in ${TEAM_TASK_ENTRIES_PUBLISHED_TABLE}. Apply migration 202604030002_fix_team_hours_published_schema.sql. Details: ${source}`)
}

async function selectPublishedSummaryRows(
  supabase: ReturnType<typeof useSupabaseClient>,
  startDate: string,
  endDate: string,
): Promise<TeamTaskEntrySummaryRow[]> {
  const result = await supabase
    .from(TEAM_TASK_ENTRIES_PUBLISHED_TABLE)
    .select([
      'employee_id',
      'employee_name_snapshot',
      'planned_minutes',
      'actual_minutes',
      'rate_type_snapshot',
      'applied_rate_snapshot',
      'invoice_minutes_snapshot',
      'invoice_hours_snapshot',
      'invoice_amount_snapshot',
      'note',
      'route_group_id',
      'work_date',
    ].join(','))
    .gte('work_date', startDate)
    .lte('work_date', endDate)
    .order('work_date', { ascending: true })

  if (result.error) {
    throw toPublishedSchemaError(result.error)
  }

  return (result.data ?? []) as TeamTaskEntrySummaryRow[]
}

async function selectSummaryAdjustments(
  supabase: ReturnType<typeof useSupabaseClient>,
  startDate: string,
  endDate: string,
  employeeIds: string[],
): Promise<EmployeeAdjustmentSummaryRow[]> {
  if (employeeIds.length === 0) {
    return []
  }

  const result = await supabase
    .from(EMPLOYEE_ADJUSTMENTS_TABLE)
    .select('id, employee_id, work_date, start_time, end_time, special_hours, note')
    .in('employee_id', employeeIds)
    .gte('work_date', startDate)
    .lte('work_date', endDate)

  if (result.error) {
    throw new Error(result.error.message)
  }

  return (result.data ?? []) as EmployeeAdjustmentSummaryRow[]
}

export function useHoursSummary() {
  const supabase = useSupabaseClient()
  const auth = useAuth()

  async function getHoursSummary(startDate: string, endDate: string, employeeId?: string): Promise<HoursSummaryResult> {
    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required.')
    }

    if (startDate > endDate) {
      throw new Error('Start date must be before or equal to end date.')
    }

    console.debug('[hours-summary] loading published hours summary', {
      table: TEAM_TASK_ENTRIES_PUBLISHED_TABLE,
      startDate,
      endDate,
      employeeId: employeeId ?? null,
    })

    const teamEntries = await selectPublishedSummaryRows(supabase, startDate, endDate)
    const routeGroupIds = Array.from(new Set(teamEntries.map((row) => row.route_group_id)))

    const [groupsResult] = await Promise.all([
      routeGroupIds.length > 0
        ? supabase
          .from('route_groups')
          .select('id, label')
          .in('id', routeGroupIds)
        : Promise.resolve({ data: [], error: null }),
    ])

    if (groupsResult.error) {
      throw new Error(groupsResult.error.message)
    }

    const routeGroups = (groupsResult.data ?? []) as RouteGroupSummaryRow[]
    const routeGroupMap = new Map(routeGroups.map((group) => [group.id, group]))

    const filteredEntries = employeeId
      ? teamEntries.filter((row) => row.employee_id === employeeId)
      : teamEntries

    const targetEmployeeIds = Array.from(new Set(filteredEntries.map((row) => row.employee_id)))

    if (targetEmployeeIds.length === 0) {
      return {
        employees: [],
        grandTotals: {
          totalMinutes: 0,
          totalHours: 0,
          totalPay: 0,
          employeeCount: 0,
          workedDaysCount: 0,
        },
      }
    }

    const adjustments = await selectSummaryAdjustments(supabase, startDate, endDate, targetEmployeeIds)
    const adjustmentsByEmployeeDate = new Map(
      adjustments.map((row) => [`${row.employee_id}::${row.work_date}`, row]),
    )

    const aggregatedMap = new Map<string, AggregatedDayItem>()

    for (const teamEntry of filteredEntries) {
      const teamLabel = routeGroupMap.get(teamEntry.route_group_id)?.label?.trim() || 'Team'
      const employeeName = teamEntry.employee_name_snapshot?.trim() || 'Unknown employee'
      const plannedMinutes = toSafeMinutes(teamEntry.planned_minutes)
      const workedMinutes = toSafeMinutes(teamEntry.actual_minutes)
      const invoiceMinutes = teamEntry.invoice_minutes_snapshot !== null && teamEntry.invoice_minutes_snapshot !== undefined
        ? toSafeMinutes(teamEntry.invoice_minutes_snapshot)
        : Math.max(plannedMinutes, workedMinutes)
      const invoiceHours = teamEntry.invoice_hours_snapshot !== null && teamEntry.invoice_hours_snapshot !== undefined
        ? toSafeHours(teamEntry.invoice_hours_snapshot)
        : toHours(invoiceMinutes)
      const appliedRate = Number(teamEntry.applied_rate_snapshot ?? 0)
      const invoiceAmount = teamEntry.invoice_amount_snapshot !== null && teamEntry.invoice_amount_snapshot !== undefined
        ? toCurrency(Number(teamEntry.invoice_amount_snapshot))
        : toCurrency(invoiceHours * appliedRate)
      const key = `${teamEntry.employee_id}::${teamEntry.work_date}`
      const current = aggregatedMap.get(key)

      if (!current) {
        const teamsByGroup: Record<string, HoursSummaryTeamSource> = {
          [teamEntry.route_group_id]: {
            routeGroupId: teamEntry.route_group_id,
            teamLabel,
            jobMinutes: workedMinutes,
            jobsCount: 1,
          },
        }

        aggregatedMap.set(key, {
          employeeId: teamEntry.employee_id,
          employeeName,
          date: teamEntry.work_date,
          jobMinutes: workedMinutes,
          jobsCount: 1,
          appliedRate,
          rateType: (teamEntry.rate_type_snapshot ?? 'weekday') as RateType,
          invoiceMinutes,
          invoiceHours,
          invoiceAmount,
          noteFromJobs: teamEntry.note,
          teamsByGroup,
        })
        continue
      }

      current.jobMinutes += workedMinutes
      current.jobsCount += 1
      current.invoiceMinutes += invoiceMinutes
      current.invoiceHours = toHours(current.invoiceMinutes)
      current.invoiceAmount = toCurrency(current.invoiceAmount + invoiceAmount)

      const currentTeam = current.teamsByGroup[teamEntry.route_group_id]

      if (!currentTeam) {
        current.teamsByGroup[teamEntry.route_group_id] = {
          routeGroupId: teamEntry.route_group_id,
          teamLabel,
          jobMinutes: workedMinutes,
          jobsCount: 1,
        }
      }
      else {
        currentTeam.jobMinutes += workedMinutes
        currentTeam.jobsCount += 1
      }
    }

    const summaryByEmployee = new Map<string, HoursSummaryEmployeeItem>()

    for (const item of aggregatedMap.values()) {
      const adjustmentKey = `${item.employeeId}::${item.date}`
      const adjustment = adjustmentsByEmployeeDate.get(adjustmentKey)
      const startTime = normalizeTimeValue(adjustment?.start_time)
      const endTime = normalizeTimeValue(adjustment?.end_time)
      const shiftMinutes = calculateShiftMinutes(startTime, endTime)
      const workedMinutes = shiftMinutes ?? item.jobMinutes
      const specialHours = toSafeHours(adjustment?.special_hours)
      const specialMinutes = Math.round(specialHours * 60)
      const totalMinutes = workedMinutes + specialMinutes
      const diffMinutes = shiftMinutes !== null ? Math.max(0, shiftMinutes - item.jobMinutes) : 0
      const totalPay = toCurrency((totalMinutes / 60) * item.appliedRate)

      const day: HoursSummaryDayBreakdown = {
        adjustmentId: adjustment?.id ?? null,
        date: item.date,
        jobsCount: item.jobsCount,
        jobMinutes: item.jobMinutes,
        jobHours: toHours(item.jobMinutes),
        startTime,
        endTime,
        specialHours,
        shiftMinutes,
        shiftHours: shiftMinutes === null ? null : toHours(shiftMinutes),
        workedMinutes,
        workedHours: toHours(workedMinutes),
        diffMinutes,
        totalMinutes,
        totalHours: toHours(totalMinutes),
        invoiceMinutes: item.invoiceMinutes,
        invoiceHours: item.invoiceHours,
        invoiceAmount: item.invoiceAmount,
        rateType: item.rateType,
        appliedRate: item.appliedRate,
        totalPay,
        note: adjustment?.note?.trim() || item.noteFromJobs || null,
        teams: Object.values(item.teamsByGroup).sort((a, b) => a.teamLabel.localeCompare(b.teamLabel)),
      }

      const employeeSummary = summaryByEmployee.get(item.employeeId)

      if (!employeeSummary) {
        summaryByEmployee.set(item.employeeId, {
          employeeId: item.employeeId,
          employeeName: item.employeeName,
          totalMinutes,
          totalHours: toHours(totalMinutes),
          totalPay,
          workedDaysCount: 1,
          days: [day],
        })
        continue
      }

      employeeSummary.totalMinutes += totalMinutes
      employeeSummary.totalHours = toHours(employeeSummary.totalMinutes)
      employeeSummary.totalPay = toCurrency(employeeSummary.totalPay + totalPay)
      employeeSummary.days.push(day)
      employeeSummary.workedDaysCount = employeeSummary.days.length
    }

    const employees = Array.from(summaryByEmployee.values())
      .map((employee) => ({
        ...employee,
        days: [...employee.days].sort((a, b) => a.date.localeCompare(b.date)),
      }))
      .sort((a, b) => a.employeeName.localeCompare(b.employeeName))

    const grandTotalMinutes = employees.reduce((acc, employee) => acc + employee.totalMinutes, 0)
    const grandTotalPay = toCurrency(employees.reduce((acc, employee) => acc + employee.totalPay, 0))
    const uniqueWorkedDates = new Set(
      employees.flatMap((employee) => employee.days.map((day) => day.date)),
    )
    const workedDaysCount = uniqueWorkedDates.size

    return {
      employees,
      grandTotals: {
        totalMinutes: grandTotalMinutes,
        totalHours: toHours(grandTotalMinutes),
        totalPay: grandTotalPay,
        employeeCount: employees.length,
        workedDaysCount,
      },
    }
  }

  async function updateEmployeeDayAdjustment(
    employeeId: string,
    date: string,
    payload: UpdateEmployeeHoursSummaryAdjustmentAdminDTO,
  ): Promise<void> {
    if (!employeeId || !date) {
      throw new Error('Employee and date are required.')
    }

    const profile = await auth.getProfile()

    const { data: existing, error: fetchError } = await supabase
      .from(EMPLOYEE_ADJUSTMENTS_TABLE)
      .select('id')
      .eq('employee_id', employeeId)
      .eq('work_date', date)
      .maybeSingle()

    if (fetchError) {
      throw new Error(fetchError.message)
    }

    let adjustmentId = (existing as { id: string } | null)?.id ?? null

    if (!adjustmentId) {
      const { data: inserted, error: insertError } = await supabase
        .from(EMPLOYEE_ADJUSTMENTS_TABLE)
        .insert({
          employee_id: employeeId,
          work_date: date,
          special_hours: 0,
          start_extra_minutes: 0,
          end_extra_minutes: 0,
          other_extra_minutes: 0,
          manual_adjustment_minutes: 0,
            start_time: null,
            end_time: null,
          note: null,
          created_by_profile_id: profile.id,
          updated_by_profile_id: profile.id,
        })
        .select('id')
        .single()

      if (insertError || !inserted) {
        throw new Error(insertError?.message ?? 'Failed to create employee adjustment row.')
      }

      adjustmentId = (inserted as { id: string }).id
    }

    const updatePayload: Record<string, unknown> = {
      updated_by_profile_id: profile.id,
      updated_at: new Date().toISOString(),
    }

    if (payload.start_extra_minutes !== undefined) {
      updatePayload.start_extra_minutes = toSafeMinutes(payload.start_extra_minutes)
    }

    if (payload.end_extra_minutes !== undefined) {
      updatePayload.end_extra_minutes = toSafeMinutes(payload.end_extra_minutes)
    }

    if (payload.other_extra_minutes !== undefined) {
      updatePayload.other_extra_minutes = toSafeMinutes(payload.other_extra_minutes)
    }

    if (payload.manual_adjustment_minutes !== undefined) {
      updatePayload.manual_adjustment_minutes = toSafeSignedMinutes(payload.manual_adjustment_minutes)
    }

    if (payload.note !== undefined) {
      updatePayload.note = payload.note?.trim() || null
    }

    if (payload.special_hours !== undefined) {
      updatePayload.special_hours = toSafeHours(payload.special_hours)
    }

    if (payload.start_time !== undefined) {
      updatePayload.start_time = normalizeTimeValue(payload.start_time)
    }

    if (payload.end_time !== undefined) {
      updatePayload.end_time = normalizeTimeValue(payload.end_time)
    }

    const { error: updateError } = await supabase
      .from(EMPLOYEE_ADJUSTMENTS_TABLE)
      .update(updatePayload)
      .eq('id', adjustmentId)

    if (updateError) {
      throw new Error(updateError.message)
    }
  }

  return {
    getHoursSummary,
    updateEmployeeDayAdjustment,
  }
}
