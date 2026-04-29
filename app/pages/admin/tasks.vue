<template>
  <NuxtLayout name="admin-layout" @signout="onSignOut">
    <section class="space-y-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-primary-600">Operations</p>
          <h2 class="mt-1 text-2xl font-semibold text-foreground">Weekly Planning Board</h2>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="btn-outline !px-3 !py-2 text-xs"
            @click="toggleFullscreen"
          >
            {{ isFullscreenMode ? 'Exit Full Screen' : 'Full Screen' }}
          </button>

          <button
            type="button"
            class="btn-outline !px-3 !py-2 text-xs"
            @click="openQuickAddModal"
          >
            Quick Add Tasks
          </button>

          <button
            type="button"
            class="btn-primary !px-3 !py-2 text-xs"
            @click="openCreateForm"
          >
            Add task
          </button>
        </div>
      </div>

      <div class="rounded-xl border border-primary-100 bg-gradient-to-r from-primary-50/60 via-surface to-primary-warm-50/60 p-4 dark:border-white/10 dark:from-[#1b2534] dark:via-[#182231] dark:to-[#212d3d]">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="inline-flex items-center gap-2">
            <button
              type="button"
              class="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted transition hover:bg-primary-100/60 hover:text-foreground dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
              title="Previous week"
              aria-label="Previous week"
              @click="shiftWeek(-1)"
            >
              ‹
            </button>

            <button
              type="button"
              class="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted transition hover:bg-primary-100/60 hover:text-foreground dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
              title="Next week"
              aria-label="Next week"
              @click="shiftWeek(1)"
            >
              ›
            </button>

            <input
              id="tasks-focus-date"
              v-model="selectedDate"
              type="date"
              class="input-base !py-1.5 !text-sm w-full max-w-[180px] [color-scheme:light] dark:[color-scheme:dark]"
              aria-label="Select date"
            >

            <button
              type="button"
              class="btn-outline !px-2.5 !py-1.5 text-xs"
              @click="goToToday"
            >
              Today
            </button>
          </div>

          <p class="text-sm font-medium text-foreground dark:text-slate-100">
            {{ weekRangeLabel }}
          </p>

          <p v-if="!isLoading" class="ml-auto text-sm text-muted dark:text-slate-300">
            <span class="font-semibold text-foreground dark:text-slate-100">{{ weekTasks.length }}</span>
            {{ weekTasks.length === 1 ? 'task' : 'tasks' }} this week
          </p>
        </div>
      </div>

      <BaseFeedbackBanner
        v-if="pageError"
        tone="error"
        title="Task action failed"
        :message="pageError"
        floating
        dismissible
        @dismiss="pageError = ''"
      />

      <BaseFeedbackBanner
        v-if="pageSuccess"
        tone="success"
        title="Success"
        :message="pageSuccess"
        floating
        dismissible
        @dismiss="pageSuccess = ''"
      />

      <div class="overflow-hidden rounded-xl border border-border bg-surface p-4 shadow-card">
        <div v-if="isLoading" ref="weekBoardScrollEl" class="max-h-[72vh] overflow-auto pb-2">
          <div class="grid w-max min-w-full grid-cols-7 gap-3">
            <div v-for="n in 7" :key="n" class="space-y-3 rounded-lg border border-primary-100 bg-primary-50/30 p-3">
              <div class="h-4 w-24 animate-pulse rounded bg-primary-100/50" />
              <div class="h-20 animate-pulse rounded bg-primary-100/50" />
              <div class="h-20 animate-pulse rounded bg-primary-100/50" />
            </div>
          </div>
        </div>

        <div v-else ref="weekBoardScrollEl" class="max-h-[72vh] overflow-auto pb-2">
          <div class="grid w-max min-w-full grid-cols-7 gap-3">
            <section
              v-for="day in weekDays"
              :key="day.date"
              class="rounded-lg border border-primary-100 bg-primary-50/20 p-2.5 dark:border-white/10 dark:bg-white/[0.02]"
            >
              <div class="sticky top-0 z-10 mb-2.5 flex items-center justify-between gap-2 rounded-md bg-primary-50/95 px-2 py-1.5 backdrop-blur-sm dark:bg-[#182231]/95">
                <div>
                  <h3 class="text-sm font-semibold text-foreground">{{ day.weekday }}</h3>
                  <p class="text-xs text-muted">{{ day.shortDate }}</p>
                </div>
                <span class="inline-flex rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-semibold text-primary-700 dark:bg-white/10 dark:text-white">
                  {{ day.tasks.length }}
                </span>
              </div>

              <div v-if="day.tasks.length === 0" class="rounded-lg border border-dashed border-primary-200/80 px-3 py-6 text-center text-xs text-muted">
                No tasks
              </div>

              <div v-else class="space-y-2 pr-1">
                <WeeklyTaskCard
                  v-for="task in day.tasks"
                  :key="task.id"
                  :task="task"
                  :property="getTaskProperty(task)"
                  :client="getTaskClient(task)"
                  :move-options="weekMoveOptions"
                  @edit="openEditForm"
                  @delete="onRequestDeleteTask"
                  @move="onMoveTask"
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    </section>

    <Teleport to="body">
      <div
        v-if="isFormOpen"
        class="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-foreground/50 px-4 py-6 backdrop-blur-sm sm:items-center sm:py-8"
        @click.self="closeForm"
      >
        <div class="w-full max-w-2xl max-h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl border border-primary-100 bg-surface p-6 shadow-elevated">
          <div class="mb-4 flex items-center justify-between gap-3">
            <h3 class="text-lg font-semibold text-foreground">
              {{ editingTaskId ? 'Edit task' : 'New task' }}
            </h3>
            <button type="button" class="btn-outline !px-3 !py-1.5" @click="closeForm">Close</button>
          </div>

          <DailyTaskForm
            :mode="editingTaskId ? 'edit' : 'create'"
            :task="selectedTask"
            :initial-extra-items="selectedTaskExtraItems"
            :is-submitting="isSubmitting"
            :submit-label="editingTaskId ? 'Update' : 'Create'"
            :initial-date="selectedFocusDate"
            @submit="onSubmitForm"
            @cancel="closeForm"
          />
        </div>
      </div>
    </Teleport>

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

    <QuickAddTasksModal
      v-model="isQuickAddOpen"
      :initial-date="selectedFocusDate"
      :properties="allProperties"
      @success="onQuickAddSuccess"
    />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import BaseFeedbackBanner from '../../components/ui/BaseFeedbackBanner.vue'
