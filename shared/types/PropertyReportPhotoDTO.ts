export interface PropertyReportPhotoDTO {
  id: string
  report_id: string
  photo_url: string
  sort_order: number
  created_at: string
}

export interface CreatePropertyReportPhotoDTO {
  report_id: string
  photo_url: string
  sort_order?: number
}
