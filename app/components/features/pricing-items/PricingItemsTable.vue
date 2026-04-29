<template>
  <div>
    <div class="space-y-3 lg:hidden">
      <div v-if="isLoading" class="rounded-xl border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted">
        Loading pricing items...
      </div>
      <div v-else-if="pricingItems.length === 0" class="rounded-xl border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted">
        No pricing items found.
      </div>
      <article
        v-for="pricingItem in pricingItems"
        :key="pricingItem.id"
        class="rounded-xl border border-border bg-surface p-4"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-foreground">{{ pricingItem.name }}</p>
          </div>
          <span
            class="inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
            :class="pricingItem.active ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'"
          >
            {{ pricingItem.active ? 'Active' : 'Inactive' }}
          </span>
        </div>

        <div class="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
          <span class="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-700 dark:bg-white/10 dark:text-primary-300">
            {{ pricingItem.category }}
          </span>
          <span class="font-semibold tabular-nums text-foreground">${{ pricingItem.unit_price.toFixed(2) }}</span>
        </div>

        <div class="mt-3 flex items-center gap-2">
          <button type="button" class="btn-outline flex-1 !px-2 !py-1.5 text-xs" @click="emit('edit', pricingItem)">
            Edit
          </button>
          <button
            type="button"
            class="btn-outline !px-2 !py-1.5 text-xs text-error-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-error-400"
            :disabled="!pricingItem.active"
            :aria-label="`Deactivate ${pricingItem.name}`"
            @click="emit('request-deactivate', pricingItem)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z" />
            </svg>
          </button>
        </div>
      </article>
    </div>

    <div class="hidden overflow-hidden rounded-xl border border-border lg:block">
      <table class="w-full text-sm">
        <thead class="bg-muted/30 text-[11px] uppercase tracking-wide text-muted">
          <tr>
            <th class="px-4 py-3 text-left font-semibold">Name</th>
            <th class="px-4 py-3 text-left font-semibold">Category</th>
            <th class="px-4 py-3 text-right font-semibold">Unit price</th>
            <th class="px-4 py-3 text-center font-semibold">Status</th>
            <th class="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="5" class="px-4 py-8 text-center text-sm text-muted">Loading pricing items...</td>
          </tr>
          <tr v-else-if="pricingItems.length === 0">
            <td colspan="5" class="px-4 py-8 text-center text-sm text-muted">No pricing items found.</td>
          </tr>
          <tr
            v-for="pricingItem in pricingItems"
            :key="pricingItem.id"
            class="border-t border-border/60 transition hover:bg-muted/10"
          >
            <td class="px-4 py-3">
              <p class="font-semibold text-foreground">{{ pricingItem.name }}</p>
            </td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-700 dark:bg-white/10 dark:text-primary-300">
                {{ pricingItem.category }}
              </span>
            </td>
            <td class="px-4 py-3 text-right font-semibold tabular-nums">${{ pricingItem.unit_price.toFixed(2) }}</td>
            <td class="px-4 py-3 text-center">
              <span
                class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                :class="pricingItem.active ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'"
              >
                {{ pricingItem.active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1">
                <button
                  type="button"
                  class="inline-flex h-8 w-8 items-center justify-center rounded-md text-primary-600 transition hover:bg-primary-100/50 dark:text-primary-400 dark:hover:bg-white/10"
                  title="Edit pricing item"
                  aria-label="Edit pricing item"
                  @click="emit('edit', pricingItem)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                    <path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="inline-flex h-8 w-8 items-center justify-center rounded-md text-error-600 transition hover:bg-error-100/50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-error-400 dark:hover:bg-error-500/10"
                  title="Deactivate pricing item"
                  aria-label="Deactivate pricing item"
                  :disabled="!pricingItem.active"
                  @click="emit('request-deactivate', pricingItem)"
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
import type { PricingItemDTO } from '../../../../shared/types/PricingItemDTO'

interface Props {
  pricingItems: PricingItemDTO[]
  isLoading?: boolean
}

withDefaults(defineProps<Props>(), {
  isLoading: false,
})

const emit = defineEmits<{
  edit: [pricingItem: PricingItemDTO]
  'request-deactivate': [pricingItem: PricingItemDTO]
}>()
</script>