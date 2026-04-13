<template>
  <div class="grid grid-cols-[minmax(220px,1.8fr)_68px_78px_60px_68px_minmax(180px,1fr)_74px] items-center gap-2 border-b border-primary-100/30 px-2 py-1 text-xs dark:border-white/10">
    <div class="min-w-0">
      <p class="truncate font-medium text-foreground" :title="`${entry.propertyName} · ${entry.clientName}`">
        {{ entry.propertyName }}
      </p>
    </div>

    <span class="text-muted">{{ entry.plannedMinutes }}m</span>

    <label class="flex items-center gap-1">
      <input
        :value="actualMinutesInput"
        type="text"
        inputmode="numeric"
        class="w-12 rounded border border-primary-200/60 bg-white/70 px-1.5 py-0.5 text-foreground focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-300 dark:border-white/15 dark:bg-black/30"
        :disabled="isSaving"
        @input="onActualInput"
      >
      <span class="text-muted">m</span>
    </label>

    <span class="text-xs font-medium" :class="differenceClass">
      {{ differenceLabel }}
    </span>

    <span class="font-semibold text-foreground">{{ totalMinutes }}m</span>

    <label>
      <input
        :value="noteInput"
        type="text"
        placeholder="Add note..."
        class="w-full rounded border border-primary-200/60 bg-white/70 px-2 py-0.5 text-foreground placeholder-muted/60 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-300 dark:border-white/15 dark:bg-black/30"
        :disabled="isSaving"
        @input="onNoteInput"
      >
    </label>

    <div class="flex justify-end">
      <button
        type="button"
        class="btn-primary !px-2 !py-0.5 text-xs"
        :disabled="isSaving || !isDirty"
        @click="save"
      >
        {{ isSaving ? '...' : 'Save' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { DayEntryItem } from '../../../composables/useEmployeeHoursAdmin'

interface SavePayload {
  id: string
  actual_minutes: number
  note: string | null
}

interface Props {
  entry: DayEntryItem
  isSaving: boolean
}

interface Emits {
  'save-entry': [payload: SavePayload]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const actualMinutesInput = ref(String(props.entry.actualMinutes))
const noteInput = ref(props.entry.entry.note ?? '')

watch(
  () => props.entry,
  (entry) => {
    actualMinutesInput.value = String(entry.actualMinutes)
    noteInput.value = entry.entry.note ?? ''
  },
)

const actualMinutes = computed(() => parseMinutes(actualMinutesInput.value))
const totalMinutes = computed(() => actualMinutes.value)
const formattedDifference = computed(() => {
  const difference = actualMinutes.value - props.entry.plannedMinutes
  const sign = difference > 0 ? '+' : ''
  return `${sign}${difference}m`
})

const differenceClass = computed(() => {
  const difference = actualMinutes.value - props.entry.plannedMinutes

  if (difference > 0) {
    return 'text-amber-600 dark:text-amber-400'
  }

  if (difference < 0) {
    return 'text-red-600 dark:text-red-400'
  }

  return 'text-muted'
})

const differenceLabel = computed(() => {
  const difference = actualMinutes.value - props.entry.plannedMinutes
  return difference === 0 ? '-' : formattedDifference.value
})

const isDirty = computed(() => {
  return (
    actualMinutes.value !== props.entry.actualMinutes
    || normalizeNote(noteInput.value) !== normalizeNote(props.entry.entry.note ?? '')
  )
})

function parseMinutes(value: string): number {
  const parsed = Number(value.replace(/[^\d]/g, ''))

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0
  }

  return Math.round(parsed)
}

function normalizeNote(value: string): string {
  return value.trim()
}

function onActualInput(event: Event): void {
  const target = event.target as HTMLInputElement
  actualMinutesInput.value = target.value
}

function onNoteInput(event: Event): void {
  const target = event.target as HTMLInputElement
  noteInput.value = target.value
}

function save(): void {
  emit('save-entry', {
    id: props.entry.entry.id,
    actual_minutes: actualMinutes.value,
    note: normalizeNote(noteInput.value) || null,
  })
}
</script>
