<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[100] flex items-end justify-center bg-foreground/50 px-4 py-4 backdrop-blur-sm sm:items-center sm:py-8"
        @click.self="closeModal"
      >
        <section class="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-primary-100 bg-surface p-4 shadow-elevated transition duration-200 ease-out sm:p-5 dark:border-white/10">
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-base font-semibold text-foreground">{{ modalTitle }}</h3>
            <button type="button" class="btn-outline !px-2.5 !py-1 text-xs" :disabled="loading" @click="closeModal">Close</button>
          </div>

          <!-- Draft restored badge -->
          <div
            v-if="hasDraft && mode === 'create'"
            role="status"
            class="mt-3 flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50/70 px-3 py-1.5 text-xs text-primary-600 dark:border-white/10 dark:bg-white/5 dark:text-primary-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-3.5 w-3.5 shrink-0" aria-hidden="true">
              <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z" />
            </svg>
            Draft restored — unsaved changes from a previous session
          </div>

          <form class="mt-4 grid grid-cols-1 gap-3" novalidate @submit.prevent="onSubmit">
            <div>
              <label :for="`${idPrefix}-report-date`" class="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Date</label>
              <input
                :id="`${idPrefix}-report-date`"
                v-model="form.reportDate"
                type="date"
                class="input-base"
                required
              >
              <p v-if="errors.reportDate" class="mt-1 text-xs text-error-600">{{ errors.reportDate }}</p>
            </div>

            <div>
              <label :for="`${idPrefix}-report-title`" class="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Title</label>
              <input
                :id="`${idPrefix}-report-title`"
                v-model="form.title"
                type="text"
                class="input-base"
                maxlength="120"
                required
              >
              <p v-if="errors.title" class="mt-1 text-xs text-error-600">{{ errors.title }}</p>
            </div>

            <div>
              <label :for="`${idPrefix}-report-description`" class="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Description</label>
              <textarea
                :id="`${idPrefix}-report-description`"
                v-model="form.descriptionPt"
                class="input-base min-h-[90px] resize-y"
                required
              />
              <p v-if="errors.descriptionPt" class="mt-1 text-xs text-error-600">{{ errors.descriptionPt }}</p>
            </div>

            <div>
              <label :for="`${idPrefix}-report-photos`" class="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                Photos ({{ totalPhotos }}/5)
              </label>
              <input
                :id="`${idPrefix}-report-photos`"
                type="file"
                multiple
                accept="image/png,image/jpeg,image/jpg,image/webp"
                class="input-base"
                :disabled="totalPhotos >= 5 || loading"
                @change="onPhotosChange"
              >
              <p class="mt-1 text-[11px] text-muted">Select up to 5 photos. JPG, PNG or WEBP.</p>
              <p v-if="reportPhotosError" class="mt-1 text-xs font-medium text-error-600">{{ reportPhotosError }}</p>
            </div>

            <div v-if="existingPhotos.length > 0">
              <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Existing photos</p>
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="item in existingPhotos"
                  :key="item.id"
                  class="relative h-16 w-16 overflow-hidden rounded-md border border-primary-100"
                >
                  <img :src="item.url" :alt="`Existing photo ${item.id}`" class="h-full w-full object-cover" />
                  <button
                    v-if="allowExistingPhotoRemoval"
                    type="button"
                    class="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[10px] font-bold text-white transition hover:bg-black/80"
                    aria-label="Remove existing photo"
                    @click="emit('remove-existing-photo', item.id)"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>

            <div v-if="pendingReportPhotos.length > 0">
              <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">New photos</p>
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="item in pendingReportPhotos"
                  :key="item.id"
                  class="relative h-16 w-16 overflow-hidden rounded-md border border-primary-100"
                >
                  <img :src="item.previewUrl" :alt="`Photo ${item.id}`" class="h-full w-full object-cover" />
                  <button
                    type="button"
                    class="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[10px] font-bold text-white transition hover:bg-black/80"
                    aria-label="Remove photo"
                    @click="emit('remove-photo', item.id)"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>

            <div class="flex justify-end gap-2">
              <button
                type="button"
                class="btn-outline !px-3 !py-1.5 text-xs"
                :disabled="loading"
                @click="closeModal"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn-primary !px-3 !py-1.5 text-xs"
                :disabled="loading"
              >
                {{ loading ? 'Saving...' : submitLabelComputed }}
              </button>
            </div>
          </form>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useWorkerCache } from '../../../composables/useWorkerCache'

