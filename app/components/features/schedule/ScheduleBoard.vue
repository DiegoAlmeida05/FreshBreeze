<template>
  <section class="space-y-2">
    <div v-if="showGroupFilter" class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-primary-600">Operations</p>
        <h2 class="mt-1 text-2xl font-semibold text-foreground">Team Schedule</h2>
      </div>

      <div class="shrink-0">
        <div class="rounded-lg border border-primary-100 bg-surface/80 px-2 py-1 text-right text-[11px] font-semibold text-foreground dark:border-white/10 dark:bg-white/5">
          {{ scheduleItems.length }} task(s)
        </div>
      </div>
    </div>

    <div class="flex flex-wrap items-start justify-between gap-2">
      <div class="flex flex-wrap items-center gap-1.5">
        <div class="flex items-center gap-1.5">
        <button
          type="button"
          class="btn-outline !px-2.5 !py-1.5 text-xs"
          aria-label="Previous week"
          @click="shiftWeek(-1)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        <input
          id="schedule-date"
          v-model="selectedDate"
          type="date"
          class="input-base w-full max-w-[170px] !py-1 !text-xs [color-scheme:light] dark:[color-scheme:dark]"
        >

        <button
          type="button"
          class="btn-outline !px-2.5 !py-1.5 text-xs"
          aria-label="Next week"
          @click="shiftWeek(1)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      <button
        type="button"
          class="btn-outline !px-2 !py-1 text-[11px]"
        @click="goToToday"
      >
        Today
      </button>

        <p class="text-[10px] font-medium uppercase tracking-wide text-muted">
          {{ weekRangeLabel }}
        </p>
      </div>

      <div v-if="!showGroupFilter" class="shrink-0">
        <div class="rounded-lg border border-primary-100 bg-surface/80 px-2 py-1 text-right text-[11px] font-semibold text-foreground dark:border-white/10 dark:bg-white/5">
          {{ scheduleItems.length }} task(s)
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-1.5 lg:flex-row lg:items-start">
      <div class="grid flex-1 grid-cols-7 gap-1">
          <button
            v-for="day in weekDays"
            :key="day.iso"
            type="button"
            class="relative overflow-hidden rounded-md border px-1.5 py-1 text-center transition"
            :class="day.iso === selectedDate
              ? day.isHoliday
                ? 'border-warning bg-warning text-white shadow-sm'
                : 'border-primary-500 bg-primary-500 text-white shadow-sm'
              : day.isHoliday
                ? 'border-warning/35 bg-warning/10 text-foreground hover:border-warning/60 dark:border-warning/30 dark:bg-warning/10'
              : day.isToday
                ? 'border-primary-200 bg-primary-50 text-foreground hover:border-primary-300 hover:bg-primary-100/70 dark:border-white/15 dark:bg-white/5'
                : 'border-border bg-surface text-foreground hover:border-primary-200 hover:bg-primary-50/50 dark:hover:bg-white/5'"
            @click="selectedDate = day.iso"
          >
            <span
              v-if="day.isHoliday"
              class="holiday-badge inline-flex rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide"
              :class="day.iso === selectedDate ? 'bg-white/20 text-white' : 'bg-warning/15 text-warning'"
              :title="day.holidayNames.join(', ') || 'Holiday'"
            >
              H
            </span>
            <p class="text-[8px] font-semibold uppercase leading-none tracking-wide" :class="day.iso === selectedDate ? 'text-white/80' : day.isHoliday ? 'text-warning' : 'text-muted'">
              {{ day.weekdayShort }}
            </p>
            <p class="mt-0.5 text-[11px] font-semibold leading-none">
              {{ day.dayNumber }}
            </p>
          </button>
      </div>

      <div
        v-if="showGroupFilter"
        class="flex flex-wrap items-center gap-1 lg:w-[170px] lg:justify-end"
        role="group"
        aria-label="Filter by group"
      >
          <button
            type="button"
            class="btn-outline !px-1.5 !py-0.5 text-[10px]"
            :class="selectedGroup === 'all' ? 'bg-primary-500 text-white hover:bg-primary-600 dark:bg-primary-500 dark:text-white' : ''"
            @click="selectedGroup = 'all'"
          >
            All
          </button>
          <button
            v-for="group in availableGroups"
            :key="group"
            type="button"
            class="btn-outline !px-1.5 !py-0.5 text-[10px]"
            :class="selectedGroup === group ? 'bg-primary-500 text-white hover:bg-primary-600 dark:bg-primary-500 dark:text-white' : ''"
            @click="selectedGroup = group"
          >
            Team {{ group }}
          </button>
      </div>
    </div>

    <p class="text-[11px] font-medium text-muted">
      {{ displayDate }}
    </p>

    <div v-if="showOfflineScheduleBadge" class="inline-flex items-center gap-1 rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 text-[11px] font-medium text-warning dark:border-warning/30 dark:bg-warning/10">
      Offline mode - showing last saved schedule
      <span v-if="offlineScheduleUpdatedLabel" class="text-[10px] text-warning/80">({{ offlineScheduleUpdatedLabel }})</span>
    </div>

    <div v-if="showSavedScheduleBadge" class="inline-flex items-center gap-1 rounded-full border border-primary-300/50 bg-primary-500/10 px-2.5 py-1 text-[11px] font-medium text-primary-700 dark:border-primary-400/40 dark:bg-primary-500/20 dark:text-primary-200">
      Showing saved data
      <span v-if="offlineScheduleUpdatedLabel" class="text-[10px] text-primary-700/80 dark:text-primary-200/80">({{ offlineScheduleUpdatedLabel }})</span>
    </div>

    <div
      v-if="showInitialScheduleSkeleton"
      class="space-y-3 py-2"
      aria-live="polite"
      aria-label="Loading schedule"
    >
      <div class="h-20 animate-pulse rounded-xl border border-primary-100 bg-primary-100/50 dark:border-white/10 dark:bg-white/10" />
      <div class="h-20 animate-pulse rounded-xl border border-primary-100 bg-primary-100/50 dark:border-white/10 dark:bg-white/10" />
      <div class="h-20 animate-pulse rounded-xl border border-primary-100 bg-primary-100/50 dark:border-white/10 dark:bg-white/10" />
    </div>

    <div
      v-else-if="error"
      class="rounded-xl border border-error-200 bg-error-50 px-5 py-4 text-sm text-error-700 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400"
      role="alert"
    >
      {{ error }}
    </div>

    <div
      v-else-if="scheduleItems.length === 0"
      class="rounded-xl border border-primary-100 bg-gradient-to-r from-primary-50/60 via-surface to-primary-warm-50/60 px-6 py-10 text-center dark:border-white/10 dark:from-[#1b2534] dark:via-[#182231] dark:to-[#212d3d]"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="mx-auto mb-3 h-10 w-10 text-muted/40"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      <p class="text-sm font-medium text-muted">No jobs scheduled for this day</p>
      <p class="mt-1 text-xs text-muted">
        {{ emptyMessage }}
      </p>
    </div>

    <div
      v-else
      class="space-y-3"
      role="list"
      :aria-label="`${scheduleItems.length} tasks for ${displayDate}`"
    >
      <div
        v-for="item in scheduleItems"
        :key="item.stopId"
        role="listitem"
      >
        <WorkerTaskCard :item="item" @open-details="openJobDetail(item.stopId)" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { navigateTo } from '#imports'
