<template>
  <NuxtLayout name="admin-layout" @signout="onSignOut">
    <section class="space-y-5">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-primary-600">Operations</p>
          <h2 class="mt-1 text-2xl font-semibold text-foreground">Manual Route Planning Board</h2>
        </div>

        <div class="flex flex-wrap items-center gap-2">
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
            :disabled="isLoading || isSavingDraft || isPublishingPlan"
            @click="onSaveDraft"
          >
            {{ isSavingDraft ? 'Saving...' : 'Save Draft' }}
          </button>

          <button
            type="button"
            class="btn-primary !px-3 !py-2 text-xs"
            :class="publishButtonClass"
            :disabled="isLoading || isSavingDraft || isPublishingPlan"
            @click="onPublishPlan"
          >
            {{ isPublishingPlan ? publishLoadingLabel : publishButtonLabel }}
          </button>
        </div>
      </div>

      <BaseFeedbackBanner
        v-if="pageError"
        tone="error"
        title="Route planner action failed"
        :message="pageError"
        floating
        dismissible
        @dismiss="pageError = ''"
      />

      <BaseFeedbackBanner
        v-if="pageSuccess"
        tone="success"
        title="Route planner updated"
        :message="pageSuccess"
        floating
        dismissible
        @dismiss="pageSuccess = ''"
      />

      <BaseFeedbackBanner
        v-if="showStaleWarning"
        tone="warning"
        title="Plan requires review"
        message="This plan is outdated because daily tasks changed. Please review and republish."
        floating
        dismissible
        @dismiss="dismissStaleWarning"
      />

      <section class="overflow-x-hidden rounded-xl border border-primary-100 bg-gradient-to-r from-primary-50/60 via-surface to-primary-warm-50/60 p-3 dark:border-white/10 dark:from-[#1b2534] dark:via-[#182231] dark:to-[#212d3d]">
        <div class="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <div class="flex items-center gap-1.5">
              <button
                type="button"
                class="btn-outline !px-2.5 !py-1.5 text-xs"
                aria-label="Previous week"
                @click="shiftWeek(-1)"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-3.5 w-3.5"
                  aria-hidden="true"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>

              <input
                id="route-date"
                v-model="selectedDate"
                type="date"
                class="input-base w-full max-w-[170px] !py-1 !text-xs [color-scheme:light] dark:[color-scheme:dark]"
                aria-label="Select date"
              >

              <button
                type="button"
                class="btn-outline !px-2.5 !py-1.5 text-xs"
                aria-label="Next week"
                @click="shiftWeek(1)"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-3.5 w-3.5"
                  aria-hidden="true"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
              </div>

              <button
                type="button"
                class="btn-outline !px-2 !py-1 text-[11px]"
                @click="goToToday"
              >
                Today
              </button>

              <p class="text-[10px] font-medium uppercase tracking-wide text-muted">
                {{ weekRangeLabel }}
              </p>
            </div>

            <div>
              <div class="grid grid-cols-7 gap-1.5">
                <button
                  v-for="day in weekDays"
                  :key="day.iso"
                  type="button"
                  class="relative overflow-hidden rounded-md border px-2 py-1.5 text-center transition"
                  :class="day.iso === selectedDate
                    ? day.isHoliday
                      ? 'border-warning bg-warning text-white shadow-sm'
                      : 'border-primary-500 bg-primary-500 text-white shadow-sm'
                    : day.isHoliday
                      ? 'border-warning/35 bg-warning/10 text-foreground hover:border-warning/60 dark:border-warning/30 dark:bg-warning/10'
                    : day.isToday
                      ? 'border-primary-200 bg-primary-50 text-foreground hover:border-primary-300 hover:bg-primary-100/70 dark:border-white/15 dark:bg-white/5'
                      : 'border-border bg-surface/80 text-foreground hover:border-primary-200 hover:bg-primary-50/50 dark:bg-white/[0.03] dark:hover:bg-white/5'"
                  @click="selectedDate = day.iso"
                >
                  <span
                    v-if="day.isHoliday"
                    class="holiday-badge inline-flex rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide"
                    :class="day.iso === selectedDate ? 'bg-white/20 text-white' : 'bg-warning/15 text-warning'"
                    :title="day.holidayNames.join(', ') || 'Holiday'"
                  >
                    H
                  </span>
                  <p class="text-[9px] font-semibold uppercase leading-none tracking-wide" :class="day.iso === selectedDate ? 'text-white/80' : 'text-muted'">
                    {{ day.weekdayShort }}
                  </p>
                  <p class="mt-1 text-xs font-semibold leading-none">
                    {{ day.dayNumber }}
                  </p>
                </button>
              </div>
            </div>
          </div>

          <!-- Right: info cards aligned to the right -->
          <div class="grid w-full grid-cols-2 gap-2 lg:w-[360px] lg:justify-self-end">
            <div class="min-w-0 rounded-lg border border-primary-100 bg-surface/80 px-3 py-2 text-xs text-muted dark:border-white/10 dark:bg-white/5">
              <p class="font-medium text-foreground">Planning date</p>
              <p class="mt-0.5 truncate text-[11px]">{{ selectedDateLabel }}</p>
              <p class="mt-1 text-[11px]">
                Status:
                <span
                  class="inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                  :class="loadedPlanStatus === 'published' ? 'bg-success/15 text-success' : loadedPlanStatus === 'draft' ? 'bg-warning/15 text-warning' : loadedPlanStatus === 'stale' ? 'bg-danger/15 text-danger' : 'bg-primary-100 text-primary-700 dark:bg-white/10 dark:text-white'"
                >
                  {{ loadedPlanStatusLabel }}
                </span>
              </p>
              <p class="mt-1 line-clamp-2 text-[10px] leading-tight" :class="statusHelperClass">
                {{ statusHelperText }}
              </p>
              <p v-if="loadedPlanUpdatedAt && loadedPlanStatus === 'draft'" class="mt-1 text-[10px] leading-tight text-muted">
                Saved {{ loadedPlanUpdatedAtLabel }}
              </p>
            </div>

            <div class="min-w-0 rounded-lg border border-primary-100 bg-surface/80 px-3 py-2 text-xs text-muted dark:border-white/10 dark:bg-white/5">
              <p class="font-medium text-foreground">Task overview</p>
              <p class="mt-0.5 text-[11px]">{{ totalTasks }} task(s)</p>
              <p class="mt-1 text-[10px]">{{ unassignedTasks.length }} still unassigned</p>
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-xl border border-border bg-surface p-4 shadow-card">
        <div class="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 class="text-base font-semibold text-foreground">Unassigned Tasks</h3>
          </div>
          <span class="inline-flex rounded-full bg-primary-100 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:bg-white/10 dark:text-white">
            {{ unassignedTasks.length }}
          </span>
        </div>

        <div v-if="isLoading" class="max-h-[320px] space-y-3 overflow-y-auto pr-1 lg:max-h-[420px]">
          <div class="h-32 animate-pulse rounded-xl border border-primary-100 bg-primary-100/40" />
          <div class="h-32 animate-pulse rounded-xl border border-primary-100 bg-primary-100/40" />
          <div class="h-32 animate-pulse rounded-xl border border-primary-100 bg-primary-100/40" />
        </div>

        <div v-else-if="unassignedTasks.length === 0" class="rounded-lg border border-dashed border-primary-200/80 px-4 py-10 text-center text-sm text-muted">
          All tasks for this date are currently assigned to a team.
        </div>

        <div v-else class="max-h-[320px] overflow-y-auto pr-1 lg:max-h-[420px]">
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <RoutePlannerTaskCard
            v-for="task in unassignedTasks"
            :key="task.id"
            :task="task"
            :property-data="getTaskProperty(task)"
            :client-name="getTaskClientName(task)"
            :client-color="getTaskClientColor(task)"
            column="unassigned"
            :available-teams="teamSummaries"
            @edit="openEditModal"
            @assign-to-team="(teamId) => assignToTeam(task.id, teamId)"
          />
          </div>
        </div>
      </section>

      <!-- Dynamic team panels -->
      <section
        v-for="team in teams"
        :key="team.id"
        class="rounded-xl border border-border bg-surface p-3 shadow-card"
      >
        <div class="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 class="text-base font-semibold text-foreground">Team {{ team.label }}</h3>
            <p v-if="team.tasks.length > 0" class="mt-0.5 flex flex-wrap gap-x-3 text-[11px] text-muted">
              <span>{{ teamTotalsByTeam[team.id]?.taskCount }} tasks</span>
              <span>Cleaning: {{ formatDuration(teamTotalsByTeam[team.id]?.cleaningMinutes ?? 0) }}</span>
              <span>Travel: {{ formatDuration(teamTotalsByTeam[team.id]?.travelMinutes ?? 0) }}</span>
              <span class="font-medium text-foreground/80">Total: {{ formatDuration(teamTotalsByTeam[team.id]?.totalMinutes ?? 0) }}</span>
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span class="inline-flex rounded-full bg-primary-100 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:bg-white/10 dark:text-white">
              {{ team.tasks.length }}
            </span>
            <button
              v-if="canRemoveTeam(team)"
              type="button"
              class="inline-flex h-7 w-7 items-center justify-center rounded-md text-error-600 transition hover:bg-error-100/50 dark:text-error-400 dark:hover:bg-error-500/10"
              :title="'Remove Team ' + team.label"
              :aria-label="'Remove Team ' + team.label"
              @click="removeTeam(team.id)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z" />
              </svg>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <!-- Left: settings + employees + tasks -->
          <div class="space-y-3 lg:col-span-5 xl:col-span-4">
            <div>
              <label :for="'team-start-time-' + team.id" class="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">Start time</label>
              <input :id="'team-start-time-' + team.id" v-model="team.startTime" type="time" class="input-base w-full text-sm md:max-w-xs lg:max-w-[200px] [color-scheme:light] dark:[color-scheme:dark]" />
            </div>

            <!-- Employee selector -->
            <div class="space-y-2 rounded-lg border border-primary-100/80 bg-primary-50/40 p-2.5 dark:border-white/10 dark:bg-white/[0.03]">
              <p class="text-[11px] font-semibold uppercase tracking-wide text-muted">Team {{ team.label }} employees</p>

              <div class="flex flex-col gap-1.5 sm:flex-row">
                <div class="relative flex-1">
                  <button
                    :id="'team-employee-' + team.id"
                    type="button"
                    class="input-base flex w-full items-center justify-between !py-1 text-left text-[11px]"
                    :disabled="availableEmployees.length === 0"
                    @click="toggleTeamEmployeeDropdown(team.id)"
                  >
                    <span class="truncate">
                      {{ getTeamEmployeeSelectionLabel(team.id) }}
                    </span>
                    <span class="ml-2 text-muted">▾</span>
                  </button>

                  <div
                    v-if="teamEmployeeDropdownOpen === team.id"
                    class="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-primary-100 bg-surface p-1 shadow-lg dark:border-white/10"
                  >
                    <label
                      v-for="employee in availableEmployees"
                      :key="employee.id"
                      class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-[11px] text-foreground transition hover:bg-primary-50/70 dark:hover:bg-white/10"
                    >
                      <input
                        type="checkbox"
                        class="h-3.5 w-3.5 rounded border-border text-primary-500 focus:ring-primary-500"
                        :checked="isTeamEmployeeSelected(team.id, employee.id)"
                        @change="toggleTeamEmployeeSelection(team.id, employee.id)"
                      />
                      <span class="truncate">{{ employee.full_name }}</span>
                    </label>

                    <p v-if="availableEmployees.length === 0" class="px-2 py-2 text-xs text-muted">
                      No employees available
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  class="btn-outline whitespace-nowrap !px-2 !py-0.5 text-[11px]"
                  :disabled="(teamEmployeeSelections[team.id]?.length ?? 0) === 0"
                  @click="addEmployeeToTeam(team.id)"
                >
                  Add selected
                </button>
              </div>

              <div v-if="team.employeeIds.length > 0" class="flex flex-wrap gap-2">
                <span
                  v-for="employeeId in team.employeeIds"
                  :key="employeeId"
                  class="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-surface px-2.5 py-0.5 text-[11px] font-medium text-foreground dark:border-white/15"
                >
                  {{ activeEmployees.find((e) => e.id === employeeId)?.full_name ?? employeeId }}
                  <button
                    type="button"
                    class="inline-flex h-4.5 w-4.5 items-center justify-center rounded-full text-error-600 transition hover:bg-error-100 dark:text-error-400 dark:hover:bg-error-500/10"
                    :title="'Remove ' + (activeEmployees.find((e) => e.id === employeeId)?.full_name ?? '')"
                    :aria-label="'Remove ' + (activeEmployees.find((e) => e.id === employeeId)?.full_name ?? '')"
                    @click="removeEmployeeFromTeam(team.id, employeeId)"
                  >
                    ×
                  </button>
                </span>
              </div>

              <p v-else class="text-xs text-muted">No employees selected for Team {{ team.label }}.</p>
            </div>

            <!-- Task list -->
            <div v-if="team.tasks.length === 0" class="rounded-lg border border-dashed border-primary-200/80 px-4 py-10 text-center text-sm text-muted">
              No tasks assigned to Team {{ team.label }} yet.
            </div>

            <div v-else class="max-h-[360px] space-y-3 overflow-y-auto pr-1 lg:max-h-[500px]">
              <RoutePlannerTaskCard
                v-for="(task, index) in team.tasks"
                :key="task.id"
                :task="task"
                :property-data="getTaskProperty(task)"
                :client-name="getTaskClientName(task)"
                :client-color="getTaskClientColor(task)"
                :duration-minutes="getTaskDurationMinutes(task)"
                :planned-start-time="getTaskPlannedTime(team.id, task.id)?.plannedStartTime ?? null"
                :planned-end-time="getTaskPlannedTime(team.id, task.id)?.plannedEndTime ?? null"
                :travel-minutes-from-prev-raw="getTaskPlannedTime(team.id, task.id)?.travel_minutes_from_prev_raw ?? 0"
                :travel-minutes-from-prev-applied="getTaskPlannedTime(team.id, task.id)?.travel_minutes_from_prev_applied ?? 0"
                :travel-unavailable="getTaskPlannedTime(team.id, task.id)?.travel_unavailable ?? false"
                :suspicious-distance="getTaskPlannedTime(team.id, task.id)?.suspiciousDistance ?? false"
                :distance-label="getTaskPlannedTime(team.id, task.id)?.distanceLabel ?? ''"
                column="assigned"
                :can-move-up="index > 0"
                :can-move-down="index < team.tasks.length - 1"
                @edit="openEditModal"
                @remove="removeFromTeam(task.id, team.id)"
                @move-up="moveTask(team.id, index, 'up')"
                @move-down="moveTask(team.id, index, 'down')"
              />
            </div>
          </div>

          <!-- Right: Team map -->
          <aside class="rounded-xl border border-primary-100 bg-gradient-to-br from-primary-50/70 to-primary-warm-50/60 p-4 dark:border-white/10 dark:from-white/5 dark:to-white/[0.03] lg:col-span-7 xl:col-span-8">
            <div class="flex h-[450px] min-h-[450px] max-h-[450px] flex-col lg:h-[630px] lg:min-h-[630px] lg:max-h-[630px]">
              <div class="mb-3 flex items-start justify-between gap-2">
                <div>
                  <h4 class="text-sm font-semibold text-foreground">Team {{ team.label }} Map</h4>
                  <p class="mt-1 text-sm text-muted">Ordered markers based on the current team task list.</p>
                </div>
                <button type="button" class="btn-outline !px-2 !py-1 text-[11px]" @click="openMap(team.id)">Expand Map</button>
              </div>

                <div class="min-h-[180px] flex-1">
                <MapView
                  :tasks="buildTeamMapStops(team)"
                  empty-message="Add coordinates to team properties to render markers."
                  @route-metrics-change="updateTeamRouteMetrics(team.id, $event)"
                />
              </div>
            </div>
          </aside>
        </div>
      </section>

      <!-- Add Team -->
      <div class="flex justify-center py-2">
        <button type="button" class="btn-outline inline-flex items-center gap-2" @click="addTeam">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
            <path d="M19 13H13v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          Add Team
        </button>
      </div>
    </section>

    <RoutePlannerMapModal
      :model-value="isMapModalOpen"
      :title="mapModalTitle"
      :start-time="mapModalStartTime"
      :employee-names="mapModalEmployeeNames"
      :stops="mapModalStops"
      @update:model-value="onMapModalVisibilityChange"
      @route-metrics-change="handleExpandedMapRouteMetrics"
    />

    <!-- Edit Task Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isEditModalOpen"
          class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-16 backdrop-blur-sm"
          @click.self="closeEditModal"
        >
          <div class="w-full max-w-2xl rounded-2xl border border-border bg-surface shadow-xl">
            <div class="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 class="text-base font-semibold text-foreground">Edit Task</h2>
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition hover:bg-primary-100/50 dark:hover:bg-white/10"
                aria-label="Close"
                @click="closeEditModal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5">
                  <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
            <div class="p-6">
              <DailyTaskForm
                v-if="editingTask"
                mode="edit"
                :task="editingTask"
                :is-submitting="isEditSubmitting"
                submit-label="Save changes"
                @submit="onEditTaskSubmit"
                @cancel="closeEditModal"
              />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import BaseFeedbackBanner from '../../components/ui/BaseFeedbackBanner.vue'
