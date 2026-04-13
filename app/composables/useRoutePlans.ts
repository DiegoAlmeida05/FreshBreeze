import { useSupabaseClient } from './useSupabaseClient'
import type { RouteGroupDTO } from '../../shared/types/RouteGroupDTO'
import type { RoutePlanDTO, RoutePlanStatus } from '../../shared/types/RoutePlanDTO'
import type { RouteStopDTO } from '../../shared/types/RouteStopDTO'

interface RoutePlanGroupPayload {
  label: string
  startTime: string | null
  employeeIds: string[]
  stops: RoutePlanStopPayload[]
  taskIds: string[]
}

interface RoutePlanStopPayload {
  dailyTaskId: string
  orderIndex: number
  plannedStartTime: string | null
  plannedEndTime: string | null
  travelMinutesFromPrev: number
}

export interface SaveRoutePlanPayload {
  date: string
  groups: RoutePlanGroupPayload[]
}

interface RoutePlanRow {
  id: string
  date: string
  status: RoutePlanStatus
  created_at: string | null
  updated_at: string | null
}

interface RouteGroupRow {
  id: string
  route_plan_id: string
  label: string | null
  group_label?: string | null
  start_time: string | null
  sort_order: number | null
  created_at: string | null
}

interface RouteGroupMemberRow {
  route_group_id: string
  employee_id: string
}

interface RouteStopRow {
  id: string
  route_group_id: string
  daily_task_id: string
  order_index: number | null
  planned_start_time: string | null
  planned_end_time: string | null
  travel_minutes_from_prev: number | null
  created_at: string | null
}

interface RouteGroupMembersExpectation {
  routeGroupId: string
  groupLabel: string
  employeeIds: string[]
}

function toIsoOrEmpty(value: string | null): string {
  return value ?? ''
}

function toNumber(value: number | null, fallback = 0): number {
  return typeof value === 'number' ? value : fallback
}

function uniqueStringList(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)))
}

function toRouteStopDTO(row: RouteStopRow): RouteStopDTO {
  return {
    id: row.id,
    route_group_id: row.route_group_id,
    daily_task_id: row.daily_task_id,
    order_index: toNumber(row.order_index),
    planned_start_time: row.planned_start_time,
    planned_end_time: row.planned_end_time,
    travel_minutes_from_prev: row.travel_minutes_from_prev,
    created_at: toIsoOrEmpty(row.created_at),
  }
}

function toRouteGroupDTO(row: RouteGroupRow, employeeIds: string[], stops: RouteStopDTO[]): RouteGroupDTO {
  const resolvedLabel = row.label?.trim() || row.group_label?.trim() || 'Team'

  return {
    id: row.id,
    route_plan_id: row.route_plan_id,
    label: resolvedLabel,
    start_time: row.start_time,
    sort_order: toNumber(row.sort_order),
    employee_ids: uniqueStringList(employeeIds),
    stops: [...stops].sort((a, b) => a.order_index - b.order_index),
    created_at: toIsoOrEmpty(row.created_at),
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error ?? '')
}

