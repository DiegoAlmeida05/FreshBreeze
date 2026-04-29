import type { DailyTaskDTO, CreateDailyTaskDTO, UpdateDailyTaskDTO } from '../../shared/types/DailyTaskDTO'
import type { TaskType } from '../../shared/types/DailyTaskDTO'
import { useSupabaseClient } from './useSupabaseClient'

const taskSelectFields = [
  'id',
  'date',
  'property_id',
  'properties(name, default_tags)',
  'guest_name',
  'guest_checkin_date',
  'tags',
  'task_type',
  'window_start_time',
  'window_end_time',
  'desired_start_time',
  'cleaning_minutes_override',
  'people_count',
  'notes',
  'extra_linen_combo_qty',
  'extra_amenities_combo_qty',
  'extra_linen_queen_qty',
  'extra_linen_single_qty',
  'extra_linen_king_qty',
  'extra_towel_qty',
  'extra_chocolate_qty',
  'created_at',
  'updated_at',
].join(', ')

function normalizeTagValue(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, ' ')
}

function normalizeTagsForStorage(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    return []
  }

  const normalized = tags
    .filter((tag): tag is string => typeof tag === 'string')
    .map((tag) => normalizeTagValue(tag))
    .filter((tag) => tag.length > 0)

  return Array.from(new Set(normalized))
}

function toTaskDTO(row: Record<string, unknown>): DailyTaskDTO {
  const propertyRel = row.properties as { name: string; default_tags?: unknown } | null
  const tags = normalizeTagsForStorage(row.tags)
  const propertyDefaultTags = normalizeTagsForStorage(propertyRel?.default_tags)

  return {
    id: String(row.id),
    date: String(row.date),
    property_id: String(row.property_id),
    property_name: propertyRel?.name ?? null,
    property_default_tags: propertyDefaultTags,
    guest_name: (row.guest_name as string | null) ?? null,
    guest_checkin_date: (row.guest_checkin_date as string | null) ?? null,
    tags,
    task_type: (row.task_type as TaskType) ?? 'NORMAL',
    window_start_time: (row.window_start_time as string | null) ?? null,
    window_end_time: (row.window_end_time as string | null) ?? null,
    desired_start_time: (row.desired_start_time as string | null) ?? null,
    cleaning_minutes_override: (row.cleaning_minutes_override as number | null) ?? null,
    people_count: Number(row.people_count ?? 1),
    notes: (row.notes as string | null) ?? null,
    extra_linen_combo_qty: Number(row.extra_linen_combo_qty ?? 0),
    extra_amenities_combo_qty: Number(row.extra_amenities_combo_qty ?? 0),
    extra_linen_queen_qty: Number(row.extra_linen_queen_qty ?? 0),
    extra_linen_single_qty: Number(row.extra_linen_single_qty ?? 0),
    extra_linen_king_qty: Number(row.extra_linen_king_qty ?? 0),
    extra_towel_qty: Number(row.extra_towel_qty ?? 0),
    extra_chocolate_qty: Number(row.extra_chocolate_qty ?? 0),
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  }
}

export function useDailyTasks() {
  const supabase = useSupabaseClient()

  async function markPublishedPlanAsStale(date: string): Promise<void> {
    if (!date) {
      return
    }

    const { error } = await supabase
      .from('route_plans')
      .update({ status: 'stale' })
      .eq('date', date)
      .eq('status', 'published')

    if (error) {
      throw new Error(error.message)
    }
  }

  async function fetchTasksByDate(date: string): Promise<DailyTaskDTO[]> {
    const { data, error } = await supabase
      .from('daily_tasks')
      .select(taskSelectFields)
      .eq('date', date)
      .order('desired_start_time', { ascending: true, nullsFirst: false })

    if (error) {
      throw new Error(error.message)
    }

    return (data ?? []).map((row) => toTaskDTO(row as unknown as Record<string, unknown>))
  }

  async function checkDuplicateTask(propertyId: string, date: string, excludeTaskId?: string): Promise<boolean> {
    let query = supabase
      .from('daily_tasks')
      .select('id')
      .eq('property_id', propertyId)
      .eq('date', date)

    if (excludeTaskId) {
      query = query.neq('id', excludeTaskId)
    }

    const { data, error } = await query.limit(1)

    if (error) {
      throw new Error(error.message)
    }

    return (data ?? []).length > 0
  }

  async function createTask(payload: CreateDailyTaskDTO): Promise<DailyTaskDTO> {
    const normalizedPayload: CreateDailyTaskDTO = {
      ...payload,
      tags: normalizeTagsForStorage(payload.tags),
    }

    const { data, error } = await supabase
      .from('daily_tasks')
      .insert(normalizedPayload)
      .select(taskSelectFields)
      .single()

    if (error || !data) {
      const isDuplicate =
        error?.code === '23505' ||
        (error?.message ?? '').toLowerCase().includes('duplicate') ||
        (error?.message ?? '').toLowerCase().includes('unique')

      throw new Error(
        isDuplicate
          ? 'This property already has a task on this date.'
          : (error?.message ?? 'Failed to create task.'),
      )
    }

    await markPublishedPlanAsStale(payload.date)

    return toTaskDTO(data as unknown as Record<string, unknown>)
  }

  async function updateTask(id: string, payload: UpdateDailyTaskDTO): Promise<DailyTaskDTO> {
    const { data: existingTaskData, error: existingTaskError } = await supabase
      .from('daily_tasks')
      .select('date')
      .eq('id', id)
      .single()

    if (existingTaskError || !existingTaskData) {
      throw new Error(existingTaskError?.message ?? 'Failed to load current task before update.')
    }

    const previousDate = String((existingTaskData as Record<string, unknown>).date ?? '')

    const normalizedPayload: UpdateDailyTaskDTO = {
      ...payload,
      tags: payload.tags === undefined ? undefined : normalizeTagsForStorage(payload.tags),
    }

    const { data, error } = await supabase
      .from('daily_tasks')
      .update(normalizedPayload)
      .eq('id', id)
      .select(taskSelectFields)
      .single()

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to update task.')
    }

    const updatedTask = toTaskDTO(data as unknown as Record<string, unknown>)
    const impactedDates = new Set([previousDate, updatedTask.date].filter((value) => value.length > 0))

    for (const impactedDate of impactedDates) {
      await markPublishedPlanAsStale(impactedDate)
    }

    return updatedTask
  }

  async function deleteTask(id: string): Promise<void> {
    const { data: existingTaskData, error: existingTaskError } = await supabase
      .from('daily_tasks')
      .select('date')
      .eq('id', id)
      .single()

    if (existingTaskError || !existingTaskData) {
      throw new Error(existingTaskError?.message ?? 'Failed to load current task before delete.')
    }

    const previousDate = String((existingTaskData as Record<string, unknown>).date ?? '')

    const { error } = await supabase
      .from('daily_tasks')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(error.message)
    }

    await markPublishedPlanAsStale(previousDate)
  }

  return {
    fetchTasksByDate,
    checkDuplicateTask,
    createTask,
    updateTask,
    deleteTask,
  }
}
