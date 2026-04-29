export type TaskType = 'BSB' | 'NORMAL'

export interface DailyTaskDTO {
  id: string
  date: string
  property_id: string
  property_name: string | null
  property_default_tags?: string[]
  guest_name: string | null
  guest_checkin_date: string | null
  tags: string[]
  task_type: TaskType
  window_start_time: string | null
  window_end_time: string | null
  desired_start_time: string | null
  cleaning_minutes_override: number | null
  people_count: number
  notes: string | null
  extra_linen_combo_qty: number
  extra_amenities_combo_qty: number
  extra_linen_queen_qty: number
  extra_linen_single_qty: number
  extra_linen_king_qty: number
  extra_towel_qty: number
  extra_chocolate_qty: number
  created_at: string
  updated_at: string
}

export interface CreateDailyTaskDTO {
  date: string
  property_id: string
  guest_name?: string | null
  guest_checkin_date?: string | null
  tags?: string[]
  task_type: TaskType
  window_start_time?: string | null
  window_end_time?: string | null
  desired_start_time?: string | null
  cleaning_minutes_override?: number | null
  people_count: number
  notes?: string | null
  extra_linen_combo_qty?: number
  extra_amenities_combo_qty?: number
  extra_linen_queen_qty?: number
  extra_linen_single_qty?: number
  extra_linen_king_qty?: number
  extra_towel_qty?: number
  extra_chocolate_qty?: number
}

export interface UpdateDailyTaskDTO {
  date?: string
  property_id?: string
  guest_name?: string | null
  guest_checkin_date?: string | null
  tags?: string[]
  task_type?: TaskType
  window_start_time?: string | null
  window_end_time?: string | null
  desired_start_time?: string | null
  cleaning_minutes_override?: number | null
  people_count?: number
  notes?: string | null
  extra_linen_combo_qty?: number
  extra_amenities_combo_qty?: number
  extra_linen_queen_qty?: number
  extra_linen_single_qty?: number
  extra_linen_king_qty?: number
  extra_towel_qty?: number
  extra_chocolate_qty?: number
}
