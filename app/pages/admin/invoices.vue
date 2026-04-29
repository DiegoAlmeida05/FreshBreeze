<template>
  <NuxtLayout name="admin-layout" @signout="onSignOut">
    <section class="space-y-5">
      <header class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-primary-600">Billing</p>
          <h2 class="mt-1 text-2xl font-semibold text-foreground">Client Invoices</h2>
          <p v-if="lastUpdatedAt" class="mt-1 text-[11px] font-medium text-muted">
            Last updated {{ formatDateTimeLabel(lastUpdatedAt) }}
          </p>
        </div>
      </header>

      <!-- Filter bar -->
      <div class="overflow-x-hidden rounded-xl border border-primary-100 bg-gradient-to-r from-primary-50/60 via-surface to-primary-warm-50/60 p-3 dark:border-white/10 dark:from-[#1b2534] dark:via-[#182231] dark:to-[#212d3d] sm:p-4">
        <div class="space-y-2 sm:space-y-3">
          <!-- Week navigation row -->
          <div class="flex flex-wrap items-center gap-2">
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                class="btn-outline !px-2.5 !py-1.5 text-xs"
                aria-label="Previous week"
                :disabled="isLoadingPreview"
                @click="goToPreviousWeek"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5" aria-hidden="true">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>

              <input
                id="invoice-nav-date"
                v-model="filters.startDate"
                type="date"
                class="input-base w-full max-w-[170px] !py-1 !text-xs [color-scheme:light] dark:[color-scheme:dark]"
                @change="onStartDateChange"
              >

              <button
                type="button"
                class="btn-outline !px-2.5 !py-1.5 text-xs"
                aria-label="Next week"
                :disabled="isLoadingPreview"
                @click="goToNextWeek"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>

            <button
              type="button"
              class="btn-outline !px-2 !py-1 text-[11px]"
              :disabled="isLoadingPreview"
              @click="goToCurrentWeek"
            >
              This week
            </button>

            <p class="text-[10px] font-medium uppercase tracking-wide text-muted">
              {{ weekRangeLabel }}
            </p>
          </div>

          <!-- Filters + actions row -->
          <div class="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)_auto_auto] lg:items-end">
            <div class="min-w-0">
              <label for="invoice-start-date" class="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">Start Date</label>
              <input id="invoice-start-date" v-model="filters.startDate" type="date" class="input-base !py-1 !text-xs [color-scheme:light] dark:[color-scheme:dark]" readonly>
            </div>

            <div class="min-w-0">
              <label for="invoice-end-date" class="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">End Date</label>
              <input id="invoice-end-date" v-model="filters.endDate" type="date" class="input-base !py-1 !text-xs [color-scheme:light] dark:[color-scheme:dark]" readonly>
            </div>

            <div>
              <label for="invoice-client" class="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">Client</label>
              <select id="invoice-client" v-model="filters.clientId" class="input-base !py-1 !text-xs">
                <option value="">Select a client</option>
                <option v-for="client in clientOptions" :key="client.id" :value="client.id">
                  {{ client.name }}
                </option>
              </select>
            </div>

            <div class="flex items-end justify-start lg:justify-end">
              <button
                type="button"
                class="btn-outline w-full !px-2.5 !py-1.5 text-xs sm:w-auto"
                :disabled="isLoadingPreview || !canGeneratePreview"
                @click="onGeneratePreview"
              >
                {{ isLoadingPreview ? 'Generating...' : 'Preview invoice' }}
              </button>
            </div>

            <div class="flex items-end justify-start lg:justify-end">
              <button
                type="button"
                class="inline-flex h-7 w-7 items-center justify-center rounded-md border border-primary-200 text-muted transition hover:bg-primary-100/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/10"
                title="Clear filters"
                aria-label="Clear filters"
                :disabled="isLoadingPreview"
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
        </div>
      </div>

      <!-- Error -->
      <div v-if="pageError" class="rounded-lg border border-error-300/70 bg-error-50/70 px-3 py-2 text-sm text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-300">
        {{ pageError }}
      </div>

      <!-- Loading skeleton -->
      <div v-if="isLoadingPreview" class="space-y-2">
        <div class="h-20 animate-pulse rounded-lg border border-primary-100 bg-primary-100/40 dark:border-white/10 dark:bg-white/[0.04]" />
        <div class="h-40 animate-pulse rounded-lg border border-primary-100 bg-primary-100/40 dark:border-white/10 dark:bg-white/[0.04]" />
      </div>

      <!-- Empty state after generation -->
      <div
        v-else-if="preview && preview.rows.length === 0"
        class="rounded-xl border border-dashed border-primary-200/80 bg-surface p-6 text-center text-sm text-muted dark:border-white/15"
      >
        No invoice rows found for the selected period and client.
      </div>

      <!-- Invoice preview -->
      <template v-else-if="preview">
        <div class="space-y-3">
          <!-- Preview header card -->
          <div class="rounded-xl border border-primary-100/80 bg-primary-50/45 p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <div class="grid grid-cols-1 gap-2 lg:grid-cols-2">
              <div class="rounded-lg border border-primary-100/80 bg-white/70 px-3 py-2 dark:border-white/10 dark:bg-white/[0.02]">
                <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">Client</p>
                <p class="mt-0.5 text-sm font-semibold text-foreground">{{ preview.clientName }}</p>
                <p class="mt-2 text-[10px] font-semibold uppercase tracking-wide text-muted">Period</p>
                <p class="mt-0.5 text-sm font-semibold text-foreground">{{ formatDate(preview.periodStart) }} — {{ formatDate(preview.periodEnd) }}</p>
                <p class="mt-2 text-[10px] font-semibold uppercase tracking-wide text-muted">ABN</p>
                <p class="mt-0.5 text-sm font-semibold text-foreground">{{ COMPANY_ABN }}</p>
              </div>

              <div class="rounded-lg border border-primary-100/80 bg-white/70 px-3 py-2 dark:border-white/10 dark:bg-white/[0.02]">
                <label for="invoice-number" class="block text-[10px] font-semibold uppercase tracking-wide text-muted">Invoice Number <span class="normal-case font-normal">(optional)</span></label>
                <input
                  id="invoice-number"
                  v-model="invoiceNumber"
                  type="text"
                  class="input-base mt-0.5 max-w-[190px] !py-1 !text-xs"
                  placeholder="e.g. INV-001"
                >

                <div class="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    class="btn-outline !px-2.5 !py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                    :disabled="!canExport || isExportingPdf"
                    @click="onExportPdf"
                  >
                    {{ isExportingPdf ? 'Exporting...' : 'Export PDF' }}
                  </button>
                  <button
                    type="button"
                    class="btn-outline !px-2.5 !py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                    :disabled="!canExport || isExportingExcel"
                    @click="onExportExcel"
                  >
                    {{ isExportingExcel ? 'Exporting...' : 'Export Excel' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Summary tiles -->
            <div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
              <div class="rounded-lg border border-primary-100/80 bg-white/70 px-3 py-2 dark:border-white/10 dark:bg-white/[0.02]">
                <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">Invoice Hours</p>
                <p class="mt-0.5 text-sm font-semibold text-foreground">{{ invoiceHoursFromRows.toFixed(2) }}</p>
              </div>
              <div class="rounded-lg border border-primary-100/80 bg-white/70 px-3 py-2 dark:border-white/10 dark:bg-white/[0.02]">
                <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">Services</p>
                <p class="mt-0.5 text-sm font-semibold text-foreground">{{ preview.rows.length }}</p>
              </div>
              <div class="rounded-lg border border-primary-100/80 bg-white/70 px-3 py-2 dark:border-white/10 dark:bg-white/[0.02]">
                <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">Total (excl GST)</p>
                <p class="mt-0.5 text-sm font-semibold text-foreground">{{ formatCurrency(gstTotals.exclGst) }}</p>
              </div>
              <div class="rounded-lg border border-primary-100/80 bg-white/70 px-3 py-2 dark:border-white/10 dark:bg-white/[0.02]">
                <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">GST (10%)</p>
                <p class="mt-0.5 text-sm font-semibold text-foreground">{{ formatCurrency(gstTotals.gst) }}</p>
              </div>
              <div class="rounded-lg border border-primary-200 bg-primary-100/70 px-3 py-2 dark:border-white/15 dark:bg-white/[0.05]">
                <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">Total (incl GST)</p>
                <p class="mt-0.5 text-lg font-bold text-foreground">{{ formatCurrency(gstTotals.inclGst) }}</p>
              </div>
            </div>
          </div>

          <!-- Invoice table -->
          <div class="overflow-hidden rounded-xl border border-primary-100/70 bg-white/50 dark:border-white/10 dark:bg-white/[0.02]">
          <div class="overflow-x-auto">
            <table class="min-w-[960px] w-full text-sm">
              <thead class="bg-primary-50/80 text-[11px] uppercase tracking-wide text-muted dark:bg-white/[0.04]">
                <tr>
                  <th class="px-3 py-2 text-left font-semibold">Date</th>
                  <th class="px-3 py-2 text-left font-semibold">Property</th>
                  <th class="px-3 py-2 text-right font-semibold">Normal Time (excl GST)</th>
                  <th class="px-3 py-2 text-right font-semibold">Extra Time (excl GST)</th>
                  <th class="px-3 py-2 text-right font-semibold">Linen (excl GST)</th>
                  <th class="px-3 py-2 text-right font-semibold">Amenities (excl GST)</th>
                  <th class="px-3 py-2 text-right font-semibold">Pack Fee</th>
                  <th class="px-3 py-2 text-right font-semibold">Total (excl GST)</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, rowIndex) in preview.rows"
                  :key="`${row.date}:${row.propertyName}:${rowIndex}`"
                  class="border-t border-primary-100/50 text-foreground transition hover:bg-primary-50/40 dark:border-white/10 dark:hover:bg-white/[0.02]"
                >
                  <td class="whitespace-nowrap px-3 py-2 text-sm">
                    <div class="flex flex-col leading-tight">
                      <span>{{ formatDateDocument(row.date) }}</span>
                      <span class="mt-0.5 text-[10px] font-medium text-muted">{{ formatWeekday(row.date) }}</span>
                    </div>
                  </td>
                  <td class="px-3 py-2 font-medium">{{ row.propertyName }}</td>
                  <td class="px-3 py-2 text-right font-medium tabular-nums">
                    <div class="flex flex-col items-end leading-tight">
                      <span>{{ formatCurrency(row.cleanRateExclGst) }}</span>
                      <span class="mt-0.5 text-[10px] font-medium text-muted">{{ row.normalMinutes }} min / {{ formatMinutesToHours(row.normalMinutes) }} h</span>
                    </div>
                  </td>
                  <td class="px-3 py-2 text-right font-medium tabular-nums">
                    <div class="flex flex-col items-end leading-tight">
                      <span>{{ formatCurrency(row.extraTimeExclGst) }}</span>
                      <span class="mt-0.5 text-[10px] font-medium text-muted">{{ row.extraMinutes }} min / {{ formatMinutesToHours(row.extraMinutes) }} h</span>
                    </div>
                  </td>
                  <td class="px-3 py-2 text-right font-medium tabular-nums">{{ formatCurrency(row.linenExclGst) }}</td>
                  <td class="px-3 py-2 text-right font-medium tabular-nums">{{ formatCurrency(row.amenitiesExclGst) }}</td>
                  <td class="px-3 py-2 text-right font-medium tabular-nums">{{ formatCurrency(row.totalPackFeeApplied) }}</td>
                  <td class="px-3 py-2 text-right font-semibold tabular-nums">{{ formatCurrency(row.totalExclGst) }}</td>
                </tr>
              </tbody>
              <tfoot class="border-t border-primary-200/70 bg-primary-50/80 text-foreground dark:border-white/10 dark:bg-white/[0.05]">
                <tr>
                  <td class="px-3 py-2 text-sm font-semibold text-muted" colspan="7">Subtotal (excl GST)</td>
                  <td class="px-3 py-2 text-right font-semibold tabular-nums">{{ formatCurrency(gstTotals.exclGst) }}</td>
                </tr>
                <tr class="border-t border-primary-100/50 dark:border-white/[0.06]">
                  <td class="px-3 py-2 text-sm font-semibold text-muted" colspan="7">GST (10%)</td>
                  <td class="px-3 py-2 text-right font-semibold tabular-nums">{{ formatCurrency(gstTotals.gst) }}</td>
                </tr>
                <tr class="border-t border-primary-200/70 dark:border-white/10">
                  <td class="px-3 py-3 text-sm font-bold text-foreground" colspan="7">Total (incl GST)</td>
                  <td class="px-3 py-3 text-right text-base font-bold tabular-nums text-foreground">{{ formatCurrency(gstTotals.inclGst) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        </div>
      </template>
    </section>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { definePageMeta, navigateTo, useState } from '#imports'
import { onBeforeRouteLeave } from 'vue-router'
import type { ClientInvoiceFilterOption, ClientInvoicePreview } from '../../composables/useClientInvoices'
import { useAuth } from '../../composables/useAuth'
import { useClientInvoices } from '../../composables/useClientInvoices'

definePageMeta({
  name: 'admin-invoices',
})

interface InvoiceFilters {
  startDate: string
  endDate: string
  clientId: string
}

interface PersistedInvoicePageState {
  filters: InvoiceFilters
  invoiceNumber: string
  preview: ClientInvoicePreview | null
  lastUpdatedAt: string | null
  scrollY: number
}

const COMPANY_ABN = '16 664 644 571'

const { signOut } = useAuth()
const { getInvoiceClients, getClientInvoicePreview } = useClientInvoices()

const defaultFilters = (): InvoiceFilters => ({
  startDate: startOfWeekMonday(todayIsoDate()),
  endDate: addDaysIso(startOfWeekMonday(todayIsoDate()), 6),
  clientId: '',
})

const persistedInvoicePageState = useState<PersistedInvoicePageState>('admin-invoices-page-state', () => ({
  filters: defaultFilters(),
  invoiceNumber: '',
  preview: null,
  lastUpdatedAt: null,
  scrollY: 0,
}))

const filters = reactive<InvoiceFilters>({
  ...persistedInvoicePageState.value.filters,
})

const clientOptions = ref<ClientInvoiceFilterOption[]>([])
const preview = ref<ClientInvoicePreview | null>(persistedInvoicePageState.value.preview)
const lastUpdatedAt = ref<string | null>(persistedInvoicePageState.value.lastUpdatedAt)
const pageError = ref('')
const invoiceNumber = ref(persistedInvoicePageState.value.invoiceNumber)
const isLoadingClients = ref(false)
const isLoadingPreview = ref(false)
const isExportingPdf = ref(false)
const isExportingExcel = ref(false)

const weekRangeLabel = computed(() => {
  const start = parseIsoDate(filters.startDate)
  const end = parseIsoDate(filters.endDate)

  const startLabel = start.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
  const endLabel = end.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })

  return `${startLabel} – ${endLabel}`
})

const canGeneratePreview = computed(() => Boolean(filters.clientId))

const gstTotals = computed(() => {
  const exclGst = preview.value?.totalInvoiceAmount ?? 0
  const gst = Number((exclGst * 0.1).toFixed(2))
  const inclGst = Number((exclGst + gst).toFixed(2))
  return { exclGst, gst, inclGst }
})

const invoiceHoursFromRows = computed(() => {
  if (!preview.value) {
    return 0
  }

  const total = preview.value.rows.reduce((acc, row) => acc + row.invoiceHours, 0)
  return Number(total.toFixed(2))
})

const canExport = computed(() => preview.value !== null && preview.value.rows.length > 0)

onMounted(async () => {
  await loadClientOptions()

  if (import.meta.client) {
    await nextTick()
    requestAnimationFrame(() => {
      window.scrollTo({
        top: persistedInvoicePageState.value.scrollY,
        behavior: 'auto',
      })
    })
  }
})

watch(
  () => ({ ...filters }),
  (nextFilters) => {
    persistedInvoicePageState.value.filters = { ...nextFilters }
  },
  { deep: true },
)

watch(invoiceNumber, (value) => {
  persistedInvoicePageState.value.invoiceNumber = value
})

watch(preview, (value) => {
  persistedInvoicePageState.value.preview = value
}, { deep: true })

watch(lastUpdatedAt, (value) => {
  persistedInvoicePageState.value.lastUpdatedAt = value
})

onBeforeRouteLeave(() => {
  if (import.meta.client) {
    persistedInvoicePageState.value.scrollY = window.scrollY
  }
})

async function loadClientOptions(): Promise<void> {
  isLoadingClients.value = true
  pageError.value = ''

  try {
    clientOptions.value = await getInvoiceClients()
  } catch (error) {
    pageError.value = toErrorMessage(error, 'Failed to load clients.')
  } finally {
    isLoadingClients.value = false
  }
}

function goToPreviousWeek(): void {
  setWeekFromStart(addDaysIso(filters.startDate, -7))
}

function goToCurrentWeek(): void {
  setWeekFromStart(todayIsoDate())
}

function goToNextWeek(): void {
  setWeekFromStart(addDaysIso(filters.startDate, 7))
}

function onStartDateChange(): void {
  setWeekFromStart(filters.startDate)
}

function setWeekFromStart(value: string): void {
  const monday = startOfWeekMonday(value)
  filters.startDate = monday
  filters.endDate = addDaysIso(monday, 6)
}

async function onGeneratePreview(): Promise<void> {
  if (!canGeneratePreview.value || isLoadingClients.value) {
    return
  }

  isLoadingPreview.value = true
  pageError.value = ''

  try {
    preview.value = await getClientInvoicePreview(filters.startDate, filters.endDate, filters.clientId)
    lastUpdatedAt.value = new Date().toISOString()
  } catch (error) {
    pageError.value = toErrorMessage(error, 'Unable to generate invoice preview.')
    preview.value = null
  } finally {
    isLoadingPreview.value = false
  }
}

function onClearFilters(): void {
  setWeekFromStart(todayIsoDate())
  filters.clientId = ''
  invoiceNumber.value = ''
  preview.value = null
  lastUpdatedAt.value = new Date().toISOString()
  pageError.value = ''
  persistedInvoicePageState.value.filters = defaultFilters()
  persistedInvoicePageState.value.invoiceNumber = ''
  persistedInvoicePageState.value.preview = null
  persistedInvoicePageState.value.lastUpdatedAt = lastUpdatedAt.value
  persistedInvoicePageState.value.scrollY = 0
}

async function onExportPdf(): Promise<void> {
  if (!canExport.value || isExportingPdf.value || !preview.value) {
    return
  }

  isExportingPdf.value = true
  pageError.value = ''

  try {
    const { jsPDF } = await import('jspdf')
    const logoDataUrl = await loadPublicImageAsDataUrl('/logo/logo_escrito_transparente.png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 14
    const contentWidth = pageWidth - margin * 2
    const invoiceDate = todayIsoDate()
    const dueDate = addDaysIso(preview.value.periodEnd, 7)
    const invoiceNo = invoiceNumber.value.trim()
    const abn = COMPANY_ABN

    const columns = [
      { title: 'Date', width: 19, align: 'left' as const },
      { title: 'Property Name', width: 31, align: 'left' as const },
      { title: 'Normal Time (excl GST)', width: 24, align: 'right' as const },
      { title: 'Extra Time (excl GST)', width: 21, align: 'right' as const },
      { title: 'Linen (excl GST)', width: 18, align: 'right' as const },
      { title: 'Amenities (excl GST)', width: 20, align: 'right' as const },
      { title: 'Total (excl GST)', width: 21, align: 'right' as const },
    ]

    function drawPageHeader(): number {
      const y = margin
      const blockHeight = 24
      const logoBlockWidth = 68
      const metaBlockX = margin + logoBlockWidth + 4
      const metaBlockWidth = contentWidth - logoBlockWidth - 4

      pdf.setDrawColor(220, 226, 234)
      pdf.setFillColor(249, 250, 251)
      pdf.roundedRect(margin, y, logoBlockWidth, blockHeight, 2, 2, 'FD')
      pdf.roundedRect(metaBlockX, y, metaBlockWidth, blockHeight, 2, 2, 'FD')

      if (logoDataUrl) {
        pdf.addImage(logoDataUrl, 'PNG', margin + 6, y + 6, 56, 12)
      }

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(16)
      pdf.text('INVOICE', metaBlockX + metaBlockWidth - 4, y + 6.4, { align: 'right' })

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(7.8)
      pdf.text('To', metaBlockX + 3, y + 11)
      pdf.text('Date', metaBlockX + 3, y + 15)
      pdf.text('Due Date', metaBlockX + 3, y + 19)
      pdf.text('Invoice #', metaBlockX + 58, y + 15)
      pdf.text('ABN', metaBlockX + 58, y + 19)

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(10.2)
      pdf.text(preview.value?.clientName ?? '-', metaBlockX + 16, y + 11)

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8.2)
      pdf.text(formatDateDocument(invoiceDate), metaBlockX + 16, y + 15)
      pdf.text(formatDateDocument(dueDate), metaBlockX + 16, y + 19)
      pdf.text(invoiceNo || '', metaBlockX + 75, y + 15)
      pdf.text(abn, metaBlockX + 75, y + 19)

      return y + blockHeight + 3
    }

    function drawTableHeader(y: number): number {
      pdf.setFillColor(238, 242, 247)
      pdf.setDrawColor(211, 219, 229)
      pdf.rect(margin, y, contentWidth, 9, 'FD')

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(7.2)

      let x = margin
      columns.forEach((column) => {
        const safeLabel = pdf.splitTextToSize(column.title, column.width - 2.6)[0] ?? ''
        const textX = x + 1.3
        pdf.text(safeLabel, textX, y + 5.7, { align: 'left' })
        x += column.width
      })

      return y + 9
    }

    function drawTableRow(y: number, row: ClientInvoicePreview['rows'][number], index: number): number {
      const rowHeight = 10

      if (index % 2 === 1) {
        pdf.setFillColor(252, 253, 255)
        pdf.rect(margin, y, contentWidth, rowHeight, 'F')
      }

      pdf.setDrawColor(234, 238, 243)
      pdf.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight)

      const cells = [
        formatDateDocument(row.date),
        row.propertyName,
        formatCurrency(row.cleanRateExclGst),
        formatCurrency(row.extraTimeExclGst),
        formatCurrency(row.linenExclGst),
        formatCurrency(row.amenitiesExclGst),
        formatCurrency(row.totalExclGst),
      ]

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8.2)

      let x = margin
      cells.forEach((cell, cellIndex) => {
        const column = columns[cellIndex]
        if (!column) {
          return
        }

        const textX = column.align === 'right' ? x + column.width - 1.5 : x + 1.5
        const safeValue = column.align === 'left'
          ? pdf.splitTextToSize(cell, column.width - 3)[0] ?? ''
          : cell
        pdf.text(safeValue, textX, y + 3.9, { align: column.align })

        if (cellIndex === 2) {
          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(6.8)
          pdf.setTextColor(108, 117, 125)
          const detail = `${row.normalMinutes} min / ${formatMinutesToHours(row.normalMinutes)} h`
          pdf.text(detail, x + column.width - 1.5, y + 7.6, { align: 'right' })
          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(8.2)
          pdf.setTextColor(0, 0, 0)
        }

        if (cellIndex === 3) {
          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(6.8)
          pdf.setTextColor(108, 117, 125)
          const detail = `${row.extraMinutes} min / ${formatMinutesToHours(row.extraMinutes)} h`
          pdf.text(detail, x + column.width - 1.5, y + 7.6, { align: 'right' })
          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(8.2)
          pdf.setTextColor(0, 0, 0)
        }

        x += column.width
      })

      return y + rowHeight
    }

    let cursorY = drawPageHeader()
    cursorY = drawTableHeader(cursorY)

    preview.value.rows.forEach((row, index) => {
      if (cursorY + 10 > pageHeight - margin - 26) {
        pdf.addPage()
        cursorY = drawPageHeader()
        cursorY = drawTableHeader(cursorY)
      }

      cursorY = drawTableRow(cursorY, row, index)
    })

    if (cursorY + 26 > pageHeight - margin) {
      pdf.addPage()
      cursorY = drawPageHeader()
    }

    const totalsLabelX = margin + contentWidth - 58
    const totalsValueX = margin + contentWidth - 2

    pdf.setDrawColor(211, 219, 229)
    pdf.roundedRect(totalsLabelX - 5, cursorY + 4, 63, 22, 1.5, 1.5, 'S')

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.text('Total (excl GST)', totalsLabelX, cursorY + 9)
    pdf.text('GST (10%)', totalsLabelX, cursorY + 15)

    pdf.setFont('helvetica', 'bold')
    pdf.text('Total (incl GST)', totalsLabelX, cursorY + 21)

    pdf.setFont('helvetica', 'normal')
    pdf.text(formatCurrency(gstTotals.value.exclGst), totalsValueX, cursorY + 9, { align: 'right' })
    pdf.text(formatCurrency(gstTotals.value.gst), totalsValueX, cursorY + 15, { align: 'right' })

    pdf.setFont('helvetica', 'bold')
    pdf.text(formatCurrency(gstTotals.value.inclGst), totalsValueX, cursorY + 21, { align: 'right' })

    const name = sanitizeForFilename(preview.value.clientName)
    pdf.save(`invoice-${name}-${filters.startDate}-${filters.endDate}.pdf`)
  } catch (error: unknown) {
    pageError.value = toErrorMessage(error, 'Failed to export PDF.')
  } finally {
    isExportingPdf.value = false
  }
}

