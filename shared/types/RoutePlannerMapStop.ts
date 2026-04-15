export interface RoutePlannerMapStop {
  id: string
  order: number
  propertyName: string
  address: string
  lat: number | null
  lng: number | null
  clientName?: string | null
  teamLabel?: string | null
  markerColor?: string | null
}