import DailyTaskForm from '../../components/features/tasks/DailyTaskForm.vue'
import MapView from '../../components/features/tasks/MapView.vue'
import type { DailyTaskFormPayload } from '../../components/features/tasks/DailyTaskForm.vue'
import RoutePlannerMapModal from '../../components/features/tasks/RoutePlannerMapModal.vue'
import RoutePlannerTaskCard from '../../components/features/tasks/RoutePlannerTaskCard.vue'
import { useAuth } from '../../composables/useAuth'
import { useClients } from '../../composables/useClients'
import { useDailyTasks } from '../../composables/useDailyTasks'
import { useEmployees } from '../../composables/useEmployees'
import { useHolidays } from '../../composables/useHolidays'
import { useProperties } from '../../composables/useProperties'
import { useRoutePlans } from '../../composables/useRoutePlans'
import { applyTravelMinutesRule } from '../../utils/routePlannerTravel'
import type { DailyTaskDTO } from '../../../shared/types/DailyTaskDTO'
import type { ClientDTO } from '../../../shared/types/ClientDTO'
import type { EmployeeDTO } from '../../../shared/types/EmployeeDTO'
import type { PropertyDTO } from '../../../shared/types/PropertyDTO'
import type { RoutePlanDTO, RoutePlanStatus } from '../../../shared/types/RoutePlanDTO'
import type { RoutePlannerMapStop } from '../../../shared/types/RoutePlannerMapStop'
import type { RoutePlannerTravelMetric } from '../../../shared/types/RoutePlannerTravelMetric'

