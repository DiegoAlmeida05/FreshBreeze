<template>
  <div>
    <!-- Mobile cards -->
    <div class="space-y-3 lg:hidden">
      <div v-if="isLoading" class="rounded-xl border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted">
        Loading combos...
      </div>
      <div v-else-if="combos.length === 0" class="rounded-xl border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted">
        No combos found.
      </div>
      <article
        v-for="combo in combos"
        :key="combo.id"
        class="rounded-xl border border-border bg-surface p-4"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-foreground">{{ combo.name }}</p>
            <p class="mt-0.5 text-xs text-muted">{{ combo.description || '—' }}</p>
          </div>
          <span
            class="inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
            :class="combo.active ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'"
          >
            {{ combo.active ? 'Active' : 'Inactive' }}
          </span>
        </div>

        <div class="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
          <span class="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-700 dark:bg-white/10 dark:text-primary-300">
            {{ combo.category }}
          </span>
          <span class="font-semibold tabular-nums text-foreground">${{ combo.combo_price.toFixed(2) }}</span>
          <span>Sort: {{ combo.sort_order }}</span>
        </div>

        <div class="mt-3 flex items-center gap-2">
          <button type="button" class="btn-outline flex-1 !px-2 !py-1.5 text-xs" @click="emit('edit', combo)">
            Edit
          </button>
          <button type="button" class="btn-outline !px-2 !py-1.5 text-xs text-error-600 dark:text-error-400" @click="onDelete(combo)">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z" />
            </svg>
          </button>
        </div>
      </article>
    </div>

    <!-- Desktop table -->
    <div class="hidden overflow-hidden rounded-xl border border-border lg:block">
      <table class="w-full text-sm">
        <thead class="bg-muted/30 text-[11px] uppercase tracking-wide text-muted">
          <tr>
            <th class="px-4 py-3 text-left font-semibold">Name</th>
            <th class="px-4 py-3 text-left font-semibold">Category</th>
            <th class="px-4 py-3 text-right font-semibold">Price</th>
            <th class="px-4 py-3 text-center font-semibold">Sort</th>
            <th class="px-4 py-3 text-center font-semibold">Status</th>
            <th class="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="6" class="px-4 py-8 text-center text-sm text-muted">Loading combos...</td>
          </tr>
          <tr v-else-if="combos.length === 0">
            <td colspan="6" class="px-4 py-8 text-center text-sm text-muted">No combos found.</td>
          </tr>
          <tr
            v-for="combo in combos"
            :key="combo.id"
            class="border-t border-border/60 transition hover:bg-muted/10"
          >
            <td class="px-4 py-3">
              <p class="font-semibold text-foreground">{{ combo.name }}</p>
              <p v-if="combo.description" class="mt-0.5 max-w-xs truncate text-xs text-muted">{{ combo.description }}</p>
            </td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-700 dark:bg-white/10 dark:text-primary-300">
                {{ combo.category }}
              </span>
            </td>
            <td class="px-4 py-3 text-right font-semibold tabular-nums">${{ combo.combo_price.toFixed(2) }}</td>
            <td class="px-4 py-3 text-center tabular-nums text-muted">{{ combo.sort_order }}</td>
            <td class="px-4 py-3 text-center">
              <span
                class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                :class="combo.active ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'"
              >
                {{ combo.active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1">
                <button
                  type="button"
                  class="inline-flex h-8 w-8 items-center justify-center rounded-md text-primary-600 transition hover:bg-primary-100/50 dark:text-primary-400 dark:hover:bg-white/10"
                  title="Edit combo"
                  aria-label="Edit combo"
                  @click="emit('edit', combo)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                    <path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="inline-flex h-8 w-8 items-center justify-center rounded-md text-error-600 transition hover:bg-error-100/50 dark:text-error-400 dark:hover:bg-error-500/10"
                  title="Delete combo"
                  aria-label="Delete combo"
                  @click="onDelete(combo)"
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
  </div>
</template>

<script setup lang="ts">
import type { ComboCatalogDTO } from '../../../../shared/types/ComboCatalogDTO'
import { useComboCatalog } from '../../../composables/useComboCatalog'

interface Props {
  combos: ComboCatalogDTO[]
  isLoading?: boolean
}

withDefaults(defineProps<Props>(), {
  isLoading: false,
})

const emit = defineEmits<{
  edit: [combo: ComboCatalogDTO]
  deleted: []
  error: [message: string]
}>()

const { deleteCombo } = useComboCatalog()

async function onDelete(combo: ComboCatalogDTO): Promise<void> {
  if (!window.confirm(`Delete "${combo.name}"? This cannot be undone.`)) {
    return
  }

  try {
    await deleteCombo(combo.id)
    emit('deleted')
  } catch (err: unknown) {
    emit('error', err instanceof Error ? err.message : 'Failed to delete combo.')
  }
}
</script>
