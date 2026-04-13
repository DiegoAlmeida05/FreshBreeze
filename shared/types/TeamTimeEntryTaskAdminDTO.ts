export interface TeamTimeEntryTaskAdminDTO {
  id: string
  work_date: string
  route_group_id: string
  route_stop_id: string
  daily_task_id: string
  planned_minutes: number
  actual_minutes: number
  note: string | null
  created_by_profile_id: string
  updated_by_profile_id: string
  created_at: string
  updated_at: string
}

export interface CreateTeamTimeEntryTaskAdminDTO {
  work_date: string
  route_group_id: string
  route_stop_id: string
  daily_task_id: string
  planned_minutes: number
  actual_minutes?: number
  note?: string | null
}

export interface UpdateTeamTimeEntryTaskAdminDTO {
  actual_minutes?: number
  note?: string | null
}

export interface SaveDayTeamTaskInput {
  id?: string
  work_date: string
  route_group_id: string
  route_stop_id: string
  daily_task_id: string
  planned_minutes: number
  actual_minutes: number
  note?: string | null
}
