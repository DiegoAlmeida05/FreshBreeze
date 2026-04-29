import { useSupabaseClient } from './useSupabaseClient'
import type {
  ComboCatalogDTO,
  ComboCatalogItemDTO,
  ComboCatalogItemInput,
  CreateComboCatalogDTO,
  UpdateComboCatalogDTO,
} from '../../shared/types/ComboCatalogDTO'

interface ComboCatalogRow {
  id: string
  name: string
  category: string
  description: string
  combo_price: number | null
  active: boolean | null
  sort_order: number | null
  created_at: string | null
  updated_at: string | null
}

interface ComboCatalogItemRow {
  id: string
  combo_id: string
  item_name: string
  quantity: number | null
  unit_price_excl_gst: number | null
  line_total_excl_gst: number | null
  sort_order: number | null
  created_at: string | null
  updated_at: string | null
}

function toItemDTO(row: ComboCatalogItemRow): ComboCatalogItemDTO {
  const quantity = row.quantity ?? 0
  const unitPrice = row.unit_price_excl_gst ?? 0

  return {
    id: row.id,
    combo_id: row.combo_id,
    item_name: row.item_name,
    quantity,
    unit_price_excl_gst: unitPrice,
    line_total_excl_gst: row.line_total_excl_gst ?? quantity * unitPrice,
    sort_order: row.sort_order ?? 0,
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
  }
}

function toDTO(row: ComboCatalogRow, items: ComboCatalogItemDTO[] = []): ComboCatalogDTO {
  return {
    id: row.id,
    name: row.name,
    category: row.category as ComboCatalogDTO['category'],
    description: row.description,
    combo_price: row.combo_price ?? 0,
    items,
    active: row.active ?? true,
    sort_order: row.sort_order ?? 0,
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
  }
}

const SELECT_FIELDS = 'id, name, category, description, combo_price, active, sort_order, created_at, updated_at'
const ITEM_SELECT_FIELDS = 'id, combo_id, item_name, quantity, unit_price_excl_gst, line_total_excl_gst, sort_order, created_at, updated_at'

function normalizeItems(items: ComboCatalogItemInput[]): ComboCatalogItemInput[] {
  return items
    .map((item, index) => ({
      item_name: item.item_name.trim(),
      quantity: Number(item.quantity),
      unit_price_excl_gst: Number(item.unit_price_excl_gst),
      sort_order: item.sort_order ?? index,
    }))
    .filter((item) => item.item_name.length > 0)
}

function calculateComboPrice(items: ComboCatalogItemInput[]): number {
  const total = items.reduce((sum, item) => sum + (item.quantity * item.unit_price_excl_gst), 0)
  return Number(total.toFixed(2))
}

export function useComboCatalog() {
  const supabase = useSupabaseClient()

  async function fetchCombos(): Promise<ComboCatalogDTO[]> {
    const { data, error } = await supabase
      .from('combo_catalog')
      .select(SELECT_FIELDS)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return ((data ?? []) as ComboCatalogRow[]).map((row) => toDTO(row, []))
  }

  async function fetchActiveCombos(): Promise<ComboCatalogDTO[]> {
    const { data, error } = await supabase
      .from('combo_catalog')
      .select(SELECT_FIELDS)
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return ((data ?? []) as ComboCatalogRow[]).map((row) => toDTO(row, []))
  }

  async function fetchComboById(id: string): Promise<ComboCatalogDTO> {
    const [{ data: comboData, error: comboError }, { data: itemData, error: itemError }] = await Promise.all([
      supabase
        .from('combo_catalog')
        .select(SELECT_FIELDS)
        .eq('id', id)
        .single<ComboCatalogRow>(),
      supabase
        .from('combo_catalog_items')
        .select(ITEM_SELECT_FIELDS)
        .eq('combo_id', id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }),
    ])

    if (comboError) {
      throw new Error(comboError.message)
    }

    if (itemError) {
      throw new Error(itemError.message)
    }

    if (!comboData) {
      throw new Error('Combo not found.')
    }

    const items = ((itemData ?? []) as ComboCatalogItemRow[]).map(toItemDTO)
    return toDTO(comboData, items)
  }

  async function replaceComboItems(comboId: string, items: ComboCatalogItemInput[]): Promise<void> {
    const { error: deleteError } = await supabase
      .from('combo_catalog_items')
      .delete()
      .eq('combo_id', comboId)

    if (deleteError) {
      throw new Error(deleteError.message)
    }

    if (items.length === 0) {
      return
    }

    const rows = items.map((item, index) => {
      const lineTotal = Number((item.quantity * item.unit_price_excl_gst).toFixed(2))

      return {
        combo_id: comboId,
        item_name: item.item_name,
        quantity: item.quantity,
        unit_price_excl_gst: item.unit_price_excl_gst,
        line_total_excl_gst: lineTotal,
        sort_order: item.sort_order ?? index,
      }
    })

    const { error: insertError } = await supabase
      .from('combo_catalog_items')
      .insert(rows)

    if (insertError) {
      throw new Error(insertError.message)
    }
  }

  async function createCombo(dto: CreateComboCatalogDTO): Promise<ComboCatalogDTO> {
    const normalizedItems = normalizeItems(dto.items)
    const comboPrice = calculateComboPrice(normalizedItems)

    const { data, error } = await supabase
      .from('combo_catalog')
      .insert({
        name: dto.name.trim(),
        category: dto.category,
        description: dto.description?.trim() ?? '',
        combo_price: comboPrice,
        active: dto.active ?? true,
        sort_order: dto.sort_order ?? 0,
      })
      .select(SELECT_FIELDS)
      .single<ComboCatalogRow>()

    if (error) {
      throw new Error(error.message)
    }

    if (!data) {
      throw new Error('No data returned after create.')
    }

    await replaceComboItems(data.id, normalizedItems)
    return fetchComboById(data.id)
  }

  async function updateCombo(id: string, dto: UpdateComboCatalogDTO): Promise<ComboCatalogDTO> {
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
    let normalizedItems: ComboCatalogItemInput[] | null = null

    if (dto.items !== undefined) {
      normalizedItems = normalizeItems(dto.items)
      payload.combo_price = calculateComboPrice(normalizedItems)
    }

    if (dto.name !== undefined) {
      payload.name = dto.name.trim()
    }

    if (dto.category !== undefined) {
      payload.category = dto.category
    }

    if (dto.description !== undefined) {
      payload.description = dto.description.trim()
    }

    if (dto.combo_price !== undefined && normalizedItems === null) {
      payload.combo_price = dto.combo_price
    }

    if (dto.active !== undefined) {
      payload.active = dto.active
    }

    if (dto.sort_order !== undefined) {
      payload.sort_order = dto.sort_order
    }

    const { data, error } = await supabase
      .from('combo_catalog')
      .update(payload)
      .eq('id', id)
      .select(SELECT_FIELDS)
      .single<ComboCatalogRow>()

    if (error) {
      throw new Error(error.message)
    }

    if (!data) {
      throw new Error('No data returned after update.')
    }

    if (normalizedItems !== null) {
      await replaceComboItems(id, normalizedItems)
    }

    return fetchComboById(data.id)
  }

  async function deleteCombo(id: string): Promise<void> {
    const { error } = await supabase
      .from('combo_catalog')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(error.message)
    }
  }

  return {
    fetchCombos,
    fetchActiveCombos,
    fetchComboById,
    createCombo,
    updateCombo,
    deleteCombo,
  }
}
