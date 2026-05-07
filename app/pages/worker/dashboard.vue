<template>
  <NuxtLayout name="worker-layout" @signout="onSignOut">
    <section class="space-y-4">
      <header class="space-y-1">
        <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-600">Worker</p>
        <h2 class="text-xl font-semibold text-foreground sm:text-2xl">Dashboard</h2>
        <p class="text-sm text-muted">Overview of your productivity and estimated earnings.</p>
      </header>

      <div class="flex items-center gap-2 rounded-2xl border border-primary-100/80 bg-surface/90 p-2 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
        <button
          v-for="option in filterOptions"
          :key="option.value"
          type="button"
          class="flex-1 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wide transition"
          :class="selectedFilter === option.value
            ? 'bg-primary-500 text-white shadow-sm'
            : 'text-muted hover:bg-primary-500/10 hover:text-foreground'"
          @click="selectedFilter = option.value"
        >
          {{ option.label }}
        </button>
      </div>

      <div class="rounded-2xl border border-primary-100/80 bg-surface/90 p-2.5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
        <div class="mx-auto grid w-full max-w-sm grid-cols-[2.25rem_1fr_2.25rem] items-center gap-2">
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary-200/80 text-sm font-semibold text-primary-700 transition hover:bg-primary-500/10 dark:border-white/10 dark:text-primary-300 dark:hover:bg-white/10"
            aria-label="Previous period"
            @click="goToPreviousPeriod"
          >
            &lt;
          </button>

          <p class="text-center text-sm font-semibold tracking-tight text-foreground">{{ rangeLabel }}</p>

          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary-200/80 text-sm font-semibold text-primary-700 transition hover:bg-primary-500/10 dark:border-white/10 dark:text-primary-300 dark:hover:bg-white/10"
            aria-label="Next period"
            @click="goToNextPeriod"
          >
            &gt;
          </button>
        </div>

        <div class="mt-2 flex justify-center">
          <button
            type="button"
            class="inline-flex items-center rounded-full border border-primary-200/80 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary-700 transition hover:bg-primary-500/10 dark:border-white/10 dark:bg-white/[0.03] dark:text-primary-300 dark:hover:bg-white/10"
            @click="resetToCurrentPeriod"
          >
            {{ resetPeriodLabel }}
          </button>
        </div>
      </div>

      <div v-if="isLoading" class="grid grid-cols-2 gap-2 sm:grid-cols-2 xl:grid-cols-4 xl:gap-3">
        <div class="h-24 animate-pulse rounded-xl bg-primary-100/70 dark:bg-white/10" />
        <div class="h-24 animate-pulse rounded-xl bg-primary-100/70 dark:bg-white/10" />
        <div class="h-24 animate-pulse rounded-xl bg-primary-100/70 dark:bg-white/10" />
        <div class="h-24 animate-pulse rounded-xl bg-primary-100/70 dark:bg-white/10" />
      </div>

      <BaseFeedbackBanner
        v-else-if="loadError"
        tone="error"
        title="Dashboard unavailable"
        :message="loadError"
        floating
      />

      <section v-else class="grid grid-cols-2 gap-2 sm:grid-cols-2 xl:grid-cols-4 xl:gap-3">
        <WorkerKpiCard
          label="Total hours"
          :value="formatHours(summary.totalHours)"
          subtitle="Worked in period"
        />

        <WorkerKpiCard
          label="Estimated earnings"
          :value="formatCurrency(summary.estimatedEarnings)"
          subtitle="Based on saved entries"
        />

        <WorkerKpiCard
          label="Worked days"
          :value="String(summary.workedDays)"
          subtitle="Days with worked time"
        />

        <WorkerKpiCard
          label="Average hours/day"
          :value="formatHours(summary.averageHoursPerDay)"
          subtitle="Only worked days"
        />
      </section>
    </section>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import BaseFeedbackBanner from '../../components/ui/BaseFeedbackBanner.vue'
import WorkerKpiCard from '../../components/features/worker/WorkerKpiCard.vue'
import { useAuth } from '../../composables/useAuth'
import { useDataCache } from '../../composables/useDataCache'
import { useSupabaseClient } from '../../composables/useSupabaseClient'
import { useWorkerProfileSettings } from '../../composables/useWorkerProfileSettings'

definePageMeta({
  name: 'worker-dashboard',
})

type DashboardFilter = 'week' | 'month' | 'year'

interface WorkerTimesheetEntryRow {
  work_date: string
  worked_hours: number | null
  estimated_pay: number | null
  applied_hourly_rate: number | null
  applied_rate_type: 'weekday' | 'sunday' | 'holiday' | null
}

interface WorkerDashboardSummary {
  totalHours: number
  estimatedEarnings: number
  workedDays: number
  averageHoursPerDay: number
}

const filterOptions: Array<{ label: string, value: DashboardFilter }> = [
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
]

const { signOut, getCurrentUser } = useAuth()
const { getSettings } = useWorkerProfileSettings()
const { getCached, setCached } = useDataCache()
const supabase = useSupabaseClient()

const selectedFilter = ref<DashboardFilter>('week')
const periodCursor = ref(new Date())
const isLoading = ref(false)
const loadError = ref('')
const employeeId = ref('')
const summary = ref<WorkerDashboardSummary>({
  totalHours: 0,
  estimatedEarnings: 0,
  workedDays: 0,
  averageHoursPerDay: 0,
})

