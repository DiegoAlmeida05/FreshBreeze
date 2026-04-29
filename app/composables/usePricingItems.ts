import { useSupabaseClient } from './useSupabaseClient'
import type {
  CreatePricingItemDTO,
  PricingItemDTO,
  UpdatePricingItemDTO,
} from '../../shared/types/PricingItemDTO'

interface PricingItemRow {
  id: string
  name: string
  category: string
  unit_price: number | null
  active: boolean | null
  sort_order: number | null
  created_at: string | null
  updated_at: string | null
}

function toDTO(row: PricingItemRow): PricingItemDTO {
  return {
    id: row.id,
    name: row.name,
    category: row.category === 'amenities' ? 'amenities' : 'linen',
    unit_price: Number(row.unit_price ?? 0),
    active: row.active ?? true,
    sort_order: Number(row.sort_order ?? 0),
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
  }
}

const SELECT_FIELDS = 'id, name, category, unit_price, active, sort_order, created_at, updated_at'

export function usePricingItems() {
  const supabase = useSupabaseClient()

  async function fetchPricingItems(): Promise<PricingItemDTO[]> {
    const { data, error } = await supabase
      .from('pricing_items')
      .select(SELECT_FIELDS)
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return ((data ?? []) as PricingItemRow[]).map(toDTO)
  }

  async function fetchActivePricingItems(): Promise<PricingItemDTO[]> {
    const { data, error } = await supabase
      .from('pricing_items')
      .select(SELECT_FIELDS)
      .eq('active', true)
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return ((data ?? []) as PricingItemRow[]).map(toDTO)
  }

  async function fetchPricingItemById(id: string): Promise<PricingItemDTO> {
    const { data, error } = await supabase
      .from('pricing_items')
      .select(SELECT_FIELDS)
      .eq('id', id)
      .single<PricingItemRow>()

    if (error) {
      throw new Error(error.message)
    }

    if (!data) {
      throw new Error('Pricing item not found.')
    }

    return toDTO(data)
  }

  async function createPricingItem(dto: CreatePricingItemDTO): Promise<PricingItemDTO> {
    const maxSortOrderResult = await supabase
      .from('pricing_items')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle<{ sort_order: number | null }>()

    if (maxSortOrderResult.error) {
      throw new Error(maxSortOrderResult.error.message)
    }

    const nextSortOrder = Number(maxSortOrderResult.data?.sort_order ?? -1) + 1

    const { data, error } = await supabase
      .from('pricing_items')
      .insert({
        name: dto.name.trim(),
        category: dto.category,
        unit_price: Number(dto.unit_price ?? 0),
        active: dto.active ?? true,
        sort_order: nextSortOrder >= 0 ? nextSortOrder : 0,
      })
      .select(SELECT_FIELDS)
      .single<PricingItemRow>()

    if (error) {
      throw new Error(error.message)
    }

    if (!data) {
      throw new Error('No data returned after create.')
    }

    return toDTO(data)
  }

  async function updatePricingItem(id: string, dto: UpdatePricingItemDTO): Promise<PricingItemDTO> {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (dto.name !== undefined) {
      payload.name = dto.name.trim()
    }

    if (dto.category !== undefined) {
      payload.category = dto.category
    }

    if (dto.unit_price !== undefined) {
      payload.unit_price = Number(dto.unit_price)
    }

    if (dto.active !== undefined) {
      payload.active = dto.active
    }

    if (dto.sort_order !== undefined) {
      payload.sort_order = dto.sort_order
    }

    const { data, error } = await supabase
      .from('pricing_items')
      .update(payload)
      .eq('id', id)
      .select(SELECT_FIELDS)
      .single<PricingItemRow>()

    if (error) {
      throw new Error(error.message)
    }

    if (!data) {
      throw new Error('No data returned after update.')
    }

    return toDTO(data)
  }

  async function deactivatePricingItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('pricing_items')
      .update({
        active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      throw new Error(error.message)
    }
  }

  return {
    fetchPricingItems,
    fetchActivePricingItems,
    fetchPricingItemById,
    createPricingItem,
    updatePricingItem,
    deactivatePricingItem,
  }
}
