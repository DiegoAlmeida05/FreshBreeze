<template>
  <NuxtLayout name="admin-layout" @signout="onSignOut">
    <section class="space-y-5">
      <header class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-primary-600">Operations</p>
          <h2 class="mt-1 text-2xl font-semibold text-foreground">Hours Summary</h2>
        </div>

        <button
          type="button"
          class="btn-outline !px-3 !py-2 text-xs"
          @click="toggleFullscreen"
        >
          {{ isFullscreenMode ? 'Exit Full Screen' : 'Full Screen' }}
        </button>
      </header>

      <div class="overflow-x-hidden rounded-xl border border-primary-100 bg-gradient-to-r from-primary-50/60 via-surface to-primary-warm-50/60 p-3 dark:border-white/10 dark:from-[#1b2534] dark:via-[#182231] dark:to-[#212d3d] sm:p-4">
        <div class="space-y-2 sm:space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <div class="flex items-center gap-1.5">
              <button type="button" class="btn-outline !px-2.5 !py-1.5 text-xs" aria-label="Previous week" :disabled="isLoading" @click="goToPreviousWeek">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5" aria-hidden="true">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>

              <input
                id="hours-summary-start-date"
                v-model="filters.startDate"
                type="date"
                class="input-base w-full max-w-[170px] !py-1 !text-xs [color-scheme:light] dark:[color-scheme:dark]"
                @change="onStartDateChange"
              >

              <button type="button" class="btn-outline !px-2.5 !py-1.5 text-xs" aria-label="Next week" :disabled="isLoading" @click="goToNextWeek">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>

            <button type="button" class="btn-outline !px-2 !py-1 text-[11px]" :disabled="isLoading" @click="goToCurrentWeek">
              This week
            </button>

            <p class="w-full text-left text-[10px] font-medium uppercase tracking-wide text-muted sm:ml-auto sm:w-auto sm:text-right">
              {{ weekRangeLabel }}
            </p>
          </div>

          <div class="mobile-table-scroll">
            <div class="grid min-w-[560px] grid-cols-7 gap-1.5">
            <button
              v-for="day in weekDays"
              :key="day.date"
              type="button"
              class="relative overflow-hidden rounded-md border px-2 py-1.5 text-center transition"
              :class="day.date === activeWeekDate
                ? day.isHoliday
                  ? 'border-warning bg-warning text-white shadow-sm'
                  : 'border-primary-500 bg-primary-500 text-white shadow-sm'
                : day.isHoliday
                  ? 'border-warning/35 bg-warning/10 text-foreground hover:border-warning/60 dark:border-warning/30 dark:bg-warning/10'
                : 'border-primary-100/70 bg-white/70 hover:border-primary-300 dark:border-white/10 dark:bg-white/[0.01] dark:hover:border-white/25'"
              @click="activeWeekDate = day.date"
            >
              <span
                v-if="day.isHoliday"
                class="holiday-badge inline-flex rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide"
                :class="day.date === activeWeekDate ? 'bg-white/20 text-white' : 'bg-warning/15 text-warning'"
                :title="day.holidayNames.join(', ') || 'Holiday'"
              >
                H
              </span>
              <p class="text-[9px] font-semibold uppercase leading-none tracking-wide" :class="day.date === activeWeekDate ? 'text-white/80' : day.isHoliday ? 'text-warning' : 'text-muted'">{{ day.weekday }}</p>
              <p class="mt-1 text-xs font-semibold leading-none" :class="day.date === activeWeekDate ? 'text-white' : 'text-foreground'">{{ day.dayNumber }}</p>
              <p class="mt-1 text-[9px] leading-none" :class="day.date === activeWeekDate ? 'text-white/80' : 'text-muted'">{{ day.totalMinutes }}m · {{ day.totalHours.toFixed(1) }}h</p>
            </button>
            </div>
          </div>
        </div>

        <div class="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto] lg:items-end">
          <div class="min-w-0">
            <label for="hours-summary-start-date-filter" class="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">Start Date</label>
            <input id="hours-summary-start-date-filter" v-model="filters.startDate" type="date" class="input-base !py-1 !text-xs" @change="onStartDateChange">
          </div>

          <div class="min-w-0">
            <label for="hours-summary-end-date-filter" class="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">End Date</label>
            <input id="hours-summary-end-date-filter" v-model="filters.endDate" type="date" class="input-base !py-1 !text-xs" readonly>
          </div>

          <div>
            <label for="hours-summary-employee" class="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">Employee</label>
            <select id="hours-summary-employee" v-model="filters.employeeId" class="input-base !py-1 !text-xs" @change="onEmployeeFilterChange">
              <option value="">All employees</option>
              <option v-for="employee in employeeOptions" :key="employee.id" :value="employee.id">
                {{ employee.full_name }}
              </option>
            </select>
          </div>

          <div class="flex items-end justify-start lg:justify-end">
            <button
              type="button"
              class="btn-outline w-full !px-2.5 !py-1.5 text-xs sm:w-auto"
              :disabled="isLoading || isGeneratingReport || !canPreviewReport"
              @click="openReportModal"
            >
              Preview Report
            </button>
          </div>

          <div class="flex items-end justify-start lg:justify-end">
            <button
              type="button"
              class="inline-flex h-7 w-7 items-center justify-center rounded-md border border-primary-200 text-muted transition hover:bg-primary-100/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/10"
              title="Clear filters"
              aria-label="Clear filters"
              :disabled="isLoading"
              @click="onClearFilters"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-3.5 w-3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M6 6l1 14h10l1-14" />
                <path d="M10 10v6" />
                <path d="M14 10v6" />
              </svg>
            </button>
          </div>
        </div>

        <p v-if="isRefreshing" class="mt-1 text-[10px] text-muted">
          Updating summary...
        </p>
      </div>

      <div class="grid grid-cols-2 gap-2 rounded-xl border border-primary-100/80 bg-primary-50/40 p-3 dark:border-white/10 dark:bg-white/[0.03] md:grid-cols-5">
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">Employees</p>
          <p class="text-sm font-semibold text-foreground">{{ summary.grandTotals.employeeCount }}</p>
        </div>
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">Worked Days</p>
          <p class="text-sm font-semibold text-foreground">{{ summary.grandTotals.workedDaysCount }}</p>
        </div>
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">Total Minutes</p>
          <p class="text-sm font-semibold text-foreground">{{ summary.grandTotals.totalMinutes }} min</p>
        </div>
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">Total Hours</p>
          <p class="text-sm font-semibold text-foreground">{{ summary.grandTotals.totalHours.toFixed(2) }}</p>
        </div>
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">Total Pay</p>
          <p class="text-sm font-semibold text-foreground">{{ formatCurrency(summary.grandTotals.totalPay) }}</p>
        </div>
      </div>

      <div v-if="pageError" class="rounded-lg border border-error-300/70 bg-error-50/70 px-3 py-2 text-sm text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-300">
        {{ pageError }}
      </div>

      <div v-if="isLoading && summary.employees.length === 0" class="space-y-2">
        <div class="h-14 animate-pulse rounded-lg border border-primary-100 bg-primary-100/40" />
        <div class="h-14 animate-pulse rounded-lg border border-primary-100 bg-primary-100/40" />
        <div class="h-14 animate-pulse rounded-lg border border-primary-100 bg-primary-100/40" />
      </div>

      <div
        v-else-if="summary.employees.length === 0"
        class="rounded-xl border border-dashed border-primary-200/80 bg-surface p-6 text-center text-sm text-muted"
      >
        No employee records found for this period.
      </div>

      <div v-else class="space-y-3">
        <section
          v-for="employee in summary.employees"
          :key="employee.employeeId"
          class="rounded-xl border border-primary-100/70 bg-white/50 dark:border-white/10 dark:bg-white/[0.02]"
        >
          <header class="flex flex-wrap items-center justify-between gap-3 border-b border-primary-100/50 px-4 py-2.5 dark:border-white/10">
            <div>
              <h3 class="text-sm font-semibold text-foreground sm:text-base">{{ employee.employeeName }}</h3>
              <p class="text-xs text-muted">{{ employee.workedDaysCount }} day(s)</p>
              <p
                v-if="hasPendingChangesForEmployee(employee.employeeId)"
                class="mt-1 text-[10px] font-semibold uppercase tracking-wide text-warning"
              >
                Unsaved changes
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="btn-primary !px-2.5 !py-1.5 text-xs"
                :disabled="isLoading || isSavingEmployee(employee.employeeId) || !hasPendingChangesForEmployee(employee.employeeId)"
                @click="onSaveEmployeeChanges(employee.employeeId)"
              >
                {{ isSavingEmployee(employee.employeeId) ? 'Calculating...' : 'Calculate' }}
              </button>
              <div class="text-right">
                <p class="text-sm font-semibold text-foreground">{{ formatHours(employee.totalMinutes) }} h</p>
                <p class="text-xs font-semibold text-primary-700 dark:text-primary-300">{{ formatCurrency(employee.totalPay) }}</p>
              </div>
            </div>
          </header>

          <div class="overflow-x-auto">
            <div class="min-w-[1320px]">
              <div class="grid grid-cols-[96px_190px_108px_108px_96px_90px_110px_96px_88px_110px_minmax(180px,1fr)] gap-2 border-b border-primary-100/50 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted dark:border-white/10">
                <span>Date</span>
                <span title="Operational reference from published Hours">Job Time</span>
                <span>Start</span>
                <span>End</span>
                <span title="Computed from End - Start">Worked Time</span>
                <span title="Worked Time - Job Time">Travel/Other</span>
                <span title="Manual extra paid hours">Special Hours</span>
                <span title="Worked Time + Special Hours">Final Paid</span>
                <span>Rate</span>
                <span>Total Pay</span>
                <span>Note</span>
              </div>

              <div
                v-for="day in employee.days"
                :key="`${employee.employeeId}:${day.date}`"
                class="grid grid-cols-[96px_190px_108px_108px_96px_90px_110px_96px_88px_110px_minmax(180px,1fr)] items-center gap-2 border-b border-primary-100/30 px-4 py-1.5 text-sm dark:border-white/10"
              >
                <p class="font-medium text-foreground">{{ formatDateLabel(day.date) }}</p>

                <p class="font-semibold text-foreground">{{ formatHours(day.jobMinutes) }} h</p>

                <div class="relative">
                  <input
                    :value="getDraft(employee.employeeId, day.date).startTime"
                    type="text"
                    inputmode="text"
                    maxlength="8"
                    class="w-full rounded-lg border border-primary-200/70 bg-white px-2 py-1 pr-7 text-xs text-foreground shadow-sm transition focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-300 dark:border-white/15 dark:bg-black/20"
                    :disabled="isSaving(employee.employeeId, day.date)"
                    @input="onDraftInput(employee.employeeId, day.date, 'startTime', $event)"
                    @blur="onBlurTimeField(employee.employeeId, day.date, 'startTime')"
                    @keydown.enter.prevent="onEnterTimeField(employee.employeeId, day.date, 'startTime', $event)"
                  >
                  <button
                    v-if="getDraft(employee.employeeId, day.date).startTime"
                    type="button"
                    class="absolute right-1 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-muted transition hover:bg-primary-100/70 hover:text-foreground dark:hover:bg-white/10"
                    title="Clear start time"
                    aria-label="Clear start time"
                    :disabled="isSaving(employee.employeeId, day.date)"
                    @click="clearTimeField(employee.employeeId, day.date, 'startTime')"
                  >
                    ×
                  </button>
                </div>

                <div class="relative">
                  <input
                    :value="getDraft(employee.employeeId, day.date).endTime"
                    type="text"
                    inputmode="text"
                    maxlength="8"
                    class="w-full rounded-lg border border-primary-200/70 bg-white px-2 py-1 pr-7 text-xs text-foreground shadow-sm transition focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-300 dark:border-white/15 dark:bg-black/20"
                    :disabled="isSaving(employee.employeeId, day.date)"
                    @input="onDraftInput(employee.employeeId, day.date, 'endTime', $event)"
                    @blur="onBlurTimeField(employee.employeeId, day.date, 'endTime')"
                    @keydown.enter.prevent="onEnterTimeField(employee.employeeId, day.date, 'endTime', $event)"
                  >
                  <button
                    v-if="getDraft(employee.employeeId, day.date).endTime"
                    type="button"
                    class="absolute right-1 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-muted transition hover:bg-primary-100/70 hover:text-foreground dark:hover:bg-white/10"
                    title="Clear end time"
                    aria-label="Clear end time"
                    :disabled="isSaving(employee.employeeId, day.date)"
                    @click="clearTimeField(employee.employeeId, day.date, 'endTime')"
                  >
                    ×
                  </button>
                </div>

                <div>
                  <p class="font-semibold text-foreground">
                    {{ formatHours(computeDraftWorkedMinutes(employee.employeeId, day)) }} h
                  </p>
                </div>

                <p class="font-semibold text-foreground">
                  {{ formatHours(computeDraftDiffMinutes(employee.employeeId, day)) }} h
                </p>

                <div>
                  <input
                    :value="getDraft(employee.employeeId, day.date).specialHours"
                    type="text"
                    inputmode="decimal"
                    placeholder="0"
                    class="w-full rounded border border-primary-200/70 bg-white px-2 py-0.5 text-xs text-foreground placeholder-muted/70 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-300 dark:border-white/15 dark:bg-black/20"
                    :disabled="isSaving(employee.employeeId, day.date)"
                    @input="onDraftInput(employee.employeeId, day.date, 'specialHours', $event)"
                    @blur="onBlurSpecialHoursField(employee.employeeId, day.date)"
                    @keydown.enter.prevent="onEnterSpecialHoursField(employee.employeeId, day.date, $event)"
                  >
                </div>

                <p class="font-semibold text-foreground">
                  {{ formatHours(computeDraftFinalPaidMinutes(employee.employeeId, day)) }} h
                </p>

                <p class="text-xs font-semibold text-foreground">{{ formatCurrency(day.appliedRate) }}</p>

                <div class="text-sm">
                  <p class="font-semibold text-foreground">{{ formatCurrency((computeDraftFinalPaidMinutes(employee.employeeId, day) / 60) * day.appliedRate) }}</p>
                </div>

                <div>
                  <input
                    :value="getDraft(employee.employeeId, day.date).note"
                    type="text"
                    placeholder="Optional note"
                    class="w-full rounded border border-primary-200/70 bg-white px-2 py-0.5 text-sm text-foreground placeholder-muted/70 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-300 dark:border-white/15 dark:bg-black/20"
                    :disabled="isSaving(employee.employeeId, day.date)"
                    @input="onDraftInput(employee.employeeId, day.date, 'note', $event)"
                    @blur="onBlurField(employee.employeeId, day.date)"
                  >
                  <div class="mt-1 h-3" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>

    <!-- Report Preview Modal -->
    <Teleport to="body">
      <div
        v-if="isReportModalOpen"
        class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-10 backdrop-blur-sm"
        @click.self="closeReportModal"
      >
        <div class="relative w-full max-w-[min(96vw,1500px)] rounded-2xl bg-white shadow-2xl dark:bg-neutral-900">
          <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-white/10">
            <div>
              <h2 class="text-base font-semibold text-foreground">Hours Report</h2>
              <p class="text-xs text-muted">{{ filters.startDate }} – {{ filters.endDate }}</p>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="btn-outline !px-3 !py-1.5 text-xs"
                :disabled="isExportingPdf || !reportData || isGeneratingReport"
                @click="onExportPdf"
              >
                {{ isExportingPdf ? 'Exporting...' : 'Export PDF' }}
              </button>
              <button
                type="button"
                class="btn-outline !px-3 !py-1.5 text-xs"
                :disabled="isExportingExcel || !reportData || isGeneratingReport"
                @click="onExportExcel"
              >
                {{ isExportingExcel ? 'Exporting...' : 'Export Excel' }}
              </button>
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition hover:bg-primary-100/50 hover:text-foreground dark:hover:bg-white/10"
                aria-label="Close report"
                @click="closeReportModal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div class="p-4 sm:p-5">
            <div v-if="isGeneratingReport" class="space-y-3 py-6">
              <div class="h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-white/10" />
              <div class="h-64 animate-pulse rounded-lg bg-slate-100 dark:bg-white/10" />
            </div>
            <div
              v-else-if="reportError"
              class="rounded-lg border border-error-300/70 bg-error-50/70 px-4 py-3 text-sm text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-300"
            >
              {{ reportError }}
            </div>
            <div v-else-if="reportData" ref="previewRoot" class="overflow-x-auto">
              <HoursReportPreview :report="reportData" />
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import HoursReportPreview from '../../components/features/hours/HoursReportPreview.vue'
import { useAuth } from '../../composables/useAuth'
import { useEmployees } from '../../composables/useEmployees'
import { useHolidays } from '../../composables/useHolidays'
import { useHoursReport, type EmployeeHoursReport } from '../../composables/useHoursReport'
import { useHoursSummary, type HoursSummaryDayBreakdown, type HoursSummaryResult } from '../../composables/useHoursSummary'
import type { EmployeeDTO } from '../../../shared/types/EmployeeDTO'

