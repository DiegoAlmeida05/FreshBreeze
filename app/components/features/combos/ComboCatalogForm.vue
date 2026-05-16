<template>
  <form novalidate class="space-y-5" @submit.prevent="onSubmit" @keydown.enter="onEnterKeyDown">
    <div>
      <label for="combo-name" class="mb-1.5 block text-sm font-medium text-foreground">Name</label>
      <input
        id="combo-name"
        v-model="form.name"
        type="text"
        class="input-base"
        placeholder="e.g. Queen set"
        autocomplete="off"
      />
      <p v-if="errors.name" class="mt-1 text-xs text-error-600">{{ errors.name }}</p>
    </div>

    <div>
      <label for="combo-category" class="mb-1.5 block text-sm font-medium text-foreground">Category</label>
      <select id="combo-category" v-model="form.category" class="input-base">
        <option value="linen">Linen</option>
        <option value="amenities">Amenities</option>
      </select>
      <p v-if="errors.category" class="mt-1 text-xs text-error-600">{{ errors.category }}</p>
    </div>

    <div class="space-y-3 rounded-xl border border-border/70 bg-muted/10 p-3">
      <div class="flex items-center justify-between gap-2">
        <h4 class="text-sm font-semibold text-foreground">Items in this set</h4>
        <button type="button" class="btn-outline !px-3 !py-1.5 text-xs" @click="addItemRow">Add item</button>
      </div>

      <p v-if="errors.items" class="text-xs text-error-600">{{ errors.items }}</p>

      <div v-if="form.items.length === 0" class="rounded-lg border border-dashed border-border/80 px-3 py-4 text-xs text-muted">
        No items yet. Add at least one item.
      </div>

      <div v-for="(item, index) in form.items" :key="item.id" class="rounded-xl border border-border/70 bg-surface px-3 py-3 shadow-sm">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.9fr)_90px_140px_auto_auto] md:items-end">
          <div class="min-w-0">
            <label :for="`combo-item-name-${item.id}`" class="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Item name</label>
            <input
              :id="`combo-item-name-${item.id}`"
              v-model="item.item_name"
              type="text"
              class="input-base"
              placeholder="e.g. Duvet, Pillowcase, Sheet"
              autocomplete="off"
            />
            <p v-if="itemErrors[index]?.item_name" class="mt-1 text-xs text-error-600">{{ itemErrors[index]?.item_name }}</p>
          </div>

          <div class="grid grid-cols-2 gap-2 md:contents">
            <div>
              <label :for="`combo-item-qty-${item.id}`" class="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Qty</label>
              <input
                :id="`combo-item-qty-${item.id}`"
                v-model="item.quantity"
                type="number"
                min="1"
                step="1"
                inputmode="numeric"
                class="input-base text-center tabular-nums"
                placeholder="1"
              />
              <p v-if="itemErrors[index]?.quantity" class="mt-1 text-xs text-error-600">{{ itemErrors[index]?.quantity }}</p>
            </div>

            <div>
              <label :for="`combo-item-unit-${item.id}`" class="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Unit price</label>
              <div class="relative">
                <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
                <input
                  :id="`combo-item-unit-${item.id}`"
                  v-model="item.unit_price_excl_gst"
                  type="text"
                  inputmode="decimal"
                  class="input-base w-full pl-7 pr-3 text-right tabular-nums"
                  placeholder="0.00"
                />
              </div>
              <p v-if="itemErrors[index]?.unit_price_excl_gst" class="mt-1 text-xs text-error-600">{{ itemErrors[index]?.unit_price_excl_gst }}</p>
            </div>
          </div>

          <div class="flex items-end justify-between gap-2 md:contents">
            <div class="rounded-md border border-border/70 bg-muted/20 px-2.5 py-2 text-right md:justify-self-end md:rounded-none md:border-0 md:bg-transparent md:px-0 md:py-0">
              <p class="text-[11px] font-semibold uppercase tracking-wide text-muted">Line total</p>
              <p class="text-sm font-medium tabular-nums text-muted">${{ lineTotalFor(item).toFixed(2) }}</p>
            </div>

            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center self-end rounded-md text-error-600 transition hover:bg-error-100/50 dark:text-error-400 dark:hover:bg-error-500/10"
              aria-label="Remove item"
              @click="removeItemRow(index)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div>
        <label for="combo-total" class="mb-1.5 block text-sm font-medium text-foreground">Combo total (excl GST)</label>
        <div class="relative max-w-[220px]">
          <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
          <input
            id="combo-total"
            :value="comboTotal.toFixed(2)"
            type="text"
            readonly
            class="input-base pl-7 pr-3 text-right tabular-nums"
          />
        </div>
      </div>
    </div>

    <div>
      <label for="combo-description" class="mb-1.5 block text-sm font-medium text-foreground">
        Description <span class="font-normal text-muted">(optional)</span>
      </label>
      <textarea
        id="combo-description"
        v-model="form.description"
        rows="3"
        class="input-base resize-y text-sm"
        placeholder="Brief description of what this combo includes..."
      />
    </div>

    <div>
      <label for="combo-sort-order" class="mb-1.5 block text-sm font-medium text-foreground">Sort order</label>
      <input
        id="combo-sort-order"
        v-model.number="form.sort_order"
        type="number"
        min="0"
        step="1"
        class="input-base max-w-[120px] text-center"
        placeholder="0"
      />
      <p class="mt-1 text-xs text-muted">Lower numbers appear first in lists.</p>
    </div>

    <label class="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
      <input
        id="combo-active"
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
import { computed, reactive, watch } from 'vue'
import type {
  ComboCatalogCategory,
  ComboCatalogDTO,
  ComboCatalogItemInput,
  CreateComboCatalogDTO,
  UpdateComboCatalogDTO,
} from '../../../../shared/types/ComboCatalogDTO'

