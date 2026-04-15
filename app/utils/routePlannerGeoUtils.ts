/**
 * Geographic utility functions for Route Planner
 * Depot/base location: Melbourne CBD area
 */

// Melbourne depot/service center coordinates
const DEPOT_LAT = -37.8136
const DEPOT_LNG = 144.9631

// Maximum reasonable distance from depot (in km)
const MAX_DISTANCE_FROM_DEPOT = 100

export interface GeoWarning {
  suspiciousDistance: boolean
  distanceFromDepotKm: number
  distanceLabel: string
}

/**
 * Calculate distance between two coordinates using Haversine formula (km)
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  if (!Number.isFinite(lat1) || !Number.isFinite(lng1) || !Number.isFinite(lat2) || !Number.isFinite(lng2)) {
    return 0
  }

  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a
    = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos((lat1 * Math.PI) / 180)
      * Math.cos((lat2 * Math.PI) / 180)
      * Math.sin(dLng / 2)
      * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Check if a coordinate is suspiciously far from the depot
 */
export function checkCoordinateDistance(lat: number | null, lng: number | null): GeoWarning {
  const distanceKm = Number.isFinite(lat) && Number.isFinite(lng)
    ? calculateDistance(DEPOT_LAT, DEPOT_LNG, lat as number, lng as number)
    : 0

  return {
    suspiciousDistance: distanceKm > MAX_DISTANCE_FROM_DEPOT,
    distanceFromDepotKm: distanceKm,
    distanceLabel: distanceKm > 0 ? `${distanceKm.toFixed(1)} km` : 'Unknown',
  }
}

/**
 * Check if distance between two consecutive points is unrealistic (e.g., > 70 km)
 */
export function checkConsecutiveDistance(
  lat1: number | null,
  lng1: number | null,
  lat2: number | null,
  lng2: number | null,
  maxReasonableKm = 70,
): { unrealistic: boolean; distanceKm: number } {
  const distanceKm
    = Number.isFinite(lat1) && Number.isFinite(lng1) && Number.isFinite(lat2) && Number.isFinite(lng2)
      ? calculateDistance(lat1 as number, lng1 as number, lat2 as number, lng2 as number)
      : 0

  return {
    unrealistic: distanceKm > maxReasonableKm,
    distanceKm,
  }
}
