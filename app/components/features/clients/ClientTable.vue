<template>
  <div class="table-surface">
    <!-- Mobile View -->
    <div class="block md:hidden">
      <div v-if="isLoading" class="space-y-3 p-4">
        <div class="h-20 animate-pulse rounded-lg bg-primary-100/50" />
        <div class="h-20 animate-pulse rounded-lg bg-primary-100/50" />
        <div class="h-20 animate-pulse rounded-lg bg-primary-100/50" />
      </div>

      <div v-else-if="clients.length === 0" class="flex items-center justify-center px-4 py-12">
        <p class="text-sm text-muted">No clients yet. Create your first client to get started.</p>
      </div>

      <div v-else class="divide-y divide-border/70">
        <div v-for="client in clients" :key="client.id" class="space-y-2.5 p-3 transition-colors hover:bg-primary-50/30 dark:hover:bg-white/[0.03]">
          <div class="flex items-center gap-3">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span
                  :style="{ backgroundColor: client.color }"
                  class="h-3.5 w-3.5 shrink-0 rounded-full ring-2 ring-surface"
                  :title="client.color"
                />
                <p class="truncate text-base font-semibold text-foreground">{{ client.name }}</p>
              </div>
              <p class="mt-0.5 text-xs text-muted">{{ formatCurrency(client.hourly_rate) }}/hr</p>
              <div class="mt-2 grid grid-cols-1 gap-1 text-xs text-muted">
                <span class="rounded-md bg-primary-50/60 px-2 py-0.5 dark:bg-white/5"><span class="font-medium text-foreground/70">Linen combo:</span> {{ formatCurrency(client.linen_combo_price) }}</span>
                <span class="rounded-md bg-primary-50/60 px-2 py-0.5 dark:bg-white/5"><span class="font-medium text-foreground/70">Amenities combo:</span> {{ formatCurrency(client.amenities_combo_price) }}</span>
                <span class="rounded-md bg-primary-50/60 px-2 py-0.5 dark:bg-white/5"><span class="font-medium text-foreground/70">Extra towel:</span> {{ formatCurrency(client.extra_towel_price) }}</span>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <span
                class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                :class="client.active ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'"
              >
                {{ client.active ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              class="btn-outline min-w-[88px] !px-3 !py-1.5 text-xs"
              @click="emit('edit', client)"
            >
              Edit
            </button>
            <button
              type="button"
              class="btn-outline inline-flex h-8 w-8 items-center justify-center !px-0 !py-0 text-error-600 dark:text-error-400"
              @click="onDelete(client)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop View -->
    <div class="hidden md:block">
      <div v-if="isLoading" class="space-y-2 p-6">
        <div class="h-12 animate-pulse rounded-lg bg-primary-100/50" />
        <div class="h-12 animate-pulse rounded-lg bg-primary-100/50" />
        <div class="h-12 animate-pulse rounded-lg bg-primary-100/50" />
      </div>

      <div v-else-if="clients.length === 0" class="flex items-center justify-center px-6 py-12">
        <p class="text-sm text-muted">No clients yet. Create your first client to get started.</p>
      </div>

      <table v-else class="table-base">
        <thead>
          <tr>
            <th>Client</th>
            <th class="table-numeric">Rate/hr</th>
            <th class="table-numeric" title="Invoice linen combo price">Linen combo</th>
            <th class="table-numeric" title="Invoice amenities combo price">Amenities combo</th>
            <th class="table-numeric">Extra towel</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="client in clients" :key="client.id">
            <td>
              <div class="flex items-center gap-2.5">
                <span
                  :style="{ backgroundColor: client.color }"
                  class="h-3.5 w-3.5 shrink-0 rounded-full ring-2 ring-surface"
                  :title="client.color"
                />
                <p class="truncate font-semibold text-foreground">{{ client.name }}</p>
              </div>
            </td>
            <td class="table-numeric font-medium">
              {{ formatCurrency(client.hourly_rate) }}
            </td>
            <td class="table-numeric">
              {{ formatCurrency(client.linen_combo_price) }}
            </td>
            <td class="table-numeric">
              {{ formatCurrency(client.amenities_combo_price) }}
            </td>
            <td class="table-numeric">
              {{ formatCurrency(client.extra_towel_price) }}
            </td>
            <td>
              <span
                class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                :class="client.active ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'"
              >
                {{ client.active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>
              <div class="inline-flex items-center gap-1 rounded-lg border border-border/80 px-1 py-1">
                <button
                  type="button"
                  class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-primary-600 transition hover:bg-primary-100/60 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:text-primary-400 dark:hover:bg-white/10"
                  title="Edit client"
                  aria-label="Edit client"
                  @click="emit('edit', client)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                    <path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-error-600 transition hover:bg-error-100/60 focus:outline-none focus:ring-2 focus:ring-error-500/30 dark:text-error-400 dark:hover:bg-error-500/10"
                  title="Delete client"
                  aria-label="Delete client"
                  @click="onDelete(client)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="clientToDelete"
        class="modal-backdrop z-[100]"
        @click.self="clientToDelete = null"
      >
        <div class="modal-surface max-w-sm">
          <div class="modal-header">
            <h3 class="text-base font-semibold text-foreground">Delete client?</h3>
          </div>
          <div class="modal-body">
            <p class="text-sm text-muted">
              Are you sure you want to delete <strong>{{ clientToDelete.name }}</strong>? This action cannot be undone.
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-outline" :disabled="isDeleting" @click="clientToDelete = null">
              Cancel
            </button>
            <button type="button" class="btn-danger" :disabled="isDeleting" @click="confirmDelete">
              {{ isDeleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ClientDTO } from '../../../../shared/types/ClientDTO'
import { useClients } from '../../../composables/useClients'

interface Props {
  clients: ClientDTO[]
  isLoading?: boolean
}

interface Emits {
  edit: [client: ClientDTO]
  deleted: []
  error: [message: string]
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const { deleteClient } = useClients()
const clientToDelete = ref<ClientDTO | null>(null)
const isDeleting = ref(false)

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(value)
}

function onDelete(client: ClientDTO): void {
  clientToDelete.value = client
}

async function confirmDelete(): Promise<void> {
  if (!clientToDelete.value) return

  isDeleting.value = true

  try {
    await deleteClient(clientToDelete.value.id)
    clientToDelete.value = null
    emit('deleted')
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete client.'
    emit('error', message)
  } finally {
    isDeleting.value = false
  }
}
</script>
