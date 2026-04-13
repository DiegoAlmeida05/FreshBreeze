import type { ProfileDTO } from '../../shared/types/ProfileDTO'
import type {
  PropertyReportAdminListItemDTO,
  CreatePropertyReportDTO,
  PropertyReportFiltersDTO,
  PropertyReportDTO,
  PropertyReportListItemDTO,
  PropertyReportStatus,
  UpdatePropertyReportDTO,
} from '../../shared/types/PropertyReportDTO'
import { useAuth } from './useAuth'
import { useSupabaseClient } from './useSupabaseClient'

interface PropertyReportRow {
  id: string
  property_id: string
  daily_task_id: string | null
  report_date: string | null
  title: string
  description: string | null
  description_pt: string | null
  photo_url: string | null
  status: string | null
  created_by_profile_id: string
  created_at: string | null
  resolved_by_profile_id: string | null
  resolved_at: string | null
}

interface ProfileNameRow {
  id: string
  full_name: string | null
}

interface PropertyNameRow {
  id: string
  name: string | null
  client_id: string | null
}

interface ClientNameRow {
  id: string
  name: string | null
}

const propertyReportFields = [
  'id',
  'property_id',
  'daily_task_id',
  'report_date',
  'title',
  'description',
  'description_pt',
  'photo_url',
  'status',
  'created_by_profile_id',
  'created_at',
  'resolved_by_profile_id',
  'resolved_at',
].join(', ')

function toPropertyReportDTO(row: PropertyReportRow): PropertyReportDTO {
  const descriptionPt = row.description_pt ?? row.description ?? ''
  const reportDate = row.report_date ?? row.created_at?.slice(0, 10) ?? ''

  return {
    id: row.id,
    property_id: row.property_id,
    daily_task_id: row.daily_task_id,
    report_date: reportDate,
    title: row.title,
    description_pt: descriptionPt,
    status: row.status === 'resolved' ? 'resolved' : 'open',
    created_by_profile_id: row.created_by_profile_id,
    created_at: row.created_at ?? '',
    resolved_by_profile_id: row.resolved_by_profile_id,
    resolved_at: row.resolved_at,
    photo_url: row.photo_url,
  }
}

function toPropertyReportListItemDTO(
  row: PropertyReportRow,
  profileNamesById: Record<string, string>,
): PropertyReportListItemDTO {
  const report = toPropertyReportDTO(row)

  return {
    ...report,
    created_by_name: profileNamesById[report.created_by_profile_id] ?? null,
    resolved_by_name: report.resolved_by_profile_id
      ? (profileNamesById[report.resolved_by_profile_id] ?? null)
      : null,
  }
}

function normalizeFilterValue(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? ''
}

