<template>
  <div class="table-surface">
    <div v-if="isLoading" class="p-6 text-sm text-muted">Loading holidays...</div>

    <div v-else-if="holidays.length === 0" class="p-6 text-sm text-muted">No holidays found.</div>

    <template v-else>
      <div class="space-y-3 p-3 md:hidden">
        <article
          v-for="holiday in holidays"
          :key="holiday.id"
          class="rounded-xl border border-border/80 p-3 transition-colors hover:bg-primary-50/30 dark:hover:bg-white/[0.03]"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-foreground">{{ holiday.name }}</p>
              <p class="text-xs text-muted">{{ formatDate(holiday.date) }}</p>
            </div>
            <button
              type="button"
              class="inline-flex min-w-[76px] items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold transition"
              :class="holiday.is_active ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'"
              :disabled="isToggling(holiday.id, togglingActiveIds)"
              @click="emit('toggle-active', holiday)"
            >
              {{ isToggling(holiday.id, togglingActiveIds) ? '...' : holiday.is_active ? 'Active' : 'Inactive' }}
            </button>
          </div>

          <p class="mt-2 text-xs text-muted/90">Country: {{ holiday.country || '—' }}</p>
          <p class="text-xs text-muted/90">State: {{ holiday.state || '—' }}</p>

          <div class="mt-3 flex items-center gap-2">
            <button
              type="button"
              class="btn-outline flex-1 !px-2 !py-1.5 text-xs"
              @click="emit('edit', holiday)"
            >
              Edit
            </button>

            <button
              type="button"
              class="btn-outline !px-2 !py-1.5 text-xs text-error-600 dark:text-error-400"
              @click="emit('delete', holiday)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z" />
              </svg>
            </button>
          </div>
        </article>
      </div>

      <div class="hidden overflow-x-auto md:block">
        <table class="table-base min-w-full">
          <thead>
            <tr>
              <th>Date</th>
              <th>Name</th>
              <th>Country</th>
              <th>State</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="holiday in holidays" :key="holiday.id">
              <td class="whitespace-nowrap text-sm text-muted">{{ formatDate(holiday.date) }}</td>
              <td class="text-sm font-semibold text-foreground">{{ holiday.name }}</td>
              <td class="text-sm text-muted/90">{{ holiday.country || '—' }}</td>
              <td class="text-sm text-muted/90">{{ holiday.state || '—' }}</td>
              <td>
                <button
                  type="button"
                  class="inline-flex min-w-[76px] items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold transition"
                  :class="holiday.is_active ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'"
                  :disabled="isToggling(holiday.id, togglingActiveIds)"
                  @click="emit('toggle-active', holiday)"
                >
                  {{ isToggling(holiday.id, togglingActiveIds) ? '...' : holiday.is_active ? 'Active' : 'Inactive' }}
                </button>
              </td>
              <td>
                <div class="inline-flex items-center gap-1.5 rounded-lg border border-border/80 px-1.5 py-1">
                  <button
                    type="button"
                    class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-primary-600 transition hover:bg-primary-100/60 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:text-primary-400 dark:hover:bg-white/10"
                    title="Edit holiday"
                    aria-label="Edit holiday"
                    @click="emit('edit', holiday)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                      <path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-error-600 transition hover:bg-error-100/60 focus:outline-none focus:ring-2 focus:ring-error-500/30 dark:text-error-400 dark:hover:bg-error-500/10"
                    title="Delete holiday"
                    aria-label="Delete holiday"
                    @click="emit('delete', holiday)"
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
import type { HolidayDTO } from '../../../../shared/types/HolidayDTO'

interface Props {
  holidays: HolidayDTO[]
  isLoading?: boolean
  togglingActiveIds?: string[]
}

interface Emits {
  edit: [holiday: HolidayDTO]
  delete: [holiday: HolidayDTO]
  'toggle-active': [holiday: HolidayDTO]
}

withDefaults(defineProps<Props>(), {
  isLoading: false,
  togglingActiveIds: () => [],
})

const emit = defineEmits<Emits>()

function isToggling(holidayId: string, togglingIds: string[]): boolean {
  return togglingIds.includes(holidayId)
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
</script>