definePageMeta({
  name: 'admin-route-planner',
})

interface TeamState {
  id: string
  label: string
  startTime: string
  employeeIds: string[]
  tasks: DailyTaskDTO[]
}

interface PlannedTaskTiming {
  dailyTaskId: string
  orderIndex: number
  durationMinutes: number
  plannedStartTime: string
  plannedEndTime: string
  travelMinutesFromPrev: number
  travel_minutes_from_prev_raw: number
  travel_minutes_from_prev_applied: number
  travel_unavailable: boolean
  suspiciousDistance: boolean
  distanceFromDepotKm: number
  distanceLabel: string
}

interface TeamTotals {
  taskCount: number
  cleaningMinutes: number
  travelMinutes: number
  totalMinutes: number
}

type MoveDirection = 'up' | 'down'

const TEAM_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LAST_VIEWED_DATE_STORAGE_KEY = 'freshbreeze:last-viewed-board-date'

const { signOut } = useAuth()
const { fetchClients } = useClients()
const { fetchTasksByDate, updateTask } = useDailyTasks()
const { getEmployees } = useEmployees()
const { getHolidaysByRange } = useHolidays()
const { fetchProperties } = useProperties()
const { getRoutePlanByDate, saveRoutePlanDraft, publishRoutePlan, markPublishedPlanAsStale } = useRoutePlans()

