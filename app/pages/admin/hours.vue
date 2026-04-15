<template>
  <NuxtLayout name="admin-layout" @signout="onSignOut">
    <section class="space-y-5">
      <header class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="text-xl font-semibold text-foreground">Hours</h1>
        </div>

        <button
          type="button"
          class="btn-outline !px-3 !py-2 text-xs"
          @click="toggleFullscreen"
        >
          {{ isFullscreenMode ? 'Exit Full Screen' : 'Full Screen' }}
        </button>
      </header>

      <p v-if="overviewError" class="rounded-lg border border-error-200 bg-error-50/70 px-3 py-2 text-xs text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-200">
        {{ overviewError }}
      </p>

      <div class="overflow-x-hidden rounded-xl border border-primary-100/80 bg-primary-50/30 p-3 dark:border-white/10 dark:bg-white/[0.02]">
        <div class="space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <div class="flex items-center gap-1.5">
              <button type="button" class="btn-outline !px-2.5 !py-1.5 text-xs" aria-label="Previous week" @click="goToPreviousWeek">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5" aria-hidden="true">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>

              <input
                id="hours-date"
                v-model="selectedDate"
                type="date"
                class="input-base w-full max-w-[170px] !py-1 !text-xs [color-scheme:light] dark:[color-scheme:dark]"
              >

              <button type="button" class="btn-outline !px-2.5 !py-1.5 text-xs" aria-label="Next week" @click="goToNextWeek">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>

            <button type="button" class="btn-outline !px-2 !py-1 text-[11px]" @click="goToToday">
              This week
            </button>

            <div class="w-full text-left text-[10px] text-muted sm:ml-auto sm:w-auto sm:text-right">
              <p class="font-medium uppercase tracking-wide">{{ weekRangeLabel }}</p>
              <p class="mt-0.5">Week of {{ weekLabel }}</p>
              <p class="mt-0.5">Planned {{ dayTotalPlannedMinutes }} min</p>
            </div>
          </div>

          <div class="flex flex-col gap-2 lg:flex-row lg:items-start">
            <div class="mobile-table-scroll flex-1">
            <div class="grid min-w-[560px] grid-cols-7 gap-1.5">
              <button
                v-for="day in weekDays"
                :key="day.date"
                type="button"
                class="relative overflow-hidden rounded-md border px-2 py-1.5 text-center transition"
                :class="dayCardClass(day)"
                @click="selectedDate = day.date"
              >
                <span
                  v-if="day.isHoliday"
                  class="holiday-badge inline-flex rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide"
                  :class="dayHolidayBadgeClass(day)"
                >
                  H
                </span>
                <p class="text-[9px] font-semibold uppercase leading-none tracking-wide" :class="dayWeekdayClass(day)">{{ day.weekday }}</p>
                <p class="mt-1 text-xs font-semibold leading-none" :class="dayNumberClass(day)">{{ day.dayNumber }}</p>
                <p class="mt-1 text-[9px] leading-none" :class="dayMetaClass(day)">{{ day.totalMinutes }}m · {{ day.totalHours.toFixed(1) }}h</p>
              </button>
            </div>
            </div>

            <div class="grid w-full grid-cols-2 gap-2 lg:w-[360px] lg:shrink-0">
            <div class="min-w-0 rounded-lg border border-primary-100 bg-surface/80 px-3 py-2 text-xs text-muted dark:border-white/10 dark:bg-white/5">
              <p class="font-medium text-foreground">Week total</p>
              <p class="mt-0.5 text-[11px]">{{ weeklyTotalMinutes }} min</p>
              <p class="mt-1 text-[10px]">{{ weeklyTotalHours.toFixed(2) }}h</p>
            </div>

            <div class="min-w-0 rounded-lg border px-3 py-2 text-xs text-muted" :class="selectedDaySummaryClass">
              <p class="font-medium text-foreground">Selected day</p>
              <p class="mt-0.5 truncate text-[11px]">{{ dayLabel }}</p>
              <p
                v-if="selectedWeekDay?.isHoliday"
                class="mt-1 inline-flex max-w-full rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                :class="selectedDaySummaryBadgeClass"
                :title="selectedWeekDay.holidayNames.join(', ') || 'Holiday'"
              >
                {{ selectedWeekDay.holidayNames.join(', ') || 'Holiday' }}
              </p>
              <p class="mt-1 text-[10px]">{{ dayTotalActualMinutes }} min · {{ dayTotalHours.toFixed(2) }}h</p>
            </div>
            </div>
          </div>
        </div>

      </div>

      <div class="rounded-xl border border-primary-100/70 bg-white/50 dark:border-white/10 dark:bg-white/[0.01]">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-primary-100/50 px-4 py-3 dark:border-white/10">
          <div>
            <h3 class="text-base font-semibold text-foreground">Team Hours · {{ dayLabel }}</h3>
            <p class="mt-1 text-[11px]" :class="hoursStatusClass">
              {{ hoursStatusText }}
            </p>
          </div>
          <div class="flex flex-wrap items-center justify-end gap-3">
            <p
              v-if="hasUnsavedChanges"
              class="rounded-full bg-warning/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-warning"
            >
              Unsaved changes
            </p>
            <div class="flex flex-wrap items-center gap-2">
              <button
                type="button"
                class="btn-outline !px-3 !py-2 text-xs"
                :disabled="isSavingDay || isPublishingDay || !hasUnsavedChanges"
                @click="onSaveChanges"
              >
                {{ isSavingDay ? 'Saving...' : 'Save Draft' }}
              </button>
              <button
                type="button"
                class="btn-primary !px-3 !py-2 text-xs"
                :disabled="isSavingDay || isPublishingDay || dayTeams.length === 0"
                :aria-busy="isPublishingDay"
                @click="onPublishChanges"
              >
                <span v-if="isPublishingDay" class="inline-flex items-center gap-1.5">
                  <span class="h-3 w-3 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                  Publishing...
                </span>
                <span v-else>Publish Hours</span>
              </button>
            </div>
            <div class="text-right text-sm">
              <p class="font-semibold text-foreground">{{ dayTotalActualMinutes }} min worked</p>
              <p class="text-xs text-muted">{{ dayTotalHours.toFixed(2) }}h</p>
              <p class="text-xs text-muted">{{ dayTotalPlannedMinutes }} min planned · {{ formatDiffMinutes(dayTotalActualMinutes - dayTotalPlannedMinutes) }}</p>
            </div>
          </div>
        </div>

        <p v-if="saveSuccessMessage" class="border-b border-success/25 bg-success/10 px-4 py-2 text-xs text-success dark:border-success/20">
          {{ saveSuccessMessage }}
        </p>

        <p v-if="dayError" class="border-b border-error-200 bg-error-50/70 px-4 py-2 text-xs text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-200">
          {{ dayError }}
        </p>

        <div v-if="isDayLoading" class="space-y-2 p-4">
          <div class="h-12 animate-pulse rounded border border-primary-100 bg-primary-100/40" />
          <div class="h-12 animate-pulse rounded border border-primary-100 bg-primary-100/40" />
          <div class="h-12 animate-pulse rounded border border-primary-100 bg-primary-100/40" />
        </div>

        <div v-else-if="dayTeams.length === 0" class="p-6 text-center text-sm text-muted">
          No route groups found for this date.
        </div>

        <div v-else class="space-y-3 p-3">
          <section
            v-for="team in dayTeams"
            :key="team.routeGroupId"
            class="overflow-hidden rounded-lg border border-primary-100/70 bg-white/70 dark:border-white/10 dark:bg-black/15"
          >
            <header class="flex flex-wrap items-center justify-between gap-2 border-b border-primary-100/60 bg-primary-50/20 px-3 py-2 dark:border-white/10 dark:bg-white/[0.02]">
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-foreground" :title="team.teamLabel">{{ team.teamLabel }}</p>
                <p class="truncate text-[11px] text-muted" :title="team.membersSummary || 'No members assigned'">{{ team.membersSummary || 'No members assigned' }}</p>
                <p v-if="team.startTime || team.endTime" class="mt-0.5 text-[11px] font-medium text-muted">
                  {{ formatTimeRangeCompact(team.startTime, team.endTime) }}
                </p>
              </div>

              <div class="grid w-full grid-cols-3 gap-2 text-[11px] sm:w-auto">
                <div class="rounded-md border border-primary-100/70 bg-white/70 px-2 py-1 text-right dark:border-white/10 dark:bg-white/[0.03]">
                  <p class="uppercase tracking-wide text-[9px] text-muted">Planned</p>
                  <p class="font-semibold tabular-nums text-foreground">{{ team.totalPlannedMinutes }}m</p>
                </div>
                <div class="rounded-md border border-primary-100/70 bg-white/70 px-2 py-1 text-right dark:border-white/10 dark:bg-white/[0.03]">
                  <p class="uppercase tracking-wide text-[9px] text-muted">Actual</p>
                  <p class="font-semibold tabular-nums text-foreground">{{ team.totalActualMinutes }}m</p>
                </div>
                <div class="rounded-md border border-primary-100/70 bg-white/70 px-2 py-1 text-right dark:border-white/10 dark:bg-white/[0.03]">
                  <p class="uppercase tracking-wide text-[9px] text-muted">Diff</p>
                  <p class="font-semibold tabular-nums" :class="diffClass(team.totalDiffMinutes)">{{ formatDiffMinutes(team.totalDiffMinutes) }}</p>
                </div>
              </div>
            </header>

            <!-- Mobile task cards -->
            <div class="space-y-2 p-3 md:hidden">
              <div
                v-for="task in team.tasks"
                :key="taskKey(task)"
                class="rounded-lg border border-primary-100/50 bg-white/60 p-2.5 dark:border-white/10 dark:bg-black/10"
              >
                <p class="mb-2 text-xs font-semibold text-foreground">{{ task.taskLabel }}</p>
                <p v-if="task.plannedStartTime || task.plannedEndTime" class="mb-1.5 text-[11px] text-muted">
                  {{ formatTimeRangeCompact(task.plannedStartTime, task.plannedEndTime) }}
                </p>

                <div class="mb-2 flex flex-wrap items-end gap-4">
                  <div>
                    <p class="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">Planned</p>
                    <p class="text-xs font-semibold text-muted">{{ task.plannedMinutes }} min</p>
                  </div>
                  <div>
                    <p class="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">Actual</p>
                    <label class="flex items-center gap-1">
                      <input
                        :value="getActualInput(task)"
                        type="text"
                        inputmode="numeric"
                        class="w-14 rounded border border-primary-200/70 bg-white px-2 py-1 text-xs text-foreground focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-300 dark:border-white/15 dark:bg-black/20"
                        :disabled="isSavingDay"
                        @input="onActualInput(task, $event)"
                      >
                      <span class="text-[10px] text-muted">min</span>
                    </label>
                  </div>
                  <div>
                    <p class="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">Diff</p>
                    <p class="text-xs font-semibold" :class="diffClass(getTaskDiffMinutes(task))">
                      {{ formatDiffMinutes(getTaskDiffMinutes(task)) }}
                    </p>
                  </div>
                </div>

                <input
                  :value="getTaskNoteInput(task)"
                  type="text"
                  placeholder="Optional note"
                  class="w-full rounded border border-primary-200/70 bg-white px-2 py-1 text-xs text-foreground placeholder-muted/70 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-300 dark:border-white/15 dark:bg-black/20"
                  :disabled="isSavingDay"
                  @input="onTaskNoteInput(task, $event)"
                >
              </div>
            </div>

            <!-- Desktop task table -->
            <div class="hidden overflow-x-auto md:block">
              <div class="min-w-[840px]">
                <div class="grid grid-cols-[minmax(260px,1fr)_124px_88px_94px_88px_minmax(170px,1fr)] gap-2 border-b border-primary-100/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted dark:border-white/10">
                  <span>Task</span>
                    <span class="text-left">Time</span>
                    <span class="text-right">Planned</span>
                    <span class="text-right">Actual</span>
                    <span class="text-right">Diff</span>
                  <span>Note</span>
                </div>

                <div
                  v-for="task in team.tasks"
                  :key="taskKey(task)"
                  class="grid grid-cols-[minmax(260px,1fr)_124px_88px_94px_88px_minmax(170px,1fr)] items-center gap-2 border-b border-primary-100/30 px-3 py-1 text-[11px] dark:border-white/10"
                >
                  <p class="truncate font-medium text-foreground" :title="task.taskLabel">{{ task.taskLabel }}</p>

                  <p class="truncate whitespace-nowrap text-left font-medium tabular-nums text-[11px] text-muted">
                    <span v-if="task.plannedStartTime || task.plannedEndTime">{{ formatTimeRangeCompact(task.plannedStartTime, task.plannedEndTime) }}</span>
                    <span v-else class="text-muted/50">–</span>
                  </p>

                  <p class="text-right font-semibold tabular-nums text-muted">{{ task.plannedMinutes }}m</p>

                  <label class="flex items-center justify-end gap-1">
                    <input
                      :value="getActualInput(task)"
                      type="text"
                      inputmode="numeric"
                      class="w-14 rounded border border-primary-200/70 bg-white px-1.5 py-0.5 text-right text-[11px] tabular-nums text-foreground focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-300 dark:border-white/15 dark:bg-black/20"
                      :disabled="isSavingDay"
                      @input="onActualInput(task, $event)"
                    >
                    <span class="text-[10px] text-muted">min</span>
                  </label>

                  <p class="text-right font-semibold tabular-nums" :class="diffClass(getTaskDiffMinutes(task))">
                    {{ formatDiffMinutes(getTaskDiffMinutes(task)) }}
                  </p>

                  <input
                    :value="getTaskNoteInput(task)"
                    type="text"
                    placeholder="Optional note"
                    class="w-full rounded border border-primary-200/70 bg-white px-2 py-0.5 text-[11px] text-foreground placeholder-muted/70 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-300 dark:border-white/15 dark:bg-black/20"
                    :disabled="isSavingDay"
                    @input="onTaskNoteInput(task, $event)"
                  >
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useAuth } from '../../composables/useAuth'
import { useTeamHoursAdmin, type TeamHoursDayItem, type TeamHoursPublicationStatus, type TeamHoursTaskRow, type TeamHoursWeekDay } from '../../composables/useTeamHoursAdmin'

