export interface EmployeeDayAdjustmentAdminDTO {
  id: string
  employee_id: string
  work_date: string
  start_travel_minutes: number
  end_travel_minutes: number
  other_extra_minutes: number
  note: string | null
  created_by_profile_id: string | null
  updated_by_profile_id: string | null
  created_at: string
  updated_at: string
}

export interface CreateEmployeeDayAdjustmentAdminDTO {
  employee_id: string
  work_date: string
  start_travel_minutes?: number
  end_travel_minutes?: number
  other_extra_minutes?: number
  note?: string | null
}

export interface UpdateEmployeeDayAdjustmentAdminDTO {
  start_travel_minutes?: number
  end_travel_minutes?: number
  other_extra_minutes?: number
  note?: string | null
}