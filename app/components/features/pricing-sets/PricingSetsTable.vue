<template>
  <section class="space-y-4">
    <div v-if="isLoading" class="space-y-2">
      <div class="h-16 animate-pulse rounded-xl border border-primary-100 bg-primary-100/40" />
      <div class="h-16 animate-pulse rounded-xl border border-primary-100 bg-primary-100/40" />
      <div class="h-16 animate-pulse rounded-xl border border-primary-100 bg-primary-100/40" />
    </div>

    <div v-else-if="pricingSets.length === 0" class="rounded-xl border border-dashed border-primary-200/80 bg-surface p-6 text-center text-sm text-muted">
      No pricing sets found.
    </div>

    <template v-else>
      <div class="space-y-3 lg:hidden">
        <article v-for="pricingSet in pricingSets" :key="pricingSet.id" class="rounded-xl border border-primary-100/70 bg-white/60 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="text-sm font-semibold text-foreground">{{ pricingSet.name }}</h3>
              <p class="mt-1 text-xs uppercase tracking-wide text-muted">{{ pricingSet.category }}</p>
            </div>
            <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold" :class="pricingSet.active ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'">
              {{ pricingSet.active ? 'Active' : 'Inactive' }}
            </span>
          </div>

          <p class="mt-3 text-xs text-muted">{{ formatItems(pricingSet) }}</p>

          <div class="mt-4 flex items-center gap-2">
            <button type="button" class="btn-outline flex-1 !px-2 !py-1.5 text-xs" @click="emit('edit', pricingSet)">Edit</button>
            <button type="button" class="btn-outline !px-2 !py-1.5 text-xs text-error-600 dark:text-error-400" :disabled="!pricingSet.active" @click="emit('request-deactivate', pricingSet)">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z" />
              </svg>
            </button>
          </div>
        </article>
      </div>

      <div class="hidden overflow-hidden rounded-xl border border-primary-100/70 bg-white/60 shadow-sm dark:border-white/10 dark:bg-white/[0.03] lg:block">
        <div class="grid grid-cols-[minmax(180px,1fr)_120px_minmax(260px,1.3fr)_110px_160px_96px] gap-3 border-b border-primary-100/70 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted dark:border-white/10">
          <span>Name</span>
          <span>Category</span>
          <span>Items</span>
          <span>Status</span>
          <span>Created</span>
          <span class="text-right">Actions</span>
        </div>

        <div v-for="pricingSet in pricingSets" :key="pricingSet.id" class="grid grid-cols-[minmax(180px,1fr)_120px_minmax(260px,1.3fr)_110px_160px_96px] items-center gap-3 border-b border-primary-100/50 px-4 py-3 text-sm last:border-b-0 dark:border-white/10">
          <span class="font-semibold text-foreground">{{ pricingSet.name }}</span>
          <span class="text-muted">{{ pricingSet.category }}</span>
          <span class="truncate text-muted">{{ formatItems(pricingSet) }}</span>
          <span class="inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold" :class="pricingSet.active ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'">
            {{ pricingSet.active ? 'Active' : 'Inactive' }}
          </span>
          <span class="text-muted">{{ formatCreatedAt(pricingSet.created_at) }}</span>
          <div class="flex items-center justify-end gap-1">
            <button type="button" class="inline-flex h-8 w-8 items-center justify-center rounded-md text-primary-600 transition hover:bg-primary-100/50 dark:text-primary-400 dark:hover:bg-white/10" :title="`Edit ${pricingSet.name}`" :aria-label="`Edit ${pricingSet.name}`" @click="emit('edit', pricingSet)">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                <path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
              </svg>
            </button>
            <button type="button" class="inline-flex h-8 w-8 items-center justify-center rounded-md text-error-600 transition hover:bg-error-100/50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-error-400 dark:hover:bg-error-500/10" :title="`Deactivate ${pricingSet.name}`" :aria-label="`Deactivate ${pricingSet.name}`" :disabled="!pricingSet.active" @click="emit('request-deactivate', pricingSet)">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import type { PricingSetDTO } from '../../../../shared/types/PricingSetDTO'

interface Props {
  pricingSets: PricingSetDTO[]
  isLoading?: boolean
}

withDefaults(defineProps<Props>(), {
  isLoading: false,
})

const emit = defineEmits<{
  edit: [pricingSet: PricingSetDTO]
  'request-deactivate': [pricingSet: PricingSetDTO]
}>()

function formatItems(pricingSet: PricingSetDTO): string {
  return pricingSet.items.map((item) => `${item.quantity}x ${item.pricing_item.name}`).join(' · ')
}

function formatCreatedAt(value: string): string {
  if (!value) {
    return '—'
  }

  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
</script>