definePageMeta({
  name: 'admin-hours-summary',
})

interface SummaryFiltersState {
  startDate: string
  endDate: string
  employeeId: string
}

interface DayDraftState {
  startTime: string
  endTime: string
  specialHours: string
  note: string
}

type TimeDraftField = 'startTime' | 'endTime'
const DEBUG_HOURS_SUMMARY = false

const { signOut, getProfile } = useAuth()
const { getEmployees } = useEmployees()
const { getHolidaysByRange } = useHolidays()
const { getHoursSummary, updateEmployeeDayAdjustment } = useHoursSummary()
const { getEmployeeHoursReport } = useHoursReport()
const route = useRoute()
const router = useRouter()

type RowSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const isLoading = ref(false)
const isRefreshing = ref(false)
const savingEmployees = ref<Record<string, boolean>>({})
const pageError = ref('')
const employeeOptions = ref<EmployeeDTO[]>([])
const dayDrafts = ref<Record<string, DayDraftState>>({})
const rowStatus = ref<Record<string, RowSaveStatus>>({})
const rowError = ref<Record<string, string>>({})
const holidayNamesByDate = ref<Record<string, string[]>>({})

const isReportModalOpen = ref(false)
const isGeneratingReport = ref(false)
const isExportingPdf = ref(false)
const isExportingExcel = ref(false)
const reportData = ref<EmployeeHoursReport | null>(null)
const reportError = ref('')
const previewRoot = ref<HTMLElement | null>(null)

