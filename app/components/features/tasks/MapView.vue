<template>
  <RoutePlannerGoogleMap
    :stops="tasks"
    :empty-message="emptyMessage"
    @route-metrics-change="emit('routeMetricsChange', $event)"
  />
</template>

<script setup lang="ts">
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

withDefaults(defineProps<Props>(), {
  emptyMessage: 'No tasks with valid coordinates were found for map rendering.',
})
</script>