definePageMeta({
  name: 'admin-hours',
})

interface TaskDraftState {
  actual: string
  note: string
}

const { signOut } = useAuth()
const { getWeekTeamHours, getDayTeamHours, getDayTeamHoursPublicationState, seedDayTeamHoursFromPublishedPlan, saveDayTeamHours, publishDayTeamHours } = useTeamHoursAdmin()
const route = useRoute()
const router = useRouter()

const isFullscreenMode = computed(() => route.query.fullscreen === '1')

async function toggleFullscreen(): Promise<void> {
  const nextQuery: Record<string, string> = {}

  Object.entries(route.query).forEach(([key, value]) => {
    if (key === 'fullscreen' || value === undefined) {
      return
    }

    nextQuery[key] = Array.isArray(value) ? (value[0] ?? '') : String(value)
  })

  if (!isFullscreenMode.value) {
    nextQuery.fullscreen = '1'
  }

  await router.replace({ query: nextQuery })
}

const selectedDate = ref(todayIsoDate())
const weekOverview = ref<TeamHoursWeekDay[]>([])
const overviewError = ref('')

const isDayLoading = ref(false)
const dayError = ref('')
const saveSuccessMessage = ref('')
const dayTeams = ref<TeamHoursDayItem[]>([])
const dayTotalPlannedMinutes = ref(0)
const dayTotalActualMinutes = ref(0)
const dayTotalHours = ref(0)
const isSavingDay = ref(false)
const isPublishingDay = ref(false)
const taskDrafts = ref<Record<string, TaskDraftState>>({})
const hoursPublicationStatus = ref<TeamHoursPublicationStatus>('unsaved')
const lastSavedAt = ref<string | null>(null)
const lastPublishedAt = ref<string | null>(null)

