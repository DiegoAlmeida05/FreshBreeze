<template>
  <NuxtLayout name="admin-layout" @signout="onSignOut">
    <section class="space-y-4">
      <div class="action-bar">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-primary-600">Pricing</p>
          <h2 class="mt-1 text-2xl font-semibold text-foreground">Pricing Items</h2>
          <p v-if="lastUpdatedAt" class="mt-1 text-[11px] font-medium text-muted">
            Last updated {{ formatDateTimeLabel(lastUpdatedAt) }}
          </p>
        </div>
        <button type="button" class="btn-primary" @click="openCreateForm">
          Add pricing item
        </button>
      </div>

      <div class="toolbar-surface grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div class="sm:col-span-2">
          <label for="pricing-items-search" class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Search</label>
          <div class="relative">
            <input
              id="pricing-items-search"
              v-model="searchTerm"
              type="text"
              class="input-base pr-10"
              placeholder="Search by item name"
            />
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted">
              <path fill-rule="evenodd" d="M10.5 3a7.5 7.5 0 1 0 4.75 13.305l4.223 4.222 1.06-1.06-4.222-4.223A7.5 7.5 0 0 0 10.5 3Zm-6 7.5a6 6 0 1 1 12 0 6 6 0 0 1-12 0Z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>

        <div>
          <label for="pricing-items-category-filter" class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Category</label>
          <select id="pricing-items-category-filter" v-model="categoryFilter" class="select-base">
            <option value="all">All categories</option>
            <option value="linen">Linen</option>
            <option value="amenities">Amenities</option>
          </select>
        </div>
      </div>

      <BaseFeedbackBanner
        v-if="pageError"
        tone="error"
        title="Pricing item action failed"
        :message="pageError"
        floating
        dismissible
        @dismiss="pageError = ''"
      />

      <BaseFeedbackBanner
        v-if="pageSuccess"
        tone="success"
        title="Success"
        :message="pageSuccess"
        floating
        dismissible
        @dismiss="pageSuccess = ''"
      />

      <PricingItemsTable
        :pricing-items="filteredPricingItems"
        :is-loading="isLoading"
        @edit="openEditForm"
        @request-deactivate="promptDeactivatePricingItem"
      />

      <BaseConfirmModal
        v-model="isDeactivateModalOpen"
        title="Deactivate pricing item"
        :message="deactivateConfirmMessage"
        confirm-label="Deactivate"
        cancel-label="Cancel"
        :loading="isDeactivatingPricingItem"
        danger
        @confirm="confirmDeactivatePricingItem"
      />
    </section>

    <Teleport to="body">
      <div
        v-if="isFormOpen"
        class="modal-backdrop"
        @click.self="closeForm"
      >
        <div class="modal-surface max-h-[calc(100vh-3rem)] max-w-lg overflow-y-auto">
          <div class="modal-header">
            <h3 class="text-base font-semibold text-foreground">
              {{ editingPricingItemId ? 'Edit pricing item' : 'New pricing item' }}
            </h3>
            <button type="button" class="btn-outline !px-3 !py-1.5" @click="closeForm">Close</button>
          </div>
          <div class="modal-body">
            <PricingItemsForm
              :mode="editingPricingItemId ? 'edit' : 'create'"
              :pricing-item="selectedPricingItem"
              :is-submitting="isSubmitting || isLoadingPricingItemDetails"
              :submit-label="editingPricingItemId ? 'Update' : 'Create'"
              @submit="onSubmitForm"
              @cancel="closeForm"
            />
          </div>
        </div>
      </div>
    </Teleport>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import BaseConfirmModal from '../../components/ui/BaseConfirmModal.vue'
import BaseFeedbackBanner from '../../components/ui/BaseFeedbackBanner.vue'
import PricingItemsForm from '../../components/features/pricing-items/PricingItemsForm.vue'
import PricingItemsTable from '../../components/features/pricing-items/PricingItemsTable.vue'
import { useAuth } from '../../composables/useAuth'
import { usePricingItems } from '../../composables/usePricingItems'
import type { CreatePricingItemDTO, PricingItemDTO, UpdatePricingItemDTO } from '../../../shared/types/PricingItemDTO'
import type { PricingItemsFormPayload } from '../../components/features/pricing-items/PricingItemsForm.vue'

definePageMeta({
  name: 'admin-combos',
})

const { signOut } = useAuth()
const { fetchPricingItems, fetchPricingItemById, createPricingItem, updatePricingItem, deactivatePricingItem } = usePricingItems()

