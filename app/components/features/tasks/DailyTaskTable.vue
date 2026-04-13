<template>
  <div class="space-y-3">

    <BaseFeedbackBanner
      v-if="feedbackMessage"
      :tone="feedbackType"
      :title="feedbackType === 'success' ? 'Task deleted' : 'Delete failed'"
      :message="feedbackMessage"
      floating
      dismissible
      @dismiss="clearFeedback"
    />

    <!-- Mobile Cards -->
    <div class="-mx-2 md:hidden">
      <div v-if="isLoading" class="space-y-3 p-4">
        <div class="h-24 animate-pulse rounded-xl bg-primary-100/50" />
        <div class="h-24 animate-pulse rounded-xl bg-primary-100/50" />
        <div class="h-24 animate-pulse rounded-xl bg-primary-100/50" />
      </div>

      <div v-else-if="tasks.length === 0" class="flex items-center justify-center px-6 py-12">
        <p class="text-sm text-muted">No tasks for this date.</p>
      </div>

      <div v-else class="space-y-2 px-2">
        <div v-for="task in tasks" :key="task.id" class="relative space-y-1 rounded-lg border border-primary-100/70 bg-surface px-2.5 py-2 dark:border-white/10">
          <div class="absolute right-2 top-2 inline-flex gap-1">
            <button
              type="button"
              class="inline-flex h-6 w-6 items-center justify-center rounded-md text-primary-600 transition hover:bg-primary-100/60 dark:text-primary-400 dark:hover:bg-white/10"
              title="Edit task"
              aria-label="Edit task"
              @click="emit('edit', task)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-3.5 w-3.5">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                <path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
              </svg>
            </button>
            <button
              type="button"
              class="inline-flex h-6 w-6 items-center justify-center rounded-md text-error-600 transition hover:bg-error-100/50 dark:text-error-400 dark:hover:bg-error-500/10"
              title="Delete task"
              aria-label="Delete task"
              @click="onDelete(task)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-3.5 w-3.5">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z" />
              </svg>
            </button>
          </div>

          <div class="flex items-start gap-2 pr-14">
            <div class="min-w-0">
              <p class="truncate font-medium text-foreground">{{ task.property_name ?? 'Unknown property' }}</p>
              <p class="text-xs text-muted">
                <span v-if="task.desired_start_time">Start: {{ formatTime(task.desired_start_time) }}</span>
                <span v-else class="italic">No start time</span>
                <span class="mx-1">·</span>
                <span>{{ task.people_count }} {{ task.people_count === 1 ? 'person' : 'people' }}</span>
              </p>
              <p class="text-xs text-muted">Window: {{ formatWindowSummary(task.window_start_time, task.window_end_time) }}</p>
              <p v-if="task.guest_name || task.guest_checkin_date" class="text-xs text-muted">
                Guest: {{ formatGuestSummary(task) }}
              </p>
              <p class="text-xs text-muted">Daily extras (+): {{ formatExtrasSummary(task) }}</p>
              <div v-if="visibleTags(task).length > 0" class="mt-1 flex flex-wrap gap-1">
                <span
                  v-for="tag in visibleTags(task)"
                  :key="`${task.id}-tag-${tag}`"
                  class="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary-700 dark:text-primary-300"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
            <span
              class="shrink-0 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold"
              :class="task.task_type === 'BSB' ? 'bg-warning/15 text-warning' : 'bg-primary/15 text-primary-600 dark:text-primary-400'"
            >
              {{ task.task_type }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop Table -->
    <div class="hidden md:block">
      <div v-if="isLoading" class="space-y-2 p-6">
        <div class="h-12 animate-pulse rounded-lg bg-primary-100/50" />
        <div class="h-12 animate-pulse rounded-lg bg-primary-100/50" />
        <div class="h-12 animate-pulse rounded-lg bg-primary-100/50" />
      </div>

      <div v-else-if="tasks.length === 0" class="flex items-center justify-center px-6 py-12">
        <p class="text-sm text-muted">No tasks for this date. Click "Add task" to schedule one.</p>
      </div>

      <table v-else class="w-full">
        <thead>
          <tr class="border-b border-primary-100 bg-primary-50/50 dark:bg-black/20">
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Property</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Type</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Desired start</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Window summary</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Guest</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">People</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Daily extras (+)</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Tags</th>
            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-primary-100">
          <tr v-for="task in tasks" :key="task.id" class="transition hover:bg-primary-50/30 dark:hover:bg-white/5">
            <td class="px-4 py-3">
              <p class="font-medium text-foreground">{{ task.property_name ?? '—' }}</p>
            </td>
            <td class="px-4 py-3">
              <span
                class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                :class="task.task_type === 'BSB' ? 'bg-warning/15 text-warning' : 'bg-primary/15 text-primary-600 dark:text-primary-400'"
              >
                {{ task.task_type }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-foreground">
              {{ task.desired_start_time ? formatTime(task.desired_start_time) : '—' }}
            </td>
            <td class="px-4 py-3 text-sm text-muted">
              {{ formatWindowSummary(task.window_start_time, task.window_end_time) }}
            </td>
            <td class="px-4 py-3 text-sm text-muted">
              {{ formatGuestSummary(task) }}
            </td>
            <td class="px-4 py-3 text-sm text-foreground">
              {{ task.people_count }}
            </td>
            <td class="px-4 py-3 text-sm text-muted">
              {{ formatExtrasSummary(task) }}
            </td>
            <td class="px-4 py-3 text-sm text-muted">
              <div v-if="visibleTags(task).length > 0" class="flex flex-wrap gap-1.5">
                <span
                  v-for="tag in visibleTags(task)"
                  :key="`${task.id}-desktop-tag-${tag}`"
                  class="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary-700 dark:text-primary-300"
                >
                  {{ tag }}
                </span>
              </div>
              <span v-else>—</span>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="inline-flex gap-2">
                <button
                  type="button"
                  class="inline-flex h-8 w-8 items-center justify-center rounded-md text-primary-600 transition hover:bg-primary-100/50 dark:text-primary-400 dark:hover:bg-white/10"
                  title="Edit task"
                  aria-label="Edit task"
                  @click="emit('edit', task)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                    <path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="inline-flex h-8 w-8 items-center justify-center rounded-md text-error-600 transition hover:bg-error-100/50 dark:text-error-400 dark:hover:bg-error-500/10"
                  title="Delete task"
                  aria-label="Delete task"
                  @click="onDelete(task)"
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
    <BaseConfirmModal
      v-model="isDeleteModalOpen"
      title="Delete task?"
      message="Are you sure you want to delete this task? This action cannot be undone."
      confirm-label="Delete"
      cancel-label="Cancel"
      :loading="isDeleting"
      :danger="true"
      @confirm="confirmDelete"
      @cancel="closeDeleteConfirm"
    />

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BaseFeedbackBanner from '../../ui/BaseFeedbackBanner.vue'
import BaseConfirmModal from '../../ui/BaseConfirmModal.vue'
import type { DailyTaskDTO } from '../../../../shared/types/DailyTaskDTO'
import { useDailyTasks } from '../../../composables/useDailyTasks'
import { buildVisibleTaskTags } from '../../../utils/visualTaskTags'

interface Props {
  tasks: DailyTaskDTO[]
  isLoading?: boolean
}

withDefaults(defineProps<Props>(), {
  isLoading: false,
})

const emit = defineEmits<{
  edit: [task: DailyTaskDTO]
  deleted: []
  error: [message: string]
}>()

const { deleteTask } = useDailyTasks()

const taskToDelete = ref<DailyTaskDTO | null>(null)
const isDeleteModalOpen = ref(false)
const isDeleting = ref(false)
const feedbackMessage = ref('')
const feedbackType = ref<'success' | 'error'>('success')

function formatTime(time: string): string {
  const parts = time.split(':')
  const hour = parseInt(parts[0] ?? '0', 10)
  const min = parts[1] ?? '00'
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${min} ${suffix}`
}

function formatWindowSummary(start: string | null, end: string | null): string {
  if (start && end) {
    return `${formatTime(start)} - ${formatTime(end)}`
  }

  if (start) {
    return `Start from ${formatTime(start)}`
  }

  if (end) {
    return `Until ${formatTime(end)}`
  }

  return 'No window reference'
}

function formatGuestSummary(task: DailyTaskDTO): string {
  const name = task.guest_name?.trim() || null
  const checkinDate = task.guest_checkin_date?.trim() || null

  if (!name && !checkinDate) {
    return '—'
  }

  if (name && checkinDate) {
    return `${name} (${checkinDate})`
  }

  return name ?? checkinDate ?? '—'
}

function formatExtrasSummary(task: DailyTaskDTO): string {
  const parts: string[] = []

  if (task.extra_beds_single > 0) parts.push(`S:${task.extra_beds_single}`)
  if (task.extra_beds_queen > 0) parts.push(`Q:${task.extra_beds_queen}`)
  if (task.extra_beds_king > 0) parts.push(`K:${task.extra_beds_king}`)
  if (task.extra_towels_qty > 0) parts.push(`Tw:+${task.extra_towels_qty}`)
  if (task.extra_chocolates_qty > 0) parts.push(`Ch:+${task.extra_chocolates_qty}`)

  return parts.length > 0 ? parts.join(' | ') : 'No extras'
}

function visibleTags(task: DailyTaskDTO): string[] {
  return buildVisibleTaskTags(task.tags, task.property_default_tags ?? [])
}

function onDelete(task: DailyTaskDTO): void {
  taskToDelete.value = task
  isDeleteModalOpen.value = true
}

function closeDeleteConfirm(): void {
  taskToDelete.value = null
  isDeleteModalOpen.value = false
}

function clearFeedback(): void {
  feedbackMessage.value = ''
}

async function confirmDelete(): Promise<void> {
  if (!taskToDelete.value) return

  isDeleting.value = true

  try {
    await deleteTask(taskToDelete.value.id)
    feedbackType.value = 'success'
    feedbackMessage.value = 'Task deleted successfully.'
    emit('deleted')
  } catch (err: unknown) {
    feedbackType.value = 'error'
    feedbackMessage.value = err instanceof Error ? err.message : 'Failed to delete task.'
    emit('error', feedbackMessage.value)
  } finally {
    isDeleting.value = false
    closeDeleteConfirm()
  }
}
</script>
