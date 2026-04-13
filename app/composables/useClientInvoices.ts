import { useSupabaseClient } from './useSupabaseClient'

const PUBLISHED_TABLE = 'team_time_entry_tasks_admin_published'

interface PublishedInvoiceRow {
  work_date: string
  daily_task_id: string
  planned_minutes: number | null
  actual_minutes: number | null
  invoice_minutes_snapshot: number | null
  invoice_hours_snapshot: number | null
  invoice_amount_snapshot: number | null
}

interface DailyTaskInvoiceRow {
  id: string
  date: string
  property_id: string
  tags: unknown
}

interface PropertyInvoiceRow {
  id: string
  client_id: string
  name: string
  default_tags: unknown
}

interface ClientInvoiceRow {
  id: string
  name: string
  hourly_rate: number | null
  linen_combo_price: number | null
  amenities_combo_price: number | null
  active: boolean
}

interface AggregatedInvoiceWorkRow {
  dailyTaskId: string
  workDate: string
  plannedMinutes: number
  actualMinutes: number
  invoiceMinutes: number
  invoiceHours: number
}

export interface ClientInvoiceFilterOption {
  id: string
  name: string
}

export interface ClientInvoiceLineItem {
  date: string
  propertyName: string
  invoiceHours: number
  plannedHours: number
  extraHours: number
  cleanRateExclGst: number
  extraExclGst: number
  linenExclGst: number
  amenitiesExclGst: number
  totalExclGst: number
}

export interface ClientInvoicePreview {
  clientId: string
  clientName: string
  periodStart: string
  periodEnd: string
  rows: ClientInvoiceLineItem[]
  totalInvoiceHours: number
  totalInvoiceAmount: number
}

function normalizeTagValue(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function normalizeTagList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  const normalized = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => normalizeTagValue(item))
    .filter((item) => item.length > 0)

  return Array.from(new Set(normalized))
}

function hasAnyTag(tags: string[], candidates: string[]): boolean {
  return candidates.some((candidate) => tags.includes(candidate))
}

function toSafeMinutes(value: number | null | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
    return 0
  }

  return Math.round(value)
}

function toSafeCurrency(value: number | null | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0
  }

  return Number(value.toFixed(2))
}

function toSafeRate(value: number | null | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
    return 0
  }

  return Number(value)
}

function toSafeHours(value: number | null | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
    return 0
  }

  return Number(value.toFixed(2))
}

function toHours(minutes: number): number {
  return Number((minutes / 60).toFixed(2))
}

function toPublishedSchemaError(error: { message?: string } | null | undefined): Error {
  const source = error?.message?.trim() || 'Unknown error'
  return new Error(`Published invoice schema mismatch in ${PUBLISHED_TABLE}. Details: ${source}`)
}

