<template>
  <NuxtLayout name="admin-layout" @signout="onSignOut">
    <section class="space-y-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-primary-600">Management</p>
          <h2 class="mt-1 text-2xl font-semibold text-foreground">Reports Management</h2>
        </div>

        <button
          v-if="isAdmin"
          type="button"
          class="btn-primary"
          @click="openCreateReportModal"
        >
          Add Report
        </button>
      </div>

      <div class="toolbar-surface grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div>
          <label for="report-status" class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Status</label>
          <select id="report-status" v-model="filters.status" class="input-base">
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div>
          <label for="report-property" class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Property</label>
          <select id="report-property" v-model="filters.propertyId" class="input-base">
            <option value="">All properties</option>
            <option
              v-for="property in propertyOptions"
              :key="property.id"
              :value="property.id"
            >
              {{ property.name }}
            </option>
          </select>
        </div>

        <div>
          <label for="report-client" class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Client</label>
          <select id="report-client" v-model="filters.clientId" class="input-base">
            <option value="">All clients</option>
            <option
              v-for="client in clientOptions"
              :key="client.id"
              :value="client.id"
            >
              {{ client.name }}
            </option>
          </select>
        </div>

        <div>
          <label for="report-date-from" class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">From</label>
          <input id="report-date-from" v-model="filters.dateFrom" type="date" class="input-base">
        </div>

        <div>
          <label for="report-date-to" class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">To</label>
          <input id="report-date-to" v-model="filters.dateTo" type="date" class="input-base">
        </div>

        <div>
          <label for="report-search" class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Search</label>
          <input
            id="report-search"
            v-model="filters.search"
            type="text"
            class="input-base"
            placeholder="Title, description, property, client"
          >
        </div>

        <div class="flex items-end gap-2 lg:col-span-6">
          <button type="button" class="btn-outline !px-3 !py-2 text-xs" :disabled="isLoading" @click="clearFilters">
            Clear filters
          </button>
        </div>
      </div>

      <BaseFeedbackBanner
        v-if="pageError"
        tone="error"
        title="Reports action failed"
        :message="pageError"
        dismissible
        @dismiss="pageError = ''"
      />

      <BaseFeedbackBanner
        v-if="pageSuccess"
        tone="success"
        title="Success"
        :message="pageSuccess"
        dismissible
        @dismiss="pageSuccess = ''"
      />

      <ReportList
        :reports="reports"
        :photos-by-report-id="reportPhotosByReportId"
        :status-updating-ids="statusUpdatingReportIds"
        :deleting-ids="deletingReportIds"
        :can-manage-status="isAdmin"
        :can-edit="isAdmin"
        :can-delete="isAdmin"
        :is-loading="isLoading"
        @view="openReportView"
        @toggle-status="onToggleStatus"
        @delete="promptDelete"
      />

      <ReportDetailModal
        v-model="isReportModalOpen"
        :report="selectedReport"
        :photo-urls="selectedReport ? (reportPhotosByReportId[selectedReport.id] || []) : []"
        :can-edit="isAdmin"
        :loading="reportSaveLoading"
        @save="onSaveReport"
      />

      <Teleport to="body">
        <div
          v-if="isCreateReportModalOpen"
          class="modal-backdrop"
          @click.self="closeCreateReportModal"
        >
          <div class="modal-surface w-full max-w-2xl max-h-[calc(100vh-3rem)] overflow-y-auto">
            <div class="modal-header">
              <div>
                <h3 class="text-base font-semibold text-foreground">New report</h3>
                <p class="mt-0.5 text-xs text-muted">Create a property report directly from the admin reports screen.</p>
              </div>
              <button type="button" class="btn-outline !px-3 !py-1.5 text-xs" :disabled="isCreatingReport" @click="closeCreateReportModal">Close</button>
            </div>

            <div class="modal-body">
              <AdminReportForm
                :properties="propertyOptions"
                :clients="clientOptions"
                :is-submitting="isCreatingReport"
                @submit="onCreateReport"
                @cancel="closeCreateReportModal"
              />
            </div>
          </div>
        </div>
      </Teleport>
    </section>

    <BaseConfirmModal
      :model-value="reportPendingDelete !== null"
      title="Delete report"
      message="This action permanently removes the selected report."
      confirm-label="Delete"
      cancel-label="Cancel"
      danger
      :loading="reportPendingDelete !== null && deletingReportIds.has(reportPendingDelete.id)"
      @cancel="closeDeleteModal"
      @confirm="confirmDelete"
      @update:model-value="(value) => { if (!value) closeDeleteModal() }"
    />

    <BaseConfirmModal
      :model-value="reportPendingStatusChange !== null"
      :title="reportPendingStatusChange?.targetStatus === 'resolved' ? 'Mark as resolved' : 'Reopen report'"
      :message="reportPendingStatusChange?.targetStatus === 'resolved' ? 'Are you sure you want to mark this report as resolved?' : 'Are you sure you want to reopen this report?'"
      :confirm-label="reportPendingStatusChange?.targetStatus === 'resolved' ? 'Mark as resolved' : 'Reopen'"
      cancel-label="Cancel"
      :loading="reportPendingStatusChange !== null && statusUpdatingReportIds.has(reportPendingStatusChange.report.id)"
      @cancel="closeStatusChangeModal"
      @confirm="confirmStatusChange"
      @update:model-value="(value) => { if (!value) closeStatusChangeModal() }"
    />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref, watch, watchEffect } from 'vue'
