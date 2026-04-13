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
  extra_beds_single: number
  extra_beds_queen: number
  extra_beds_king: number
  // Additional towels for this specific day (on top of property default).
  extra_towels_qty: number
  // Additional chocolates for this specific day (on top of property-based calculation).
  extra_chocolates_qty: number
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
  extra_beds_single?: number
  extra_beds_queen?: number
  extra_beds_king?: number
  extra_towels_qty?: number
  extra_chocolates_qty?: number
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
  extra_beds_single?: number
  extra_beds_queen?: number
  extra_beds_king?: number
  extra_towels_qty?: number
  extra_chocolates_qty?: number
}
