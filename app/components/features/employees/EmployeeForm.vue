<template>
  <form novalidate class="space-y-4" @submit.prevent="onSubmit">
    <section class="form-section space-y-3">
      <h4 class="text-base font-semibold text-foreground">Basic Info</h4>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label for="employee-full-name" class="mb-1.5 block text-sm font-medium text-foreground">Full name</label>
          <input
            id="employee-full-name"
            v-model="form.full_name"
            type="text"
            class="input-base !px-4 !py-3"
            placeholder="Full name"
          />
          <p v-if="errors.full_name" class="mt-1 text-xs text-error-600">{{ errors.full_name }}</p>
        </div>

        <div>
          <label for="employee-email" class="mb-1.5 block text-sm font-medium text-foreground">Email</label>
          <input
            id="employee-email"
            v-model="form.email"
            type="email"
            class="input-base !px-4 !py-3"
            placeholder="employee@company.com"
          />
          <p v-if="errors.email" class="mt-1 text-xs text-error-600">{{ errors.email }}</p>
        </div>

        <div v-if="isCreateMode" class="sm:col-span-2">
          <label for="employee-password" class="mb-1.5 block text-sm font-medium text-foreground">Password</label>
          <div class="relative">
            <input
              id="employee-password"
              v-model="form.password"
              :type="isPasswordVisible ? 'text' : 'password'"
              class="input-base !px-4 !py-3 pr-11"
              placeholder="At least 8 characters"
            />
            <button
              type="button"
              class="absolute inset-y-0 right-2 inline-flex h-full items-center justify-center rounded-md px-2 text-muted transition hover:bg-primary-50 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:hover:bg-white/10"
              :title="isPasswordVisible ? 'Hide password' : 'Show password'"
              :aria-label="isPasswordVisible ? 'Hide password' : 'Show password'"
              @click="isPasswordVisible = !isPasswordVisible"
            >
              <svg v-if="!isPasswordVisible" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
                <path d="M12 5c-5.5 0-9.2 4.5-10.2 6 .9 1.5 4.7 6 10.2 6s9.2-4.5 10.2-6c-.9-1.5-4.7-6-10.2-6zm0 10a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
                <path d="M3 4.3 4.3 3 21 19.7 19.7 21l-2.8-2.8A11.3 11.3 0 0 1 12 19c-5.5 0-9.2-4.5-10.2-6 .7-1.1 2.8-3.8 5.8-5.2L3 4.3zm7.4 7.4 2.9 2.9a2 2 0 0 1-2.9-2.9zm7.9 3.7L16.6 13A4 4 0 0 0 11 7.4L9.7 6.1A10.7 10.7 0 0 1 12 6c5.5 0 9.2 4.5 10.2 6-.5.8-1.9 2.8-3.9 4.1z" />
              </svg>
            </button>
          </div>
          <p v-if="errors.password" class="mt-1 text-xs text-error-600">{{ errors.password }}</p>
        </div>
      </div>
    </section>

    <section class="form-section space-y-3">
      <h4 class="text-base font-semibold text-foreground">Contact</h4>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label for="employee-phone" class="mb-1.5 block text-sm font-medium text-foreground">Phone</label>
          <input
            id="employee-phone"
            v-model="form.phone"
            type="tel"
            class="input-base !px-4 !py-3"
            placeholder="(00) 00000-0000"
          />
        </div>

        <div>
          <label for="employee-address" class="mb-1.5 block text-sm font-medium text-foreground">Address</label>
          <input
            id="employee-address"
            v-model="form.address"
            type="text"
            class="input-base !px-4 !py-3"
            placeholder="Full address"
          />
        </div>
      </div>
    </section>

    <section class="form-section space-y-3">
      <h4 class="text-base font-semibold text-foreground">Business / Tax</h4>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label for="employee-abn" class="mb-1.5 block text-sm font-medium text-foreground">ABN</label>
          <input
            id="employee-abn"
            v-model="form.abn"
            type="text"
            class="input-base !px-4 !py-3"
            placeholder="ABN"
          />
        </div>
      </div>
    </section>

    <section class="space-y-3 rounded-xl border border-primary-200/70 bg-primary-50/60 p-4 dark:border-primary-500/30 dark:bg-primary-500/10">
      <h4 class="text-base font-semibold text-foreground">Payment Rates</h4>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label for="employee-rate-weekday" class="mb-1.5 block text-sm font-medium text-foreground">Weekday rate ($/h)</label>
          <div class="relative">
            <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
            <input
              id="employee-rate-weekday"
              v-model="form.hourly_rate_weekday"
              type="text"
              inputmode="decimal"
              class="input-base !py-3 pl-7 pr-3 text-right tabular-nums"
              placeholder="0.00"
              @blur="normalizeRateField('hourly_rate_weekday')"
            />
          </div>
          <p v-if="errors.hourly_rate_weekday" class="mt-1 text-xs text-error-600">{{ errors.hourly_rate_weekday }}</p>
        </div>

        <div>
          <label for="employee-rate-sunday" class="mb-1.5 block text-sm font-medium text-foreground">Sunday rate ($/h)</label>
          <div class="relative">
            <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
            <input
              id="employee-rate-sunday"
              v-model="form.hourly_rate_sunday"
              type="text"
              inputmode="decimal"
              class="input-base !py-3 pl-7 pr-3 text-right tabular-nums"
              placeholder="0.00"
              @blur="normalizeRateField('hourly_rate_sunday')"
            />
          </div>
          <p v-if="errors.hourly_rate_sunday" class="mt-1 text-xs text-error-600">{{ errors.hourly_rate_sunday }}</p>
        </div>

        <div>
          <label for="employee-rate-holiday" class="mb-1.5 block text-sm font-medium text-foreground">Holiday rate ($/h)</label>
          <div class="relative">
            <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
            <input
              id="employee-rate-holiday"
              v-model="form.hourly_rate_holiday"
              type="text"
              inputmode="decimal"
              class="input-base !py-3 pl-7 pr-3 text-right tabular-nums"
              placeholder="0.00"
              @blur="normalizeRateField('hourly_rate_holiday')"
            />
          </div>
          <p v-if="errors.hourly_rate_holiday" class="mt-1 text-xs text-error-600">{{ errors.hourly_rate_holiday }}</p>
        </div>
      </div>
    </section>

    <section class="form-section space-y-3">
      <h4 class="text-base font-semibold text-foreground">Role & Status</h4>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label for="employee-role" class="mb-1.5 block text-sm font-medium text-foreground">Role</label>
          <select id="employee-role" v-model="form.role" class="select-base !px-4 !py-3">
            <option value="worker">Worker</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div class="flex items-end">
          <label class="inline-flex items-center gap-2 text-sm font-medium text-foreground">
            <input
              id="employee-active"
              v-model="form.active"
              type="checkbox"
              class="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
            />
            Active employee
          </label>
        </div>
      </div>
    </section>

    <div class="flex flex-col-reverse items-stretch gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
      <button type="button" class="btn-outline" :disabled="isSubmitting" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="btn-primary" :disabled="isSubmitting">
        {{ isSubmitting ? 'Saving...' : submitLabel }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { EmployeeDTO } from '../../../../shared/types/EmployeeDTO'

export type FormMode = 'create' | 'edit'

export interface EmployeeFormPayload {
  full_name: string
  email: string | null
  phone: string | null
  address: string | null
  abn: string | null
  hourly_rate_weekday: number
  hourly_rate_sunday: number
  hourly_rate_holiday: number
  active: boolean
  role: 'admin' | 'worker'
}

export interface CreateEmployeeFormPayload {
  full_name: string
  email: string
  password: string
  phone: string | null
  address: string | null
  abn: string | null
  hourly_rate_weekday: number
  hourly_rate_sunday: number
  hourly_rate_holiday: number
  active: boolean
  role: 'admin' | 'worker'
}

interface Props {
  mode?: FormMode
  employee?: EmployeeDTO | null
  isSubmitting?: boolean
  submitLabel?: string
}

interface FormState {
  full_name: string
  email: string
  password: string
  phone: string
  address: string
  abn: string
  hourly_rate_weekday: string
  hourly_rate_sunday: string
  hourly_rate_holiday: string
  active: boolean
  role: 'admin' | 'worker'
}

interface FieldErrors {
  full_name: string
  email: string
  password: string
  hourly_rate_weekday: string
  hourly_rate_sunday: string
  hourly_rate_holiday: string
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'edit',
  employee: null,
  isSubmitting: false,
  submitLabel: 'Save',
})

