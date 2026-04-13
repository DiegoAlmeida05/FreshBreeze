<template>
  <div class="table-surface">
    <div v-if="isLoading" class="space-y-3 p-4">
      <div class="h-20 animate-pulse rounded-lg bg-primary-100/50" />
      <div class="h-20 animate-pulse rounded-lg bg-primary-100/50" />
      <div class="h-20 animate-pulse rounded-lg bg-primary-100/50" />
    </div>

    <div v-else-if="reports.length === 0" class="flex items-center justify-center px-4 py-12">
      <p class="text-sm text-muted">{{ emptyMessage }}</p>
    </div>

    <template v-else>
      <div class="space-y-3 p-4 md:hidden">
        <ReportCard
          v-for="report in reports"
          :key="`mobile-${report.id}`"
          :report="report"
          :is-status-updating="statusUpdatingIds.has(report.id)"
          :is-deleting="deletingIds.has(report.id)"
          :can-manage-status="canManageStatus"
          :can-edit="canEdit"
          :can-delete="canDelete"
          @view="emit('view', report)"
          @toggle-status="emit('toggle-status', report)"
          @delete="emit('delete', report)"
        />
      </div>

      <div class="hidden overflow-x-auto md:block">
        <table class="table-base min-w-[1220px] table-fixed">
          <thead>
            <tr class="border-b border-border/80">
              <th class="w-36">Created date</th>
              <th class="w-44">Property</th>
              <th class="w-40">Client</th>
              <th class="w-32">Title</th>
              <th class="w-[13rem]">Description</th>
              <th class="w-28">Status</th>
              <th class="w-40">Created by</th>
              <th class="w-40">Resolved by / at</th>
              <th class="w-44 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="report in reports"
              :key="`desktop-${report.id}`"
            >
              <td class="align-top text-xs text-muted">{{ formatDateTime(report.created_at) }}</td>
              <td class="align-top text-xs text-muted break-words">{{ report.property_name || 'Unknown property' }}</td>
              <td class="align-top text-xs text-muted break-words">{{ report.client_name || 'Unknown client' }}</td>
              <td class="align-top">
                <p class="line-clamp-2 text-sm font-semibold text-foreground" :title="report.title">{{ report.title }}</p>
              </td>
              <td class="align-top text-xs text-muted">
                <p class="line-clamp-2" :title="report.description_pt || 'No description'">
                  {{ report.description_pt || 'No description' }}
                </p>
              </td>
              <td class="align-top">
                <span
                  class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="report.status === 'resolved' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'"
                >
                  {{ report.status === 'resolved' ? 'Resolved' : 'Open' }}
                </span>
              </td>
              <td class="align-top text-xs text-muted">
                <p>{{ displayUser(report.created_by_name) }}</p>
              </td>
              <td class="align-top text-xs text-muted">
                <p>{{ report.status === 'resolved' ? displayUser(report.resolved_by_name) : '—' }}</p>
                <p class="mt-1">{{ report.status === 'resolved' ? formatDateTime(report.resolved_at || '') : '—' }}</p>
              </td>
              <td class="align-middle">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    class="btn-outline !h-8 !px-2 !py-1 text-xs"
                    @click="emit('view', report)"
                  >
                    View
                  </button>

                  <button
                    v-if="canManageStatus"
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-md text-success transition hover:bg-success/15 dark:text-success"
                    :title="report.status === 'resolved' ? 'Reopen report' : 'Mark as resolved'"
                    :aria-label="report.status === 'resolved' ? 'Reopen report' : 'Mark as resolved'"
                    :disabled="statusUpdatingIds.has(report.id) || deletingIds.has(report.id)"
                    @click="emit('toggle-status', report)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
                      <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-md text-error-600 transition hover:bg-error-100/50 dark:text-error-400 dark:hover:bg-error-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete report"
                    aria-label="Delete report"
                    :disabled="!canDelete || deletingIds.has(report.id) || statusUpdatingIds.has(report.id)"
                    @click="emit('delete', report)"
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
    </template>
  </div>
</template>

<script setup lang="ts">
import ReportCard from './ReportCard.vue'
import type { PropertyReportAdminListItemDTO } from '../../../../shared/types/PropertyReportDTO'

interface Props {
  reports: PropertyReportAdminListItemDTO[]
  photosByReportId: Record<string, string[]>
  statusUpdatingIds: Set<string>
  deletingIds: Set<string>
  canManageStatus: boolean
  canEdit: boolean
  canDelete: boolean
  isLoading: boolean
  emptyMessage?: string
}

interface Emits {
  view: [report: PropertyReportAdminListItemDTO]
  'toggle-status': [report: PropertyReportAdminListItemDTO]
  delete: [report: PropertyReportAdminListItemDTO]
}

withDefaults(defineProps<Props>(), {
  emptyMessage: 'No reports found for the selected filters.',
})

const emit = defineEmits<Emits>()

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
