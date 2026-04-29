import { useSupabaseClient } from './useSupabaseClient'
import type { PropertyPricingItemDTO, PropertyPricingItemInput } from '../../shared/types/PricingItemDTO'

interface PropertyPricingItemRow {
  id: string
  property_id: string
  pricing_item_id: string
  scope: string
  quantity: number | null
  created_at: string | null
  updated_at: string | null
  pricing_item: {
    id: string
    name: string
    category: string
    unit_price: number | null
    active: boolean | null
  } | null
}

function toDTO(row: PropertyPricingItemRow): PropertyPricingItemDTO {
  return {
    id: row.id,
    property_id: row.property_id,
    pricing_item_id: row.pricing_item_id,
    scope: row.scope === 'default_extra' ? 'default_extra' : 'base',
    quantity: Number(row.quantity ?? 1),
    pricing_item: {
      id: row.pricing_item?.id ?? row.pricing_item_id,
      name: row.pricing_item?.name ?? '',
      category: row.pricing_item?.category === 'amenities' ? 'amenities' : 'linen',
      unit_price: Number(row.pricing_item?.unit_price ?? 0),
      active: row.pricing_item?.active ?? true,
    },
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
  }
}

const SELECT_FIELDS = 'id, property_id, pricing_item_id, scope, quantity, created_at, updated_at, pricing_item:pricing_items(id, name, category, unit_price, active)'

function normalizePropertyPricingItems(items: PropertyPricingItemInput[]): PropertyPricingItemInput[] {
  const merged = new Map<string, PropertyPricingItemInput>()

  for (const item of items) {
    const pricingItemId = item.pricing_item_id.trim()
    const scope = item.scope === 'default_extra' ? 'default_extra' : 'base'
    const quantity = Math.max(1, Number(item.quantity ?? 1))

    if (!pricingItemId) {
      continue
    }

    const key = `${scope}:${pricingItemId}`
    const existing = merged.get(key)

    if (existing) {
      existing.quantity += quantity
      continue
    }

    merged.set(key, {
      pricing_item_id: pricingItemId,
      scope,
      quantity,
    })
  }

  return Array.from(merged.values())
}

export function usePropertyPricingItems() {
  const supabase = useSupabaseClient()

  async function getPropertyPricingItems(propertyId: string): Promise<PropertyPricingItemDTO[]> {
    const { data, error } = await supabase
      .from('property_pricing_items')
      .select(SELECT_FIELDS)
      .eq('property_id', propertyId)
      .order('scope', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return ((data ?? []) as PropertyPricingItemRow[]).map(toDTO)
  }

  async function getPropertyPricingItemsBatch(propertyIds: string[]): Promise<PropertyPricingItemDTO[]> {
    if (propertyIds.length === 0) {
      return []
    }

    const { data, error } = await supabase
      .from('property_pricing_items')
      .select(SELECT_FIELDS)
      .in('property_id', propertyIds)

    if (error) {
      throw new Error(error.message)
    }

    return ((data ?? []) as PropertyPricingItemRow[]).map(toDTO)
  }

  async function setPropertyPricingItems(propertyId: string, items: PropertyPricingItemInput[]): Promise<void> {
    const normalizedItems = normalizePropertyPricingItems(items)

    const { error: deleteError } = await supabase
      .from('property_pricing_items')
      .delete()
      .eq('property_id', propertyId)

    if (deleteError) {
      throw new Error(deleteError.message)
    }

    if (normalizedItems.length === 0) {
      return
    }

    const rows = normalizedItems.map((item) => ({
      property_id: propertyId,
      pricing_item_id: item.pricing_item_id,
      scope: item.scope,
      quantity: item.quantity,
    }))

    const { error: insertError } = await supabase
      .from('property_pricing_items')
      .insert(rows)

    if (insertError) {
      throw new Error(insertError.message)
    }
  }

  return {
    getPropertyPricingItems,
    getPropertyPricingItemsBatch,
    setPropertyPricingItems,
  }
}