// ── state ─────────────────────────────────────────────────────────────────────

const selectedDate = ref(getInitialSelectedDate())
const isLoading = ref(false)
const isSavingDraft = ref(false)
const isPublishingPlan = ref(false)
const pageError = ref('')
const pageSuccess = ref('')
const holidayNamesByDate = ref<Record<string, string[]>>({})
const loadedPlanStatus = ref<RoutePlanStatus | null>(null)
const loadedPlanUpdatedAt = ref<string | null>(null)
const hasStaleMismatch = ref(false)
const staleWarningDismissed = ref(false)
const activeEmployees = ref<EmployeeDTO[]>([])
const clientsById = ref<Record<string, ClientDTO>>({})
const propertiesById = ref<Record<string, PropertyDTO>>({})
const expandedMapTeamId = ref<string | null>(null)
const routeMetricsByTeam = ref<Record<string, Record<string, RoutePlannerTravelMetric>>>({})
const route = useRoute()
const router = useRouter()

const isFullscreenMode = computed(() => route.query.fullscreen === '1')

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

// ── edit task modal ───────────────────────────────────────────────────────────
const editingTask = ref<DailyTaskDTO | null>(null)
const isEditModalOpen = ref(false)
const isEditSubmitting = ref(false)

function openEditModal(task: DailyTaskDTO): void {
  editingTask.value = task
  isEditModalOpen.value = true
}

function closeEditModal(): void {
  isEditModalOpen.value = false
  editingTask.value = null
}

async function onEditTaskSubmit(payload: DailyTaskFormPayload): Promise<void> {
  if (!editingTask.value) return
  isEditSubmitting.value = true
  try {
    const updated = await updateTask(editingTask.value.id, payload)
    // Update the task in-place in whichever list it lives
    const inUnassigned = unassignedTasks.value.findIndex((t) => t.id === updated.id)
    if (inUnassigned >= 0) {
      unassignedTasks.value[inUnassigned] = updated
    } else {
      for (const team of teams.value) {
        const idx = team.tasks.findIndex((t) => t.id === updated.id)
        if (idx >= 0) {
          team.tasks[idx] = updated
          break
        }
      }
    }
    // If a published plan exists, mark it stale so admin is prompted to republish
    if (loadedPlanStatus.value === 'published' && selectedDate.value) {
      await markPublishedPlanAsStale(selectedDate.value)
      loadedPlanStatus.value = 'stale'
      hasStaleMismatch.value = true
      staleWarningDismissed.value = false
    }
    closeEditModal()
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to update task.'
  } finally {
    isEditSubmitting.value = false
  }
}

const unassignedTasks = ref<DailyTaskDTO[]>([])
const teams = ref<TeamState[]>([createTeam('A'), createTeam('B')])

// Per-team selected employees in dropdown — not persisted to draft
const teamEmployeeSelections = reactive<Record<string, string[]>>({})
const teamEmployeeDropdownOpen = ref<string | null>(null)

teams.value.forEach((team) => {
  teamEmployeeSelections[team.id] = []
})

// ── computed ──────────────────────────────────────────────────────────────────

const isMapModalOpen = computed(() => expandedMapTeamId.value !== null)

const totalTasks = computed(() => {
  return unassignedTasks.value.length + teams.value.reduce((sum, t) => sum + t.tasks.length, 0)
})

const loadedPlanStatusLabel = computed(() => {
  if (loadedPlanStatus.value === 'published') {
    return 'Published'
  }

  if (loadedPlanStatus.value === 'draft') {
    return 'Draft'
  }

  if (loadedPlanStatus.value === 'stale') {
    return 'Stale'
  }

  return 'Unsaved board'
})