export function useClientInvoices() {
  const supabase = useSupabaseClient()

  async function getInvoiceClients(): Promise<ClientInvoiceFilterOption[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, active')
      .eq('active', true)
      .order('name', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return ((data ?? []) as Array<{ id: string; name: string }>).map((row) => ({
      id: row.id,
      name: row.name,
    }))
  }

  async function getClientInvoicePreview(startDate: string, endDate: string, clientId: string): Promise<ClientInvoicePreview | null> {
    if (!startDate || !endDate || !clientId) {
      throw new Error('Start date, end date and client are required.')
    }

    if (startDate > endDate) {
      throw new Error('Start date must be before or equal to end date.')
    }

    const publishedResult = await supabase
      .from(PUBLISHED_TABLE)
      .select('work_date, daily_task_id, planned_minutes, actual_minutes, invoice_minutes_snapshot, invoice_hours_snapshot, invoice_amount_snapshot')
      .gte('work_date', startDate)
      .lte('work_date', endDate)

    if (publishedResult.error) {
      throw toPublishedSchemaError(publishedResult.error)
    }

    const publishedRows = (publishedResult.data ?? []) as PublishedInvoiceRow[]
    const dailyTaskIds = Array.from(new Set(publishedRows.map((row) => row.daily_task_id).filter((id): id is string => Boolean(id))))

    const clientResult = await supabase
      .from('clients')
      .select('id, name, hourly_rate, linen_combo_price, amenities_combo_price, active')
      .eq('id', clientId)
      .maybeSingle<ClientInvoiceRow>()

    if (clientResult.error) {
      throw new Error(clientResult.error.message)
    }

    const client = clientResult.data
    if (!client) {
      return null
    }

    if (dailyTaskIds.length === 0) {
      return {
        clientId,
        clientName: client.name,
        periodStart: startDate,
        periodEnd: endDate,
        rows: [],
        totalInvoiceHours: 0,
        totalInvoiceAmount: 0,
      }
    }

    const tasksResult = await supabase
      .from('daily_tasks')
      .select('id, date, property_id, tags')
      .in('id', dailyTaskIds)

    if (tasksResult.error) {
      throw new Error(tasksResult.error.message)
    }

    const taskRows = (tasksResult.data ?? []) as DailyTaskInvoiceRow[]
    const propertyIds = Array.from(new Set(taskRows.map((task) => task.property_id).filter((id): id is string => Boolean(id))))

    if (propertyIds.length === 0) {
      return {
        clientId,
        clientName: client.name,
        periodStart: startDate,
        periodEnd: endDate,
        rows: [],
        totalInvoiceHours: 0,
        totalInvoiceAmount: 0,
      }
    }

    const propertiesResult = await supabase
      .from('properties')
      .select('id, client_id, name, default_tags')
      .in('id', propertyIds)
      .eq('client_id', clientId)

    if (propertiesResult.error) {
      throw new Error(propertiesResult.error.message)
    }

    const propertyRows = (propertiesResult.data ?? []) as PropertyInvoiceRow[]
    const propertyMap = new Map(propertyRows.map((property) => [property.id, property]))

    if (propertyRows.length === 0) {
      return {
        clientId,
        clientName: client.name,
        periodStart: startDate,
        periodEnd: endDate,
        rows: [],
        totalInvoiceHours: 0,
        totalInvoiceAmount: 0,
      }
    }

    const taskMap = new Map(taskRows.map((task) => [task.id, task]))
    const aggregatedByTask = new Map<string, AggregatedInvoiceWorkRow>()

    for (const row of publishedRows) {
      const plannedMinutes = toSafeMinutes(row.planned_minutes)
      const actualMinutes = toSafeMinutes(row.actual_minutes)
      const extraMinutes = Math.max(actualMinutes - plannedMinutes, 0)
      const invoiceMinutes = plannedMinutes + extraMinutes
      const invoiceHours = toHours(invoiceMinutes)
      const existing = aggregatedByTask.get(row.daily_task_id)

      if (!existing) {
        aggregatedByTask.set(row.daily_task_id, {
          dailyTaskId: row.daily_task_id,
          workDate: row.work_date,
          plannedMinutes,
          actualMinutes,
          invoiceMinutes,
          invoiceHours,
        })
        continue
      }

      existing.plannedMinutes = Math.max(existing.plannedMinutes, plannedMinutes)
      existing.actualMinutes = Math.max(existing.actualMinutes, actualMinutes)
      existing.invoiceMinutes = Math.max(existing.invoiceMinutes, invoiceMinutes)
      existing.invoiceHours = Math.max(existing.invoiceHours, invoiceHours)
    }

    const rows: ClientInvoiceLineItem[] = []

    for (const aggregated of aggregatedByTask.values()) {
      const task = taskMap.get(aggregated.dailyTaskId)
      if (!task) {
        continue
      }

      const property = propertyMap.get(task.property_id)
      if (!property) {
        continue
      }

      const taskTags = normalizeTagList(task.tags)
      const propertyDefaultTags = normalizeTagList(property.default_tags)
      const mergedTags = Array.from(new Set([...taskTags, ...propertyDefaultTags]))

      const hasLinenCombo = hasAnyTag(mergedTags, ['linen', 'linen combo'])
      const hasAmenitiesCombo = hasAnyTag(mergedTags, ['amenities', 'amenities combo'])

      const ratePerHour = toSafeRate(client.hourly_rate)
      const plannedMinutes = aggregated.plannedMinutes
      const extraMinutes = Math.max(aggregated.actualMinutes - plannedMinutes, 0)
      const cleanRate = toSafeCurrency(toHours(plannedMinutes) * ratePerHour)
      const extraTimeAmount = toSafeCurrency(toHours(extraMinutes) * ratePerHour)
      const linenCombo = hasLinenCombo ? toSafeRate(client.linen_combo_price) : 0
      const amenitiesCombo = hasAmenitiesCombo ? toSafeRate(client.amenities_combo_price) : 0
      const lineTotal = toSafeCurrency(cleanRate + extraTimeAmount + linenCombo + amenitiesCombo)

      rows.push({
        date: task.date || aggregated.workDate,
        propertyName: property.name,
        invoiceHours: toSafeHours(aggregated.invoiceHours),
        plannedHours: toSafeHours(toHours(plannedMinutes)),
        extraHours: toSafeHours(toHours(extraMinutes)),
        cleanRateExclGst: cleanRate,
        extraExclGst: extraTimeAmount,
        linenExclGst: toSafeCurrency(linenCombo),
        amenitiesExclGst: toSafeCurrency(amenitiesCombo),
        totalExclGst: lineTotal,
      })
    }

    rows.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date)
      if (dateCompare !== 0) {
        return dateCompare
      }

      return a.propertyName.localeCompare(b.propertyName)
    })

    const totalInvoiceHours = toSafeHours(rows.reduce((acc, row) => acc + row.invoiceHours, 0))
    const totalInvoiceAmount = toSafeCurrency(rows.reduce((acc, row) => acc + row.totalExclGst, 0))

    return {
      clientId,
      clientName: client.name,
      periodStart: startDate,
      periodEnd: endDate,
      rows,
      totalInvoiceHours,
      totalInvoiceAmount,
    }
  }

  return {
    getInvoiceClients,
    getClientInvoicePreview,
  }
}