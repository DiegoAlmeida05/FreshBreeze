<template>
  <NuxtLayout name="admin-layout" @signout="onSignOut">
    <section class="space-y-4">
      <!-- Page Header -->
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-primary-600">Management</p>
          <h2 class="mt-1 text-2xl font-semibold text-foreground">Property Management</h2>
        </div>

        <button
          type="button"
          class="btn-primary !px-2.5 !py-1.5 text-[11px] sm:!px-3 sm:!py-2 sm:text-xs"
          @click="openCreateForm"
        >
          Add property
        </button>
      </div>

      <!-- Search & Filters -->
      <div class="toolbar-surface grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div class="sm:col-span-2">
          <label for="properties-search" class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Search</label>
          <input
            id="properties-search"
            v-model="searchTerm"
            type="text"
            class="input-base"
            placeholder="Search by property name or address"
          />
        </div>

        <div>
          <label for="properties-client-filter" class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Client</label>
          <select id="properties-client-filter" v-model="selectedClientId" class="select-base">
            <option value="all">All clients</option>
            <option v-for="client in clients" :key="client.id" :value="client.id">
              {{ client.name }}
            </option>
          </select>
        </div>

        <div>
          <label for="properties-page-size" class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Items per page</label>
          <select id="properties-page-size" v-model.number="pageSize" class="select-base">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option>
          </select>
        </div>
      </div>

      <!-- Feedback -->
      <BaseFeedbackBanner
        v-if="pageError"
        tone="error"
        title="Property action failed"
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

      <!-- Table -->
      <PropertyTable
        :properties="paginatedProperties"
        :clients="clients"
        :is-loading="isLoading"
        @edit="openEditForm"
        @deleted="onPropertyDeleted"
        @error="onTableError"
      />

      <!-- Pagination -->
      <div class="pagination-bar">
        <p class="text-xs text-muted sm:text-sm">
          Showing {{ pageStart }}-{{ pageEnd }} of {{ filteredProperties.length }} property(ies)
        </p>
        <div class="inline-flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            class="btn-outline !px-2.5 !py-1.5 text-xs sm:!px-3"
            :disabled="currentPage === 1"
            @click="currentPage -= 1"
          >
            Previous
          </button>
          <span class="text-xs font-medium text-foreground sm:text-sm">Page {{ currentPage }} of {{ totalPages }}</span>
          <button
            type="button"
            class="btn-outline !px-2.5 !py-1.5 text-xs sm:!px-3"
            :disabled="currentPage === totalPages"
            @click="currentPage += 1"
          >
            Next
          </button>
        </div>
      </div>
    </section>

    <!-- Form Modal -->
    <Teleport to="body">
      <div
        v-if="isFormOpen"
        class="modal-backdrop z-[80]"
      >
        <div class="modal-surface max-w-4xl max-h-[calc(100vh-3rem)] overflow-y-auto">
          <div class="modal-header">
            <h3 class="text-lg font-semibold text-foreground">{{ editingPropertyId ? 'Edit property' : 'New property' }}</h3>
            <button type="button" class="btn-outline !px-3 !py-1.5" @click="requestCloseForm">Close</button>
          </div>
          <div class="modal-body">
            <PropertyForm
              :mode="editingPropertyId ? 'edit' : 'create'"
              :property="selectedProperty"
              :is-submitting="isSubmitting"
              :submit-label="editingPropertyId ? 'Update' : 'Create'"
              @dirty-change="onFormDirtyChange"
              @submit="onSubmitForm"
              @cancel="requestCloseForm"
            />
          </div>
        </div>
      </div>
    </Teleport>

    <BaseConfirmModal
      v-model="isDiscardConfirmOpen"
      title="Discard changes?"
      message="You have unsaved property changes. If you close now, everything typed in this form will be lost."
      confirm-label="Discard"
      cancel-label="Keep editing"
      :danger="true"
      @confirm="confirmCloseForm"
      @cancel="closeDiscardConfirm"
    />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import BaseFeedbackBanner from '../../components/ui/BaseFeedbackBanner.vue'
import BaseConfirmModal from '../../components/ui/BaseConfirmModal.vue'
import PropertyForm from '../../components/features/properties/PropertyForm.vue'
import PropertyTable from '../../components/features/properties/PropertyTable.vue'
import { useAuth } from '../../composables/useAuth'
import { useClients } from '../../composables/useClients'
import { usePropertyPricingItems } from '../../composables/usePropertyPricingItems'
import { useProperties } from '../../composables/useProperties'
import type { ClientDTO } from '../../../shared/types/ClientDTO'
import type { PropertyDTO, CreatePropertyDTO, UpdatePropertyDTO } from '../../../shared/types/PropertyDTO'
import type { PropertyFormSubmitPayload } from '../../components/features/properties/PropertyForm.vue'

definePageMeta({
  name: 'admin-properties',
})

