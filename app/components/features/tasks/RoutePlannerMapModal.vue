<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[100] flex items-end justify-center bg-foreground/60 px-4 py-4 backdrop-blur-sm sm:items-center sm:py-8"
      @click.self="close"
    >
      <div class="w-full max-w-6xl rounded-2xl border border-primary-100 bg-surface p-4 shadow-elevated dark:border-white/10 sm:p-5">
        <div class="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 class="text-lg font-semibold text-foreground">{{ title }}</h3>
            <p class="mt-1 text-sm text-muted">Start from first task in team list | Start time: {{ formattedStartTime }}</p>
            <p class="mt-1 text-xs text-muted">Employees: {{ employeeNames }}</p>
          </div>

          <button type="button" class="btn-outline" @click="close">Close</button>
        </div>

        <div class="h-[72vh]">
          <MapView
            :tasks="stops"
            empty-message="Team has no properties with coordinates for map rendering yet."
            @route-metrics-change="emit('routeMetricsChange', $event)"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { fmtTime } from '../../../utils/formatTime'
import MapView from './MapView.vue'
import type { RoutePlannerMapStop } from '../../../../shared/types/RoutePlannerMapStop'
import type { RoutePlannerTravelMetric } from '../../../../shared/types/RoutePlannerTravelMetric'

interface Props {
  modelValue: boolean
  title: string
  startTime: string
  employeeNames: string
  stops: RoutePlannerMapStop[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  routeMetricsChange: [metrics: RoutePlannerTravelMetric[]]
}>()

function close(): void {
  emit('update:modelValue', false)
}

const formattedStartTime = computed(() => fmtTime(props.startTime) || 'Not defined')
</script>
