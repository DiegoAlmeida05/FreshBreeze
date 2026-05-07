<template>
  <NuxtLayout name="admin-layout" @signout="onSignOut">
    <template #topbar-title>
      <h1 class="text-base font-semibold text-foreground">Dashboard</h1>
    </template>

    <section class="space-y-5 sm:space-y-6">
      <header class="space-y-1.5">
        <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-600">Admin</p>
        <h2 class="text-xl font-semibold text-foreground sm:text-2xl">Operational Overview</h2>
        <p class="text-sm text-muted">Estimated high-level performance for the selected period.</p>
      </header>

      <AdminPeriodFilter
        :selected-filter="selectedFilter"
        :range-label="rangeLabel"
        :current-label="resetPeriodLabel"
        :disabled="isLoading"
        @update:filter="onFilterChange"
        @previous="goToPreviousPeriod"
        @next="goToNextPeriod"
        @current="resetToCurrentPeriod"
      />

      <div v-if="isLoading && !summary" class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <div
          v-for="placeholder in 5"
          :key="placeholder"
          class="h-36 animate-pulse rounded-2xl border border-primary-100/70 bg-gradient-to-br from-primary-100/60 via-white/60 to-primary-warm-100/45 dark:border-white/10 dark:bg-white/10"
        />
      </div>

      <BaseFeedbackBanner
        v-else-if="loadError"
        tone="error"
        title="Dashboard unavailable"
        :message="loadError"
      />

      <div v-else-if="summary" class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <AdminKpiCard
          title="Total Properties"
          :value="String(summary.kpis.totalProperties)"
          subtitle="Active where available"
          :meta="`Period ${rangeLabel}`"
          icon="properties"
          clickable
          :active="activeSection === 'properties'"
          @select="activeSection = 'properties'"
        />

        <AdminKpiCard
          title="Total Employees"
          :value="String(summary.kpis.totalEmployees)"
          :subtitle="`${summary.kpis.activeWorkers} workers • ${summary.kpis.activeAdmins} admins`"
          :meta="`${summary.kpis.activeWorkers} active workers`"
          icon="employees"
          clickable
          :active="activeSection === 'employees'"
          @select="activeSection = 'employees'"
        />

        <AdminKpiCard
          title="Total Clients"
          :value="String(summary.kpis.totalClients)"
          subtitle="Active where available"
          :meta="`Scheduled by period`"
          icon="clients"
          clickable
          :active="activeSection === 'clients'"
          @select="activeSection = 'clients'"
        />

        <AdminKpiCard
          title="Planned vs Worked %"
          :value="`${summary.kpis.plannedVsWorkedPct.toFixed(1)}%`"
          :subtitle="`${summary.kpis.plannedHours.toFixed(2)}h planned • ${summary.kpis.workedHours.toFixed(2)}h worked`"
          tone="info"
          :meta="summary.kpis.plannedVsWorkedPct >= 100 ? 'Ahead of plan' : 'Below planned target'"
          icon="planning"
          clickable
          :active="activeSection === 'plannedWorked'"
          @select="activeSection = 'plannedWorked'"
        >
          <template #footer>
            <AdminSimpleProgressBar
              :value="summary.kpis.plannedVsWorkedPct"
              :max="100"
              label="Completion"
              :detail="`${summary.kpis.workedHours.toFixed(2)}h of ${summary.kpis.plannedHours.toFixed(2)}h`"
            />
          </template>
        </AdminKpiCard>

        <AdminKpiCard
          title="Financial Summary"
          :value="formatCurrency(summary.kpis.estimatedMargin)"
          subtitle="Estimated margin"
          tone="success"
          :meta="summary.kpis.revenueSource === 'invoice_snapshot' ? 'From published snapshots' : 'Fallback estimate source'"
          icon="financial"
          clickable
          :active="activeSection === 'financial'"
          @select="activeSection = 'financial'"
        >
          <template #footer>
            <p class="text-[10px] font-medium text-muted">
              Revenue {{ formatCurrency(summary.kpis.estimatedRevenue) }} • Cost {{ formatCurrency(summary.kpis.estimatedLaborCost) }}
            </p>
          </template>
        </AdminKpiCard>
      </div>

      <div v-if="summary" class="space-y-4">
        <AdminDashboardSection
          title="Property Activity"
          description="Top properties by scheduled tasks in selected period"
          :is-open="activeSection === 'properties'"
          @toggle="toggleSection('properties')"
        >
          <div v-if="summary.sections.propertyActivity.length === 0" class="rounded-xl border border-dashed border-primary-200/70 bg-surface p-6 text-center">
            <div class="mx-auto mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-100/70 text-primary-700 dark:bg-white/10 dark:text-primary-300">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4.5 w-4.5">
                <path d="m3 10 9-7 9 7" />
                <path d="M5 9.5V20h14V9.5" />
              </svg>
            </div>
            <p class="text-sm text-muted">No property activity found in this period.</p>
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full min-w-[460px] text-sm">
              <thead>
                <tr class="border-b border-primary-100/80 text-left text-[11px] uppercase tracking-wide text-muted dark:border-white/10">
                  <th class="px-2 py-2">Property</th>
                  <th class="px-2 py-2">Tasks</th>
                  <th class="px-2 py-2">Planned Hours</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in summary.sections.propertyActivity" :key="item.propertyId" class="border-b border-primary-100/50 text-foreground dark:border-white/5">
                  <td class="px-2 py-2">{{ item.name }}</td>
                  <td class="px-2 py-2">{{ item.taskCount }}</td>
                  <td class="px-2 py-2">{{ item.plannedHours.toFixed(2) }}h</td>
                </tr>
              </tbody>
            </table>
          </div>
        </AdminDashboardSection>

        <AdminDashboardSection
          title="Worker Hours"
          description="Worked hours and estimated labor cost"
          :is-open="activeSection === 'employees'"
          @toggle="toggleSection('employees')"
        >
          <div v-if="summary.sections.employeeHours.length === 0" class="rounded-xl border border-dashed border-primary-200/70 bg-surface p-6 text-center">
            <div class="mx-auto mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-100/70 text-primary-700 dark:bg-white/10 dark:text-primary-300">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4.5 w-4.5">
                <circle cx="9" cy="8" r="3" />
                <path d="M3 19a6 6 0 0 1 12 0" />
              </svg>
            </div>
            <p class="text-sm text-muted">No worked hour records found in this period.</p>
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full min-w-[460px] text-sm">
              <thead>
                <tr class="border-b border-primary-100/80 text-left text-[11px] uppercase tracking-wide text-muted dark:border-white/10">
                  <th class="px-2 py-2">Employee</th>
                  <th class="px-2 py-2">Worked Hours</th>
                  <th class="px-2 py-2">Estimated Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in summary.sections.employeeHours" :key="item.employeeId" class="border-b border-primary-100/50 text-foreground dark:border-white/5">
                  <td class="px-2 py-2">{{ item.name }}</td>
                  <td class="px-2 py-2">{{ item.workedHours.toFixed(2) }}h</td>
                  <td class="px-2 py-2">{{ formatCurrency(item.estimatedLaborCost) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </AdminDashboardSection>

        <AdminDashboardSection
          title="Client Task Count"
          description="Scheduled load by client"
          :is-open="activeSection === 'clients'"
          @toggle="toggleSection('clients')"
        >
          <div v-if="summary.sections.clientTaskCounts.length === 0" class="rounded-xl border border-dashed border-primary-200/70 bg-surface p-6 text-center">
            <div class="mx-auto mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-100/70 text-primary-700 dark:bg-white/10 dark:text-primary-300">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4.5 w-4.5">
                <circle cx="12" cy="8" r="3" />
                <path d="M4 19a8 8 0 0 1 16 0" />
              </svg>
            </div>
            <p class="text-sm text-muted">No client task data found in this period.</p>
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full min-w-[460px] text-sm">
              <thead>
                <tr class="border-b border-primary-100/80 text-left text-[11px] uppercase tracking-wide text-muted dark:border-white/10">
                  <th class="px-2 py-2">Client</th>
                  <th class="px-2 py-2">Tasks</th>
                  <th class="px-2 py-2">Planned Hours</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in summary.sections.clientTaskCounts" :key="item.clientId" class="border-b border-primary-100/50 text-foreground dark:border-white/5">
                  <td class="px-2 py-2">{{ item.name }}</td>
                  <td class="px-2 py-2">{{ item.taskCount }}</td>
                  <td class="px-2 py-2">{{ item.plannedHours.toFixed(2) }}h</td>
                </tr>
              </tbody>
            </table>
          </div>
        </AdminDashboardSection>

        <AdminDashboardSection
          title="Planned vs Worked Details"
          description="Safe percentage with divide-by-zero handling"
          highlight
          :is-open="activeSection === 'plannedWorked'"
          @toggle="toggleSection('plannedWorked')"
        >
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div class="rounded-xl border border-primary-200/80 bg-white/80 p-3 dark:border-white/10 dark:bg-white/[0.03]">
              <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">Planned</p>
              <p class="mt-1 text-2xl font-semibold leading-none text-foreground">{{ summary.sections.plannedWorkedDetails.plannedHours.toFixed(2) }}h</p>
            </div>
            <div class="rounded-xl border border-primary-200/80 bg-white/80 p-3 dark:border-white/10 dark:bg-white/[0.03]">
              <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">Worked</p>
              <p class="mt-1 text-2xl font-semibold leading-none text-foreground">{{ summary.sections.plannedWorkedDetails.workedHours.toFixed(2) }}h</p>
            </div>
            <div class="rounded-xl border border-primary-200/80 bg-white/80 p-3 dark:border-white/10 dark:bg-white/[0.03]">
              <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">Completion</p>
              <p class="mt-1 text-2xl font-semibold leading-none text-foreground">{{ summary.sections.plannedWorkedDetails.percentage.toFixed(1) }}%</p>
            </div>
          </div>
          <div class="mt-3">
            <AdminSimpleProgressBar
              :value="summary.sections.plannedWorkedDetails.percentage"
              :max="100"
              label="Worked / Planned"
              :detail="`${summary.sections.plannedWorkedDetails.workedHours.toFixed(2)}h worked out of ${summary.sections.plannedWorkedDetails.plannedHours.toFixed(2)}h planned`"
            />
          </div>
        </AdminDashboardSection>

        <AdminDashboardSection
          title="Financial Breakdown"
          description="Estimated values only"
          highlight
          :is-open="activeSection === 'financial'"
          @toggle="toggleSection('financial')"
        >
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div class="rounded-xl border border-primary-100/80 bg-white/80 p-3 dark:border-white/10 dark:bg-white/[0.03]">
              <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">Estimated Revenue</p>
              <p class="mt-1 text-2xl font-semibold leading-none text-foreground">{{ formatCurrency(summary.sections.financialDetails.estimatedRevenue) }}</p>
            </div>
            <div class="rounded-xl border border-primary-100/80 bg-white/80 p-3 dark:border-white/10 dark:bg-white/[0.03]">
              <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">Estimated Labor Cost</p>
              <p class="mt-1 text-2xl font-semibold leading-none text-foreground">{{ formatCurrency(summary.sections.financialDetails.estimatedLaborCost) }}</p>
            </div>
            <div class="rounded-xl border p-3 dark:border-white/10 dark:bg-white/[0.03]" :class="marginCardClass">
              <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">Estimated Margin</p>
              <p class="mt-1 text-2xl font-semibold leading-none" :class="marginTextClass">{{ formatCurrency(summary.sections.financialDetails.estimatedMargin) }}</p>
            </div>
          </div>
          <p class="mt-2 text-xs text-muted">{{ summary.sections.financialDetails.revenueSourceLabel }}</p>
        </AdminDashboardSection>
      </div>
    </section>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AdminDashboardSection from '../../components/features/admin/AdminDashboardSection.vue'
import AdminKpiCard from '../../components/features/admin/AdminKpiCard.vue'
import AdminPeriodFilter from '../../components/features/admin/AdminPeriodFilter.vue'
import AdminSimpleProgressBar from '../../components/features/admin/AdminSimpleProgressBar.vue'
import BaseFeedbackBanner from '../../components/ui/BaseFeedbackBanner.vue'
import { useAuth } from '../../composables/useAuth'
import { useDataCache } from '../../composables/useDataCache'
import { useSupabaseClient } from '../../composables/useSupabaseClient'

type DashboardFilter = 'week' | 'month' | 'year'
type DashboardSectionKey = 'properties' | 'employees' | 'clients' | 'plannedWorked' | 'financial'

interface DashboardSummaryResponse {
  period: {
    from: string
    to: string
  }
  kpis: {
    totalProperties: number
    totalEmployees: number
    totalClients: number
    plannedHours: number
    workedHours: number
    plannedVsWorkedPct: number
    estimatedRevenue: number
    estimatedLaborCost: number
    estimatedMargin: number
    activeAdmins: number
    activeWorkers: number
    revenueSource: 'invoice_snapshot' | 'task_rate_fallback'
    isEstimated: boolean
  }
  sections: {
    propertyActivity: Array<{ propertyId: string; name: string; taskCount: number; plannedHours: number }>
    employeeHours: Array<{ employeeId: string; name: string; workedHours: number; estimatedLaborCost: number }>
    clientTaskCounts: Array<{ clientId: string; name: string; taskCount: number; plannedHours: number }>
    plannedWorkedDetails: { plannedHours: number; workedHours: number; gapHours: number; percentage: number }
    financialDetails: {
      estimatedRevenue: number
      estimatedLaborCost: number
      estimatedMargin: number
      revenueSourceLabel: string
    }
  }
}

const { signOut } = useAuth()
const supabase = useSupabaseClient()
const { getCached, setCached } = useDataCache()

const selectedFilter = ref<DashboardFilter>('week')
const periodCursor = ref<Date>(new Date())
const isLoading = ref(false)
const loadError = ref('')
const summary = ref<DashboardSummaryResponse | null>(null)
const activeSection = ref<DashboardSectionKey>('properties')

const selectedPeriodRange = computed(() => {
  const cursor = new Date(periodCursor.value)
  cursor.setHours(0, 0, 0, 0)

  if (selectedFilter.value === 'year') {
    const year = cursor.getFullYear()
    const first = new Date(year, 0, 1)
    const last = new Date(year, 11, 31)

    return {
      from: toIsoDate(first),
      to: toIsoDate(last),
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

const marginValue = computed(() => summary.value?.sections.financialDetails.estimatedMargin ?? 0)

const marginCardClass = computed(() => {
  if (marginValue.value > 0) {
    return 'border-success/30 bg-success/10'
  }

  if (marginValue.value < 0) {
    return 'border-danger/30 bg-danger/10'
  }

  return 'border-primary-100/80 bg-white/80'
})

const marginTextClass = computed(() => {
  if (marginValue.value > 0) {
    return 'text-success'
  }

  if (marginValue.value < 0) {
    return 'text-danger'
  }

  return 'text-foreground'
})

watch(selectedFilter, () => {
  periodCursor.value = new Date()
  void loadDashboardSummary()
})

onMounted(async () => {
  await loadDashboardSummary()
})

function startOfWeek(date: Date): Date {
  const clone = new Date(date)
  const weekday = clone.getDay()
  const diff = weekday === 0 ? -6 : 1 - weekday
  clone.setDate(clone.getDate() + diff)
  clone.setHours(0, 0, 0, 0)

  return clone
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0)
}

async function loadDashboardSummary(): Promise<void> {
  isLoading.value = true
  loadError.value = ''

  try {
    const { from, to } = selectedPeriodRange.value
    const cacheKey = `admin-dashboard:${selectedFilter.value}:${from}:${to}`
    const cached = getCached<DashboardSummaryResponse>(cacheKey)

    if (cached) {
      summary.value = cached
      return
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const accessToken = session?.access_token
    if (!accessToken) {
      throw new Error('No active session. Please log in again.')
    }

    const response = await fetch(`/api/admin/dashboard/summary?from=${from}&to=${to}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({} as { statusMessage?: string; message?: string }))
      throw new Error(body.statusMessage || body.message || `Failed to load dashboard (${response.status})`)
    }

    const payload = await response.json() as DashboardSummaryResponse
    summary.value = payload
    setCached(cacheKey, payload, 3 * 60 * 1000)
  } catch (error) {
    summary.value = null
    loadError.value = error instanceof Error ? error.message : 'Unexpected error loading dashboard.'
  } finally {
    isLoading.value = false
  }
}

function onFilterChange(value: DashboardFilter): void {
  selectedFilter.value = value
}

function goToPreviousPeriod(): void {
  const nextCursor = new Date(periodCursor.value)

  if (selectedFilter.value === 'year') {
    nextCursor.setFullYear(nextCursor.getFullYear() - 1)
  } else if (selectedFilter.value === 'month') {
    nextCursor.setMonth(nextCursor.getMonth() - 1)
  } else {
    nextCursor.setDate(nextCursor.getDate() - 7)
  }

  periodCursor.value = nextCursor
  void loadDashboardSummary()
}

function goToNextPeriod(): void {
  const nextCursor = new Date(periodCursor.value)

  if (selectedFilter.value === 'year') {
    nextCursor.setFullYear(nextCursor.getFullYear() + 1)
  } else if (selectedFilter.value === 'month') {
    nextCursor.setMonth(nextCursor.getMonth() + 1)
  } else {
    nextCursor.setDate(nextCursor.getDate() + 7)
  }

  periodCursor.value = nextCursor
  void loadDashboardSummary()
}

function resetToCurrentPeriod(): void {
  periodCursor.value = new Date()
  void loadDashboardSummary()
}

function toggleSection(section: DashboardSectionKey): void {
  activeSection.value = activeSection.value === section ? 'properties' : section
}

async function onSignOut(): Promise<void> {
  await signOut()
  await navigateTo('/login')
}
</script>