const statusHelperText = computed(() => {
  if (loadedPlanStatus.value === 'draft') {
    return 'This plan is saved but not visible to the team yet.'
  }

  if (loadedPlanStatus.value === 'published') {
    return loadedPlanUpdatedAtLabel.value ? `Published ${loadedPlanUpdatedAtLabel.value}` : 'This plan is live for the team.'
  }

  if (loadedPlanStatus.value === 'stale') {
    return 'Daily tasks changed after publishing. Please review and republish.'
  }

  return 'No saved plan for this date yet.'
})

const statusHelperClass = computed(() => {
  if (loadedPlanStatus.value === 'draft') {
    return 'text-warning/90'
  }

  if (loadedPlanStatus.value === 'published') {
    return 'text-success/90'
  }

  if (loadedPlanStatus.value === 'stale') {
    return 'text-danger/90'
  }

  return 'text-muted'
})

const loadedPlanUpdatedAtLabel = computed(() => {
  if (!loadedPlanUpdatedAt.value) return null
  const d = new Date(loadedPlanUpdatedAt.value)
  if (isNaN(d.getTime())) return null
  const day = d.getDate()
  const month = d.toLocaleString('en-AU', { month: 'short' })
  const hours = String(d.getHours()).padStart(2, '0')
  const mins = String(d.getMinutes()).padStart(2, '0')
  return `${day} ${month} · ${hours}:${mins}`
})

const publishButtonLabel = computed(() => {
  if (loadedPlanStatus.value === 'draft') {
    return 'Publish Plan'
  }

  if (loadedPlanStatus.value === 'published' || loadedPlanStatus.value === 'stale') {
    return 'Republish Plan'
  }

  return 'Publish Plan'
})

const publishLoadingLabel = computed(() => {
  if (loadedPlanStatus.value === 'published' || loadedPlanStatus.value === 'stale') {
    return 'Republishing...'
  }

  return 'Publishing...'
})

const publishButtonClass = computed(() => {
  if (loadedPlanStatus.value === 'stale') {
    return 'ring-2 ring-danger/40 dark:ring-danger/60'
  }

  return ''
})

const showStaleWarning = computed(() => {
  return (loadedPlanStatus.value === 'stale' || hasStaleMismatch.value) && !staleWarningDismissed.value
})

const selectedDateLabel = computed(() => {
  if (!selectedDate.value) return ''

  const [year, month, day] = selectedDate.value.split('-')
  const date = new Date(Number(year), Number(month) - 1, Number(day))

  return date.toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})

const weekDays = computed(() => {
  const start = getStartOfWeek(parseIsoDate(selectedDate.value))

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)

    const iso = formatDateForInput(date)
    const holidayNames = holidayNamesByDate.value[iso] ?? []

    return {
      iso,
      weekdayShort: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: String(date.getDate()).padStart(2, '0'),
      monthShort: date.toLocaleDateString('en-US', { month: 'short' }),
      isToday: iso === todayIsoDate(),
      isHoliday: holidayNames.length > 0,
      holidayNames,
    }
  })
})

const weekRangeLabel = computed(() => {
  const start = getStartOfWeek(parseIsoDate(selectedDate.value))
  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  const startLabel = start.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  })
  const endLabel = end.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return `${startLabel} - ${endLabel}`
})

// Employees not yet assigned to any team — shared dropdown source for all teams
const availableEmployees = computed<EmployeeDTO[]>(() => {
  const assigned = new Set(teams.value.flatMap((t) => t.employeeIds))
  return activeEmployees.value.filter((emp) => !assigned.has(emp.id))
})

// Team summaries passed to unassigned task cards for the assignment buttons
const teamSummaries = computed(() => teams.value.map((t) => ({ id: t.id, label: t.label })))

// Map modal computed values
const mapModalTeam = computed<TeamState | null>(() => {
  if (!expandedMapTeamId.value) return null
  return teams.value.find((t) => t.id === expandedMapTeamId.value) ?? null
})

const mapModalTitle = computed(() => {
  const team = mapModalTeam.value
  return team ? 'Team ' + team.label + ' Expanded Map' : 'Expanded Map'
})

const mapModalStartTime = computed(() => mapModalTeam.value?.startTime ?? '')

const mapModalEmployeeNames = computed(() => {
  const team = mapModalTeam.value
  if (!team) return 'Not selected'
  const names = activeEmployees.value
    .filter((emp) => team.employeeIds.includes(emp.id))
    .map((emp) => emp.full_name)
  return names.length > 0 ? names.join(', ') : 'Not selected'
})

const mapModalStops = computed<RoutePlannerMapStop[]>(() => {
  const team = mapModalTeam.value
  return team ? buildTeamMapStops(team) : []
})

// ── watchers ──────────────────────────────────────────────────────────────────

watch(selectedDate, async (date) => {
  if (!date) return
  persistLastViewedDate(date)
  await loadBoardForDate(date)
})

onMounted(async () => {
  await Promise.all([loadEmployees(), loadProperties(), loadClients()])
  await loadBoardForDate(selectedDate.value)
})

// ── helpers ───────────────────────────────────────────────────────────────────

function todayIsoDate(): string {
  return formatDateForInput(new Date())
}

function getInitialSelectedDate(): string {
  if (!process.client) {
    return todayIsoDate()
  }

  const savedDate = window.localStorage.getItem(LAST_VIEWED_DATE_STORAGE_KEY)
  return isValidIsoDate(savedDate) ? savedDate : todayIsoDate()
}

function persistLastViewedDate(value: string): void {
  if (!process.client || !isValidIsoDate(value)) {
    return
  }

  window.localStorage.setItem(LAST_VIEWED_DATE_STORAGE_KEY, value)
}

function isValidIsoDate(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  return (
    date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day
  )
}

function formatDateForInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return String(year) + '-' + month + '-' + day
}

function parseIsoDate(isoDate: string): Date {
  const parts = isoDate.split('-')
  const year = Number(parts[0] ?? 1970)
  const month = Number(parts[1] ?? 1)
  const day = Number(parts[2] ?? 1)
  return new Date(year, month - 1, day)
}

