import { useSupabaseClient } from './useSupabaseClient'
import { useAuth } from './useAuth'
import { fmtTime } from '../utils/formatTime'

export interface ScheduleItem {
  stopId: string
  groupLabel: string
  orderIndex: number
  plannedStartTime: string | null
  plannedEndTime: string | null
  propertyId: string
  propertyName: string
  clientName: string
  address: string
  propertyLat: number | null
  propertyLng: number | null
  hasKey: boolean
  keyPhotoUrl: string | null
  link1: string | null
  link2: string | null
  cleaningMinutes: number
  bathrooms: number
  taskType: 'BSB' | 'NORMAL'
  tags: string[]
  propertyDefaultTags: string[]
  guestName: string | null
  guestCheckinDate: string | null
  extraTowelsQty: number
  bedsSingle: number
  bedsQueen: number
  bedsKing: number
  extraTowelsDefaultQty: number
  extraDishclothsDefaultQty: number
  extraBedsSingle: number
  extraBedsQueen: number
  extraBedsKing: number
  includesChocolates: boolean
  extraChocolatesQty: number
  notes: string | null
  clientColor: string
}

export interface WorkerScheduleResult {
  scheduleItems: ScheduleItem[]
  availableGroups: string[]
}

interface RoutePlanRow {
  id: string
}

interface RouteGroupRow {
  id: string
  group_label: string
  sort_order: number | null
}

interface RouteGroupMemberRow {
  route_group_id: string
}

interface EmployeeRow {
  id: string
}

interface RouteStopRow {
  id: string
  route_group_id: string
  daily_task_id: string
  order_index: number | null
  planned_start_time: string | null
  planned_end_time: string | null
}

interface DailyTaskRow {
  id: string
  property_id: string
  guest_name: string | null
  guest_checkin_date: string | null
  tags: unknown
  task_type: string | null
  notes: string | null
  extra_linen_single_qty: number | null
  extra_linen_queen_qty: number | null
  extra_linen_king_qty: number | null
  extra_towel_qty: number | null
  extra_chocolate_qty: number | null
  cleaning_minutes_override: number | null
}

interface PropertyRow {
  id: string
  client_id: string
  name: string
  address: string
  lat: number | null
  lng: number | null
  has_keys: boolean
  default_cleaning_minutes: number | null
  bathrooms: number | string | null
  beds_single: number | null
  beds_queen: number | null
  beds_king: number | null
  extra_towels_default_qty: number | null
  extra_dishcloths_default_qty: number | null
  includes_chocolates: boolean
  default_tags: unknown
}

interface PropertyKeyRow {
  property_id: string
  pickup_address: string | null
}

interface PropertyResourceRow {
  property_id: string
  resource_type: string | null
  url: string | null
  sort_order: number | null
}

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, ' ')
}

function normalizeTagList(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    return []
  }

  const normalized = tags
    .filter((tag): tag is string => typeof tag === 'string')
    .map((tag) => normalizeTag(tag))
    .filter((tag) => tag.length > 0)

  return Array.from(new Set(normalized))
}

interface ClientRow {
  id: string
  name: string | null
  color: string
}

