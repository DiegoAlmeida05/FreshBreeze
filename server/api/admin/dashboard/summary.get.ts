import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createError, defineEventHandler, getHeader, getQuery } from 'h3'
import type { H3Event } from 'h3'
import { isPlatformOwnerEmail } from '../../../utils/platformOwner'

type UserRole = 'admin' | 'worker'

type RevenueSource = 'invoice_snapshot' | 'task_rate_fallback'

interface AuthProfile {
  id: string
  role: UserRole
  active: boolean
  email: string | null
}

interface PropertyRow {
  id: string
  name: string
  client_id: string
  default_cleaning_minutes: number | null
  active: boolean | null
}

interface ClientRow {
  id: string
  name: string
  hourly_rate: number | null
  active: boolean | null
}

interface EmployeeRow {
  id: string
  profile_id: string | null
  full_name: string | null
  email: string | null
  active: boolean | null
  hourly_rate_weekday: number | null
}

interface ProfileRoleRow {
  id: string
  role: UserRole
  email: string | null
  active: boolean
}

interface DailyTaskRow {
  id: string
  date: string
  property_id: string
  cleaning_minutes_override: number | null
}

interface TimesheetRow {
  employee_id: string
  work_date: string
  worked_hours: number | null
  estimated_pay: number | null
  applied_hourly_rate: number | null
}

interface PublishedInvoiceSnapshotRow {
  work_date: string
  total_amount_snapshot: number | null
}

interface EmployeeKpiAccumulator {
  name: string
  workedHours: number
  estimatedLaborCost: number
}

function parseDate(value: unknown, label: string): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw createError({ statusCode: 400, statusMessage: `${label} must be in YYYY-MM-DD format.` })
  }

  return value
}

