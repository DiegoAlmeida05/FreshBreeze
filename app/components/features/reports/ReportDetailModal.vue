<template>
  <Teleport to="body">
    <div
      v-if="modelValue && report"
      class="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-foreground/50 px-4 py-6 backdrop-blur-sm sm:items-center sm:py-8"
      @click.self="emit('update:modelValue', false)"
    >
      <div class="w-full max-w-3xl rounded-2xl border border-primary-100 bg-surface p-6 shadow-elevated">
        <div class="mb-4 flex items-center justify-between gap-3">
          <h3 class="text-lg font-semibold text-foreground">{{ isEditMode ? 'Edit report' : 'Report details' }}</h3>
          <button type="button" class="btn-outline !px-3 !py-1.5" @click="emit('update:modelValue', false)">Close</button>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Property</label>
            <p class="text-sm font-medium text-foreground">{{ report.property_name || 'Unknown property' }}</p>
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Client</label>
            <p class="text-sm font-medium text-foreground">{{ report.client_name || 'Unknown client' }}</p>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label for="report-date" class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Report date</label>
            <input
              id="report-date"
              v-model="form.reportDate"
              type="date"
              class="input-base"
              :disabled="!isEditMode || loading || !props.canEditReportDate"
            >
          </div>
          <div>
            <label for="report-status" class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Status</label>
            <select
              id="report-status"
              v-model="form.status"
              class="input-base"
              :disabled="!isEditMode || loading"
            >
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        <div class="mt-4">
          <label for="report-title" class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Title</label>
          <input
            id="report-title"
            v-model="form.title"
            type="text"
            class="input-base"
            placeholder="Report title"
            :disabled="!isEditMode || loading"
          >
        </div>

        <div class="mt-4">
          <label for="report-description" class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Description</label>
          <textarea
            id="report-description"
            v-model="form.descriptionPt"
            rows="4"
            class="input-base"
            placeholder="Report description"
            :disabled="!isEditMode || loading"
          />
        </div>

        <div class="mt-4 grid grid-cols-1 gap-2 rounded-xl border border-primary-100 bg-primary-50/40 p-3 text-xs text-muted sm:grid-cols-2 dark:border-white/10 dark:bg-white/5">
          <p><span class="font-medium text-foreground/80">Created by:</span> {{ displayUser(report.created_by_name) }}</p>
          <p><span class="font-medium text-foreground/80">Created at:</span> {{ formatDateTime(report.created_at) }}</p>
          <p><span class="font-medium text-foreground/80">Resolved by:</span> {{ report.status === 'resolved' ? displayUser(report.resolved_by_name) : '—' }}</p>
          <p><span class="font-medium text-foreground/80">Resolved at:</span> {{ report.status === 'resolved' ? formatDateTime(report.resolved_at || '') : '—' }}</p>
        </div>

        <div class="mt-4">
          <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Photos</p>

          <div v-if="isEditMode && canEdit && props.canManagePhotos" class="mb-3 space-y-2">
            <input
              id="report-detail-photos"
              type="file"
              multiple
              accept="image/png,image/jpeg,image/jpg,image/webp"
              class="input-base"
              :disabled="loading || currentPhotoUrls.length >= 5"
              @change="onPhotosChange"
            >
            <p class="text-[11px] text-muted">You can keep up to 5 photos per report.</p>
          </div>

          <div v-if="currentPhotoUrls.length === 0" class="rounded-lg border border-dashed border-primary-200/80 px-3 py-4 text-xs text-muted">
            No photos available for this report.
          </div>

          <div v-else class="flex flex-wrap gap-2">
            <div v-for="photo in existingPhotosDraft" :key="photo.id" class="relative">
              <button
                type="button"
                class="overflow-hidden rounded-md border border-primary-100 transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary-400"
                aria-label="View report photo"
                @click="openLightbox(photo.url)"
              >
                <img :src="photo.url" alt="Report photo" class="h-20 w-20 object-cover">
              </button>

              <button
                v-if="isEditMode && canEdit && props.canManagePhotos"
                type="button"
                class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[10px] font-bold text-white"
                aria-label="Remove existing photo"
                @click="removeExistingPhoto(photo.id)"
              >
                ×
              </button>
            </div>

            <div v-for="photo in pendingPhotos" :key="photo.id" class="relative">
              <button
                type="button"
                class="overflow-hidden rounded-md border border-primary-100 transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary-400"
                aria-label="View pending photo"
                @click="openLightbox(photo.previewUrl)"
              >
                <img :src="photo.previewUrl" alt="Pending report photo" class="h-20 w-20 object-cover">
              </button>

              <button
                v-if="isEditMode && canEdit && props.canManagePhotos"
                type="button"
                class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[10px] font-bold text-white"
                aria-label="Remove pending photo"
                @click="removePendingPhoto(photo.id)"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        <div class="mt-5 flex flex-wrap items-center justify-end gap-2">
          <button
            v-if="canEdit && !isEditMode"
            type="button"
            class="btn-outline !px-3 !py-2 text-xs"
            @click="isEditMode = true"
          >
            Edit
          </button>

          <button
            v-if="isEditMode"
            type="button"
            class="btn-outline !px-3 !py-2 text-xs"
            :disabled="loading"
            @click="cancelEdit"
          >
            Cancel
          </button>

          <button
            v-if="isEditMode"
            type="button"
            class="btn-primary !px-3 !py-2 text-xs"
            :disabled="loading || !isFormValid"
            @click="submit"
          >
            {{ loading ? 'Saving...' : 'Save changes' }}
          </button>
        </div>
      </div>
    </div>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="lightboxUrl"
        class="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4"
        @click="closeLightbox"
      >
        <button
          type="button"
          class="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Close photo viewer"
          @click="closeLightbox"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
        <img
          :src="lightboxUrl"
          alt="Photo"
          class="max-h-[90vh] max-w-full rounded-lg object-contain shadow-elevated"
          @click.stop
        >
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { PropertyReportAdminListItemDTO, PropertyReportStatus } from '../../../../shared/types/PropertyReportDTO'