import AdminReportForm, { type AdminReportFormPayload } from '../../components/features/reports/AdminReportForm.vue'
import ReportDetailModal from '../../components/features/reports/ReportDetailModal.vue'
import ReportList from '../../components/features/reports/ReportList.vue'
import BaseConfirmModal from '../../components/ui/BaseConfirmModal.vue'
import BaseFeedbackBanner from '../../components/ui/BaseFeedbackBanner.vue'
import { useAuth } from '../../composables/useAuth'
import { useClients } from '../../composables/useClients'
import { useProperties } from '../../composables/useProperties'
import { usePropertyReportPhotos } from '../../composables/usePropertyReportPhotos'
import { usePropertyReports } from '../../composables/usePropertyReports'
import { useUploadReportPhoto } from '../../composables/useUploadReportPhoto'
import type { ClientDTO } from '../../../shared/types/ClientDTO'
import type { PropertyDTO } from '../../../shared/types/PropertyDTO'
import type { PropertyReportAdminListItemDTO, PropertyReportStatus } from '../../../shared/types/PropertyReportDTO'

definePageMeta({
  name: 'admin-reports',
})

interface ReportFiltersState {
  status: PropertyReportStatus | 'all'
  propertyId: string
  clientId: string
  dateFrom: string
  dateTo: string
  search: string
}

const { signOut, getProfile } = useAuth()
const { fetchProperties } = useProperties()
const { fetchClients } = useClients()
const { getReports, createReport, updateReportStatus, updateReport, deleteReport } = usePropertyReports()
const { getPhotosByReportIds, createPhotos } = usePropertyReportPhotos()
const { uploadReportPhotos } = useUploadReportPhoto()

const isAdmin = ref(false)
const isLoading = ref(false)
const pageError = ref('')
const pageSuccess = ref('')
const reports = ref<PropertyReportAdminListItemDTO[]>([])
const propertyOptions = ref<PropertyDTO[]>([])
const clientOptions = ref<ClientDTO[]>([])
const reportPhotosByReportId = ref<Record<string, string[]>>({})
const selectedReport = ref<PropertyReportAdminListItemDTO | null>(null)
const isReportModalOpen = ref(false)
const isCreateReportModalOpen = ref(false)
const reportPendingDelete = ref<PropertyReportAdminListItemDTO | null>(null)
const reportPendingStatusChange = ref<{ report: PropertyReportAdminListItemDTO; targetStatus: PropertyReportStatus } | null>(null)
const statusUpdatingReportIds = ref<Set<string>>(new Set())
const deletingReportIds = ref<Set<string>>(new Set())
const reportSaveLoading = ref(false)
const isCreatingReport = ref(false)
const pageErrorTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const pageSuccessTimer = ref<ReturnType<typeof setTimeout> | null>(null)

