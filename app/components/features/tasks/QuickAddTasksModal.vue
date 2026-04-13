<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-foreground/50 px-4 py-6 backdrop-blur-sm sm:items-center sm:py-8"
      @click.self="onClose"
    >
      <div class="w-full max-w-xl max-h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl border border-primary-100 bg-surface p-6 shadow-elevated">

        <!-- Header -->
        <div class="mb-5 flex items-center justify-between gap-3">
          <div>
            <h3 class="text-lg font-semibold text-foreground">Quick Add Tasks</h3>
            <p class="mt-0.5 text-xs text-muted">Add multiple properties for the same date at once.</p>
          </div>
          <button type="button" class="btn-outline !px-3 !py-1.5" @click="onClose">Close</button>
        </div>

        <form novalidate class="space-y-5" @submit.prevent="onSubmit">

          <!-- Date -->
          <div>
            <label for="quick-add-date" class="mb-1.5 block text-sm font-medium text-foreground">Date</label>
            <input
              id="quick-add-date"
              v-model="form.date"
              type="date"
              class="input-base w-full max-w-[200px] [color-scheme:light] dark:[color-scheme:dark]"
            />
            <p v-if="errors.date" class="mt-1 text-xs text-error-600">{{ errors.date }}</p>
          </div>

          <!-- Property rows -->
          <div class="space-y-3">
            <p class="text-sm font-medium text-foreground">Properties</p>
            <div
              v-for="(row, index) in form.rows"
              :key="row._id"
              class="relative rounded-lg border border-border bg-background p-3"
            >
              <div class="flex items-start gap-2">
                <div class="min-w-0 flex-1">
                  <label :for="`quick-prop-${row._id}`" class="mb-1 block text-xs font-medium text-muted">
                    Property {{ index + 1 }}
                  </label>
                  <div class="relative">
                    <input
                      :id="`quick-prop-${row._id}`"
                      v-model="row.searchQuery"
                      type="text"
                      autocomplete="off"
                      class="input-base w-full text-sm"
                      placeholder="Search property…"
                      @input="onRowSearchInput(row)"
                      @focus="row.isPickerOpen = true"
                      @blur="onRowSearchBlur(row)"
                    />
                    <ul
                      v-if="row.isPickerOpen && getFilteredProperties(row.searchQuery).length > 0"
                      class="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-surface shadow-elevated"
                    >
                      <li
                        v-for="prop in getFilteredProperties(row.searchQuery)"
                        :key="prop.id"
                        class="cursor-pointer px-3 py-2 text-sm text-foreground hover:bg-primary-50 dark:hover:bg-white/5"
                        @mousedown.prevent="selectProperty(row, prop)"
                      >
                        {{ prop.name }}
                      </li>
                    </ul>
                  </div>
                  <p v-if="row.error" class="mt-1 text-xs text-error-600">{{ row.error }}</p>
                </div>

                <button
                  v-if="form.rows.length > 1"
                  type="button"
                  class="mt-6 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-error-600 transition hover:bg-error-100/50 dark:text-error-400 dark:hover:bg-error-500/10"
                  title="Remove row"
                  aria-label="Remove property row"
                  @click="removeRow(index)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z" />
                  </svg>
                </button>
              </div>
            </div>

            <button
              type="button"
              class="btn-outline !px-3 !py-1.5 text-xs"
              @click="addRow"
            >
              + Add property
            </button>
          </div>

          <!-- Global error -->
          <p v-if="globalError" class="rounded-lg border border-error-200 bg-error-50/60 px-3 py-2 text-xs text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
            {{ globalError }}
          </p>

          <!-- Actions -->
          <div class="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <button type="button" class="btn-outline" :disabled="isSubmitting" @click="onClose">
              Cancel
            </button>
            <button type="submit" class="btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? 'Creating…' : 'Create Tasks' }}
            </button>
          </div>

        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { PropertyDTO } from '../../../../shared/types/PropertyDTO'
import { useDailyTasks } from '../../../composables/useDailyTasks'
import type { CreateDailyTaskDTO } from '../../../../shared/types/DailyTaskDTO'

interface QuickAddRow {
  _id: string
  property_id: string
  searchQuery: string
  error: string
  isPickerOpen: boolean
}

interface FormState {
  date: string
  rows: QuickAddRow[]
}

interface FieldErrors {
  date: string
}

