import { useSupabaseClient } from './useSupabaseClient'
import type { DailyTaskExtraItemDTO, DailyTaskExtraItemInput } from '../../shared/types/PricingItemDTO'

interface DailyTaskExtraItemRow {
  id: string
  daily_task_id: string
  pricing_item_id: string
  quantity: number | null
  note: string | null
  created_at: string | null
  updated_at: string | null
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

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}

function toDTO(row: DailyTaskExtraItemRow): DailyTaskExtraItemDTO {
  const pricingItem = unwrapRelation(row.pricing_item)

  return {
    id: row.id,
    daily_task_id: row.daily_task_id,
    pricing_item_id: row.pricing_item_id,
    quantity: Number(row.quantity ?? 1),
    note: row.note,
    pricing_item: {
      id: pricingItem?.id ?? row.pricing_item_id,
      name: pricingItem?.name ?? '',
      category: pricingItem?.category === 'amenities' ? 'amenities' : 'linen',
      unit_price: Number(pricingItem?.unit_price ?? 0),
      active: pricingItem?.active ?? true,
    },
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
  }
}

const SELECT_FIELDS = 'id, daily_task_id, pricing_item_id, quantity, note, created_at, updated_at, pricing_item:pricing_items(id, name, category, unit_price, active)'

function mergeNotes(first: string | null, second: string | null): string | null {
  const values = [first?.trim() ?? '', second?.trim() ?? ''].filter((value) => value.length > 0)
  if (values.length === 0) {
    return null
  }

  return Array.from(new Set(values)).join(' | ')
}

function normalizeExtraItems(items: DailyTaskExtraItemInput[]): DailyTaskExtraItemInput[] {
  const merged = new Map<string, { quantity: number; note: string | null }>()

  for (const item of items) {
    const pricingItemId = item.pricing_item_id.trim()
    if (!pricingItemId) {
      continue
    }

    const quantity = Math.max(1, Number(item.quantity ?? 1))
    const note = item.note?.trim() || null
    const existing = merged.get(pricingItemId)

    if (!existing) {
      merged.set(pricingItemId, { quantity, note })
      continue
    }

    existing.quantity += quantity
    existing.note = mergeNotes(existing.note, note)
  }

  return Array.from(merged.entries()).map(([pricing_item_id, value]) => ({
    pricing_item_id,
    quantity: value.quantity,
    note: value.note,
  }))
}

export function useDailyTaskExtraItems() {
  const supabase = useSupabaseClient()

  async function getTaskExtraItems(taskId: string): Promise<DailyTaskExtraItemDTO[]> {
    const { data, error } = await supabase
      .from('daily_task_extra_items')
      .select(SELECT_FIELDS)
      .eq('daily_task_id', taskId)

    if (error) {
      throw new Error(error.message)
    }

    return ((data ?? []) as DailyTaskExtraItemRow[]).map(toDTO)
  }

  async function getTaskExtraItemsBatch(taskIds: string[]): Promise<DailyTaskExtraItemDTO[]> {
    if (taskIds.length === 0) {
      return []
    }

    const { data, error } = await supabase
      .from('daily_task_extra_items')
      .select(SELECT_FIELDS)
      .in('daily_task_id', taskIds)

    if (error) {
      throw new Error(error.message)
    }

    return ((data ?? []) as DailyTaskExtraItemRow[]).map(toDTO)
  }

  async function setTaskExtraItems(taskId: string, items: DailyTaskExtraItemInput[]): Promise<void> {
    const normalizedItems = normalizeExtraItems(items)

    const { error: deleteError } = await supabase
      .from('daily_task_extra_items')
      .delete()
      .eq('daily_task_id', taskId)

    if (deleteError) {
      throw new Error(deleteError.message)
    }

    if (normalizedItems.length === 0) {
      return
    }

    const rows = normalizedItems.map((item) => ({
      daily_task_id: taskId,
      pricing_item_id: item.pricing_item_id,
      quantity: item.quantity,
      note: item.note,
    }))

    const { error: insertError } = await supabase
      .from('daily_task_extra_items')
      .insert(rows)

    if (insertError) {
      throw new Error(insertError.message)
    }
  }

  return {
    getTaskExtraItems,
    getTaskExtraItemsBatch,
    setTaskExtraItems,
  }
}