import BaseConfirmModal from '../../components/ui/BaseConfirmModal.vue'
import DailyTaskForm from '../../components/features/tasks/DailyTaskForm.vue'
import QuickAddTasksModal from '../../components/features/tasks/QuickAddTasksModal.vue'
import WeeklyTaskCard from '../../components/features/tasks/WeeklyTaskCard.vue'
import { useAuth } from '../../composables/useAuth'
import { useDailyTaskExtraItems } from '../../composables/useDailyTaskExtraItems'
import { useDailyTasks } from '../../composables/useDailyTasks'
import { useProperties } from '../../composables/useProperties'
import { useClients } from '../../composables/useClients'
import type { DailyTaskExtraItemInput } from '../../../shared/types/PricingItemDTO'
import type { DailyTaskDTO, CreateDailyTaskDTO, UpdateDailyTaskDTO } from '../../../shared/types/DailyTaskDTO'
import type { PropertyDTO } from '../../../shared/types/PropertyDTO'
import type { ClientDTO } from '../../../shared/types/ClientDTO'
import type { DailyTaskFormPayload } from '../../components/features/tasks/DailyTaskForm.vue'

definePageMeta({
  name: 'admin-tasks',
})

const { signOut } = useAuth()
const { fetchTasksByDate, createTask, updateTask, deleteTask } = useDailyTasks()
const { getTaskExtraItems, setTaskExtraItems } = useDailyTaskExtraItems()
const { fetchProperties } = useProperties()
const { fetchClients } = useClients()

interface PersistedTasksPageState {
  selectedDate: string
  weekStart: string
  boardScrollTop: number
}

const persistedTasksPageState = useState<PersistedTasksPageState>('admin-tasks-page-state', () => {
  const today = todayIsoDate()
  return {
    selectedDate: today,
    weekStart: formatDateForInput(startOfWeekMonday(parseIsoDate(today))),
    boardScrollTop: 0,
  }
})

