<template>
  <NuxtLayout name="admin-layout" @signout="onSignOut">
    <section class="space-y-4">
      <div class="card-surface">
        <div class="action-bar">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-primary-600">Management</p>
            <h2 class="mt-1 text-2xl font-semibold text-foreground">Holidays</h2>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="btn-outline"
              @click="openDuplicateModal"
            >
              Duplicate year
            </button>

            <button
              type="button"
              class="btn-primary"
              @click="openCreateForm"
            >
              Add holiday
            </button>
          </div>
        </div>
      </div>

      <div class="overflow-x-hidden rounded-xl border border-primary-100 bg-gradient-to-r from-primary-50/60 via-surface to-primary-warm-50/60 p-3 dark:border-white/10 dark:from-[#1b2534] dark:via-[#182231] dark:to-[#212d3d]">
        <div class="space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <button type="button" class="btn-outline !px-2.5 !py-1.5 text-xs" @click="goToPreviousYear">Previous</button>

              <select
                id="holiday-year-select"
                v-model="selectedYearInput"
                class="input-base w-full max-w-[120px] !py-1 !text-xs"
                @change="applyYearFilter"
              >
                <option
                  v-for="year in yearOptions"
                  :key="year"
                  :value="String(year)"
                >
                  {{ year }}
                </option>
              </select>

              <button type="button" class="btn-outline !px-2.5 !py-1.5 text-xs" @click="goToNextYear">Next</button>
            </div>

            <div class="flex items-center gap-2">
              <div class="relative w-full max-w-xs">
                <input
                  id="holidays-search"
                  v-model="searchQuery"
                  type="text"
                  class="input-base w-full !py-1 !text-xs pr-9"
                  placeholder="Search holiday..."
                >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted">
                  <path fill-rule="evenodd" d="M10.5 3a7.5 7.5 0 1 0 4.75 13.305l4.223 4.222 1.06-1.06-4.222-4.223A7.5 7.5 0 0 0 10.5 3Zm-6 7.5a6 6 0 1 1 12 0 6 6 0 0 1-12 0Z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <p class="text-xs text-muted">Showing <span class="font-semibold text-foreground">{{ filteredHolidays.length }}</span> holiday(s) for <span class="font-semibold text-foreground">{{ selectedYear }}</span></p>
        </div>
      </div>

      <BaseFeedbackBanner
        v-if="pageError"
        tone="error"
        title="Holiday action failed"
        :message="pageError"
        floating
        dismissible
        @dismiss="pageError = ''"
      />

      <HolidayTable
        :holidays="filteredHolidays"
        :is-loading="isLoading"
        :toggling-active-ids="togglingActiveIds"
        @edit="openEditForm"
        @delete="openDeleteModal"
        @toggle-active="onToggleHolidayActive"
      />

      <Teleport to="body">
        <div
          v-if="isFormOpen"
          class="modal-backdrop"
          @click.self="closeForm"
        >
          <div class="modal-surface max-w-2xl max-h-[calc(100vh-3rem)] overflow-y-auto">
            <div class="modal-header">
              <h3 class="text-base font-semibold text-foreground">
                {{ editingHolidayId ? 'Edit holiday' : 'New holiday' }}
              </h3>
              <button type="button" class="btn-outline !px-3 !py-1.5" @click="closeForm">Close</button>
            </div>

            <div class="modal-body">
              <HolidayForm
                :holiday="selectedHoliday"
                :is-submitting="isSubmitting"
                :submit-label="editingHolidayId ? 'Update' : 'Create'"
                @submit="onSubmitForm"
                @cancel="closeForm"
              />
            </div>
          </div>
        </div>
      </Teleport>

      <Teleport to="body">
        <div
          v-if="isDuplicateModalOpen"
          class="modal-backdrop"
          @click.self="closeDuplicateModal"
        >
          <div class="modal-surface max-w-lg">
            <div class="modal-header">
              <div>
                <h3 class="text-base font-semibold text-foreground">Duplicate holidays by year</h3>
                <p class="mt-1 text-sm text-muted">Copy fixed-date holidays from one year to another. Existing target dates are skipped.</p>
              </div>
              <button type="button" class="btn-outline !px-3 !py-1.5" :disabled="isDuplicating" @click="closeDuplicateModal">Close</button>
            </div>

            <div class="modal-body">
              <form class="space-y-4" novalidate @submit.prevent="requestDuplicateYearConfirmation">
                <div class="form-section">
                  <h4 class="form-section-title">Years</h4>
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label for="duplicate-source-year" class="mb-1.5 block text-sm font-medium text-foreground">Source year</label>
                      <input
                        id="duplicate-source-year"
                        v-model="duplicateSourceYearInput"
                        type="text"
                        inputmode="numeric"
                        class="input-base"
                        placeholder="2026"
                      >
                      <p v-if="duplicateErrors.sourceYear" class="mt-1 text-xs text-error-600">{{ duplicateErrors.sourceYear }}</p>
                    </div>

                    <div>
                      <label for="duplicate-target-year" class="mb-1.5 block text-sm font-medium text-foreground">Target year</label>
                      <input
                        id="duplicate-target-year"
                        v-model="duplicateTargetYearInput"
                        type="text"
                        inputmode="numeric"
                        class="input-base"
                        placeholder="2027"
                      >
                      <p v-if="duplicateErrors.targetYear" class="mt-1 text-xs text-error-600">{{ duplicateErrors.targetYear }}</p>
                    </div>
                  </div>
                </div>

                <div class="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                  <button type="button" class="btn-outline" :disabled="isDuplicating" @click="closeDuplicateModal">Cancel</button>
                  <button type="submit" class="btn-primary" :disabled="isDuplicating">
                    {{ isDuplicating ? 'Duplicating...' : 'Continue' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Teleport>

      <BaseConfirmModal
        :model-value="isDuplicateConfirmOpen"
        title="Duplicate holidays"
        :message="duplicateConfirmMessage"
        confirm-label="Duplicate"
        cancel-label="Cancel"
        :loading="isDuplicating"
        @cancel="closeDuplicateConfirm"
        @confirm="confirmDuplicateYear"
        @update:model-value="(value) => { if (!value) closeDuplicateConfirm() }"
      />

      <BaseConfirmModal
        :model-value="holidayPendingDelete !== null"
        title="Delete holiday"
        message="Are you sure you want to delete this holiday? This action cannot be undone."
        confirm-label="Delete"
        cancel-label="Cancel"
        danger
        :loading="isDeleting"
        @cancel="closeDeleteModal"
        @confirm="confirmDelete"
        @update:model-value="(value) => { if (!value) closeDeleteModal() }"
      />

      <div class="pointer-events-none fixed inset-x-0 bottom-4 z-[90] flex justify-center px-4">
        <div
          v-if="toastMessage"
          class="pointer-events-auto max-w-md rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success shadow-elevated dark:border-success/20"
        >
          {{ toastMessage }}
        </div>
      </div>
    </section>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import BaseConfirmModal from '../../components/ui/BaseConfirmModal.vue'
import BaseFeedbackBanner from '../../components/ui/BaseFeedbackBanner.vue'
import HolidayForm, { type HolidayFormPayload } from '../../components/features/holidays/HolidayForm.vue'
import HolidayTable from '../../components/features/holidays/HolidayTable.vue'
import { useAuth } from '../../composables/useAuth'
import { useHolidays } from '../../composables/useHolidays'
import type { HolidayDTO } from '../../../shared/types/HolidayDTO'

definePageMeta({
  name: 'admin-holidays',
})

const { signOut } = useAuth()
const { getHolidaysByYear, createHoliday, updateHoliday, deleteHoliday, duplicateHolidaysToYear } = useHolidays()

interface DuplicateYearErrors {
  sourceYear: string
  targetYear: string
}

const currentYear = new Date().getFullYear()

const holidays = ref<HolidayDTO[]>([])
const selectedHoliday = ref<HolidayDTO | null>(null)
const holidayPendingDelete = ref<HolidayDTO | null>(null)
const editingHolidayId = ref<string | null>(null)
const selectedYear = ref(currentYear)
const selectedYearInput = ref(String(currentYear))
const searchQuery = ref('')
const duplicateSourceYearInput = ref(String(currentYear))
const duplicateTargetYearInput = ref(String(currentYear + 1))
const isLoading = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const isDuplicating = ref(false)
const isDuplicateConfirmOpen = ref(false)
const pendingDuplicateYears = ref<{ sourceYear: number, targetYear: number } | null>(null)
const toastMessage = ref('')
const toastTimeoutId = ref<number | null>(null)
const togglingActiveIds = ref<string[]>([])
const isFormOpen = ref(false)
const isDuplicateModalOpen = ref(false)
const pageError = ref('')
const pageSuccess = ref('')
const duplicateErrors = ref<DuplicateYearErrors>({
  sourceYear: '',
  targetYear: '',
})

const yearOptions = computed(() => {
  const start = currentYear - 10
  const end = currentYear + 10
  const options: number[] = []

  for (let year = start; year <= end; year += 1) {
    options.push(year)
  }

  if (!options.includes(selectedYear.value)) {
    options.push(selectedYear.value)
  }

  return options.sort((a, b) => b - a)
})

const filteredHolidays = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  const base = [...holidays.value].sort((a, b) => a.date.localeCompare(b.date))

  if (!query) {
    return base
  }

  return base.filter((holiday) => holiday.name.toLowerCase().includes(query))
})

