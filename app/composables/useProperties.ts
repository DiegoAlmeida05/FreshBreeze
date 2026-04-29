import type {
  CreatePropertyDTO,
  CreatePropertyKeyDTO,
  CreatePropertyResourceDTO,
  PropertyDTO,
  PropertyKeyDTO,
  PropertyResourceDTO,
  PropertyResourceType,
  PropertyTags,
  UpdatePropertyDTO,
} from '../../shared/types/PropertyDTO'
import { useSupabaseClient } from './useSupabaseClient'

interface PropertyRow {
  id: string
  client_id: string
  name: string
  address: string | null
  lat: number | null
  lng: number | null
  bathrooms: number | null
  beds_single: number | null
  beds_queen: number | null
  beds_king: number | null
  default_cleaning_minutes: number | null
  linen_combo_extra_price: number | null
  amenities_combo_extra_price: number | null
  linen_queen_extra_price: number | null
  linen_single_extra_price: number | null
  linen_king_extra_price: number | null
  towel_extra_price: number | null
  chocolate_extra_price: number | null
  linen_pack_fee: number | null
  amenities_pack_fee: number | null
  includes_amenities: boolean | null
  includes_chocolates: boolean | null
  extra_towels_default_qty: number | null
  extra_dishcloths_default_qty: number | null
  notes: string | null
  has_keys: boolean | null
  key_count: number | null
  default_tags: unknown
  active: boolean | null
  created_at: string | null
  updated_at: string | null
}

interface PropertyKeyRow {
  id: string
  property_id: string
  label: string | null
  pickup_address: string | null
  note: string | null
  attachment_url: string | null
  sort_order: number | null
  created_at: string | null
  updated_at: string | null
}

interface PropertyResourceRow {
  id: string
  property_id: string
  title: string | null
  resource_type: string | null
  url: string | null
  attachment_url: string | null
  note: string | null
  sort_order: number | null
  created_at: string | null
  updated_at: string | null
}

const propertySelectFields = [
  'id',
  'client_id',
  'name',
  'address',
  'lat',
  'lng',
  'bathrooms',
  'beds_single',
  'beds_queen',
  'beds_king',
  'default_cleaning_minutes',
  'linen_combo_extra_price',
  'amenities_combo_extra_price',
  'linen_queen_extra_price',
  'linen_single_extra_price',
  'linen_king_extra_price',
  'towel_extra_price',
  'chocolate_extra_price',
  'linen_pack_fee',
  'amenities_pack_fee',
  'includes_amenities',
  'includes_chocolates',
  'extra_towels_default_qty',
  'extra_dishcloths_default_qty',
  'notes',
  'has_keys',
  'key_count',
  'default_tags',
  'active',
  'created_at',
  'updated_at',
].join(', ')

const propertyKeyFields = [
  'id',
  'property_id',
  'label',
  'pickup_address',
  'note',
  'attachment_url',
  'sort_order',
  'created_at',
  'updated_at',
].join(', ')

const propertyResourceFields = [
  'id',
  'property_id',
  'title',
  'resource_type',
  'url',
  'attachment_url',
  'note',
  'sort_order',
  'created_at',
  'updated_at',
].join(', ')

function normalizePropertyTagValue(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, ' ')
}

function normalizePropertyTags(tags: unknown): PropertyTags {
  if (!Array.isArray(tags)) {
    return []
  }

  const normalized = tags
    .filter((tag): tag is string => typeof tag === 'string')
    .map((tag) => normalizePropertyTagValue(tag))
    .filter((tag) => tag.length > 0)

  return Array.from(new Set(normalized))
}

function normalizeResourceType(value: string | null | undefined): PropertyResourceType {
  return value === 'attachment' ? 'attachment' : 'link'
}

function toPropertyKeyDTO(row: PropertyKeyRow): PropertyKeyDTO {
  return {
    id: row.id,
    property_id: row.property_id,
    label: String(row.label ?? '').trim(),
    pickup_address: row.pickup_address ? String(row.pickup_address).trim() : null,
    note: row.note ? String(row.note).trim() : null,
    attachment_url: row.attachment_url ? String(row.attachment_url).trim() : null,
    sort_order: Number(row.sort_order ?? 0),
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
  }
}

function toPropertyResourceDTO(row: PropertyResourceRow): PropertyResourceDTO {
  return {
    id: row.id,
    property_id: row.property_id,
    resource_type: normalizeResourceType(row.resource_type),
    url: String(row.url ?? '').trim(),
    attachment_url: row.attachment_url ? String(row.attachment_url).trim() : null,
    sort_order: Number(row.sort_order ?? 0),
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
  }
}