const props = defineProps<{
  modelValue: boolean
  initialDate: string
  properties: PropertyDTO[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: [date: string]
}>()

const { checkDuplicateTask, createTask } = useDailyTasks()

let _rowCounter = 0

function makeRow(): QuickAddRow {
  return {
    _id: String(++_rowCounter),
    property_id: '',
    searchQuery: '',
    error: '',
    isPickerOpen: false,
  }
}

function todayIsoDate(): string {
  return new Date().toISOString().split('T')[0] ?? ''
}

const form = reactive<FormState>({
  date: props.initialDate || todayIsoDate(),
  rows: [makeRow()],
})

const errors = reactive<FieldErrors>({
  date: '',
})

const globalError = ref('')
const isSubmitting = ref(false)

// Sync date when parent changes initialDate (e.g. user navigates week)
watch(() => props.initialDate, (d) => {
  if (d) form.date = d
})

// Reset when modal opens
watch(() => props.modelValue, (open) => {
  if (open) {
    form.date = props.initialDate || todayIsoDate()
    form.rows = [makeRow()]
    errors.date = ''
    globalError.value = ''
    isSubmitting.value = false
  }
})

function getFilteredProperties(query: string): PropertyDTO[] {
  const q = query.trim().toLowerCase()
  if (!q) return props.properties.slice(0, 30)
  return props.properties
    .filter((p) => p.name.toLowerCase().includes(q))
    .slice(0, 30)
}

function onRowSearchInput(row: QuickAddRow): void {
  row.isPickerOpen = true
  row.error = ''
  const q = row.searchQuery.trim().toLowerCase()
  if (!q) {
    row.property_id = ''
    return
  }
  const exact = props.properties.find((p) => p.name.toLowerCase() === q)
  row.property_id = exact?.id ?? ''
}

function onRowSearchBlur(row: QuickAddRow): void {
  setTimeout(() => {
    row.isPickerOpen = false
    if (!row.property_id) {
      row.searchQuery = ''
    } else {
      const p = props.properties.find((pr) => pr.id === row.property_id)
      row.searchQuery = p?.name ?? ''
    }
  }, 120)
}

function selectProperty(row: QuickAddRow, prop: PropertyDTO): void {
  row.property_id = prop.id
  row.searchQuery = prop.name
  row.isPickerOpen = false
  row.error = ''
}

function addRow(): void {
  form.rows.push(makeRow())
}

function removeRow(index: number): void {
  form.rows.splice(index, 1)
}

function onClose(): void {
  if (!isSubmitting.value) {
    emit('update:modelValue', false)
  }
}

function clearRowErrors(): void {
  for (const row of form.rows) {
    row.error = ''
  }
}

async function onSubmit(): Promise<void> {
  // --- Static validation ---
  errors.date = ''
  globalError.value = ''
  clearRowErrors()

  if (!form.date) {
    errors.date = 'Date is required.'
    return
  }

  // Only consider rows that have a property selected
  const filledRows = form.rows.filter((row) => row.property_id)

  if (filledRows.length === 0) {
    globalError.value = 'Please select at least one property.'
    return
  }

  // Detect duplicate property IDs within this submission
  const seenIds = new Set<string>()
  let hasDuplicateInForm = false
  for (const row of form.rows) {
    if (!row.property_id) continue
    if (seenIds.has(row.property_id)) {
      row.error = 'This property is already in the list.'
      hasDuplicateInForm = true
    } else {
      seenIds.add(row.property_id)
    }
  }
  if (hasDuplicateInForm) return

  // --- Async duplicate check against DB ---
  isSubmitting.value = true

  try {
    const duplicateChecks = await Promise.all(
      filledRows.map(async (row) => {
        const isDup = await checkDuplicateTask(row.property_id, form.date)
        return { row, isDup }
      }),
    )

    let anyDuplicate = false
    for (const { row, isDup } of duplicateChecks) {
      if (isDup) {
        row.error = 'This property already has a task on this date.'
        anyDuplicate = true
      }
    }
    if (anyDuplicate) {
      isSubmitting.value = false
      return
    }

    // --- Create all tasks ---
    const createPayloads: CreateDailyTaskDTO[] = filledRows.map((row) => ({
      date: form.date,
      property_id: row.property_id,
      guest_name: null,
      guest_checkin_date: null,
      tags: [],
      task_type: 'NORMAL' as const,
      window_start_time: null,
      window_end_time: null,
      desired_start_time: null,
      cleaning_minutes_override: null,
      people_count: 1,
      notes: null,
      extra_beds_single: 0,
      extra_beds_queen: 0,
      extra_beds_king: 0,
      extra_towels_qty: 0,
      extra_chocolates_qty: 0,
    }))

    const results = await Promise.allSettled(createPayloads.map((p) => createTask(p)))

    let anyFailed = false
    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      if (result?.status === 'rejected') {
        const row = filledRows[i]
        if (row) {
          row.error = result.reason instanceof Error
            ? result.reason.message
            : 'Failed to create task.'
        }
        anyFailed = true
      }
    }

    if (anyFailed) {
      globalError.value = 'Some tasks could not be created. See errors above.'
      isSubmitting.value = false
      return
    }

    emit('update:modelValue', false)
    emit('success', form.date)

  } catch (err: unknown) {
    globalError.value = err instanceof Error ? err.message : 'An unexpected error occurred.'
    isSubmitting.value = false
  } finally {
    if (isSubmitting.value) {
      isSubmitting.value = false
    }
  }
}
</script>