const weekStart = computed(() => startOfWeekMonday(selectedDate.value))

const weekDays = computed(() => {
  const byDate = new Map(weekOverview.value.map((item) => [item.date, item]))

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDaysIso(weekStart.value, index)
    const day = byDate.get(date)
    const parsed = parseIsoDate(date)

    return {
      date,
      weekday: parsed.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: String(parsed.getDate()).padStart(2, '0'),
      dayLabel: parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      totalMinutes: day?.totalMinutes ?? 0,
      totalHours: day?.totalHours ?? 0,
      isHoliday: day?.isHoliday ?? false,
      holidayNames: day?.holidayNames ?? [],
    }
  })
})

const weeklyTotalMinutes = computed(() => weekDays.value.reduce((acc, day) => acc + day.totalMinutes, 0))
const weeklyTotalHours = computed(() => weeklyTotalMinutes.value / 60)
const selectedWeekDay = computed(() => weekDays.value.find((day) => day.date === selectedDate.value) ?? null)
const selectedDaySummaryClass = computed(() => {
  if (selectedWeekDay.value?.isHoliday) {
    return 'border-warning/35 bg-warning/10 dark:border-warning/30 dark:bg-warning/10'
  }

  return 'border-primary-100 bg-surface/80 dark:border-white/10 dark:bg-white/5'
})

