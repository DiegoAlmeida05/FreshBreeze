<template>
  <form novalidate class="space-y-4" @submit.prevent="onSubmit">
    <!-- Basic Info -->
    <section class="form-section">
      <h4 class="form-section-title">Basic Info</h4>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <label for="client-name" class="mb-1.5 block text-sm font-medium text-foreground">Client name</label>
          <input
            id="client-name"
            v-model="form.name"
            type="text"
            class="input-base"
            placeholder="Client name"
          />
          <p v-if="errors.name" class="mt-1 text-xs text-error-600">{{ errors.name }}</p>
        </div>

        <div class="sm:col-span-2">
          <label for="client-color" class="mb-1.5 block text-sm font-medium text-foreground">Color</label>
          <div class="grid grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-2.5 rounded-xl border border-border/80 bg-surface px-3 py-2">
            <span class="h-7 w-7 rounded-full border border-border/80 shadow-sm" :style="{ backgroundColor: form.color }" />
            <input
              id="client-color"
              v-model="form.color"
              type="color"
              class="h-9 w-12 cursor-pointer rounded border border-border bg-surface p-1"
            />
            <input
              v-model="form.color"
              type="text"
              class="input-base w-full !py-1.5 font-mono text-xs uppercase"
              placeholder="#000000"
            />
          </div>
          <p v-if="errors.color" class="mt-1 text-xs text-error-600">{{ errors.color }}</p>
        </div>
      </div>
    </section>

    <!-- Pricing -->
    <section class="form-section">
      <h4 class="form-section-title">Pricing</h4>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label for="client-hourly-rate" class="mb-1.5 block text-sm font-medium text-foreground">Hourly rate</label>
          <div class="relative">
            <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
            <input
              id="client-hourly-rate"
              v-model="form.hourly_rate"
              type="text"
              inputmode="decimal"
              class="input-base pl-7 pr-3 text-right tabular-nums"
              placeholder="0.00"
            />
          </div>
          <p v-if="errors.hourly_rate" class="mt-1 text-xs text-error-600">{{ errors.hourly_rate }}</p>
        </div>

        <div>
          <label for="client-linen-combo" class="mb-1.5 block text-sm font-medium text-foreground">Linen combo price (invoice)</label>
          <div class="relative">
            <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
            <input
              id="client-linen-combo"
              v-model="form.linen_combo_price"
              type="text"
              inputmode="decimal"
              class="input-base pl-7 pr-3 text-right tabular-nums"
              placeholder="0.00"
            />
          </div>
          <p v-if="errors.linen_combo_price" class="mt-1 text-xs text-error-600">{{ errors.linen_combo_price }}</p>
        </div>

        <div>
          <label for="client-amenities-combo" class="mb-1.5 block text-sm font-medium text-foreground">Amenities combo price (invoice)</label>
          <div class="relative">
            <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
            <input
              id="client-amenities-combo"
              v-model="form.amenities_combo_price"
              type="text"
              inputmode="decimal"
              class="input-base pl-7 pr-3 text-right tabular-nums"
              placeholder="0.00"
            />
          </div>
          <p v-if="errors.amenities_combo_price" class="mt-1 text-xs text-error-600">{{ errors.amenities_combo_price }}</p>
        </div>

        <div>
          <label for="client-towel" class="mb-1.5 block text-sm font-medium text-foreground">Extra towel price (invoice)</label>
          <div class="relative">
            <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
            <input
              id="client-towel"
              v-model="form.extra_towel_price"
              type="text"
              inputmode="decimal"
              class="input-base pl-7 pr-3 text-right tabular-nums"
              placeholder="0.00"
            />
          </div>
          <p v-if="errors.extra_towel_price" class="mt-1 text-xs text-error-600">{{ errors.extra_towel_price }}</p>
        </div>
      </div>
    </section>

    <!-- Status -->
    <section class="form-section">
      <h4 class="form-section-title">Status</h4>
      <label class="inline-flex items-center gap-2 text-sm font-medium text-foreground">
        <input
          id="client-active"
          v-model="form.active"
          type="checkbox"
          class="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
        />
        Active client
      </label>
    </section>

    <!-- Actions -->
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
import type { ClientDTO, CreateClientDTO } from '../../../../shared/types/ClientDTO'

