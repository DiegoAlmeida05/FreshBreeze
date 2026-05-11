<template>
  <NuxtLayout name="worker-layout" @signout="onSignOut">
    <section class="space-y-3 sm:space-y-4">
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-600">Worker</p>
        <h2 class="mt-1 text-xl font-semibold text-foreground sm:text-2xl">Timesheet</h2>
        <p class="mt-1 text-sm text-muted">Registre seu ponto semanal, ajustes e acompanhe o valor estimado.</p>
      </div>

      <BaseFeedbackBanner
        v-if="feedbackMessage"
        :tone="feedbackTone"
        :title="feedbackTitle"
        :message="feedbackMessage"
        floating
        dismissible
        @dismiss="clearFeedback"
      />

      <div v-if="isOffline && hasOfflineWeekCache" class="inline-flex items-center rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 text-[11px] font-medium text-warning dark:border-warning/30 dark:bg-warning/10">
        Offline mode - showing last saved week
        <span v-if="offlineWeekUpdatedLabel" class="ml-1 text-[10px] text-warning/80">({{ offlineWeekUpdatedLabel }})</span>
      </div>

      <div v-if="showSavedWeekBadge" class="inline-flex items-center rounded-full border border-primary-300/50 bg-primary-500/10 px-2.5 py-1 text-[11px] font-medium text-primary-700 dark:border-primary-400/40 dark:bg-primary-500/20 dark:text-primary-200">
        Showing saved data
      </div>

      <WorkerWeekNavigator
        v-model="selectedDate"
        :label="weekRangeLabel"
        @shift-week="shiftWeek"
        @go-today="goToCurrentWeek"
      />

      <section v-if="isInitialLoadPending" class="space-y-2.5 sm:space-y-3">
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-2 xl:grid-cols-4 xl:gap-3">
          <div class="min-h-[74px] animate-pulse rounded-xl border border-primary-100 bg-primary-100/60 dark:border-white/10 dark:bg-white/10" />
          <div class="min-h-[74px] animate-pulse rounded-xl border border-primary-100 bg-primary-100/60 dark:border-white/10 dark:bg-white/10" />
          <div class="min-h-[74px] animate-pulse rounded-xl border border-primary-100 bg-primary-100/60 dark:border-white/10 dark:bg-white/10" />
          <div class="min-h-[74px] animate-pulse rounded-xl border border-primary-100 bg-primary-100/60 dark:border-white/10 dark:bg-white/10" />
        </div>
        <div class="h-56 animate-pulse rounded-2xl border border-primary-100 bg-primary-100/50 dark:border-white/10 dark:bg-white/10" />
      </section>

      <section v-if="!isInitialLoadPending" class="grid grid-cols-2 gap-2 sm:grid-cols-2 xl:grid-cols-4 xl:gap-3">
        <div class="min-h-[74px] rounded-xl border border-primary-100 bg-surface px-2.5 py-2 dark:border-white/10 dark:bg-white/[0.03]">
          <p class="text-[11px] text-muted">Task hours</p>
          <p class="mt-1 text-sm font-semibold text-foreground sm:text-base">{{ formatHoursWithMinutes(displayedSummary.total_task_hours) }}</p>
        </div>

        <div class="min-h-[74px] rounded-xl border border-primary-100 bg-surface px-2.5 py-2 dark:border-white/10 dark:bg-white/[0.03]">
          <p class="text-[11px] text-muted">Worked hours</p>
          <p class="mt-1 text-sm font-semibold text-foreground sm:text-base">{{ formatHoursWithMinutes(displayedSummary.total_worked_hours) }}</p>
        </div>

        <div class="min-h-[74px] rounded-xl border border-primary-100 bg-surface px-2.5 py-2 dark:border-white/10 dark:bg-white/[0.03]">
          <p class="text-[11px] text-muted">Extra hours</p>
          <p class="mt-1 text-sm font-semibold text-foreground sm:text-base">{{ formatHoursWithMinutes(displayedSummary.total_extra_hours) }}</p>
        </div>

        <div class="min-h-[74px] rounded-xl border border-success/30 bg-success/10 px-2.5 py-2 dark:border-success/30 dark:bg-success/10">
          <p class="text-[11px] text-success">{{ isDaySummaryMode ? 'Estimated day pay' : 'Estimated pay' }}</p>
          <p class="mt-1 text-sm font-semibold text-success sm:text-base">{{ toCurrency(displayedSummary.estimated_weekly_pay) }}</p>
        </div>
      </section>

      <div v-if="!isInitialLoadPending" class="flex items-center justify-between px-1">
        <p class="text-xs text-muted">{{ isDaySummaryMode && selectedDay ? `Cards filtered by ${formatDayLabel(selectedDay.date)}` : 'Cards showing selected week totals' }}</p>
        <button
          v-if="isDaySummaryMode"
          type="button"
          class="btn-outline !px-2.5 !py-1 text-xs"
          @click="showWeekTotals"
        >
          Show week total
        </button>
      </div>

      <section v-if="!isInitialLoadPending" class="space-y-2.5 sm:space-y-3">
        <div class="grid grid-cols-7 gap-1">
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
            @click="onSelectDay(day.iso)"
          >
            <span
              v-if="day.isHoliday"
              class="holiday-badge inline-flex rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide"
              :class="day.iso === selectedDate ? 'bg-white/20 text-white' : 'bg-warning/15 text-warning'"
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

        <article
          v-if="selectedDay"
          class="overflow-hidden rounded-2xl border border-border bg-surface p-2.5 shadow-soft sm:p-3.5 dark:bg-white/[0.03]"
        >
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div class="min-w-0">
              <p class="text-sm font-semibold leading-tight text-foreground">{{ formatDayLabel(selectedDay.date) }}</p>
              <p class="mt-0.5 text-xs" :class="selectedDay.is_holiday ? 'text-warning font-medium' : 'text-muted'">
                {{ rateTypeLabel(selectedDay.applied_rate_type) }} · {{ toCurrency(selectedDay.hourly_rate) }}/h
              </p>
            </div>
            <p class="w-full rounded-full bg-primary-100 px-2.5 py-1 text-center text-[11px] font-semibold text-primary-700 dark:bg-primary-500/20 dark:text-primary-100 sm:w-auto sm:text-left">
              Task: {{ formatHoursWithMinutes(selectedDay.source_task_hours) }}
            </p>
          </div>

          <div class="mt-2.5 rounded-xl border border-border/80 bg-muted/10 p-2.5 sm:mt-3 sm:p-3">
            <p class="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">Main time</p>
            <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <label class="block min-w-0 text-xs text-muted">
                Start
                <input v-model="selectedDay.start_time" type="time" class="input-base mt-1 !w-full !min-w-0 !max-w-full !py-1.5 text-xs" @change="recomputeDay(selectedDay)">
              </label>

              <label class="block min-w-0 text-xs text-muted">
                End
                <input v-model="selectedDay.end_time" type="time" class="input-base mt-1 !w-full !min-w-0 !max-w-full !py-1.5 text-xs" @change="recomputeDay(selectedDay)">
              </label>

              <div class="min-w-0 w-full rounded-lg border border-primary-100 bg-primary-50/60 px-2.5 py-2.5 text-xs dark:border-white/10 dark:bg-white/[0.02]">
                <p class="text-muted">Main worked</p>
                  <p class="mt-1 font-semibold text-foreground">{{ formatHoursWithMinutes(getMainWorkedHours(selectedDay)) }}</p>
              </div>
            </div>
          </div>

          <div class="mt-2.5 sm:mt-3">
            <button
              type="button"
              class="w-full rounded-xl border px-3 py-2 text-xs font-semibold transition-colors"
              :class="isExtraSectionEnabled(selectedDay)
                ? 'border-warning/40 bg-warning/10 text-warning hover:bg-warning/15'
                : 'border-border bg-surface text-foreground hover:bg-muted/20'"
              @click="toggleExtraSection(selectedDay)"
            >
              {{ isExtraSectionEnabled(selectedDay) ? 'Remove extra time' : '+ Add extra time' }}
            </button>
          </div>

          <div v-if="isExtraSectionEnabled(selectedDay)" class="mt-2.5 space-y-2.5 sm:mt-3 sm:space-y-3">
            <div class="rounded-xl border border-border/80 bg-muted/10 p-2.5 sm:p-3">
              <p class="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">Extra block 1</p>
              <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <label class="block min-w-0 text-xs text-muted">
                  Extra start
                  <input v-model="selectedDay.extra_start_time" type="time" class="input-base mt-1 !w-full !min-w-0 !max-w-full !py-1.5 text-xs" @change="recomputeDay(selectedDay)">
                </label>

                <label class="block min-w-0 text-xs text-muted">
                  Extra end
                  <input v-model="selectedDay.extra_end_time" type="time" class="input-base mt-1 !w-full !min-w-0 !max-w-full !py-1.5 text-xs" @change="recomputeDay(selectedDay)">
                </label>

                <div class="min-w-0 w-full rounded-lg border border-primary-100 bg-primary-50/60 px-2.5 py-2.5 text-xs dark:border-white/10 dark:bg-white/[0.02]">
                  <p class="text-muted">Extra 1</p>
                  <p class="mt-1 font-semibold text-foreground">{{ formatHoursWithMinutes(getExtra1Hours(selectedDay)) }}</p>
                </div>
              </div>
            </div>

            <div class="rounded-xl border border-border/80 bg-muted/10 p-2.5 sm:p-3">
              <p class="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">Extra block 2</p>
              <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <label class="block min-w-0 text-xs text-muted">
                  Extra manual (minutes)
                  <input v-model.number="selectedDay.extra2_minutes" type="text" inputmode="decimal" class="input-base mt-1 !w-full !min-w-0 !max-w-full !py-2 text-sm" @input="recomputeDay(selectedDay)">
                </label>

                <div class="min-w-0 w-full rounded-lg border border-primary-100 bg-primary-50/60 px-2.5 py-2.5 text-xs dark:border-white/10 dark:bg-white/[0.02]">
                  <p class="text-muted">Extra 2</p>
                  <p class="mt-1 font-semibold text-foreground">{{ formatHoursWithMinutes(getExtra2Hours(selectedDay)) }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-2.5 rounded-xl border border-border/80 bg-muted/10 p-2.5 sm:mt-3 sm:p-3">
            <p class="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">Summary</p>
            <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div class="min-w-0 w-full rounded-lg border border-primary-100 bg-primary-50/60 px-2.5 py-2.5 text-xs dark:border-white/10 dark:bg-white/[0.02]">
                <p class="text-muted">Total worked</p>
                <p class="mt-1 font-semibold text-foreground">{{ formatHoursWithMinutes(selectedDay.worked_hours) }}</p>
                <p v-if="selectedDay.saved_at" class="mt-1 text-[10px] text-muted">{{ formatSavedTimestamp(selectedDay.saved_at) }}</p>
              </div>

              <div class="min-w-0 w-full rounded-lg border border-success/20 bg-success/10 px-2.5 py-2.5 text-xs">
                <p class="text-success">Estimated pay</p>
                <p class="mt-1 font-semibold text-success">{{ toCurrency(selectedDay.estimated_daily_pay) }}</p>
              </div>
            </div>
          </div>

          <div class="mt-2.5 flex justify-end sm:mt-3">
            <button type="button" class="btn-primary w-full !px-3 !py-2 text-sm sm:w-auto sm:text-xs" :disabled="isSaving" @click="saveDay(selectedDay)">
              {{ isSaving ? 'Saving...' : 'Save day' }}
            </button>
          </div>
        </article>

        <article
          v-else
          class="rounded-2xl border border-border bg-surface p-4 text-center text-sm text-muted dark:bg-white/[0.03]"
        >
          No day selected for this week.
        </article>
      </section>
    </section>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { preloadRouteComponents } from '#imports'
import BaseFeedbackBanner from '../../components/ui/BaseFeedbackBanner.vue'
import WorkerWeekNavigator from '../../components/features/worker/WorkerWeekNavigator.vue'
import { useAuth } from '../../composables/useAuth'
import { useWorkerOfflineCache } from '../../composables/useWorkerOfflineCache'
import { useWorkerNetworkStatus } from '../../composables/useWorkerNetworkStatus'
import { useWorkerSyncStatus } from '../../composables/useWorkerSyncStatus'
import { useWorkerSharedState } from '../../composables/useWorkerSharedState'
import { useWorkerPendingSync } from '../../composables/useWorkerPendingSync'
import { useWorkerProfileSettings } from '../../composables/useWorkerProfileSettings'
import { useWorkerTimesheet } from '../../composables/useWorkerTimesheet'
import type { WorkerTimesheetDay, WorkerTimesheetSummary } from '../../composables/useWorkerTimesheet'
import type { WorkerProfileSettings } from '../../composables/useWorkerProfileSettings'

definePageMeta({
  name: 'worker-timesheet',
  keepalive: true,
})

type FeedbackTone = 'success' | 'error' | 'warning' | 'info'

interface PersistedWorkerTimesheetPageState {
  selectedDate: string
  scrollY: number
}

interface WeekDayItem {
  iso: string
  weekdayShort: string
  dayNumber: string
  isToday: boolean
  isHoliday: boolean
}

type ExtraSectionsByDate = Record<string, boolean>

interface WorkerTimesheetDraftEntry {
  date: string
  start_time: string
  end_time: string
  extra_start_time: string
  extra_end_time: string
  extra2_minutes: number
  note: string
}

interface WorkerTimesheetDraftPayload {
  selectedDate: string
  entries: WorkerTimesheetDraftEntry[]
  extraSectionsByDate: ExtraSectionsByDate
}

interface WorkerTimesheetOfflineWeekPayload {
  days: WorkerTimesheetDay[]
  summary: WorkerTimesheetSummary
  settings: WorkerProfileSettings
}

const { signOut, getCurrentUser } = useAuth()
const { getCached: getPersistentCached, setCached: setPersistentCached } = useWorkerOfflineCache()
const { isOnline, isOffline } = useWorkerNetworkStatus()
const { startSync, finishSync } = useWorkerSyncStatus()
const { getTimesheet: getSharedTimesheet, setTimesheet: setSharedTimesheet } = useWorkerSharedState()
const { enqueueAction } = useWorkerPendingSync()
const { getSettings } = useWorkerProfileSettings()
const { getWeekTimesheet, saveDayEntry } = useWorkerTimesheet()
const TIMESHEET_OFFLINE_CACHE_TTL = 30 * 60 * 1000

const persistedWorkerTimesheetPageState = useState<PersistedWorkerTimesheetPageState>('worker-timesheet-page-state', () => ({
  selectedDate: todayIsoDate(),
  scrollY: 0,
}))

const selectedDate = ref(persistedWorkerTimesheetPageState.value.selectedDate || todayIsoDate())
const days = ref<WorkerTimesheetDay[]>([])
const extraSectionsByDate = ref<ExtraSectionsByDate>({})
const summary = ref<WorkerTimesheetSummary>({
  total_task_hours: 0,
  total_worked_hours: 0,
  total_extra_hours: 0,
  estimated_weekly_pay: 0,
})
const currentSettings = ref<WorkerProfileSettings | null>(null)

const feedbackTone = ref<FeedbackTone>('info')
const feedbackTitle = ref('')
const feedbackMessage = ref('')
const isSaving = ref(false)
const isLoadingWeek = ref(false)
const draftOwnerProfileId = ref<string>('')
const isApplyingDraft = ref(false)
const shouldRestoreDraftOnNextLoad = ref(true)
const summaryFilterMode = ref<'week' | 'day'>('week')
const offlineWeekSavedAt = ref<number | null>(null)
const hasOfflineWeekCache = ref(false)
const hasHydratedInitialCache = ref(false)
const fetchFailedWithCache = ref(false)
const lastValidWeek = ref<WorkerTimesheetOfflineWeekPayload | null>(null)
let draftSaveTimeout: ReturnType<typeof setTimeout> | null = null

const showSavedWeekBadge = computed(() => {
  return hasHydratedInitialCache.value && (isOffline.value || fetchFailedWithCache.value)
})

const offlineWeekUpdatedLabel = computed(() => {
  if (!offlineWeekSavedAt.value) {
    return ''
  }

  return new Date(offlineWeekSavedAt.value).toLocaleString('en-AU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
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

const weekDays = computed<WeekDayItem[]>(() => {
  const start = getStartOfWeek(parseIsoDate(selectedDate.value))

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)

    const iso = formatDateForInput(date)
    const dayData = days.value.find((item) => item.date === iso)

    return {
      iso,
      weekdayShort: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: String(date.getDate()).padStart(2, '0'),
      isToday: iso === todayIsoDate(),
      isHoliday: Boolean(dayData?.is_holiday),
    }
  })
})

const selectedDay = computed<WorkerTimesheetDay | null>(() => {
  const day = days.value.find((item) => item.date === selectedDate.value)
  if (day) {
    return day
  }

  return days.value[0] ?? null
})

const isDaySummaryMode = computed(() => summaryFilterMode.value === 'day' && Boolean(selectedDay.value))
const isInitialLoadPending = computed(() => isLoadingWeek.value && days.value.length === 0)

const displayedSummary = computed<WorkerTimesheetSummary>(() => {
  if (!isDaySummaryMode.value || !selectedDay.value) {
    return summary.value
  }

  const day = selectedDay.value
  return {
    total_task_hours: Number(day.source_task_hours || 0),
    total_worked_hours: Number(day.worked_hours || 0),
    total_extra_hours: Number((getExtra1Hours(day) + getExtra2Hours(day)).toFixed(2)),
    estimated_weekly_pay: Number(day.estimated_daily_pay || 0),
  }
})

onMounted(async () => {
  if (import.meta.client) {
    void preloadRouteComponents('/worker/schedule')
  }

  try {
    const currentUser = await getCurrentUser()
    draftOwnerProfileId.value = currentUser.id
  } catch {
    draftOwnerProfileId.value = ''
  }

  await loadWeek(shouldRestoreDraftOnNextLoad.value)
  shouldRestoreDraftOnNextLoad.value = false

  if (import.meta.client) {
    await nextTick()
    requestAnimationFrame(() => {
      window.scrollTo({
        top: persistedWorkerTimesheetPageState.value.scrollY,
        behavior: 'auto',
      })
    })
  }
})

watch(selectedDate, () => {
  persistedWorkerTimesheetPageState.value.selectedDate = selectedDate.value
  void loadWeek(false)
})

function getDraftStorageKey(dateIso = selectedDate.value): string {
  const weekStart = formatDateForInput(getStartOfWeek(parseIsoDate(dateIso)))
  return `worker-timesheet-draft:${draftOwnerProfileId.value}:${weekStart}`
}

function getTimesheetOfflineCacheKey(dateIso = selectedDate.value): string {
  const weekStart = formatDateForInput(getStartOfWeek(parseIsoDate(dateIso)))
  return `worker-timesheet-week:${weekStart}`
}

function buildDraftPayload(): WorkerTimesheetDraftPayload {
  return {
    selectedDate: selectedDate.value,
    entries: days.value.map((day) => ({
      date: day.date,
      start_time: day.start_time || '',
      end_time: day.end_time || '',
      extra_start_time: day.extra_start_time || '',
      extra_end_time: day.extra_end_time || '',
      extra2_minutes: Number.isFinite(day.extra2_minutes) ? Math.max(0, Math.round(day.extra2_minutes)) : 0,
      note: day.note || '',
    })),
    extraSectionsByDate: { ...extraSectionsByDate.value },
  }
}

function scheduleDraftSave(): void {
  if (!import.meta.client || !draftOwnerProfileId.value || isApplyingDraft.value || days.value.length === 0) {
    return
  }

  if (draftSaveTimeout) {
    clearTimeout(draftSaveTimeout)
  }

  draftSaveTimeout = setTimeout(() => {
    try {
      const storageKey = getDraftStorageKey()
      localStorage.setItem(storageKey, JSON.stringify(buildDraftPayload()))
    } catch {
      // Ignore storage errors to keep the page functional.
    }
    draftSaveTimeout = null
  }, 450)
}

function restoreWeekDraft(): number {
  if (!import.meta.client || !draftOwnerProfileId.value || days.value.length === 0) {
    return 0
  }

  const storageKey = getDraftStorageKey()
  const rawDraft = localStorage.getItem(storageKey)

  if (!rawDraft) {
    return 0
  }

  try {
    const parsed = JSON.parse(rawDraft) as WorkerTimesheetDraftPayload
    if (!parsed || !Array.isArray(parsed.entries)) {
      return 0
    }

    const entriesByDate = new Map(parsed.entries.map((entry) => [entry.date, entry]))
    let restoredCount = 0

    isApplyingDraft.value = true

    for (const day of days.value) {
      const draftEntry = entriesByDate.get(day.date)
      if (!draftEntry) {
        continue
      }

      day.start_time = draftEntry.start_time || ''
      day.end_time = draftEntry.end_time || ''
      day.extra_start_time = draftEntry.extra_start_time || ''
      day.extra_end_time = draftEntry.extra_end_time || ''
      day.extra2_minutes = Number.isFinite(draftEntry.extra2_minutes) ? Math.max(0, Math.round(draftEntry.extra2_minutes)) : 0
      day.note = draftEntry.note || ''

      if (parsed.extraSectionsByDate && typeof parsed.extraSectionsByDate[day.date] === 'boolean') {
        extraSectionsByDate.value[day.date] = parsed.extraSectionsByDate[day.date] as boolean
      }

      recomputeDay(day)
      restoredCount += 1
    }

    isApplyingDraft.value = false
    return restoredCount
  } catch {
    return 0
  }
}

function clearWeekDraft(): void {
  if (!import.meta.client || !draftOwnerProfileId.value) {
    return
  }

  localStorage.removeItem(getDraftStorageKey())
}

function clearDraftEntryForDay(dayDate: string): void {
  if (!import.meta.client || !draftOwnerProfileId.value) {
    return
  }

  const storageKey = getDraftStorageKey()
  const rawDraft = localStorage.getItem(storageKey)
  if (!rawDraft) {
    return
  }

  try {
    const parsed = JSON.parse(rawDraft) as WorkerTimesheetDraftPayload
    if (!parsed || !Array.isArray(parsed.entries)) {
      clearWeekDraft()
      return
    }

    const nextEntries = parsed.entries.filter((entry) => entry.date !== dayDate)
    const nextSections = { ...(parsed.extraSectionsByDate || {}) }
    delete nextSections[dayDate]

    if (nextEntries.length === 0) {
      clearWeekDraft()
      return
    }

    localStorage.setItem(storageKey, JSON.stringify({
      selectedDate: parsed.selectedDate || selectedDate.value,
      entries: nextEntries,
      extraSectionsByDate: nextSections,
    } satisfies WorkerTimesheetDraftPayload))
  } catch {
    clearWeekDraft()
  }
}

watch(
  () => days.value,
  () => {
    scheduleDraftSave()
  },
  { deep: true },
)

watch(
  () => extraSectionsByDate.value,
  () => {
    scheduleDraftSave()
  },
  { deep: true },
)

onBeforeRouteLeave(() => {
  if (!import.meta.client) {
    return
  }

  persistedWorkerTimesheetPageState.value.selectedDate = selectedDate.value
  persistedWorkerTimesheetPageState.value.scrollY = window.scrollY
  scheduleDraftSave()
})

async function loadWeek(restoreDraft = false): Promise<void> {
  const startedAt = import.meta.dev && import.meta.client ? performance.now() : 0
  isLoadingWeek.value = true
  clearFeedback()
  let syncStarted = false
  fetchFailedWithCache.value = false

  const cacheKey = getTimesheetOfflineCacheKey(selectedDate.value)
  const sharedWeek = getSharedTimesheet<WorkerTimesheetOfflineWeekPayload>(cacheKey)
  const cachedWeek = getPersistentCached<WorkerTimesheetOfflineWeekPayload>(cacheKey)
  const resolvedWeek = sharedWeek?.value ?? cachedWeek?.data ?? lastValidWeek.value

  if (resolvedWeek) {
    currentSettings.value = resolvedWeek.settings
    days.value = resolvedWeek.days
    summary.value = resolvedWeek.summary
    extraSectionsByDate.value = resolvedWeek.days.reduce<ExtraSectionsByDate>((acc, day) => {
      acc[day.date] = hasExistingExtraData(day)
      return acc
    }, {})
    hasOfflineWeekCache.value = true
    offlineWeekSavedAt.value = sharedWeek?.savedAt ?? cachedWeek?.savedAt ?? null
    lastValidWeek.value = resolvedWeek
    hasHydratedInitialCache.value = true
    isLoadingWeek.value = false

    if (restoreDraft) {
      restoreWeekDraft()
    }
  } else {
    hasOfflineWeekCache.value = false
    offlineWeekSavedAt.value = null
  }

  if (!isOnline.value) {
    if (!resolvedWeek) {
      setFeedback('warning', 'Offline mode', 'No saved timesheet available offline.')
    } else {
      fetchFailedWithCache.value = true
    }

    isLoadingWeek.value = false
    return
  }

  startSync()
  syncStarted = true

  try {
    const settings = await getSettings()
    currentSettings.value = settings
    const week = await getWeekTimesheet(selectedDate.value, settings)
    days.value = week.days
    extraSectionsByDate.value = week.days.reduce<ExtraSectionsByDate>((acc, day) => {
      acc[day.date] = hasExistingExtraData(day)
      return acc
    }, {})

    summary.value = week.summary

    for (const day of days.value) {
      recomputeDay(day)
    }

    if (restoreDraft) {
      restoreWeekDraft()
    }

    setPersistentCached(cacheKey, {
      days: week.days,
      summary: week.summary,
      settings,
    }, TIMESHEET_OFFLINE_CACHE_TTL)

    setSharedTimesheet(cacheKey, {
      days: week.days,
      summary: week.summary,
      settings,
    })

    lastValidWeek.value = {
      days: week.days,
      summary: week.summary,
      settings,
    }
    hasHydratedInitialCache.value = true

    hasOfflineWeekCache.value = true
    offlineWeekSavedAt.value = Date.now()
  } catch (error: unknown) {
    if (!lastValidWeek.value && !resolvedWeek) {
      setFeedback('error', 'Timesheet unavailable', error instanceof Error ? error.message : 'Failed to load timesheet data.')
    } else {
      fetchFailedWithCache.value = true
    }
  } finally {
    if (syncStarted) {
      finishSync()
    }

    isLoadingWeek.value = false

    if (import.meta.dev && import.meta.client) {
      const elapsed = Math.round((performance.now() - startedAt) * 100) / 100
      console.info(`[worker-perf] timesheet:load-week: ${elapsed}ms`)
    }
  }
}

function recomputeDay(day: WorkerTimesheetDay): void {
  const mainWorkHours = getMainWorkedHours(day)
  const extraEnabled = isExtraSectionEnabled(day)
  const extra1Hours = extraEnabled ? getExtra1Hours(day) : 0
  const safeExtra2Minutes = extraEnabled ? Math.max(0, Math.round(Number(day.extra2_minutes) || 0)) : 0
  const extra2Hours = Number((safeExtra2Minutes / 60).toFixed(2))

  const rateType = getRateTypeForDate(day.date, day.is_holiday)
  const hourlyRate = getHourlyRateForDay(rateType)

  day.extra1_minutes = Math.round(extra1Hours * 60)
  day.extra2_minutes = safeExtra2Minutes
  // Legacy extra_hours field must mirror Extra 1.
  day.extra_hours = Number(extra1Hours.toFixed(2))
  day.worked_hours = Number((mainWorkHours + extra1Hours + extra2Hours).toFixed(2))
  day.applied_hourly_rate = Number(hourlyRate.toFixed(2))
  day.applied_rate_type = rateType
  day.estimated_pay = Number((day.worked_hours * day.applied_hourly_rate).toFixed(2))
  day.hourly_rate = day.applied_hourly_rate
  day.estimated_daily_pay = Number((day.worked_hours * day.hourly_rate).toFixed(2))

  summary.value = {
    total_task_hours: Number(days.value.reduce((sum, item) => sum + item.source_task_hours, 0).toFixed(2)),
    total_worked_hours: Number(days.value.reduce((sum, item) => sum + item.worked_hours, 0).toFixed(2)),
    total_extra_hours: Number(days.value.reduce((sum, item) => sum + getExtra1Hours(item) + getExtra2Hours(item), 0).toFixed(2)),
    estimated_weekly_pay: Number(days.value.reduce((sum, item) => sum + item.estimated_daily_pay, 0).toFixed(2)),
  }
}

function diffMinutesSafe(startTime: string, endTime: string): number {
  if (!startTime || !endTime) {
    return 0
  }

  const [startHourRaw, startMinRaw] = startTime.split(':')
  const [endHourRaw, endMinRaw] = endTime.split(':')

  const startHour = Number(startHourRaw ?? NaN)
  const startMin = Number(startMinRaw ?? NaN)
  const endHour = Number(endHourRaw ?? NaN)
  const endMin = Number(endMinRaw ?? NaN)

  if (!Number.isFinite(startHour) || !Number.isFinite(startMin) || !Number.isFinite(endHour) || !Number.isFinite(endMin)) {
    return 0
  }

  const startMinutes = (startHour * 60) + startMin
  let endMinutes = (endHour * 60) + endMin

  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60
  }

  return Math.max(0, endMinutes - startMinutes)
}