import { useDataCache } from '../../../composables/useDataCache'
import { useWorkerOfflineCache } from '../../../composables/useWorkerOfflineCache'
import { useWorkerNetworkStatus } from '../../../composables/useWorkerNetworkStatus'
import { useWorkerSharedState } from '../../../composables/useWorkerSharedState'
import { useWorkerSyncStatus } from '../../../composables/useWorkerSyncStatus'
import { useHolidays } from '../../../composables/useHolidays'
import { useWorkerSchedule } from '../../../composables/useWorkerSchedule'
import type { ScheduleItem } from '../../../composables/useWorkerSchedule'
import type { WorkerMinimalJobDetail } from '../../../composables/useWorkerSharedState'
import WorkerTaskCard from './WorkerTaskCard.vue'

interface Props {
  mode: 'worker' | 'admin'
}

const props = defineProps<Props>()

const { getSchedule } = useWorkerSchedule()
const { getCached, setCached } = useDataCache()
const { getCached: getPersistentCached, setCached: setPersistentCached } = useWorkerOfflineCache()
const { isOnline, isOffline } = useWorkerNetworkStatus()
const { getSchedule: getSharedSchedule, setSchedule: setSharedSchedule, setMinimalJobDetail } = useWorkerSharedState()
const { startSync, finishSync } = useWorkerSyncStatus()
const { getHolidaysByRange } = useHolidays()
const LAST_VIEWED_DATE_STORAGE_KEY = 'freshbreeze:last-viewed-board-date'
const SCHEDULE_OFFLINE_CACHE_TTL = 30 * 60 * 1000
const JOB_MINIMAL_OFFLINE_CACHE_TTL = 30 * 60 * 1000

function formatDateForInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return String(year) + '-' + month + '-' + day
}

function todayString(): string {
  return formatDateForInput(new Date())
}

const selectedDate = ref(getInitialSelectedDate())
const selectedGroup = ref('all')
const isLoading = ref(false)
const error = ref<string | null>(null)
const scheduleItems = ref<ScheduleItem[]>([])
const availableGroups = ref<string[]>([])
const holidayNamesByDate = ref<Record<string, string[]>>({})
const scheduleRequestId = ref(0)
const offlineScheduleSavedAt = ref<number | null>(null)
const hasOfflineScheduleCache = ref(false)
const hasHydratedInitialCache = ref(false)
const fetchFailedWithCache = ref(false)
const lastValidSchedule = ref<{
  scheduleItems: ScheduleItem[]
  availableGroups: string[]
  holidayNamesByDate: Record<string, string[]>
} | null>(null)

const showGroupFilter = computed(() => props.mode === 'admin')
const showInitialScheduleSkeleton = computed(() => isLoading.value && scheduleItems.value.length === 0 && !error.value)
const isOfflineWithoutCache = computed(() => isOffline.value && !hasOfflineScheduleCache.value)
const showOfflineScheduleBadge = computed(() => isOffline.value && hasOfflineScheduleCache.value)
const showSavedScheduleBadge = computed(() => {
  return hasHydratedInitialCache.value && (isOffline.value || fetchFailedWithCache.value)
})

const offlineScheduleUpdatedLabel = computed(() => {
  if (!offlineScheduleSavedAt.value) {
    return ''
  }

  return new Date(offlineScheduleSavedAt.value).toLocaleString('en-AU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
})

const emptyMessage = computed(() => {
  if (isOfflineWithoutCache.value) {
    return 'No saved schedule available offline.'
  }

  if (props.mode === 'admin') {
    return 'No published route plan found for this date.'
  }

  return 'You have no tasks assigned for this day.'
})

function shiftDate(delta: number): void {
  const parts = selectedDate.value.split('-').map(Number)
  if (parts.length !== 3) return

  const [y, m, d] = parts as [number, number, number]
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + delta)
  selectedDate.value = formatDateForInput(dt)
}

function shiftWeek(delta: number): void {
  shiftDate(delta * 7)
}

function goToToday(): void {
  selectedDate.value = todayString()
}

const weekDays = computed(() => {
  const start = getStartOfWeek(parseIsoDate(selectedDate.value))

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)

    const iso = formatDateForInput(date)
    const holidayNames = holidayNamesByDate.value[iso] ?? []

    return {
      iso,
      weekdayShort: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: String(date.getDate()).padStart(2, '0'),
      monthShort: date.toLocaleDateString('en-US', { month: 'short' }),
      isToday: iso === todayString(),
      isHoliday: holidayNames.length > 0,
      holidayNames,
    }
  })
})

