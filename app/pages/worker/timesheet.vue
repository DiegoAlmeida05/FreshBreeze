<template>
  <NuxtLayout name="worker-layout" @signout="onSignOut">
    <section class="space-y-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-primary-600">Worker</p>
        <h2 class="mt-1 text-2xl font-semibold text-foreground">Timesheet</h2>
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

      <WorkerWeekNavigator
        v-model="selectedDate"
        :label="weekRangeLabel"
        @shift-week="shiftWeek"
        @go-today="goToCurrentWeek"
      />

      <section class="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
        <div class="min-h-[76px] rounded-xl border border-primary-100 bg-surface px-2.5 py-2 dark:border-white/10 dark:bg-white/[0.03]">
          <p class="text-[11px] text-muted">Task hours</p>
          <p class="mt-1 text-base font-semibold text-foreground">{{ summary.total_task_hours.toFixed(2) }}h</p>
        </div>

        <div class="min-h-[76px] rounded-xl border border-primary-100 bg-surface px-2.5 py-2 dark:border-white/10 dark:bg-white/[0.03]">
          <p class="text-[11px] text-muted">Worked hours</p>
          <p class="mt-1 text-base font-semibold text-foreground">{{ summary.total_worked_hours.toFixed(2) }}h</p>
        </div>

        <div class="min-h-[76px] rounded-xl border border-primary-100 bg-surface px-2.5 py-2 dark:border-white/10 dark:bg-white/[0.03]">
          <p class="text-[11px] text-muted">Extra hours</p>
          <p class="mt-1 text-base font-semibold text-foreground">{{ summary.total_extra_hours.toFixed(2) }}h</p>
        </div>

        <div class="min-h-[76px] rounded-xl border border-success/30 bg-success/10 px-2.5 py-2 dark:border-success/30 dark:bg-success/10">
          <p class="text-[11px] text-success">Estimated pay</p>
          <p class="mt-1 text-base font-semibold text-success">{{ toCurrency(summary.estimated_weekly_pay) }}</p>
        </div>
      </section>

      <section class="space-y-3">
        <article
          v-for="day in days"
          :key="day.date"
          class="overflow-hidden rounded-xl border border-border bg-surface p-3 dark:bg-white/[0.03]"
        >
          <div class="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-foreground">{{ formatDayLabel(day.date) }}</p>
              <p class="text-xs" :class="day.is_holiday ? 'text-warning font-medium' : 'text-muted'">
                {{ rateTypeLabel(day.applied_rate_type) }} · {{ toCurrency(day.hourly_rate) }}/h
              </p>
            </div>
            <p class="self-start rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700 dark:bg-white/10 dark:text-white sm:self-auto">
              Task: {{ day.source_task_hours.toFixed(2) }}h
            </p>
          </div>

          <div class="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
            <label class="block min-w-0 text-xs text-muted">
              Start
              <input v-model="day.start_time" type="time" class="input-base mt-1 !w-full !min-w-0 !max-w-full !py-1.5 text-xs" @change="recomputeDay(day)">
            </label>

            <label class="block min-w-0 text-xs text-muted">
              End
              <input v-model="day.end_time" type="time" class="input-base mt-1 !w-full !min-w-0 !max-w-full !py-1.5 text-xs" @change="recomputeDay(day)">
            </label>

            <label class="block min-w-0 text-xs text-muted">
              Extra hours
              <input v-model.number="day.extra_hours" type="text" inputmode="decimal" class="input-base mt-1 !w-full !min-w-0 !max-w-full !py-1.5 text-xs" @input="recomputeDay(day)">
            </label>

            <div class="min-w-0 w-full rounded-lg border border-primary-100 bg-primary-50/60 px-2.5 py-2 text-xs dark:border-white/10 dark:bg-white/[0.02]">
              <p class="text-muted">Worked</p>
              <p class="mt-1 font-semibold text-foreground">{{ day.worked_hours.toFixed(2) }}h</p>
            </div>

            <div class="min-w-0 w-full rounded-lg border border-success/20 bg-success/10 px-2.5 py-2 text-xs">
              <p class="text-success">Estimated pay</p>
              <p class="mt-1 font-semibold text-success">{{ toCurrency(day.estimated_daily_pay) }}</p>
            </div>
          </div>

          <div class="mt-3 flex justify-end">
            <button type="button" class="btn-outline w-full !px-3 !py-1.5 text-xs sm:w-auto" :disabled="isSaving" @click="saveDay(day)">
              {{ isSaving ? 'Saving...' : 'Save day' }}
            </button>
          </div>
        </article>
      </section>
    </section>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import BaseFeedbackBanner from '../../components/ui/BaseFeedbackBanner.vue'