export function useWorkerSchedule() {
  const supabase = useSupabaseClient()
  const auth = useAuth()
  let cachedProfile: { id: string; role: string } | null = null
  let profileRequest: Promise<{ id: string; role: string }> | null = null

  async function getCachedProfile(): Promise<{ id: string; role: string }> {
    if (cachedProfile) {
      return cachedProfile
    }

    if (!profileRequest) {
      profileRequest = auth.getProfile().then((profile) => ({
        id: profile.id,
        role: profile.role,
      }))
    }

    try {
      cachedProfile = await profileRequest
      return cachedProfile
    } finally {
      profileRequest = null
    }
  }

  async function getSchedule(date: string, groupLabel?: string): Promise<WorkerScheduleResult> {
    const empty: WorkerScheduleResult = { scheduleItems: [], availableGroups: [] }

    if (!date) return empty

    const profile = await getCachedProfile()
    const isAdmin = profile.role === 'admin'

    // Load the published route_plan for this date
    const { data: planData, error: planError } = await supabase
      .from('route_plans')
      .select('id')
      .eq('date', date)
      .eq('status', 'published')
      .maybeSingle()

    if (planError) throw new Error(planError.message)
    if (!planData) return empty

    const planId = (planData as RoutePlanRow).id

    // Load all route_groups for this plan
    const { data: groupData, error: groupError } = await supabase
      .from('route_groups')
      .select('id, group_label, sort_order')
      .eq('route_plan_id', planId)
      .order('sort_order', { ascending: true })

    if (groupError) throw new Error(groupError.message)

    let groups = (groupData ?? []) as RouteGroupRow[]

    // Collect available group labels (for admin filter dropdown) before any filtering
    const availableGroups = [...new Set(groups.map((g) => g.group_label))]

    if (groups.length === 0) return { scheduleItems: [], availableGroups }

    // Worker: map profile -> employee, then keep only assigned groups
    if (!isAdmin) {
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('id')
        .eq('profile_id', profile.id)
        .maybeSingle()

      if (employeeError) throw new Error(employeeError.message)
      if (!employeeData) return { scheduleItems: [], availableGroups }

      const employeeId = (employeeData as EmployeeRow).id
      const allGroupIds = groups.map((g) => g.id)

      const { data: memberData, error: memberError } = await supabase
        .from('route_group_members')
        .select('route_group_id')
        .eq('employee_id', employeeId)
        .in('route_group_id', allGroupIds)

      if (memberError) throw new Error(memberError.message)

      const assignedGroupIds = new Set(
        (memberData ?? []).map((m) => (m as RouteGroupMemberRow).route_group_id),
      )

      groups = groups.filter((g) => assignedGroupIds.has(g.id))
    }

    // Admin: filter by selected group label if provided
    if (isAdmin && groupLabel && groupLabel !== 'all') {
      groups = groups.filter((g) => g.group_label === groupLabel)
    }

    if (groups.length === 0) return { scheduleItems: [], availableGroups }

    const filteredGroupIds = groups.map((g) => g.id)

    // Load route_stops for the filtered groups
    const { data: stopData, error: stopError } = await supabase
      .from('route_stops')
      .select('id, route_group_id, daily_task_id, order_index, planned_start_time, planned_end_time')
      .in('route_group_id', filteredGroupIds)
      .order('order_index', { ascending: true })

    if (stopError) throw new Error(stopError.message)

    const stops = (stopData ?? []) as RouteStopRow[]
    if (stops.length === 0) return { scheduleItems: [], availableGroups }

    const taskIds = stops.map((s) => s.daily_task_id)

    // Load daily_tasks
    const { data: taskData, error: taskError } = await supabase
      .from('daily_tasks')
      .select(
        'id, property_id, guest_name, guest_checkin_date, tags, task_type, notes, extra_linen_single_qty, extra_linen_queen_qty, extra_linen_king_qty, extra_towel_qty, extra_chocolate_qty, cleaning_minutes_override',
      )
      .in('id', taskIds)

    if (taskError) throw new Error(taskError.message)

    const tasks = (taskData ?? []) as DailyTaskRow[]
    if (tasks.length === 0) return { scheduleItems: [], availableGroups }

    const taskMap = new Map(tasks.map((t) => [t.id, t]))
    const propertyIds = [...new Set(tasks.map((t) => t.property_id))]

    // Load properties
    const { data: propData, error: propError } = await supabase
      .from('properties')
      .select('id, client_id, name, address, lat, lng, has_keys, default_cleaning_minutes, bathrooms, beds_single, beds_queen, beds_king, extra_towels_default_qty, extra_dishcloths_default_qty, includes_chocolates, default_tags')
      .in('id', propertyIds)

    if (propError) throw new Error(propError.message)

    const properties = (propData ?? []) as PropertyRow[]
    const propertyMap = new Map(properties.map((p) => [p.id, p]))

    const clientIds = [...new Set(properties.map((p) => p.client_id))]

    const [
      { data: propertyKeyData, error: propertyKeyError },
      { data: propertyResourceData, error: propertyResourceError },
      { data: clientData, error: clientError },
    ] = await Promise.all([
      supabase
        .from('property_keys')
        .select('property_id, pickup_address')
        .in('property_id', propertyIds)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }),
      supabase
        .from('property_resources')
        .select('property_id, resource_type, url, sort_order')
        .in('property_id', propertyIds)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }),
      supabase
        .from('clients')
        .select('id, name, color')
        .in('id', clientIds),
    ])

    if (propertyKeyError) throw new Error(propertyKeyError.message)
    if (propertyResourceError) throw new Error(propertyResourceError.message)
    if (clientError) throw new Error(clientError.message)

    const propertyKeysById = new Map<string, PropertyKeyRow[]>()
    const propertyResourcesById = new Map<string, PropertyResourceRow[]>()

    for (const row of ((propertyKeyData ?? []) as PropertyKeyRow[])) {
      const current = propertyKeysById.get(row.property_id) ?? []
      current.push(row)
      propertyKeysById.set(row.property_id, current)
    }

    for (const row of ((propertyResourceData ?? []) as PropertyResourceRow[])) {
      const current = propertyResourcesById.get(row.property_id) ?? []
      current.push(row)
      propertyResourcesById.set(row.property_id, current)
    }

    const clients = (clientData ?? []) as ClientRow[]
    const clientMap = new Map(clients.map((c) => [c.id, c]))

    const groupLabelMap = new Map(groups.map((g) => [g.id, g.group_label]))
    const groupSortMap = new Map(groups.map((g) => [g.group_label, g.sort_order ?? 0]))

    // Build schedule items
    const scheduleItems: ScheduleItem[] = []

    for (const stop of stops) {
      const task = taskMap.get(stop.daily_task_id)
      if (!task) continue

      const property = propertyMap.get(task.property_id)
      if (!property) continue

      const propertyKeys = propertyKeysById.get(property.id) ?? []
      const propertyResources = (propertyResourcesById.get(property.id) ?? [])
        .filter((resource) => resource.resource_type === 'link' && typeof resource.url === 'string' && resource.url.trim().length > 0)

      const client = clientMap.get(property.client_id)
      const label = groupLabelMap.get(stop.route_group_id) ?? ''
      const tags = normalizeTagList(task.tags)

      scheduleItems.push({
        stopId: stop.id,
        groupLabel: label,
        orderIndex: stop.order_index ?? 0,
        plannedStartTime: fmtTime(stop.planned_start_time),
        plannedEndTime: fmtTime(stop.planned_end_time),
        propertyId: property.id,
        propertyName: property.name,
        clientName: client?.name ?? 'N/A',
        address: property.address,
        propertyLat: property.lat,
        propertyLng: property.lng,
        hasKey: Boolean(property.has_keys) || propertyKeys.length > 0,
        keyPhotoUrl: null,
        link1: propertyResources[0]?.url?.trim() ?? null,
        link2: propertyResources[1]?.url?.trim() ?? null,
        cleaningMinutes: Number(task.cleaning_minutes_override ?? property.default_cleaning_minutes ?? 0),
        bathrooms: Number(property.bathrooms ?? 0),
        taskType: task.task_type === 'BSB' ? 'BSB' : 'NORMAL',
        tags,
        propertyDefaultTags: normalizeTagList(property.default_tags),
        guestName: task.guest_name,
        guestCheckinDate: task.guest_checkin_date,
        extraTowelsQty: Number(task.extra_towel_qty ?? 0),
        bedsSingle: Number(property.beds_single ?? 0),
        bedsQueen: Number(property.beds_queen ?? 0),
        bedsKing: Number(property.beds_king ?? 0),
        extraTowelsDefaultQty: Number(property.extra_towels_default_qty ?? 0),
        extraDishclothsDefaultQty: Number(property.extra_dishcloths_default_qty ?? 0),
        extraBedsSingle: Number(task.extra_linen_single_qty ?? 0),
        extraBedsQueen: Number(task.extra_linen_queen_qty ?? 0),
        extraBedsKing: Number(task.extra_linen_king_qty ?? 0),
        includesChocolates: property.includes_chocolates,
        extraChocolatesQty: Number(task.extra_chocolate_qty ?? 0),
        notes: task.notes,
        clientColor: client?.color ?? '#6366f1',
      })
    }

    // Sort: by group sort_order first, then by order_index within the group
    scheduleItems.sort((a, b) => {
      const groupDiff = (groupSortMap.get(a.groupLabel) ?? 0) - (groupSortMap.get(b.groupLabel) ?? 0)
      return groupDiff !== 0 ? groupDiff : a.orderIndex - b.orderIndex
    })

    return { scheduleItems, availableGroups }
  }

  return { getSchedule }
}
