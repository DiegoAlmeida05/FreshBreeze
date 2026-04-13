<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { EmployeeTimeEntryAdminDTO, UpdateEmployeeTimeEntryAdminDTO } from '../../../../shared/types/EmployeeTimeEntryAdminDTO'

interface SaveAdjustmentPayload {
  entryId: string
  payload: UpdateEmployeeTimeEntryAdminDTO
}

interface Props {
  adjustmentEntry: EmployeeTimeEntryAdminDTO | null
  rateUsed: number
  isSaving: boolean
}

interface Emits {
  'save-adjustment': [payload: SaveAdjustmentPayload]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const startExtraInput = ref(String(props.adjustmentEntry?.start_extra_minutes ?? 0))
const endExtraInput = ref(String(props.adjustmentEntry?.end_extra_minutes ?? 0))
const otherExtraInput = ref(String(props.adjustmentEntry?.other_extra_minutes ?? 0))
const noteInput = ref(props.adjustmentEntry?.note ?? '')

watch(
  () => props.adjustmentEntry,
  (adjustment) => {
    if (!adjustment) return
    startExtraInput.value = String(adjustment.start_extra_minutes)
    endExtraInput.value = String(adjustment.end_extra_minutes)
    otherExtraInput.value = String(adjustment.other_extra_minutes)
    noteInput.value = adjustment.note ?? ''
  },
)

const startExtraMinutes = computed(() => parseMinutes(startExtraInput.value))
const endExtraMinutes = computed(() => parseMinutes(endExtraInput.value))
const otherExtraMinutes = computed(() => parseMinutes(otherExtraInput.value))
const totalMinutes = computed(() => startExtraMinutes.value + endExtraMinutes.value + otherExtraMinutes.value)
const totalHours = computed(() => totalMinutes.value / 60)
const estimatedPay = computed(() => Number((totalHours.value * props.rateUsed).toFixed(2)))

const isDirty = computed(() => {
  if (!props.adjustmentEntry) return false
  return (
    startExtraMinutes.value !== props.adjustmentEntry.start_extra_minutes
    || endExtraMinutes.value !== props.adjustmentEntry.end_extra_minutes
    || otherExtraMinutes.value !== props.adjustmentEntry.other_extra_minutes
    || normalizeNote(noteInput.value) !== normalizeNote(props.adjustmentEntry.note ?? '')
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

function onStartExtraInput(event: Event): void {
  const target = event.target as HTMLInputElement
  startExtraInput.value = target.value
}

function onEndExtraInput(event: Event): void {
  const target = event.target as HTMLInputElement
  endExtraInput.value = target.value
}

function onOtherExtraInput(event: Event): void {
  const target = event.target as HTMLInputElement
  otherExtraInput.value = target.value
}

function onNoteInput(event: Event): void {
  const target = event.target as HTMLInputElement
  noteInput.value = target.value
}

function save(): void {
  if (!props.adjustmentEntry) return
  emit('save-adjustment', {
    entryId: props.adjustmentEntry.id,
    payload: {
      start_extra_minutes: startExtraMinutes.value,
      end_extra_minutes: endExtraMinutes.value,
      other_extra_minutes: otherExtraMinutes.value,
      note: normalizeNote(noteInput.value) || null,
    },
  })
}
</script>

<template>
  <div class="grid grid-cols-[minmax(220px,1.8fr)_68px_78px_60px_68px_minmax(180px,1fr)_74px] items-center gap-2 border-b border-primary-100/30 bg-primary-50/15 px-2 py-1 text-xs dark:border-white/10 dark:bg-white/[0.02]">
    <div class="min-w-0">
      <p class="truncate font-semibold text-primary-700 dark:text-primary-200">Day adjustment</p>
    </div>

    <label class="flex items-center gap-1">
      <span class="text-muted">S</span>
      <input
        :value="startExtraInput"
        type="text"
        inputmode="numeric"
        class="w-11 rounded border border-primary-200/60 bg-white/70 px-1.5 py-0.5 text-foreground focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-300 dark:border-white/15 dark:bg-black/30"
        :disabled="isSaving || !adjustmentEntry"
        @input="onStartExtraInput"
      >
    </label>

    <label class="flex items-center gap-1">
      <span class="text-muted">O</span>
      <input
        :value="otherExtraInput"
        type="text"
        inputmode="numeric"
        class="w-12 rounded border border-primary-200/60 bg-white/70 px-1.5 py-0.5 text-foreground focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-300 dark:border-white/15 dark:bg-black/30"
        :disabled="isSaving || !adjustmentEntry"
        @input="onOtherExtraInput"
      >
    </label>

    <label class="flex items-center gap-1">
      <span class="text-muted">E</span>
      <input
        :value="endExtraInput"
        type="text"
        inputmode="numeric"
        class="w-11 rounded border border-primary-200/60 bg-white/70 px-1.5 py-0.5 text-foreground focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-300 dark:border-white/15 dark:bg-black/30"
        :disabled="isSaving || !adjustmentEntry"
        @input="onEndExtraInput"
      >
    </label>

    <span class="font-semibold text-foreground">{{ totalMinutes }}m</span>

    <label>
      <input
        :value="noteInput"
        type="text"
        placeholder="Add note..."
        class="w-full rounded border border-primary-200/60 bg-white/70 px-2 py-0.5 text-foreground placeholder-muted/60 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-300 dark:border-white/15 dark:bg-black/30"
        :disabled="isSaving || !adjustmentEntry"
        @input="onNoteInput"
      >
    </label>

    <div class="flex justify-end">
      <button
        type="button"
        class="btn-primary !px-2 !py-0.5 text-xs"
        :disabled="isSaving || !isDirty || !adjustmentEntry"
        @click="save"
      >
        {{ isSaving ? '...' : 'Save' }}
      </button>
    </div>
  </div>
</template>