export function useRoutePlans() {
  const supabase = useSupabaseClient()

  async function validatePersistedRouteGroupMembers(expectations: RouteGroupMembersExpectation[]): Promise<void> {
    if (expectations.length === 0) {
      return
    }

    const groupIds = expectations.map((item) => item.routeGroupId)

    const { data, error } = await supabase
      .from('route_group_members')
      .select('route_group_id, employee_id')
      .in('route_group_id', groupIds)

    if (error) {
      throw new Error(error.message)
    }

    const persistedByGroup = ((data ?? []) as RouteGroupMemberRow[]).reduce<Record<string, string[]>>((acc, row) => {
      if (!acc[row.route_group_id]) {
        acc[row.route_group_id] = []
      }

      acc[row.route_group_id]?.push(row.employee_id)
      return acc
    }, {})

    const mismatchedGroups = expectations.filter((item) => {
      const expected = uniqueStringList(item.employeeIds)
      const actual = uniqueStringList(persistedByGroup[item.routeGroupId] ?? [])

      if (expected.length !== actual.length) {
        return true
      }

      const actualSet = new Set(actual)
      return expected.some((employeeId) => !actualSet.has(employeeId))
    })

    if (mismatchedGroups.length > 0) {
      const labels = mismatchedGroups.map((item) => item.groupLabel).join(', ')
      throw new Error(`Failed to persist team members for: ${labels}. Please save again.`)
    }
  }

  async function getRoutePlanByDate(date: string): Promise<RoutePlanDTO | null> {
    if (!date) {
      return null
    }

    const { data: planRows, error: planError } = await supabase
      .from('route_plans')
      .select('id, date, status, created_at, updated_at')
      .eq('date', date)
      .order('updated_at', { ascending: false })

    if (planError) {
      throw new Error(planError.message)
    }

    const plans = (planRows ?? []) as RoutePlanRow[]
    if (plans.length === 0) {
      return null
    }

    const selectedPlan = plans[0]

    if (!selectedPlan) {
      return null
    }

    const { data: groupRows, error: groupError } = await supabase
      .from('route_groups')
      .select('id, route_plan_id, label, group_label, start_time, sort_order, created_at')
      .eq('route_plan_id', selectedPlan.id)
      .order('sort_order', { ascending: true })

    if (groupError) {
      throw new Error(groupError.message)
    }

    const groups = (groupRows ?? []) as RouteGroupRow[]

    if (groups.length === 0) {
      return {
        id: selectedPlan.id,
        date: selectedPlan.date,
        status: selectedPlan.status,
        groups: [],
        created_at: toIsoOrEmpty(selectedPlan.created_at),
        updated_at: toIsoOrEmpty(selectedPlan.updated_at),
      }
    }

    const groupIds = groups.map((group) => group.id)

    const [membersResult, stopsResult] = await Promise.all([
      supabase
        .from('route_group_members')
        .select('route_group_id, employee_id')
        .in('route_group_id', groupIds),
      supabase
        .from('route_stops')
        .select('id, route_group_id, daily_task_id, order_index, planned_start_time, planned_end_time, travel_minutes_from_prev, created_at')
        .in('route_group_id', groupIds)
        .order('order_index', { ascending: true }),
    ])

    if (membersResult.error) {
      throw new Error(membersResult.error.message)
    }

    if (stopsResult.error) {
      throw new Error(stopsResult.error.message)
    }

    const members = (membersResult.data ?? []) as RouteGroupMemberRow[]
    const stops = (stopsResult.data ?? []) as RouteStopRow[]

    const employeeIdsByGroup = members.reduce<Record<string, string[]>>((acc, member) => {
      if (!acc[member.route_group_id]) {
        acc[member.route_group_id] = []
      }

      acc[member.route_group_id]?.push(member.employee_id)
      return acc
    }, {})

    const stopsByGroup = stops.reduce<Record<string, RouteStopDTO[]>>((acc, stop) => {
      if (!acc[stop.route_group_id]) {
        acc[stop.route_group_id] = []
      }

      acc[stop.route_group_id]?.push(toRouteStopDTO(stop))
      return acc
    }, {})

    return {
      id: selectedPlan.id,
      date: selectedPlan.date,
      status: selectedPlan.status,
      groups: groups.map((group) => {
        return toRouteGroupDTO(
          group,
          employeeIdsByGroup[group.id] ?? [],
          stopsByGroup[group.id] ?? [],
        )
      }),
      created_at: toIsoOrEmpty(selectedPlan.created_at),
      updated_at: toIsoOrEmpty(selectedPlan.updated_at),
    }
  }

  async function replaceRoutePlan(date: string, status: RoutePlanStatus, groups: RoutePlanGroupPayload[]): Promise<RoutePlanDTO> {
    const { data: existingPlans, error: existingPlansError } = await supabase
      .from('route_plans')
      .select('id')
      .eq('date', date)

    if (existingPlansError) {
      throw new Error(existingPlansError.message)
    }

    const existingPlanIds = (existingPlans ?? []).map((plan) => String((plan as Record<string, unknown>).id))

    if (existingPlanIds.length > 0) {
      const { data: existingGroups, error: existingGroupsError } = await supabase
        .from('route_groups')
        .select('id')
        .in('route_plan_id', existingPlanIds)

      if (existingGroupsError) {
        throw new Error(existingGroupsError.message)
      }

      const existingGroupIds = (existingGroups ?? []).map((group) => String((group as Record<string, unknown>).id))

      if (existingGroupIds.length > 0) {
        const { error: deleteMembersError } = await supabase
          .from('route_group_members')
          .delete()
          .in('route_group_id', existingGroupIds)

        if (deleteMembersError) {
          throw new Error(deleteMembersError.message)
        }

        const { error: deleteStopsError } = await supabase
          .from('route_stops')
          .delete()
          .in('route_group_id', existingGroupIds)

        if (deleteStopsError) {
          throw new Error(deleteStopsError.message)
        }
      }

      const { error: deleteGroupsError } = await supabase
        .from('route_groups')
        .delete()
        .in('route_plan_id', existingPlanIds)

      if (deleteGroupsError) {
        throw new Error(deleteGroupsError.message)
      }

      const { error: deletePlansError } = await supabase
        .from('route_plans')
        .delete()
        .eq('date', date)

      if (deletePlansError) {
        throw new Error(deletePlansError.message)
      }
    }

    const { data: insertedPlan, error: insertPlanError } = await supabase
      .from('route_plans')
      .insert({ date, status })
      .select('id')
      .single()

    if (insertPlanError || !insertedPlan) {
      throw new Error(insertPlanError?.message ?? 'Failed to create route plan.')
    }

    const routePlanId = String((insertedPlan as Record<string, unknown>).id)
    const memberExpectations: RouteGroupMembersExpectation[] = []

    for (const [groupIndex, group] of groups.entries()) {
      const safeLabel = group.label.trim() || `Team ${groupIndex + 1}`

      let insertedGroup: Record<string, unknown> | null = null
      let insertGroupError: unknown = null

      const insertAttempts: Array<Record<string, unknown>> = [
        {
          route_plan_id: routePlanId,
          label: safeLabel,
          group_label: safeLabel,
          start_time: group.startTime,
          sort_order: groupIndex,
        },
        {
          route_plan_id: routePlanId,
          label: safeLabel,
          start_time: group.startTime,
          sort_order: groupIndex,
        },
        {
          route_plan_id: routePlanId,
          group_label: safeLabel,
          start_time: group.startTime,
          sort_order: groupIndex,
        },
      ]

      for (const payload of insertAttempts) {
        const attempt = await supabase
          .from('route_groups')
          .insert(payload)
          .select('id')
          .single()

        if (!attempt.error && attempt.data) {
          insertedGroup = attempt.data as Record<string, unknown>
          insertGroupError = null
          break
        }

        insertGroupError = attempt.error
      }

      if (!insertedGroup) {
        throw new Error(errorMessage(insertGroupError) || 'Failed to create route group.')
      }

      const routeGroupId = String(insertedGroup.id)
      const uniqueEmployeeIds = uniqueStringList(group.employeeIds)

      const { error: deleteMembersForGroupError } = await supabase
        .from('route_group_members')
        .delete()
        .eq('route_group_id', routeGroupId)

      if (deleteMembersForGroupError) {
        throw new Error(deleteMembersForGroupError.message)
      }

      if (uniqueEmployeeIds.length > 0) {
        const { error: insertMembersError } = await supabase
          .from('route_group_members')
          .insert(uniqueEmployeeIds.map((employeeId) => ({
            route_group_id: routeGroupId,
            employee_id: employeeId,
          })))

        if (insertMembersError) {
          throw new Error(insertMembersError.message)
        }
      }

      memberExpectations.push({
        routeGroupId,
        groupLabel: safeLabel,
        employeeIds: uniqueEmployeeIds,
      })

      const stopsPayload = group.stops.length > 0
        ? group.stops
        : uniqueStringList(group.taskIds).map((dailyTaskId, stopIndex) => ({
            dailyTaskId,
            orderIndex: stopIndex,
            plannedStartTime: null,
            plannedEndTime: null,
            travelMinutesFromPrev: 0,
          }))

      if (stopsPayload.length > 0) {
        const { error: insertStopsError } = await supabase
          .from('route_stops')
          .insert(stopsPayload.map((stop, stopIndex) => ({
            route_group_id: routeGroupId,
            daily_task_id: stop.dailyTaskId,
            order_index: Number.isFinite(stop.orderIndex) ? stop.orderIndex : stopIndex,
            planned_start_time: stop.plannedStartTime,
            planned_end_time: stop.plannedEndTime,
            travel_minutes_from_prev: Number.isFinite(stop.travelMinutesFromPrev) ? stop.travelMinutesFromPrev : 0,
          })))

        if (insertStopsError) {
          throw new Error(insertStopsError.message)
        }
      }
    }

    await validatePersistedRouteGroupMembers(memberExpectations)

    const loadedPlan = await getRoutePlanByDate(date)

    if (!loadedPlan) {
      throw new Error('Failed to reload route plan after save.')
    }

    return loadedPlan
  }

  async function saveRoutePlanDraft(payload: SaveRoutePlanPayload): Promise<RoutePlanDTO> {
    return replaceRoutePlan(payload.date, 'draft', payload.groups)
  }

  async function publishRoutePlan(payload: SaveRoutePlanPayload): Promise<RoutePlanDTO> {
    return replaceRoutePlan(payload.date, 'published', payload.groups)
  }

  async function markPublishedPlanAsStale(date: string): Promise<boolean> {
    if (!date) {
      return false
    }

    const { data, error } = await supabase
      .from('route_plans')
      .update({ status: 'stale' })
      .eq('date', date)
      .eq('status', 'published')
      .select('id')

    if (error) {
      throw new Error(error.message)
    }

    return (data ?? []).length > 0
  }

  return {
    getRoutePlanByDate,
    saveRoutePlanDraft,
    publishRoutePlan,
    markPublishedPlanAsStale,
  }
}
