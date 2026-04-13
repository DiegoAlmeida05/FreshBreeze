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

        <div class="h-[72vh] rounded-xl border border-dashed border-primary-200/80 bg-primary-50/50 p-4 dark:border-white/15 dark:bg-white/[0.03]">
          <div class="flex h-full flex-col items-center justify-center text-center text-sm text-muted">
            <p class="font-medium text-foreground">Expanded map area</p>
            <p class="mt-2">This panel is ready for full-size map rendering for route planning.</p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { fmtTime } from '../../../utils/formatTime'

interface Props {
  modelValue: boolean
  title: string
  startTime: string
  employeeNames: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function close(): void {
  emit('update:modelValue', false)
}

const formattedStartTime = computed(() => fmtTime(props.startTime) || 'Not defined')
</script>
