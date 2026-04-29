import { calculatePricingItems } from '../utils/calculatePricingItems'
import { useSupabaseClient } from './useSupabaseClient'
import type { DailyTaskExtraItemDTO, PropertyPricingItemDTO } from '../../shared/types/PricingItemDTO'

const PUBLISHED_TABLE = 'team_time_entry_tasks_admin_published'

type PricingItemCategory = 'linen' | 'amenities'
type PropertyPricingItemScope = 'base' | 'default_extra'

interface PublishedInvoiceRow {
  work_date: string
  daily_task_id: string
  planned_minutes: number | null
  actual_minutes: number | null
  default_minutes_snapshot: number | null
  invoice_normal_minutes_snapshot: number | null
  invoice_extra_minutes_snapshot: number | null
  invoice_minutes_snapshot: number | null
  invoice_hours_snapshot: number | null
  invoice_amount_snapshot: number | null
  normal_time_amount_snapshot: number | null
  extra_time_amount_snapshot: number | null
  linen_amount_snapshot: number | null
  amenities_amount_snapshot: number | null
  total_amount_snapshot: number | null
}

interface DailyTaskInvoiceRow {
  id: string
  date: string
  property_id: string
}

interface PropertyInvoiceRow {
  id: string
  client_id: string
  name: string
  default_cleaning_minutes: number | null
  linen_pack_fee: number | null
  amenities_pack_fee: number | null
  includes_amenities: boolean | null
}

interface PricingItemRef {
  id: string
  name: string
  category: PricingItemCategory
  unit_price: number
  active: boolean
}

interface PropertyPricingItemRow {
  id: string
  property_id: string
  pricing_item_id: string
  scope: string
  quantity: number | null
  pricing_item: {
    id: string
    name: string
    category: string
    unit_price: number | null
    active: boolean | null
  } | Array<{
    id: string
    name: string
    category: string
    unit_price: number | null
    active: boolean | null
  }> | null
}

interface TaskExtraItemRow {
  id: string
  daily_task_id: string
  pricing_item_id: string
  quantity: number | null
  note: string | null
  pricing_item: {
    id: string
    name: string
    category: string
    unit_price: number | null
    active: boolean | null
  } | Array<{
    id: string
    name: string
    category: string
    unit_price: number | null
    active: boolean | null
  }> | null
}

interface ClientInvoiceRow {
  id: string
  name: string
  hourly_rate: number | null
  active: boolean
}

interface AggregatedInvoiceWorkRow {
  dailyTaskId: string
  workDate: string
  defaultMinutes: number
  plannedMinutes: number
  actualMinutes: number
  normalMinutes: number
  extraMinutes: number
  invoiceMinutes: number
  invoiceHours: number
  normalTimeAmountSnapshot: number | null
  extraTimeAmountSnapshot: number | null
  linenAmountSnapshot: number | null
  amenitiesAmountSnapshot: number | null
  totalAmountSnapshot: number | null
}

export interface ClientInvoiceFilterOption {
  id: string
  name: string
}

export interface ClientInvoiceLineItem {
  date: string
  propertyName: string
  normalMinutes: number
  extraMinutes: number
  invoiceHours: number
  plannedHours: number
  extraHours: number
  cleanRateExclGst: number
  extraTimeExclGst: number
  linenExclGst: number
  amenitiesExclGst: number
  linenPackFeeApplied: number
  amenitiesPackFeeApplied: number
  totalPackFeeApplied: number
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

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}

function toPropertyPricingItemDTO(row: PropertyPricingItemRow): PropertyPricingItemDTO {
  const pricingItem = unwrapRelation(row.pricing_item)

  return {
    id: row.id,
    property_id: row.property_id,
    pricing_item_id: row.pricing_item_id,
    scope: row.scope === 'default_extra' ? 'default_extra' : 'base',
    quantity: Number(row.quantity ?? 1),
    pricing_item: {
      id: pricingItem?.id ?? row.pricing_item_id,
      name: pricingItem?.name ?? '',
      category: pricingItem?.category === 'amenities' ? 'amenities' : 'linen',
      unit_price: Number(pricingItem?.unit_price ?? 0),
      active: pricingItem?.active ?? true,
    },
    created_at: '',
    updated_at: '',
  }
}

