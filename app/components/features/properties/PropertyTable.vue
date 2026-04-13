<template>
  <div class="table-surface">

    <!-- Mobile View -->
    <div class="block md:hidden">
      <div v-if="isLoading" class="space-y-3 p-4">
        <div class="h-24 animate-pulse rounded-lg bg-primary-100/50" />
        <div class="h-24 animate-pulse rounded-lg bg-primary-100/50" />
        <div class="h-24 animate-pulse rounded-lg bg-primary-100/50" />
      </div>

      <div v-else-if="properties.length === 0" class="flex items-center justify-center px-4 py-12">
        <p class="text-sm text-muted">No properties yet. Create your first property to get started.</p>
      </div>

      <div v-else class="divide-y divide-border/70">
        <div v-for="property in properties" :key="property.id" class="space-y-2.5 p-3.5">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <p class="text-base font-semibold tracking-tight text-foreground">{{ property.name }}</p>
              <div class="mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted">
                <span class="inline-block h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: clientColor(property.client_id) }" />
                <span>{{ clientName(property.client_id) }}</span>
              </div>
              <p class="mt-1.5 line-clamp-2 text-xs leading-5 text-muted">{{ property.address }}</p>
              <div class="mt-2 grid grid-cols-2 gap-1.5 text-xs text-muted">
                <span class="rounded-md bg-primary-50/60 px-2 py-1 dark:bg-white/5">
                  <span class="font-medium text-foreground/70">Time</span> {{ formatDuration(property.default_cleaning_minutes) }}
                </span>
                <span class="rounded-md bg-primary-50/60 px-2 py-1 dark:bg-white/5">
                  <span class="font-medium text-foreground/70">Bath</span> {{ property.bathrooms }}
                </span>
                <span class="rounded-md bg-primary-50/60 px-2 py-1 dark:bg-white/5">
                  <span class="font-medium text-foreground/70">SB</span> {{ property.beds_single }}
                </span>
                <span class="rounded-md bg-primary-50/60 px-2 py-1 dark:bg-white/5">
                  <span class="font-medium text-foreground/70">QB</span> {{ property.beds_queen }}
                </span>
                <span class="rounded-md bg-primary-50/60 px-2 py-1 dark:bg-white/5">
                  <span class="font-medium text-foreground/70">KB</span> {{ property.beds_king }}
                </span>
              </div>
              <div class="mt-2 flex flex-wrap gap-1.5">
                <span
                  v-if="property.includes_chocolates"
                  class="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary-700 dark:text-primary-300"
                >
                  🍫 Chocolate
                </span>
                <span
                  v-if="property.extra_towels_default_qty > 0"
                  class="inline-flex rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-semibold text-primary-700 dark:bg-white/10 dark:text-white"
                >
                  Towels {{ property.extra_towels_default_qty }}
                </span>
                <span
                  v-if="property.extra_dishcloths_default_qty > 0"
                  class="inline-flex rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-semibold text-primary-700 dark:bg-white/10 dark:text-white"
                >
                  Dishcloths {{ property.extra_dishcloths_default_qty }}
                </span>
              </div>
              <div v-if="sortedPropertyTags(property).length" class="mt-1.5 flex flex-wrap gap-1.5">
                <span
                  v-for="tag in sortedPropertyTags(property)"
                  :key="`${property.id}-tag-${tag}`"
                  class="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary-700 dark:text-primary-300"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
            <span
              class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
              :class="property.active ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'"
            >
              {{ property.active ? 'Active' : 'Inactive' }}
            </span>
          </div>

          <div class="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              class="btn-outline min-w-[88px] !px-3 !py-1.5 text-xs"
              @click="emit('edit', property)"
            >
              Edit
            </button>
            <button
              type="button"
              class="btn-outline inline-flex h-8 w-8 items-center justify-center !px-0 !py-0 text-error-600 dark:text-error-400"
              @click="onDelete(property)"
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

      <div v-else-if="properties.length === 0" class="flex items-center justify-center px-6 py-12">
        <p class="text-sm text-muted">No properties yet. Create your first property to get started.</p>
      </div>

      <table v-else class="table-base">
        <thead>
          <tr class="border-b border-primary-100 bg-primary-50/50 dark:bg-black/20">
            <th class="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider text-muted">Property</th>
            <th class="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider text-muted">Client</th>
            <th class="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider text-muted">Address</th>
            <th class="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider text-muted" title="Bathrooms / Single Beds / Queen Beds / King Beds">Bath / Beds</th>
            <th class="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider text-muted">Time</th>
            <th class="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider text-muted">Defaults</th>
            <th class="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider text-muted">Status</th>
            <th class="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider text-muted">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-primary-100">
          <tr
            v-for="property in properties"
            :key="property.id"
            class="transition hover:bg-primary-50/30 dark:hover:bg-white/5"
          >
            <td class="px-4 py-4">
              <p class="text-sm font-semibold tracking-tight text-foreground">{{ property.name }}</p>
            </td>
            <td class="px-4 py-4">
              <div class="inline-flex items-center gap-2 text-sm text-foreground">
                <span class="inline-block h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: clientColor(property.client_id) }" />
                <span>{{ clientName(property.client_id) }}</span>
              </div>
            </td>
            <td class="px-4 py-4">
              <p class="max-w-[200px] truncate text-sm text-muted" :title="property.address">{{ property.address }}</p>
            </td>
            <td class="px-4 py-4">
              <p class="text-sm font-medium text-foreground">
                {{ formatBathBedsSummary(property) }}
              </p>
            </td>
            <td class="px-4 py-4">
              <p class="text-sm text-foreground">{{ formatDuration(property.default_cleaning_minutes) }}</p>
            </td>
            <td class="px-4 py-4">
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-if="property.includes_chocolates"
                  class="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary-700 dark:text-primary-300"
                >
                  🍫 Chocolate
                </span>
                <span
                  v-if="property.extra_towels_default_qty > 0"
                  class="inline-flex rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-semibold text-primary-700 dark:bg-white/10 dark:text-white"
                >
                  Towels {{ property.extra_towels_default_qty }}
                </span>
                <span
                  v-if="property.extra_dishcloths_default_qty > 0"
                  class="inline-flex rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-semibold text-primary-700 dark:bg-white/10 dark:text-white"
                >
                  Dishcloths {{ property.extra_dishcloths_default_qty }}
                </span>
                <template v-if="sortedPropertyTags(property).length">
                  <span
                    v-for="tag in sortedPropertyTags(property)"
                    :key="`${property.id}-deskTag-${tag}`"
                    class="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary-700 dark:text-primary-300"
                  >
                    {{ tag }}
                  </span>
                </template>
                <span
                  v-if="!property.includes_chocolates && property.extra_towels_default_qty === 0 && property.extra_dishcloths_default_qty === 0 && !sortedPropertyTags(property).length"
                  class="text-sm text-muted"
                >
                  —
                </span>
              </div>
            </td>
            <td class="px-4 py-4">
              <span
                class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                :class="property.active ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'"
              >
                {{ property.active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="px-4 py-4">
              <div class="inline-flex items-center gap-1 rounded-lg border border-border/80 px-1 py-1">
                <button
                  type="button"
                  class="inline-flex h-8 w-8 items-center justify-center rounded-md text-primary-600 transition hover:bg-primary-100/50 dark:text-primary-400 dark:hover:bg-white/10"
                  title="Edit property"
                  aria-label="Edit property"
                  @click="emit('edit', property)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                    <path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="inline-flex h-8 w-8 items-center justify-center rounded-md text-error-600 transition hover:bg-error-100/50 dark:text-error-400 dark:hover:bg-error-500/10"
                  title="Delete property"
                  aria-label="Delete property"
                  @click="onDelete(property)"
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
        v-if="propertyToDelete"
        class="modal-backdrop z-[100]"
        @click.self="propertyToDelete = null"
      >
        <div class="modal-surface max-w-sm">
          <div class="modal-header">
            <h3 class="text-base font-semibold text-foreground">Delete property?</h3>
          </div>
          <div class="modal-body">
            <p class="text-sm text-muted">
              Are you sure you want to delete <strong>{{ propertyToDelete.name }}</strong>? This action cannot be undone.
            </p>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn-outline"
              :disabled="isDeleting"
              @click="propertyToDelete = null"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn-danger"
              :disabled="isDeleting"
              @click="confirmDelete"
            >
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
import type { PropertyDTO } from '../../../../shared/types/PropertyDTO'
import { useProperties } from '../../../composables/useProperties'
import { sortVisualReferenceTags } from '../../../utils/visualTaskTags'

interface Props {
  properties: PropertyDTO[]
  clients: ClientDTO[]
  isLoading?: boolean
}

interface Emits {
  edit: [property: PropertyDTO]
  deleted: []
  error: [message: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { deleteProperty } = useProperties()
const propertyToDelete = ref<PropertyDTO | null>(null)
const isDeleting = ref(false)

function clientName(clientId: string): string {
  return props.clients.find((c) => c.id === clientId)?.name ?? '—'
}

function clientColor(clientId: string): string {
  return props.clients.find((c) => c.id === clientId)?.color ?? '#9ca3af'
}

function formatBathBedsSummary(property: PropertyDTO): string {
  const parts: string[] = []

  if (property.beds_single > 0) parts.push(`${property.beds_single}S`)
  if (property.beds_queen > 0) parts.push(`${property.beds_queen}Q`)
  if (property.beds_king > 0) parts.push(`${property.beds_king}K`)
  if (property.bathrooms > 0) parts.push(`${property.bathrooms}B`)

  return parts.join(' | ') || '—'
}

function formatDuration(minutes: number): string {
  const safeMinutes = Number.isFinite(minutes) ? Math.max(0, Math.trunc(minutes)) : 0
  if (safeMinutes === 0) return '0 min'

  const hours = safeMinutes / 60
  const hourText = Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`
  return `${safeMinutes} min (${hourText})`
}

function sortedPropertyTags(property: PropertyDTO): string[] {
  return sortVisualReferenceTags(property.default_tags)
}

function onDelete(property: PropertyDTO): void {
  propertyToDelete.value = property
}

async function confirmDelete(): Promise<void> {
  if (!propertyToDelete.value) return

  isDeleting.value = true

  try {
    await deleteProperty(propertyToDelete.value.id)
    propertyToDelete.value = null
    emit('deleted')
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete property.'
    emit('error', message)
  } finally {
    isDeleting.value = false
  }
}
</script>
