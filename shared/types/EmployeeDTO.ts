export interface EmployeeDTO {
  id: string
  profile_id: string | null
  full_name: string
  email: string | null
  phone: string | null
  address: string | null
  abn: string | null
  photo_url: string | null
  hourly_rate_weekday: number
  hourly_rate_sunday: number
  hourly_rate_holiday: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface CreateEmployeeDTO {
  profile_id?: string | null
  full_name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  abn?: string | null
  photo_url?: string | null
  hourly_rate_weekday: number
  hourly_rate_sunday: number
  hourly_rate_holiday: number
  active?: boolean
}

export interface UpdateEmployeeDTO {
  profile_id?: string | null
  full_name?: string
  email?: string | null
  phone?: string | null
  address?: string | null
  abn?: string | null
  photo_url?: string | null
  hourly_rate_weekday?: number
  hourly_rate_sunday?: number
  hourly_rate_holiday?: number
  active?: boolean
}
