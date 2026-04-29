<template>
  <article
    class="rounded-lg border border-primary-100 bg-surface p-3 shadow-card dark:border-white/10"
    :style="cardStyle"
  >
    <div class="min-w-0">
      <p class="text-sm font-semibold leading-tight text-foreground">
        {{ task.property_name ?? 'Unknown property' }}
      </p>
      <p class="mt-0.5 text-[11px] text-muted">
        {{ clientNameLabel }}
      </p>
    </div>

    <div class="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted">
      <span class="font-semibold text-foreground/90">{{ bedsSummary }}</span>
      <span v-if="task.desired_start_time">Start: {{ formatTime(task.desired_start_time) }}</span>
    </div>

    <div v-if="chocolatesSummary.totalChocolates > 0 || linenSummaryLabel || task.task_type === 'BSB'" class="mt-1.5 flex flex-wrap items-center gap-1.5">
      <span
        v-if="chocolatesSummary.totalChocolates > 0"
        class="inline-flex rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-primary-700 dark:text-primary-300"
      >
        🍫 {{ chocolatesSummary.totalChocolates }}
      </span>
      <span
        v-if="linenSummaryLabel"
        class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-primary-700 dark:text-primary-300"
        :title="linenSummaryTitle"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-3 w-3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M7 10h10" />
          <path d="M7 14h6" />
        </svg>
        {{ linenSummaryLabel }}
      </span>
      <span
        v-if="task.task_type === 'BSB'"
        class="inline-flex rounded-full bg-warning/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-warning"
        title="Informational task type"
      >
        BSB
      </span>
    </div>

    <div v-if="visibleTags.length > 0" class="mt-1.5 flex flex-wrap gap-1.5">
      <span
        v-for="tag in visibleTags"
        :key="`${task.id}-tag-${tag}`"
        class="inline-flex rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-primary-700 dark:text-primary-300"
      >
        {{ tag }}
      </span>
    </div>

    <div class="mt-2.5 flex items-center">
      <div class="inline-flex items-center gap-1.5 rounded-md border border-primary-100/80 p-0.5 dark:border-white/10">
        <button
          type="button"
          class="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted transition hover:bg-primary-100/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/10"
          title="Move to previous day"
          aria-label="Move to previous day"
          :disabled="!previousDate"
          @click="previousDate && emit('move', { task, targetDate: previousDate })"
        >
          ‹
        </button>

        <button
          type="button"
          class="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted transition hover:bg-primary-100/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/10"
          title="Move to next day"
          aria-label="Move to next day"
          :disabled="!nextDate"
          @click="nextDate && emit('move', { task, targetDate: nextDate })"
        >
          ›
        </button>

        <button
          type="button"
          class="inline-flex h-7 w-7 items-center justify-center rounded-md text-primary-600 transition hover:bg-primary-100/50 dark:text-primary-400 dark:hover:bg-white/10"
          title="Edit task"
          aria-label="Edit task"
          @click="emit('edit', task)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
            <path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
          </svg>
        </button>

        <button
          type="button"
          class="inline-flex h-7 w-7 items-center justify-center rounded-md text-error-600 transition hover:bg-error-100/50 dark:text-error-400 dark:hover:bg-error-500/10"
          title="Delete task"
          aria-label="Delete task"
          @click="emit('delete', task)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z" />
          </svg>
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import type { DailyTaskDTO } from '../../../../shared/types/DailyTaskDTO'
import type { PropertyDTO } from '../../../../shared/types/PropertyDTO'
import type { ClientDTO } from '../../../../shared/types/ClientDTO'
import { calculateChocolates } from '../../../utils/calculateChocolates'
import { buildVisibleTaskTags } from '../../../utils/visualTaskTags'

interface MoveOption {
  date: string
  label: string
}