const weekRangeLabel = computed(() => {
  const start = getStartOfWeek(parseIsoDate(selectedDate.value))
  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  const startLabel = start.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  })
  const endLabel = end.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return `${startLabel} - ${endLabel}`
})

const displayDate = computed(() => {
  const parts = selectedDate.value.split('-').map(Number)
  if (parts.length !== 3) return selectedDate.value

  const [y, m, d] = parts as [number, number, number]
  const dt = new Date(y, m - 1, d)

  return dt.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
})

async function loadSchedule(): Promise<void> {
  const requestId = scheduleRequestId.value + 1
  scheduleRequestId.value = requestId
  error.value = null
  fetchFailedWithCache.value = false

  const cacheKey = `schedule-board:${props.mode}:${selectedDate.value}:${selectedGroup.value}`
  const sharedCached = getSharedSchedule<{
    scheduleItems: ScheduleItem[]
    availableGroups: string[]
    holidayNamesByDate: Record<string, string[]>
  }>(cacheKey)

  const cached = getCached<{
    scheduleItems: ScheduleItem[]
    availableGroups: string[]
    holidayNamesByDate: Record<string, string[]>
  }>(cacheKey)

  const persistentCached = getPersistentCached<{
    scheduleItems: ScheduleItem[]
    availableGroups: string[]
    holidayNamesByDate: Record<string, string[]>
  }>(cacheKey)

  const resolvedCache = sharedCached?.value ?? cached ?? persistentCached?.data ?? lastValidSchedule.value
  hasOfflineScheduleCache.value = Boolean(resolvedCache)
  offlineScheduleSavedAt.value = sharedCached?.savedAt ?? persistentCached?.savedAt ?? null

  if (resolvedCache) {
    scheduleItems.value = resolvedCache.scheduleItems
    availableGroups.value = resolvedCache.availableGroups
    holidayNamesByDate.value = resolvedCache.holidayNamesByDate
    cacheMinimalDetailsFromSchedule(resolvedCache.scheduleItems)
    lastValidSchedule.value = resolvedCache
    hasHydratedInitialCache.value = true
    isLoading.value = false

    if (!cached) {
      setCached(cacheKey, resolvedCache, 3 * 60 * 1000)
    }
  } else {
    isLoading.value = true
  }

  if (!isOnline.value) {
    fetchFailedWithCache.value = Boolean(lastValidSchedule.value)
    isLoading.value = false
    return
  }

  startSync()

  try {
    const weekStart = getStartOfWeek(parseIsoDate(selectedDate.value))
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const [result, holidays] = await Promise.all([
      getSchedule(
        selectedDate.value,
        showGroupFilter.value ? selectedGroup.value : undefined,
      ),
      getHolidaysByRange(formatDateForInput(weekStart), formatDateForInput(weekEnd)).catch(() => []),
    ])

    holidayNamesByDate.value = (holidays ?? []).reduce<Record<string, string[]>>((acc, holiday) => {
      if (!acc[holiday.date]) {
        acc[holiday.date] = []
      }

      acc[holiday.date].push(holiday.name)
      return acc
    }, {})

    if (requestId !== scheduleRequestId.value) {
      return
    }

    scheduleItems.value = result.scheduleItems
    availableGroups.value = result.availableGroups

    setCached(cacheKey, {
      scheduleItems: result.scheduleItems,
      availableGroups: result.availableGroups,
      holidayNamesByDate: holidayNamesByDate.value,
    }, 3 * 60 * 1000)

    setPersistentCached(cacheKey, {
      scheduleItems: result.scheduleItems,
      availableGroups: result.availableGroups,
      holidayNamesByDate: holidayNamesByDate.value,
    }, SCHEDULE_OFFLINE_CACHE_TTL)

    setSharedSchedule(cacheKey, {
      scheduleItems: result.scheduleItems,
      availableGroups: result.availableGroups,
      holidayNamesByDate: holidayNamesByDate.value,
    })

    cacheMinimalDetailsFromSchedule(result.scheduleItems)

    lastValidSchedule.value = {
      scheduleItems: result.scheduleItems,
      availableGroups: result.availableGroups,
      holidayNamesByDate: holidayNamesByDate.value,
    }
    hasHydratedInitialCache.value = true

    hasOfflineScheduleCache.value = true
    offlineScheduleSavedAt.value = Date.now()
  } catch (err) {
    if (requestId !== scheduleRequestId.value) {
      return
    }

    const hasAnyCachedPayload = Boolean(lastValidSchedule.value || resolvedCache)
    fetchFailedWithCache.value = hasAnyCachedPayload

    if (!hasAnyCachedPayload) {
      error.value = err instanceof Error ? err.message : 'Failed to load schedule.'
    }
  } finally {
    finishSync()

    if (requestId === scheduleRequestId.value) {
      isLoading.value = false
    }
  }
}