async function onExportExcel(): Promise<void> {
  if (!canExport.value || isExportingExcel.value || !preview.value) {
    return
  }

  isExportingExcel.value = true
  pageError.value = ''

  try {
    const ExcelJSImport = await import('exceljs')
    const ExcelJS = (ExcelJSImport.default ?? ExcelJSImport) as typeof import('exceljs')
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Invoice')
    worksheet.properties.defaultRowHeight = 20

    worksheet.columns = [
      { width: 16 },
      { width: 30 },
      { width: 20 },
      { width: 20 },
      { width: 18 },
      { width: 20 },
      { width: 20 },
    ]

    const logoDataUrl = await loadPublicImageAsDataUrl('/logo/logo_escrito_transparente.png')
    if (logoDataUrl) {
      const logoImageId = workbook.addImage({
        base64: logoDataUrl,
        extension: 'png',
      })

      worksheet.mergeCells('A1:B4')
      worksheet.addImage(logoImageId, 'A1:B4')
    }

    worksheet.mergeCells('D1:G1')
    worksheet.getCell('D1').value = 'INVOICE'
    worksheet.getCell('D1').font = { bold: true, size: 16, color: { argb: 'FF0F172A' } }
    worksheet.getCell('D1').alignment = { horizontal: 'right', vertical: 'middle' }

    worksheet.mergeCells('D2:G2')
    worksheet.getCell('D2').value = `To: ${preview.value.clientName}`
    worksheet.getCell('D2').font = { size: 11, color: { argb: 'FF334155' } }
    worksheet.getCell('D2').alignment = { horizontal: 'left', vertical: 'middle' }

    worksheet.getCell('D3').value = 'Date'
    worksheet.getCell('E3').value = parseIsoDate(todayIsoDate())
    worksheet.getCell('E3').numFmt = 'dd/mm/yyyy'
    worksheet.getCell('F3').value = 'Due Date'
    worksheet.getCell('G3').value = parseIsoDate(addDaysIso(preview.value.periodEnd, 7))
    worksheet.getCell('G3').numFmt = 'dd/mm/yyyy'
    worksheet.getCell('D4').value = 'Invoice #'
    worksheet.getCell('E4').value = invoiceNumber.value.trim()
    worksheet.getCell('F4').value = 'ABN'
    worksheet.getCell('G4').value = COMPANY_ABN

    ;['D3', 'F3', 'D4', 'F4'].forEach((cellRef) => {
      worksheet.getCell(cellRef).font = { bold: true, size: 10.5, color: { argb: 'FF334155' } }
    })

    ;['E3', 'G3', 'E4', 'G4'].forEach((cellRef) => {
      worksheet.getCell(cellRef).font = { size: 10.5, color: { argb: 'FF1E293B' } }
    })

    for (let row = 1; row <= 4; row += 1) {
      for (let col = 1; col <= 7; col += 1) {
        const cell = worksheet.getCell(row, col)
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        }
      }
    }

    worksheet.getRow(1).height = 22
    worksheet.getRow(2).height = 18
    worksheet.getRow(3).height = 18
    worksheet.getRow(4).height = 18

    const tableHeaderRowNumber = 6
    const headerRow = worksheet.getRow(tableHeaderRowNumber)
    headerRow.values = [
      'Date',
      'Property Name',
      'Normal Time (excl GST)',
      'Extra Time (excl GST)',
      'Linen (excl GST)',
      'Amenities (excl GST)',
      'Total (excl GST)',
    ]

    headerRow.height = 22
    headerRow.font = { bold: true, size: 10.5 }
    headerRow.eachCell((cell) => {
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

    worksheet.views = [{ state: 'frozen', ySplit: tableHeaderRowNumber }]

    let currentRow = tableHeaderRowNumber + 1

    preview.value.rows.forEach((row, index) => {
      const dataRow = worksheet.getRow(currentRow)
      dataRow.values = [
        parseIsoDate(row.date),
        row.propertyName,
        row.cleanRateExclGst,
        row.extraTimeExclGst,
        row.linenExclGst,
        row.amenitiesExclGst,
        row.totalExclGst,
      ]

      dataRow.getCell(1).numFmt = 'dd/mm/yyyy'
      dataRow.getCell(3).numFmt = '$#,##0.00'
      dataRow.getCell(4).numFmt = '$#,##0.00'
      dataRow.getCell(5).numFmt = '$#,##0.00'
      dataRow.getCell(6).numFmt = '$#,##0.00'
      dataRow.getCell(7).numFmt = '$#,##0.00'

      const isEvenRow = index % 2 === 1
      dataRow.eachCell((cell) => {
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
      })

      dataRow.getCell(3).alignment = { horizontal: 'right' }
      dataRow.getCell(4).alignment = { horizontal: 'right' }
      dataRow.getCell(5).alignment = { horizontal: 'right' }
      dataRow.getCell(6).alignment = { horizontal: 'right' }
      dataRow.getCell(7).alignment = { horizontal: 'right' }

      currentRow += 1
    })

    const subtotalRow = worksheet.getRow(currentRow + 1)
    subtotalRow.values = ['', '', '', '', '', 'Total (excl GST)', gstTotals.value.exclGst]
    const gstRow = worksheet.getRow(currentRow + 2)
    gstRow.values = ['', '', '', '', '', 'GST (10%)', gstTotals.value.gst]
    const totalRow = worksheet.getRow(currentRow + 3)
    totalRow.values = ['', '', '', '', '', 'Total (incl GST)', gstTotals.value.inclGst]

    subtotalRow.getCell(7).numFmt = '$#,##0.00'
    gstRow.getCell(7).numFmt = '$#,##0.00'
    totalRow.getCell(7).numFmt = '$#,##0.00'

    ;[subtotalRow, gstRow, totalRow].forEach((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        }
      })
      row.getCell(6).alignment = { horizontal: 'right' }
      row.getCell(7).alignment = { horizontal: 'right' }
    })

    subtotalRow.getCell(6).font = { bold: true }
    gstRow.getCell(6).font = { bold: true }
    totalRow.getCell(6).font = { bold: true, size: 11 }
    totalRow.getCell(7).font = { bold: true, size: 11 }
    totalRow.getCell(6).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' },
    }
    totalRow.getCell(7).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' },
    }

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([
      buffer,
    ], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `invoice-${sanitizeForFilename(preview.value.clientName)}-${filters.startDate}-${filters.endDate}.xlsx`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  } catch (error: unknown) {
    pageError.value = toErrorMessage(error, 'Failed to export Excel.')
  } finally {
    isExportingExcel.value = false
  }
}

// --- date utilities (matching hours-summary pattern) ---

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

function todayIsoDate(): string {
  return toIsoDate(new Date())
}

// --- formatting ---

function formatDate(value: string): string {
  if (!value) {
    return '—'
  }

  const parsed = parseIsoDate(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

function formatDateDocument(value: string): string {
  if (!value) {
    return ''
  }

  const parsed = parseIsoDate(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  const day = String(parsed.getDate()).padStart(2, '0')
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const year = parsed.getFullYear()
  return `${day}/${month}/${year}`
}

function formatWeekday(value: string): string {
  if (!value) {
    return ''
  }

  const parsed = parseIsoDate(value)
  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  return parsed.toLocaleDateString('en-US', {
    weekday: 'long',
  })
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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatMinutesToHours(minutes: number): string {
  return (Math.max(0, Number(minutes) || 0) / 60).toFixed(2)
}

function sanitizeForFilename(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

async function loadPublicImageAsDataUrl(path: string): Promise<string | null> {
  try {
    const response = await fetch(path)
    if (!response.ok) {
      return null
    }

    const blob = await response.blob()
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error(`Failed to read image at ${path}.`))
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

async function onSignOut(): Promise<void> {
  await signOut()
  await navigateTo('/login')
}
</script>