const summary = ref<HoursSummaryResult>({
  employees: [],
  grandTotals: {
    totalMinutes: 0,
    totalHours: 0,
    totalPay: 0,
    employeeCount: 0,
    workedDaysCount: 0,
  },
})

const filters = reactive<SummaryFiltersState>({
  startDate: startOfWeekMonday(todayIsoDate()),
  endDate: addDaysIso(startOfWeekMonday(todayIsoDate()), 6),
  employeeId: '',
})

const activeWeekDate = ref(filters.startDate)

const weekLabel = computed(() => {
  const start = parseIsoDate(filters.startDate)
  return start.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
})

const weekRangeLabel = computed(() => {
  const start = parseIsoDate(filters.startDate)
  const end = parseIsoDate(filters.endDate)

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

const weekDays = computed(() => {
  const totalsByDate = new Map<string, number>()

  summary.value.employees.forEach((employee) => {
    employee.days.forEach((day) => {
      const total = (totalsByDate.get(day.date) ?? 0) + computeDayTotalMinutes(day)
      totalsByDate.set(day.date, total)
    })
  })

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDaysIso(filters.startDate, index)
    const parsed = parseIsoDate(date)
    const totalMinutes = totalsByDate.get(date) ?? 0
    const holidayNames = holidayNamesByDate.value[date] ?? []

    return {
      date,
      weekday: parsed.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: String(parsed.getDate()).padStart(2, '0'),
      totalMinutes,
      totalHours: totalMinutes / 60,
      isToday: date === todayIsoDate(),
      isHoliday: holidayNames.length > 0,
      holidayNames,
    }
  })
})

