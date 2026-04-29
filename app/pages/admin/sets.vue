<template>
  <NuxtLayout name="admin-layout" @signout="onSignOut">
    <section class="space-y-4">
      <div class="action-bar">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-primary-600">Management</p>
          <h2 class="mt-1 text-2xl font-semibold text-foreground">Pricing Sets</h2>
          <p class="mt-1 text-sm text-muted">Template groups that expand into pricing items for properties and tasks.</p>
        </div>
        <button type="button" class="btn-primary" @click="openCreateForm">Add set</button>
      </div>

      <div class="toolbar-surface grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div class="sm:col-span-2">
          <label for="pricing-sets-search" class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Search</label>
          <div class="relative">
            <input id="pricing-sets-search" v-model="searchTerm" type="text" class="input-base pr-10" placeholder="Search by set name" />
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted">
              <path fill-rule="evenodd" d="M10.5 3a7.5 7.5 0 1 0 4.75 13.305l4.223 4.222 1.06-1.06-4.222-4.223A7.5 7.5 0 0 0 10.5 3Zm-6 7.5a6 6 0 1 1 12 0 6 6 0 0 1-12 0Z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>

        <div>
          <label for="pricing-sets-category-filter" class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Category</label>
          <select id="pricing-sets-category-filter" v-model="categoryFilter" class="select-base">
            <option value="all">All categories</option>
            <option value="linen">Linen</option>
            <option value="amenities">Amenities</option>
          </select>
        </div>
      </div>

      <BaseFeedbackBanner v-if="pageError" tone="error" title="Pricing set action failed" :message="pageError" floating dismissible @dismiss="pageError = ''" />
      <BaseFeedbackBanner v-if="pageSuccess" tone="success" title="Success" :message="pageSuccess" floating dismissible @dismiss="pageSuccess = ''" />

      <PricingSetsTable :pricing-sets="filteredPricingSets" :is-loading="isLoading" @edit="openEditForm" @request-deactivate="promptDeactivatePricingSet" />

      <BaseConfirmModal
        v-model="isDeactivateModalOpen"
        title="Deactivate pricing set"
        :message="deactivateConfirmMessage"
        confirm-label="Deactivate"
        cancel-label="Cancel"
        :loading="isDeactivatingPricingSet"
        danger
        @confirm="confirmDeactivatePricingSet"
      />
    </section>

    <Teleport to="body">
      <div v-if="isFormOpen" class="modal-backdrop" @click.self="closeForm">
        <div class="modal-surface max-h-[calc(100vh-3rem)] max-w-2xl overflow-y-auto">
          <div class="modal-header">
            <h3 class="text-base font-semibold text-foreground">{{ editingPricingSetId ? 'Edit pricing set' : 'New pricing set' }}</h3>
            <button type="button" class="btn-outline !px-3 !py-1.5" @click="closeForm">Close</button>
          </div>
          <div class="modal-body">
            <PricingSetsForm
              :mode="editingPricingSetId ? 'edit' : 'create'"
              :pricing-set="selectedPricingSet"
              :is-submitting="isSubmitting || isLoadingPricingSetDetails"
              :submit-label="editingPricingSetId ? 'Update' : 'Create'"
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
import { computed, onMounted, ref } from 'vue'
import type { PricingItemCategory } from '../../../shared/types/PricingItemDTO'
import type { PricingSetDTO } from '../../../shared/types/PricingSetDTO'
import type { PricingSetsFormPayload } from '../../components/features/pricing-sets/PricingSetsForm.vue'
import PricingSetsForm from '../../components/features/pricing-sets/PricingSetsForm.vue'
import PricingSetsTable from '../../components/features/pricing-sets/PricingSetsTable.vue'
import BaseConfirmModal from '../../components/ui/BaseConfirmModal.vue'
import BaseFeedbackBanner from '../../components/ui/BaseFeedbackBanner.vue'
import { useAuth } from '../../composables/useAuth'
import { usePricingSets } from '../../composables/usePricingSets'

definePageMeta({
  name: 'admin-sets',
})

const { signOut } = useAuth()
const { fetchPricingSets, fetchPricingSetById, createPricingSet, updatePricingSet, deactivatePricingSet } = usePricingSets()

