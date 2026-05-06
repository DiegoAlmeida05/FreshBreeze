<template>
  <div class="space-y-3">
    <BaseFeedbackBanner
      v-if="feedbackMessage"
      :tone="feedbackType"
      :title="feedbackType === 'success' ? 'User deleted' : 'Delete failed'"
      :message="feedbackMessage"
      floating
      dismissible
      @dismiss="clearFeedback"
    />

    <div class="table-surface">
    <div class="block md:hidden">
      <div v-if="isLoading" class="space-y-3 p-4">
        <div class="h-24 animate-pulse rounded-lg bg-primary-100/50" />
        <div class="h-24 animate-pulse rounded-lg bg-primary-100/50" />
        <div class="h-24 animate-pulse rounded-lg bg-primary-100/50" />
      </div>

      <div v-else-if="employees.length === 0" class="p-6 text-sm text-muted">No employees found.</div>

      <div v-else class="divide-y divide-border/70">
        <div v-for="employee in employees" :key="employee.id" class="space-y-2.5 p-3">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex flex-1 items-start gap-2.5">
              <div class="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700 dark:bg-white/10 dark:text-white">
                {{ getInitials(employee.full_name) }}
              </div>

              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-foreground">{{ employee.full_name }}</p>
                <p class="mt-0.5 truncate text-xs text-muted/90">{{ employee.email || 'No email' }}</p>
                <span
                  v-if="isPlatformOwner(employee)"
                  class="mt-1 inline-flex rounded-full bg-primary-100 px-2 py-0.5 text-[11px] font-semibold text-primary-700 dark:bg-primary-500/20 dark:text-primary-300"
                >
                  Owner 👑
                </span>

                <div class="mt-1.5 grid grid-cols-1 gap-1 text-xs text-muted">
                  <span class="rounded-md bg-primary-50/60 px-2 py-1 dark:bg-white/5">
                    <span class="font-medium text-foreground/70">Phone</span> {{ employee.phone || '-' }}
                  </span>

                  <span class="rounded-md bg-primary-50/60 px-2 py-1 dark:bg-white/5">
                    <span class="font-medium text-foreground/70">Rate</span> <span class="font-semibold text-foreground">{{ formatRate(employee.hourly_rate_weekday) }}</span><span class="text-muted/80">/h</span>
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              class="inline-flex items-center rounded-full p-0.5 transition focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              :class="employee.active ? 'bg-success/25' : 'bg-slate-300/80 dark:bg-slate-600/70'"
              :disabled="isToggling(employee.id) || isPlatformOwner(employee)"
              :title="employee.active ? 'Deactivate employee' : 'Activate employee'"
              :aria-label="employee.active ? 'Deactivate employee' : 'Activate employee'"
              @click="emit('toggle-active', employee)"
            >
              <span
                    class="h-5 w-10 rounded-full border border-border/30 transition"
                :class="employee.active ? 'bg-success/90' : 'bg-slate-300 dark:bg-slate-600'"
              >
                <span
                  class="mt-[1px] block h-4 w-4 rounded-full bg-white shadow transition"
                  :class="employee.active ? 'translate-x-[20px]' : 'translate-x-[2px]'"
                />
              </span>
            </button>
          </div>

          <div class="flex items-center justify-end gap-2 pt-1">
            <button
              v-if="!isPlatformOwner(employee)"
              type="button"
              class="btn-outline min-w-[92px] !px-3 !py-1.5 text-xs"
              title="Edit employee"
              aria-label="Edit employee"
              @click="emit('edit', employee)"
            >
              Edit
            </button>
            <button
              v-if="canDeleteUsers && !isPlatformOwner(employee)"
              type="button"
              class="btn-outline inline-flex h-9 w-9 items-center justify-center !px-0 !py-0 text-error-600 dark:text-error-400"
              title="Delete user"
              aria-label="Delete user"
              @click="openDeleteConfirm(employee)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="hidden md:block">
    <div v-if="isLoading" class="p-6 text-sm text-muted">Loading employees...</div>

    <div v-else-if="employees.length === 0" class="p-6 text-sm text-muted">No employees found.</div>

    <div v-else class="overflow-x-auto">
      <table class="table-base min-w-full">
        <thead>
          <tr>
            <th>Full name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Hourly rate</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="employee in employees" :key="employee.id">
            <td>
              <div class="flex items-center gap-2.5">
                <div class="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700 dark:bg-white/10 dark:text-white">
                  {{ getInitials(employee.full_name) }}
                </div>
                <p class="text-sm font-semibold text-foreground">{{ employee.full_name }}</p>
                <span
                  v-if="isPlatformOwner(employee)"
                  class="inline-flex rounded-full bg-primary-100 px-2 py-0.5 text-[11px] font-semibold text-primary-700 dark:bg-primary-500/20 dark:text-primary-300"
                >
                  Owner 👑
                </span>
              </div>
            </td>
            <td class="text-sm text-muted/90">{{ employee.email || '-' }}</td>
            <td class="text-sm text-muted">{{ employee.phone || '-' }}</td>
            <td class="text-sm text-foreground">
              <span class="font-semibold text-foreground">{{ formatRate(employee.hourly_rate_weekday) }}</span>
            </td>
            <td>
              <button
                type="button"
                class="inline-flex items-center rounded-full p-0.5 transition focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                :class="employee.active ? 'bg-success/25' : 'bg-slate-300/80 dark:bg-slate-600/70'"
                :disabled="isToggling(employee.id) || isPlatformOwner(employee)"
                :title="employee.active ? 'Deactivate employee' : 'Activate employee'"
                :aria-label="employee.active ? 'Deactivate employee' : 'Activate employee'"
                @click="emit('toggle-active', employee)"
              >
                <span
                  class="h-5 w-10 rounded-full border border-border/30 transition"
                  :class="employee.active ? 'bg-success/90' : 'bg-slate-300 dark:bg-slate-600'"
                >
                  <span
                    class="mt-[1px] block h-4 w-4 rounded-full bg-white shadow transition"
                    :class="employee.active ? 'translate-x-[20px]' : 'translate-x-[2px]'"
                  />
                </span>
              </button>
            </td>
            <td>
              <div class="inline-flex items-center gap-1 rounded-lg border border-border/80 px-1 py-1">
                <button
                  v-if="!isPlatformOwner(employee)"
                  type="button"
                  class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-primary-600 transition hover:bg-primary-100/60 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:text-primary-400 dark:hover:bg-white/10"
                  title="Edit employee"
                  aria-label="Edit employee"
                  @click="emit('edit', employee)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                    <path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                </button>
                <button
                  v-if="canDeleteUsers && !isPlatformOwner(employee)"
                  type="button"
                  class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-error-600 transition hover:bg-error-100/60 focus:outline-none focus:ring-2 focus:ring-error-500/30 dark:text-error-400 dark:hover:bg-error-500/10"
                  title="Delete user"
                  aria-label="Delete user"
                  @click="openDeleteConfirm(employee)"
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
  </div>

    <BaseConfirmModal
      v-model="isDeleteModalOpen"
      title="Delete user permanently"
      message="Are you sure you want to permanently delete this user? This action cannot be undone."
      confirm-label="Delete permanently"
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
import type { EmployeeDTO } from '../../../../shared/types/EmployeeDTO'
import { useEmployees } from '../../../composables/useEmployees'

