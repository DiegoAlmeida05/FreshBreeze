<template>
  <NuxtLayout name="admin-layout" @signout="onSignOut">
    <section class="space-y-4">
      <div class="action-bar">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-primary-600">Management</p>
          <h2 class="mt-1 text-2xl font-semibold text-foreground">Employee Management</h2>
        </div>

        <button
          type="button"
          class="btn-primary"
          @click="openCreateForm"
        >
          Add employee
        </button>
      </div>

      <div class="toolbar-surface grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div class="sm:col-span-2">
          <label for="employees-search" class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Search</label>
          <div class="relative">
            <input
              id="employees-search"
              v-model="searchTerm"
              type="text"
              class="input-base pr-10"
              placeholder="Search by name, email, or phone"
            />
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted">
              <path fill-rule="evenodd" d="M10.5 3a7.5 7.5 0 1 0 4.75 13.305l4.223 4.222 1.06-1.06-4.222-4.223A7.5 7.5 0 0 0 10.5 3Zm-6 7.5a6 6 0 1 1 12 0 6 6 0 0 1-12 0Z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>

        <div>
          <label for="employees-page-size" class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Items per page</label>
          <select id="employees-page-size" v-model.number="pageSize" class="select-base">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option>
          </select>
        </div>
      </div>

      <BaseFeedbackBanner
        v-if="pageError"
        tone="error"
        title="Employee action failed"
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

      <EmployeeTable
        :employees="paginatedEmployees"
        :is-loading="isLoading"
        :can-delete-users="canDeleteUsers"
        :toggling-active-ids="togglingActiveIds"
        @edit="openEditForm"
        @toggle-active="onToggleEmployeeActive"
        @deleted="loadEmployees"
        @error="onTableError"
      />

      <div
        v-if="filteredEmployees.length > pageSize"
        class="pagination-bar rounded-2xl"
      >
        <p class="text-xs text-muted sm:text-sm">
          Showing {{ pageStart }}-{{ pageEnd }} of {{ filteredEmployees.length }} employee(s)
        </p>

        <div class="inline-flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            class="btn-outline !px-3 !py-1.5 text-xs"
            :disabled="currentPage === 1"
            @click="currentPage -= 1"
          >
            Previous
          </button>
          <span class="text-xs font-medium text-foreground sm:text-sm">Page {{ currentPage }} of {{ totalPages }}</span>
          <button
            type="button"
            class="btn-outline !px-3 !py-1.5 text-xs"
            :disabled="currentPage === totalPages"
            @click="currentPage += 1"
          >
            Next
          </button>
        </div>
      </div>
    </section>

    <Teleport to="body">
      <div
        v-if="isFormOpen"
        class="modal-backdrop"
        @click.self="closeForm"
      >
        <div class="modal-surface w-full max-w-3xl max-h-[calc(100vh-3rem)] overflow-y-auto">
          <div class="modal-header">
            <h3 class="text-base font-semibold text-foreground">
              {{ editingEmployeeId ? 'Edit employee' : 'New employee' }}
            </h3>
            <button type="button" class="btn-outline !px-3 !py-1.5" @click="closeForm">Close</button>
          </div>

          <div class="modal-body">
            <EmployeeForm
              :key="formInstanceKey"
              :mode="editingEmployeeId ? 'edit' : 'create'"
              :employee="selectedEmployee"
              :is-submitting="isSubmitting"
              :submit-label="editingEmployeeId ? 'Update' : 'Create'"
              @submit="onSubmitForm"
              @cancel="closeForm"
            />
          </div>
        </div>
      </div>
    </Teleport>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import BaseFeedbackBanner from '../../components/ui/BaseFeedbackBanner.vue'
import EmployeeForm from '../../components/features/employees/EmployeeForm.vue'
import EmployeeTable from '../../components/features/employees/EmployeeTable.vue'
import { useAuth } from '../../composables/useAuth'
import { useCreateUser } from '../../composables/useCreateUser'
import { useEmployees } from '../../composables/useEmployees'
import type { EmployeeDTO, UpdateEmployeeDTO } from '../../../shared/types/EmployeeDTO'
import type { CreateEmployeeFormPayload, EmployeeFormPayload } from '../../components/features/employees/EmployeeForm.vue'

const { signOut, getProfile } = useAuth()
const { createUser } = useCreateUser()
const { getEmployees, getEmployeeById, updateEmployee, updateEmployeeUserRole } = useEmployees()

const employees = ref<EmployeeDTO[]>([])
const selectedEmployee = ref<EmployeeDTO | null>(null)
const editingEmployeeId = ref<string | null>(null)
const isLoading = ref(false)
const isSubmitting = ref(false)
const isFormOpen = ref(false)
const formInstanceKey = ref(0)
const currentAdminProfileId = ref<string | null>(null)
const canDeleteUsers = ref(false)
const pageError = ref('')
const pageSuccess = ref('')
const togglingActiveIds = ref<string[]>([])
const searchTerm = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

const filteredEmployees = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()

  if (!query) {
    return employees.value
  }

  return employees.value.filter((employee) => {
    const nameMatch = employee.full_name.toLowerCase().includes(query)
    const emailMatch = (employee.email ?? '').toLowerCase().includes(query)
    const phoneMatch = (employee.phone ?? '').toLowerCase().includes(query)

    return nameMatch || emailMatch || phoneMatch
  })
})

