<template>
  <article
    class="rounded-lg border border-primary-100 bg-surface p-3 shadow-card dark:border-white/10"
    :style="cardStyle"
  >
    <div class="grid grid-cols-1 gap-2 lg:grid-cols-[1fr_auto] lg:items-start">
      <div class="min-w-0">
        <p class="text-sm font-semibold leading-tight text-foreground">
          {{ task.property_name ?? 'Unknown property' }}
        </p>
        <p class="mt-0.5 text-[11px] text-muted">
          {{ clientName || 'Not available' }}
        </p>
        <p v-if="propertyData?.address" class="mt-0.5 truncate text-[10px] text-muted" :title="propertyData.address">
          {{ propertyData.address }}
        </p>

        <div class="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted">
          <span class="font-semibold text-foreground/90">{{ roomSummary }}</span>
          <span v-if="column === 'unassigned' && cleaningMinutesLabel">{{ cleaningMinutesLabel }}</span>
          <span v-if="column === 'unassigned' && task.desired_start_time">Start: {{ formatTime(task.desired_start_time) }}</span>
          <span v-if="extrasSummary !== 'No extras'">Extras: {{ extrasSummary }}</span>
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
      </div>

      <div v-if="column === 'unassigned'" class="flex flex-col items-end gap-1.5">
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
        <div class="flex flex-wrap justify-end gap-1.5">
          <button
            v-for="team in props.availableTeams"
            :key="team.id"
            type="button"
            class="inline-flex h-7 min-w-7 items-center justify-center rounded-md border border-primary-200 bg-primary-50 px-2 text-xs font-semibold text-primary-700 transition hover:border-primary-300 hover:bg-primary-100 dark:border-white/15 dark:bg-white/5 dark:text-primary-300 dark:hover:bg-white/10"
            :title="'Send to Team ' + team.label"
            :aria-label="'Send to Team ' + team.label"
            @click="emit('assignToTeam', team.id)"
          >
            {{ team.label }}
          </button>
        </div>
      </div>

      <div v-else class="flex flex-col items-end gap-1.5 lg:self-stretch">
        <div class="text-right text-[11px] font-semibold leading-tight text-foreground/90">
          <p>{{ durationMinutesLabel }}</p>
          <p v-if="plannedStartTime && plannedEndTime">{{ formatTime(plannedStartTime) }} - {{ formatTime(plannedEndTime) }}</p>
        </div>

        <div class="mt-auto inline-flex items-center gap-1.5 rounded-md border border-primary-100/80 p-0.5 dark:border-white/10">
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
            title="Return to Tasks"
            aria-label="Return to Tasks"
            @click="emit('remove')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z" />
            </svg>
          </button>
          <button
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted transition hover:bg-primary-100/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/10"
            :disabled="!canMoveUp"
            :title="canMoveUp ? 'Move up' : 'Already first'"
            aria-label="Move up"
            @click="emit('moveUp')"
          >
            ↑
          </button>
          <button
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted transition hover:bg-primary-100/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/10"
            :disabled="!canMoveDown"
            :title="canMoveDown ? 'Move down' : 'Already last'"
            aria-label="Move down"
            @click="emit('moveDown')"
          >
            ↓
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import type { DailyTaskDTO } from '../../../../shared/types/DailyTaskDTO'
import type { PropertyDTO } from '../../../../shared/types/PropertyDTO'
import { calculateChocolates } from '../../../utils/calculateChocolates'
import { buildVisibleTaskTags } from '../../../utils/visualTaskTags'

interface Props {
  task: DailyTaskDTO
  column: 'unassigned' | 'assigned'
  durationMinutes?: number | null
  plannedStartTime?: string | null
  plannedEndTime?: string | null
  canMoveUp?: boolean
  canMoveDown?: boolean
  availableTeams?: { id: string; label: string }[]
  propertyData?: PropertyDTO | null
  clientName?: string | null
  clientColor?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  canMoveUp: false,
  canMoveDown: false,
})

const emit = defineEmits<{
  assignToTeam: [teamId: string]
  edit: [task: DailyTaskDTO]
  remove: []
  moveUp: []
  moveDown: []
}>()

const propertyData = computed(() => props.propertyData ?? null)
const clientName = computed(() => props.clientName ?? null)

const roomSummary = computed(() => {
  const property = propertyData.value
  if (!property) {
    return 'N/A'
  }

  const parts: string[] = []

  if (property.beds_single > 0) parts.push(`${property.beds_single}S`)
  if (property.beds_queen > 0) parts.push(`${property.beds_queen}Q`)
  if (property.beds_king > 0) parts.push(`${property.beds_king}K`)
  if (property.bathrooms > 0) parts.push(`${property.bathrooms}B`)

  return parts.join(' | ') || '—'
})

const cleaningMinutesLabel = computed(() => {
  const override = props.task.cleaning_minutes_override
  const defaultMinutes = propertyData.value?.default_cleaning_minutes ?? null
  const minutes = override ?? defaultMinutes

  return minutes !== null ? `${minutes} min` : ''
})

const extrasSummary = computed(() => {
  const parts: string[] = []

  if (props.task.extra_beds_single > 0) parts.push(`S:${props.task.extra_beds_single}`)
  if (props.task.extra_beds_queen > 0) parts.push(`Q:${props.task.extra_beds_queen}`)
  if (props.task.extra_beds_king > 0) parts.push(`K:${props.task.extra_beds_king}`)
  if (props.task.extra_towels_qty > 0) parts.push(`Tw:${props.task.extra_towels_qty}`)

  return parts.length > 0 ? parts.join(' | ') : 'No extras'
})

const chocolatesSummary = computed(() => {
  return calculateChocolates({
    includesChocolates: propertyData.value?.includes_chocolates ?? false,
    bedsSingle: propertyData.value?.beds_single ?? 0,
    bedsQueen: propertyData.value?.beds_queen ?? 0,
    bedsKing: propertyData.value?.beds_king ?? 0,
    extraBedsSingle: props.task.extra_beds_single,
    extraBedsQueen: props.task.extra_beds_queen,
    extraBedsKing: props.task.extra_beds_king,
    extraChocolatesQty: props.task.extra_chocolates_qty,
  })
})

const towelsSummaryTotal = computed(() => {
  return props.task.extra_towels_qty ?? 0
})

const dishclothsDefaultQty = computed(() => {
  return propertyData.value?.extra_dishcloths_default_qty ?? 0
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
  return buildVisibleTaskTags(props.task.tags, propertyData.value?.default_tags ?? [])
})

const durationMinutesLabel = computed(() => {
  if (typeof props.durationMinutes === 'number' && Number.isFinite(props.durationMinutes) && props.durationMinutes >= 0) {
    return `${props.durationMinutes} min`
  }

  return cleaningMinutesLabel.value || '0 min'
})

const cardStyle = computed<CSSProperties>(() => {
  const color = props.clientColor
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
  const minute = parts[1] ?? '00'
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minute} ${suffix}`
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