function getStartOfWeek(date: Date): Date {
  const start = new Date(date)
  const day = start.getDay()
  const diff = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + diff)
  start.setHours(0, 0, 0, 0)
  return start
}

function createTeamId(): string {
  return 'team-' + Math.random().toString(36).slice(2, 9)
}

function createTeam(label: string): TeamState {
  return {
    id: createTeamId(),
    label,
    startTime: '08:00',
    employeeIds: [],
    tasks: [],
  }
}

function generateTeamLabel(): string {
  const usedLabels = new Set(teams.value.map((t) => t.label))
  for (const char of TEAM_LABELS) {
    if (!usedLabels.has(char)) return char
  }
  return String(teams.value.length + 1)
}

function getEmployeeNamesForTeam(team: TeamState): string {
  const names = activeEmployees.value
    .filter((emp) => team.employeeIds.includes(emp.id))
    .map((emp) => emp.full_name)
  return names.length > 0 ? names.join(', ') : 'Not selected'
}

function getTaskProperty(task: DailyTaskDTO): PropertyDTO | null {
  return propertiesById.value[task.property_id] ?? null
}

function getTaskClientName(task: DailyTaskDTO): string {
  const property = getTaskProperty(task)
  if (!property) {
    return 'Not available'
  }

  return clientsById.value[property.client_id]?.name ?? 'Not available'
}

function getTaskClientColor(task: DailyTaskDTO): string | null {
  const property = getTaskProperty(task)
  if (!property) {
    return null
  }

  return clientsById.value[property.client_id]?.color ?? null
}

function buildTeamMapStops(team: TeamState): RoutePlannerMapStop[] {
  const markerColorByTeam: Record<string, string> = {
    A: '#2563EB',
    B: '#16A34A',
    C: '#D97706',
    D: '#9333EA',
  }

  return team.tasks.map((task, index) => {
    const property = getTaskProperty(task)

    return {
      id: task.id,
      order: index + 1,
      propertyName: task.property_name ?? property?.name ?? 'Unknown property',
      address: property?.address ?? '',
      lat: property?.lat ?? null,
      lng: property?.lng ?? null,
      clientName: getTaskClientName(task),
      teamLabel: team.label,
      markerColor: markerColorByTeam[team.label] ?? '#2563EB',
    }
  })
}

function parseTimeToMinutes(time: string | null | undefined, fallbackMinutes = 8 * 60): number {
  if (!time) {
    return fallbackMinutes
  }

  const [hourRaw, minuteRaw] = time.split(':')
  const hour = Number(hourRaw)
  const minute = Number(minuteRaw)

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return fallbackMinutes
  }

  return (hour * 60) + minute
}

function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function alignMinutesToFive(rawMinutes: number): number {
  if (!Number.isFinite(rawMinutes) || rawMinutes <= 0) {
    return 0
  }

  return Math.ceil(rawMinutes / 5) * 5
}

function updateTeamRouteMetrics(teamId: string, metrics: RoutePlannerTravelMetric[]): void {
  routeMetricsByTeam.value = {
    ...routeMetricsByTeam.value,
    [teamId]: Object.fromEntries(metrics.map((metric) => [metric.stopId, metric])),
  }
}

function handleExpandedMapRouteMetrics(metrics: RoutePlannerTravelMetric[]): void {
  if (!expandedMapTeamId.value) {
    return
  }

  updateTeamRouteMetrics(expandedMapTeamId.value, metrics)
}