interface Props {
  employees: EmployeeDTO[]
  isLoading?: boolean
  canDeleteUsers?: boolean
  togglingActiveIds?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  canDeleteUsers: false,
  togglingActiveIds: () => [],
})

const emit = defineEmits<{
  edit: [employee: EmployeeDTO]
  'toggle-active': [employee: EmployeeDTO]
  deleted: []
  error: [message: string]
}>()

const { deleteEmployeeUser } = useEmployees()
const isDeleteModalOpen = ref(false)
const isDeleting = ref(false)
const employeeToDelete = ref<EmployeeDTO | null>(null)
const feedbackMessage = ref('')
const feedbackType = ref<'success' | 'error'>('success')
let feedbackTimeout: ReturnType<typeof setTimeout> | null = null

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) {
    return '--'
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0]?.[0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}`.toUpperCase()
}

function formatRate(value: number): string {
  return value.toLocaleString('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

function isToggling(employeeId: string): boolean {
  return props.togglingActiveIds?.includes(employeeId) ?? false
}

function isPlatformOwner(employee: EmployeeDTO): boolean {
  return employee.is_platform_owner === true
}

function clearFeedback(): void {
  feedbackMessage.value = ''

  if (feedbackTimeout) {
    clearTimeout(feedbackTimeout)
    feedbackTimeout = null
  }
}

function setFeedback(type: 'success' | 'error', message: string, duration = 0): void {
  clearFeedback()
  feedbackType.value = type
  feedbackMessage.value = message

  if (duration > 0) {
    feedbackTimeout = setTimeout(() => {
      clearFeedback()
    }, duration)
  }
}

function openDeleteConfirm(employee: EmployeeDTO): void {
  employeeToDelete.value = employee
  isDeleteModalOpen.value = true
}

function closeDeleteConfirm(force = false): void {
  if (isDeleting.value && !force) {
    return
  }

  isDeleteModalOpen.value = false
  employeeToDelete.value = null
}

async function confirmDelete(): Promise<void> {
  if (!employeeToDelete.value?.profile_id) {
    const message = 'Cannot delete this user because profile_id is missing.'
    setFeedback('error', message)
    emit('error', message)
    closeDeleteConfirm()
    return
  }

  isDeleting.value = true

  try {
    await deleteEmployeeUser(employeeToDelete.value.profile_id)
    setFeedback('success', 'User deleted successfully.', 3500)
    emit('deleted')
    closeDeleteConfirm(true)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete user.'
    setFeedback('error', message)
    emit('error', message)
  } finally {
    isDeleting.value = false
  }
}
</script>