const totalPages = computed(() => {
  const total = Math.ceil(filteredEmployees.value.length / pageSize.value)
  return total > 0 ? total : 1
})

const paginatedEmployees = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value

  return filteredEmployees.value.slice(start, end)
})

const pageStart = computed(() => {
  if (filteredEmployees.value.length === 0) {
    return 0
  }

  return (currentPage.value - 1) * pageSize.value + 1
})

const pageEnd = computed(() => {
  const end = currentPage.value * pageSize.value
  return end > filteredEmployees.value.length ? filteredEmployees.value.length : end
})

watch([searchTerm, pageSize], () => {
  currentPage.value = 1
})

watch(totalPages, (value) => {
  if (currentPage.value > value) {
    currentPage.value = value
  }
})

onMounted(async () => {
  await loadPermissions()
  await loadEmployees()
})

async function loadPermissions(): Promise<void> {
  try {
    const profile = await getProfile()
    canDeleteUsers.value = profile.role === 'admin'
    currentAdminProfileId.value = profile.id
  } catch {
    canDeleteUsers.value = false
    currentAdminProfileId.value = null
  }
}

async function loadEmployees(): Promise<void> {
  isLoading.value = true
  pageError.value = ''

  try {
    employees.value = await getEmployees()
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to load employees.'
  } finally {
    isLoading.value = false
  }
}

function openCreateForm(): void {
  selectedEmployee.value = null
  editingEmployeeId.value = null
  formInstanceKey.value += 1
  pageError.value = ''
  pageSuccess.value = ''
  isFormOpen.value = true
}

async function openEditForm(employee: EmployeeDTO): Promise<void> {
  pageError.value = ''
  pageSuccess.value = ''

  try {
    const loaded = await getEmployeeById(employee.id)

    if (!loaded) {
      pageError.value = 'Employee not found.'
      return
    }

    selectedEmployee.value = loaded
    editingEmployeeId.value = loaded.id
    formInstanceKey.value += 1
    isFormOpen.value = true
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to load employee.'
  }
}

function closeForm(): void {
  isFormOpen.value = false
  selectedEmployee.value = null
  editingEmployeeId.value = null
}

async function onSubmitForm(payload: EmployeeFormPayload | CreateEmployeeFormPayload): Promise<void> {
  isSubmitting.value = true
  pageError.value = ''
  pageSuccess.value = ''

  try {
    if (editingEmployeeId.value) {
      // Edit mode: update only the employees table
      const editPayload = payload as EmployeeFormPayload

      const updatePayload: UpdateEmployeeDTO = {
        full_name: editPayload.full_name,
        email: editPayload.email,
        phone: editPayload.phone,
        address: editPayload.address,
        abn: editPayload.abn,
        hourly_rate_weekday: editPayload.hourly_rate_weekday,
        hourly_rate_sunday: editPayload.hourly_rate_sunday,
        hourly_rate_holiday: editPayload.hourly_rate_holiday,
        active: editPayload.active,
      }

      await updateEmployee(editingEmployeeId.value, updatePayload)

      const previousRole = selectedEmployee.value?.role ?? 'worker'
      const nextRole = editPayload.role
      const userId = selectedEmployee.value?.profile_id

      if (nextRole !== previousRole) {
        if (!userId) {
          throw new Error('Cannot update role for this user because profile_id is missing.')
        }

        if (userId === currentAdminProfileId.value && nextRole !== 'admin') {
          throw new Error('You cannot remove your own admin role.')
        }

        await updateEmployeeUserRole(userId, nextRole)
      }

      pageSuccess.value = 'Employee updated successfully.'
    } else {
      // Create mode: call the secure API endpoint
      const createPayload = payload as CreateEmployeeFormPayload

      if (!('password' in createPayload) || !('role' in createPayload)) {
        throw new Error('Invalid payload for create mode.')
      }

      await createUser({
        email: createPayload.email,
        password: createPayload.password,
        full_name: createPayload.full_name,
        phone: createPayload.phone,
        address: createPayload.address,
        abn: createPayload.abn,
        hourly_rate_weekday: createPayload.hourly_rate_weekday,
        hourly_rate_sunday: createPayload.hourly_rate_sunday,
        hourly_rate_holiday: createPayload.hourly_rate_holiday,
        role: createPayload.role,
      })
      pageSuccess.value = 'Employee created successfully.'
    }

    closeForm()
    await loadEmployees()
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to save employee.'
  } finally {
    isSubmitting.value = false
  }
}

function onTableError(message: string): void {
  pageError.value = message
}

async function onToggleEmployeeActive(employee: EmployeeDTO): Promise<void> {
  const nextActive = !employee.active

  togglingActiveIds.value = [...togglingActiveIds.value, employee.id]
  pageError.value = ''

  try {
    await updateEmployee(employee.id, { active: nextActive })
    pageSuccess.value = nextActive ? 'Employee activated.' : 'Employee deactivated.'
    await loadEmployees()
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to update employee status.'
  } finally {
    togglingActiveIds.value = togglingActiveIds.value.filter((id) => id !== employee.id)
  }
}

async function onSignOut(): Promise<void> {
  await signOut()
  await navigateTo('/login')
}
</script>
