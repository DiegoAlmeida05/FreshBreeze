<template>
  <form class="space-y-4" novalidate @submit.prevent="onSubmit">
    <section class="form-section">
      <h4 class="form-section-title">Basic Info</h4>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label for="holiday-name" class="mb-1.5 block text-sm font-medium text-foreground">Holiday name</label>
          <input
            id="holiday-name"
            v-model="form.name"
            type="text"
            class="input-base"
            placeholder="Holiday name"
            required
          >
          <p v-if="errors.name" class="mt-1 text-xs text-error-600">{{ errors.name }}</p>
        </div>

        <div>
          <label for="holiday-date" class="mb-1.5 block text-sm font-medium text-foreground">Date</label>
          <input
            id="holiday-date"
            v-model="form.date"
            type="date"
            class="input-base [color-scheme:light] dark:[color-scheme:dark]"
            required
          >
          <p v-if="errors.date" class="mt-1 text-xs text-error-600">{{ errors.date }}</p>
        </div>
      </div>
    </section>

    <section class="form-section">
      <h4 class="form-section-title">Location</h4>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label for="holiday-country" class="mb-1.5 block text-sm font-medium text-foreground">Country</label>
          <input
            id="holiday-country"
            v-model="form.country"
            type="text"
            class="input-base"
            placeholder="AU"
          >
        </div>

        <div>
          <label for="holiday-state" class="mb-1.5 block text-sm font-medium text-foreground">State</label>
          <input
            id="holiday-state"
            v-model="form.state"
            type="text"
            class="input-base"
            placeholder="QLD"
          >
        </div>
      </div>
    </section>

    <section class="form-section">
      <h4 class="form-section-title">Status</h4>
      <label class="inline-flex items-center gap-2 text-sm font-medium text-foreground">
        <input
          id="holiday-active"
          v-model="form.is_active"
          type="checkbox"
          class="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
        >
        Active holiday
      </label>
    </section>

    <div class="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
      <button type="button" class="btn-outline" :disabled="isSubmitting" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="btn-primary" :disabled="isSubmitting">
        {{ isSubmitting ? 'Saving...' : submitLabel }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { HolidayDTO } from '../../../../shared/types/HolidayDTO'

export interface HolidayFormPayload {
  date: string
  name: string
  country: string | null
  state: string | null
  is_active: boolean
}

interface FieldErrors {
  date: string
  name: string
}

interface Props {
  holiday?: HolidayDTO | null
  isSubmitting?: boolean
  submitLabel?: string
}

interface Emits {
  submit: [payload: HolidayFormPayload]
  cancel: []
}

const props = withDefaults(defineProps<Props>(), {
  holiday: null,
  isSubmitting: false,
  submitLabel: 'Save',
})

const emit = defineEmits<Emits>()

const form = reactive<HolidayFormPayload>({
  date: props.holiday?.date ?? '',
  name: props.holiday?.name ?? '',
  country: props.holiday?.country ?? null,
  state: props.holiday?.state ?? null,
  is_active: props.holiday?.is_active ?? true,
})

const errors = reactive<FieldErrors>({
  date: '',
  name: '',
})

watch(
  () => props.holiday,
  (holiday) => {
    form.date = holiday?.date ?? ''
    form.name = holiday?.name ?? ''
    form.country = holiday?.country ?? null
    form.state = holiday?.state ?? null
    form.is_active = holiday?.is_active ?? true
    errors.date = ''
    errors.name = ''
  },
)

function validateForm(): boolean {
  errors.date = ''
  errors.name = ''

  if (!form.date) {
    errors.date = 'Date is required.'
  }

  if (!form.name.trim()) {
    errors.name = 'Name is required.'
  }

  return !errors.date && !errors.name
}

function onSubmit(): void {
  if (!validateForm()) {
    return
  }

  emit('submit', {
    date: form.date,
    name: form.name.trim(),
    country: form.country?.trim() || null,
    state: form.state?.trim() || null,
    is_active: form.is_active,
  })
}
</script>