watch(pageError, (message) => {
  if (pageErrorTimer.value) {
    clearTimeout(pageErrorTimer.value)
    pageErrorTimer.value = null
  }

  if (!message) {
    return
  }

  pageErrorTimer.value = setTimeout(() => {
    pageError.value = ''
    pageErrorTimer.value = null
  }, 4000)
})

watch(pageSuccess, (message) => {
  if (pageSuccessTimer.value) {
    clearTimeout(pageSuccessTimer.value)
    pageSuccessTimer.value = null
  }

  if (!message) {
    return
  }

  pageSuccessTimer.value = setTimeout(() => {
    pageSuccess.value = ''
    pageSuccessTimer.value = null
  }, 4000)
})

onBeforeUnmount(() => {
  if (pageErrorTimer.value) {
    clearTimeout(pageErrorTimer.value)
  }
  if (pageSuccessTimer.value) {
    clearTimeout(pageSuccessTimer.value)
  }
})

const filters = reactive<ReportFiltersState>({
  status: 'all',
  propertyId: '',
  clientId: '',
  dateFrom: '',
  dateTo: '',
  search: '',
})

let filterWatcherInitialized = false

onMounted(async () => {
  await Promise.all([
    loadCurrentProfile(),
    loadFilterOptions(),
  ])

  await loadReports()

  // Inicia watcher automático após primeira carga
  filterWatcherInitialized = true
  watchEffect(() => {
    if (filterWatcherInitialized) {
      void loadReports()
    }
    // watchEffect automaticamente monitora 'filters' quando acessado aqui
    filters.status
    filters.propertyId
    filters.clientId
    filters.dateFrom
    filters.dateTo
    filters.search
  })
})

async function loadCurrentProfile(): Promise<void> {
  const profile = await getProfile()
  isAdmin.value = profile.role === 'admin'
}

async function loadFilterOptions(): Promise<void> {
  try {
    const [properties, clients] = await Promise.all([
      fetchProperties(),
      fetchClients(),
    ])

    propertyOptions.value = [...properties].sort((a, b) => a.name.localeCompare(b.name))
    clientOptions.value = [...clients].sort((a, b) => a.name.localeCompare(b.name))
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to load report filters.'
  }
}

async function loadReports(): Promise<void> {
  isLoading.value = true
  pageError.value = ''

  try {
    const reportRows = await getReports({
      status: filters.status,
      property_id: filters.propertyId || undefined,
      client_id: filters.clientId || undefined,
      date_from: filters.dateFrom || undefined,
      date_to: filters.dateTo || undefined,
      search: filters.search || undefined,
    })

    reports.value = reportRows

    if (reportRows.length === 0) {
      reportPhotosByReportId.value = {}
      return
    }

    const photoMap = await getPhotosByReportIds(reportRows.map((report) => report.id))
    const mappedUrls: Record<string, string[]> = {}

    for (const [reportId, photos] of Object.entries(photoMap)) {
      mappedUrls[reportId] = photos.map((photo) => photo.photo_url)
    }

    reportPhotosByReportId.value = mappedUrls
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to load reports.'
  } finally {
    isLoading.value = false
  }
}

function clearFilters(): void {
  filters.status = 'all'
  filters.propertyId = ''
  filters.clientId = ''
  filters.dateFrom = ''
  filters.dateTo = ''
  filters.search = ''
  void loadReports()
}

function openCreateReportModal(): void {
  pageError.value = ''
  pageSuccess.value = ''
  isCreateReportModalOpen.value = true
}

function closeCreateReportModal(): void {
  if (isCreatingReport.value) {
    return
  }

  isCreateReportModalOpen.value = false
}

function openReportView(report: PropertyReportAdminListItemDTO): void {
  selectedReport.value = report
  isReportModalOpen.value = true
}

function promptDelete(report: PropertyReportAdminListItemDTO): void {
  reportPendingDelete.value = report
}

function closeDeleteModal(): void {
  reportPendingDelete.value = null
}