import WorkerWeekNavigator from '../../components/features/worker/WorkerWeekNavigator.vue'
import { useAuth } from '../../composables/useAuth'
import { useWorkerProfileSettings } from '../../composables/useWorkerProfileSettings'
import { useWorkerTimesheet } from '../../composables/useWorkerTimesheet'
import type { WorkerTimesheetDay, WorkerTimesheetSummary } from '../../composables/useWorkerTimesheet'
import type { WorkerProfileSettings } from '../../composables/useWorkerProfileSettings'

definePageMeta({
  name: 'worker-timesheet',
})

type FeedbackTone = 'success' | 'error' | 'warning' | 'info'

const { signOut } = useAuth()
const { getSettings } = useWorkerProfileSettings()
const { getWeekTimesheet, saveDayEntry } = useWorkerTimesheet()

const selectedDate = ref(todayIsoDate())
const days = ref<WorkerTimesheetDay[]>([])
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

onMounted(async () => {
  await loadWeek()
})

watch(selectedDate, () => {
  void loadWeek()
})

async function loadWeek(): Promise<void> {
  try {
    clearFeedback()
    const settings = await getSettings()
    currentSettings.value = settings
    const week = await getWeekTimesheet(selectedDate.value, settings)
    days.value = week.days
    summary.value = week.summary
  } catch (error: unknown) {
    setFeedback('error', 'Timesheet unavailable', error instanceof Error ? error.message : 'Failed to load timesheet data.')
  }
}

function recomputeDay(day: WorkerTimesheetDay): void {
  const [startHourRaw, startMinRaw] = day.start_time.split(':')
  const [endHourRaw, endMinRaw] = day.end_time.split(':')

  const startHour = Number(startHourRaw ?? NaN)
  const startMin = Number(startMinRaw ?? NaN)
  const endHour = Number(endHourRaw ?? NaN)
  const endMin = Number(endMinRaw ?? NaN)

  const hasStart = Number.isFinite(startHour) && Number.isFinite(startMin)
  const hasEnd = Number.isFinite(endHour) && Number.isFinite(endMin)

  const startMinutes = hasStart ? (startHour * 60) + startMin : 0
  const endMinutes = hasEnd ? (endHour * 60) + endMin : 0

  const baseHours = hasStart && hasEnd && endMinutes > startMinutes
    ? (endMinutes - startMinutes) / 60
    : 0

  const extraHours = Number.isFinite(day.extra_hours) ? Math.max(0, Number(day.extra_hours)) : 0
  const rateType = getRateTypeForDate(day.date, day.is_holiday)
  const hourlyRate = getHourlyRateForDay(rateType)

  day.extra_hours = Number(extraHours.toFixed(2))
  day.worked_hours = Number((baseHours + extraHours).toFixed(2))
  day.applied_hourly_rate = Number(hourlyRate.toFixed(2))
  day.applied_rate_type = rateType
  day.estimated_pay = Number((day.worked_hours * day.applied_hourly_rate).toFixed(2))
  day.hourly_rate = day.applied_hourly_rate
  day.estimated_daily_pay = Number((day.worked_hours * day.hourly_rate).toFixed(2))

  summary.value = {
    total_task_hours: Number(days.value.reduce((sum, item) => sum + item.source_task_hours, 0).toFixed(2)),
    total_worked_hours: Number(days.value.reduce((sum, item) => sum + item.worked_hours, 0).toFixed(2)),
    total_extra_hours: Number(days.value.reduce((sum, item) => sum + item.extra_hours, 0).toFixed(2)),
    estimated_weekly_pay: Number(days.value.reduce((sum, item) => sum + item.estimated_daily_pay, 0).toFixed(2)),
  }
}

async function saveDay(day: WorkerTimesheetDay): Promise<void> {
  try {
    isSaving.value = true
    recomputeDay(day)
    await saveDayEntry(day)
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
  void loadWeek()
}

function goToCurrentWeek(): void {
  selectedDate.value = todayIsoDate()
  void loadWeek()
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
</script>
