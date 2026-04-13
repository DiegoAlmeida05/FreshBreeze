export interface TeamTimeEntryAdminDTO {
  id: string
  route_group_id: string
  work_date: string
  worked_minutes: number
  note: string | null
  created_by_profile_id: string
  updated_by_profile_id: string
  created_at: string
  updated_at: string
}

export interface CreateTeamTimeEntryAdminDTO {
  route_group_id: string
  work_date: string
  worked_minutes?: number
  note?: string | null
}

export interface UpdateTeamTimeEntryAdminDTO {
  worked_minutes?: number
  note?: string | null
}

export interface EmployeeSummaryDayRowVM {
  employeeId: string
  employeeName: string
  workDate: string
  baseMinutes: number
  startExtraMinutes: number
  endExtraMinutes: number
  otherExtraMinutes: number
  manualAdjustmentMinutes: number
  totalPaidMinutes: number
  note: string | null
}