const selectedDaySummaryBadgeClass = computed(() => {
  if (selectedWeekDay.value?.date === selectedDate.value) {
    return 'bg-warning text-white shadow-sm'
  }

  return 'bg-warning/15 text-warning'
})

const weekLabel = computed(() => {
  const start = parseIsoDate(weekStart.value)
  return start.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
})

const weekRangeLabel = computed(() => {
  const start = parseIsoDate(weekStart.value)
  const end = addDaysIso(weekStart.value, 6)
  const endDate = parseIsoDate(end)

  const startLabel = start.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  })
  const endLabel = endDate.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return `${startLabel} - ${endLabel}`
})

const dayLabel = computed(() => {
  const date = parseIsoDate(selectedDate.value)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
})

const hasUnsavedChanges = computed(() => dayTeams.value.some((team) => team.tasks.some((task) => isTaskDirty(task))))

const hoursStatusText = computed(() => {
  if (hoursPublicationStatus.value === 'published') {
    return lastPublishedAt.value
      ? `Published ${formatDateTimeLabel(lastPublishedAt.value)}.`
      : 'Published.'
  }

  if (hoursPublicationStatus.value === 'draft') {
    if (hasUnsavedChanges.value) {
      return 'There are unsaved changes. Save draft or publish to update the summary.'
    }

    return lastSavedAt.value
      ? `Draft saved ${formatDateTimeLabel(lastSavedAt.value)}.`
      : 'Draft saved.'
  }

  return 'No saved hours for this day yet.'
})