function toTaskExtraItemDTO(row: TaskExtraItemRow): DailyTaskExtraItemDTO {
  const pricingItem = unwrapRelation(row.pricing_item)

  return {
    id: row.id,
    daily_task_id: row.daily_task_id,
    pricing_item_id: row.pricing_item_id,
    quantity: Number(row.quantity ?? 1),
    note: row.note ?? null,
    pricing_item: {
      id: pricingItem?.id ?? row.pricing_item_id,
      name: pricingItem?.name ?? '',
      category: pricingItem?.category === 'amenities' ? 'amenities' : 'linen',
      unit_price: Number(pricingItem?.unit_price ?? 0),
      active: pricingItem?.active ?? true,
    },
    created_at: '',
    updated_at: '',
  }
}

function hasPublishedPricingSnapshot(row: AggregatedInvoiceWorkRow): boolean {
  return row.totalAmountSnapshot !== null
    || row.normalTimeAmountSnapshot !== null
    || row.extraTimeAmountSnapshot !== null
    || row.linenAmountSnapshot !== null
    || row.amenitiesAmountSnapshot !== null
}

function calculatePackFeeApplied(input: {
  baseLinen: number
  extraLinen: number
  baseAmenities: number
  extraAmenities: number
  linenPackFee: number | null
  amenitiesPackFee: number | null
  includesAmenities: boolean | null
}): { linenPackFeeApplied: number; amenitiesPackFeeApplied: number; totalPackFeeApplied: number } {
  const linenPackFee = toSafeCurrency(Number(input.linenPackFee ?? 0))
  const amenitiesPackFee = toSafeCurrency(Number(input.amenitiesPackFee ?? 0))

  const linenPackFeeApplied = (input.baseLinen + input.extraLinen) > 0
    ? linenPackFee
    : 0

  const amenitiesPackFeeApplied = input.includesAmenities === false
    ? 0
    : ((input.baseAmenities + input.extraAmenities) > 0 ? amenitiesPackFee : 0)

  return {
    linenPackFeeApplied,
    amenitiesPackFeeApplied,
    totalPackFeeApplied: toSafeCurrency(linenPackFeeApplied + amenitiesPackFeeApplied),
  }
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
      .select('work_date, daily_task_id, planned_minutes, actual_minutes, default_minutes_snapshot, invoice_normal_minutes_snapshot, invoice_extra_minutes_snapshot, invoice_minutes_snapshot, invoice_hours_snapshot, invoice_amount_snapshot, normal_time_amount_snapshot, extra_time_amount_snapshot, linen_amount_snapshot, amenities_amount_snapshot, total_amount_snapshot')
      .gte('work_date', startDate)
      .lte('work_date', endDate)

    if (publishedResult.error) {
      throw toPublishedSchemaError(publishedResult.error)
    }

    const publishedRows = (publishedResult.data ?? []) as PublishedInvoiceRow[]
    const dailyTaskIds = Array.from(new Set(publishedRows.map((row) => row.daily_task_id).filter((id): id is string => Boolean(id))))

    const clientResult = await supabase
      .from('clients')
      .select('id, name, hourly_rate, active')
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
      .select('id, date, property_id')
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

    const [propertiesResult, propertyPricingItemsResult, taskExtraItemsResult] = await Promise.all([
      supabase
        .from('properties')
        .select('id, client_id, name, default_cleaning_minutes, linen_pack_fee, amenities_pack_fee, includes_amenities')
        .in('id', propertyIds)
        .eq('client_id', clientId),
      supabase
        .from('property_pricing_items')
        .select('id, property_id, pricing_item_id, scope, quantity, pricing_item:pricing_items(id, name, category, unit_price, active)')
        .in('property_id', propertyIds),
      supabase
        .from('daily_task_extra_items')
        .select('id, daily_task_id, pricing_item_id, quantity, note, pricing_item:pricing_items(id, name, category, unit_price, active)')
        .in('daily_task_id', dailyTaskIds),
    ])

    if (propertiesResult.error) {
      throw new Error(propertiesResult.error.message)
    }

    if (propertyPricingItemsResult.error) {
      throw new Error(propertyPricingItemsResult.error.message)
    }

    if (taskExtraItemsResult.error) {
      throw new Error(taskExtraItemsResult.error.message)
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

    const propertyPricingItemsByPropertyId = new Map<string, PropertyPricingItemDTO[]>()
    for (const row of ((propertyPricingItemsResult.data ?? []) as PropertyPricingItemRow[]).map(toPropertyPricingItemDTO)) {
      const current = propertyPricingItemsByPropertyId.get(row.property_id) ?? []
      current.push(row)
      propertyPricingItemsByPropertyId.set(row.property_id, current)
    }

    const taskExtraItemsByTaskId = new Map<string, DailyTaskExtraItemDTO[]>()
    for (const row of ((taskExtraItemsResult.data ?? []) as TaskExtraItemRow[]).map(toTaskExtraItemDTO)) {
      const current = taskExtraItemsByTaskId.get(row.daily_task_id) ?? []
      current.push(row)
      taskExtraItemsByTaskId.set(row.daily_task_id, current)
    }

    const taskMap = new Map(taskRows.map((task) => [task.id, task]))
    const aggregatedByTask = new Map<string, AggregatedInvoiceWorkRow>()

    for (const row of publishedRows) {
      const plannedMinutes = toSafeMinutes(row.planned_minutes)
      const actualMinutes = toSafeMinutes(row.actual_minutes)
      const defaultMinutes = toSafeMinutes(row.default_minutes_snapshot)
      const normalMinutes = defaultMinutes
      const extraMinutes = Math.max(actualMinutes - defaultMinutes, 0)
      const invoiceMinutes = normalMinutes + extraMinutes
      const invoiceHours = toHours(invoiceMinutes)
      const existing = aggregatedByTask.get(row.daily_task_id)

      if (!existing) {
        aggregatedByTask.set(row.daily_task_id, {
          dailyTaskId: row.daily_task_id,
          workDate: row.work_date,
          defaultMinutes,
          plannedMinutes,
          actualMinutes,
          normalMinutes,
          extraMinutes,
          invoiceMinutes,
          invoiceHours,
          normalTimeAmountSnapshot: row.normal_time_amount_snapshot,
          extraTimeAmountSnapshot: row.extra_time_amount_snapshot,
          linenAmountSnapshot: row.linen_amount_snapshot,
          amenitiesAmountSnapshot: row.amenities_amount_snapshot,
          totalAmountSnapshot: row.total_amount_snapshot,
        })
        continue
      }

  existing.defaultMinutes = Math.max(existing.defaultMinutes, defaultMinutes)
      existing.plannedMinutes = Math.max(existing.plannedMinutes, plannedMinutes)
      existing.actualMinutes = Math.max(existing.actualMinutes, actualMinutes)
  existing.normalMinutes = Math.max(existing.normalMinutes, normalMinutes)
  existing.extraMinutes = Math.max(existing.extraMinutes, extraMinutes)
      existing.invoiceMinutes = Math.max(existing.invoiceMinutes, invoiceMinutes)
      existing.invoiceHours = Math.max(existing.invoiceHours, invoiceHours)
      existing.normalTimeAmountSnapshot ??= row.normal_time_amount_snapshot
      existing.extraTimeAmountSnapshot ??= row.extra_time_amount_snapshot
      existing.linenAmountSnapshot ??= row.linen_amount_snapshot
      existing.amenitiesAmountSnapshot ??= row.amenities_amount_snapshot
      existing.totalAmountSnapshot ??= row.total_amount_snapshot
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

      const defaultMinutes = aggregated.defaultMinutes > 0
        ? aggregated.defaultMinutes
        : toSafeMinutes(property.default_cleaning_minutes)
      const normalMinutes = defaultMinutes
      const extraMinutes = Math.max(aggregated.actualMinutes - defaultMinutes, 0)
      const invoiceMinutes = normalMinutes + extraMinutes
      const propertyPricingItems = propertyPricingItemsByPropertyId.get(property.id) ?? []
      const taskExtraItems = taskExtraItemsByTaskId.get(task.id) ?? []
      const pricing = calculatePricingItems({
        propertyBaseItems: propertyPricingItems.filter((item) => item.scope === 'base'),
        propertyDefaultExtraItems: propertyPricingItems.filter((item) => item.scope === 'default_extra'),
        taskExtraItems,
        linenPackFee: Number(property.linen_pack_fee ?? 0),
        amenitiesPackFee: Number(property.amenities_pack_fee ?? 0),
        includesAmenities: property.includes_amenities !== false,
      })
      const packFeeApplied = calculatePackFeeApplied({
        baseLinen: pricing.baseLinen,
        extraLinen: pricing.extraLinen,
        baseAmenities: pricing.baseAmenities,
        extraAmenities: pricing.extraAmenities,
        linenPackFee: property.linen_pack_fee,
        amenitiesPackFee: property.amenities_pack_fee,
        includesAmenities: property.includes_amenities,
      })

      let cleanRate = 0
      let extraTimeAmount = 0
      let linenAmount = 0
      let amenitiesAmount = 0
      let lineTotal = 0
      const ratePerHour = toSafeRate(client.hourly_rate)

      if (hasPublishedPricingSnapshot(aggregated)) {
        cleanRate = toSafeCurrency(aggregated.normalTimeAmountSnapshot)
        extraTimeAmount = toSafeCurrency((extraMinutes / 60) * ratePerHour)
        linenAmount = toSafeCurrency(aggregated.linenAmountSnapshot)
        amenitiesAmount = toSafeCurrency(aggregated.amenitiesAmountSnapshot)
        lineTotal = aggregated.totalAmountSnapshot !== null && aggregated.totalAmountSnapshot !== undefined
          ? toSafeCurrency(aggregated.totalAmountSnapshot)
          : toSafeCurrency(cleanRate + extraTimeAmount + linenAmount + amenitiesAmount)
      } else {
        // Billing totals intentionally use only pricing_items selections.
        // Operational chocolate flags/quantities are excluded to avoid duplicate charging.

        cleanRate = toSafeCurrency((normalMinutes / 60) * ratePerHour)
        extraTimeAmount = toSafeCurrency((extraMinutes / 60) * ratePerHour)
        linenAmount = toSafeCurrency(pricing.linenTotal)
        amenitiesAmount = toSafeCurrency(pricing.amenitiesTotal)
        lineTotal = toSafeCurrency(cleanRate + extraTimeAmount + linenAmount + amenitiesAmount)
      }

      rows.push({
        date: task.date || aggregated.workDate,
        propertyName: property.name,
        normalMinutes,
        extraMinutes,
        invoiceHours: toSafeHours(toHours(invoiceMinutes)),
        plannedHours: toSafeHours(toHours(normalMinutes)),
        extraHours: toSafeHours(toHours(extraMinutes)),
        cleanRateExclGst: cleanRate,
        extraTimeExclGst: extraTimeAmount,
        linenExclGst: linenAmount,
        amenitiesExclGst: amenitiesAmount,
        linenPackFeeApplied: packFeeApplied.linenPackFeeApplied,
        amenitiesPackFeeApplied: packFeeApplied.amenitiesPackFeeApplied,
        totalPackFeeApplied: packFeeApplied.totalPackFeeApplied,
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