function getMainWorkedHours(day: WorkerTimesheetDay): number {
  return Number((diffMinutesSafe(day.start_time || '', day.end_time || '') / 60).toFixed(2))
}

function getExtra1Hours(day: WorkerTimesheetDay): number {
  return Number((diffMinutesSafe(day.extra_start_time || '', day.extra_end_time || '') / 60).toFixed(2))
}

function getExtra2Hours(day: WorkerTimesheetDay): number {
  if (!isExtraSectionEnabled(day)) {
    return 0
  }

  const extra2Minutes = Number.isFinite(day.extra2_minutes) ? Math.max(0, day.extra2_minutes) : 0
  return extra2Minutes / 60
}

function isExtraSectionEnabled(day: WorkerTimesheetDay): boolean {
  return Boolean(extraSectionsByDate.value[day.date])
}

function toggleExtraSection(day: WorkerTimesheetDay): void {
  const enabled = isExtraSectionEnabled(day)

  if (enabled) {
    day.extra_start_time = null
    day.extra_end_time = null
    day.extra2_minutes = 0
  }

  extraSectionsByDate.value[day.date] = !enabled
  recomputeDay(day)
}

function hasExistingExtraData(day: WorkerTimesheetDay): boolean {
  const hasExtra1 = Boolean(day.extra_start_time) || Boolean(day.extra_end_time)
  const hasExtra2 = Number(day.extra2_minutes || 0) > 0
  const hasLegacyExtra = Number(day.extra_hours || 0) > 0

  return hasExtra1 || hasExtra2 || hasLegacyExtra
}