const hoursStatusClass = computed(() => {
  if (hoursPublicationStatus.value === 'published') {
    return 'text-success/90'
  }

  if (hoursPublicationStatus.value === 'draft' || hasUnsavedChanges.value) {
    return 'text-warning/90'
  }

  return 'text-muted'
})

watch(weekStart, async () => {
  await loadWeekOverview()
})

watch(
  () => selectedDate.value,
  async () => {
    await loadDayTeams()
  },
)

onMounted(async () => {
  await loadWeekOverview()
  await loadDayTeams()
})

async function loadWeekOverview(): Promise<void> {
  overviewError.value = ''

  try {
    weekOverview.value = await getWeekTeamHours(weekStart.value)
  } catch (err) {
    overviewError.value = err instanceof Error ? err.message : 'Failed to load team weekly overview.'
    weekOverview.value = []
  }
}

async function loadDayTeams(): Promise<void> {
  await loadDayTeamsWithOptions({ showLoading: true })
}

async function loadDayTeamsWithOptions(options: { showLoading: boolean }): Promise<void> {
  if (options.showLoading) {
    isDayLoading.value = true
  }
  dayError.value = ''
  saveSuccessMessage.value = ''

  try {
    await seedDayTeamHoursFromPublishedPlan(selectedDate.value)
    const [result, publicationState] = await Promise.all([
      getDayTeamHours(selectedDate.value),
      getDayTeamHoursPublicationState(selectedDate.value),
    ])
    dayTeams.value = result.teams
    dayTotalPlannedMinutes.value = result.totalPlannedMinutes
    dayTotalActualMinutes.value = result.totalActualMinutes
    dayTotalHours.value = result.totalHours
    hoursPublicationStatus.value = publicationState.status
    lastSavedAt.value = publicationState.lastSavedAt
    lastPublishedAt.value = publicationState.lastPublishedAt

    const drafts: Record<string, TaskDraftState> = {}

    for (const team of result.teams) {
      for (const task of team.tasks) {
        drafts[taskKey(task)] = {
          actual: String(task.entry.actual_minutes),
          note: task.entry.note ?? '',
        }
      }
    }

    taskDrafts.value = drafts
    syncSelectedDayWeekOverview()
  } catch (err) {
    dayError.value = err instanceof Error ? err.message : 'Failed to load team day entries.'
    dayTeams.value = []
    dayTotalPlannedMinutes.value = 0
    dayTotalActualMinutes.value = 0
    dayTotalHours.value = 0
    hoursPublicationStatus.value = 'unsaved'
    lastSavedAt.value = null
    lastPublishedAt.value = null
  } finally {
    if (options.showLoading) {
      isDayLoading.value = false
    }
  }
}