const canPreviewReport = computed(() => {
  return Boolean(filters.employeeId) && summary.value.employees.length > 0
})

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

onMounted(async () => {
  await ensureAdmin()
  await loadEmployees()
  await loadSummary()
})

async function ensureAdmin(): Promise<void> {
  const profile = await getProfile()

  if (profile.role !== 'admin') {
    await navigateTo('/login')
  }
}

async function loadEmployees(): Promise<void> {
  try {
    const employees = await getEmployees()
    employeeOptions.value = employees
      .filter((employee) => employee.active)
      .sort((a, b) => a.full_name.localeCompare(b.full_name))
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to load employee options.'
  }
}

async function onEmployeeFilterChange(): Promise<void> {
  await loadSummary({ silent: true })
}

async function onClearFilters(): Promise<void> {
  filters.employeeId = ''
  setWeekFromStart(todayIsoDate())
  await loadSummary({ silent: true })
}

async function onStartDateChange(): Promise<void> {
  setWeekFromStart(filters.startDate)
  await loadSummary({ silent: true })
}

async function goToPreviousWeek(): Promise<void> {
  setWeekFromStart(addDaysIso(filters.startDate, -7))
  await loadSummary({ silent: true })
}

async function goToCurrentWeek(): Promise<void> {
  setWeekFromStart(todayIsoDate())
  await loadSummary({ silent: true })
}

async function goToNextWeek(): Promise<void> {
  setWeekFromStart(addDaysIso(filters.startDate, 7))
  await loadSummary({ silent: true })
}

async function loadSummary(options: { silent?: boolean } = {}): Promise<void> {
  const silent = options.silent === true && summary.value.employees.length > 0

  if (silent) {
    isRefreshing.value = true
  } else {
    isLoading.value = true
  }

  pageError.value = ''
  rowStatus.value = {}
  rowError.value = {}

  try {
    const [result, holidays] = await Promise.all([
      getHoursSummary(
        filters.startDate,
        filters.endDate,
        filters.employeeId || undefined,
      ),
      getHolidaysByRange(filters.startDate, filters.endDate).catch(() => []),
    ])

    holidayNamesByDate.value = (holidays ?? []).reduce<Record<string, string[]>>((acc, holiday) => {
      if (!acc[holiday.date]) {
        acc[holiday.date] = []
      }

      acc[holiday.date].push(holiday.name)
      return acc
    }, {})

    summary.value = result
    initializeDrafts(result)
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to load hours summary.'
    summary.value = {
      employees: [],
      grandTotals: {
        totalMinutes: 0,
        totalHours: 0,
        totalPay: 0,
        employeeCount: 0,
        workedDaysCount: 0,
      },
    }
    dayDrafts.value = {}
    holidayNamesByDate.value = {}
  } finally {
    if (silent) {
      isRefreshing.value = false
    } else {
      isLoading.value = false
    }
  }
}

function initializeDrafts(result: HoursSummaryResult): void {
  const drafts: Record<string, DayDraftState> = {}

  for (const employee of result.employees) {
    for (const day of employee.days) {
      drafts[`${employee.employeeId}::${day.date}`] = {
        startTime: formatTimeForDisplay(day.startTime) ?? '',
        endTime: formatTimeForDisplay(day.endTime) ?? '',
        specialHours: day.specialHours > 0 ? day.specialHours.toFixed(2) : '',
        note: day.note ?? '',
      }
    }
  }

  dayDrafts.value = drafts
  debugHoursSummary('drafts initialized', {
    employees: result.employees.length,
    sampleKeys: Object.keys(drafts).slice(0, 5),
  })
}

function getDraft(employeeId: string, date: string): DayDraftState {
  const key = `${employeeId}::${date}`

  if (!dayDrafts.value[key]) {
    dayDrafts.value = {
      ...dayDrafts.value,
      [key]: {
        startTime: '',
        endTime: '',
        specialHours: '',
        note: '',
      },
    }
  }

  return dayDrafts.value[key] as DayDraftState
}

