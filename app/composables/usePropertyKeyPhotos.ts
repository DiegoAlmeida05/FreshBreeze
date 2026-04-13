import { useSupabaseClient } from './useSupabaseClient'
import type { PropertyKeyPhotoDTO } from '../../shared/types/PropertyKeyPhotoDTO'

interface PropertyKeyPhotoRow {
  id: string
  property_id: string
  photo_url: string
  sort_order: number | null
  created_at: string | null
}

const keyPhotoFields = 'id, property_id, photo_url, sort_order, created_at'

function toDTO(row: PropertyKeyPhotoRow): PropertyKeyPhotoDTO {
  return {
    id: row.id,
    property_id: row.property_id,
    photo_url: row.photo_url,
    sort_order: Number(row.sort_order ?? 0),
    created_at: row.created_at ?? '',
  }
}

export function usePropertyKeyPhotos() {
  const supabase = useSupabaseClient()

  async function getPhotosByPropertyId(propertyId: string): Promise<PropertyKeyPhotoDTO[]> {
    if (!propertyId) {
      return []
    }

    const { data, error } = await supabase
      .from('property_key_photos')
      .select(keyPhotoFields)
      .eq('property_id', propertyId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return ((data ?? []) as unknown as PropertyKeyPhotoRow[]).map((row) => toDTO(row))
  }

  async function replacePropertyPhotos(propertyId: string, photoUrls: string[]): Promise<void> {
    if (!propertyId) {
      return
    }

    const { error: deleteError } = await supabase
      .from('property_key_photos')
      .delete()
      .eq('property_id', propertyId)

    if (deleteError) {
      throw new Error(deleteError.message)
    }

    if (photoUrls.length === 0) {
      return
    }

    const payload = photoUrls.map((photoUrl, index) => ({
      property_id: propertyId,
      photo_url: photoUrl,
      sort_order: index,
    }))

    const { error: insertError } = await supabase
      .from('property_key_photos')
      .insert(payload)

    if (insertError) {
      throw new Error(insertError.message)
    }
  }

  return {
    getPhotosByPropertyId,
    replacePropertyPhotos,
  }
}