const duplicateConfirmMessage = computed(() => {
  if (!pendingDuplicateYears.value) {
    return 'Duplicate holidays for the selected years?'
  }

  return `Duplicate holidays from ${pendingDuplicateYears.value.sourceYear} to ${pendingDuplicateYears.value.targetYear}?`
})

onMounted(async () => {
  await loadHolidays()
})

async function loadHolidays(): Promise<void> {
  isLoading.value = true
  pageError.value = ''

  try {
    holidays.value = await getHolidaysByYear(selectedYear.value)
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to load holidays.'
    holidays.value = []
  } finally {
    isLoading.value = false
  }
}

function parseYearInput(value: string): number | null {
  if (!/^\d{4}$/.test(value.trim())) {
    return null
  }

  return Number(value)
}

async function applyYearFilter(): Promise<void> {
  const parsedYear = parseYearInput(selectedYearInput.value)

  if (!parsedYear) {
    pageError.value = 'Enter a valid year in YYYY format.'
    selectedYearInput.value = String(selectedYear.value)
    return
  }

  selectedYear.value = parsedYear
  pageSuccess.value = ''
  await loadHolidays()
}

function showToast(message: string): void {
  toastMessage.value = message

  if (toastTimeoutId.value !== null) {
    window.clearTimeout(toastTimeoutId.value)
  }

  toastTimeoutId.value = window.setTimeout(() => {
    toastMessage.value = ''
    toastTimeoutId.value = null
  }, 2800)
}