const emit = defineEmits<{
  submit: [payload: EmployeeFormPayload | CreateEmployeeFormPayload]
  cancel: []
}>()

const form = reactive<FormState>({
  full_name: '',
  email: '',
  password: '',
  phone: '',
  address: '',
  abn: '',
  hourly_rate_weekday: '0.00',
  hourly_rate_sunday: '0.00',
  hourly_rate_holiday: '0.00',
  active: true,
  role: 'worker',
})

const isPasswordVisible = ref(false)

const errors = reactive<FieldErrors>({
  full_name: '',
  email: '',
  password: '',
  hourly_rate_weekday: '',
  hourly_rate_sunday: '',
  hourly_rate_holiday: '',
})

const isCreateMode = computed(() => props.mode === 'create')

function syncForm(): void {
  const current = props.employee

  form.full_name = current?.full_name ?? ''
  form.email = current?.email ?? ''
  form.password = ''
  isPasswordVisible.value = false
  form.phone = current?.phone ?? ''
  form.address = current?.address ?? ''
  form.abn = current?.abn ?? ''
  form.hourly_rate_weekday = formatRateNumber(current?.hourly_rate_weekday ?? 0)
  form.hourly_rate_sunday = formatRateNumber(current?.hourly_rate_sunday ?? 0)
  form.hourly_rate_holiday = formatRateNumber(current?.hourly_rate_holiday ?? 0)
  form.active = current?.active ?? true
  form.role = current?.role ?? 'worker'

  clearErrors()
}