interface EditablePhotoItem {
  id: string
  url: string
  source?: 'gallery' | 'legacy'
}

interface PendingPhotoItem {
  id: string
  file: File
  previewUrl: string
}

interface ReportDetailForm {
  reportDate: string
  title: string
  descriptionPt: string
  status: PropertyReportStatus
  addedPhotos?: File[]
  removedPhotoIds?: string[]
}

interface Props {
  modelValue: boolean
  report: PropertyReportAdminListItemDTO | null
  photoUrls: string[]
  editablePhotos?: EditablePhotoItem[]
  canEdit: boolean
  canEditReportDate?: boolean
  canManagePhotos?: boolean
  loading: boolean
}

interface Emits {
  'update:modelValue': [value: boolean]
  save: [payload: ReportDetailForm]
}

const props = withDefaults(defineProps<Props>(), {
  canEditReportDate: false,
  canManagePhotos: false,
  editablePhotos: () => [],
})
const emit = defineEmits<Emits>()

const form = reactive<ReportDetailForm>({
  reportDate: '',
  title: '',
  descriptionPt: '',
  status: 'open',
})

const isEditMode = ref(false)
const lightboxUrl = ref<string | null>(null)
const pendingPhotos = ref<PendingPhotoItem[]>([])
const existingPhotosDraft = ref<EditablePhotoItem[]>([])
const removedPhotoIds = ref<string[]>([])

const canEdit = computed(() => props.canEdit)

const isFormValid = computed(() => {
  return form.reportDate.trim().length > 0
    && form.title.trim().length > 0
    && form.descriptionPt.trim().length > 0
})

const currentPhotoUrls = computed(() => {
  const existing = existingPhotosDraft.value.map((photo) => photo.url)
  const pending = pendingPhotos.value.map((photo) => photo.previewUrl)

  if (existing.length > 0 || pending.length > 0) {
    return [...existing, ...pending]
  }

  return props.photoUrls
})

watch(
  () => props.report,
  (report) => {
    if (!report) {
      return
    }

    form.reportDate = report.report_date
    form.title = report.title
    form.descriptionPt = report.description_pt
    form.status = report.status
    existingPhotosDraft.value = props.editablePhotos.map((photo) => ({ ...photo }))
    clearPendingPhotos()
    removedPhotoIds.value = []
    isEditMode.value = false
  },
  { immediate: true },
)

watch(
  () => props.editablePhotos,
  (photos) => {
    if (!isEditMode.value) {
      existingPhotosDraft.value = photos.map((photo) => ({ ...photo }))
    }
  },
)

watch(
  () => props.modelValue,
  (open) => {
    if (!open) {
      lightboxUrl.value = null
      clearPendingPhotos()
      removedPhotoIds.value = []
      isEditMode.value = false
    }
  },
)

function cancelEdit(): void {
  if (!props.report) {
    return
  }

  form.reportDate = props.report.report_date
  form.title = props.report.title
  form.descriptionPt = props.report.description_pt
  form.status = props.report.status
  existingPhotosDraft.value = props.editablePhotos.map((photo) => ({ ...photo }))
  clearPendingPhotos()
  removedPhotoIds.value = []
  isEditMode.value = false
}

function submit(): void {
  emit('save', {
    reportDate: form.reportDate.trim(),
    title: form.title.trim(),
    descriptionPt: form.descriptionPt.trim(),
    status: form.status,
    addedPhotos: pendingPhotos.value.map((photo) => photo.file),
    removedPhotoIds: [...removedPhotoIds.value],
  })
}

function onPhotosChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''

  if (files.length === 0) {
    return
  }

  const remaining = Math.max(0, 5 - existingPhotosDraft.value.length - pendingPhotos.value.length)
  const accepted = files.slice(0, remaining)

  for (const file of accepted) {
    pendingPhotos.value.push({
      id: `${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    })
  }
}

function removePendingPhoto(photoId: string): void {
  const index = pendingPhotos.value.findIndex((photo) => photo.id === photoId)

  if (index === -1) {
    return
  }

  const [removed] = pendingPhotos.value.splice(index, 1)
  if (removed) {
    URL.revokeObjectURL(removed.previewUrl)
  }
}

function removeExistingPhoto(photoId: string): void {
  const index = existingPhotosDraft.value.findIndex((photo) => photo.id === photoId)

  if (index === -1) {
    return
  }

  existingPhotosDraft.value.splice(index, 1)
  removedPhotoIds.value.push(photoId)
}

function clearPendingPhotos(): void {
  for (const photo of pendingPhotos.value) {
    URL.revokeObjectURL(photo.previewUrl)
  }

  pendingPhotos.value = []
}

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

function openLightbox(url: string): void {
  lightboxUrl.value = url
}

function closeLightbox(): void {
  lightboxUrl.value = null
}
</script>