const weekTasks = ref<DailyTaskDTO[]>([])
const selectedTask = ref<DailyTaskDTO | null>(null)
const selectedTaskExtraItems = ref<DailyTaskExtraItemInput[]>([])
const editingTaskId = ref<string | null>(null)
const taskToDelete = ref<DailyTaskDTO | null>(null)
const isLoading = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const isDeleteModalOpen = ref(false)
const isFormOpen = ref(false)
const isQuickAddOpen = ref(false)
const pageError = ref('')
const pageSuccess = ref('')
const propertiesById = ref<Record<string, PropertyDTO>>({})
const clientsById = ref<Record<string, ClientDTO>>({})
const selectedDate = ref(persistedTasksPageState.value.selectedDate || todayIsoDate())
const weekBoardScrollEl = ref<HTMLElement | null>(null)
const route = useRoute()
const router = useRouter()

const isFullscreenMode = computed(() => route.query.fullscreen === '1')

const allProperties = computed(() => Object.values(propertiesById.value))

async function toggleFullscreen(): Promise<void> {
  const nextQuery: Record<string, string> = {}

  Object.entries(route.query).forEach(([key, value]) => {
    if (key === 'fullscreen' || value === undefined) {
      return
    }

    nextQuery[key] = Array.isArray(value) ? (value[0] ?? '') : String(value)
  })

  if (!isFullscreenMode.value) {
    nextQuery.fullscreen = '1'
  }

  await router.replace({ query: nextQuery })
}

function todayIsoDate(): string {
  return formatDateForInput(new Date())
}

function formatDateForInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseIsoDate(isoDate: string): Date {
  const parts = isoDate.split('-')
  const year = Number(parts[0] ?? 1970)
  const month = Number(parts[1] ?? 1)
  const day = Number(parts[2] ?? 1)
  return new Date(year, month - 1, day)
}

function startOfWeekMonday(date: Date): Date {
  const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = normalized.getDay()
  const diff = day === 0 ? -6 : 1 - day
  normalized.setDate(normalized.getDate() + diff)
  return normalized
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  d.setDate(d.getDate() + days)
  return d
}

const selectedWeekStart = ref(
  persistedTasksPageState.value.weekStart
    || formatDateForInput(startOfWeekMonday(parseIsoDate(selectedDate.value))),
)

const weekDates = computed(() => {
  const monday = parseIsoDate(selectedWeekStart.value)

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(monday, index)
    return formatDateForInput(date)
  })
})

const weekMoveOptions = computed(() => {
  return weekDates.value.map((date) => {
    const parsed = parseIsoDate(date)
    return {
      date,
      label: parsed.toLocaleDateString('en-AU', { weekday: 'short', day: '2-digit', month: '2-digit' }),
    }
  })
})

const weekRangeLabel = computed(() => {
  const start = parseIsoDate(weekDates.value[0] ?? selectedWeekStart.value)
  const end = parseIsoDate(weekDates.value[6] ?? selectedWeekStart.value)
  return `${start.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`
})

const selectedFocusDate = computed(() => {
  if (weekDates.value.includes(selectedDate.value)) {
    return selectedDate.value
  }
  return weekDates.value[0] ?? selectedWeekStart.value
})

const weekDays = computed(() => {
  return weekDates.value.map((date) => {
    const parsed = parseIsoDate(date)
    return {
      date,
      weekday: parsed.toLocaleDateString('en-AU', { weekday: 'long' }),
      shortDate: parsed.toLocaleDateString('en-AU', { day: '2-digit', month: 'short' }),
      tasks: weekTasks.value.filter((task) => task.date === date),
    }
  })
})

function getTaskProperty(task: DailyTaskDTO): PropertyDTO | null {
  return propertiesById.value[task.property_id] ?? null
}

function getTaskClient(task: DailyTaskDTO): ClientDTO | null {
  const property = getTaskProperty(task)
  if (!property) return null
  return clientsById.value[property.client_id] ?? null
}

watch(selectedWeekStart, async (date) => {
  if (!date) return

  const monday = startOfWeekMonday(parseIsoDate(date))
  const normalized = formatDateForInput(monday)

  if (normalized !== selectedWeekStart.value) {
    selectedWeekStart.value = normalized
    return
  }

  await loadWeekTasks()
})

watch(selectedDate, (date) => {
  if (!date) return

  persistedTasksPageState.value.selectedDate = date

  const monday = startOfWeekMonday(parseIsoDate(date))
  const normalized = formatDateForInput(monday)

  if (selectedWeekStart.value !== normalized) {
    selectedWeekStart.value = normalized
  }
})

