import type { RouteGroupDTO } from './RouteGroupDTO'

export type RoutePlanStatus = 'draft' | 'published' | 'stale'

export interface RoutePlanDTO {
  id: string
  date: string
  status: RoutePlanStatus
  groups: RouteGroupDTO[]
  created_at: string
  updated_at: string
}
