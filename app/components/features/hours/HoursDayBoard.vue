<template>
  <div class="border border-primary-100/60 dark:border-white/10">
    <!-- Header: Day label + summary -->
    <header class="flex flex-wrap items-baseline justify-between gap-3 border-b border-primary-100/40 bg-primary-50/30 px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]">
      <div>
        <h3 class="text-base font-semibold text-foreground">{{ dayLabel }}</h3>
        <span
          v-if="isHoliday"
          class="inline-flex rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success"
          :title="holidayNames.join(', ')"
        >
          {{ holidayNames.join(', ') }}
        </span>
      </div>

      <div class="flex items-baseline gap-4 text-sm">
        <div>
          <span class="text-muted">Tasks:</span>
          <span class="ml-1 font-semibold text-foreground">{{ dayTotalTaskMinutes }}m</span>
        </div>
        <div>
          <span class="text-muted">Adj:</span>
          <span class="ml-1 font-semibold text-foreground">{{ dayTotalAdjustmentMinutes }}m</span>
        </div>
        <div>
          <span class="text-muted">Total:</span>
          <span class="ml-1 font-semibold text-foreground">{{ dayTotalMinutes }}m</span>
        </div>
        <div class="font-semibold text-foreground">{{ formattedDayTotalPay }}</div>
      </div>
    </header>

    <div v-if="errorMessage" class="rounded-lg border border-error-300/70 bg-error-50/70 px-3 py-2 text-sm text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-300">
      {{ errorMessage }}
    </div>

    <div v-if="isLoading" class="space-y-1 bg-white/50 dark:bg-white/[0.01]">
      <div class="h-10 border-b border-primary-100/30 bg-primary-100/20 dark:border-white/10" />
      <div class="h-10 border-b border-primary-100/30 bg-primary-100/20 dark:border-white/10" />
      <div class="h-10 border-b border-primary-100/30 bg-primary-100/20 dark:border-white/10" />
    </div>

    <div v-else-if="groups.length === 0" class="bg-white/50 px-4 py-6 text-center text-sm text-muted dark:bg-white/[0.01]">
      No entries found for this day. If a published plan exists, entries will be seeded automatically.
    </div>

    <div v-else class="space-y-0 bg-white/50 dark:bg-white/[0.01]">
      <HoursEmployeeSection
        v-for="group in groups"
        :key="group.employeeId"
        :group="group"
        :saving-entry-ids="savingEntryIds"
        :saving-adjustment-ids="savingAdjustmentIds"
        @save-entry="onSaveEntry"
        @save-adjustment="onSaveAdjustment"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import HoursEmployeeSection from './HoursEmployeeSection.vue'
import { useEmployeeHoursAdmin, type DayEntriesByEmployee } from '../../../composables/useEmployeeHoursAdmin'
import type { UpdateEmployeeTimeEntryAdminDTO } from '../../../../shared/types/EmployeeTimeEntryAdminDTO'

interface SavePayload {
  id: string
  actual_minutes: number
  note: string | null
}

interface SaveAdjustmentPayload {
  entryId: string
  payload: UpdateEmployeeTimeEntryAdminDTO
}

interface Props {
  date: string
}

interface Emits {
  'entries-updated': []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { seedDayEntriesFromPublishedPlan, getDayEntries, updateTimeEntry } = useEmployeeHoursAdmin()

const isLoading = ref(false)
const errorMessage = ref('')
const groups = ref<DayEntriesByEmployee[]>([])
const dayTotalTaskMinutes = ref(0)
const dayTotalAdjustmentMinutes = ref(0)
const dayTotalMinutes = ref(0)
const dayTotalHours = ref(0)
const dayTotalPay = ref(0)
const isHoliday = ref(false)
const holidayNames = ref<string[]>([])
const savingEntryIds = ref<Set<string>>(new Set())
const savingAdjustmentIds = ref<Set<string>>(new Set())

const dayLabel = computed(() => {
  const [yearRaw, monthRaw, dayRaw] = props.date.split('-')
  const year = Number(yearRaw ?? 0)
  const month = Number(monthRaw ?? 1)
  const day = Number(dayRaw ?? 1)
  const date = new Date(year, month - 1, day)

  if (Number.isNaN(date.getTime())) {
    return props.date
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
})

const formattedDayTotalPay = computed(() => {
  return dayTotalPay.value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'AUD',
  })
})

watch(
  () => props.date,
  async () => {
    await loadDayBoard()
  },
)

onMounted(async () => {
  await loadDayBoard()
})

async function loadDayBoard(): Promise<void> {
  if (!props.date) {
    groups.value = []
    dayTotalTaskMinutes.value = 0
    dayTotalAdjustmentMinutes.value = 0
    dayTotalMinutes.value = 0
    dayTotalHours.value = 0
    dayTotalPay.value = 0
    isHoliday.value = false
    holidayNames.value = []
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    await seedDayEntriesFromPublishedPlan(props.date)
    const result = await getDayEntries(props.date)
    groups.value = result.groups
    dayTotalTaskMinutes.value = result.dayTotalTaskMinutes
    dayTotalAdjustmentMinutes.value = result.dayTotalAdjustmentMinutes
    dayTotalMinutes.value = result.dayTotalMinutes
    dayTotalHours.value = result.dayTotalHours
    dayTotalPay.value = result.dayTotalPay
    isHoliday.value = result.isHoliday
    holidayNames.value = result.holidayNames
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to load day entries.'
  } finally {
    isLoading.value = false
  }
}

async function onSaveEntry(payload: SavePayload): Promise<void> {
  const next = new Set(savingEntryIds.value)
  next.add(payload.id)
  savingEntryIds.value = next
  errorMessage.value = ''

  try {
    await updateTimeEntry(payload.id, {
      actual_minutes: payload.actual_minutes,
      note: payload.note,
    })

    await loadDayBoard()
    emit('entries-updated')
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to update time entry.'
  } finally {
    const remaining = new Set(savingEntryIds.value)
    remaining.delete(payload.id)
    savingEntryIds.value = remaining
  }
}

async function onSaveAdjustment(payload: SaveAdjustmentPayload): Promise<void> {
  const next = new Set(savingAdjustmentIds.value)
  next.add(payload.entryId)
  savingAdjustmentIds.value = next
  errorMessage.value = ''

  try {
    await updateTimeEntry(payload.entryId, payload.payload)
    await loadDayBoard()
    emit('entries-updated')
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to update day adjustment.'
  } finally {
    const remaining = new Set(savingAdjustmentIds.value)
    remaining.delete(payload.entryId)
    savingAdjustmentIds.value = remaining
  }
}
</script>
