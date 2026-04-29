export type PropertyTag = string
export type PropertyTags = PropertyTag[]

export type PropertyResourceType = 'link' | 'attachment'

export interface PropertyKeyDTO {
  id: string
  property_id: string
  label: string
  pickup_address: string | null
  note: string | null
  attachment_url: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CreatePropertyKeyDTO {
  label: string
  pickup_address?: string | null
  note?: string | null
  attachment_url?: string | null
  sort_order?: number
}

export interface PropertyResourceDTO {
  id: string
  property_id: string
  resource_type: PropertyResourceType
  url: string
  attachment_url: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CreatePropertyResourceDTO {
  resource_type: PropertyResourceType
  url: string
  attachment_url?: string | null
  sort_order?: number
}

export interface PropertyDTO {
  id: string
  client_id: string
  name: string
  address: string
  lat: number | null
  lng: number | null
  bathrooms: number
  beds_single: number
  beds_queen: number
  beds_king: number
  default_cleaning_minutes: number
  linen_combo_extra_price: number
  amenities_combo_extra_price: number
  linen_queen_extra_price: number
  linen_single_extra_price: number
  linen_king_extra_price: number
  towel_extra_price: number
  chocolate_extra_price: number
  linen_pack_fee: number
  amenities_pack_fee: number
  includes_amenities: boolean
  includes_chocolates: boolean
  extra_towels_default_qty: number
  extra_dishcloths_default_qty: number
  notes: string | null
  has_keys: boolean
  key_count: number
  property_keys: PropertyKeyDTO[]
  property_resources: PropertyResourceDTO[]
  link_1: string | null
  link_2: string | null
  has_key: boolean
  key_pickup_address: string | null
  key_photo_url: string | null
  default_tags: PropertyTags
  active: boolean
  created_at: string
  updated_at: string
}

export interface CreatePropertyDTO {
  client_id: string
  name: string
  address: string
  lat?: number | null
  lng?: number | null
  bathrooms: number
  beds_single: number
  beds_queen: number
  beds_king: number
  default_cleaning_minutes: number
  linen_combo_extra_price?: number
  amenities_combo_extra_price?: number
  linen_queen_extra_price?: number
  linen_single_extra_price?: number
  linen_king_extra_price?: number
  towel_extra_price?: number
  chocolate_extra_price?: number
  linen_pack_fee?: number
  amenities_pack_fee?: number
  includes_amenities?: boolean
  includes_chocolates?: boolean
  extra_towels_default_qty?: number
  extra_dishcloths_default_qty?: number
  notes?: string | null
  has_keys?: boolean
  key_count?: number
  default_tags?: PropertyTags
  active?: boolean
}

export interface UpdatePropertyDTO {
  client_id?: string
  name?: string
  address?: string
  lat?: number | null
  lng?: number | null
  bathrooms?: number
  beds_single?: number
  beds_queen?: number
  beds_king?: number
  default_cleaning_minutes?: number
  linen_combo_extra_price?: number
  amenities_combo_extra_price?: number
  linen_queen_extra_price?: number
  linen_single_extra_price?: number
  linen_king_extra_price?: number
  towel_extra_price?: number
  chocolate_extra_price?: number
  linen_pack_fee?: number
  amenities_pack_fee?: number
  includes_amenities?: boolean
  includes_chocolates?: boolean
  extra_towels_default_qty?: number
  extra_dishcloths_default_qty?: number
  notes?: string | null
  has_keys?: boolean
  key_count?: number
  default_tags?: PropertyTags
  active?: boolean
}
