<template>
  <form novalidate class="space-y-5" @submit.prevent="onSubmit" @keydown.enter="onEnterKeyDown">
    <div>
      <label for="pricing-item-name" class="mb-1.5 block text-sm font-medium text-foreground">Name</label>
      <input
        id="pricing-item-name"
        v-model="form.name"
        type="text"
        class="input-base"
        placeholder="e.g. Bath towel"
        autocomplete="off"
      />
      <p v-if="errors.name" class="mt-1 text-xs text-error-600">{{ errors.name }}</p>
    </div>

    <div>
      <label for="pricing-item-category" class="mb-1.5 block text-sm font-medium text-foreground">Category</label>
      <select id="pricing-item-category" v-model="form.category" class="input-base">
        <option value="linen">Linen</option>
        <option value="amenities">Amenities</option>
      </select>
      <p v-if="errors.category" class="mt-1 text-xs text-error-600">{{ errors.category }}</p>
    </div>

    <div>
      <label for="pricing-item-unit-price" class="mb-1.5 block text-sm font-medium text-foreground">Unit price</label>
      <div class="relative">
        <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
        <input
          id="pricing-item-unit-price"
          v-model="form.unit_price"
          type="text"
          inputmode="decimal"
          class="input-base pl-7 pr-3 text-right tabular-nums"
          placeholder="0.00"
        />
      </div>
      <p v-if="errors.unit_price" class="mt-1 text-xs text-error-600">{{ errors.unit_price }}</p>
    </div>

    <label class="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
      <input
        id="pricing-item-active"
        v-model="form.active"
        type="checkbox"
        class="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
      />
      Active (visible for selection)
    </label>

    <div class="action-bar">
      <button type="button" class="btn-outline min-w-[100px]" :disabled="isSubmitting" @click="emit('cancel')">
        Cancel
      </button>
      <button type="submit" class="btn-primary min-w-[120px]" :disabled="isSubmitting">
        {{ isSubmitting ? 'Saving...' : submitLabel }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import type {
  CreatePricingItemDTO,
  PricingItemCategory,
  PricingItemDTO,
  UpdatePricingItemDTO,
} from '../../../../shared/types/PricingItemDTO'

export type PricingItemsFormMode = 'create' | 'edit'
export type PricingItemsFormPayload = CreatePricingItemDTO | UpdatePricingItemDTO

interface FormState {
  name: string
  category: PricingItemCategory
  unit_price: string
  active: boolean
}

interface FieldErrors {
  name?: string
  category?: string
  unit_price?: string
}

interface Props {
  mode?: PricingItemsFormMode
  pricingItem?: PricingItemDTO | null
  isSubmitting?: boolean
  submitLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create',
  pricingItem: null,
  isSubmitting: false,
  submitLabel: 'Save',
})

const emit = defineEmits<{
  submit: [payload: PricingItemsFormPayload]
  cancel: []
}>()

const errors = reactive<FieldErrors>({})

const form = reactive<FormState>({
  name: '',
  category: 'linen',
  unit_price: '0.00',
  active: true,
})

function parseMoney(value: string): number {
  const numeric = Number.parseFloat(value.replace(',', '.').trim())
  return Number.isFinite(numeric) ? numeric : NaN
}

function toMoneyInput(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : '0.00'
}

function resetErrors(): void {
  errors.name = undefined
  errors.category = undefined
  errors.unit_price = undefined
}

function validateForm(): boolean {
  resetErrors()
  errors.name = form.name.trim() ? undefined : 'Name is required.'
  errors.category = form.category ? undefined : 'Category is required.'

  const unitPrice = parseMoney(form.unit_price)
  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    errors.unit_price = 'Enter a valid value.'
  }

  return !errors.name && !errors.category && !errors.unit_price
}

function syncForm(): void {
  if (props.pricingItem) {
    form.name = props.pricingItem.name
    form.category = props.pricingItem.category
    form.unit_price = toMoneyInput(props.pricingItem.unit_price)
    form.active = props.pricingItem.active
    return
  }

  form.name = ''
  form.category = 'linen'
  form.unit_price = '0.00'
  form.active = true
}

async function onSubmit(): Promise<void> {
  if (!validateForm()) {
    return
  }

  emit('submit', {
    name: form.name.trim(),
    category: form.category,
    unit_price: parseMoney(form.unit_price),
    active: form.active,
  })
}

function onEnterKeyDown(event: KeyboardEvent): void {
  const target = event.target as HTMLElement | null
  if (!target) {
    return
  }

  const tagName = target.tagName
  if (tagName === 'TEXTAREA' || tagName === 'BUTTON') {
    return
  }

  event.preventDefault()
}

watch(() => props.pricingItem, syncForm, { immediate: true })
</script>