async function setSelectedYear(year: number): Promise<void> {
  selectedYear.value = year
  selectedYearInput.value = String(year)
  pageSuccess.value = ''
  await loadHolidays()
}

async function goToPreviousYear(): Promise<void> {
  await setSelectedYear(selectedYear.value - 1)
}

async function goToNextYear(): Promise<void> {
  await setSelectedYear(selectedYear.value + 1)
}

function openCreateForm(): void {
  selectedHoliday.value = null
  editingHolidayId.value = null
  pageError.value = ''
  pageSuccess.value = ''
  isFormOpen.value = true
}

function openEditForm(holiday: HolidayDTO): void {
  selectedHoliday.value = holiday
  editingHolidayId.value = holiday.id
  pageError.value = ''
  pageSuccess.value = ''
  isFormOpen.value = true
}

function closeForm(): void {
  if (isSubmitting.value) {
    return
  }

  isFormOpen.value = false
  selectedHoliday.value = null
  editingHolidayId.value = null
}

function openDuplicateModal(): void {
  duplicateSourceYearInput.value = String(selectedYear.value)
  duplicateTargetYearInput.value = String(selectedYear.value + 1)
  duplicateErrors.value = {
    sourceYear: '',
    targetYear: '',
  }
  pageError.value = ''
  pageSuccess.value = ''
  isDuplicateModalOpen.value = true
}

function closeDuplicateModal(): void {
  if (isDuplicating.value) {
    return
  }

  isDuplicateModalOpen.value = false
  duplicateErrors.value = {
    sourceYear: '',
    targetYear: '',
  }
}

function closeDuplicateConfirm(): void {
  if (isDuplicating.value) {
    return
  }

  isDuplicateConfirmOpen.value = false
  pendingDuplicateYears.value = null
}

