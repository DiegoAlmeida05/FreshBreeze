<template>
  <form class="space-y-5" novalidate @submit.prevent="onSubmit" @keydown.enter="onEnterKeyDown">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div class="sm:col-span-2">
        <label for="pricing-set-name" class="mb-1.5 block text-sm font-medium text-foreground">Set name</label>
        <input id="pricing-set-name" v-model="form.name" type="text" class="input-base" placeholder="Standard linen set" />
        <p v-if="errors.name" class="mt-1 text-xs text-error-600">{{ errors.name }}</p>
      </div>

      <div>
        <label for="pricing-set-category" class="mb-1.5 block text-sm font-medium text-foreground">Category</label>
        <select id="pricing-set-category" v-model="form.category" class="select-base">
          <option value="linen">Linen</option>
          <option value="amenities">Amenities</option>
        </select>
      </div>

      <div class="rounded-xl border border-border/80 bg-surface p-3">
        <p class="text-xs font-semibold uppercase tracking-wide text-muted">Usage rule</p>
        <p class="mt-1 text-sm text-foreground">Sets are templates only. They expand into pricing items before save and never feed calculations directly.</p>
      </div>
    </div>

    <section class="space-y-3 rounded-xl border border-border/80 bg-surface p-4">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h4 class="text-sm font-semibold text-foreground">Items in this set</h4>
          <p class="text-xs text-muted">Add multiple pricing items and define the quantity for each one.</p>
        </div>

        <button type="button" class="btn-outline !px-3 !py-1.5 text-xs" :disabled="isLoadingPricingItems || availablePricingItems.length === 0" @click="addItem">
          {{ isLoadingPricingItems ? 'Loading items...' : '+ Add item' }}
        </button>
      </div>

      <div v-if="form.items.length === 0" class="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-4 text-sm text-muted">
        No items added.
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="(entry, index) in form.items"
          :key="entry.id"
          class="grid grid-cols-1 gap-2 rounded-lg border border-border/80 bg-muted/10 p-2.5 md:grid-cols-[minmax(0,1fr)_96px_auto] md:items-center"
        >
          <select :id="`pricing-set-item-${entry.id}`" v-model="entry.pricing_item_id" class="select-base">
            <option value="">Select item</option>
            <option v-for="pricingItem in availablePricingItems" :key="pricingItem.id" :value="pricingItem.id">
              {{ pricingItem.name }} · ${{ pricingItem.unit_price.toFixed(2) }}
            </option>
          </select>

          <input
            :id="`pricing-set-qty-${entry.id}`"
            v-model.number="entry.quantity"
            type="number"
            min="1"
            step="1"
            class="input-base text-center tabular-nums"
            placeholder="1"
          />

          <button type="button" class="inline-flex h-8 w-8 items-center justify-center rounded-md text-error-600 transition hover:bg-error-100/50 dark:text-error-400 dark:hover:bg-error-500/10" aria-label="Remove set item" @click="removeItem(index)">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z" />
            </svg>
          </button>
        </div>
      </div>

      <p v-if="errors.items" class="text-xs text-error-600">{{ errors.items }}</p>
    </section>

    <div class="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
      <button type="button" class="btn-outline" :disabled="isSubmitting" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="btn-primary" :disabled="isSubmitting || isLoadingPricingItems">{{ isSubmitting ? 'Saving...' : submitLabel }}</button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { PricingItemCategory, PricingItemDTO } from '../../../../shared/types/PricingItemDTO'
import type { PricingSetDTO, PricingSetItemInput } from '../../../../shared/types/PricingSetDTO'
import { usePricingItems } from '../../../composables/usePricingItems'

interface FormSetItemEntry {
  id: string
  pricing_item_id: string
  quantity: number
}

export interface PricingSetsFormPayload {
  name: string
  category: PricingItemCategory
  items: PricingSetItemInput[]
}

interface FieldErrors {
  name?: string
  items?: string
}

interface Props {
  mode?: 'create' | 'edit'
  pricingSet?: PricingSetDTO | null
  isSubmitting?: boolean
  submitLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create',
  pricingSet: null,
  isSubmitting: false,
  submitLabel: 'Save',
})

const emit = defineEmits<{
  submit: [payload: PricingSetsFormPayload]
  cancel: []
}>()

const { fetchActivePricingItems } = usePricingItems()

const isLoadingPricingItems = ref(false)
const pricingItems = ref<PricingItemDTO[]>([])
const errors = reactive<FieldErrors>({})
const form = reactive<{ name: string; category: PricingItemCategory; items: FormSetItemEntry[] }>({
  name: '',
  category: 'linen',
  items: [],
})

const availablePricingItems = computed(() => pricingItems.value.filter((pricingItem) => pricingItem.category === form.category))

function createEntryId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function addItem(): void {
  form.items = [...form.items, { id: createEntryId(), pricing_item_id: '', quantity: 1 }]
}

function removeItem(index: number): void {
  form.items = form.items.filter((_, itemIndex) => itemIndex !== index)
}

function normalizeItems(): PricingSetItemInput[] {
  const merged = new Map<string, PricingSetItemInput>()

  for (const item of form.items) {
    const pricingItemId = item.pricing_item_id.trim()
    if (!pricingItemId) {
      continue
    }

    const quantity = Math.max(1, Number(item.quantity ?? 1))
    const existing = merged.get(pricingItemId)

    if (existing) {
      existing.quantity += quantity
      continue
    }

    merged.set(pricingItemId, {
      pricing_item_id: pricingItemId,
      quantity,
    })
  }

  return Array.from(merged.values())
}

function validateForm(): boolean {
  errors.name = form.name.trim() ? undefined : 'Set name is required.'
  errors.items = normalizeItems().length > 0 ? undefined : 'Add at least one pricing item.'
  return !errors.name && !errors.items
}

function syncForm(): void {
  if (props.mode === 'edit' && props.pricingSet) {
    form.name = props.pricingSet.name
    form.category = props.pricingSet.category
    form.items = props.pricingSet.items.map((item) => ({
      id: item.id || createEntryId(),
      pricing_item_id: item.pricing_item_id,
      quantity: Math.max(1, Number(item.quantity ?? 1)),
    }))
    return
  }

  form.name = ''
  form.category = 'linen'
  form.items = []
}

function onSubmit(): void {
  if (!validateForm()) {
    return
  }

  emit('submit', {
    name: form.name.trim(),
    category: form.category,
    items: normalizeItems(),
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

watch(() => props.pricingSet, syncForm, { immediate: true })
watch(() => form.category, (category) => {
  const allowedItemIds = new Set(pricingItems.value.filter((item) => item.category === category).map((item) => item.id))
  form.items = form.items.filter((item) => allowedItemIds.has(item.pricing_item_id) || !item.pricing_item_id)
})

onMounted(async () => {
  isLoadingPricingItems.value = true
  try {
    pricingItems.value = await fetchActivePricingItems()
  } finally {
    isLoadingPricingItems.value = false
  }
})
</script>