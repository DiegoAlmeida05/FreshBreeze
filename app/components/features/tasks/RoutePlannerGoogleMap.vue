<template>
  <div class="relative h-full w-full overflow-hidden rounded-xl border border-primary-200/70 bg-surface/70 dark:border-white/10 dark:bg-black/10">
    <div ref="mapRef" class="h-full w-full" />

    <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-surface/70 text-sm text-muted backdrop-blur-[1px] dark:bg-black/45">
      Loading map...
    </div>

    <div v-else-if="errorMessage" class="absolute inset-0 flex items-center justify-center px-5 text-center text-sm text-muted">
      <div>
        <p class="font-medium text-foreground">Map unavailable</p>
        <p class="mt-2 text-xs">{{ errorMessage }}</p>
        <p class="mt-2 text-[11px] text-muted">Maps key loaded: {{ isMapsKeyLoaded ? 'yes' : 'no' }}</p>
        <p class="mt-0.5 text-[11px] text-muted">Hostname: {{ currentHostname }}</p>
      </div>
    </div>

    <div v-else-if="validStops.length === 0" class="absolute inset-0 flex items-center justify-center px-5 text-center text-sm text-muted">
      <div>
        <p class="font-medium text-foreground">No coordinates available</p>
        <p class="mt-2 text-xs">{{ emptyMessage }}</p>
      </div>
    </div>

    <div
      v-if="!isLoading && !errorMessage && validStops.length > 0"
      class="absolute right-2 top-2 z-10 flex items-center gap-1.5"
    >
      <button
        type="button"
        class="inline-flex items-center rounded-md border border-primary-200 bg-surface/90 px-2 py-1 text-[11px] font-semibold text-foreground shadow-sm transition hover:bg-primary-50 dark:border-white/15 dark:bg-black/45 dark:hover:bg-white/10"
        title="Centralize route"
        aria-label="Centralize route"
        @click="recenterRoute"
      >
        Centralize
      </button>

      <button
        type="button"
        class="inline-flex items-center rounded-md border border-primary-200 bg-surface/90 px-2 py-1 text-[11px] font-semibold text-foreground shadow-sm transition hover:bg-primary-50 dark:border-white/15 dark:bg-black/45 dark:hover:bg-white/10"
        title="Reset zoom"
        aria-label="Reset zoom"
        @click="resetZoomForInspection"
      >
        Reset Zoom
      </button>
    </div>

    <!-- Warning badge for missing coordinates -->
    <p v-if="missingCoordinatesCount > 0" class="pointer-events-none absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white/90">
      {{ missingCoordinatesCount }} without coordinates
    </p>

    <!-- Warning badge for suspicious coordinates -->
    <p v-if="suspiciousCoordinatesCount > 0" class="pointer-events-none absolute bottom-2 left-2 rounded-full bg-warning/70 px-2 py-0.5 text-[10px] font-medium text-white">
      ⚠ {{ suspiciousCoordinatesCount }} location issue(s)
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRuntimeConfig } from '#imports'
import { hasGoogleMapsAuthFailed, loadGoogleMaps } from '../../../composables/useGoogleMaps'
import { applyTravelMinutesRule, minutesFromDurationSeconds } from '../../../utils/routePlannerTravel'
import { checkCoordinateDistance } from '../../../utils/routePlannerGeoUtils'
import type { RoutePlannerMapStop } from '../../../../shared/types/RoutePlannerMapStop'
import type { RoutePlannerTravelMetric } from '../../../../shared/types/RoutePlannerTravelMetric'

let routePlannerMapActiveInstances = 0

interface Props {
  stops: RoutePlannerMapStop[]
  emptyMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  emptyMessage: 'Assign tasks with property coordinates to render the map.',
})

const emit = defineEmits<{
  routeMetricsChange: [metrics: RoutePlannerTravelMetric[]]
}>()

const runtimeConfig = useRuntimeConfig()
const mapRef = ref<HTMLElement | null>(null)
const mapInstance = ref<any | null>(null)
const markerInstances = ref<Array<{ marker: any; clickListener: any | null }>>([])
const markerByStopId = ref<Map<string, any>>(new Map())
const directionsRenderer = ref<any | null>(null)
const directionsResult = ref<any | null>(null)
const routePolyline = ref<any | null>(null)
const geocodedPointsByStopId = ref<Record<string, { lat: number; lng: number }>>({})
const isLoading = ref(true)
const errorMessage = ref('')
const lastRenderKey = ref<string>('')
let renderDebounceTimer: ReturnType<typeof setTimeout> | null = null