function toPropertyDTO(
  row: PropertyRow,
  propertyKeys: PropertyKeyDTO[],
  propertyResources: PropertyResourceDTO[],
): PropertyDTO {
  const linkResources = propertyResources.filter((resource) => resource.resource_type === 'link')
  const firstKey = propertyKeys[0] ?? null

  return {
    id: row.id,
    client_id: row.client_id,
    name: row.name,
    address: row.address ?? '',
    lat: row.lat ?? null,
    lng: row.lng ?? null,
    bathrooms: Number(row.bathrooms ?? 0),
    beds_single: Number(row.beds_single ?? 0),
    beds_queen: Number(row.beds_queen ?? 0),
    beds_king: Number(row.beds_king ?? 0),
    default_cleaning_minutes: Number(row.default_cleaning_minutes ?? 0),
    linen_combo_extra_price: Number(row.linen_combo_extra_price ?? 0),
    amenities_combo_extra_price: Number(row.amenities_combo_extra_price ?? 0),
    linen_queen_extra_price: Number(row.linen_queen_extra_price ?? 0),
    linen_single_extra_price: Number(row.linen_single_extra_price ?? 0),
    linen_king_extra_price: Number(row.linen_king_extra_price ?? 0),
    towel_extra_price: Number(row.towel_extra_price ?? 0),
    chocolate_extra_price: Number(row.chocolate_extra_price ?? 0),
    linen_pack_fee: Number(row.linen_pack_fee ?? 0),
    amenities_pack_fee: Number(row.amenities_pack_fee ?? 0),
    includes_amenities: row.includes_amenities !== false,
    includes_chocolates: Boolean(row.includes_chocolates),
    extra_towels_default_qty: Number(row.extra_towels_default_qty ?? 0),
    extra_dishcloths_default_qty: Number(row.extra_dishcloths_default_qty ?? 0),
    notes: row.notes ?? null,
    has_keys: Boolean(row.has_keys) || propertyKeys.length > 0,
    key_count: Math.max(Number(row.key_count ?? 0), propertyKeys.length),
    property_keys: propertyKeys,
    property_resources: propertyResources,
    link_1: linkResources[0]?.url ?? null,
    link_2: linkResources[1]?.url ?? null,
    has_key: Boolean(row.has_keys) || propertyKeys.length > 0,
    key_pickup_address: firstKey?.pickup_address ?? null,
    key_photo_url: null,
    default_tags: normalizePropertyTags(row.default_tags),
    active: Boolean(row.active),
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
  }
}

function toCreatePropertyPayload(payload: CreatePropertyDTO): CreatePropertyDTO {
  return {
    client_id: payload.client_id,
    name: payload.name.trim(),
    address: payload.address.trim(),
    lat: payload.lat ?? null,
    lng: payload.lng ?? null,
    bathrooms: Number(payload.bathrooms ?? 0),
    beds_single: Number(payload.beds_single ?? 0),
    beds_queen: Number(payload.beds_queen ?? 0),
    beds_king: Number(payload.beds_king ?? 0),
    default_cleaning_minutes: Number(payload.default_cleaning_minutes ?? 0),
    linen_combo_extra_price: Number(payload.linen_combo_extra_price ?? 0),
    amenities_combo_extra_price: Number(payload.amenities_combo_extra_price ?? 0),
    linen_queen_extra_price: Number(payload.linen_queen_extra_price ?? 0),
    linen_single_extra_price: Number(payload.linen_single_extra_price ?? 0),
    linen_king_extra_price: Number(payload.linen_king_extra_price ?? 0),
    towel_extra_price: Number(payload.towel_extra_price ?? 0),
    chocolate_extra_price: Number(payload.chocolate_extra_price ?? 0),
    linen_pack_fee: Number(payload.linen_pack_fee ?? 0),
    amenities_pack_fee: Number(payload.amenities_pack_fee ?? 0),
    includes_amenities: payload.includes_amenities !== false,
    includes_chocolates: Boolean(payload.includes_chocolates),
    extra_towels_default_qty: Number(payload.extra_towels_default_qty ?? 0),
    extra_dishcloths_default_qty: Number(payload.extra_dishcloths_default_qty ?? 0),
    notes: payload.notes?.trim() || null,
    has_keys: Boolean(payload.has_keys),
    key_count: Math.max(0, Number(payload.key_count ?? 0)),
    default_tags: normalizePropertyTags(payload.default_tags),
    active: payload.active ?? true,
  }
}