export type FormMode = 'create' | 'edit'

export type ClientFormPayload = CreateClientDTO

interface Props {
  mode?: FormMode
  client?: ClientDTO | null
  isSubmitting?: boolean
  submitLabel?: string
}

interface FormState {
  name: string
  color: string
  hourly_rate: string
  linen_combo_price: string
  amenities_combo_price: string
  extra_towel_price: string
  active: boolean
}

interface FieldErrors {
  name?: string
  color?: string
  hourly_rate?: string
  linen_combo_price?: string
  amenities_combo_price?: string
  extra_towel_price?: string
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'edit',
  client: null,
  isSubmitting: false,
  submitLabel: 'Save',
})

const emit = defineEmits<{
  submit: [payload: ClientFormPayload]
  cancel: []
}>()

const form = reactive<FormState>({
  name: '',
  color: '#3B82F6',
  hourly_rate: '0.00',
  linen_combo_price: '0.00',
  amenities_combo_price: '0.00',
  extra_towel_price: '0.00',
  active: true,
})

const errors = reactive<FieldErrors>({})

function toMoneyInput(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : '0.00'
}

function parseMoneyInput(value: string): number {
  const normalized = value.replace(',', '.').trim()
  const numeric = Number.parseFloat(normalized)
  return Number.isFinite(numeric) ? numeric : NaN
}

function isValidHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value)
}

function syncForm(): void {
  const current = props.client

  if (current) {
    form.name = current.name
    form.color = current.color
    form.hourly_rate = toMoneyInput(current.hourly_rate)
    form.linen_combo_price = toMoneyInput(current.linen_combo_price)
    form.amenities_combo_price = toMoneyInput(current.amenities_combo_price)
    form.extra_towel_price = toMoneyInput(current.extra_towel_price)
    form.active = current.active
  } else {
    form.name = ''
    form.color = '#3B82F6'
    form.hourly_rate = '0.00'
    form.linen_combo_price = '0.00'
    form.amenities_combo_price = '0.00'
    form.extra_towel_price = '0.00'
    form.active = true
  }

  errors.name = undefined
  errors.color = undefined
  errors.hourly_rate = undefined
  errors.linen_combo_price = undefined
  errors.amenities_combo_price = undefined
  errors.extra_towel_price = undefined
}

watch(() => props.client, syncForm, { immediate: true })

function onSubmit(): void {
  errors.name = undefined
  errors.color = undefined
  errors.hourly_rate = undefined
  errors.linen_combo_price = undefined
  errors.amenities_combo_price = undefined
  errors.extra_towel_price = undefined

  let hasError = false

  if (!form.name.trim()) {
    errors.name = 'Client name is required.'
    hasError = true
  }

  if (!isValidHexColor(form.color)) {
    errors.color = 'Use a valid HEX color (ex: #3B82F6).'
    hasError = true
  }

  const hourlyRate = parseMoneyInput(form.hourly_rate)
  const linenComboPrice = parseMoneyInput(form.linen_combo_price)
  const amenitiesComboPrice = parseMoneyInput(form.amenities_combo_price)
  const extraTowelPrice = parseMoneyInput(form.extra_towel_price)

  if (!Number.isFinite(hourlyRate) || hourlyRate < 0) {
    errors.hourly_rate = 'Enter a valid value.'
    hasError = true
  }

  if (!Number.isFinite(linenComboPrice) || linenComboPrice < 0) {
    errors.linen_combo_price = 'Enter a valid value.'
    hasError = true
  }

  if (!Number.isFinite(amenitiesComboPrice) || amenitiesComboPrice < 0) {
    errors.amenities_combo_price = 'Enter a valid value.'
    hasError = true
  }

  if (!Number.isFinite(extraTowelPrice) || extraTowelPrice < 0) {
    errors.extra_towel_price = 'Enter a valid value.'
    hasError = true
  }

  if (hasError) {
    return
  }

  const payload: ClientFormPayload = {
    name: form.name.trim(),
    color: form.color,
    hourly_rate: hourlyRate,
    linen_combo_price: linenComboPrice,
    amenities_combo_price: amenitiesComboPrice,
    extra_towel_price: extraTowelPrice,
    active: form.active,
  }

  emit('submit', payload)
}
</script>