const pricingSets = ref<PricingSetDTO[]>([])
const selectedPricingSet = ref<PricingSetDTO | null>(null)
const editingPricingSetId = ref<string | null>(null)
const isLoading = ref(false)
const isSubmitting = ref(false)
const isLoadingPricingSetDetails = ref(false)
const isFormOpen = ref(false)
const isDeactivateModalOpen = ref(false)
const isDeactivatingPricingSet = ref(false)
const pricingSetPendingDeactivate = ref<PricingSetDTO | null>(null)
const pageError = ref('')
const pageSuccess = ref('')
const searchTerm = ref('')
const categoryFilter = ref<'all' | PricingItemCategory>('all')

const filteredPricingSets = computed(() => {
  let result = pricingSets.value

  if (categoryFilter.value !== 'all') {
    result = result.filter((pricingSet) => pricingSet.category === categoryFilter.value)
  }

  const query = searchTerm.value.trim().toLowerCase()
  if (query) {
    result = result.filter((pricingSet) => pricingSet.name.toLowerCase().includes(query))
  }

  return [...result].sort((first, second) => {
    const categoryCompare = first.category.localeCompare(second.category)
    if (categoryCompare !== 0) {
      return categoryCompare
    }

    return first.name.localeCompare(second.name)
  })
})

const deactivateConfirmMessage = computed(() => {
  const name = pricingSetPendingDeactivate.value?.name ?? ''
  return `Deactivate "${name}"? It will stay available for history, but it will no longer be selectable when applying sets.`
})

onMounted(async () => {
  await loadPricingSets()
})

async function loadPricingSets(): Promise<void> {
  isLoading.value = true
  pageError.value = ''

  try {
    pricingSets.value = await fetchPricingSets()
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to load pricing sets.'
  } finally {
    isLoading.value = false
  }
}

function openCreateForm(): void {
  selectedPricingSet.value = null
  editingPricingSetId.value = null
  pageError.value = ''
  pageSuccess.value = ''
  isFormOpen.value = true
}

async function openEditForm(pricingSet: PricingSetDTO): Promise<void> {
  pageError.value = ''
  pageSuccess.value = ''
  isLoadingPricingSetDetails.value = true

  try {
    selectedPricingSet.value = await fetchPricingSetById(pricingSet.id)
    editingPricingSetId.value = pricingSet.id
    isFormOpen.value = true
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to load pricing set details.'
  } finally {
    isLoadingPricingSetDetails.value = false
  }
}

function closeForm(): void {
  isFormOpen.value = false
  selectedPricingSet.value = null
  editingPricingSetId.value = null
}

function promptDeactivatePricingSet(pricingSet: PricingSetDTO): void {
  if (!pricingSet.active) {
    return
  }

  pricingSetPendingDeactivate.value = pricingSet
  isDeactivateModalOpen.value = true
}

async function confirmDeactivatePricingSet(): Promise<void> {
  const pricingSet = pricingSetPendingDeactivate.value
  if (!pricingSet) {
    return
  }

  isDeactivatingPricingSet.value = true
  pageError.value = ''
  pageSuccess.value = ''

  try {
    await deactivatePricingSet(pricingSet.id)
    pageSuccess.value = 'Pricing set deactivated successfully.'
    isDeactivateModalOpen.value = false
    pricingSetPendingDeactivate.value = null
    await loadPricingSets()
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to deactivate pricing set.'
  } finally {
    isDeactivatingPricingSet.value = false
  }
}

async function onSubmitForm(payload: PricingSetsFormPayload): Promise<void> {
  isSubmitting.value = true
  pageError.value = ''
  pageSuccess.value = ''

  try {
    if (editingPricingSetId.value) {
      await updatePricingSet(editingPricingSetId.value, payload)
      pageSuccess.value = 'Pricing set updated successfully.'
    } else {
      await createPricingSet(payload)
      pageSuccess.value = 'Pricing set created successfully.'
    }

    closeForm()
    await loadPricingSets()
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to save pricing set.'
  } finally {
    isSubmitting.value = false
  }
}

async function onSignOut(): Promise<void> {
  await signOut()
  await navigateTo('/login')
}
</script>