function toUpdatePropertyPayload(payload: UpdatePropertyDTO): UpdatePropertyDTO {
  return {
    client_id: payload.client_id,
    name: payload.name?.trim(),
    address: payload.address?.trim(),
    lat: payload.lat ?? undefined,
    lng: payload.lng ?? undefined,
    bathrooms: payload.bathrooms === undefined ? undefined : Number(payload.bathrooms),
    beds_single: payload.beds_single === undefined ? undefined : Number(payload.beds_single),
    beds_queen: payload.beds_queen === undefined ? undefined : Number(payload.beds_queen),
    beds_king: payload.beds_king === undefined ? undefined : Number(payload.beds_king),
    default_cleaning_minutes: payload.default_cleaning_minutes === undefined ? undefined : Number(payload.default_cleaning_minutes),
    linen_combo_extra_price: payload.linen_combo_extra_price === undefined ? undefined : Number(payload.linen_combo_extra_price),
    amenities_combo_extra_price: payload.amenities_combo_extra_price === undefined ? undefined : Number(payload.amenities_combo_extra_price),
    linen_queen_extra_price: payload.linen_queen_extra_price === undefined ? undefined : Number(payload.linen_queen_extra_price),
    linen_single_extra_price: payload.linen_single_extra_price === undefined ? undefined : Number(payload.linen_single_extra_price),
    linen_king_extra_price: payload.linen_king_extra_price === undefined ? undefined : Number(payload.linen_king_extra_price),
    towel_extra_price: payload.towel_extra_price === undefined ? undefined : Number(payload.towel_extra_price),
    chocolate_extra_price: payload.chocolate_extra_price === undefined ? undefined : Number(payload.chocolate_extra_price),
    linen_pack_fee: payload.linen_pack_fee === undefined ? undefined : Number(payload.linen_pack_fee),
    amenities_pack_fee: payload.amenities_pack_fee === undefined ? undefined : Number(payload.amenities_pack_fee),
    includes_amenities: payload.includes_amenities,
    includes_chocolates: payload.includes_chocolates,
    extra_towels_default_qty: payload.extra_towels_default_qty === undefined ? undefined : Number(payload.extra_towels_default_qty),
    extra_dishcloths_default_qty: payload.extra_dishcloths_default_qty === undefined ? undefined : Number(payload.extra_dishcloths_default_qty),
    notes: payload.notes === undefined ? undefined : payload.notes?.trim() || null,
    has_keys: payload.has_keys,
    key_count: payload.key_count === undefined ? undefined : Math.max(0, Number(payload.key_count)),
    default_tags: payload.default_tags === undefined ? undefined : normalizePropertyTags(payload.default_tags),
    active: payload.active,
  }
}

function normalizePropertyKeys(keys: CreatePropertyKeyDTO[]): CreatePropertyKeyDTO[] {
  return keys
    .map((key, index) => ({
      label: key.label.trim(),
      pickup_address: key.pickup_address?.trim() || null,
      note: key.note?.trim() || null,
      attachment_url: key.attachment_url?.trim() || null,
      sort_order: index,
    }))
    .filter((key) => key.label.length > 0 || (key.pickup_address ?? '').length > 0 || (key.note ?? '').length > 0 || (key.attachment_url ?? '').length > 0)
}

function normalizePropertyResources(resources: CreatePropertyResourceDTO[]): CreatePropertyResourceDTO[] {
  return resources
    .map((resource, index) => {
      const normalizedUrl = resource.url.trim()
      const normalizedAttachmentUrl = resource.attachment_url?.trim() || null

      return {
        resource_type: normalizeResourceType(resource.resource_type),
        url: normalizedUrl || normalizedAttachmentUrl || '',
        attachment_url: normalizedAttachmentUrl,
        sort_order: index,
      }
    })
    .filter((resource) => resource.url.length > 0 || (resource.attachment_url ?? '').length > 0)
}