const pricingItems = ref<PricingItemDTO[]>([])
const selectedPricingItem = ref<PricingItemDTO | null>(null)
const editingPricingItemId = ref<string | null>(null)
const isLoading = ref(false)
const isSubmitting = ref(false)
const isLoadingPricingItemDetails = ref(false)
const isFormOpen = ref(false)
const isDeactivateModalOpen = ref(false)
const isDeactivatingPricingItem = ref(false)
const pageError = ref('')
const pageSuccess = ref('')
const searchTerm = ref('')
const categoryFilter = ref<'all' | 'linen' | 'amenities'>('all')
const pricingItemPendingDeactivate = ref<PricingItemDTO | null>(null)
const lastUpdatedAt = ref<string | null>(null)

const deactivateConfirmMessage = computed(() => {
  const name = pricingItemPendingDeactivate.value?.name ?? ''
  return `Deactivate "${name}"? It will remain in historical records, but will no longer be selectable in new property/task pricing.`
})

const filteredPricingItems = computed(() => {
  let result = pricingItems.value

  if (categoryFilter.value !== 'all') {
    result = result.filter((item) => item.category === categoryFilter.value)
  }

  const query = searchTerm.value.trim().toLowerCase()

  if (query) {
    result = result.filter((item) => item.name.toLowerCase().includes(query))
  }

  return [...result].sort((a, b) => {
    const categoryCompare = a.category.localeCompare(b.category)
    if (categoryCompare !== 0) {
      return categoryCompare
    }

    const sortCompare = a.sort_order - b.sort_order
    if (sortCompare !== 0) {
      return sortCompare
    }

    return a.name.localeCompare(b.name)
  })
})

onMounted(async () => {
  await loadPricingItems()
})

async function loadPricingItems(): Promise<void> {
  isLoading.value = true
  pageError.value = ''

  try {
    pricingItems.value = await fetchPricingItems()
    lastUpdatedAt.value = resolveLastUpdatedAt(pricingItems.value) ?? new Date().toISOString()
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to load pricing items.'
  } finally {
    isLoading.value = false
  }
}

function openCreateForm(): void {
  selectedPricingItem.value = null
  editingPricingItemId.value = null
  pageError.value = ''
  pageSuccess.value = ''
  isFormOpen.value = true
}

async function openEditForm(pricingItem: PricingItemDTO): Promise<void> {
  pageError.value = ''
  pageSuccess.value = ''
  isLoadingPricingItemDetails.value = true

  try {
    selectedPricingItem.value = await fetchPricingItemById(pricingItem.id)
    editingPricingItemId.value = pricingItem.id
    isFormOpen.value = true
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to load pricing item details.'
  } finally {
    isLoadingPricingItemDetails.value = false
  }
}

function closeForm(): void {
  isFormOpen.value = false
  selectedPricingItem.value = null
  editingPricingItemId.value = null
}

function promptDeactivatePricingItem(pricingItem: PricingItemDTO): void {
  if (!pricingItem.active) {
    return
  }

  pricingItemPendingDeactivate.value = pricingItem
  isDeactivateModalOpen.value = true
}

async function confirmDeactivatePricingItem(): Promise<void> {
  const pricingItem = pricingItemPendingDeactivate.value
  if (!pricingItem) {
    return
  }

  isDeactivatingPricingItem.value = true
  pageError.value = ''
  pageSuccess.value = ''

  try {
    await deactivatePricingItem(pricingItem.id)
    pageSuccess.value = 'Pricing item deactivated successfully.'
    isDeactivateModalOpen.value = false
    pricingItemPendingDeactivate.value = null
    await loadPricingItems()
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to deactivate pricing item.'
  } finally {
    isDeactivatingPricingItem.value = false
  }
}

async function onSubmitForm(payload: PricingItemsFormPayload): Promise<void> {
  isSubmitting.value = true
  pageError.value = ''
  pageSuccess.value = ''

  try {
    if (editingPricingItemId.value) {
      await updatePricingItem(editingPricingItemId.value, payload as UpdatePricingItemDTO)
      pageSuccess.value = 'Pricing item updated successfully.'
    } else {
      await createPricingItem(payload as CreatePricingItemDTO)
      pageSuccess.value = 'Pricing item created successfully.'
    }

    closeForm()
    await loadPricingItems()
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to save pricing item.'
  } finally {
    isSubmitting.value = false
  }
}

async function onSignOut(): Promise<void> {
  await signOut()
  await navigateTo('/login')
}

function resolveLastUpdatedAt(items: PricingItemDTO[]): string | null {
  let latestTimestamp: number | null = null
  let latestIso: string | null = null

  for (const item of items) {
    const value = item.updated_at
    if (!value) {
      continue
    }

    const timestamp = new Date(value).getTime()
    if (Number.isNaN(timestamp)) {
      continue
    }

    if (latestTimestamp === null || timestamp > latestTimestamp) {
      latestTimestamp = timestamp
      latestIso = value
    }
  }

  return latestIso
}

function formatDateTimeLabel(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  const day = date.getDate()
  const month = date.toLocaleString('en-AU', { month: 'short' })
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${day} ${month} · ${hours}:${minutes}`
}
</script>
