<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-foreground/50 px-4 py-6 backdrop-blur-sm sm:items-center sm:py-8"
      @click.self="onClose"
    >
      <div
        id="quick-task-modal"
        class="w-full max-w-lg rounded-2xl border border-primary-100 bg-surface p-6 shadow-elevated dark:border-white/10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-task-modal-title"
      >
        <!-- Header -->
        <div class="mb-5 flex items-center justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <!-- Lightning bolt icon -->
            <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500/15 text-primary-600 dark:text-primary-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </span>
            <div>
              <h3 id="quick-task-modal-title" class="text-base font-semibold text-foreground">Quick Task</h3>
              <p class="text-xs text-muted">Create a task in seconds</p>
            </div>
          </div>
          <button
            type="button"
            class="btn-outline !px-3 !py-1.5 text-xs"
            @click="onClose"
          >
            Close
          </button>
        </div>

        <form novalidate class="space-y-4" @submit.prevent="onSubmit">

          <!-- Property -->
          <div>
            <label for="qt-property" class="mb-1.5 block text-sm font-medium text-foreground">
              Property <span class="text-error-600">*</span>
            </label>
            <div v-if="isLoadingProperties" class="flex items-center gap-2 py-2 text-sm text-muted">
              <svg class="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading properties…
            </div>
            <select
              v-else
              id="qt-property"
              v-model="form.propertyId"
              class="input-base cursor-pointer"
              @change="onPropertyChange"
            >
              <option value="">Select a property…</option>
              <option
                v-for="prop in properties"
                :key="prop.id"
                :value="prop.id"
              >
                {{ prop.name }}
              </option>
            </select>
            <p v-if="errors.propertyId" class="mt-1 text-xs text-error-600">{{ errors.propertyId }}</p>
          </div>

          <!-- Client (auto-filled) -->
          <div>
            <label class="mb-1.5 block text-sm font-medium text-foreground">
              Client <span class="text-muted text-xs font-normal">(auto-filled)</span>
            </label>
            <div class="flex h-[42px] items-center rounded-lg border border-border bg-border/30 px-4 text-sm text-muted">
              <span v-if="autoFilledClientName" class="font-medium text-foreground">{{ autoFilledClientName }}</span>
              <span v-else class="italic">Auto-filled when property is selected</span>
            </div>
          </div>

          <!-- Date + Team (2-col) -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="qt-date" class="mb-1.5 block text-sm font-medium text-foreground">
                Date <span class="text-error-600">*</span>
              </label>
              <input
                id="qt-date"
                v-model="form.date"
                type="date"
                class="input-base [color-scheme:light] dark:[color-scheme:dark]"
              />
              <p v-if="errors.date" class="mt-1 text-xs text-error-600">{{ errors.date }}</p>
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-foreground">Team</label>
              <div class="flex gap-2">
                <button
                  v-for="team in TEAMS"
                  :key="team"
                  type="button"
                  :class="[
                    'flex-1 rounded-lg border py-2 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/30',
                    form.team === team
                      ? 'border-primary-400/60 bg-primary-500/15 text-primary-700 dark:text-primary-300'
                      : 'border-border bg-surface text-muted hover:border-primary-300/60 hover:text-foreground',
                  ]"
                  @click="form.team = team"
                >
                  {{ team }}
                </button>
              </div>
            </div>
          </div>

          <!-- Start time + Duration (2-col) -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="qt-start" class="mb-1.5 block text-sm font-medium text-foreground">
                Start time <span class="text-error-600">*</span>
              </label>
              <input
                id="qt-start"
                v-model="form.startTime"
                type="time"
                class="input-base [color-scheme:light] dark:[color-scheme:dark]"
              />
              <p v-if="errors.startTime" class="mt-1 text-xs text-error-600">{{ errors.startTime }}</p>
            </div>

            <div>
              <label for="qt-duration" class="mb-1.5 block text-sm font-medium text-foreground">
                Duration (hours) <span class="text-error-600">*</span>
              </label>
              <input
                id="qt-duration"
                v-model="form.durationHours"
                type="text"
                inputmode="decimal"
                placeholder="e.g. 2 or 1.5"
                class="input-base"
              />
              <p v-if="errors.durationHours" class="mt-1 text-xs text-error-600">{{ errors.durationHours }}</p>
            </div>
          </div>

          <!-- End time preview -->
          <div
            v-if="computedEndTime"
            class="flex items-center gap-2 rounded-lg border border-primary-200/60 bg-primary-50/60 px-4 py-2.5 dark:border-primary-500/20 dark:bg-primary-500/10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            <p class="text-sm text-foreground">
              End time:
              <span class="font-semibold text-primary-700 dark:text-primary-300">{{ computedEndTime }}</span>
              <span class="ml-2 text-xs text-muted">({{ form.startTime }} + {{ form.durationHours }}h)</span>
            </p>
          </div>

          <!-- Global error -->
          <p
            v-if="globalError"
            class="rounded-lg border border-error-200 bg-error-50/60 px-3 py-2 text-xs text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
          >
            {{ globalError }}
          </p>

          <!-- Actions -->
          <div class="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              class="btn-outline"
              :disabled="isSubmitting"
              @click="onClose"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn-primary"
              :disabled="isSubmitting || isLoadingProperties"
            >
              <svg v-if="isSubmitting" class="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ isSubmitting ? 'Creating…' : 'Create Task' }}
            </button>
          </div>

        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue'
