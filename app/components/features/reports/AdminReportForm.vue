<template>
  <form class="space-y-5" novalidate @submit.prevent="onSubmit">

    <!-- Section: Report Details -->
    <section class="form-section space-y-4">
      <h3 class="form-section-title">Report Details</h3>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label for="admin-report-property" class="mb-1.5 block text-sm font-medium text-foreground">Property</label>
          <div class="relative">
            <input
              id="admin-report-property"
              v-model="propertySearchQuery"
              type="text"
              class="input-base"
              placeholder="Search property by name..."
              autocomplete="off"
              @focus="isPropertyPickerOpen = true"
              @input="onPropertySearchInput"
              @blur="onPropertySearchBlur"
            >

            <div
              v-if="isPropertyPickerOpen"
              class="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-primary-100 bg-surface p-1 shadow-lg dark:border-white/10"
            >
              <button
                v-for="property in filteredProperties"
                :key="property.id"
                type="button"
                class="block w-full rounded-md px-2 py-2 text-left text-sm text-foreground transition hover:bg-primary-50/70 dark:hover:bg-white/10"
                @mousedown.prevent="selectProperty(property)"
              >
                <p class="truncate font-medium">{{ property.name }}</p>
                <p v-if="property.address" class="truncate text-xs text-muted">{{ property.address }}</p>
              </button>

              <p v-if="filteredProperties.length === 0" class="px-2 py-2 text-xs text-muted">
                No properties found.
              </p>
            </div>
          </div>
          <p v-if="errors.propertyId" class="mt-1 text-xs text-error-600">{{ errors.propertyId }}</p>
        </div>

        <div>
          <label for="admin-report-client" class="mb-1.5 block text-sm font-medium text-foreground">Client</label>
          <input
            id="admin-report-client"
            :value="selectedClientName"
            type="text"
            class="input-base"
            placeholder="Select a property first"
            readonly
          >
        </div>

        <div>
          <label for="admin-report-title" class="mb-1.5 block text-sm font-medium text-foreground">Title</label>
          <input
            id="admin-report-title"
            v-model="form.title"
            type="text"
            class="input-base"
            maxlength="120"
            placeholder="Report title"
          >
          <p v-if="errors.title" class="mt-1 text-xs text-error-600">{{ errors.title }}</p>
        </div>

        <div>
          <label for="admin-report-status" class="mb-1.5 block text-sm font-medium text-foreground">Status</label>
          <select id="admin-report-status" v-model="form.status" class="input-base">
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>
    </section>

    <!-- Section: Description -->
    <section class="form-section space-y-4">
      <h3 class="form-section-title">Description</h3>
      <div>
        <label for="admin-report-description" class="mb-1.5 block text-sm font-medium text-foreground">Description</label>
        <textarea
          id="admin-report-description"
          v-model="form.descriptionPt"
          class="input-base min-h-[120px] resize-y"
          placeholder="Describe the issue or note"
        />
        <p v-if="errors.descriptionPt" class="mt-1 text-xs text-error-600">{{ errors.descriptionPt }}</p>
      </div>
    </section>

    <!-- Section: Photos -->
    <section class="form-section space-y-4">
      <h3 class="form-section-title">Photos ({{ pendingPhotos.length }}/5)</h3>
      <div>
        <input
          id="admin-report-photos"
          type="file"
          multiple
          accept="image/png,image/jpeg,image/jpg,image/webp"
          class="input-base"
          :disabled="isSubmitting || pendingPhotos.length >= 5"
          @change="onPhotosChange"
        >
        <p class="mt-1 text-xs text-muted">Select up to 5 photos. JPG, PNG or WEBP.</p>
        <p v-if="errors.photos" class="mt-1 text-xs text-error-600">{{ errors.photos }}</p>
      </div>

      <div v-if="pendingPhotos.length > 0">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Selected photos</p>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="photo in pendingPhotos"
            :key="photo.id"
            class="relative h-16 w-16 overflow-hidden rounded-md border border-primary-100"
          >
            <img :src="photo.previewUrl" :alt="`Photo ${photo.id}`" class="h-full w-full object-cover">
            <button
              type="button"
              class="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[10px] font-bold text-white transition hover:bg-black/80"
              aria-label="Remove photo"
              @click="removePhoto(photo.id)"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Actions -->
    <div class="action-bar">
      <button type="button" class="btn-outline min-w-[100px]" :disabled="isSubmitting" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="btn-primary min-w-[130px]" :disabled="isSubmitting || !form.propertyId">
        {{ isSubmitting ? 'Saving...' : 'Create report' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { assertAllowedImageType } from '../../../utils/optimizeImage'
import type { ClientDTO } from '../../../../shared/types/ClientDTO'
import type { PropertyDTO } from '../../../../shared/types/PropertyDTO'
import type { PropertyReportStatus } from '../../../../shared/types/PropertyReportDTO'

interface PendingPhotoItem {
  id: string
  file: File
  previewUrl: string
}

interface FieldErrors {
  propertyId: string
  title: string
  descriptionPt: string
  photos: string
}

export interface AdminReportFormPayload {
  propertyId: string
  clientId: string | null
  title: string
  descriptionPt: string
  status: PropertyReportStatus
  photos: File[]
}

interface Props {
  properties: PropertyDTO[]
  clients: ClientDTO[]
  isSubmitting?: boolean
}

interface Emits {
  submit: [payload: AdminReportFormPayload]
  cancel: []
}

const props = withDefaults(defineProps<Props>(), {
  isSubmitting: false,
})

const emit = defineEmits<Emits>()

const form = reactive({
  propertyId: '',
  title: '',
  descriptionPt: '',
  status: 'open' as PropertyReportStatus,
})

const propertySearchQuery = ref('')
const isPropertyPickerOpen = ref(false)
const pendingPhotos = reactive<PendingPhotoItem[]>([])

const errors = reactive<FieldErrors>({
  propertyId: '',
  title: '',
  descriptionPt: '',
  photos: '',
})

const selectedProperty = computed(() => {
  return props.properties.find((property) => property.id === form.propertyId) ?? null
})

const filteredProperties = computed(() => {
  const query = propertySearchQuery.value.trim().toLowerCase()

  if (!query) {
    return props.properties
  }

  return props.properties.filter((property) => property.name.toLowerCase().includes(query))
})

const selectedClientName = computed(() => {
  if (!selectedProperty.value) {
    return ''
  }

  return props.clients.find((client) => client.id === selectedProperty.value?.client_id)?.name ?? ''
})

const selectedClientId = computed(() => selectedProperty.value?.client_id ?? null)

function getSelectedProperty(propertyId: string): PropertyDTO | null {
  return props.properties.find((property) => property.id === propertyId) ?? null
}

function buildPendingPhotoItem(file: File): PendingPhotoItem {
  return {
    id: `${Date.now()}-${Math.random()}`,
    file,
    previewUrl: URL.createObjectURL(file),
  }
}

function clearErrors(): void {
  errors.propertyId = ''
  errors.title = ''
  errors.descriptionPt = ''
  errors.photos = ''
}

function validateForm(): boolean {
  clearErrors()

  if (!form.propertyId) {
    errors.propertyId = 'Property is required.'
  }

  if (!form.title.trim()) {
    errors.title = 'Title is required.'
  }

  if (!form.descriptionPt.trim()) {
    errors.descriptionPt = 'Description is required.'
  }

  return !errors.propertyId && !errors.title && !errors.descriptionPt && !errors.photos
}

function onPhotosChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''

  if (files.length === 0) {
    return
  }

  errors.photos = ''

  for (const file of files) {
    try {
      assertAllowedImageType(file)
    } catch (err) {
      errors.photos = err instanceof Error ? err.message : 'Invalid file type.'
      return
    }
  }

  const remaining = Math.max(0, 5 - pendingPhotos.length)
  const toAdd = files.slice(0, remaining)

  if (files.length > remaining) {
    errors.photos = remaining > 0
      ? `Maximum 5 photos. Only the first ${remaining} were added.`
      : 'Maximum 5 photos allowed.'
  }

  for (const file of toAdd) {
    pendingPhotos.push(buildPendingPhotoItem(file))
  }
}

function removePhoto(photoId: string): void {
  const index = pendingPhotos.findIndex((photo) => photo.id === photoId)

  if (index === -1) {
    return
  }

  const [removedPhoto] = pendingPhotos.splice(index, 1)

  if (removedPhoto) {
    URL.revokeObjectURL(removedPhoto.previewUrl)
  }
}

function onPropertySearchInput(): void {
  isPropertyPickerOpen.value = true
  const query = propertySearchQuery.value.trim().toLowerCase()

  if (!query) {
    form.propertyId = ''
    return
  }

  const exactMatch = props.properties.find((property) => property.name.toLowerCase() === query)
  form.propertyId = exactMatch?.id ?? ''
}

function onPropertySearchBlur(): void {
  setTimeout(() => {
    isPropertyPickerOpen.value = false

    if (!form.propertyId) {
      propertySearchQuery.value = ''
      return
    }

    const selected = getSelectedProperty(form.propertyId)
    propertySearchQuery.value = selected?.name ?? ''
  }, 120)
}

function selectProperty(property: PropertyDTO): void {
  form.propertyId = property.id
  propertySearchQuery.value = property.name
  isPropertyPickerOpen.value = false
  errors.propertyId = ''
}

function cleanupPendingPhotos(): void {
  for (const photo of pendingPhotos) {
    URL.revokeObjectURL(photo.previewUrl)
  }

  pendingPhotos.splice(0, pendingPhotos.length)
}

function onSubmit(): void {
  if (!validateForm()) {
    return
  }

  emit('submit', {
    propertyId: form.propertyId,
    clientId: selectedClientId.value,
    title: form.title.trim(),
    descriptionPt: form.descriptionPt.trim(),
    status: form.status,
    photos: pendingPhotos.map((photo) => photo.file),
  })
}

onBeforeUnmount(() => {
  cleanupPendingPhotos()
})
</script>