watch(selectedDate, () => {
  persistLastViewedDate(selectedDate.value)
  selectedGroup.value = 'all'
  loadSchedule()
})

watch(selectedGroup, () => {
  if (showGroupFilter.value) {
    loadSchedule()
  }
})

onMounted(async () => {
  await loadSchedule()
})

async function openJobDetail(routeStopId: string): Promise<void> {
  const basePath = props.mode === 'admin' ? '/admin/job/' : '/worker/job/'
  await navigateTo(basePath + routeStopId)
}

function getInitialSelectedDate(): string {
  if (!process.client) {
    return todayString()
  }

  const savedDate = window.localStorage.getItem(LAST_VIEWED_DATE_STORAGE_KEY)
  return isValidIsoDate(savedDate) ? savedDate : todayString()
}

function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

function getStartOfWeek(date: Date): Date {
  const start = new Date(date)
  const day = start.getDay()
  const diff = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + diff)
  start.setHours(0, 0, 0, 0)
  return start
}

function persistLastViewedDate(value: string): void {
  if (!process.client || !isValidIsoDate(value)) {
    return
  }

  window.localStorage.setItem(LAST_VIEWED_DATE_STORAGE_KEY, value)
}

function isValidIsoDate(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  return (
    date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day
  )
}

function toMinimalJobDetail(item: ScheduleItem): WorkerMinimalJobDetail {
  return {
    routeStopId: item.stopId,
    groupLabel: item.groupLabel,
    orderIndex: item.orderIndex,
    taskDate: selectedDate.value,
    propertyId: item.propertyId,
    propertyName: item.propertyName,
    clientName: item.clientName,
    address: item.address,
    lat: item.propertyLat,
    lng: item.propertyLng,
    taskType: item.taskType,
    tags: item.tags,
    taskNotes: item.notes,
    guestName: item.guestName,
    guestCheckinDate: item.guestCheckinDate,
    bathrooms: item.bathrooms,
    bedsSingle: item.bedsSingle,
    bedsQueen: item.bedsQueen,
    bedsKing: item.bedsKing,
    extraTowelsQty: item.extraTowelsQty,
    extraBedsSingle: item.extraBedsSingle,
    extraBedsQueen: item.extraBedsQueen,
    extraBedsKing: item.extraBedsKing,
    extraChocolatesQty: item.extraChocolatesQty,
    hasKey: item.hasKey,
    keyPhotoUrl: item.keyPhotoUrl,
    link1: item.link1,
    link2: item.link2,
    plannedStartTime: item.plannedStartTime,
    plannedEndTime: item.plannedEndTime,
  }
}

function cacheMinimalDetailsFromSchedule(items: ScheduleItem[]): void {
  for (const item of items) {
    const minimalDetail = toMinimalJobDetail(item)
    setMinimalJobDetail(item.stopId, minimalDetail)
    setPersistentCached(`worker-job-min:${item.stopId}`, minimalDetail, JOB_MINIMAL_OFFLINE_CACHE_TTL)
  }
}
</script>