const orderedStops = computed(() => props.stops.map((stop, index) => ({
  ...stop,
  order: index + 1,
})))
const orderedStopIdsKey = computed(() => orderedStops.value.map((stop) => stop.id).join('|'))
const instanceId = `route-map-${Math.random().toString(36).slice(2, 10)}`

const isMapsKeyLoaded = computed(() => String(runtimeConfig.public.googleMapsApiKey ?? '').trim().length > 0)
const currentHostname = computed(() => (import.meta.client ? window.location.hostname : 'server'))

const validStops = computed(() => {
  return orderedStops.value
    .map((stop) => {
      const hasCoordinates = Number.isFinite(stop.lat) && Number.isFinite(stop.lng)

      if (hasCoordinates) {
        return stop
      }

      const geocodedPoint = geocodedPointsByStopId.value[stop.id]

      if (!geocodedPoint) {
        return null
      }

      return {
        ...stop,
        lat: geocodedPoint.lat,
        lng: geocodedPoint.lng,
      }
    })
    .filter((stop): stop is RoutePlannerMapStop => Boolean(stop && Number.isFinite(stop.lat) && Number.isFinite(stop.lng)))
})

const missingCoordinatesCount = computed(() => Math.max(0, orderedStops.value.length - validStops.value.length))

const suspiciousCoordinatesCount = computed(() => {
  return validStops.value.filter((stop) => {
    const geoWarning = checkCoordinateDistance(stop.lat, stop.lng)
    return geoWarning.suspiciousDistance
  }).length
})

function clearMarkers(): void {
  console.info('[route-map] clearing markers', {
    instanceId,
    markerCountBefore: markerInstances.value.length,
    markerByStopIdSizeBefore: markerByStopId.value.size,
  })

  for (const handle of markerInstances.value) {
    if (handle.clickListener && import.meta.client && window.google?.maps?.event?.removeListener) {
      window.google.maps.event.removeListener(handle.clickListener)
    }

    const marker = handle.marker
    if (marker && typeof marker.setMap === 'function') {
      // google.maps.Marker
      marker.setMap(null)
    } else if (marker && 'map' in marker) {
      // google.maps.marker.AdvancedMarkerElement
      marker.map = null
    }
  }

  markerInstances.value.length = 0
  markerByStopId.value.clear()

  console.info('[route-map] cleared markers', {
    instanceId,
    markerCountAfter: markerInstances.value.length,
    markerByStopIdSizeAfter: markerByStopId.value.size,
  })
}

function clearDirections(): void {
  if (directionsRenderer.value) {
    directionsRenderer.value.setMap(null)
    if (typeof directionsRenderer.value.setDirections === 'function') {
      directionsRenderer.value.setDirections({ routes: [] })
    }
    directionsRenderer.value = null
  }

  if (routePolyline.value) {
    if (typeof routePolyline.value.setMap === 'function') {
      routePolyline.value.setMap(null)
    }
    routePolyline.value = null
  }

  directionsResult.value = null
}

function clearMapArtifacts(): void {
  console.info('[route-map] clearing map artifacts', { instanceId })
  clearMarkers()
  clearDirections()
}

