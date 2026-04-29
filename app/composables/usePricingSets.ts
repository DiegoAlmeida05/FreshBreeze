import { useSupabaseClient } from './useSupabaseClient'
import type {
  CreatePricingSetDTO,
  PricingSetDTO,
  PricingSetItemDTO,
  PricingSetItemInput,
  UpdatePricingSetDTO,
} from '../../shared/types/PricingSetDTO'

interface PricingSetItemRow {
  id: string
  set_id: string
  pricing_item_id: string
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

interface PricingSetRow {
  id: string
  name: string
  category: string
  active: boolean | null
  created_at: string | null
  pricing_set_items: PricingSetItemRow[] | null
}

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}

function toSetItemDTO(row: PricingSetItemRow): PricingSetItemDTO | null {
  const pricingItem = unwrapRelation(row.pricing_item)

  if (!pricingItem) {
    return null
  }

  return {
    id: row.id,
    set_id: row.set_id,
    pricing_item_id: row.pricing_item_id,
    quantity: Math.max(1, Number(row.quantity ?? 1)),
    pricing_item: {
      id: pricingItem.id,
      name: pricingItem.name,
      category: pricingItem.category === 'amenities' ? 'amenities' : 'linen',
      unit_price: Number(pricingItem.unit_price ?? 0),
      active: pricingItem.active ?? true,
    },
  }
}

function toDTO(row: PricingSetRow): PricingSetDTO {
  return {
    id: row.id,
    name: row.name,
    category: row.category === 'amenities' ? 'amenities' : 'linen',
    active: row.active ?? true,
    created_at: row.created_at ?? '',
    items: (row.pricing_set_items ?? [])
      .map(toSetItemDTO)
      .filter((item): item is PricingSetItemDTO => Boolean(item)),
  }
}

function normalizeSetItems(items: PricingSetItemInput[]): PricingSetItemInput[] {
  const merged = new Map<string, PricingSetItemInput>()

  for (const item of items) {
    const pricingItemId = item.pricing_item_id.trim()
    if (!pricingItemId) {
      continue
    }

    const quantity = Math.max(1, Number(item.quantity ?? 1))
    const existing = merged.get(pricingItemId)

    if (existing) {
      existing.quantity += quantity
      continue
    }

    merged.set(pricingItemId, {
      pricing_item_id: pricingItemId,
      quantity,
    })
  }

  return Array.from(merged.values())
}

const SELECT_FIELDS = 'id, name, category, active, created_at, pricing_set_items(id, set_id, pricing_item_id, quantity, pricing_item:pricing_items(id, name, category, unit_price, active))'

export function usePricingSets() {
  const supabase = useSupabaseClient()

  async function fetchPricingSets(): Promise<PricingSetDTO[]> {
    const { data, error } = await supabase
      .from('pricing_sets')
      .select(SELECT_FIELDS)
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return ((data ?? []) as PricingSetRow[]).map(toDTO)
  }

  async function fetchActivePricingSets(): Promise<PricingSetDTO[]> {
    const { data, error } = await supabase
      .from('pricing_sets')
      .select(SELECT_FIELDS)
      .eq('active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return ((data ?? []) as PricingSetRow[]).map(toDTO)
  }

  async function fetchPricingSetById(id: string): Promise<PricingSetDTO> {
    const { data, error } = await supabase
      .from('pricing_sets')
      .select(SELECT_FIELDS)
      .eq('id', id)
      .single<PricingSetRow>()

    if (error) {
      throw new Error(error.message)
    }

    if (!data) {
      throw new Error('Pricing set not found.')
    }

    return toDTO(data)
  }

  async function createPricingSet(dto: CreatePricingSetDTO): Promise<PricingSetDTO> {
    const normalizedItems = normalizeSetItems(dto.items)

    const { data, error } = await supabase
      .from('pricing_sets')
      .insert({
        name: dto.name.trim(),
        category: dto.category,
        active: dto.active ?? true,
      })
      .select('id')
      .single<{ id: string }>()

    if (error) {
      throw new Error(error.message)
    }

    const setId = data?.id
    if (!setId) {
      throw new Error('No data returned after create.')
    }

    if (normalizedItems.length > 0) {
      const { error: itemsError } = await supabase
        .from('pricing_set_items')
        .insert(normalizedItems.map((item) => ({
          set_id: setId,
          pricing_item_id: item.pricing_item_id,
          quantity: item.quantity,
        })))

      if (itemsError) {
        throw new Error(itemsError.message)
      }
    }

    return fetchPricingSetById(setId)
  }

  async function updatePricingSet(id: string, dto: UpdatePricingSetDTO): Promise<PricingSetDTO> {
    const payload: Record<string, unknown> = {}

    if (dto.name !== undefined) {
      payload.name = dto.name.trim()
    }

    if (dto.category !== undefined) {
      payload.category = dto.category
    }

    if (dto.active !== undefined) {
      payload.active = dto.active
    }

    if (Object.keys(payload).length > 0) {
      const { error: updateError } = await supabase
        .from('pricing_sets')
        .update(payload)
        .eq('id', id)

      if (updateError) {
        throw new Error(updateError.message)
      }
    }

    if (dto.items !== undefined) {
      const normalizedItems = normalizeSetItems(dto.items)

      const { error: deleteError } = await supabase
        .from('pricing_set_items')
        .delete()
        .eq('set_id', id)

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      if (normalizedItems.length > 0) {
        const { error: insertError } = await supabase
          .from('pricing_set_items')
          .insert(normalizedItems.map((item) => ({
            set_id: id,
            pricing_item_id: item.pricing_item_id,
            quantity: item.quantity,
          })))

        if (insertError) {
          throw new Error(insertError.message)
        }
      }
    }

    return fetchPricingSetById(id)
  }

  async function deactivatePricingSet(id: string): Promise<void> {
    const { error } = await supabase
      .from('pricing_sets')
      .update({ active: false })
      .eq('id', id)

    if (error) {
      throw new Error(error.message)
    }
  }

  return {
    fetchPricingSets,
    fetchActivePricingSets,
    fetchPricingSetById,
    createPricingSet,
    updatePricingSet,
    deactivatePricingSet,
  }
}