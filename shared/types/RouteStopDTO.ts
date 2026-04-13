export interface RouteStopDTO {
  id: string
  route_group_id: string
  daily_task_id: string
  order_index: number
  planned_start_time: string | null
  planned_end_time: string | null
  travel_minutes_from_prev: number | null
  created_at: string
}