watch(() => props.employee, syncForm, { immediate: true })

function formatRateNumber(value: number): string {
  return Number(value).toFixed(2)
}

function parseRate(value: string): number | null {
  const normalized = value.replace(/[^\d.-]/g, '').trim()

  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)

  if (!Number.isFinite(parsed)) {
    return null
  }

  return parsed
}

function normalizeRateField(field: 'hourly_rate_weekday' | 'hourly_rate_sunday' | 'hourly_rate_holiday'): void {
  const parsed = parseRate(form[field])

  if (parsed === null) {
    return
  }

  form[field] = formatRateNumber(parsed)
}

function clearErrors(): void {
  errors.full_name = ''
  errors.email = ''
  errors.password = ''
  errors.hourly_rate_weekday = ''
  errors.hourly_rate_sunday = ''
  errors.hourly_rate_holiday = ''
}

function validateEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function validateForm(): boolean {
  clearErrors()
  let valid = true

  if (!form.full_name.trim()) {
    errors.full_name = 'Full name is required.'
    valid = false
  }

  if (!form.email.trim()) {
    errors.email = 'Email is required.'
    valid = false
  } else if (!validateEmail(form.email.trim())) {
    errors.email = 'Enter a valid email address.'
    valid = false
  }

  if (isCreateMode.value && form.password.trim().length < 8) {
    errors.password = 'Password must have at least 8 characters.'
    valid = false
  }

  if (parseRate(form.hourly_rate_weekday) === null) {
    errors.hourly_rate_weekday = 'Enter a valid numeric rate.'
    valid = false
  }

  if (parseRate(form.hourly_rate_sunday) === null) {
    errors.hourly_rate_sunday = 'Enter a valid numeric rate.'
    valid = false
  }

  if (parseRate(form.hourly_rate_holiday) === null) {
    errors.hourly_rate_holiday = 'Enter a valid numeric rate.'
    valid = false
  }

  return valid
}

function onSubmit(): void {
  if (!validateForm()) {
    return
  }

  const weekdayRate = parseRate(form.hourly_rate_weekday)
  const sundayRate = parseRate(form.hourly_rate_sunday)
  const holidayRate = parseRate(form.hourly_rate_holiday)

  if (weekdayRate === null || sundayRate === null || holidayRate === null) {
    return
  }

  if (isCreateMode.value) {
    const payload: CreateEmployeeFormPayload = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      password: form.password.trim(),
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      abn: form.abn.trim() || null,
      hourly_rate_weekday: weekdayRate,
      hourly_rate_sunday: sundayRate,
      hourly_rate_holiday: holidayRate,
      active: form.active,
      role: form.role,
    }

    emit('submit', payload)
  } else {
    const payload: EmployeeFormPayload = {
      full_name: form.full_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      abn: form.abn.trim() || null,
      hourly_rate_weekday: weekdayRate,
      hourly_rate_sunday: sundayRate,
      hourly_rate_holiday: holidayRate,
      active: form.active,
      role: form.role,
    }

    emit('submit', payload)
  }
}
</script>