function formatSavedTimestamp(timestamp: string | null): string {
  if (!timestamp) return ''
  
  try {
    const date = new Date(timestamp)
    const formatted = date.toLocaleString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Australia/Melbourne',
    })
    return `Saved at: ${formatted}`
  } catch {
    return ''
  }
}

async function saveDay(day: WorkerTimesheetDay): Promise<void> {
  try {
    if (!isOnline.value) {
      enqueueAction('saveTimesheet', {
        date: day.date,
        note: 'Offline save attempt kept in local draft only.',
      })
      scheduleDraftSave()
      setFeedback('warning', 'Offline mode', 'You are offline. Changes remain in local draft and are queued for future sync.')
      return
    }

    isSaving.value = true
    recomputeDay(day)
    await saveDayEntry(day)
    day.saved_at = new Date().toISOString()
    clearDraftEntryForDay(day.date)
    setFeedback('success', 'Day saved', `${formatDayLabel(day.date)} updated successfully.`)
  } catch (error: unknown) {
    setFeedback('error', 'Save failed', error instanceof Error ? error.message : 'Unable to save day entry.')
  } finally {
    isSaving.value = false
  }
}

function todayIsoDate(): string {
  return formatDateForInput(new Date())
}

function parseIsoDate(iso: string): Date {
  const [yearRaw, monthRaw, dayRaw] = iso.split('-')
  const year = Number(yearRaw ?? NaN)
  const month = Number(monthRaw ?? NaN)
  const day = Number(dayRaw ?? NaN)

  return new Date(
    Number.isFinite(year) ? year : 1970,
    Number.isFinite(month) ? month - 1 : 0,
    Number.isFinite(day) ? day : 1,
  )
}

