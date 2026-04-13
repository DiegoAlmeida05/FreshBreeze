import { useSupabaseClient } from './useSupabaseClient'
import { useAuth } from './useAuth'
import type { PropertyReportPhotoDTO } from '../../shared/types/PropertyReportPhotoDTO'

interface PropertyReportPhotoRow {
  id: string
  report_id: string
  photo_url: string
  sort_order: number | null
  created_at: string | null
}

const reportPhotoFields = 'id, report_id, photo_url, sort_order, created_at'

function toDTO(row: PropertyReportPhotoRow): PropertyReportPhotoDTO {
  return {
    id: row.id,
    report_id: row.report_id,
    photo_url: row.photo_url,
    sort_order: Number(row.sort_order ?? 0),
    created_at: row.created_at ?? '',
  }
}

export function usePropertyReportPhotos() {
  const supabase = useSupabaseClient()
  const { getProfile } = useAuth()

  async function assertCanManageReportPhotos(reportId: string): Promise<void> {
    const profile = await getProfile()

    if (profile.role === 'admin') {
      return
    }

    const { data, error } = await supabase
      .from('property_reports')
      .select('created_by_profile_id')
      .eq('id', reportId)
      .maybeSingle<{ created_by_profile_id: string }>()

    if (error || !data) {
      throw new Error(error?.message ?? 'Report not found.')
    }

    if (data.created_by_profile_id !== profile.id) {
      throw new Error('You can only edit photos for reports created by you.')
    }
  }

  async function syncPrimaryPhoto(reportId: string): Promise<void> {
    const { data, error } = await supabase
      .from('property_report_photos')
      .select(reportPhotoFields)
      .eq('report_id', reportId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    const primaryPhotoUrl = ((data ?? []) as unknown as PropertyReportPhotoRow[])[0]?.photo_url ?? null

    const { error: updateError } = await supabase
      .from('property_reports')
      .update({ photo_url: primaryPhotoUrl })
      .eq('id', reportId)

    if (updateError) {
      throw new Error(updateError.message)
    }
  }

  async function getPhotosByReportIds(reportIds: string[]): Promise<Record<string, PropertyReportPhotoDTO[]>> {
    const byReport: Record<string, PropertyReportPhotoDTO[]> = {}

    if (reportIds.length === 0) {
      return byReport
    }

    const { data, error } = await supabase
      .from('property_report_photos')
      .select(reportPhotoFields)
      .in('report_id', reportIds)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    for (const row of ((data ?? []) as unknown as PropertyReportPhotoRow[])) {
      const dto = toDTO(row)
      if (!byReport[dto.report_id]) {
        byReport[dto.report_id] = []
      }
      byReport[dto.report_id]!.push(dto)
    }

    return byReport
  }

  async function createPhotos(reportId: string, photoUrls: string[]): Promise<void> {
    if (!reportId || photoUrls.length === 0) {
      return
    }

    await assertCanManageReportPhotos(reportId)

    const { data: existingRows, error: existingRowsError } = await supabase
      .from('property_report_photos')
      .select('sort_order')
      .eq('report_id', reportId)
      .order('sort_order', { ascending: false })
      .limit(1)

    if (existingRowsError) {
      throw new Error(existingRowsError.message)
    }

    const initialSortOrder = Number(((existingRows ?? [])[0] as { sort_order?: number } | undefined)?.sort_order ?? -1) + 1

    const payload = photoUrls.map((photoUrl, index) => ({
      report_id: reportId,
      photo_url: photoUrl,
      sort_order: initialSortOrder + index,
    }))

    const { error } = await supabase
      .from('property_report_photos')
      .insert(payload)

    if (error) {
      throw new Error(error.message)
    }

    await syncPrimaryPhoto(reportId)
  }

  async function deletePhotos(reportId: string, photoIds: string[]): Promise<void> {
    if (!reportId || photoIds.length === 0) {
      return
    }

    await assertCanManageReportPhotos(reportId)

    const { error } = await supabase
      .from('property_report_photos')
      .delete()
      .eq('report_id', reportId)
      .in('id', photoIds)

    if (error) {
      throw new Error(error.message)
    }

    await syncPrimaryPhoto(reportId)
  }

  return {
    getPhotosByReportIds,
    createPhotos,
    deletePhotos,
  }
}
