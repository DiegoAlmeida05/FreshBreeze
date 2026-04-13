export interface EmployeeTimeAdjustmentAdminDTO {
  id: string
  employee_id: string
  work_date: string
  start_extra_minutes: number
  end_extra_minutes: number
  other_extra_minutes: number
  manual_adjustment_minutes: number
  note: string | null
  created_by_profile_id: string
  updated_by_profile_id: string
  created_at: string
  updated_at: string
}

export interface UpdateEmployeeTimeAdjustmentAdminDTO {
  start_extra_minutes?: number
  end_extra_minutes?: number
  other_extra_minutes?: number
  manual_adjustment_minutes?: number
  note?: string | null
}