function validateDuplicateYears(): { sourceYear: number, targetYear: number } | null {
  duplicateErrors.value = {
    sourceYear: '',
    targetYear: '',
  }

  const sourceYear = parseYearInput(duplicateSourceYearInput.value)
  const targetYear = parseYearInput(duplicateTargetYearInput.value)

  if (!sourceYear) {
    duplicateErrors.value.sourceYear = 'Enter a valid year in YYYY format.'
  }

  if (!targetYear) {
    duplicateErrors.value.targetYear = 'Enter a valid year in YYYY format.'
  }

  if (sourceYear && targetYear && sourceYear === targetYear) {
    duplicateErrors.value.targetYear = 'Target year must be different from source year.'
  }

  if (duplicateErrors.value.sourceYear || duplicateErrors.value.targetYear) {
    return null
  }

  return {
    sourceYear: sourceYear as number,
    targetYear: targetYear as number,
  }
}

function openDeleteModal(holiday: HolidayDTO): void {
  holidayPendingDelete.value = holiday
  pageError.value = ''
  pageSuccess.value = ''
}

function closeDeleteModal(): void {
  if (isDeleting.value) {
    return
  }

  holidayPendingDelete.value = null
}

async function onSubmitForm(payload: HolidayFormPayload): Promise<void> {
  isSubmitting.value = true
  pageError.value = ''
  pageSuccess.value = ''
  let shouldCloseForm = false

  try {
    if (editingHolidayId.value) {
      await updateHoliday(editingHolidayId.value, payload)
      showToast('Holiday updated successfully.')
    } else {
      await createHoliday(payload)
      showToast('Holiday added successfully.')
    }

    await loadHolidays()
    shouldCloseForm = true
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to save holiday.'
  } finally {
    isSubmitting.value = false
  }

  if (shouldCloseForm) {
    closeForm()
  }
}

async function confirmDelete(): Promise<void> {
  if (!holidayPendingDelete.value) {
    return
  }

  isDeleting.value = true
  pageError.value = ''
  pageSuccess.value = ''

  try {
    await deleteHoliday(holidayPendingDelete.value.id)
    showToast('Holiday deleted successfully.')
    holidayPendingDelete.value = null
    await loadHolidays()
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to delete holiday.'
  } finally {
    isDeleting.value = false
  }
}

function requestDuplicateYearConfirmation(): void {
  const years = validateDuplicateYears()

  if (!years) {
    return
  }

  pendingDuplicateYears.value = years
  isDuplicateConfirmOpen.value = true
}

async function confirmDuplicateYear(): Promise<void> {
  if (!pendingDuplicateYears.value) {
    return
  }

  const years = pendingDuplicateYears.value

  isDuplicating.value = true
  pageError.value = ''
  pageSuccess.value = ''
  let shouldCloseDuplicateModal = false

  try {
    const targetYearHolidays = await getHolidaysByYear(years.targetYear)

    if (targetYearHolidays.length > 0) {
      throw new Error(`Target year ${years.targetYear} already has holidays. Duplicate cancelled to prevent conflicts.`)
    }

    const summary = await duplicateHolidaysToYear(years.sourceYear, years.targetYear)

    if (selectedYear.value !== years.targetYear) {
      selectedYear.value = years.targetYear
      selectedYearInput.value = String(years.targetYear)
    }

    await loadHolidays()
    showToast(`Duplicate complete: ${summary.created} created, ${summary.skipped} skipped.`)
    shouldCloseDuplicateModal = true
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to duplicate holidays.'
  } finally {
    isDuplicating.value = false
  }

  if (shouldCloseDuplicateModal) {
    closeDuplicateConfirm()
    closeDuplicateModal()
  }
}

async function onToggleHolidayActive(holiday: HolidayDTO): Promise<void> {
  const nextActive = !holiday.is_active

  togglingActiveIds.value = [...togglingActiveIds.value, holiday.id]
  pageError.value = ''

  try {
    await updateHoliday(holiday.id, { is_active: nextActive })
    await loadHolidays()
    showToast(nextActive ? 'Holiday activated.' : 'Holiday deactivated.')
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to update holiday status.'
  } finally {
    togglingActiveIds.value = togglingActiveIds.value.filter((id) => id !== holiday.id)
  }
}

async function onSignOut(): Promise<void> {
  await signOut()
  await navigateTo('/login')
}
</script>