function syncSelectedDayWeekOverview(): void {
  const totalMinutes = dayTotalActualMinutes.value
  const totalHours = totalMinutes / 60

  const existingIndex = weekOverview.value.findIndex((day) => day.date === selectedDate.value)

  if (existingIndex === -1) {
    return
  }

  weekOverview.value = weekOverview.value.map((day) => {
    if (day.date !== selectedDate.value) {
      return day
    }

    return {
      ...day,
      totalMinutes,
      totalHours,
    }
  })
}

function formatTimeRangeCompact(start: string | null, end: string | null): string {
  if (!start && !end) {
    return '–'
  }

  const formattedStart = start ? formatHourMinute(start) : '–'
  const formattedEnd = end ? formatHourMinute(end) : '–'
  return `${formattedStart} → ${formattedEnd}`
}

function dayCardClass(day: { date: string; isHoliday: boolean }): string {
  if (day.date === selectedDate.value && day.isHoliday) {
    return 'border-warning bg-warning text-white shadow-sm ring-1 ring-warning/35'
  }

  if (day.date === selectedDate.value) {
    return 'border-primary-500 bg-primary-500 text-white shadow-sm'
  }

  if (day.isHoliday) {
    return 'border-warning/35 bg-warning/10 shadow-sm hover:border-warning/60 dark:border-warning/30 dark:bg-warning/10 dark:hover:border-warning/50'
  }

  return 'border-primary-100/70 bg-white/70 hover:border-primary-300 dark:border-white/10 dark:bg-white/[0.01] dark:hover:border-white/25'
}

function dayWeekdayClass(day: { date: string; isHoliday: boolean }): string {
  if (day.date === selectedDate.value) {
    return 'text-white/85'
  }

  if (day.isHoliday) {
    return 'text-warning'
  }

  return 'text-muted'
}

function dayNumberClass(day: { date: string }): string {
  if (day.date === selectedDate.value) {
    return 'text-white'
  }

  return 'text-foreground'
}

function dayMetaClass(day: { date: string; isHoliday: boolean }): string {
  if (day.date === selectedDate.value) {
    return 'text-white/80'
  }

  if (day.isHoliday) {
    return 'text-warning/90'
  }

  return 'text-muted'
}

function dayHolidayBadgeClass(day: { date: string }): string {
  if (day.date === selectedDate.value) {
    return 'bg-white/20 text-white'
  }

  return 'bg-warning/15 text-warning'
}

function formatHourMinute(value: string): string {
  const hhmm = value.match(/^(\d{1,2}):(\d{2})/)
  if (!hhmm) {
    return value
  }

  const hour = String(Number(hhmm[1] ?? '0')).padStart(2, '0')
  const minute = hhmm[2] ?? '00'
  return `${hour}:${minute}`
}

function getChangedTasks(): TeamHoursTaskRow[] {
  return dayTeams.value
    .flatMap((team) => team.tasks)
    .filter((task) => isTaskDirty(task))
}

function taskKey(task: TeamHoursTaskRow): string {
  return task.entry.id || `${task.routeStopId}::${task.dailyTaskId}`
}

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

function getActualInput(task: TeamHoursTaskRow): string {
  return taskDrafts.value[taskKey(task)]?.actual ?? String(task.entry.actual_minutes)
}

function getTaskNoteInput(task: TeamHoursTaskRow): string {
  return taskDrafts.value[taskKey(task)]?.note ?? (task.entry.note ?? '')
}

function onActualInput(task: TeamHoursTaskRow, event: Event): void {
  const key = taskKey(task)
  const target = event.target as HTMLInputElement
  taskDrafts.value = {
    ...taskDrafts.value,
    [key]: {
      actual: target.value,
      note: getTaskNoteInput(task),
    },
  }
}

function onTaskNoteInput(task: TeamHoursTaskRow, event: Event): void {
  const key = taskKey(task)
  const target = event.target as HTMLInputElement
  taskDrafts.value = {
    ...taskDrafts.value,
    [key]: {
      actual: getActualInput(task),
      note: target.value,
    },
  }
}

