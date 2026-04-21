<template>
  <NuxtLayout name="worker-layout" @signout="onSignOut">
    <section class="space-y-3">
      <div class="flex items-start justify-between gap-3">
        <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-primary-600">Worker</p>
        <h2 class="mt-1 text-2xl font-semibold text-foreground">Invoice</h2>
        </div>

        <button v-if="!isEditorOpen" type="button" class="btn-primary !px-3 !py-1.5 text-xs" @click="openNewInvoice">
          New
        </button>
        <button v-else type="button" class="btn-outline !px-3 !py-1.5 text-xs" @click="closeEditor">
          Back to table
        </button>
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

      <article v-if="!isEditorOpen" class="rounded-xl border border-primary-100 bg-primary-50/40 p-2 text-xs dark:border-white/10 dark:bg-white/[0.03]">
        <div class="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 class="text-sm font-semibold text-foreground">Saved invoices</h3>
          </div>
        </div>

        <label class="mt-1.5 block text-xs text-muted">
          Search invoice number
          <input v-model="historySearch" type="text" inputmode="numeric" class="input-base mt-1 !py-1.5 text-xs" placeholder="e.g. 1042">
        </label>

        <div class="mt-1.5 max-h-[560px] overflow-auto rounded-lg border border-border/80 bg-surface/80 p-1.5 dark:bg-white/[0.02]">
          <p v-if="isLoadingHistory" class="p-2 text-xs text-muted">Loading history...</p>

          <div v-if="!isLoadingHistory && filteredHistoryInvoices.length > 0" class="space-y-1.5 md:hidden">
            <article
              v-for="invoice in filteredHistoryInvoices"
              :key="`mobile-${invoice.id}`"
              class="rounded-lg border border-border/80 bg-white/80 p-2.5 dark:bg-white/[0.03]"
            >
              <div class="flex items-start justify-between gap-2">
                <div>
                  <p class="text-sm font-semibold text-foreground">#{{ invoice.invoice_number }}</p>
                  <p class="mt-0.5 text-[11px] text-muted">{{ formatWeekRange(invoice.week_start, invoice.week_end) }}</p>
                  <p class="mt-0.5 text-[11px] text-muted">{{ invoice.recipient_name || 'Recipient not set' }}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-semibold text-foreground">{{ toCurrency(invoice.manual_invoice_amount) }}</p>
                  <span class="mt-1 inline-flex rounded-full px-1.5 py-0.5 text-[10px]" :class="invoice.status === 'sent' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'">
                    {{ invoice.status }}
                  </span>
                </div>
              </div>

              <div class="mt-1.5 grid grid-cols-2 gap-1">
                <button type="button" class="btn-outline !px-2 !py-0.5 text-[11px]" @click="editFromTable(invoice)">Edit</button>
                <button type="button" class="btn-outline !px-2 !py-0.5 text-[11px]" @click="downloadFromTable(invoice)">PDF</button>
                <button type="button" class="btn-outline !px-2 !py-0.5 text-[11px]" @click="emailFromTable(invoice)">Email</button>
                <button type="button" class="btn-outline !px-2 !py-0.5 text-[11px] text-error-600 dark:text-error-400" @click="deleteFromTable(invoice)">Delete</button>
              </div>
            </article>
          </div>

          <table v-if="!isLoadingHistory && filteredHistoryInvoices.length > 0" class="hidden min-w-[760px] w-full text-left text-[11px] md:table">
            <thead class="sticky top-0 bg-primary-50/90 text-muted backdrop-blur dark:bg-[#111827]/90">
              <tr>
                <th class="px-2 py-1 font-semibold">Invoice</th>
                <th class="px-2 py-1 font-semibold">Week</th>
                <th class="px-2 py-1 font-semibold">Recipient</th>
                <th class="px-2 py-1 font-semibold text-right">Amount</th>
                <th class="px-2 py-1 font-semibold">Status</th>
                <th class="px-2 py-1 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="invoice in filteredHistoryInvoices" :key="invoice.id" class="border-t border-border/70">
                <td class="px-2 py-1 font-semibold text-foreground">#{{ invoice.invoice_number }}</td>
                <td class="px-2 py-1 text-muted">{{ formatWeekRange(invoice.week_start, invoice.week_end) }}</td>
                <td class="px-2 py-1 text-muted">{{ invoice.recipient_name || 'Recipient not set' }}</td>
                <td class="px-2 py-1 text-right font-medium text-foreground">{{ toCurrency(invoice.manual_invoice_amount) }}</td>
                <td class="px-2 py-1">
                  <span class="inline-flex rounded-full px-1.5 py-0.5" :class="invoice.status === 'sent' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'">
                    {{ invoice.status }}
                  </span>
                </td>
                <td class="px-2 py-1">
                  <div class="flex items-center justify-end gap-1">
                    <button type="button" class="btn-outline !px-2 !py-0.5 text-[11px]" @click="editFromTable(invoice)">Edit</button>
                    <button type="button" class="btn-outline !px-2 !py-0.5 text-[11px]" @click="downloadFromTable(invoice)">PDF</button>
                    <button type="button" class="btn-outline !px-2 !py-0.5 text-[11px]" @click="emailFromTable(invoice)">Email</button>
                    <button type="button" class="btn-outline !px-2 !py-0.5 text-[11px] text-error-600 dark:text-error-400" @click="deleteFromTable(invoice)">Delete</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <p v-if="!isLoadingHistory && filteredHistoryInvoices.length === 0" class="p-2 text-[11px] text-muted">
            No saved invoices found.
          </p>
        </div>
      </article>

      <section v-if="isEditorOpen" class="grid grid-cols-1 gap-3">
        <article class="max-h-[calc(100dvh-9rem)] overflow-y-auto rounded-xl border border-border bg-surface p-3 dark:bg-white/[0.03]">
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold text-foreground">{{ currentInvoiceId ? 'Edit invoice' : 'New invoice' }}</h3>
            <button type="button" class="btn-outline !px-2.5 !py-1 text-xs" @click="closeEditor">
              Close
            </button>
          </div>

          <form class="mt-2 grid grid-cols-1 gap-2.5" novalidate @submit.prevent="saveInvoiceDraft">
            <label class="text-xs text-muted">
              Invoice number
              <input v-model.number="form.invoiceNumber" type="text" inputmode="numeric" class="input-base mt-1 !py-1.5 text-xs" :placeholder="hasExistingInvoices ? '' : 'Enter your first invoice number'">
              <span v-if="!hasExistingInvoices" class="mt-0.5 block text-[11px] text-warning-600 dark:text-warning-400">No prior invoices found — enter your starting invoice number manually.</span>
            </label>

            <label class="text-xs text-muted">
              Selected week
              <input v-model="selectedDate" type="date" class="input-base mt-1 !py-1.5 text-xs [color-scheme:light] dark:[color-scheme:dark]">
            </label>

            <label class="text-xs text-muted">
              Recipient email
              <input v-model="form.recipientEmail" type="email" class="input-base mt-1 !py-1.5 text-xs">
            </label>

            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label class="text-xs text-muted">
                Recipient name
                <input v-model="form.recipientName" type="text" class="input-base mt-1 !py-1.5 text-xs">
              </label>

              <label class="text-xs text-muted">
                Recipient phone
                <input v-model="form.recipientPhone" type="text" class="input-base mt-1 !py-1.5 text-xs">
              </label>
            </div>

            <label class="text-xs text-muted">
              Invoice Amount (AUD)
              <input
                v-model.number="form.manual_invoice_amount"
                type="text"
                inputmode="decimal"
                class="input-base mt-1 !py-1.5 text-xs"
                :class="isAmountMissingForSave ? '!border-danger/70 !bg-danger/10 !text-danger focus:!border-danger focus:!ring-danger/30' : ''"
              >
              <p v-if="isAmountMissingForSave" class="mt-1 text-[11px] text-danger">Invoice amount is required to save.</p>
            </label>

            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label class="text-xs text-muted">
                Issue date
                <input v-model="form.issueDate" type="date" class="input-base mt-1 !py-1.5 text-xs [color-scheme:light] dark:[color-scheme:dark]">
              </label>
              <label class="text-xs text-muted">
                Due date
                <input v-model="form.dueDate" type="date" class="input-base mt-1 !py-1.5 text-xs [color-scheme:light] dark:[color-scheme:dark]" :disabled="noDueDate">
              </label>
            </div>

            <div class="flex items-center justify-between rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
              <span class="text-xs text-muted">Sem data de vencimento</span>
              <button
                type="button"
                role="switch"
                :aria-checked="noDueDate"
                :class="[
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/70',
                  noDueDate ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600',
                ]"
                @click="noDueDate = !noDueDate"
              >
                <span
                  :class="[
                    'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                    noDueDate ? 'translate-x-5' : 'translate-x-1',
                  ]"
                />
              </button>
            </div>

            <div class="rounded-lg border border-border/70 p-3">
              <button type="button" class="w-full text-left text-xs font-semibold text-muted" @click="showAdvancedFields = !showAdvancedFields">
                {{ showAdvancedFields ? 'Hide extra fields' : 'Show extra fields' }}
              </button>

              <div v-if="showAdvancedFields" class="mt-3 grid grid-cols-1 gap-3">
                <label class="text-xs text-muted">
                  Email subject
                  <input v-model="form.emailSubject" type="text" class="input-base mt-1 !py-1.5 text-xs">
                </label>

                <label class="text-xs text-muted">
                  Email body
                  <textarea v-model="form.emailBody" class="input-base mt-1 !py-1.5 text-xs" rows="8" @input="markEmailBodyCustom" />
                </label>

                <div class="flex justify-end">
                  <button type="button" class="btn-outline !px-2.5 !py-1 text-[11px]" @click="resetEmailBody">
                    Reset email body
                  </button>
                </div>

              </div>
            </div>

            <div class="grid grid-cols-1 gap-2 pt-1">
              <button type="submit" class="btn-outline w-full !px-3 !py-1.5 text-xs" :disabled="isSavingDraft">
                {{ isSavingDraft ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </form>
        </article>

        <article
        id="invoice-preview"
        class="mx-auto w-full max-w-3xl rounded-xl border border-border bg-white p-3 text-slate-900 shadow-card dark:border-white/15 sm:p-5"
      >
        <div class="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Invoice</p>
            <h3 class="mt-1 text-xl font-semibold sm:text-2xl">#{{ form.invoiceNumber }}</h3>
          </div>
          <div class="text-right text-[11px] sm:text-xs">
            <p><span class="font-medium">Issue:</span> {{ formatDate(form.issueDate) }}</p>
            <p class="mt-1"><span class="font-medium">Due:</span> {{ noDueDate ? 'No due date' : formatDate(form.dueDate) }}</p>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div class="text-xs">
            <p class="font-semibold text-slate-800">From</p>
            <p class="mt-1">{{ settings.legal_name || profile.full_name }}</p>
            <p v-if="settings.abn" class="mt-1">ABN: {{ settings.abn }}</p>
            <p v-if="settings.invoice_email" class="mt-1">{{ settings.invoice_email }}</p>
            <p v-if="settings.invoice_phone" class="mt-1">{{ settings.invoice_phone }}</p>
          </div>
          <div class="text-xs md:text-right">
            <p class="font-semibold text-slate-800">Bill To</p>
            <p class="mt-1">{{ form.recipientName || 'FreshBreeze Operations' }}</p>
            <p class="mt-1">{{ form.recipientEmail }}</p>
            <p v-if="form.recipientPhone" class="mt-1">{{ form.recipientPhone }}</p>
          </div>
        </div>

        <div class="mt-4 overflow-hidden rounded-lg border border-slate-200">
          <table class="w-full text-[11px] sm:text-xs">
            <thead class="bg-slate-100">
              <tr>
                <th class="px-3 py-2 text-left font-semibold">Description</th>
                <th class="px-3 py-2 text-right font-semibold">Qty</th>
                <th class="px-3 py-2 text-right font-semibold">Unit</th>
                <th class="px-3 py-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="px-3 py-2">Airbnb Cleaning</td>
                <td class="px-3 py-2 text-right">1</td>
                <td class="px-3 py-2 text-right">{{ toCurrency(form.manual_invoice_amount) }}</td>
                <td class="px-3 py-2 text-right">{{ toCurrency(form.manual_invoice_amount) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-4 flex justify-end">
          <div class="w-full max-w-xs rounded-lg border border-slate-200 p-3 text-xs">
            <div class="flex items-center justify-between">
              <span class="font-medium">Total</span>
              <span class="text-lg font-semibold">{{ toCurrency(form.manual_invoice_amount) }}</span>
            </div>
          </div>
        </div>

        <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div class="text-xs">
            <p class="font-semibold text-slate-800">Payment Instructions</p>
            <p class="mt-1">BSB: {{ settings.payment_bsb || 'Not set' }}</p>
            <p class="mt-1">Account: {{ settings.payment_account || 'Not set' }}</p>
          </div>

          <div class="text-xs md:text-right">
            <p class="font-semibold text-slate-800">Signature</p>
            <img
              v-if="settings.signature_data_url"
              :src="settings.signature_data_url"
              alt="Worker signature"
              class="mt-2 h-14 w-auto object-contain md:ml-auto"
            >
            <p v-else class="mt-2 text-slate-500">No signature configured</p>
          </div>
        </div>
      </article>
      </section>

      <BaseConfirmModal
        v-model="isDeleteModalOpen"
        title="Delete invoice?"
        :message="deleteModalMessage"
        confirm-label="Delete"
        cancel-label="Cancel"
        :danger="true"
        :loading="isDeletingInvoice"
        @confirm="confirmDeleteInvoice"
      />

    </section>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import jsPDF from 'jspdf'
import BaseFeedbackBanner from '../../components/ui/BaseFeedbackBanner.vue'
import BaseConfirmModal from '../../components/ui/BaseConfirmModal.vue'
import { useAuth } from '../../composables/useAuth'
import { useWorkerInvoices } from '../../composables/useWorkerInvoices'
import type { WorkerInvoiceRow } from '../../composables/useWorkerInvoices'
import { useWorkerProfileSettings } from '../../composables/useWorkerProfileSettings'
import type { WorkerProfileSettings } from '../../composables/useWorkerProfileSettings'


definePageMeta({
  name: 'worker-invoice',
})

type FeedbackTone = 'success' | 'error' | 'warning' | 'info'

const amountRequiredMessage = 'Enter an invoice amount before generating the PDF or opening the email app.'
const noDueDateMarker = '__NO_DUE_DATE__'

const { signOut, getProfile } = useAuth()
const { getSettings } = useWorkerProfileSettings()
const { createInvoice, updateInvoice, deleteInvoice, listInvoices } = useWorkerInvoices()

const selectedDate = ref(todayIsoDate())
const isSavingDraft = ref(false)
const isLoadingHistory = ref(false)
const isEditorOpen = ref(false)
const showAdvancedFields = ref(false)
const noDueDate = ref(false)
const isEmailBodyCustom = ref(false)
const amountValidationTouched = ref(false)
const historySearch = ref('')
const currentInvoiceId = ref<string | null>(null)
const isDeleteModalOpen = ref(false)
const isDeletingInvoice = ref(false)
const invoicePendingDelete = ref<WorkerInvoiceRow | null>(null)
const profile = ref({ full_name: '' })
const settings = reactive<WorkerProfileSettings>({
  id: null,
  employee_id: '',
  legal_name: '',
  abn: '',
  invoice_email: '',
  invoice_phone: '',
  payment_bsb: '',
  payment_account: '',
  hourly_rate_weekday_override: 0,
  hourly_rate_sunday_override: 0,
  hourly_rate_holiday_override: 0,
  default_recipient_name: '',
  default_recipient_email: '',
  default_recipient_phone: '',
  signature_data_url: '',
  created_at: null,
  updated_at: null,
})

const form = reactive({
  invoiceNumber: 0,
  recipientName: '',
  recipientEmail: '',
  recipientPhone: '',
  emailSubject: '',
  emailBody: '',
  manual_invoice_amount: 0,
  issueDate: todayIsoDate(),
  dueDate: todayIsoDate(),
})

const allHistoryInvoices = ref<WorkerInvoiceRow[]>([])

const feedbackTone = ref<FeedbackTone>('info')
const feedbackTitle = ref('')
const feedbackMessage = ref('')

const weekRangeLabel = computed(() => {
  const start = getStartOfWeek(parseIsoDate(selectedDate.value))
  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  const startLabel = start.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
  const endLabel = end.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })

  return `${startLabel} - ${endLabel}`
})

const filteredHistoryInvoices = computed(() => {
  const invoiceSearch = historySearch.value.trim()

  if (!invoiceSearch) {
    return allHistoryInvoices.value
  }

  return allHistoryInvoices.value.filter((invoice) => String(invoice.invoice_number).includes(invoiceSearch))
})

const nextInvoiceNumber = computed(() => {
  if (allHistoryInvoices.value.length === 0) return 0
  const highest = allHistoryInvoices.value.reduce((max, invoice) => Math.max(max, invoice.invoice_number), 0)
  return highest + 1
})

const hasExistingInvoices = computed(() => allHistoryInvoices.value.length > 0)
const isAmountMissingForSave = computed(() => amountValidationTouched.value && (!Number.isFinite(form.manual_invoice_amount) || form.manual_invoice_amount <= 0))
const deleteModalMessage = computed(() => {
  const pending = invoicePendingDelete.value
  if (!pending) {
    return 'Are you sure you want to delete INVOICE? This action cannot be undone.'
  }

  return `Are you sure you want to delete INVOICE #${pending.invoice_number}? This action cannot be undone.`
})

onMounted(async () => {
  await loadBase()
})

watch(selectedDate, () => {
  form.emailSubject = buildDefaultEmailSubject()
  syncEmailBodyIfDefault()
})

watch(
  () => form.issueDate,
  () => {
    if (noDueDate.value) {
      form.dueDate = form.issueDate
    }

    syncEmailBodyIfDefault()
  },
)

watch(noDueDate, (enabled) => {
  if (enabled) {
    form.dueDate = form.issueDate
  }

  syncEmailBodyIfDefault()
})

watch(
  [
    () => form.manual_invoice_amount,
    () => form.dueDate,
    () => form.invoiceNumber,
    () => form.recipientName,
  ],
  () => {
    if (Number.isFinite(form.manual_invoice_amount) && form.manual_invoice_amount > 0) {
      amountValidationTouched.value = false
    }

    syncEmailBodyIfDefault()
  },
)

async function loadBase(): Promise<void> {
  try {
    clearFeedback()
    const [loadedProfile, loadedSettings] = await Promise.all([getProfile(), getSettings()])
    profile.value.full_name = loadedProfile.full_name

    Object.assign(settings, loadedSettings)

    form.recipientEmail = loadedSettings.default_recipient_email || loadedSettings.invoice_email || loadedProfile.email
    form.recipientName = loadedSettings.default_recipient_name || loadedSettings.legal_name || loadedProfile.full_name
    form.recipientPhone = loadedSettings.default_recipient_phone || loadedSettings.invoice_phone || ''
    isEmailBodyCustom.value = false
    form.manual_invoice_amount = 0

    const dueDate = parseIsoDate(form.issueDate)
    dueDate.setDate(dueDate.getDate() + 7)
    form.dueDate = formatDateForInput(dueDate)

    await refreshHistoryInvoices()

    // Invoice number: use last saved + 1, or leave 0 to signal first entry
    form.invoiceNumber = nextInvoiceNumber.value
    form.emailSubject = buildDefaultEmailSubject()
    form.emailBody = buildDefaultEmailBody()
  } catch (error: unknown) {
    setFeedback('error', 'Invoice unavailable', error instanceof Error ? error.message : 'Failed to load invoice module.')
  }
}

function openNewInvoice(): void {
  clearFeedback()
  currentInvoiceId.value = null
  showAdvancedFields.value = false
  noDueDate.value = false
  selectedDate.value = todayIsoDate()
  form.invoiceNumber = nextInvoiceNumber.value
  form.recipientEmail = settings.default_recipient_email || settings.invoice_email || form.recipientEmail
  form.recipientName = settings.default_recipient_name || settings.legal_name || profile.value.full_name
  form.recipientPhone = settings.default_recipient_phone || settings.invoice_phone || ''
  form.emailSubject = buildDefaultEmailSubject()
  form.emailBody = buildDefaultEmailBody()
  isEmailBodyCustom.value = false
  form.manual_invoice_amount = 0
  form.issueDate = todayIsoDate()

  const dueDate = parseIsoDate(form.issueDate)
  dueDate.setDate(dueDate.getDate() + 7)
  form.dueDate = formatDateForInput(dueDate)

  isEditorOpen.value = true
}

function applyInvoiceToForm(invoice: WorkerInvoiceRow): void {
  currentInvoiceId.value = invoice.id
  form.invoiceNumber = invoice.invoice_number
  form.recipientName = invoice.recipient_name || form.recipientName
  form.recipientEmail = invoice.recipient_email
  form.recipientPhone = invoice.recipient_phone || ''
  form.emailSubject = invoice.email_subject
  form.emailBody = invoice.email_body || buildDefaultEmailBody()
  isEmailBodyCustom.value = Boolean(invoice.email_body)
  noDueDate.value = hasNoDueDateFlag(invoice.notes)
  form.manual_invoice_amount = invoice.manual_invoice_amount
  form.issueDate = invoice.issue_date
  form.dueDate = invoice.due_date
}

async function refreshHistoryInvoices(): Promise<void> {
  isLoadingHistory.value = true

  try {
    allHistoryInvoices.value = await listInvoices()
  } finally {
    isLoadingHistory.value = false
  }
}

async function saveInvoiceDraft(): Promise<void> {
  try {
    isSavingDraft.value = true
    amountValidationTouched.value = true

    validateDraftForm()

    const weekStart = formatDateForInput(getStartOfWeek(parseIsoDate(selectedDate.value)))
    const weekEnd = parseIsoDate(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    let invoice: WorkerInvoiceRow

    if (currentInvoiceId.value) {
      // Update existing invoice
      invoice = await updateInvoice(currentInvoiceId.value, {
        invoice_number: form.invoiceNumber,
        recipient_name: form.recipientName,
        recipient_email: form.recipientEmail,
        recipient_phone: form.recipientPhone,
        email_subject: form.emailSubject,
        email_body: form.emailBody,
        notes: getPersistedNotes(),
        issue_date: form.issueDate,
        due_date: getPersistedDueDate(),
        manual_invoice_amount: form.manual_invoice_amount,
      })
    } else {
      // Create new invoice
      invoice = await createInvoice({
        week_start: weekStart,
        week_end: formatDateForInput(weekEnd),
        invoice_number: form.invoiceNumber,
        recipient_name: form.recipientName,
        recipient_email: form.recipientEmail,
        recipient_phone: form.recipientPhone,
        email_subject: form.emailSubject,
        email_body: form.emailBody,
        notes: getPersistedNotes(),
        issue_date: form.issueDate,
        due_date: getPersistedDueDate(),
        manual_invoice_amount: form.manual_invoice_amount,
        line_description: 'Cleaning Services',
      })
      currentInvoiceId.value = invoice.id
    }

    setFeedback('success', 'Saved', `Invoice #${invoice.invoice_number} saved successfully.`)
    await refreshHistoryInvoices()
    isEditorOpen.value = false
  } catch (error: unknown) {
    setFeedback('error', 'Save failed', error instanceof Error ? error.message : 'Could not save invoice draft.')
  } finally {
    isSavingDraft.value = false
  }
}

function selectHistoryInvoice(invoice: WorkerInvoiceRow): void {
  currentInvoiceId.value = invoice.id
  selectedDate.value = invoice.week_start
  applyInvoiceToForm(invoice)
}

function editFromTable(invoice: WorkerInvoiceRow): void {
  clearFeedback()
  showAdvancedFields.value = false
  isEditorOpen.value = true
  selectHistoryInvoice(invoice)
}

async function downloadFromTable(invoice: WorkerInvoiceRow): Promise<void> {
  selectHistoryInvoice(invoice)
  await downloadPdf()
}

async function emailFromTable(invoice: WorkerInvoiceRow): Promise<void> {
  selectHistoryInvoice(invoice)
  await openInEmailApp()
}

async function deleteFromTable(invoice: WorkerInvoiceRow): Promise<void> {
  invoicePendingDelete.value = invoice
  isDeleteModalOpen.value = true
}

async function confirmDeleteInvoice(): Promise<void> {
  const invoice = invoicePendingDelete.value
  if (!invoice) {
    isDeleteModalOpen.value = false
    return
  }

  try {
    isDeletingInvoice.value = true
    await deleteInvoice(invoice.id)

    if (currentInvoiceId.value === invoice.id) {
      currentInvoiceId.value = null
      isEditorOpen.value = false
    }

    await refreshHistoryInvoices()
    setFeedback('success', 'Success', `Invoice #${invoice.invoice_number} deleted successfully.`)
    isDeleteModalOpen.value = false
    invoicePendingDelete.value = null
  } catch (error: unknown) {
    setFeedback('error', 'Delete failed', error instanceof Error ? error.message : 'Could not delete invoice.')
  } finally {
    isDeletingInvoice.value = false
  }
}

function closeEditor(): void {
  isEditorOpen.value = false
}

function markEmailBodyCustom(): void {
  isEmailBodyCustom.value = true
}

function syncEmailBodyIfDefault(): void {
  if (!isEmailBodyCustom.value) {
    form.emailBody = buildDefaultEmailBody()
  }
}

function resetEmailBody(): void {
  isEmailBodyCustom.value = false
  form.emailBody = buildDefaultEmailBody()
}

function validateForm(): void {
  validateDraftForm()

  if (!Number.isFinite(form.manual_invoice_amount) || form.manual_invoice_amount <= 0) {
    throw new Error(amountRequiredMessage)
  }
}

function validateDraftForm(): void {
  if (!Number.isFinite(form.invoiceNumber) || form.invoiceNumber <= 0) {
    throw new Error('Invoice number is required.')
  }

  if (!Number.isFinite(form.manual_invoice_amount) || form.manual_invoice_amount <= 0) {
    throw new Error('Invoice amount is required to save.')
  }

  if (!form.recipientEmail.trim()) {
    throw new Error('Recipient email is required.')
  }

  if (!form.emailSubject.trim()) {
    form.emailSubject = buildDefaultEmailSubject()
  }
}

async function ensureDraftSaved(): Promise<boolean> {
  if (currentInvoiceId.value) return true

  await saveInvoiceDraft()
  return currentInvoiceId.value !== null
}

async function buildPdfDocument(): Promise<jsPDF> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = 595
  const pageHeight = 842
  const marginLeft = 40
  const marginRight = 40
  const contentWidth = pageWidth - marginLeft - marginRight
  const providerName = settings.legal_name || profile.value.full_name || '-'

  const weekStart = getStartOfWeek(parseIsoDate(selectedDate.value))
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  const dueLabel = noDueDate.value ? 'No due date' : formatDate(form.dueDate)

  // Header
  doc.setFillColor(245, 247, 250)
  doc.rect(0, 0, pageWidth, 90, 'F')
  doc.setTextColor(31, 41, 55)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('INVOICE', marginLeft, 38)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`#${form.invoiceNumber}`, marginLeft, 54)
  doc.text(`Issue: ${formatDate(form.issueDate)}`, pageWidth - marginRight - 180, 36)
  doc.text(`Due: ${dueLabel}`, pageWidth - marginRight - 180, 52)
  doc.text(`Week: ${formatDateShort(weekStart)} - ${formatDateShort(weekEnd)}`, pageWidth - marginRight - 180, 68)

  // From / To
  const cardTop = 108
  const cardH = 116
  const halfW = (contentWidth - 12) / 2

  doc.setTextColor(51, 65, 85)
  doc.setDrawColor(220, 225, 232)
  doc.setLineWidth(0.5)
  doc.roundedRect(marginLeft, cardTop, halfW, cardH, 6, 6)
  doc.roundedRect(marginLeft + halfW + 12, cardTop, halfW, cardH, 6, 6)

  // FROM
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(107, 114, 128)
  doc.text('FROM', marginLeft + 12, cardTop + 18)
  doc.setTextColor(31, 41, 55)
  doc.setFontSize(12)
  doc.text(providerName, marginLeft + 12, cardTop + 36)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  if (settings.abn) doc.text(`ABN: ${settings.abn}`, marginLeft + 12, cardTop + 52)
  if (settings.invoice_email) doc.text(settings.invoice_email, marginLeft + 12, cardTop + 66)
  if (settings.invoice_phone) doc.text(settings.invoice_phone, marginLeft + 12, cardTop + 80)

  // TO
  const col2 = marginLeft + halfW + 24
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(107, 114, 128)
  doc.text('BILL TO', col2, cardTop + 18)
  doc.setTextColor(31, 41, 55)
  doc.setFontSize(12)
  doc.text(form.recipientName || 'FreshBreeze Operations', col2, cardTop + 36)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  if (form.recipientEmail) doc.text(form.recipientEmail, col2, cardTop + 52)
  if (form.recipientPhone) doc.text(form.recipientPhone, col2, cardTop + 66)

  // Items table
  const tableTop = cardTop + cardH + 22
  doc.setFillColor(242, 244, 247)
  doc.roundedRect(marginLeft, tableTop, contentWidth, 26, 4, 4, 'F')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(75, 85, 99)
  doc.text('DESCRIPTION', marginLeft + 10, tableTop + 17)
  doc.text('QTY', marginLeft + contentWidth - 160, tableTop + 17)
  doc.text('UNIT PRICE', marginLeft + contentWidth - 110, tableTop + 17)
  doc.text('AMOUNT', marginLeft + contentWidth - 45, tableTop + 17)

  const rowTop = tableTop + 28
  doc.setDrawColor(220, 225, 232)
  doc.setLineWidth(0.5)
  doc.roundedRect(marginLeft, rowTop, contentWidth, 38, 4, 4)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(31, 41, 55)
  doc.text('Airbnb Cleaning Services', marginLeft + 10, rowTop + 24)
  doc.text('1', marginLeft + contentWidth - 155, rowTop + 24)
  doc.text(toCurrency(form.manual_invoice_amount), marginLeft + contentWidth - 115, rowTop + 24)
  doc.text(toCurrency(form.manual_invoice_amount), marginLeft + contentWidth - 50, rowTop + 24)

  // Totals
  const totalsTop = rowTop + 38 + 14
  const totalsX = marginLeft + contentWidth - 200
  doc.setDrawColor(220, 225, 232)
  doc.setLineWidth(0.5)
  doc.line(totalsX, totalsTop, marginLeft + contentWidth, totalsTop)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(75, 85, 99)
  doc.text('Subtotal', totalsX + 4, totalsTop + 17)
  doc.text(toCurrency(form.manual_invoice_amount), marginLeft + contentWidth - 50, totalsTop + 17)
  doc.text('Total', totalsX + 4, totalsTop + 38)
  doc.text(toCurrency(form.manual_invoice_amount), marginLeft + contentWidth - 50, totalsTop + 38)
  doc.line(totalsX, totalsTop + 26, marginLeft + contentWidth, totalsTop + 26)

  // Balance due
  doc.setFillColor(240, 242, 245)
  doc.roundedRect(totalsX, totalsTop + 50, 200, 40, 6, 6, 'F')
  doc.setTextColor(31, 41, 55)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('BALANCE DUE', totalsX + 8, totalsTop + 75)
  doc.text(toCurrency(form.manual_invoice_amount), marginLeft + contentWidth - 55, totalsTop + 75)

  // Payment instructions + signature
  const payTop = totalsTop + 128
  doc.setTextColor(31, 41, 55)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Payment Instructions', marginLeft, payTop)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`BSB:     ${settings.payment_bsb || '-'}`, marginLeft, payTop + 16)
  doc.text(`Account: ${settings.payment_account || '-'}`, marginLeft, payTop + 30)

  const signatureX = marginLeft + halfW + 12
  const signatureTitleY = payTop
  const signatureLineY = payTop + 78
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(31, 41, 55)
  doc.text('Authorised Signature', signatureX, signatureTitleY)

  if (settings.signature_data_url) {
    try {
      doc.addImage(settings.signature_data_url, 'PNG', signatureX, payTop + 12, 150, 48)
    } catch {
      // Keep PDF generation resilient when signature format is unsupported.
    }
  }

  doc.setDrawColor(209, 213, 219)
  doc.setLineWidth(0.6)
  doc.line(signatureX, signatureLineY, signatureX + 180, signatureLineY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(75, 85, 99)
  doc.text(providerName, signatureX, signatureLineY + 14)

  // Footer legal text
  const legalText = 'Ao assinar esse documento, o cliente aceita os servicos e condicoes descritos nesse documento.'
  doc.setDrawColor(229, 231, 235)
  doc.setLineWidth(0.5)
  doc.line(marginLeft, pageHeight - 94, pageWidth - marginRight, pageHeight - 94)
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  doc.setFont('helvetica', 'normal')
  doc.text(legalText, marginLeft, pageHeight - 80)

  return doc
}

async function downloadPdf(): Promise<void> {
  try {
    validateForm()
    const saved = await ensureDraftSaved()
    if (!saved) {
      throw new Error('Save invoice draft before generating PDF.')
    }
    const doc = await buildPdfDocument()
    doc.save(getPdfFileName())
    setFeedback('success', 'PDF generated', 'Invoice PDF downloaded successfully.')
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Could not generate PDF.'
    if (message === amountRequiredMessage) {
      setFeedback('warning', 'Amount needed', message)
      return
    }
    setFeedback('error', 'PDF failed', message)
  }
}

function getPdfFileName(): string {
  return `invoice-${form.invoiceNumber}.pdf`
}

function buildDefaultEmailSubject(): string {
  return `Invoice #${form.invoiceNumber} - Week ${weekRangeLabel.value}`
}

function buildDefaultEmailBody(): string {
  const workerName = settings.legal_name || profile.value.full_name || 'Worker'
  const dueLabel = noDueDate.value ? 'No due date' : formatDate(form.dueDate)
  const lines = [
    'Hello,',
    '',
    `Please find attached Invoice #${form.invoiceNumber} for ${weekRangeLabel.value}.`,
    `Amount: ${toCurrency(form.manual_invoice_amount)}`,
    `Due date: ${dueLabel}`,
    '',
    'Kind regards,',
    workerName,
  ]

  return lines.join('\n')
}

function applyEmailTemplate(template: string, fallback: string): string {
  const raw = template.trim() || fallback
  const tokens: Record<string, string> = {
    invoice_number: String(form.invoiceNumber),
    week_range: weekRangeLabel.value,
    recipient_name: form.recipientName || 'Recipient',
    amount: toCurrency(form.manual_invoice_amount),
    due_date: noDueDate.value ? 'No due date' : formatDate(form.dueDate),
  }

  return raw.replace(/\{(invoice_number|week_range|recipient_name|amount|due_date)\}/g, (_, key: string) => tokens[key] ?? '')
}

function openMailtoClient(): void {
  const rawBody = form.emailBody.trim() || buildDefaultEmailBody()
  const body = applyEmailTemplate(rawBody, rawBody)
  const mailtoUrl = `mailto:${encodeURIComponent(form.recipientEmail.trim())}?subject=${encodeURIComponent(form.emailSubject.trim())}&body=${encodeURIComponent(body)}`

  if (typeof window !== 'undefined') {
    window.location.href = mailtoUrl
  }
}

async function openInEmailApp(): Promise<void> {
  try {
    validateForm()
    const saved = await ensureDraftSaved()
    if (!saved) {
      throw new Error('Save invoice draft before opening email app.')
    }

    openMailtoClient()
    setFeedback('info', 'Email app opened', 'Your email app was opened with recipient, subject and body prefilled. Attach the downloaded PDF before sending.')
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Could not open email app.'
    if (message === amountRequiredMessage) {
      setFeedback('warning', 'Amount needed', message)
      return
    }
    setFeedback('error', 'Email app failed', message)
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

function formatDate(iso: string): string {
  if (!iso) return '-'
  return parseIsoDate(iso).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '-'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateShort(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const monthMap = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const month = monthMap[date.getMonth()] || 'Jan'
  const year = date.getFullYear()
  return `${day} ${month} ${year}`
}

function formatWeekRange(startIso: string, endIso: string): string {
  return `${formatDate(startIso)} - ${formatDate(endIso)}`
}

function toCurrency(value: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0)
}

function hasNoDueDateFlag(rawNotes: string | null): boolean {
  const text = rawNotes?.trim() || ''
  return text.startsWith(noDueDateMarker)
}

function getPersistedNotes(): string | null {
  if (noDueDate.value) {
    return noDueDateMarker
  }

  return null
}

function getPersistedDueDate(): string {
  return noDueDate.value ? form.issueDate : form.dueDate
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
