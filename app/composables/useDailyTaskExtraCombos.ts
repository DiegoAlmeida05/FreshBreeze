import { useSupabaseClient } from './useSupabaseClient'
import type { DailyTaskExtraComboDTO, DailyTaskExtraComboInput } from '../../shared/types/ComboCatalogDTO'

interface DailyTaskExtraComboRow {
  id: string
  daily_task_id: string
  combo_id: string
  quantity: number | null
  note: string | null
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

function toDTO(row: DailyTaskExtraComboRow): DailyTaskExtraComboDTO {
  return {
    id: row.id,
    daily_task_id: row.daily_task_id,
    combo_id: row.combo_id,
    quantity: row.quantity ?? 1,
    note: row.note,
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

export function useDailyTaskExtraCombos() {
  const supabase = useSupabaseClient()

  async function getTaskExtraCombos(taskId: string): Promise<DailyTaskExtraComboDTO[]> {
    const { data, error } = await supabase
      .from('daily_task_extra_combos')
      .select('id, daily_task_id, combo_id, quantity, note, created_at, updated_at, combo:combo_catalog(id, name, category, combo_price, active)')
      .eq('daily_task_id', taskId)

    if (error) {
      throw new Error(error.message)
    }

    return ((data ?? []) as DailyTaskExtraComboRow[]).map(toDTO)
  }

  async function getTaskExtraCombosBatch(taskIds: string[]): Promise<DailyTaskExtraComboDTO[]> {
    if (taskIds.length === 0) {
      return []
    }

    const { data, error } = await supabase
      .from('daily_task_extra_combos')
      .select('id, daily_task_id, combo_id, quantity, note, created_at, updated_at, combo:combo_catalog(id, name, category, combo_price, active)')
      .in('daily_task_id', taskIds)

    if (error) {
      throw new Error(error.message)
    }

    return ((data ?? []) as DailyTaskExtraComboRow[]).map(toDTO)
  }

  async function setTaskExtraCombos(taskId: string, combos: DailyTaskExtraComboInput[]): Promise<void> {
    const { error: deleteError } = await supabase
      .from('daily_task_extra_combos')
      .delete()
      .eq('daily_task_id', taskId)

    if (deleteError) {
      throw new Error(deleteError.message)
    }

    if (combos.length === 0) {
      return
    }

    const rows = combos.map((combo) => ({
      daily_task_id: taskId,
      combo_id: combo.combo_id,
      quantity: combo.quantity,
      note: combo.note,
    }))

    const { error: insertError } = await supabase
      .from('daily_task_extra_combos')
      .insert(rows)

    if (insertError) {
      throw new Error(insertError.message)
    }
  }

  return {
    getTaskExtraCombos,
    getTaskExtraCombosBatch,
    setTaskExtraCombos,
  }
}
