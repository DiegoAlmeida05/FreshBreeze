export interface ClientDTO {
  id: string
  name: string
  color: string
  hourly_rate: number
  linen_combo_price: number
  amenities_combo_price: number
  extra_towel_price: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface CreateClientDTO {
  name: string
  color: string
  hourly_rate: number
  linen_combo_price: number
  amenities_combo_price: number
  extra_towel_price: number
  active?: boolean
}

export interface UpdateClientDTO {
  name?: string
  color?: string
  hourly_rate?: number
  linen_combo_price?: number
  amenities_combo_price?: number
  extra_towel_price?: number
  active?: boolean
}