function contrastTextColor(hexColor: string): string {
  const fallback = '#ffffff'
  const match = /^#([0-9A-Fa-f]{6})$/.exec(hexColor)

  if (!match?.[1]) {
    return fallback
  }

  const r = Number.parseInt(match[1].slice(0, 2), 16)
  const g = Number.parseInt(match[1].slice(2, 4), 16)
  const b = Number.parseInt(match[1].slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.62 ? '#0f172a' : '#ffffff'
}

function buildBaseRouteMetrics(): RoutePlannerTravelMetric[] {
  return orderedStops.value.map((stop, index) => {
    const geoWarning = checkCoordinateDistance(stop.lat, stop.lng)
    return {
      stopId: stop.id,
      previousStopId: index > 0 ? (orderedStops.value[index - 1]?.id ?? null) : null,
      travel_minutes_from_prev_raw: 0,
      travel_minutes_from_prev_applied: 0,
      suspiciousDistance: geoWarning.suspiciousDistance,
      distanceFromDepotKm: geoWarning.distanceFromDepotKm,
      distanceLabel: geoWarning.distanceLabel,
    }
  })
}

function emitRouteMetrics(metrics: RoutePlannerTravelMetric[]): void {
  emit('routeMetricsChange', metrics)
}

function normalizeMarkerColor(color: string | null | undefined): string {
  const fallback = '#2563EB'

  if (!color) {
    return fallback
  }

  const trimmed = color.trim()

  if (!trimmed) {
    return fallback
  }

  return /^#([0-9A-Fa-f]{6})$/.test(trimmed) ? trimmed : fallback
}

function buildInfoWindowHtml(stop: RoutePlannerMapStop, order: number): string {
  const title = `${order}. ${stop.propertyName}`
  const client = stop.clientName?.trim() ? stop.clientName : 'Client unavailable'
  const address = stop.address?.trim() ? stop.address : 'Address unavailable'

  return [
    '<div style="min-width:180px;max-width:260px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">',
    `<p style="margin:0;font-size:13px;font-weight:700;color:#0f172a;">${title}</p>`,
    `<p style="margin:4px 0 0 0;font-size:12px;color:#334155;">${client}</p>`,
    `<p style="margin:6px 0 0 0;font-size:12px;color:#475569;line-height:1.35;">${address}</p>`,
    '</div>',
  ].join('')
}

async function geocodeMissingStops(googleMaps: any): Promise<void> {
  const geocoder = new googleMaps.maps.Geocoder()
  const updates: Record<string, { lat: number; lng: number }> = {}

  for (const stop of orderedStops.value) {
    const hasCoordinates = Number.isFinite(stop.lat) && Number.isFinite(stop.lng)

    if (hasCoordinates || geocodedPointsByStopId.value[stop.id]) {
      continue
    }

    const address = stop.address?.trim()

    if (!address) {
      continue
    }

    try {
      const point = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
        geocoder.geocode({ address }, (results: any, status: string) => {
          if (status !== 'OK' || !results?.[0]?.geometry?.location) {
            resolve(null)
            return
          }

          const location = results[0].geometry.location
          resolve({ lat: location.lat(), lng: location.lng() })
        })
      })

      if (point) {
        updates[stop.id] = point
      }
    } catch {
      // Keep map functional even when geocoding one address fails.
    }
  }

  if (Object.keys(updates).length > 0) {
    geocodedPointsByStopId.value = {
      ...geocodedPointsByStopId.value,
      ...updates,
    }
  }
}

function fitToStops(googleMaps: any): void {
  if (!mapInstance.value || validStops.value.length === 0) {
    return
  }

  if (validStops.value.length === 1) {
    const first = validStops.value[0]

    if (!first || first.lat === null || first.lng === null) {
      return
    }

    mapInstance.value.setCenter({ lat: first.lat, lng: first.lng })
    mapInstance.value.setZoom(14)
    return
  }

  const bounds = new googleMaps.maps.LatLngBounds()

  for (const stop of validStops.value) {
    if (stop.lat === null || stop.lng === null) {
      continue
    }

    bounds.extend({ lat: stop.lat, lng: stop.lng })
  }

  mapInstance.value.fitBounds(bounds, 56)
}

function fitToCompleteRoute(googleMaps: any): void {
  if (!mapInstance.value) {
    return
  }

  const routeBounds = directionsResult.value?.routes?.[0]?.bounds

  if (routeBounds) {
    mapInstance.value.fitBounds(routeBounds, {
      top: 56,
      right: 56,
      bottom: 56,
      left: 56,
    })
    return
  }

  fitToStops(googleMaps)
}

function recenterRoute(): void {
  if (!import.meta.client || !window.google?.maps || !mapInstance.value) {
    return
  }

  fitToCompleteRoute(window.google)
}

function resetZoomForInspection(): void {
  if (!import.meta.client || !window.google?.maps || !mapInstance.value || validStops.value.length === 0) {
    return
  }

  const routeBounds = directionsResult.value?.routes?.[0]?.bounds

  if (routeBounds?.getCenter) {
    mapInstance.value.setCenter(routeBounds.getCenter())
    mapInstance.value.setZoom(12)
    return
  }

  const googleMaps = window.google
  const bounds = new googleMaps.maps.LatLngBounds()

  for (const stop of validStops.value) {
    if (stop.lat === null || stop.lng === null) {
      continue
    }

    bounds.extend({ lat: stop.lat, lng: stop.lng })
  }

  mapInstance.value.setCenter(bounds.getCenter())
  mapInstance.value.setZoom(12)
}