interface Props {
  task: DailyTaskDTO
  property?: PropertyDTO | null
  client?: ClientDTO | null
  moveOptions: MoveOption[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  edit: [task: DailyTaskDTO]
  delete: [task: DailyTaskDTO]
  move: [payload: { task: DailyTaskDTO; targetDate: string }]
}>()

const currentIndex = computed(() => {
  return props.moveOptions.findIndex((option) => option.date === props.task.date)
})

const previousDate = computed<string | null>(() => {
  if (currentIndex.value <= 0) {
    return null
  }

  return props.moveOptions[currentIndex.value - 1]?.date ?? null
})

const nextDate = computed<string | null>(() => {
  if (currentIndex.value === -1 || currentIndex.value >= props.moveOptions.length - 1) {
    return null
  }

  return props.moveOptions[currentIndex.value + 1]?.date ?? null
})

const bedsSummary = computed(() => {
  if (!props.property) {
    return 'N/A'
  }

  const parts: string[] = []

  if (props.property.beds_single > 0) parts.push(`${props.property.beds_single}S`)
  if (props.property.beds_queen > 0) parts.push(`${props.property.beds_queen}Q`)
  if (props.property.beds_king > 0) parts.push(`${props.property.beds_king}K`)
  if (props.property.bathrooms > 0) parts.push(`${props.property.bathrooms}B`)

  return parts.join(' | ') || '—'
})

const clientNameLabel = computed(() => props.client?.name ?? 'Not available')

const guestSummary = computed(() => {
  const name = props.task.guest_name?.trim() || ''
  const checkinDate = props.task.guest_checkin_date?.trim() || ''

  if (!name && !checkinDate) {
    return ''
  }

  if (name && checkinDate) {
    return `${name} (${checkinDate})`
  }

  return name || checkinDate
})

const chocolatesSummary = computed(() => {
  return calculateChocolates({
    includesChocolates: props.property?.includes_chocolates ?? false,
    bedsSingle: props.property?.beds_single ?? 0,
    bedsQueen: props.property?.beds_queen ?? 0,
    bedsKing: props.property?.beds_king ?? 0,
    extraBedsSingle: props.task.extra_linen_single_qty,
    extraBedsQueen: props.task.extra_linen_queen_qty,
    extraBedsKing: props.task.extra_linen_king_qty,
    extraChocolatesQty: props.task.extra_chocolate_qty,
  })
})

const towelsSummaryTotal = computed(() => {
  return props.task.extra_towel_qty ?? 0
})

const dishclothsDefaultQty = computed(() => {
  return props.property?.extra_dishcloths_default_qty ?? 0
})

const linenSummaryLabel = computed(() => {
  const parts: string[] = []
  if (towelsSummaryTotal.value > 0) {
    parts.push(`Tw ${towelsSummaryTotal.value}`)
  }
  if (dishclothsDefaultQty.value > 0) {
    parts.push(`Dc ${dishclothsDefaultQty.value}`)
  }

  return parts.join(' • ')
})

const linenSummaryTitle = computed(() => {
  const parts: string[] = []
  if (towelsSummaryTotal.value > 0) {
    parts.push(`Extra towels ${towelsSummaryTotal.value}`)
  }
  if (dishclothsDefaultQty.value > 0) {
    parts.push(`Default dishcloths ${dishclothsDefaultQty.value}`)
  }

  return parts.join(' • ')
})

const visibleTags = computed(() => {
  return buildVisibleTaskTags(props.task.tags, props.property?.default_tags ?? [])
})

const cardStyle = computed<CSSProperties>(() => {
  const color = props.client?.color
  if (!color) {
    return {}
  }

  return {
    borderLeftColor: color,
    borderLeftWidth: '4px',
    backgroundImage: `linear-gradient(to right, ${hexToRgba(color, 0.1)}, transparent 35%)`,
  }
})

function formatTime(time: string): string {
  const parts = time.split(':')
  const hour = parseInt(parts[0] ?? '0', 10)
  const min = parts[1] ?? '00'
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${min} ${suffix}`
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '')

  if (normalized.length !== 6) {
    return `rgba(59, 130, 246, ${alpha})`
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)

  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return `rgba(59, 130, 246, ${alpha})`
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
</script>