function isTaskDirty(task: TeamHoursTaskRow): boolean {
  const nextActual = parseMinutes(getActualInput(task))
  const nextNote = normalizeNote(getTaskNoteInput(task)) || null

  return nextActual !== task.entry.actual_minutes || nextNote !== (task.entry.note ?? null)
}

function getTaskDiffMinutes(task: TeamHoursTaskRow): number {
  return parseMinutes(getActualInput(task)) - task.plannedMinutes
}

function formatDiffMinutes(value: number): string {
  if (value > 0) {
    return `+${value} min`
  }

  if (value < 0) {
    return `${value} min`
  }

  return '0 min'
}

function diffClass(value: number): string {
  if (value > 0) {
    return 'text-success'
  }

  if (value < 0) {
    return 'text-warning'
  }

  return 'text-muted'
}

async function onSaveChanges(): Promise<void> {
  if (isSavingDay.value || !hasUnsavedChanges.value) {
    return
  }

  const changedTasks = getChangedTasks()

  isSavingDay.value = true
  dayError.value = ''
  saveSuccessMessage.value = ''

  try {
    const result = await saveDayTeamHours(
      selectedDate.value,
      changedTasks.map((task) => ({
        id: task.entry.id || undefined,
        work_date: selectedDate.value,
        route_group_id: task.entry.route_group_id,
        route_stop_id: task.entry.route_stop_id,
        daily_task_id: task.entry.daily_task_id,
        planned_minutes: task.plannedMinutes,
        actual_minutes: parseMinutes(getActualInput(task)),
        note: normalizeNote(getTaskNoteInput(task)) || null,
      })),
    )

    await loadDayTeamsWithOptions({ showLoading: false })
    saveSuccessMessage.value = `${result.updatedCount + result.insertedCount} task row(s) saved as draft.`
  } catch (err) {
    dayError.value = err instanceof Error ? err.message : 'Failed to save day changes.'
  } finally {
    isSavingDay.value = false
  }
}

async function onPublishChanges(): Promise<void> {
  if (isSavingDay.value || isPublishingDay.value || dayTeams.value.length === 0) {
    return
  }

  isPublishingDay.value = true
  dayError.value = ''
  saveSuccessMessage.value = ''

  try {
    const changedTasks = getChangedTasks()

    if (changedTasks.length > 0) {
      await saveDayTeamHours(
        selectedDate.value,
        changedTasks.map((task) => ({
          id: task.entry.id || undefined,
          work_date: selectedDate.value,
          route_group_id: task.entry.route_group_id,
          route_stop_id: task.entry.route_stop_id,
          daily_task_id: task.entry.daily_task_id,
          planned_minutes: task.plannedMinutes,
          actual_minutes: parseMinutes(getActualInput(task)),
          note: normalizeNote(getTaskNoteInput(task)) || null,
        })),
      )
    }

    const result = await publishDayTeamHours(selectedDate.value)
    await loadDayTeamsWithOptions({ showLoading: false })
    saveSuccessMessage.value = `${result.publishedCount} task row(s) published to summary.`
  } catch (err) {
    dayError.value = err instanceof Error ? err.message : 'Failed to publish day hours.'
  } finally {
    isPublishingDay.value = false
  }
}

function goToPreviousWeek(): void {
  selectedDate.value = addDaysIso(selectedDate.value, -7)
}

function goToNextWeek(): void {
  selectedDate.value = addDaysIso(selectedDate.value, 7)
}

function goToToday(): void {
  selectedDate.value = todayIsoDate()
}

function parseIsoDate(value: string): Date {
  return new Date(`${value}T00:00:00`)
}

function toIsoDate(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDaysIso(value: string, days: number): string {
  const date = parseIsoDate(value)
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

function startOfWeekMonday(value: string): string {
  const date = parseIsoDate(value)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return toIsoDate(date)
}

function formatDateTimeLabel(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  const day = date.getDate()
  const month = date.toLocaleString('en-AU', { month: 'short' })
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${day} ${month} · ${hours}:${minutes}`
}

function todayIsoDate(): string {
  return toIsoDate(new Date())
}

async function onSignOut(): Promise<void> {
  await signOut()
  await navigateTo('/login')
}
</script>
