import { ref } from 'vue'
import { useSupabaseClient } from './useSupabaseClient'
import { useDailyTasks } from './useDailyTasks'
import type { DailyTaskDTO } from '../../shared/types/DailyTaskDTO'

export type QuickTaskTeam = 'A' | 'B' | 'C'

export interface QuickTaskPropertyOption {
  id: string
  name: string
  client_id: string
  client_name: string
}

export interface QuickTaskPayload {
  property_id: string
  date: string
  start_time: string
  end_time: string
  team: QuickTaskTeam
  notes?: string
}

/**
 * Adds a decimal number of hours to a "HH:MM" string.
 * Returns the resulting "HH:MM" (wraps past midnight).
 */
export function addHoursToTime(startTime: string, durationHours: number): string {
  const [hStr, mStr] = startTime.split(':')
  const startMinutes = parseInt(hStr ?? '0', 10) * 60 + parseInt(mStr ?? '0', 10)
  const endMinutes = startMinutes + Math.round(durationHours * 60)
  const h = Math.floor(endMinutes / 60) % 24
  const m = endMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function useQuickTask() {
  const supabase = useSupabaseClient()
  const { createTask } = useDailyTasks()

  const properties = ref<QuickTaskPropertyOption[]>([])
  const isLoadingProperties = ref(false)
  const isSubmitting = ref(false)

  async function loadProperties(): Promise<void> {
    isLoadingProperties.value = true
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, name, client_id, clients(id, name)')
        .eq('active', true)
        .order('name')

      if (error) throw new Error(error.message)

      properties.value = ((data ?? []) as unknown as Array<{
        id: string
        name: string
        client_id: string
        clients: { id: string; name: string } | null
      }>).map((row) => ({
        id: row.id,
        name: row.name,
        client_id: row.client_id,
        client_name: row.clients?.name ?? '—',
      }))
    } finally {
      isLoadingProperties.value = false
    }
  }

  async function submitQuickTask(payload: QuickTaskPayload): Promise<DailyTaskDTO> {
    isSubmitting.value = true
    try {
      const teamNote = `[Team ${payload.team}]${payload.notes ? ` ${payload.notes}` : ''}`
      return await createTask({
        date: payload.date,
        property_id: payload.property_id,
        task_type: 'NORMAL',
        window_start_time: payload.start_time,
        window_end_time: payload.end_time,
        people_count: 1,
        notes: teamNote,
      })
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    properties,
    isLoadingProperties,
    isSubmitting,
    loadProperties,
    submitQuickTask,
    addHoursToTime,
  }
}