watch(selectedWeekStart, (value) => {
  if (!value) {
    return
  }

  persistedTasksPageState.value.weekStart = value
})

onMounted(async () => {
  await Promise.all([loadProperties(), loadClients()])
  await loadWeekTasks()

  if (import.meta.client) {
    await nextTick()
    const scrollTop = persistedTasksPageState.value.boardScrollTop ?? 0
    if (weekBoardScrollEl.value && scrollTop > 0) {
      weekBoardScrollEl.value.scrollTop = scrollTop
    }
  }
})

onBeforeRouteLeave(() => {
  if (import.meta.client && weekBoardScrollEl.value) {
    persistedTasksPageState.value.boardScrollTop = weekBoardScrollEl.value.scrollTop
  }
})

function shiftWeek(offsetWeeks: number): void {
  const focused = parseIsoDate(selectedDate.value)
  focused.setDate(focused.getDate() + (offsetWeeks * 7))
  selectedDate.value = formatDateForInput(focused)
}

function goToToday(): void {
  selectedDate.value = todayIsoDate()
}

async function loadProperties(): Promise<void> {
  try {
    const loaded = await fetchProperties()
    propertiesById.value = loaded.reduce<Record<string, PropertyDTO>>((acc, property) => {
      acc[property.id] = property
      return acc
    }, {})
  } catch {
    propertiesById.value = {}
  }
}

async function loadClients(): Promise<void> {
  try {
    const loaded = await fetchClients()
    clientsById.value = loaded.reduce<Record<string, ClientDTO>>((acc, client) => {
      acc[client.id] = client
      return acc
    }, {})
  } catch {
    clientsById.value = {}
  }
}

async function loadWeekTasks(): Promise<void> {
  const previousScrollTop = weekBoardScrollEl.value?.scrollTop ?? 0
  isLoading.value = true
  pageError.value = ''

  try {
    const results = await Promise.all(weekDates.value.map((date) => fetchTasksByDate(date)))
    weekTasks.value = results.flat()
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to load tasks.'
  } finally {
    isLoading.value = false

    if (import.meta.client) {
      await nextTick()
      if (weekBoardScrollEl.value) {
        weekBoardScrollEl.value.scrollTop = previousScrollTop
        persistedTasksPageState.value.boardScrollTop = weekBoardScrollEl.value.scrollTop
      }
    }
  }
}

function openQuickAddModal(): void {
  pageError.value = ''
  pageSuccess.value = ''
  isQuickAddOpen.value = true
}

async function onQuickAddSuccess(date: string): Promise<void> {
  pageSuccess.value = 'Tasks created successfully.'
  selectedDate.value = date
  selectedWeekStart.value = formatDateForInput(startOfWeekMonday(parseIsoDate(date)))
  await loadWeekTasks()
}

function openCreateForm(): void {
  if (weekBoardScrollEl.value) {
    persistedTasksPageState.value.boardScrollTop = weekBoardScrollEl.value.scrollTop
  }

  selectedTask.value = null
  selectedTaskExtraItems.value = []
  editingTaskId.value = null
  pageError.value = ''
  pageSuccess.value = ''
  isFormOpen.value = true
}

async function openEditForm(task: DailyTaskDTO): Promise<void> {
  if (weekBoardScrollEl.value) {
    persistedTasksPageState.value.boardScrollTop = weekBoardScrollEl.value.scrollTop
  }

  selectedTask.value = task
  selectedTaskExtraItems.value = []
  editingTaskId.value = task.id
  pageError.value = ''
  pageSuccess.value = ''

  try {
    const existing = await getTaskExtraItems(task.id)
    selectedTaskExtraItems.value = existing.map((item) => ({
      pricing_item_id: item.pricing_item_id,
      quantity: item.quantity,
      note: item.note ?? null,
    }))
  } catch {
    selectedTaskExtraItems.value = []
  }

  isFormOpen.value = true
}

function closeForm(): void {
  isFormOpen.value = false
  selectedTask.value = null
  selectedTaskExtraItems.value = []
  editingTaskId.value = null

  if (import.meta.client) {
    nextTick(() => {
      const scrollTop = persistedTasksPageState.value.boardScrollTop ?? 0
      if (weekBoardScrollEl.value && scrollTop > 0) {
        weekBoardScrollEl.value.scrollTop = scrollTop
      }
    })
  }
}