interface ReportFormValue {
  reportDate: string
  title: string
  descriptionPt: string
}

interface PendingReportPhotoItem {
  id: string
  previewUrl: string
}

interface ExistingReportPhotoItem {
  id: string
  url: string
}

interface FieldErrors {
  reportDate: string
  title: string
  descriptionPt: string
}

interface Props {
  modelValue: boolean
  mode?: 'create' | 'edit'
  loading?: boolean
  initialValue?: ReportFormValue | null
  reportPhotosError?: string
  pendingReportPhotos?: PendingReportPhotoItem[]
  existingPhotos?: ExistingReportPhotoItem[]
  allowExistingPhotoRemoval?: boolean
  submitLabel?: string
  /** When provided (create mode only), enables localStorage draft autosave keyed by this value. */
  draftKey?: string
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create',
  loading: false,
  initialValue: null,
  reportPhotosError: '',
  pendingReportPhotos: () => [],
  existingPhotos: () => [],
  allowExistingPhotoRemoval: false,
  submitLabel: '',
  draftKey: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [payload: ReportFormValue]
  'photos-change': [event: Event]
  'remove-photo': [photoId: string]
  'remove-existing-photo': [photoId: string]
}>()

const { readWorkerCacheNoTTL, writeWorkerCache } = useWorkerCache()
const hasDraft = ref(false)

const form = reactive<ReportFormValue>({
  reportDate: '',
  title: '',
  descriptionPt: '',
})

const errors = reactive<FieldErrors>({
  reportDate: '',
  title: '',
  descriptionPt: '',
})

const idPrefix = computed(() => (props.mode === 'edit' ? 'edit' : 'create'))
const modalTitle = computed(() => (props.mode === 'edit' ? 'Edit Report' : 'New Report'))
const submitLabelComputed = computed(() => props.submitLabel || (props.mode === 'edit' ? 'Save changes' : 'Save report'))
const totalPhotos = computed(() => props.pendingReportPhotos.length + props.existingPhotos.length)

function syncForm(): void {
  form.reportDate = props.initialValue?.reportDate ?? ''
  form.title = props.initialValue?.title ?? ''
  form.descriptionPt = props.initialValue?.descriptionPt ?? ''
  clearErrors()

  // Restore draft (create mode only) — overlays title/description if draft exists
  if (props.draftKey && props.mode === 'create') {
    const cached = readWorkerCacheNoTTL<ReportFormValue>(props.draftKey)
    if (cached && (cached.data.title.trim() || cached.data.descriptionPt.trim())) {
      form.title = cached.data.title
      form.descriptionPt = cached.data.descriptionPt
      if (cached.data.reportDate) {
        form.reportDate = cached.data.reportDate
      }
      hasDraft.value = true
    } else {
      hasDraft.value = false
    }
  } else {
    hasDraft.value = false
  }
}

function clearErrors(): void {
  errors.reportDate = ''
  errors.title = ''
  errors.descriptionPt = ''
}

function validateForm(): boolean {
  clearErrors()

  if (!form.reportDate.trim()) {
    errors.reportDate = 'Date is required.'
  }

  if (!form.title.trim()) {
    errors.title = 'Title is required.'
  }

  if (!form.descriptionPt.trim()) {
    errors.descriptionPt = 'Description is required.'
  }

  return !errors.reportDate && !errors.title && !errors.descriptionPt
}

function closeModal(): void {
  emit('update:modelValue', false)
}

function onSubmit(): void {
  if (!validateForm()) {
    return
  }

  emit('submit', {
    reportDate: form.reportDate.trim(),
    title: form.title.trim(),
    descriptionPt: form.descriptionPt.trim(),
  })
}

function onPhotosChange(event: Event): void {
  emit('photos-change', event)
}

watch(() => props.initialValue, syncForm, { immediate: true, deep: true })
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    syncForm()
  }
})

// Debounced draft autosave (create mode + draftKey only)
let draftSaveTimer: ReturnType<typeof setTimeout> | null = null

watch(
  () => ({ reportDate: form.reportDate, title: form.title, descriptionPt: form.descriptionPt }),
  (value) => {
    if (!props.draftKey || props.mode !== 'create') return
    if (draftSaveTimer) clearTimeout(draftSaveTimer)
    draftSaveTimer = setTimeout(() => {
      writeWorkerCache(props.draftKey!, value)
      draftSaveTimer = null
    }, 500)
  },
  { deep: true },
)
</script>