import { useQuickTask, addHoursToTime } from '../../../composables/useQuickTask'
import type { QuickTaskTeam } from '../../../composables/useQuickTask'

// ─── Constants ────────────────────────────────────────────────────────────────

const TEAMS: QuickTaskTeam[] = ['A', 'B', 'C']

function todayISO(): string {
  return new Date().toISOString().split('T')[0] as string
}

// ─── Props / Emits ────────────────────────────────────────────────────────────

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  created: []
}>()

// ─── Composable ───────────────────────────────────────────────────────────────

const { properties, isLoadingProperties, isSubmitting, loadProperties, submitQuickTask } =
  useQuickTask()

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  propertyId: string
  date: string
  startTime: string
  durationHours: string
  team: QuickTaskTeam
}

interface FieldErrors {
  propertyId?: string
  date?: string
  startTime?: string
  durationHours?: string
}

const form = reactive<FormState>({
  propertyId: '',
  date: todayISO(),
  startTime: '09:00',
  durationHours: '2',
  team: 'A',
})

const errors = reactive<FieldErrors>({})
const globalError = ref('')

// ─── Derived ──────────────────────────────────────────────────────────────────

const autoFilledClientName = computed<string>(() => {
  const match = properties.value.find((p) => p.id === form.propertyId)
  return match?.client_name ?? ''
})

const computedEndTime = computed<string | null>(() => {
  const dur = parseFloat(form.durationHours)
  if (!form.startTime || isNaN(dur) || dur <= 0) return null
  return addHoursToTime(form.startTime, dur)
})

// ─── Watchers ─────────────────────────────────────────────────────────────────

// Load properties when modal opens; reset form when it closes
watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      globalError.value = ''
      Object.assign(errors, { propertyId: undefined, date: undefined, startTime: undefined, durationHours: undefined })
      Object.assign(form, { propertyId: '', date: todayISO(), startTime: '09:00', durationHours: '2', team: 'A' as QuickTaskTeam })
      if (properties.value.length === 0) {
        await loadProperties()
      }
    }
  },
)

// ─── Validation ───────────────────────────────────────────────────────────────

function validateForm(): boolean {
  errors.propertyId = undefined
  errors.date = undefined
  errors.startTime = undefined
  errors.durationHours = undefined
  globalError.value = ''

  let valid = true

  if (!form.propertyId) {
    errors.propertyId = 'Please select a property.'
    valid = false
  }
  if (!form.date) {
    errors.date = 'Date is required.'
    valid = false
  }
  if (!form.startTime) {
    errors.startTime = 'Start time is required.'
    valid = false
  }
  const dur = parseFloat(form.durationHours)
  if (!form.durationHours || isNaN(dur) || dur <= 0) {
    errors.durationHours = 'Enter a valid duration (e.g. 2 or 1.5).'
    valid = false
  }

  return valid
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

function onPropertyChange() {
  errors.propertyId = undefined
}

function onClose() {
  emit('update:modelValue', false)
}

async function onSubmit() {
  if (!validateForm()) return
  if (!computedEndTime.value) return

  try {
    await submitQuickTask({
      property_id: form.propertyId,
      date: form.date,
      start_time: form.startTime,
      end_time: computedEndTime.value,
      team: form.team,
    })
    emit('created')
    onClose()
  } catch (err: unknown) {
    globalError.value = err instanceof Error ? err.message : 'Failed to create task. Please try again.'
  }
}
</script>