function toSafeNumber(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function toHours(minutes: number): number {
  return Number((minutes / 60).toFixed(2))
}

function round2(value: number): number {
  return Number(value.toFixed(2))
}

async function requireAdminUser(event: H3Event, adminClient: SupabaseClient): Promise<void> {
  const authorization = getHeader(event, 'authorization')
  const accessToken = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : null

  if (!accessToken) {
    throw createError({ statusCode: 401, statusMessage: 'Missing authorization token.' })
  }

  const { data: requesterData, error: requesterError } = await adminClient.auth.getUser(accessToken)

  if (requesterError || !requesterData.user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid authorization token.' })
  }

  const { data: requesterProfile, error: requesterProfileError } = await adminClient
    .from('profiles')
    .select('id, role, active, email')
    .eq('id', requesterData.user.id)
    .maybeSingle<AuthProfile>()

  if (requesterProfileError || !requesterProfile || !requesterProfile.active || requesterProfile.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Only admins can perform this action.' })
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const supabaseUrl = config.public.supabaseUrl
  const supabaseServiceRoleKey = config.supabaseServiceRoleKey

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Server configuration is missing Supabase credentials.',
    })
  }

  const query = getQuery(event)
  const from = parseDate(query.from, 'from')
  const to = parseDate(query.to, 'to')

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey)
  await requireAdminUser(event, adminClient)

  const [propertiesResult, clientsResult, employeesResult, tasksResult, timesheetResult] = await Promise.all([
    adminClient
      .from('properties')
      .select('id, name, client_id, default_cleaning_minutes, active'),
    adminClient
      .from('clients')
      .select('id, name, hourly_rate, active'),
    adminClient
      .from('employees')
      .select('id, profile_id, full_name, email, active, hourly_rate_weekday'),
    adminClient
      .from('daily_tasks')
      .select('id, date, property_id, cleaning_minutes_override')
      .gte('date', from)
      .lte('date', to),
    adminClient
      .from('worker_timesheet_entries')
      .select('employee_id, work_date, worked_hours, estimated_pay, applied_hourly_rate')
      .gte('work_date', from)
      .lte('work_date', to),
  ])

  if (propertiesResult.error) {
    throw createError({ statusCode: 500, statusMessage: propertiesResult.error.message })
  }

  if (clientsResult.error) {
    throw createError({ statusCode: 500, statusMessage: clientsResult.error.message })
  }

  if (employeesResult.error) {
    throw createError({ statusCode: 500, statusMessage: employeesResult.error.message })
  }

  if (tasksResult.error) {
    throw createError({ statusCode: 500, statusMessage: tasksResult.error.message })
  }

  if (timesheetResult.error) {
    throw createError({ statusCode: 500, statusMessage: timesheetResult.error.message })
  }

  const properties = (propertiesResult.data ?? []) as PropertyRow[]
  const clients = (clientsResult.data ?? []) as ClientRow[]
  const employees = (employeesResult.data ?? []) as EmployeeRow[]
  const tasks = (tasksResult.data ?? []) as DailyTaskRow[]
  const timesheets = (timesheetResult.data ?? []) as TimesheetRow[]

  const profileIds = employees
    .map((employee) => employee.profile_id)
    .filter((profileId): profileId is string => typeof profileId === 'string' && profileId.length > 0)

  let profileRoleMap = new Map<string, ProfileRoleRow>()

  if (profileIds.length > 0) {
    const { data: profileData, error: profileError } = await adminClient
      .from('profiles')
      .select('id, role, email, active')
      .in('id', profileIds)

    if (profileError) {
      throw createError({ statusCode: 500, statusMessage: profileError.message })
    }

    profileRoleMap = new Map(((profileData ?? []) as ProfileRoleRow[]).map((row) => [row.id, row]))
  }

  const hasPropertyActiveFlag = properties.some((property) => typeof property.active === 'boolean')
  const totalProperties = hasPropertyActiveFlag
    ? properties.filter((property) => property.active !== false).length
    : properties.length

  const hasClientActiveFlag = clients.some((client) => typeof client.active === 'boolean')
  const totalClients = hasClientActiveFlag
    ? clients.filter((client) => client.active !== false).length
    : clients.length

  let activeAdmins = 0
  let activeWorkers = 0

  const filteredEmployees = employees.filter((employee) => {
    const employeeProfile = employee.profile_id ? profileRoleMap.get(employee.profile_id) : undefined
    const activeFlag = typeof employee.active === 'boolean'
      ? employee.active
      : employeeProfile?.active !== false

    if (!activeFlag) {
      return false
    }

    const ownerEmail = employeeProfile?.email ?? employee.email
    if (isPlatformOwnerEmail(ownerEmail)) {
      return false
    }

    if (employeeProfile?.role === 'admin') {
      activeAdmins += 1
    } else {
      activeWorkers += 1
    }

    return true
  })

  const totalEmployees = filteredEmployees.length

  const propertyMap = new Map(properties.map((property) => [property.id, property]))
  const clientMap = new Map(clients.map((client) => [client.id, client]))
  const employeeMap = new Map(filteredEmployees.map((employee) => [employee.id, employee]))

  const propertyActivity = new Map<string, { name: string; taskCount: number; plannedMinutes: number }>()
  const clientActivity = new Map<string, { name: string; taskCount: number; plannedMinutes: number }>()

  let plannedMinutes = 0

  for (const task of tasks) {
    const property = propertyMap.get(task.property_id)
    if (!property) {
      continue
    }

    const overrideMinutes = toSafeNumber(task.cleaning_minutes_override)
    const defaultMinutes = toSafeNumber(property.default_cleaning_minutes)
    const taskMinutes = overrideMinutes > 0 ? overrideMinutes : defaultMinutes

    plannedMinutes += taskMinutes

    const propertyEntry = propertyActivity.get(property.id) ?? {
      name: property.name,
      taskCount: 0,
      plannedMinutes: 0,
    }
    propertyEntry.taskCount += 1
    propertyEntry.plannedMinutes += taskMinutes
    propertyActivity.set(property.id, propertyEntry)

    const client = clientMap.get(property.client_id)
    if (client) {
      const clientEntry = clientActivity.get(client.id) ?? {
        name: client.name,
        taskCount: 0,
        plannedMinutes: 0,
      }
      clientEntry.taskCount += 1
      clientEntry.plannedMinutes += taskMinutes
      clientActivity.set(client.id, clientEntry)
    }
  }

  let workedHours = 0
  let estimatedLaborCost = 0

  const employeeHours = new Map<string, EmployeeKpiAccumulator>()

  for (const row of timesheets) {
    const employee = employeeMap.get(row.employee_id)

    if (!employee) {
      continue
    }

    const rowWorkedHours = toSafeNumber(row.worked_hours)
    workedHours += rowWorkedHours

    const rowEstimatedPay = toSafeNumber(row.estimated_pay)
    const appliedRate = toSafeNumber(row.applied_hourly_rate)
    const fallbackRate = toSafeNumber(employee.hourly_rate_weekday)
    const effectiveRate = appliedRate > 0 ? appliedRate : fallbackRate
    const computedPay = rowEstimatedPay > 0 ? rowEstimatedPay : (rowWorkedHours * effectiveRate)

    estimatedLaborCost += computedPay

    const hoursAccumulator = employeeHours.get(row.employee_id) ?? {
      name: employee.full_name?.trim() || 'Employee',
      workedHours: 0,
      estimatedLaborCost: 0,
    }
    hoursAccumulator.workedHours += rowWorkedHours
    hoursAccumulator.estimatedLaborCost += computedPay
    employeeHours.set(row.employee_id, hoursAccumulator)
  }

  let estimatedRevenue = 0
  let revenueSource: RevenueSource = 'task_rate_fallback'

  let snapshotLoaded = false
  const snapshotResult = await adminClient
    .from('team_time_entry_tasks_admin_published')
    .select('work_date, total_amount_snapshot')
    .gte('work_date', from)
    .lte('work_date', to)

  if (!snapshotResult.error) {
    snapshotLoaded = true
    const snapshots = (snapshotResult.data ?? []) as PublishedInvoiceSnapshotRow[]

    for (const snapshot of snapshots) {
      estimatedRevenue += toSafeNumber(snapshot.total_amount_snapshot)
    }
  }

  if (!snapshotLoaded || estimatedRevenue <= 0) {
    estimatedRevenue = 0

    for (const task of tasks) {
      const property = propertyMap.get(task.property_id)
      if (!property) {
        continue
      }

      const client = clientMap.get(property.client_id)
      const clientRate = toSafeNumber(client?.hourly_rate)
      if (clientRate <= 0) {
        continue
      }

      const overrideMinutes = toSafeNumber(task.cleaning_minutes_override)
      const defaultMinutes = toSafeNumber(property.default_cleaning_minutes)
      const taskMinutes = overrideMinutes > 0 ? overrideMinutes : defaultMinutes

      estimatedRevenue += toHours(taskMinutes) * clientRate
    }

    revenueSource = 'task_rate_fallback'
  } else {
    revenueSource = 'invoice_snapshot'
  }

  const plannedHours = toHours(plannedMinutes)
  const plannedVsWorkedPct = plannedHours > 0
    ? round2((workedHours / plannedHours) * 100)
    : 0

  const estimatedMargin = estimatedRevenue - estimatedLaborCost

  return {
    period: { from, to },
    kpis: {
      totalProperties,
      totalEmployees,
      totalClients,
      plannedHours: round2(plannedHours),
      workedHours: round2(workedHours),
      plannedVsWorkedPct,
      estimatedRevenue: round2(estimatedRevenue),
      estimatedLaborCost: round2(estimatedLaborCost),
      estimatedMargin: round2(estimatedMargin),
      activeAdmins,
      activeWorkers,
      revenueSource,
      isEstimated: true,
    },
    sections: {
      propertyActivity: Array.from(propertyActivity.entries())
        .map(([propertyId, entry]) => ({
          propertyId,
          name: entry.name,
          taskCount: entry.taskCount,
          plannedHours: round2(toHours(entry.plannedMinutes)),
        }))
        .sort((a, b) => b.taskCount - a.taskCount)
        .slice(0, 12),
      employeeHours: Array.from(employeeHours.entries())
        .map(([employeeId, entry]) => ({
          employeeId,
          name: entry.name,
          workedHours: round2(entry.workedHours),
          estimatedLaborCost: round2(entry.estimatedLaborCost),
        }))
        .sort((a, b) => b.workedHours - a.workedHours)
        .slice(0, 12),
      clientTaskCounts: Array.from(clientActivity.entries())
        .map(([clientId, entry]) => ({
          clientId,
          name: entry.name,
          taskCount: entry.taskCount,
          plannedHours: round2(toHours(entry.plannedMinutes)),
        }))
        .sort((a, b) => b.taskCount - a.taskCount)
        .slice(0, 12),
      plannedWorkedDetails: {
        plannedHours: round2(plannedHours),
        workedHours: round2(workedHours),
        gapHours: round2(workedHours - plannedHours),
        percentage: plannedVsWorkedPct,
      },
      financialDetails: {
        estimatedRevenue: round2(estimatedRevenue),
        estimatedLaborCost: round2(estimatedLaborCost),
        estimatedMargin: round2(estimatedMargin),
        revenueSourceLabel: revenueSource === 'invoice_snapshot'
          ? 'Estimated from invoice snapshots'
          : 'Estimated from task duration x client hourly rate',
      },
    },
  }
})