export function usePropertyReports() {
  const supabase = useSupabaseClient()
  const { getProfile } = useAuth()

  async function getProfileNames(profileIds: Array<string | null | undefined>): Promise<Record<string, string>> {
    const uniqueProfileIds = [...new Set(profileIds.filter((profileId): profileId is string => typeof profileId === 'string' && profileId.length > 0))]

    if (uniqueProfileIds.length === 0) {
      return {}
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', uniqueProfileIds)

    if (error) {
      throw new Error(error.message)
    }

    const namesById: Record<string, string> = {}

    for (const profile of ((data ?? []) as unknown as ProfileNameRow[])) {
      namesById[profile.id] = profile.full_name?.trim() || 'Unknown user'
    }

    return namesById
  }

  async function getPropertiesByIds(propertyIds: string[]): Promise<Record<string, PropertyNameRow>> {
    const uniquePropertyIds = [...new Set(propertyIds.filter((id) => id.length > 0))]

    if (uniquePropertyIds.length === 0) {
      return {}
    }

    const { data, error } = await supabase
      .from('properties')
      .select('id, name, client_id')
      .in('id', uniquePropertyIds)

    if (error) {
      throw new Error(error.message)
    }

    const propertiesById: Record<string, PropertyNameRow> = {}

    for (const property of ((data ?? []) as unknown as PropertyNameRow[])) {
      propertiesById[property.id] = property
    }

    return propertiesById
  }

  async function getClientNames(clientIds: Array<string | null | undefined>): Promise<Record<string, string>> {
    const uniqueClientIds = [...new Set(clientIds.filter((id): id is string => typeof id === 'string' && id.length > 0))]

    if (uniqueClientIds.length === 0) {
      return {}
    }

    const { data, error } = await supabase
      .from('clients')
      .select('id, name')
      .in('id', uniqueClientIds)

    if (error) {
      throw new Error(error.message)
    }

    const clientNamesById: Record<string, string> = {}

    for (const client of ((data ?? []) as unknown as ClientNameRow[])) {
      clientNamesById[client.id] = client.name?.trim() || 'Unknown client'
    }

    return clientNamesById
  }

  async function getPropertyIdsByClientId(clientId: string): Promise<string[]> {
    if (!clientId) {
      return []
    }

    const { data, error } = await supabase
      .from('properties')
      .select('id')
      .eq('client_id', clientId)

    if (error) {
      throw new Error(error.message)
    }

    return ((data ?? []) as Array<{ id: string }>).map((item) => item.id)
  }

  async function getReportRowById(reportId: string): Promise<PropertyReportRow> {
    const { data, error } = await supabase
      .from('property_reports')
      .select(propertyReportFields)
      .eq('id', reportId)
      .maybeSingle()

    if (error || !data) {
      throw new Error(error?.message ?? 'Report not found.')
    }

    return data as unknown as PropertyReportRow
  }

  async function getReports(filters: PropertyReportFiltersDTO = {}): Promise<PropertyReportAdminListItemDTO[]> {
    let query = supabase
      .from('property_reports')
      .select(propertyReportFields)
      .order('created_at', { ascending: false })

    const statusFilter = filters.status && filters.status !== 'all' ? filters.status : null
    const propertyIdFilter = normalizeFilterValue(filters.property_id)
    const clientIdFilter = normalizeFilterValue(filters.client_id)
    const dateFromFilter = normalizeFilterValue(filters.date_from)
    const dateToFilter = normalizeFilterValue(filters.date_to)
    const searchFilter = normalizeFilterValue(filters.search)

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    if (propertyIdFilter) {
      query = query.eq('property_id', propertyIdFilter)
    }

    if (dateFromFilter) {
      query = query.gte('report_date', dateFromFilter)
    }

    if (dateToFilter) {
      query = query.lte('report_date', dateToFilter)
    }

    if (searchFilter) {
      const escapedSearch = searchFilter.replace(/[%_]/g, '\\$&')
      query = query.or(`title.ilike.%${escapedSearch}%,description_pt.ilike.%${escapedSearch}%,description.ilike.%${escapedSearch}%`)
    }

    if (clientIdFilter) {
      const propertyIds = await getPropertyIdsByClientId(clientIdFilter)

      if (propertyIds.length === 0) {
        return []
      }

      query = query.in('property_id', propertyIds)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(error.message)
    }

    const rows = (data ?? []) as unknown as PropertyReportRow[]

    if (rows.length === 0) {
      return []
    }

    const profileNamesById = await getProfileNames(
      rows.flatMap((row) => [row.created_by_profile_id, row.resolved_by_profile_id]),
    )
    const propertiesById = await getPropertiesByIds(rows.map((row) => row.property_id))
    const clientNamesById = await getClientNames(Object.values(propertiesById).map((property) => property.client_id))

    const enrichedReports = rows.map((row) => {
      const baseReport = toPropertyReportListItemDTO(row, profileNamesById)
      const property = propertiesById[row.property_id]
      const clientId = property?.client_id ?? null

      return {
        ...baseReport,
        property_name: property?.name?.trim() || null,
        client_id: clientId,
        client_name: clientId ? (clientNamesById[clientId] ?? null) : null,
      } satisfies PropertyReportAdminListItemDTO
    })

    if (!searchFilter) {
      return enrichedReports
    }

    return enrichedReports.filter((report) => {
      const title = report.title?.toLowerCase() ?? ''
      const description = report.description_pt?.toLowerCase() ?? ''
      const propertyName = report.property_name?.toLowerCase() ?? ''
      const clientName = report.client_name?.toLowerCase() ?? ''

      return (
        title.includes(searchFilter)
        || description.includes(searchFilter)
        || propertyName.includes(searchFilter)
        || clientName.includes(searchFilter)
      )
    })
  }

  function assertAdmin(profile: ProfileDTO): void {
    if (profile.role !== 'admin') {
      throw new Error('Only admins can change report status.')
    }
  }

  function assertCanManageOwnOrAdmin(profile: ProfileDTO, report: PropertyReportRow, actionLabel: string): void {
    if (profile.role === 'admin') {
      return
    }

    if (report.created_by_profile_id !== profile.id) {
      throw new Error(`You can only ${actionLabel} reports created by you.`)
    }
  }

  async function getReportsByProperty(propertyId: string): Promise<PropertyReportListItemDTO[]> {
    if (!propertyId) {
      return []
    }

    const reports = await getReports({ property_id: propertyId })
    return reports.map((report) => ({
      ...report,
      created_by_name: report.created_by_name,
      resolved_by_name: report.resolved_by_name,
    }))
  }

  async function getOpenReportsByProperty(propertyId: string): Promise<PropertyReportListItemDTO[]> {
    const reports = await getReportsByProperty(propertyId)
    return reports.filter((report) => report.status === 'open')
  }

  async function getReportById(reportId: string): Promise<PropertyReportListItemDTO | null> {
    if (!reportId) {
      return null
    }

    const row = await getReportRowById(reportId)
    const profileNamesById = await getProfileNames([row.created_by_profile_id, row.resolved_by_profile_id])
    return toPropertyReportListItemDTO(row, profileNamesById)
  }

  async function createReport(payload: CreatePropertyReportDTO): Promise<PropertyReportDTO> {
    const profile = await getProfile()
    const descriptionPt = payload.description_pt.trim()
    const reportDate = payload.report_date.trim() || new Date().toISOString().slice(0, 10)

    const insertPayload = {
      property_id: payload.property_id,
      daily_task_id: payload.daily_task_id ?? null,
      report_date: reportDate,
      title: payload.title.trim(),
      description: descriptionPt,
      description_pt: descriptionPt,
      description_en: descriptionPt,
      photo_url: null,
      status: 'open',
      created_by_profile_id: profile.id,
      resolved_by_profile_id: null,
      resolved_at: null,
    }

    const { data, error } = await supabase
      .from('property_reports')
      .insert(insertPayload)
      .select(propertyReportFields)
      .single()

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to create report.')
    }

    return toPropertyReportDTO(data as unknown as PropertyReportRow)
  }

  async function deleteReport(reportId: string): Promise<void> {
    const profile = await getProfile()
    const report = await getReportRowById(reportId)

    assertCanManageOwnOrAdmin(profile, report, 'delete')

    const { error: photoDeleteError } = await supabase
      .from('property_report_photos')
      .delete()
      .eq('report_id', reportId)

    if (photoDeleteError) {
      throw new Error(photoDeleteError.message)
    }

    const { error } = await supabase
      .from('property_reports')
      .delete()
      .eq('id', reportId)

    if (error) {
      throw new Error(error.message)
    }
  }

  async function resolveReport(reportId: string): Promise<PropertyReportDTO> {
    const profile = await getProfile()
    const report = await getReportRowById(reportId)

    assertCanManageOwnOrAdmin(profile, report, 'resolve')

    const { data, error } = await supabase
      .from('property_reports')
      .update({
        status: 'resolved',
        resolved_by_profile_id: profile.id,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .select(propertyReportFields)
      .single()

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to resolve report.')
    }

    return toPropertyReportDTO(data as unknown as PropertyReportRow)
  }

  async function updateReportStatus(reportId: string, status: PropertyReportStatus): Promise<PropertyReportDTO> {
    const profile = await getProfile()

    assertAdmin(profile)

    const updatePayload = status === 'resolved'
      ? {
          status: 'resolved',
          resolved_by_profile_id: profile.id,
          resolved_at: new Date().toISOString(),
        }
      : {
          status: 'open',
          resolved_by_profile_id: null,
          resolved_at: null,
        }

    const { data, error } = await supabase
      .from('property_reports')
      .update(updatePayload)
      .eq('id', reportId)
      .select(propertyReportFields)
      .single()

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to update report status.')
    }

    return toPropertyReportDTO(data as unknown as PropertyReportRow)
  }

  async function updateReport(reportId: string, payload: UpdatePropertyReportDTO): Promise<PropertyReportDTO> {
    const profile = await getProfile()
    const report = await getReportRowById(reportId)

    assertCanManageOwnOrAdmin(profile, report, 'edit')

    const updatePayload: Record<string, string | null> = {}

    if (typeof payload.title === 'string') {
      updatePayload.title = payload.title.trim()
    }

    if (typeof payload.report_date === 'string') {
      updatePayload.report_date = payload.report_date.trim() || new Date().toISOString().slice(0, 10)
    }

    if (typeof payload.description_pt === 'string') {
      const descriptionPt = payload.description_pt.trim()
      updatePayload.description_pt = descriptionPt
      updatePayload.description = descriptionPt
      updatePayload.description_en = descriptionPt
    }

    const { data, error } = await supabase
      .from('property_reports')
      .update(updatePayload)
      .eq('id', reportId)
      .select(propertyReportFields)
      .single()

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to update report.')
    }

    return toPropertyReportDTO(data as unknown as PropertyReportRow)
  }

  async function setReportPrimaryPhoto(reportId: string, photoUrl: string | null): Promise<PropertyReportDTO> {
    const profile = await getProfile()
    const report = await getReportRowById(reportId)

    assertCanManageOwnOrAdmin(profile, report, 'edit')

    const { data, error } = await supabase
      .from('property_reports')
      .update({ photo_url: photoUrl })
      .eq('id', reportId)
      .select(propertyReportFields)
      .single()

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to update report photo.')
    }

    return toPropertyReportDTO(data as unknown as PropertyReportRow)
  }

  return {
    getReports,
    getReportsByProperty,
    getOpenReportsByProperty,
    getReportById,
    createReport,
    deleteReport,
    resolveReport,
    updateReportStatus,
    updateReport,
    setReportPrimaryPhoto,
  }
}