function formatMinutesToTime(totalMinutes: number): string {
  const minutesInDay = 24 * 60
  const normalized = ((Math.floor(totalMinutes) % minutesInDay) + minutesInDay) % minutesInDay
  const hour = Math.floor(normalized / 60)
  const minute = normalized % 60

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function getTaskDurationMinutes(task: DailyTaskDTO): number {
  const overrideMinutes = task.cleaning_minutes_override
  if (typeof overrideMinutes === 'number' && Number.isFinite(overrideMinutes) && overrideMinutes >= 0) {
    return alignMinutesToFive(overrideMinutes)
  }

  const propertyDefault = getTaskProperty(task)?.default_cleaning_minutes ?? 0
  return alignMinutesToFive(propertyDefault)
}

const plannedTimingsByTeam = computed<Record<string, PlannedTaskTiming[]>>(() => {
  const byTeam: Record<string, PlannedTaskTiming[]> = {}

  teams.value.forEach((team) => {
    let cursorMinutes = alignMinutesToFive(parseTimeToMinutes(team.startTime))
    const routeMetrics = routeMetricsByTeam.value[team.id] ?? {}

    byTeam[team.id] = team.tasks.map((task, index) => {
      const durationMinutes = getTaskDurationMinutes(task)
      const routeMetric = routeMetrics[task.id]
      const travel_minutes_from_prev_raw = index === 0 ? 0 : (routeMetric?.travel_minutes_from_prev_raw ?? 0)
      const travel_minutes_from_prev_applied = index === 0 ? 0 : (routeMetric?.travel_minutes_from_prev_applied ?? applyTravelMinutesRule(travel_minutes_from_prev_raw))

      const plannedStartMinutes = alignMinutesToFive(cursorMinutes + travel_minutes_from_prev_applied)
      const plannedEndMinutes = plannedStartMinutes + durationMinutes

      cursorMinutes = plannedEndMinutes

      const travel_unavailable = index > 0 && routeMetric?.coordinatesUnavailable === true

      return {
        dailyTaskId: task.id,
        orderIndex: index,
        durationMinutes,
        plannedStartTime: formatMinutesToTime(plannedStartMinutes),
        plannedEndTime: formatMinutesToTime(plannedEndMinutes),
        travelMinutesFromPrev: travel_minutes_from_prev_applied,
        travel_minutes_from_prev_raw,
        travel_minutes_from_prev_applied,
        travel_unavailable,
        suspiciousDistance: routeMetric?.suspiciousDistance ?? false,
        distanceFromDepotKm: routeMetric?.distanceFromDepotKm ?? 0,
        distanceLabel: routeMetric?.distanceLabel ?? '',
      }
    })
  })

  return byTeam
})

const teamTotalsByTeam = computed<Record<string, TeamTotals>>(() => {
  const result: Record<string, TeamTotals> = {}

  for (const team of teams.value) {
    const timings = plannedTimingsByTeam.value[team.id] ?? []
    const cleaningMinutes = timings.reduce((sum, t) => sum + t.durationMinutes, 0)
    const travelMinutes = timings.reduce((sum, t) => sum + t.travel_minutes_from_prev_applied, 0)

    result[team.id] = {
      taskCount: timings.length,
      cleaningMinutes,
      travelMinutes,
      totalMinutes: cleaningMinutes + travelMinutes,
    }
  }

  return result
})

function getTaskPlannedTime(teamId: string, taskId: string): PlannedTaskTiming | null {
  const timing = plannedTimingsByTeam.value[teamId]?.find((entry) => entry.dailyTaskId === taskId)
  return timing ?? null
}

function canRemoveTeam(team: TeamState): boolean {
  return team.tasks.length === 0 && team.employeeIds.length === 0
}

// ── date navigation ───────────────────────────────────────────────────────────

function goToToday(): void {
  selectedDate.value = todayIsoDate()
}

function shiftDate(days: number): void {
  const current = parseIsoDate(selectedDate.value)
  current.setDate(current.getDate() + days)
  selectedDate.value = formatDateForInput(current)
}

function shiftWeek(weeks: number): void {
  shiftDate(weeks * 7)
}

// ── board state ───────────────────────────────────────────────────────────────

function resetTeamEmployeeSelections(): void {
  Object.keys(teamEmployeeSelections).forEach((k) => delete teamEmployeeSelections[k])
  teams.value.forEach((team) => {
    teamEmployeeSelections[team.id] = []
  })
  teamEmployeeDropdownOpen.value = null
}

function resetAssignments(tasks: DailyTaskDTO[]): void {
  unassignedTasks.value = [...tasks]
  teams.value = [createTeam('A'), createTeam('B')]
  hasStaleMismatch.value = false
  staleWarningDismissed.value = false
  resetTeamEmployeeSelections()
}

function buildSavePayload() {
  return {
    date: selectedDate.value,
    groups: teams.value.map((team, index) => ({
      label: team.label.trim() || `Team ${index + 1}`,
      startTime: team.startTime || null,
      employeeIds: [...team.employeeIds],
      stops: (plannedTimingsByTeam.value[team.id] ?? []).map((timing) => ({
        dailyTaskId: timing.dailyTaskId,
        orderIndex: timing.orderIndex,
        plannedStartTime: timing.plannedStartTime,
        plannedEndTime: timing.plannedEndTime,
        travelMinutesFromPrev: timing.travel_minutes_from_prev_applied,
      })),
      taskIds: team.tasks.map((task) => task.id),
    })),
  }
}

function applyPersistedPlan(plan: RoutePlanDTO, tasks: DailyTaskDTO[]): boolean {
  const latestTasksById = new Map(tasks.map((task) => [task.id, task]))
  const sortedGroups = [...plan.groups].sort((a, b) => a.sort_order - b.sort_order)
  const savedStopTaskIds = new Set(
    plan.groups.flatMap((group) => group.stops.map((stop) => stop.daily_task_id)),
  )

  teams.value = sortedGroups.map((group) => ({
    id: group.id,
    label: group.label?.trim() || generateTeamLabel(),
    startTime: group.start_time ?? '08:00',
    employeeIds: [...group.employee_ids],
    tasks: [...group.stops]
      .sort((a, b) => a.order_index - b.order_index)
      .map((stop) => latestTasksById.get(stop.daily_task_id) ?? null)
      .filter((task): task is DailyTaskDTO => task !== null),
  }))

  const removedTaskCount = plan.groups
    .flatMap((group) => group.stops)
    .filter((stop) => !latestTasksById.has(stop.daily_task_id)).length

  const newlyAddedTaskCount = tasks.filter((task) => !savedStopTaskIds.has(task.id)).length
  const hasMismatch = removedTaskCount > 0 || newlyAddedTaskCount > 0

  if (teams.value.length === 0) {
    teams.value = [createTeam('A'), createTeam('B')]
  }

  const assignedTaskIds = new Set<string>([
    ...teams.value.flatMap((team) => team.tasks.map((task) => task.id)),
  ])

  unassignedTasks.value = tasks.filter((task) => !assignedTaskIds.has(task.id))
  hasStaleMismatch.value = hasMismatch
  staleWarningDismissed.value = false
  resetTeamEmployeeSelections()

  return hasMismatch
}

function dismissStaleWarning(): void {
  staleWarningDismissed.value = true
}


async function onSaveDraft(): Promise<void> {
  if (!selectedDate.value) return

  pageError.value = ''
  pageSuccess.value = ''
  isSavingDraft.value = true

  try {
    const saved = await saveRoutePlanDraft(buildSavePayload())
    loadedPlanStatus.value = saved.status
    loadedPlanUpdatedAt.value = saved.updated_at || null
    hasStaleMismatch.value = false
    staleWarningDismissed.value = false
    pageSuccess.value = 'Draft saved successfully.'
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to save draft.'
  } finally {
    isSavingDraft.value = false
  }
}

async function onPublishPlan(): Promise<void> {
  if (!selectedDate.value) return

  pageError.value = ''
  pageSuccess.value = ''
  isPublishingPlan.value = true

  try {
    const saved = await publishRoutePlan(buildSavePayload())
    loadedPlanStatus.value = saved.status
    loadedPlanUpdatedAt.value = saved.updated_at || null
    hasStaleMismatch.value = false
    staleWarningDismissed.value = false
    pageSuccess.value = 'Plan published successfully.'
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to publish plan.'
  } finally {
    isPublishingPlan.value = false
  }
}

async function loadEmployees(): Promise<void> {
  try {
    const loaded = await getEmployees()
    activeEmployees.value = loaded.filter((emp) => emp.active && emp.role === 'worker')
  } catch {
    activeEmployees.value = []
  }
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

async function loadBoardForDate(date: string): Promise<void> {
  if (!date) {
    return
  }

  pageError.value = ''
  pageSuccess.value = ''
  loadedPlanStatus.value = null
  loadedPlanUpdatedAt.value = null

  isLoading.value = true

  try {
    const start = getStartOfWeek(parseIsoDate(date))
    const end = new Date(start)
    end.setDate(start.getDate() + 6)

    const [tasks, persistedPlan, holidays] = await Promise.all([
      fetchTasksByDate(date),
      getRoutePlanByDate(date),
      getHolidaysByRange(formatDateForInput(start), formatDateForInput(end)).catch(() => []),
    ])

    holidayNamesByDate.value = (holidays ?? []).reduce<Record<string, string[]>>((acc, holiday) => {
      if (!acc[holiday.date]) {
        acc[holiday.date] = []
      }

      acc[holiday.date].push(holiday.name)
      return acc
    }, {})

    if (persistedPlan) {
      const hasMismatch = applyPersistedPlan(persistedPlan, tasks)
      loadedPlanStatus.value = persistedPlan.status
      loadedPlanUpdatedAt.value = persistedPlan.updated_at || null

      if (hasMismatch) {
        if (persistedPlan.status === 'published') {
          await markPublishedPlanAsStale(date)
        }

        loadedPlanStatus.value = 'stale'
      }

      return
    }

    resetAssignments(tasks)
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to load daily tasks.'
    holidayNamesByDate.value = {}
    resetAssignments([])
  } finally {
    isLoading.value = false
  }
}

// ── team management ───────────────────────────────────────────────────────────

function addTeam(): void {
  const label = generateTeamLabel()
  const team = createTeam(label)
  teams.value.push(team)
  teamEmployeeSelections[team.id] = []
}

function removeTeam(teamId: string): void {
  const team = teams.value.find((t) => t.id === teamId)
  if (!team || !canRemoveTeam(team)) return
  teams.value = teams.value.filter((t) => t.id !== teamId)
  delete teamEmployeeSelections[teamId]
  if (teamEmployeeDropdownOpen.value === teamId) {
    teamEmployeeDropdownOpen.value = null
  }
}

// ── employee management ───────────────────────────────────────────────────────

function addEmployeeToTeam(teamId: string): void {
  const team = teams.value.find((t) => t.id === teamId)
  if (!team) return

  const selectedIds = teamEmployeeSelections[teamId] ?? []
  if (selectedIds.length === 0) return

  for (const selectedId of selectedIds) {
    if (team.employeeIds.includes(selectedId)) {
      continue
    }

    // Prevent the same employee from being in multiple teams simultaneously
    const inAnotherTeam = teams.value
      .filter((t) => t.id !== teamId)
      .some((t) => t.employeeIds.includes(selectedId))

    if (inAnotherTeam) {
      continue
    }

    team.employeeIds.push(selectedId)
  }

  teamEmployeeSelections[teamId] = []
  teamEmployeeDropdownOpen.value = null
}

function removeEmployeeFromTeam(teamId: string, employeeId: string): void {
  const team = teams.value.find((t) => t.id === teamId)
  if (!team) return
  team.employeeIds = team.employeeIds.filter((id) => id !== employeeId)
}

function toggleTeamEmployeeDropdown(teamId: string): void {
  teamEmployeeDropdownOpen.value = teamEmployeeDropdownOpen.value === teamId ? null : teamId
}

function isTeamEmployeeSelected(teamId: string, employeeId: string): boolean {
  return (teamEmployeeSelections[teamId] ?? []).includes(employeeId)
}

function toggleTeamEmployeeSelection(teamId: string, employeeId: string): void {
  const current = teamEmployeeSelections[teamId] ?? []

  if (current.includes(employeeId)) {
    teamEmployeeSelections[teamId] = current.filter((id) => id !== employeeId)
    return
  }

  teamEmployeeSelections[teamId] = [...current, employeeId]
}

function getTeamEmployeeSelectionLabel(teamId: string): string {
  const selectedIds = teamEmployeeSelections[teamId] ?? []

  if (selectedIds.length === 0) {
    return availableEmployees.value.length > 0 ? 'Select employees...' : 'No employees available'
  }

  return String(selectedIds.length) + ' selected'
}

// ── task movement ─────────────────────────────────────────────────────────────

function assignToTeam(taskId: string, teamId: string): void {
  const index = unassignedTasks.value.findIndex((task) => task.id === taskId)
  if (index < 0) return

  const [task] = unassignedTasks.value.splice(index, 1)
  if (!task) return

  const team = teams.value.find((t) => t.id === teamId)
  if (!team) return

  team.tasks.push(task)
}

function removeFromTeam(taskId: string, teamId: string): void {
  const team = teams.value.find((t) => t.id === teamId)
  if (!team) return

  const index = team.tasks.findIndex((task) => task.id === taskId)
  if (index < 0) return

  const [task] = team.tasks.splice(index, 1)
  if (!task) return

  unassignedTasks.value.push(task)
}

function moveTask(teamId: string, index: number, direction: MoveDirection): void {
  const team = teams.value.find((t) => t.id === teamId)
  if (!team) return

  const source = team.tasks

  if (direction === 'up') {
    if (index <= 0) return
    const previous = source[index - 1]
    const current = source[index]
    if (!previous || !current) return
    source[index - 1] = current
    source[index] = previous
    return
  }

  if (index >= source.length - 1) return

  const next = source[index + 1]
  const current = source[index]
  if (!next || !current) return
  source[index + 1] = current
  source[index] = next
}

// ── map modal ─────────────────────────────────────────────────────────────────

function openMap(teamId: string): void {
  expandedMapTeamId.value = teamId
}

function onMapModalVisibilityChange(value: boolean): void {
  if (!value) {
    expandedMapTeamId.value = null
  }
}

async function onSignOut(): Promise<void> {
  await signOut()
}
</script>