function onDraftInput(
  employeeId: string,
  date: string,
  field: keyof DayDraftState,
  event: Event,
): void {
  const target = event.target as HTMLInputElement
  const key = `${employeeId}::${date}`
  const current = getDraft(employeeId, date)

  dayDrafts.value = {
    ...dayDrafts.value,
    [key]: {
      ...current,
      [field]: target.value,
    },
  }

  if (rowStatus.value[key] === 'error') {
    rowStatus.value = { ...rowStatus.value, [key]: 'idle' }
    rowError.value = { ...rowError.value, [key]: '' }
  }
}

function normalizeTimeValue(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim()

  if (!normalized) {
    return null
  }

  const directMatch = normalized.match(/^([01]\d|2[0-3]):([0-5]\d)$/)
  if (directMatch) {
    return `${directMatch[1]}:${directMatch[2]}`
  }

  const amPmMatch = normalized.match(/^(\d{1,2})(?::?([0-5]\d))?\s*([aApP][mM])$/)
  if (amPmMatch) {
    const rawHours = Number(amPmMatch[1])
    const minutes = Number(amPmMatch[2] ?? '00')

    if (rawHours >= 1 && rawHours <= 12 && minutes >= 0 && minutes <= 59) {
      const suffix = amPmMatch[3].toUpperCase()
      const hour24 = (rawHours % 12) + (suffix === 'PM' ? 12 : 0)
      return `${String(hour24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    }
  }

  const compactAmPmMatch = normalized.match(/^(\d{3,4})\s*([aApP][mM])$/)
  if (compactAmPmMatch) {
    const padded = compactAmPmMatch[1].length === 3
      ? `0${compactAmPmMatch[1]}`
      : compactAmPmMatch[1]

    const rawHours = Number(padded.slice(0, 2))
    const minutes = Number(padded.slice(2, 4))

    if (rawHours >= 1 && rawHours <= 12 && minutes >= 0 && minutes <= 59) {
      const suffix = compactAmPmMatch[2].toUpperCase()
      const hour24 = (rawHours % 12) + (suffix === 'PM' ? 12 : 0)
      return `${String(hour24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    }
  }

  const digitsOnly = normalized.replace(/[^\d]/g, '')

  if (digitsOnly.length === 3 || digitsOnly.length === 4) {
    const padded = digitsOnly.length === 3 ? `0${digitsOnly}` : digitsOnly
    const hours = Number(padded.slice(0, 2))
    const minutes = Number(padded.slice(2, 4))

    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    }
  }

  return null
}

function formatTimeForDisplay(value: string | null | undefined): string | null {
  const normalized = normalizeTimeValue(value)
  if (!normalized) {
    return null
  }

  const [hoursText, minutesText] = normalized.split(':')
  const hours = Number(hoursText)

  if (!Number.isFinite(hours)) {
    return null
  }

  const suffix = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12

  return `${displayHours}:${minutesText} ${suffix}`
}

function timeToMinutes(value: string | null | undefined): number | null {
  const normalized = normalizeTimeValue(value)
  if (!normalized) {
    return null
  }

  const [hours, minutes] = normalized.split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null
  }

  return (hours * 60) + minutes
}

function calculateShiftMinutes(startTime: string | null | undefined, endTime: string | null | undefined): number | null {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)

  if (startMinutes === null || endMinutes === null) {
    return null
  }

  let diff = endMinutes - startMinutes

  if (diff < 0) {
    diff += 24 * 60
  }

  return diff
}

function computeDayTotalMinutes(day: HoursSummaryDayBreakdown): number {
  return day.totalMinutes
}

function normalizeNote(value: string): string {
  return value.trim()
}

function parseSpecialHours(value: string | null | undefined): number | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim().replace(',', '.')
  if (!normalized) {
    return 0
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null
  }

  const parsed = Number(normalized)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null
  }

  return Number(parsed.toFixed(2))
}

function specialHoursToMinutes(value: string | null | undefined): number {
  const specialHours = parseSpecialHours(value)
  if (specialHours === null) {
    return 0
  }

  return Math.round(specialHours * 60)
}

function isSaving(employeeId: string, date: string): boolean {
  return rowStatus.value[`${employeeId}::${date}`] === 'saving'
}

function isDayDirty(employeeId: string, day: HoursSummaryDayBreakdown): boolean {
  const draft = getDraft(employeeId, day.date)
  const draftSpecialHours = parseSpecialHours(draft.specialHours)
  const normalizedSpecialHours = draftSpecialHours === null ? null : Number(draftSpecialHours.toFixed(2))

  return normalizeTimeValue(draft.startTime) !== day.startTime
    || normalizeTimeValue(draft.endTime) !== day.endTime
    || normalizedSpecialHours !== Number(day.specialHours.toFixed(2))
    || (normalizeNote(draft.note) || null) !== (day.note ?? null)
}

function computeDraftWorkedMinutes(employeeId: string, day: HoursSummaryDayBreakdown): number {
  const draft = getDraft(employeeId, day.date)
  const shiftMinutes = calculateShiftMinutes(draft.startTime, draft.endTime)
  return shiftMinutes ?? day.jobMinutes
}

function computeDraftFinalPaidMinutes(employeeId: string, day: HoursSummaryDayBreakdown): number {
  const workedMinutes = computeDraftWorkedMinutes(employeeId, day)
  return workedMinutes + specialHoursToMinutes(getDraft(employeeId, day.date).specialHours)
}

function computeDraftDiffMinutes(employeeId: string, day: HoursSummaryDayBreakdown): number {
  return Math.max(0, computeDraftWorkedMinutes(employeeId, day) - day.jobMinutes)
}

function findDay(employeeId: string, date: string): HoursSummaryDayBreakdown | null {
  const employee = summary.value.employees.find((item) => item.employeeId === employeeId)
  if (!employee) {
    return null
  }

  return employee.days.find((day) => day.date === date) ?? null
}

async function persistDayIfDirty(employeeId: string, date: string): Promise<void> {
  const day = findDay(employeeId, date)
  if (!day || isSaving(employeeId, date) || !isDayDirty(employeeId, day)) {
    return
  }

  await saveDay(employeeId, date)
}

function onBlurField(employeeId: string, date: string): void {
  void persistDayIfDirty(employeeId, date)
}

