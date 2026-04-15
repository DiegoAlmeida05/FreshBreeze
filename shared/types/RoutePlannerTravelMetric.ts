export interface RoutePlannerTravelMetric {
  stopId: string
  previousStopId: string | null
  travel_minutes_from_prev_raw: number
  travel_minutes_from_prev_applied: number
  coordinatesUnavailable?: boolean
  suspiciousDistance?: boolean
  distanceFromDepotKm?: number
  distanceLabel?: string
}