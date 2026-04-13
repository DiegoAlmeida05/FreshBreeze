export type PropertyReportStatus = 'open' | 'resolved'

export interface PropertyReportDTO {
  id: string
  property_id: string
  daily_task_id: string | null
  report_date: string
  title: string
  description_pt: string
  status: PropertyReportStatus
  created_by_profile_id: string
  created_at: string
  resolved_by_profile_id: string | null
  resolved_at: string | null
  photo_url: string | null
}

export interface PropertyReportListItemDTO extends PropertyReportDTO {
  created_by_name: string | null
  resolved_by_name: string | null
}

export interface PropertyReportFiltersDTO {
  status?: PropertyReportStatus | 'all'
  property_id?: string
  client_id?: string
  date_from?: string
  date_to?: string
  search?: string
}

export interface PropertyReportAdminListItemDTO extends PropertyReportListItemDTO {
  property_name: string | null
  client_id: string | null
  client_name: string | null
}

export interface CreatePropertyReportDTO {
  property_id: string
  daily_task_id?: string | null
  report_date: string
  title: string
  description_pt: string
}

export interface UpdatePropertyReportDTO {
  report_date?: string
  title?: string
  description_pt?: string
}
