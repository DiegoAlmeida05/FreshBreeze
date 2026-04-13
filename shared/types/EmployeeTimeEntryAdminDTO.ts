export type TimeEntryType = 'task' | 'day_adjustment'

export interface EmployeeTimeEntryAdminDTO {
  id: string
  employee_id: string
  entry_type: TimeEntryType
  route_stop_id: string | null
  daily_task_id: string | null
  work_date: string
  planned_minutes: number
  actual_minutes: number
  start_extra_minutes: number
  other_extra_minutes: number
  end_extra_minutes: number
  note: string | null
  created_by_profile_id: string
  updated_by_profile_id: string
  created_at: string
  updated_at: string
}

export interface UpdateEmployeeTimeEntryAdminDTO {
  actual_minutes?: number
  start_extra_minutes?: number
  other_extra_minutes?: number
  end_extra_minutes?: number
  note?: string | null
}
