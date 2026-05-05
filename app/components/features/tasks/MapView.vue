<template>
  <RoutePlannerGoogleMap
    :key="mapRenderKey"
    :stops="tasks"
    :empty-message="emptyMessage"
    @route-metrics-change="emit('routeMetricsChange', $event)"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import RoutePlannerGoogleMap from './RoutePlannerGoogleMap.vue'
import type { RoutePlannerMapStop } from '../../../../shared/types/RoutePlannerMapStop'
import type { RoutePlannerTravelMetric } from '../../../../shared/types/RoutePlannerTravelMetric'

interface Props {
  tasks: RoutePlannerMapStop[]
  emptyMessage?: string
}

const emit = defineEmits<{
  routeMetricsChange: [metrics: RoutePlannerTravelMetric[]]
}>()

const props = withDefaults(defineProps<Props>(), {
  emptyMessage: 'No tasks with valid coordinates were found for map rendering.',
})

const mapRenderKey = computed(() => {
  const ids = props.tasks.map((task, index) => `${index}:${task.id}:${task.lat}:${task.lng}`).join('|')
  return `route-map:${props.tasks.length}:${ids}`
})
</script>