function getStartOfWeek(date: Date): Date {
  const start = new Date(date)
  const day = start.getDay()
  const diff = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + diff)
  start.setHours(0, 0, 0, 0)
  return start
}

function formatDateForInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function shiftWeek(delta: number): void {
  const date = parseIsoDate(selectedDate.value)
  date.setDate(date.getDate() + (delta * 7))
  selectedDate.value = formatDateForInput(date)
  summaryFilterMode.value = 'week'
}

function goToCurrentWeek(): void {
  selectedDate.value = todayIsoDate()
  summaryFilterMode.value = 'week'
}

function onSelectDay(dateIso: string): void {
  selectedDate.value = dateIso
  summaryFilterMode.value = 'day'
}

function showWeekTotals(): void {
  summaryFilterMode.value = 'week'
}

function formatDayLabel(dateIso: string): string {
  const d = parseIsoDate(dateIso)
  return d.toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  })
}

function toCurrency(value: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0)
}

function formatHoursWithMinutes(hours: number): string {
  const safeHours = Number.isFinite(hours) ? Math.max(0, hours) : 0
  const minutes = Math.round(safeHours * 60)
  return `${minutes} min · ${safeHours.toFixed(2)}h`
}

function getRateTypeForDate(dateIso: string, isHoliday: boolean): 'holiday' | 'sunday' | 'weekday' {
  if (isHoliday) {
    return 'holiday'
  }

  const day = parseIsoDate(dateIso).getDay()
  return day === 0 ? 'sunday' : 'weekday'
}

