<template>
  <NuxtLayout name="admin-layout" @signout="onSignOut">
    <section class="space-y-4">
      <!-- Page Header -->
      <div class="action-bar">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-primary-600">Management</p>
          <h2 class="mt-1 text-2xl font-semibold text-foreground">Client Management</h2>
        </div>

        <button
          type="button"
          class="btn-primary"
          @click="openCreateForm"
        >
          Add client
        </button>
      </div>

      <!-- Search Bar -->
      <div class="toolbar-surface grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div class="sm:col-span-2">
          <label for="clients-search" class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Search</label>
          <div class="relative">
            <input
              id="clients-search"
              v-model="searchTerm"
              type="text"
              class="input-base pr-10"
              placeholder="Search by client name"
            />
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted">
              <path fill-rule="evenodd" d="M10.5 3a7.5 7.5 0 1 0 4.75 13.305l4.223 4.222 1.06-1.06-4.222-4.223A7.5 7.5 0 0 0 10.5 3Zm-6 7.5a6 6 0 1 1 12 0 6 6 0 0 1-12 0Z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>

        <div>
          <label for="clients-page-size" class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Items per page</label>
          <select id="clients-page-size" v-model.number="pageSize" class="select-base">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option>
          </select>
        </div>
      </div>

      <!-- Feedback Banners -->
      <BaseFeedbackBanner
        v-if="pageError"
        tone="error"
        title="Client action failed"
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

      <!-- Clients Table -->
      <ClientTable
        :clients="paginatedClients"
        :is-loading="isLoading"
        @edit="openEditForm"
        @deleted="onClientDeleted"
        @error="onTableError"
      />

      <!-- Pagination -->
      <div v-if="filteredClients.length > pageSize" class="pagination-bar rounded-2xl">
        <p class="text-xs text-muted sm:text-sm">
          Showing {{ pageStart }}-{{ pageEnd }} of {{ filteredClients.length }} client(s)
        </p>

        <div class="inline-flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            class="btn-outline !px-3 !py-1.5 text-xs"
            :disabled="currentPage === 1"
            @click="currentPage -= 1"
          >
            Previous
          </button>
          <span class="text-xs font-medium text-foreground sm:text-sm">Page {{ currentPage }} of {{ totalPages }}</span>
          <button
            type="button"
            class="btn-outline !px-3 !py-1.5 text-xs"
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
        class="modal-backdrop"
        @click.self="closeForm"
      >
        <div class="modal-surface max-h-[calc(100vh-3rem)] max-w-2xl overflow-y-auto">
          <div class="modal-header">
            <h3 class="text-base font-semibold text-foreground">
              {{ editingClientId ? 'Edit client' : 'New client' }}
            </h3>
            <button type="button" class="btn-outline !px-3 !py-1.5" @click="closeForm">Close</button>
          </div>

          <div class="modal-body">
            <ClientForm
              :mode="editingClientId ? 'edit' : 'create'"
              :client="selectedClient"
              :is-submitting="isSubmitting"
              :submit-label="editingClientId ? 'Update' : 'Create'"
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
import BaseFeedbackBanner from '../../components/ui/BaseFeedbackBanner.vue'
import ClientForm from '../../components/features/clients/ClientForm.vue'
import ClientTable from '../../components/features/clients/ClientTable.vue'
import { useAuth } from '../../composables/useAuth'
import { useClients } from '../../composables/useClients'
import type { ClientDTO, CreateClientDTO, UpdateClientDTO } from '../../../shared/types/ClientDTO'
import type { ClientFormPayload } from '../../components/features/clients/ClientForm.vue'

definePageMeta({
  name: 'admin-clients',
})

const { signOut } = useAuth()
const { fetchClients, getClientById, createClient, updateClient } = useClients()

const clients = ref<ClientDTO[]>([])
const selectedClient = ref<ClientDTO | null>(null)
const editingClientId = ref<string | null>(null)
const isLoading = ref(false)
const isSubmitting = ref(false)
const isFormOpen = ref(false)
const pageError = ref('')
const pageSuccess = ref('')
const searchTerm = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

const filteredClients = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()

  if (!query) {
    return clients.value
  }

  return clients.value.filter((client) => {
    return client.name.toLowerCase().includes(query)
  })
})

const totalPages = computed(() => {
  const total = Math.ceil(filteredClients.value.length / pageSize.value)
  return total > 0 ? total : 1
})

const paginatedClients = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value

  return filteredClients.value.slice(start, end)
})

const pageStart = computed(() => {
  if (filteredClients.value.length === 0) {
    return 0
  }

  return (currentPage.value - 1) * pageSize.value + 1
})

const pageEnd = computed(() => {
  const end = currentPage.value * pageSize.value
  return end > filteredClients.value.length ? filteredClients.value.length : end
})

watch([searchTerm, pageSize], () => {
  currentPage.value = 1
})

watch(totalPages, (value) => {
  if (currentPage.value > value) {
    currentPage.value = value
  }
})

onMounted(async () => {
  await loadClients()
})

async function loadClients(): Promise<void> {
  isLoading.value = true
  pageError.value = ''

  try {
    clients.value = await fetchClients()
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to load clients.'
  } finally {
    isLoading.value = false
  }
}

function openCreateForm(): void {
  selectedClient.value = null
  editingClientId.value = null
  pageError.value = ''
  pageSuccess.value = ''
  isFormOpen.value = true
}

async function openEditForm(client: ClientDTO): Promise<void> {
  pageError.value = ''
  pageSuccess.value = ''

  try {
    const loaded = await getClientById(client.id)

    if (!loaded) {
      pageError.value = 'Client not found.'
      return
    }

    selectedClient.value = loaded
    editingClientId.value = loaded.id
    isFormOpen.value = true
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to load client.'
  }
}

function closeForm(): void {
  isFormOpen.value = false
  selectedClient.value = null
  editingClientId.value = null
}

async function onSubmitForm(payload: ClientFormPayload): Promise<void> {
  isSubmitting.value = true
  pageError.value = ''
  pageSuccess.value = ''

  try {
    if (editingClientId.value) {
      // Edit mode
      const updatePayload: UpdateClientDTO = {
        name: payload.name,
        color: payload.color,
        hourly_rate: payload.hourly_rate,
        linen_combo_price: payload.linen_combo_price,
        amenities_combo_price: payload.amenities_combo_price,
        extra_towel_price: payload.extra_towel_price,
        active: payload.active,
      }

      await updateClient(editingClientId.value, updatePayload)
      pageSuccess.value = 'Client updated successfully.'
    } else {
      // Create mode
      const createPayload: CreateClientDTO = {
        name: payload.name,
        color: payload.color,
        hourly_rate: payload.hourly_rate,
        linen_combo_price: payload.linen_combo_price,
        amenities_combo_price: payload.amenities_combo_price,
        extra_towel_price: payload.extra_towel_price,
        active: payload.active,
      }

      await createClient(createPayload)
      pageSuccess.value = 'Client created successfully.'
    }

    closeForm()
    await loadClients()
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to save client.'
  } finally {
    isSubmitting.value = false
  }
}

function onTableError(message: string): void {
  pageError.value = message
}

async function onClientDeleted(): Promise<void> {
  pageSuccess.value = 'Client deleted successfully.'
  await loadClients()
}

async function onSignOut(): Promise<void> {
  await signOut()
  await navigateTo('/login')
}
</script>
