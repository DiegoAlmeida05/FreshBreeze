<template>
  <div class="space-y-1.5">
    <div v-if="label || showValue" class="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
      <span>{{ label }}</span>
      <span v-if="showValue">{{ percentage.toFixed(1) }}%</span>
    </div>

    <div class="relative h-2.5 overflow-hidden rounded-full bg-primary-100/80 dark:bg-white/10">
      <div
        class="h-full rounded-full bg-gradient-to-r from-primary-500 via-primary-600 to-primary-warm-500 shadow-[0_0_12px_rgba(37,99,235,0.35)] transition-all duration-500"
        :style="{ width: `${percentage}%` }"
      />
      <div class="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.35)_50%,rgba(255,255,255,0)_100%)] opacity-40" />
    </div>

    <p v-if="detail" class="text-[10px] font-medium text-muted/90">{{ detail }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  value: number
  max?: number
  label?: string
  detail?: string
  showValue?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  max: 100,
  label: '',
  detail: '',
  showValue: true,
})

const percentage = computed(() => {
  const safeMax = Number.isFinite(props.max) && props.max > 0 ? props.max : 100
  const safeValue = Number.isFinite(props.value) ? props.value : 0
  const raw = (safeValue / safeMax) * 100

  if (raw < 0) {
    return 0
  }

  if (raw > 100) {
    return 100
  }

  return raw
})
</script>
