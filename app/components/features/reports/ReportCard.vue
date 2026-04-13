<template>
  <article class="rounded-xl border border-primary-100 bg-primary-50/30 p-3 dark:border-white/10 dark:bg-white/5">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="max-w-full break-words text-sm font-semibold text-foreground" :title="report.title">{{ report.title }}</p>
      <span
        class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
        :class="report.status === 'resolved' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'"
      >
        {{ report.status === 'resolved' ? 'Resolved' : 'Open' }}
      </span>
    </div>

    <div class="mt-2 grid grid-cols-1 gap-1 break-words text-[11px] text-muted sm:grid-cols-2">
      <p><span class="font-medium text-foreground/80">Property:</span> {{ report.property_name || 'Unknown property' }}</p>
      <p><span class="font-medium text-foreground/80">Client:</span> {{ report.client_name || 'Unknown client' }}</p>
      <p><span class="font-medium text-foreground/80">Created by:</span> {{ displayUser(report.created_by_name) }}</p>
      <p><span class="font-medium text-foreground/80">Created at:</span> {{ formatDateTime(report.created_at) }}</p>
      <p><span class="font-medium text-foreground/80">Resolved by:</span> {{ report.status === 'resolved' ? displayUser(report.resolved_by_name) : '—' }}</p>
      <p><span class="font-medium text-foreground/80">Resolved at:</span> {{ report.status === 'resolved' ? formatDateTime(report.resolved_at || '') : '—' }}</p>
    </div>

    <p class="mt-2 line-clamp-2 break-all text-xs text-muted" :title="shortDescription">
      {{ shortDescription }}
    </p>

    <div class="mt-3 flex items-center gap-2">
      <button
        type="button"
        class="btn-outline !px-2 !py-1.5 text-xs"
        @click="emit('view')"
      >
        View
      </button>

      <button
        v-if="canManageStatus"
        type="button"
        class="inline-flex h-8 w-8 items-center justify-center rounded-md text-success transition hover:bg-success/15 dark:text-success"
        :title="report.status === 'resolved' ? 'Reopen report' : 'Mark as resolved'"
        :aria-label="report.status === 'resolved' ? 'Reopen report' : 'Mark as resolved'"
        :disabled="isStatusUpdating || isDeleting"
        @click="emit('toggle-status')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
          <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
      </button>

      <button
        type="button"
        class="btn-outline !px-2 !py-1.5 text-xs text-error-600 dark:text-error-400 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="!canDelete || isDeleting || isStatusUpdating"
        @click="emit('delete')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z" />
        </svg>
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropertyReportAdminListItemDTO } from '../../../../shared/types/PropertyReportDTO'

interface Props {
  report: PropertyReportAdminListItemDTO
  isStatusUpdating: boolean
  isDeleting: boolean
  canManageStatus: boolean
  canEdit: boolean
  canDelete: boolean
}

interface Emits {
  view: []
  'toggle-status': []
  delete: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const shortDescription = computed(() => {
  const description = props.report.description_pt?.trim()

  if (!description) {
    return 'No description.'
  }

  return description.length > 160 ? `${description.slice(0, 157)}...` : description
})

function formatDateTime(value: string): string {
  if (!value) {
    return 'N/A'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function displayUser(name: string | null): string {
  return name?.trim() || 'Unknown user'
}
</script>