export type ComboCatalogFormMode = 'create' | 'edit'
export type ComboCatalogFormPayload = CreateComboCatalogDTO | UpdateComboCatalogDTO

interface FormState {
  name: string
  category: ComboCatalogCategory
  items: FormItemRow[]
  description: string
  sort_order: number
  active: boolean
}

interface FormItemRow {
  id: string
  item_name: string
  quantity: string
  unit_price_excl_gst: string
}

interface FieldErrors {
  name?: string
  category?: string
  items?: string
}

interface ItemFieldErrors {
  item_name?: string
  quantity?: string
  unit_price_excl_gst?: string
}

interface Props {
  mode?: ComboCatalogFormMode
  combo?: ComboCatalogDTO | null
  isSubmitting?: boolean
  submitLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create',
  combo: null,
  isSubmitting: false,
  submitLabel: 'Save',
})

const emit = defineEmits<{
  submit: [payload: ComboCatalogFormPayload]
  cancel: []
}>()

const errors = reactive<FieldErrors>({})
const itemErrors = reactive<ItemFieldErrors[]>([])

const form = reactive<FormState>({
  name: '',
  category: 'linen',
  items: [],
  description: '',
  sort_order: 0,
  active: true,
})

function parsePrice(value: string): number {
  const normalized = value.replace(',', '.').trim()
  const numeric = Number.parseFloat(normalized)
  return Number.isFinite(numeric) ? numeric : NaN
}

function resetErrors(): void {
  errors.name = undefined
  errors.category = undefined
  errors.items = undefined
  itemErrors.splice(0, itemErrors.length)
}

function createEntryId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createEmptyItemRow(): FormItemRow {
  return {
    id: createEntryId(),
    item_name: '',
    quantity: '1',
    unit_price_excl_gst: '0.00',
  }
}

function parsePositiveNumber(value: string): number {
  const parsed = parsePrice(value)
  return Number.isFinite(parsed) ? parsed : NaN
}

function lineTotalFor(item: FormItemRow): number {
  const quantity = parsePositiveNumber(item.quantity)
  const unitPrice = parsePositiveNumber(item.unit_price_excl_gst)

  if (!Number.isFinite(quantity) || quantity < 0 || !Number.isFinite(unitPrice) || unitPrice < 0) {
    return 0
  }

  return Number((quantity * unitPrice).toFixed(2))
}

const comboTotal = computed(() => {
  const sum = form.items.reduce((acc, item) => acc + lineTotalFor(item), 0)
  return Number(sum.toFixed(2))
})

function addItemRow(): void {
  form.items.push(createEmptyItemRow())
}

function removeItemRow(index: number): void {
  form.items.splice(index, 1)
  itemErrors.splice(index, 1)
}

function normalizeItems(): ComboCatalogItemInput[] {
  return form.items.map((item, index) => ({
    item_name: item.item_name.trim(),
    quantity: parsePositiveNumber(item.quantity),
    unit_price_excl_gst: parsePositiveNumber(item.unit_price_excl_gst),
    sort_order: index,
  }))
}

function validateForm(): boolean {
  resetErrors()

  if (!form.name.trim()) {
    errors.name = 'Name is required.'
  }

  if (!form.category) {
    errors.category = 'Category is required.'
  }

  if (form.items.length === 0) {
    errors.items = 'Add at least one item to this combo.'
  }

  form.items.forEach((item, index) => {
    const rowErrors: ItemFieldErrors = {}

    if (!item.item_name.trim()) {
      rowErrors.item_name = 'Item name is required.'
    }

    const quantity = parsePositiveNumber(item.quantity)
    if (!Number.isFinite(quantity) || quantity <= 0) {
      rowErrors.quantity = 'Qty must be greater than 0.'
    }

    const unitPrice = parsePositiveNumber(item.unit_price_excl_gst)
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      rowErrors.unit_price_excl_gst = 'Unit price must be 0 or greater.'
    }

    itemErrors[index] = rowErrors
  })

  if (!errors.items) {
    const hasItemErrors = itemErrors.some((row) => Boolean(row.item_name || row.quantity || row.unit_price_excl_gst))
    if (hasItemErrors) {
      errors.items = 'Fix invalid item rows before saving.'
    }
  }

  return !errors.name && !errors.category && !errors.items
}

function syncForm(): void {
  const combo = props.combo

  if (combo) {
    form.name = combo.name
    form.category = combo.category
    form.items = combo.items.length > 0
      ? combo.items.map((item) => ({
        id: createEntryId(),
        item_name: item.item_name,
        quantity: item.quantity.toString(),
        unit_price_excl_gst: item.unit_price_excl_gst.toFixed(2),
      }))
      : [createEmptyItemRow()]
    form.description = combo.description
    form.sort_order = combo.sort_order
    form.active = combo.active
  } else {
    form.name = ''
    form.category = 'linen'
    form.items = [createEmptyItemRow()]
    form.description = ''
    form.sort_order = 0
    form.active = true
  }

  resetErrors()
}

function onSubmit(): void {
  if (!validateForm()) {
    return
  }

  const payload: ComboCatalogFormPayload = {
    name: form.name.trim(),
    category: form.category,
    combo_price: comboTotal.value,
    items: normalizeItems(),
    description: form.description.trim(),
    sort_order: form.sort_order,
    active: form.active,
  }

  emit('submit', payload)
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

watch(() => props.combo, syncForm, { immediate: true })
</script>