async function onToggleStatus(report: PropertyReportAdminListItemDTO): Promise<void> {
  if (!isAdmin.value) {
    return
  }

  pageError.value = ''
  pageSuccess.value = ''
  const targetStatus: PropertyReportStatus = report.status === 'resolved' ? 'open' : 'resolved'
  reportPendingStatusChange.value = { report, targetStatus }
}

function closeStatusChangeModal(): void {
  reportPendingStatusChange.value = null
}

async function confirmStatusChange(): Promise<void> {
  if (!reportPendingStatusChange.value) return

  const { report, targetStatus } = reportPendingStatusChange.value
  const nextIds = new Set(statusUpdatingReportIds.value)
  nextIds.add(report.id)
  statusUpdatingReportIds.value = nextIds
  pageError.value = ''
  pageSuccess.value = ''

  try {
    await updateReportStatus(report.id, targetStatus)
    pageSuccess.value = targetStatus === 'resolved' ? 'Report marked as resolved.' : 'Report reopened successfully.'
    closeStatusChangeModal()
    await loadReports()

    if (selectedReport.value?.id === report.id) {
      selectedReport.value = reports.value.find((item) => item.id === report.id) ?? null
    }
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to update report status.'
  } finally {
    const remaining = new Set(statusUpdatingReportIds.value)
    remaining.delete(report.id)
    statusUpdatingReportIds.value = remaining
  }
}

async function confirmDelete(): Promise<void> {
  if (!reportPendingDelete.value) {
    return
  }

  const reportId = reportPendingDelete.value.id
  const nextIds = new Set(deletingReportIds.value)
  nextIds.add(reportId)
  deletingReportIds.value = nextIds
  pageError.value = ''

  try {
    await deleteReport(reportId)
    pageSuccess.value = 'Report deleted successfully.'
    closeDeleteModal()
    await loadReports()
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to delete report.'
  } finally {
    const remainingIds = new Set(deletingReportIds.value)
    remainingIds.delete(reportId)
    deletingReportIds.value = remainingIds
  }
}

async function onSaveReport(payload: { reportDate: string, title: string, descriptionPt: string, status: PropertyReportStatus }): Promise<void> {
  if (!selectedReport.value || !isAdmin.value) {
    return
  }

  reportSaveLoading.value = true
  pageError.value = ''

  try {
    await updateReport(selectedReport.value.id, {
      report_date: payload.reportDate,
      title: payload.title,
      description_pt: payload.descriptionPt,
    })

    if (selectedReport.value.status !== payload.status) {
      await updateReportStatus(selectedReport.value.id, payload.status)
    }

    pageSuccess.value = 'Report updated successfully.'
    await loadReports()

    const refreshed = reports.value.find((item) => item.id === selectedReport.value?.id) ?? null
    selectedReport.value = refreshed

    if (!refreshed) {
      isReportModalOpen.value = false
    }
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to update report.'
  } finally {
    reportSaveLoading.value = false
  }
}

async function onCreateReport(payload: AdminReportFormPayload): Promise<void> {
  if (!isAdmin.value) {
    return
  }

  isCreatingReport.value = true
  pageError.value = ''
  pageSuccess.value = ''
  let shouldCloseModal = false

  try {
    const newReport = await createReport({
      property_id: payload.propertyId,
      daily_task_id: null,
      report_date: new Date().toISOString().slice(0, 10),
      title: payload.title,
      description_pt: payload.descriptionPt,
    })

    if (payload.photos.length > 0) {
      const uploadedUrls = await uploadReportPhotos(payload.photos)
      await createPhotos(newReport.id, uploadedUrls)
    }

    if (payload.status === 'resolved') {
      await updateReportStatus(newReport.id, 'resolved')
    }

    await loadReports()
    pageSuccess.value = 'Report created successfully.'
    shouldCloseModal = true
  } catch (err: unknown) {
    pageError.value = err instanceof Error ? err.message : 'Failed to create report.'
  } finally {
    isCreatingReport.value = false
  }

  if (shouldCloseModal) {
    closeCreateReportModal()
  }
}

async function onSignOut(): Promise<void> {
  await signOut()
  await navigateTo('/login')
}
</script>