function getHourlyRateForDay(rateType: 'holiday' | 'sunday' | 'weekday'): number {
  const settings = currentSettings.value

  if (!settings) {
    return 0
  }

  if (rateType === 'holiday') {
    return Number(settings.hourly_rate_holiday_override || 0)
  }

  if (rateType === 'sunday') {
    return Number(settings.hourly_rate_sunday_override || 0)
  }

  return Number(settings.hourly_rate_weekday_override || 0)
}

function rateTypeLabel(rateType: 'holiday' | 'sunday' | 'weekday'): string {
  if (rateType === 'holiday') {
    return 'Holiday rate'
  }

  if (rateType === 'sunday') {
    return 'Sunday rate'
  }

  return 'Weekday rate'
}

function setFeedback(tone: FeedbackTone, title: string, message: string): void {
  feedbackTone.value = tone
  feedbackTitle.value = title
  feedbackMessage.value = message
}

function clearFeedback(): void {
  feedbackTitle.value = ''
  feedbackMessage.value = ''
}

async function onSignOut(): Promise<void> {
  await signOut()
  await navigateTo('/login')
}

onBeforeUnmount(() => {
  if (draftSaveTimeout) {
    clearTimeout(draftSaveTimeout)
    draftSaveTimeout = null
  }
})
</script>