function renderMarkers(googleMaps: any): void {
  if (!mapInstance.value) {
    return
  }

  console.info('[route-map] rendering markers', {
    instanceId,
    count: orderedStops.value.length,
    stopsLength: props.stops.length,
    orderedStopsLength: orderedStops.value.length,
    orderedStops: orderedStops.value.map((stop, index) => ({
      id: stop.id,
      label: String(index + 1),
      lat: stop.lat,
      lng: stop.lng,
    })),
  })
  clearMarkers()

  const infoWindow = new googleMaps.maps.InfoWindow()

  for (let index = 0; index < orderedStops.value.length; index += 1) {
    const orderedStop = orderedStops.value[index]
    if (!orderedStop) {
      continue
    }

    const markerOrder = index + 1
    const geocodedPoint = geocodedPointsByStopId.value[orderedStop.id]
    const lat = Number.isFinite(orderedStop.lat) ? orderedStop.lat : geocodedPoint?.lat ?? null
    const lng = Number.isFinite(orderedStop.lng) ? orderedStop.lng : geocodedPoint?.lng ?? null

    if (lat === null || lng === null) {
      continue
    }

    const geoWarning = checkCoordinateDistance(lat, lng)
    const markerFillColor = geoWarning.suspiciousDistance ? '#F59E0B' : normalizeMarkerColor(orderedStop.markerColor)
    const icon: any = {
      path: googleMaps.maps.SymbolPath.CIRCLE,
      fillColor: markerFillColor,
      fillOpacity: 1,
      strokeColor: geoWarning.suspiciousDistance ? '#D97706' : '#ffffff',
      strokeWeight: geoWarning.suspiciousDistance ? 2.5 : 2,
      scale: geoWarning.suspiciousDistance ? 13 : 12,
    }

    const marker = new googleMaps.maps.Marker({
      map: mapInstance.value,
      position: { lat, lng },
      label: {
        text: String(markerOrder),
        color: geoWarning.suspiciousDistance ? '#92400E' : contrastTextColor(markerFillColor),
        fontWeight: '700',
        fontSize: '13px',
      },
      icon,
      zIndex: 1000 + markerOrder,
      title: geoWarning.suspiciousDistance
        ? `${markerOrder}. ${orderedStop.propertyName} - Possible location issue (${geoWarning.distanceLabel} from depot)`
        : `${markerOrder}. ${orderedStop.propertyName}`,
    })

    marker.setLabel({
      text: String(markerOrder),
      color: geoWarning.suspiciousDistance ? '#92400E' : contrastTextColor(markerFillColor),
      fontWeight: '700',
      fontSize: '13px',
    })

    const clickListener = marker.addListener('click', () => {
      let html = buildInfoWindowHtml(orderedStop, markerOrder)
      if (geoWarning.suspiciousDistance) {
        html = `<div style="border-bottom:2px solid #F59E0B;padding-bottom:8px;margin-bottom:8px;"><p style="margin:0;font-size:12px;font-weight:600;color:#D97706;">⚠ Location issue detected</p><p style="margin:4px 0 0 0;font-size:11px;color:#92400E;">${geoWarning.distanceLabel} from depot</p></div>${html}`
      }
      infoWindow.setContent(html)
      infoWindow.open({
        anchor: marker,
        map: mapInstance.value,
      })
    })

    markerInstances.value.push({ marker, clickListener })
    markerByStopId.value.set(orderedStop.id, marker)
  }

  fitToStops(googleMaps)
}