const selectedPeriodRange = computed(() => {
  const cursor = new Date(periodCursor.value)

  if (selectedFilter.value === 'year') {
    const year = cursor.getFullYear()
    return {
      from: `${year}-01-01`,
      to: `${year}-12-31`,
      label: String(year),
    }
  }

  if (selectedFilter.value === 'month') {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const first = new Date(year, month, 1)
    const last = new Date(year, month + 1, 0)

    return {
      from: toIsoDate(first),
      to: toIsoDate(last),
      label: first.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' }),
    }
  }

  const monday = startOfWeek(cursor)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  return {
    from: toIsoDate(monday),
    to: toIsoDate(sunday),
    label: `${monday.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} - ${sunday.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`,
  }
})

const rangeLabel = computed(() => selectedPeriodRange.value.label)
const resetPeriodLabel = computed(() => {
  if (selectedFilter.value === 'month') {
    return 'This month'
  }

  if (selectedFilter.value === 'year') {
    return 'This year'
  }

  return 'This week'
})

watch(selectedFilter, () => {
  periodCursor.value = new Date()
  void loadDashboardSummary()
})

onMounted(async () => {
  await resolveEmployeeId()
  await loadDashboardSummary()
})

async function resolveEmployeeId(): Promise<void> {
  if (employeeId.value) {
    return
  }

  const user = await getCurrentUser()

  const { data, error } = await supabase
    .from('employees')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle<{ id: string }>()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error('No employee record found for current user.')
  }

  employeeId.value = data.id
}

async function loadDashboardSummary(): Promise<void> {
  isLoading.value = true
  loadError.value = ''

  try {
    if (!employeeId.value) {
      await resolveEmployeeId()
    }

    const { from, to } = selectedPeriodRange.value
    const cacheKey = `worker-dashboard:${employeeId.value}:${selectedFilter.value}:${from}:${to}`
    const cached = getCached<WorkerDashboardSummary>(cacheKey)

    if (cached) {
      summary.value = cached
      return
    }

    const [settings, entriesResult] = await Promise.all([
      getSettings(),
      supabase
        .from('worker_timesheet_entries')
        .select('work_date, worked_hours, estimated_pay, applied_hourly_rate, applied_rate_type')
        .eq('employee_id', employeeId.value)
        .gte('work_date', from)
        .lte('work_date', to),
    ])

    if (entriesResult.error) {
      throw new Error(entriesResult.error.message)
    }

    const rows = (entriesResult.data ?? []) as WorkerTimesheetEntryRow[]

    let totalHours = 0
    let estimatedEarnings = 0
    const workedDates = new Set<string>()

    for (const row of rows) {
      const workedHours = Number.isFinite(row.worked_hours) ? Number(row.worked_hours) : 0
      if (workedHours <= 0) {
        continue
      }

      totalHours += workedHours
      workedDates.add(row.work_date)

      if (Number.isFinite(row.estimated_pay)) {
        estimatedEarnings += Number(row.estimated_pay)
        continue
      }

      const fallbackRate = Number.isFinite(row.applied_hourly_rate)
        ? Number(row.applied_hourly_rate)
        : getRateByType(settings, row.applied_rate_type)

      estimatedEarnings += workedHours * fallbackRate
    }

    const workedDays = workedDates.size
    const averageHoursPerDay = workedDays > 0 ? totalHours / workedDays : 0

    const computedSummary: WorkerDashboardSummary = {
      totalHours: round2(totalHours),
      estimatedEarnings: round2(estimatedEarnings),
      workedDays,
      averageHoursPerDay: round2(averageHoursPerDay),
    }

    summary.value = computedSummary
    setCached(cacheKey, computedSummary, 5 * 60 * 1000)
  } catch (error: unknown) {
    loadError.value = error instanceof Error ? error.message : 'Failed to load dashboard summary.'
  } finally {
    isLoading.value = false
  }
}

function getRateByType(
  settings: Awaited<ReturnType<typeof getSettings>>,
  rateType: WorkerTimesheetEntryRow['applied_rate_type'],
): number {
  if (rateType === 'holiday') {
    return Number(settings.hourly_rate_holiday_override || 0)
  }

  if (rateType === 'sunday') {
    return Number(settings.hourly_rate_sunday_override || 0)
  }

  return Number(settings.hourly_rate_weekday_override || 0)
}

function startOfWeek(date: Date): Date {
  const value = new Date(date)
  const day = value.getDay()
  const diff = day === 0 ? -6 : 1 - day
  value.setDate(value.getDate() + diff)
  value.setHours(0, 0, 0, 0)
  return value
}

function goToPreviousPeriod(): void {
  const cursor = new Date(periodCursor.value)

  if (selectedFilter.value === 'week') {
    cursor.setDate(cursor.getDate() - 7)
  } else if (selectedFilter.value === 'month') {
    cursor.setMonth(cursor.getMonth() - 1)
  } else {
    cursor.setFullYear(cursor.getFullYear() - 1)
  }

  periodCursor.value = cursor
  void loadDashboardSummary()
}

function goToNextPeriod(): void {
  const cursor = new Date(periodCursor.value)

  if (selectedFilter.value === 'week') {
    cursor.setDate(cursor.getDate() + 7)
  } else if (selectedFilter.value === 'month') {
    cursor.setMonth(cursor.getMonth() + 1)
  } else {
    cursor.setFullYear(cursor.getFullYear() + 1)
  }

  periodCursor.value = cursor
  void loadDashboardSummary()
}

function resetToCurrentPeriod(): void {
  periodCursor.value = new Date()
  void loadDashboardSummary()
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function round2(value: number): number {
  return Number(value.toFixed(2))
}

function formatHours(value: number): string {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0
  return `${safeValue.toFixed(2)}h`
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0)
}

async function onSignOut(): Promise<void> {
  await signOut()
  await navigateTo('/login')
}
</script>
