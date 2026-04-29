import { useSupabaseClient } from './useSupabaseClient'
import type { PropertyComboDTO, PropertyComboInput } from '../../shared/types/ComboCatalogDTO'

interface PropertyComboRow {
  id: string
  property_id: string
  combo_id: string
  scope: string
  quantity: number | null
  created_at: string | null
  updated_at: string | null
  combo: {
    id: string
    name: string
    category: string
    combo_price: number | null
    active: boolean | null
  } | null
}

function toDTO(row: PropertyComboRow): PropertyComboDTO {
  return {
    id: row.id,
    property_id: row.property_id,
    combo_id: row.combo_id,
    scope: row.scope as 'base' | 'default_extra',
    quantity: row.quantity ?? 1,
    combo: {
      id: row.combo?.id ?? row.combo_id,
      name: row.combo?.name ?? '',
      category: (row.combo?.category ?? 'linen') as 'linen' | 'amenities',
      combo_price: row.combo?.combo_price ?? 0,
      active: row.combo?.active ?? true,
    },
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
  }
}

export function usePropertyCombos() {
  const supabase = useSupabaseClient()

  async function getPropertyCombos(propertyId: string): Promise<PropertyComboDTO[]> {
    const { data, error } = await supabase
      .from('property_combos')
      .select('id, property_id, combo_id, scope, quantity, created_at, updated_at, combo:combo_catalog(id, name, category, combo_price, active)')
      .eq('property_id', propertyId)
      .order('scope', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return ((data ?? []) as PropertyComboRow[]).map(toDTO)
  }

  async function getPropertyCombosBatch(propertyIds: string[]): Promise<PropertyComboDTO[]> {
    if (propertyIds.length === 0) {
      return []
    }

    const { data, error } = await supabase
      .from('property_combos')
      .select('id, property_id, combo_id, scope, quantity, created_at, updated_at, combo:combo_catalog(id, name, category, combo_price, active)')
      .in('property_id', propertyIds)

    if (error) {
      throw new Error(error.message)
    }

    return ((data ?? []) as PropertyComboRow[]).map(toDTO)
  }

  async function setPropertyCombos(propertyId: string, combos: PropertyComboInput[]): Promise<void> {
    const { error: deleteError } = await supabase
      .from('property_combos')
      .delete()
      .eq('property_id', propertyId)

    if (deleteError) {
      throw new Error(deleteError.message)
    }

    if (combos.length === 0) {
      return
    }

    const rows = combos.map((combo) => ({
      property_id: propertyId,
      combo_id: combo.combo_id,
      scope: combo.scope,
      quantity: combo.quantity,
    }))

    const { error: insertError } = await supabase
      .from('property_combos')
      .insert(rows)

    if (insertError) {
      throw new Error(insertError.message)
    }
  }

  return {
    getPropertyCombos,
    getPropertyCombosBatch,
    setPropertyCombos,
  }
}
