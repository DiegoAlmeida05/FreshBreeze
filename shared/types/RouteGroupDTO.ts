import type { RouteStopDTO } from './RouteStopDTO'

export interface RouteGroupDTO {
  id: string
  route_plan_id: string
  label: string
  start_time: string | null
  sort_order: number
  employee_ids: string[]
  stops: RouteStopDTO[]
  created_at: string
}