function onBlurSpecialHoursField(employeeId: string, date: string): void {
  const key = `${employeeId}::${date}`
  const current = getDraft(employeeId, date)
  const parsed = parseSpecialHours(current.specialHours)

  if (parsed === null) {
    rowStatus.value = { ...rowStatus.value, [key]: 'idle' }
    rowError.value = { ...rowError.value, [key]: '' }
    pageError.value = 'Invalid Special Hours format. Use up to 2 decimals (for example 1.5 or 2.25).'
    return
  }

  pageError.value = ''
  const nextValue = parsed > 0 ? parsed.toFixed(2) : ''
  if (nextValue !== current.specialHours) {
    dayDrafts.value = {
      ...dayDrafts.value,
      [key]: {
        ...current,
        specialHours: nextValue,
      },
    }
  }

  void persistDayIfDirty(employeeId, date)
}

function onBlurTimeField(employeeId: string, date: string, field: TimeDraftField): void {
  const key = `${employeeId}::${date}`
  const current = getDraft(employeeId, date)
  const normalized = normalizeTimeValue(current[field])
  const raw = current[field].trim()

  if (raw && !normalized) {
    rowStatus.value = { ...rowStatus.value, [key]: 'idle' }
    rowError.value = { ...rowError.value, [key]: '' }
    pageError.value = 'Invalid time format. Use h:mm AM/PM, HH:MM or HHMM (for example 7:30 AM, 07:30 or 0730).'
    return
  }

  pageError.value = ''
  rowStatus.value = { ...rowStatus.value, [key]: 'idle' }
  rowError.value = { ...rowError.value, [key]: '' }

  const nextValue = normalized ? (formatTimeForDisplay(normalized) ?? '') : ''
  if (nextValue !== current[field]) {
    dayDrafts.value = {
      ...dayDrafts.value,
      [key]: {
        ...current,
        [field]: nextValue,
      },
    }
  }

  void persistDayIfDirty(employeeId, date)
}

function onEnterTimeField(employeeId: string, date: string, field: TimeDraftField, event: KeyboardEvent): void {
  const target = event.target as HTMLInputElement | null
  onBlurTimeField(employeeId, date, field)
  target?.blur()
}

function onEnterSpecialHoursField(employeeId: string, date: string, event: KeyboardEvent): void {
  const target = event.target as HTMLInputElement | null
  onBlurSpecialHoursField(employeeId, date)
  target?.blur()
}

function clearTimeField(employeeId: string, date: string, field: TimeDraftField): void {
  const key = `${employeeId}::${date}`
  const current = getDraft(employeeId, date)

  if (!current[field]) {
    return
  }

  dayDrafts.value = {
    ...dayDrafts.value,
    [key]: {
      ...current,
      [field]: '',
    },
  }

  void persistDayIfDirty(employeeId, date)

}

function getDirtyRows(): Array<{ employeeId: string; date: string }> {
  const dirtyRows: Array<{ employeeId: string; date: string }> = []

  for (const employee of summary.value.employees) {
    for (const day of employee.days) {
      if (isDayDirty(employee.employeeId, day)) {
        dirtyRows.push({ employeeId: employee.employeeId, date: day.date })
      }
    }
  }

  return dirtyRows
}

function getDirtyRowsForEmployee(employeeId: string): Array<{ employeeId: string; date: string }> {
  return getDirtyRows().filter((row) => row.employeeId === employeeId)
}

function hasPendingChangesForEmployee(employeeId: string): boolean {
  return getDirtyRowsForEmployee(employeeId).length > 0
}

function isSavingEmployee(employeeId: string): boolean {
  return savingEmployees.value[employeeId] === true
}

async function saveDay(employeeId: string, date: string): Promise<boolean> {
  const key = `${employeeId}::${date}`
  const draft = getDraft(employeeId, date)
  const payload = {
    start_time: normalizeTimeValue(draft.startTime),
    end_time: normalizeTimeValue(draft.endTime),
    special_hours: parseSpecialHours(draft.specialHours) ?? 0,
    note: normalizeNote(draft.note) || null,
  }

  debugHoursSummary('saving row payload', {
    key,
    payload,
  })

  rowStatus.value = { ...rowStatus.value, [key]: 'saving' }
  rowError.value = { ...rowError.value, [key]: '' }

  try {
    await updateEmployeeDayAdjustment(employeeId, date, payload)

    rowStatus.value = { ...rowStatus.value, [key]: 'saved' }
    debugHoursSummary('row save success', { key })
    return true

  } catch (err: unknown) {
    rowStatus.value = { ...rowStatus.value, [key]: 'error' }
    rowError.value = {
      ...rowError.value,
      [key]: err instanceof Error ? err.message : 'Failed to save.',
    }
    debugHoursSummary('row save failed', {
      key,
      error: err instanceof Error ? err.message : String(err),
    })
    return false
  }
}

async function saveEmployeeChanges(employeeId: string): Promise<boolean> {
  const dirtyRows = getDirtyRowsForEmployee(employeeId)

  savingEmployees.value = {
    ...savingEmployees.value,
    [employeeId]: true,
  }

  try {
    for (const row of dirtyRows) {
      await saveDay(row.employeeId, row.date)
    }

    const hasErrors = dirtyRows.some((row) => rowStatus.value[`${row.employeeId}::${row.date}`] === 'error')
    if (hasErrors) {
      return false
    }

    await silentReload()

    const savedStatus: Record<string, RowSaveStatus> = {}
    for (const row of dirtyRows) {
      savedStatus[`${row.employeeId}::${row.date}`] = 'saved'
    }
    rowStatus.value = {
      ...rowStatus.value,
      ...savedStatus,
    }

    return true
  } finally {
    savingEmployees.value = {
      ...savingEmployees.value,
      [employeeId]: false,
    }
  }
}

async function onSaveEmployeeChanges(employeeId: string): Promise<void> {
  const success = await saveEmployeeChanges(employeeId)
  if (!success) {
    pageError.value = 'Some rows failed to save. Please fix and try again.'
  }
}

