<template>
  <NuxtLayout name="admin-layout" @signout="onSignOut">
    <section class="space-y-5">
      <header class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-primary-600">Operations</p>
          <h2 class="mt-1 text-2xl font-semibold text-foreground">Hours Report</h2>
          <p class="mt-1 text-sm text-muted">Generate a payroll-style report preview and export PDF per employee.</p>
        </div>
      </header>

      <div class="rounded-xl border border-primary-100 bg-gradient-to-r from-primary-50/60 via-surface to-primary-warm-50/60 p-4 dark:border-white/10 dark:from-[#1b2534] dark:via-[#182231] dark:to-[#212d3d]">
        <form class="grid grid-cols-1 gap-3 md:grid-cols-4" novalidate @submit.prevent="onGenerate">
          <div>
            <label for="hours-report-start-date" class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Start Date</label>
            <input id="hours-report-start-date" v-model="filters.startDate" type="date" class="input-base" required>
          </div>

          <div>
            <label for="hours-report-end-date" class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">End Date</label>
            <input id="hours-report-end-date" v-model="filters.endDate" type="date" class="input-base" required>
          </div>

          <div>
            <label for="hours-report-employee" class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Employee</label>
            <select id="hours-report-employee" v-model="filters.employeeId" class="input-base" required>
              <option value="">Select employee</option>
              <option v-for="employee in employeeOptions" :key="employee.id" :value="employee.id">
                {{ employee.full_name }}
              </option>
            </select>
          </div>

          <div class="flex flex-wrap items-end justify-start gap-2 md:justify-end">
            <button type="submit" class="btn-primary" :disabled="isLoading || !canGenerate">
              {{ isLoading ? 'Generating...' : 'Generate Preview' }}
            </button>
            <button
              type="button"
              class="btn-outline"
              :disabled="isLoading || isExporting || !report"
              @click="onExportPdf"
            >
              {{ isExporting ? 'Exporting...' : 'Export PDF' }}
            </button>
          </div>
        </form>

        <p v-if="requiresRegeneration && report" class="mt-2 text-xs text-warning">
          Filters changed. Generate preview again to refresh the report.
        </p>
      </div>

      <div v-if="pageError" class="rounded-lg border border-error-300/70 bg-error-50/70 px-3 py-2 text-sm text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-300">
        {{ pageError }}
      </div>

      <div v-if="isLoading" class="space-y-2">
        <div class="h-16 animate-pulse rounded-lg border border-primary-100 bg-primary-100/40" />
        <div class="h-[420px] animate-pulse rounded-lg border border-primary-100 bg-primary-100/30" />
      </div>

      <div
        v-else-if="hasGenerated && !report"
        class="rounded-xl border border-dashed border-primary-200/80 bg-surface p-6 text-center text-sm text-muted"
      >
        No report data found for the selected employee and period.
      </div>

      <div v-else-if="report" class="rounded-xl border border-primary-100/70 bg-primary-50/30 p-3 dark:border-white/10 dark:bg-white/[0.02]">
        <div class="max-h-[75vh] overflow-auto rounded-lg p-2">
          <div ref="previewRoot">
            <HoursReportPreview :report="report" />
          </div>
        </div>
      </div>
    </section>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import HoursReportPreview from '../../components/features/hours/HoursReportPreview.vue'
import { useAuth } from '../../composables/useAuth'
import { useEmployees } from '../../composables/useEmployees'
import { useHoursReport, type EmployeeHoursReport } from '../../composables/useHoursReport'
import type { EmployeeDTO } from '../../../shared/types/EmployeeDTO'

definePageMeta({
  name: 'admin-hours-report',
})

interface ReportFiltersState {
  startDate: string
  endDate: string
  employeeId: string
}

const { signOut, getProfile } = useAuth()
const { getEmployees } = useEmployees()
const { getEmployeeHoursReport } = useHoursReport()

const employeeOptions = ref<EmployeeDTO[]>([])
const isLoading = ref(false)
const isExporting = ref(false)
const pageError = ref('')
const report = ref<EmployeeHoursReport | null>(null)
const hasGenerated = ref(false)
const requiresRegeneration = ref(false)
const lastGeneratedSignature = ref('')
const previewRoot = ref<HTMLElement | null>(null)

const filters = reactive<ReportFiltersState>({
  startDate: startOfWeekMonday(todayIsoDate()),
  endDate: addDaysIso(startOfWeekMonday(todayIsoDate()), 6),
  employeeId: '',
})

const canGenerate = computed(() => {
  return Boolean(filters.startDate && filters.endDate && filters.employeeId)
})

watch(
  () => `${filters.startDate}::${filters.endDate}::${filters.employeeId}`,
  (signature) => {
    requiresRegeneration.value = signature !== lastGeneratedSignature.value
  },
)

onMounted(async () => {
  await ensureAdmin()
  await loadEmployees()
})

async function ensureAdmin(): Promise<void> {
  const profile = await getProfile()

  if (profile.role !== 'admin') {
    await navigateTo('/login')
  }
}

async function loadEmployees(): Promise<void> {
  pageError.value = ''

  try {
    const loaded = await getEmployees()
    employeeOptions.value = loaded
      .filter((employee) => employee.active)
      .sort((a, b) => a.full_name.localeCompare(b.full_name))
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to load employees.'
    employeeOptions.value = []
  }
}

async function onGenerate(): Promise<void> {
  if (!canGenerate.value) {
    return
  }

  isLoading.value = true
  pageError.value = ''

  try {
    report.value = await getEmployeeHoursReport(
      filters.startDate,
      filters.endDate,
      filters.employeeId,
    )

    hasGenerated.value = true
    lastGeneratedSignature.value = `${filters.startDate}::${filters.endDate}::${filters.employeeId}`
    requiresRegeneration.value = false
  } catch (err: unknown) {
    report.value = null
    hasGenerated.value = true
    pageError.value = err instanceof Error ? err.message : 'Failed to generate report.'
  } finally {
    isLoading.value = false
  }
}

async function onExportPdf(): Promise<void> {
  if (!report.value || !previewRoot.value || isExporting.value) {
    return
  }

  isExporting.value = true
  pageError.value = ''

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

    const fileName = `${toFileSafeEmployeeName(report.value.employeeName)}_Hours_${toCompactDate(filters.startDate)}-${toCompactDate(filters.endDate)}.pdf`
    pdf.save(fileName)
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to export PDF.'
  } finally {
    isExporting.value = false
  }
}

function todayIsoDate(): string {
  return toIsoDate(new Date())
}

function startOfWeekMonday(value: string): string {
  const date = parseIsoDate(value)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return toIsoDate(date)
}

function addDaysIso(value: string, days: number): string {
  const date = parseIsoDate(value)
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
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

function toCompactDate(value: string): string {
  const parsed = parseIsoDate(value)

  if (Number.isNaN(parsed.getTime())) {
    return value.replace(/[^\d]/g, '')
  }

  const day = String(parsed.getDate()).padStart(2, '0')
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const year = String(parsed.getFullYear())
  return `${day}${month}${year}`
}

function toFileSafeEmployeeName(name: string): string {
  return (name || 'Collaborator')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[\\/:*?"<>|]/g, '')
}

async function onSignOut(): Promise<void> {
  await signOut()
  await navigateTo('/login')
}
</script>