const { signOut } = useAuth()
const { fetchClients } = useClients()
const { setPropertyPricingItems } = usePropertyPricingItems()
const { fetchProperties, createProperty, updateProperty, replacePropertyKeys, replacePropertyResources } = useProperties()

const properties = ref<PropertyDTO[]>([])
const clients = ref<ClientDTO[]>([])
const selectedProperty = ref<PropertyDTO | null>(null)
const editingPropertyId = ref<string | null>(null)
const isLoading = ref(false)
const isSubmitting = ref(false)
const isFormOpen = ref(false)
const isFormDirty = ref(false)
const isDiscardConfirmOpen = ref(false)
const pageError = ref('')
const pageSuccess = ref('')
const searchTerm = ref('')
const selectedClientId = ref('all')
const currentPage = ref(1)
const pageSize = ref(10)

const filteredProperties = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()
  const selectedClient = selectedClientId.value

  return properties.value.filter((p) => {
    const matchesClient = selectedClient === 'all' || p.client_id === selectedClient
    if (!matchesClient) {
      return false
    }

    if (!query) {
      return true
    }

    return p.name.toLowerCase().includes(query) || p.address.toLowerCase().includes(query)
  })
})

const totalPages = computed(() => {
  const total = Math.ceil(filteredProperties.value.length / pageSize.value)
  return total > 0 ? total : 1
})

const paginatedProperties = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredProperties.value.slice(start, start + pageSize.value)
})

const pageStart = computed(() => {
  if (filteredProperties.value.length === 0) return 0
  return (currentPage.value - 1) * pageSize.value + 1
})

const pageEnd = computed(() => {
  const end = currentPage.value * pageSize.value
  return end > filteredProperties.value.length ? filteredProperties.value.length : end
})

watch([searchTerm, selectedClientId, pageSize], () => {
  currentPage.value = 1
})

watch(totalPages, (value) => {
  if (currentPage.value > value) currentPage.value = value
})

onMounted(async () => {
  await Promise.all([loadProperties(), loadClients()])
})

async function loadProperties(): Promise<void> {
  isLoading.value = true
  pageError.value = ''

  try {
    properties.value = await fetchProperties()
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to load properties.'
  } finally {
    isLoading.value = false
  }
}

async function loadClients(): Promise<void> {
  try {
    clients.value = await fetchClients()
  } catch {
    // clients will be empty — form handles its own load
  }
}

function openCreateForm(): void {
  selectedProperty.value = null
  editingPropertyId.value = null
  isFormDirty.value = false
  isDiscardConfirmOpen.value = false
  pageError.value = ''
  pageSuccess.value = ''
  isFormOpen.value = true
}

async function openEditForm(property: PropertyDTO): Promise<void> {
  pageError.value = ''
  pageSuccess.value = ''

  selectedProperty.value = property
  editingPropertyId.value = property.id
  isFormDirty.value = false
  isDiscardConfirmOpen.value = false
  isFormOpen.value = true
}

function closeForm(): void {
  isFormOpen.value = false
  isFormDirty.value = false
  isDiscardConfirmOpen.value = false
  selectedProperty.value = null
  editingPropertyId.value = null
}

function onFormDirtyChange(value: boolean): void {
  isFormDirty.value = value
}

function requestCloseForm(): void {
  if (isSubmitting.value) {
    return
  }

  if (!isFormDirty.value) {
    closeForm()
    return
  }

  isDiscardConfirmOpen.value = true
}

function closeDiscardConfirm(): void {
  isDiscardConfirmOpen.value = false
}

function confirmCloseForm(): void {
  closeForm()
}

async function onSubmitForm(payload: PropertyFormSubmitPayload): Promise<void> {
  isSubmitting.value = true
  pageError.value = ''
  pageSuccess.value = ''

  try {
    let savedProperty: PropertyDTO

    if (editingPropertyId.value) {
      savedProperty = await updateProperty(editingPropertyId.value, payload.property as UpdatePropertyDTO)
      pageSuccess.value = 'Property updated successfully.'
    } else {
      savedProperty = await createProperty(payload.property as CreatePropertyDTO)
      pageSuccess.value = 'Property created successfully.'
    }

    await Promise.all([
      replacePropertyKeys(savedProperty.id, payload.propertyKeys),
      replacePropertyResources(savedProperty.id, payload.propertyResources),
      setPropertyPricingItems(savedProperty.id, payload.pricingItems),
    ])

    closeForm()
    await loadProperties()
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to save property.'
  } finally {
    isSubmitting.value = false
  }
}

async function onPropertyDeleted(): Promise<void> {
  pageSuccess.value = 'Property deleted successfully.'
  await loadProperties()
}

function onTableError(message: string): void {
  pageError.value = message
}

async function onSignOut(): Promise<void> {
  await signOut()
  await navigateTo('/login')
}
</script>