async function silentReload(): Promise<void> {
  try {
    const result = await getHoursSummary(
      filters.startDate,
      filters.endDate,
      filters.employeeId || undefined,
    )
    debugHoursSummary('reload result', {
      employees: result.employees.length,
      firstEmployeeDays: result.employees[0]?.days.length ?? 0,
      firstDayStart: result.employees[0]?.days[0]?.startTime ?? null,
      firstDayEnd: result.employees[0]?.days[0]?.endTime ?? null,
    })
    summary.value = result
    initializeDrafts(result)
  } catch {
    // Silent failure: data is already persisted.
  }
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

function setWeekFromStart(value: string): void {
  const monday = startOfWeekMonday(value)
  filters.startDate = monday
  filters.endDate = addDaysIso(monday, 6)
  activeWeekDate.value = monday
}

function startOfWeekMonday(value: string): string {
  const date = parseIsoDate(value)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return toIsoDate(date)
}

function todayIsoDate(): string {
  return toIsoDate(new Date())
}

function formatDateLabel(value: string): string {
  const parsed = parseIsoDate(value)
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function formatCurrency(value: number): string {
  const formatted = value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'AUD',
  })

  return formatted.replace('A$', '$')
}

function formatHours(minutes: number): string {
  return (minutes / 60).toFixed(2)
}

function debugHoursSummary(message: string, payload?: unknown): void {
  if (!DEBUG_HOURS_SUMMARY) {
    return
  }

  console.debug(`[hours-summary] ${message}`, payload)
}

async function openReportModal(): Promise<void> {
  if (getDirtyRows().length > 0) {
    pageError.value = 'There are unsaved changes. Preview shows only saved/calculated data.'
  }

  isReportModalOpen.value = true
  isGeneratingReport.value = true
  reportError.value = ''
  reportData.value = null

  try {
    reportData.value = await getEmployeeHoursReport(filters.startDate, filters.endDate, filters.employeeId)
  } catch (err: unknown) {
    reportError.value = err instanceof Error ? err.message : 'Failed to generate report.'
  } finally {
    isGeneratingReport.value = false
  }
}

function closeReportModal(): void {
  isReportModalOpen.value = false
  reportData.value = null
  reportError.value = ''
}

async function onExportPdf(): Promise<void> {
  if (!reportData.value || !previewRoot.value || isExportingPdf.value) {
    return
  }

  isExportingPdf.value = true

  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ])

    const canvas = await html2canvas(previewRoot.value, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    })

    const imageData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 8
    const renderWidth = pageWidth - margin * 2
    const renderHeight = (canvas.height * renderWidth) / canvas.width

    let heightLeft = renderHeight
    let position = margin

    pdf.addImage(imageData, 'PNG', margin, position, renderWidth, renderHeight)
    heightLeft -= pageHeight - margin * 2

    while (heightLeft > 0) {
      position = heightLeft - renderHeight + margin
      pdf.addPage()
      pdf.addImage(imageData, 'PNG', margin, position, renderWidth, renderHeight)
      heightLeft -= pageHeight - margin * 2
    }

    const name = reportData.value.employeeName.toLowerCase().replace(/\s+/g, '-')
    pdf.save(`hours-report-${name}-${filters.startDate}-${filters.endDate}.pdf`)
  } catch (err: unknown) {
    reportError.value = err instanceof Error ? err.message : 'Failed to export PDF.'
  } finally {
    isExportingPdf.value = false
  }
}

function formatReportDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00`)
  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatReportWeekday(value: string): string {
  const parsed = new Date(`${value}T00:00:00`)
  return parsed.toLocaleDateString('en-AU', {
    weekday: 'long',
  })
}

async function onExportExcel(): Promise<void> {
  if (!reportData.value || isExportingExcel.value) {
    return
  }

  isExportingExcel.value = true

  try {
    const ExcelJSImport = await import('exceljs/dist/exceljs.min.js')
    const ExcelJS = (ExcelJSImport.default ?? ExcelJSImport) as typeof import('exceljs')
    const report = reportData.value
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Hours Report')

    worksheet.columns = [
      { width: 14 },
      { width: 16 },
      { width: 12 },
      { width: 13 },
      { width: 13 },
      { width: 13 },
      { width: 15 },
      { width: 12 },
      { width: 14 },
      { width: 36 },
    ]

    worksheet.views = [{ state: 'frozen', ySplit: 7 }]
    worksheet.properties.defaultRowHeight = 20
    worksheet.getRow(1).height = 24
    worksheet.getRow(2).height = 21
    worksheet.getRow(3).height = 21
    worksheet.getRow(4).height = 21

    const logoResponse = await fetch('/logo/logo_escrito_transparente.png')
    if (!logoResponse.ok) {
      throw new Error('Failed to load logo asset for Excel export.')
    }

    const logoBlob = await logoResponse.blob()
    const logoBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('Failed to read logo image.'))
      reader.readAsDataURL(logoBlob)
    })

    const logoImageId = workbook.addImage({
      base64: logoBase64,
      extension: 'png',
    })

    worksheet.mergeCells('A1:B4')
    worksheet.addImage(logoImageId, 'A1:B4')

    worksheet.mergeCells('D1:H1')
    worksheet.getCell('D1').value = 'Employee Hours Summary Report'
    worksheet.getCell('D1').font = { bold: true, size: 14, color: { argb: 'FF0F172A' } }
    worksheet.getCell('D1').alignment = { vertical: 'middle', horizontal: 'left' }

    worksheet.mergeCells('D2:H2')
    worksheet.getCell('D2').value = `Period: ${formatReportDate(report.periodStart)} - ${formatReportDate(report.periodEnd)}`
    worksheet.getCell('D2').font = { size: 11, color: { argb: 'FF475569' } }
    worksheet.getCell('D2').alignment = { vertical: 'middle', horizontal: 'left' }

    worksheet.mergeCells('E3:F3')
    worksheet.mergeCells('H3:I3')
    worksheet.mergeCells('E4:F4')
    worksheet.mergeCells('H4:I4')

    worksheet.getCell('D3').value = 'Employee'
    worksheet.getCell('E3').value = report.employeeName
    worksheet.getCell('G3').value = 'ABN'
    worksheet.getCell('H3').value = report.employeeAbn || '-'
    worksheet.getCell('D4').value = 'Period'
    worksheet.getCell('E4').value = `${formatReportDate(report.periodStart)} - ${formatReportDate(report.periodEnd)}`
    worksheet.getCell('G4').value = 'Invoice'
    worksheet.getCell('H4').value = '-'

    const infoLabels = ['D3', 'G3', 'D4', 'G4']
    for (const cellRef of infoLabels) {
      worksheet.getCell(cellRef).font = { bold: true }
      worksheet.getCell(cellRef).alignment = { vertical: 'middle', horizontal: 'left' }
    }

    const infoValues = ['E3', 'H3', 'E4', 'H4']
    for (const cellRef of infoValues) {
      worksheet.getCell(cellRef).alignment = { vertical: 'middle', horizontal: 'left' }
      worksheet.getCell(cellRef).font = { size: 10.5, color: { argb: 'FF1E293B' } }
    }

    const headerAreaCells = ['A1', 'A2', 'A3', 'A4', 'D1', 'D2', 'D3', 'D4', 'E3', 'E4', 'G3', 'G4', 'H3', 'H4', 'I1', 'I2', 'I3', 'I4', 'J1', 'J2', 'J3', 'J4']
    for (const cellRef of headerAreaCells) {
      const cell = worksheet.getCell(cellRef)
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8FAFC' },
      }
    }

    const metaTableCells = ['D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4']
    for (const cellRef of metaTableCells) {
      const cell = worksheet.getCell(cellRef)
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFFFF' },
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD8E0EA' } },
        left: { style: 'thin', color: { argb: 'FFD8E0EA' } },
        bottom: { style: 'thin', color: { argb: 'FFD8E0EA' } },
        right: { style: 'thin', color: { argb: 'FFD8E0EA' } },
      }
    }

    for (let row = 1; row <= 4; row += 1) {
      for (let col = 1; col <= 10; col += 1) {
        const cell = worksheet.getCell(row, col)
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        }
      }
    }

    const tableHeaderRowNumber = 7
    const tableHeader = ['Date', 'Weekday', 'Job Hours', 'Worked Hours', 'Special Hours', 'Final Paid Hours', 'Invoice Hours', 'Rate/Job', 'Total Pay', 'Notes']
    const headerRow = worksheet.getRow(tableHeaderRowNumber)
    tableHeader.forEach((title, index) => {
      const cell = headerRow.getCell(index + 1)
      cell.value = title
      cell.font = { bold: true }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE2E8F0' },
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      }
      cell.alignment = { vertical: 'middle', horizontal: 'left' }
    })

    let currentRow = tableHeaderRowNumber + 1

    for (const row of report.rows) {
      const dataRow = worksheet.getRow(currentRow)
      dataRow.values = [
        formatReportDate(row.date),
        formatReportWeekday(row.date),
        Number(row.jobHours.toFixed(2)),
        Number(row.workedHours.toFixed(2)),
        row.specialHours > 0 ? Number(row.specialHours.toFixed(2)) : '',
        Number(row.finalPaidHours.toFixed(2)),
        Number(row.invoiceHours.toFixed(2)),
        Number(row.ratePerJob.toFixed(2)),
        Number(row.totalPay.toFixed(2)),
        row.note?.trim() || '',
      ]

      dataRow.getCell(3).numFmt = '0.00'
      dataRow.getCell(4).numFmt = '0.00'
      dataRow.getCell(5).numFmt = '0.00'
      dataRow.getCell(6).numFmt = '0.00'
      dataRow.getCell(7).numFmt = '0.00'
      dataRow.getCell(8).numFmt = '$#,##0.00'
      dataRow.getCell(9).numFmt = '$#,##0.00'

      const isEvenRow = (currentRow - tableHeaderRowNumber) % 2 === 0
      for (let col = 1; col <= 10; col += 1) {
        const cell = dataRow.getCell(col)
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        }

        if (isEvenRow) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFAFAFA' },
          }
        }
      }

      dataRow.getCell(3).alignment = { horizontal: 'center' }
      dataRow.getCell(4).alignment = { horizontal: 'center' }
      dataRow.getCell(5).alignment = { horizontal: 'center' }
      dataRow.getCell(6).alignment = { horizontal: 'center' }
      dataRow.getCell(7).alignment = { horizontal: 'center' }
      dataRow.getCell(8).alignment = { horizontal: 'right' }
      dataRow.getCell(9).alignment = { horizontal: 'right' }

      currentRow += 1
    }

    const finalTotalRow = worksheet.getRow(currentRow + 1)
    finalTotalRow.getCell(1).value = 'Final Total'
    finalTotalRow.getCell(1).font = { bold: true }
    finalTotalRow.getCell(6).value = Number(report.finalTotalHours.toFixed(2))
    finalTotalRow.getCell(6).numFmt = '0.00'
    finalTotalRow.getCell(6).font = { bold: true }
    finalTotalRow.getCell(7).value = Number(report.finalInvoiceHours.toFixed(2))
    finalTotalRow.getCell(7).numFmt = '0.00'
    finalTotalRow.getCell(7).font = { bold: true }
    finalTotalRow.getCell(9).value = Number(report.finalTotalPay.toFixed(2))
    finalTotalRow.getCell(9).numFmt = '$#,##0.00'
    finalTotalRow.getCell(9).font = { bold: true, size: 12 }

    for (let col = 1; col <= 10; col += 1) {
      const cell = finalTotalRow.getCell(col)
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF334155' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8FAFC' },
      }
    }

    finalTotalRow.getCell(6).alignment = { horizontal: 'center' }
  finalTotalRow.getCell(7).alignment = { horizontal: 'center' }
  finalTotalRow.getCell(9).alignment = { horizontal: 'right' }

    const name = report.employeeName.toLowerCase().replace(/\s+/g, '-')
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([
      buffer,
    ], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `hours-report-${name}-${filters.startDate}-${filters.endDate}.xlsx`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  } catch (err: unknown) {
    reportError.value = err instanceof Error ? err.message : 'Failed to export Excel.'
  } finally {
    isExportingExcel.value = false
  }
}

async function onSignOut(): Promise<void> {
  await signOut()
  await navigateTo('/login')
}
</script>
