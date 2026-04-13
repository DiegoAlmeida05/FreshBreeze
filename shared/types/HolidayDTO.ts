export interface HolidayDTO {
  id: string
  date: string
  name: string
  country: string | null
  state: string | null
  is_active: boolean
  created_at: string
}

export interface CreateHolidayDTO {
  date: string
  name: string
  country?: string | null
  state?: string | null
  is_active?: boolean
}

export interface UpdateHolidayDTO {
  date?: string
  name?: string
  country?: string | null
  state?: string | null
  is_active?: boolean
}
