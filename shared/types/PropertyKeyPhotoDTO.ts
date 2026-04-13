export interface PropertyKeyPhotoDTO {
  id: string
  property_id: string
  photo_url: string
  sort_order: number
  created_at: string
}

export interface CreatePropertyKeyPhotoDTO {
  property_id: string
  photo_url: string
  sort_order?: number
}