async function onSubmitForm(payload: DailyTaskFormPayload): Promise<void> {
  isSubmitting.value = true
  pageError.value = ''

  try {
    let savedTask: DailyTaskDTO

    if (editingTaskId.value) {
      const updatePayload: UpdateDailyTaskDTO = {
        date: payload.date,
        property_id: payload.property_id,
        guest_name: payload.guest_name,
        guest_checkin_date: payload.guest_checkin_date,
        tags: payload.tags,
        task_type: payload.task_type,
        window_start_time: payload.window_start_time,
        window_end_time: payload.window_end_time,
        desired_start_time: payload.desired_start_time,
        cleaning_minutes_override: payload.cleaning_minutes_override,
        people_count: payload.people_count,
        notes: payload.notes,
        extra_linen_combo_qty: payload.extra_linen_combo_qty,
        extra_amenities_combo_qty: payload.extra_amenities_combo_qty,
        extra_linen_queen_qty: payload.extra_linen_queen_qty,
        extra_linen_single_qty: payload.extra_linen_single_qty,
        extra_linen_king_qty: payload.extra_linen_king_qty,
        extra_towel_qty: payload.extra_towel_qty,
        extra_chocolate_qty: payload.extra_chocolate_qty,
      }
      savedTask = await updateTask(editingTaskId.value, updatePayload)
      pageSuccess.value = 'Task updated successfully.'
    } else {
      const createPayload: CreateDailyTaskDTO = {
        date: payload.date,
        property_id: payload.property_id,
        guest_name: payload.guest_name,
        guest_checkin_date: payload.guest_checkin_date,
        tags: payload.tags,
        task_type: payload.task_type,
        window_start_time: payload.window_start_time,
        window_end_time: payload.window_end_time,
        desired_start_time: payload.desired_start_time,
        cleaning_minutes_override: payload.cleaning_minutes_override,
        people_count: payload.people_count,
        notes: payload.notes,
        extra_linen_combo_qty: payload.extra_linen_combo_qty,
        extra_amenities_combo_qty: payload.extra_amenities_combo_qty,
        extra_linen_queen_qty: payload.extra_linen_queen_qty,
        extra_linen_single_qty: payload.extra_linen_single_qty,
        extra_linen_king_qty: payload.extra_linen_king_qty,
        extra_towel_qty: payload.extra_towel_qty,
        extra_chocolate_qty: payload.extra_chocolate_qty,
      }
      savedTask = await createTask(createPayload)
      pageSuccess.value = 'Task created successfully.'
    }

    await setTaskExtraItems(savedTask.id, payload.extraItems)

    closeForm()
    selectedDate.value = payload.date
    selectedWeekStart.value = formatDateForInput(startOfWeekMonday(parseIsoDate(payload.date)))
    await loadWeekTasks()
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to save task.'
  } finally {
    isSubmitting.value = false
  }
}

function onRequestDeleteTask(task: DailyTaskDTO): void {
  if (weekBoardScrollEl.value) {
    persistedTasksPageState.value.boardScrollTop = weekBoardScrollEl.value.scrollTop
  }

  taskToDelete.value = task
  isDeleteModalOpen.value = true
}

function closeDeleteConfirm(): void {
  taskToDelete.value = null
  isDeleteModalOpen.value = false
}

async function confirmDelete(): Promise<void> {
  if (!taskToDelete.value) return

  isDeleting.value = true
  pageError.value = ''

  try {
    await deleteTask(taskToDelete.value.id)
    pageSuccess.value = 'Task deleted successfully.'
    await loadWeekTasks()
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to delete task.'
  } finally {
    isDeleting.value = false
    closeDeleteConfirm()
  }
}

async function onMoveTask(payload: { task: DailyTaskDTO; targetDate: string }): Promise<void> {
  if (payload.targetDate === payload.task.date) return

  pageError.value = ''
  const originalDate = payload.task.date
  const taskIndex = weekTasks.value.findIndex((task) => task.id === payload.task.id)

  if (taskIndex === -1) {
    return
  }

  const currentTask = weekTasks.value[taskIndex]
  if (!currentTask) {
    return
  }

  currentTask.date = payload.targetDate

  try {
    await updateTask(payload.task.id, { date: payload.targetDate })
  } catch (err: unknown) {
    currentTask.date = originalDate
    pageError.value = err instanceof Error ? err.message : 'Failed to move task.'
  }
}

async function onSignOut(): Promise<void> {
  await signOut()
}
</script>