async function renderDirectionsAndMetrics(googleMaps: any): Promise<void> {
  if (!mapInstance.value) {
    emitRouteMetrics(buildBaseRouteMetrics())
    return
  }

  const baseMetrics = buildBaseRouteMetrics()
  const routableStops = validStops.value.filter((stop) => stop.lat !== null && stop.lng !== null)
  const routableStopIds = new Set(routableStops.map((s) => s.id))

  clearDirections()

  // Pre-populate the metrics map and flag stops missing coordinates (index > 0 only)
  const metricsByStopId = Object.fromEntries(baseMetrics.map((metric) => [metric.stopId, metric]))
  for (let i = 1; i < orderedStops.value.length; i++) {
    const stop = orderedStops.value[i]
    if (!stop || routableStopIds.has(stop.id)) continue
    const geoWarning = checkCoordinateDistance(stop.lat, stop.lng)
    metricsByStopId[stop.id] = {
      stopId: stop.id,
      previousStopId: orderedStops.value[i - 1]?.id ?? null,
      travel_minutes_from_prev_raw: 0,
      travel_minutes_from_prev_applied: 0,
      coordinatesUnavailable: true,
      suspiciousDistance: geoWarning.suspiciousDistance,
      distanceFromDepotKm: geoWarning.distanceFromDepotKm,
      distanceLabel: geoWarning.distanceLabel,
    }
  }

  if (routableStops.length < 2) {
    emitRouteMetrics(baseMetrics.map((m) => metricsByStopId[m.stopId] ?? m))
    fitToStops(googleMaps)
    return
  }

  const firstStop = routableStops[0]
  const lastStop = routableStops[routableStops.length - 1]

  if (!firstStop || !lastStop) {
    emitRouteMetrics(baseMetrics.map((m) => metricsByStopId[m.stopId] ?? m))
    fitToStops(googleMaps)
    return
  }

  const directionsService = new googleMaps.maps.DirectionsService()

  try {
    const directions = await new Promise<any>((resolve, reject) => {
      directionsService.route(
        {
          origin: { lat: firstStop.lat, lng: firstStop.lng },
          destination: {
            lat: lastStop.lat,
            lng: lastStop.lng,
          },
          waypoints: routableStops.slice(1, -1).map((stop) => ({
            location: { lat: stop.lat, lng: stop.lng },
            stopover: true,
          })),
          optimizeWaypoints: false,
          travelMode: googleMaps.maps.TravelMode.DRIVING,
        },
        (result: any, status: string) => {
          if (status === 'OK' && result) {
            resolve(result)
            return
          }

          reject(new Error(status || 'Directions unavailable.'))
        },
      )
    })

    // Create and configure the renderer
    directionsRenderer.value = new googleMaps.maps.DirectionsRenderer({
      map: mapInstance.value,
      suppressMarkers: true,
      preserveViewport: true,
      polylineOptions: {
        strokeColor: '#0B63F3',
        strokeOpacity: 1,
        strokeWeight: 8,
        zIndex: 100,
      },
    })

    // SET THE DIRECTIONS - THIS RENDERS THE ROUTE LINE
    directionsRenderer.value.setDirections(directions)
    directionsResult.value = directions

    // Calculate travel metrics from the response
    const routeLegs = directions.routes?.[0]?.legs ?? []

    for (let index = 1; index < routableStops.length; index += 1) {
      const currentStop = routableStops[index]
      const previousStop = routableStops[index - 1]

      if (!currentStop || !previousStop) {
        continue
      }

      const routeLeg = routeLegs[index - 1]
      const rawMinutes = minutesFromDurationSeconds(routeLeg?.duration?.value ?? 0)
      const geoWarning = checkCoordinateDistance(currentStop.lat, currentStop.lng)

      metricsByStopId[currentStop.id] = {
        stopId: currentStop.id,
        previousStopId: previousStop.id,
        travel_minutes_from_prev_raw: rawMinutes,
        travel_minutes_from_prev_applied: applyTravelMinutesRule(rawMinutes),
        suspiciousDistance: geoWarning.suspiciousDistance,
        distanceFromDepotKm: geoWarning.distanceFromDepotKm,
        distanceLabel: geoWarning.distanceLabel,
      }
    }

    // IMPORTANT: Emit metrics after setting directions
    emitRouteMetrics(baseMetrics.map((metric) => metricsByStopId[metric.stopId] ?? metric))

    // FIT BOUNDS AFTER DRAWING ROUTE
    fitToCompleteRoute(googleMaps)
  } catch (err) {
    // Error case: emit base metrics with geo warnings
    emitRouteMetrics(baseMetrics.map((m) => metricsByStopId[m.stopId] ?? m))
    fitToStops(googleMaps)
  }
}