export function useProperties() {
  const supabase = useSupabaseClient()

  async function loadPropertyKeys(propertyIds: string[]): Promise<Map<string, PropertyKeyDTO[]>> {
    const grouped = new Map<string, PropertyKeyDTO[]>()

    if (propertyIds.length === 0) {
      return grouped
    }

    const { data, error } = await supabase
      .from('property_keys')
      .select(propertyKeyFields)
      .in('property_id', propertyIds)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    for (const row of ((data ?? []) as unknown as PropertyKeyRow[])) {
      const item = toPropertyKeyDTO(row)
      const current = grouped.get(item.property_id) ?? []
      current.push(item)
      grouped.set(item.property_id, current)
    }

    return grouped
  }

  async function loadPropertyResources(propertyIds: string[]): Promise<Map<string, PropertyResourceDTO[]>> {
    const grouped = new Map<string, PropertyResourceDTO[]>()

    if (propertyIds.length === 0) {
      return grouped
    }

    const { data, error } = await supabase
      .from('property_resources')
      .select(propertyResourceFields)
      .in('property_id', propertyIds)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    for (const row of ((data ?? []) as unknown as PropertyResourceRow[])) {
      const item = toPropertyResourceDTO(row)
      const current = grouped.get(item.property_id) ?? []
      current.push(item)
      grouped.set(item.property_id, current)
    }

    return grouped
  }

  async function hydrateProperties(rows: PropertyRow[]): Promise<PropertyDTO[]> {
    const propertyIds = rows.map((row) => row.id)
    const [keysByPropertyId, resourcesByPropertyId] = await Promise.all([
      loadPropertyKeys(propertyIds),
      loadPropertyResources(propertyIds),
    ])

    return rows.map((row) => toPropertyDTO(
      row,
      keysByPropertyId.get(row.id) ?? [],
      resourcesByPropertyId.get(row.id) ?? [],
    ))
  }

  async function fetchProperties(): Promise<PropertyDTO[]> {
    const { data, error } = await supabase
      .from('properties')
      .select(propertySelectFields)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return hydrateProperties((data ?? []) as unknown as PropertyRow[])
  }

  async function getPropertyById(id: string): Promise<PropertyDTO | null> {
    const { data, error } = await supabase
      .from('properties')
      .select(propertySelectFields)
      .eq('id', id)
      .maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    if (!data) {
      return null
    }

    const [hydrated] = await hydrateProperties([data as unknown as PropertyRow])
    return hydrated ?? null
  }

  async function createProperty(payload: CreatePropertyDTO): Promise<PropertyDTO> {
    const normalizedPayload = toCreatePropertyPayload(payload)

    const { data, error } = await supabase
      .from('properties')
      .insert(normalizedPayload)
      .select(propertySelectFields)
      .single()

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to create property.')
    }

    const [hydrated] = await hydrateProperties([data as unknown as PropertyRow])

    if (!hydrated) {
      throw new Error('Failed to hydrate created property.')
    }

    return hydrated
  }

  async function updateProperty(id: string, payload: UpdatePropertyDTO): Promise<PropertyDTO> {
    const normalizedPayload = toUpdatePropertyPayload(payload)

    const { data, error } = await supabase
      .from('properties')
      .update(normalizedPayload)
      .eq('id', id)
      .select(propertySelectFields)
      .single()

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to update property.')
    }

    const [hydrated] = await hydrateProperties([data as unknown as PropertyRow])

    if (!hydrated) {
      throw new Error('Failed to hydrate updated property.')
    }

    return hydrated
  }

  async function replacePropertyKeys(propertyId: string, keys: CreatePropertyKeyDTO[]): Promise<void> {
    if (!propertyId) {
      return
    }

    const normalizedKeys = normalizePropertyKeys(keys)

    const { error: deleteError } = await supabase
      .from('property_keys')
      .delete()
      .eq('property_id', propertyId)

    if (deleteError) {
      throw new Error(deleteError.message)
    }

    if (normalizedKeys.length === 0) {
      return
    }

    const payload = normalizedKeys.map((key) => ({
      property_id: propertyId,
      label: key.label,
      pickup_address: key.pickup_address ?? null,
      note: key.note ?? null,
      attachment_url: key.attachment_url ?? null,
      sort_order: key.sort_order ?? 0,
    }))

    const { error: insertError } = await supabase
      .from('property_keys')
      .insert(payload)

    if (insertError) {
      throw new Error(insertError.message)
    }
  }

  async function replacePropertyResources(propertyId: string, resources: CreatePropertyResourceDTO[]): Promise<void> {
    if (!propertyId) {
      return
    }

    const normalizedResources = normalizePropertyResources(resources)

    const { error: deleteError } = await supabase
      .from('property_resources')
      .delete()
      .eq('property_id', propertyId)

    if (deleteError) {
      throw new Error(deleteError.message)
    }

    if (normalizedResources.length === 0) {
      return
    }

    const payload = normalizedResources.map((resource) => ({
      property_id: propertyId,
      title: resource.resource_type === 'attachment'
        ? `File ${(resource.sort_order ?? 0) + 1}`
        : `Link ${(resource.sort_order ?? 0) + 1}`,
      resource_type: resource.resource_type,
      url: resource.url,
      attachment_url: resource.attachment_url ?? null,
      note: null,
      sort_order: resource.sort_order ?? 0,
    }))

    const { error: insertError } = await supabase
      .from('property_resources')
      .insert(payload)

    if (insertError) {
      throw new Error(insertError.message)
    }
  }

  async function deleteProperty(id: string): Promise<void> {
    const cleanupResults = await Promise.all([
      supabase.from('property_keys').delete().eq('property_id', id),
      supabase.from('property_resources').delete().eq('property_id', id),
      supabase.from('property_key_photos').delete().eq('property_id', id),
    ])

    for (const result of cleanupResults) {
      if (result.error) {
        throw new Error(result.error.message)
      }
    }

    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(error.message)
    }
  }

  return {
    fetchProperties,
    getPropertyById,
    createProperty,
    updateProperty,
    replacePropertyKeys,
    replacePropertyResources,
    deleteProperty,
  }
}