async function initMap(): Promise<void> {
  if (!import.meta.client) {
    return
  }

  if (!mapRef.value) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    clearMapArtifacts()

    const apiKey = String(runtimeConfig.public.googleMapsApiKey ?? '')
    const googleMaps = await loadGoogleMaps(apiKey)

    if (!googleMaps?.maps) {
      throw new Error('Google Maps namespace not available after script load.')
    }

    if (hasGoogleMapsAuthFailed()) {
      throw new Error('Google Maps could not load. Check API key, billing, Maps JavaScript API, and HTTP referrer restrictions for this domain.')
    }

    // Initialize map with default Melbourne center
    mapInstance.value = new googleMaps.maps.Map(mapRef.value, {
      center: { lat: -37.8136, lng: 144.9631 },
      zoom: 11,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      clickableIcons: false,
    })

    await geocodeMissingStops(googleMaps)
    renderMarkers(googleMaps)
    await renderDirectionsAndMetrics(googleMaps)
  } catch (err) {
    if (err instanceof Error) {
      errorMessage.value = err.message.includes('Google Maps could not load.')
        ? err.message
        : 'Google Maps could not load. Check API key, billing, Maps JavaScript API, and HTTP referrer restrictions for this domain.'
    } else {
      errorMessage.value = 'Google Maps could not load. Check API key, billing, Maps JavaScript API, and HTTP referrer restrictions for this domain.'
    }

    console.error('[RoutePlannerMap] Init error:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  routePlannerMapActiveInstances += 1
  console.info('[route-map] mounted', {
    instanceId,
    activeInstances: routePlannerMapActiveInstances,
  })
  await initMap()
})

function scheduleRerender(googleMaps: typeof window.google): void {
  if (!mapInstance.value || !googleMaps?.maps) {
    return
  }

  if (renderDebounceTimer) {
    clearTimeout(renderDebounceTimer)
  }

  renderDebounceTimer = setTimeout(() => {
    if (!mapInstance.value || !window.google?.maps) {
      return
    }

    if (orderedStops.value.length === 0) {
      clearMapArtifacts()
      emitRouteMetrics([])
      renderDebounceTimer = null
      return
    }

    renderMarkers(googleMaps)
    void renderDirectionsAndMetrics(googleMaps)
    renderDebounceTimer = null
  }, 50)
}

watch(
  () => orderedStops.value.length,
  (count) => {
    if (count !== 0) {
      return
    }

    clearMapArtifacts()
    emitRouteMetrics([])
  },
)

// Debounced watcher to avoid excessive re-renders
watch(
  () => orderedStopIdsKey.value,
  (idsKey) => {
    console.info('[route-map] watcher orderedStopIdsKey fired', {
      instanceId,
      idsKey,
      propsStopsLength: props.stops.length,
      orderedStopsLength: orderedStops.value.length,
    })

    if (!import.meta.client || !window.google?.maps || !mapInstance.value) {
      return
    }

    scheduleRerender(window.google)
  },
)

watch(
  () => JSON.stringify(orderedStops.value.map((s, index) => `${index}:${s.id}:${s.lat}:${s.lng}`)),
  async (newKey) => {
    console.info('[route-map] watcher orderedStops detail fired', {
      instanceId,
      newKey,
      propsStopsLength: props.stops.length,
      orderedStopsLength: orderedStops.value.length,
    })

    if (!import.meta.client || !window.google?.maps || !mapInstance.value) {
      return
    }

    // Skip if render key hasn't changed (performance optimization)
    if (newKey === lastRenderKey.value) {
      return
    }

    lastRenderKey.value = newKey
    scheduleRerender(window.google)
  },
)

watch(
  () => orderedStops.value.length,
  (len) => {
    console.info('[route-map] watcher orderedStops.length fired', {
      instanceId,
      orderedStopsLength: len,
      propsStopsLength: props.stops.length,
    })
  },
)

watch(
  () => props.stops.length,
  (len) => {
    console.info('[route-map] watcher props.stops.length fired', {
      instanceId,
      propsStopsLength: len,
      orderedStopsLength: orderedStops.value.length,
    })
  },
)

onBeforeUnmount(() => {
  console.info('[route-map] unmounting', {
    instanceId,
    activeInstancesBefore: routePlannerMapActiveInstances,
  })
  clearMapArtifacts()
  mapInstance.value = null
  if (renderDebounceTimer) {
    clearTimeout(renderDebounceTimer)
  }

  routePlannerMapActiveInstances = Math.max(0, routePlannerMapActiveInstances - 1)
  console.info('[route-map] unmounted', {
    instanceId,
    activeInstancesAfter: routePlannerMapActiveInstances,
  })
})
</script>

