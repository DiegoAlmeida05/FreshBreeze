<template>
  <form novalidate class="space-y-5" @submit.prevent="onSubmit">
    <!-- Basic Info -->
    <div class="rounded-xl border border-primary-100 bg-surface p-4 dark:border-white/10">
      <h3 class="mb-3 text-sm font-semibold text-foreground">Basic info</h3>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">

      <!-- Date -->
      <div>
        <label for="task-date" class="mb-1.5 block text-sm font-medium text-foreground">Date</label>
        <input
          id="task-date"
          v-model="form.date"
          type="date"
          class="input-base"
        />
        <p v-if="errors.date" class="mt-1 text-xs text-error-600">{{ errors.date }}</p>
      </div>

      <!-- Property -->
      <div>
        <label for="task-property" class="mb-1.5 block text-sm font-medium text-foreground">Property</label>
        <div class="relative">
          <input
            id="task-property"
            v-model="propertySearchQuery"
            type="text"
            class="input-base"
            placeholder="Search property by name..."
            autocomplete="off"
            @focus="isPropertyPickerOpen = true"
            @input="onPropertySearchInput"
            @blur="onPropertySearchBlur"
          />

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
        <p v-if="errors.property_id" class="mt-1 text-xs text-error-600">{{ errors.property_id }}</p>
      </div>

      <!-- Task Type -->
      <div class="sm:col-span-2">
        <label class="flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input
            v-model="form.is_bsb"
            type="checkbox"
            class="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
          />
          <span class="font-medium">Flag as BSB</span>
        </label>
      </div>

      <div>
        <label for="task-guest-name" class="mb-1.5 block text-sm font-medium text-foreground">Guest name</label>
        <input
          id="task-guest-name"
          v-model="form.guest_name"
          type="text"
          class="input-base"
          placeholder="Optional"
          autocomplete="off"
        />
      </div>

      <div>
        <label for="task-guest-checkin-date" class="mb-1.5 block text-sm font-medium text-foreground">Guest check-in</label>
        <input
          id="task-guest-checkin-date"
          v-model="form.guest_checkin_date"
          type="date"
          class="input-base"
        />
      </div>

      <div class="sm:col-span-2">
        <label class="mb-1.5 block text-sm font-medium text-foreground">Visibility tags</label>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="presetTag in presetTags"
            :key="presetTag"
            class="inline-flex items-center gap-1 rounded-full border border-primary-100 bg-surface px-2 py-1 text-xs font-semibold text-muted dark:border-white/10"
          >
            <button
              type="button"
              class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary/15 text-[10px] leading-none text-primary-700 transition hover:bg-primary/30 disabled:cursor-not-allowed disabled:opacity-50 dark:text-primary-300"
              :aria-label="`Add preset tag ${presetTag}`"
              :disabled="isTagSelected(presetTag) || !canAddMoreTags"
              @click="addPresetTag(presetTag)"
            >
              +
            </button>
            <span>{{ presetTag }}</span>
            <button
              type="button"
              class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-error-500/15 text-[10px] leading-none text-error-600 transition hover:bg-error-500/30 dark:text-error-400"
              aria-label="Remove preset tag"
              @click="removePresetTag(presetTag)"
            >
              ×
            </button>
          </span>
        </div>

        <div class="mt-2 flex max-w-md gap-2">
          <input
            id="task-tag-draft"
            v-model="tagDraft"
            type="text"
            class="input-base"
            placeholder="Type tag name"
            autocomplete="off"
            :disabled="!canAddMoreTags"
            @keydown.enter.prevent="addOrCreateTag"
          />
          <button
            type="button"
            class="btn-outline !px-2.5 !py-2 text-xs whitespace-nowrap"
            :disabled="!canAddMoreTags"
            @click="addOrCreateTag"
          >
            Add tag
          </button>
        </div>

        <div v-if="form.tags.length > 0" class="mt-2 flex flex-wrap gap-2">
          <span
            v-for="tag in form.tags"
            :key="tag"
            class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary-700 dark:text-primary-300"
          >
            <span>{{ tag }}</span>
            <button
              type="button"
              class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-[10px] leading-none transition hover:bg-primary/35"
              aria-label="Remove tag"
              @click="removeTag(tag)"
            >
              ×
            </button>
          </span>
        </div>
      </div>
    </div>
    </div>

    <!-- Scheduling -->
    <div class="rounded-xl border border-primary-100 bg-surface p-4 dark:border-white/10">
      <h3 class="mb-3 text-sm font-semibold text-foreground">Scheduling</h3>
      <div class="max-w-xs">
        <label for="task-cleaning-minutes" class="mb-1.5 block text-xs font-medium text-muted">
          Cleaning time (minutes)
        </label>
        <input
          id="task-cleaning-minutes"
          v-model.number="form.cleaning_minutes_override"
          type="number"
          min="0"
          step="1"
          class="input-base text-sm"
          :placeholder="propertyDefaultMinutesHint"
        />
        <p v-if="selectedPropertyDefaultMinutes !== null" class="mt-1 text-[11px] text-muted">
          Property default: {{ selectedPropertyDefaultMinutes }} min — leave empty to keep it
        </p>
      </div>

      <div class="mt-4">
        <label for="task-notes" class="mb-1.5 block text-sm font-medium text-foreground">Notes</label>
        <textarea
          id="task-notes"
          v-model="form.notes"
          class="input-base min-h-[80px] resize-y"
          placeholder="Any special instructions..."
          rows="3"
        />
      </div>
    </div>

    <!-- Extras -->
    <div class="rounded-xl border border-primary-100 bg-primary-50/40 p-4 dark:border-white/10 dark:bg-white/5">
      <h3 class="mb-4 text-sm font-semibold text-foreground">Extras</h3>
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label for="task-extra-single" class="mb-1.5 block text-xs font-medium text-muted">Single beds</label>
          <input
            id="task-extra-single"
            v-model.number="form.extra_beds_single"
            type="number"
            min="0"
            step="1"
            class="input-base text-sm"
            placeholder="0"
          />
        </div>
        <div>
          <label for="task-extra-queen" class="mb-1.5 block text-xs font-medium text-muted">Queen beds</label>
          <input
            id="task-extra-queen"
            v-model.number="form.extra_beds_queen"
            type="number"
            min="0"
            step="1"
            class="input-base text-sm"
            placeholder="0"
          />
        </div>
        <div>
          <label for="task-extra-king" class="mb-1.5 block text-xs font-medium text-muted">King beds</label>
          <input
            id="task-extra-king"
            v-model.number="form.extra_beds_king"
            type="number"
            min="0"
            step="1"
            class="input-base text-sm"
            placeholder="0"
          />
        </div>
        <div>
          <label for="task-extra-towels" class="mb-1.5 block text-xs font-medium text-muted">Extra towels</label>
          <input
            id="task-extra-towels"
            v-model.number="form.extra_towels_qty"
            type="number"
            min="0"
            step="1"
            class="input-base text-sm"
            placeholder="Total qty"
          />
          <p class="mt-1 text-[11px] text-muted">{{ linenDefaultsHint }}</p>
        </div>
        <div>
          <label for="task-extra-chocolates" class="mb-1.5 block text-xs font-medium text-muted">Extra chocolates</label>
          <input
            id="task-extra-chocolates"
            v-model.number="form.extra_chocolates_qty"
            type="number"
            min="0"
            step="1"
            class="input-base text-sm"
            placeholder="Additional qty"
          />
        </div>
      </div>
    </div>

    <!-- Form Actions -->
    <div class="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
      <button
        type="button"
        class="btn-outline"
        :disabled="isSubmitting"
        @click="emit('cancel')"
      >
        Cancel
      </button>
      <button type="submit" class="btn-primary" :disabled="isSubmitting || isDuplicateChecking">
        {{ isDuplicateChecking ? 'Checking...' : isSubmitting ? 'Saving...' : submitLabel }}
      </button>
    </div>

  </form>
</template>

<script setup lang="ts">
import { useState } from '#imports'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { DailyTaskDTO, TaskType } from '../../../../shared/types/DailyTaskDTO'
import type { PropertyDTO } from '../../../../shared/types/PropertyDTO'
import { useDailyTasks } from '../../../composables/useDailyTasks'
import { useProperties } from '../../../composables/useProperties'

export interface DailyTaskFormPayload {
  date: string
  property_id: string
  guest_name: string | null
  guest_checkin_date: string | null
  tags: string[]
  task_type: TaskType
  cleaning_minutes_override: number | null
  people_count: number
  notes: string | null
  extra_beds_single: number
  extra_beds_queen: number
  extra_beds_king: number
  extra_towels_qty: number
  extra_chocolates_qty: number
}

interface FormState {
  date: string
  property_id: string
  guest_name: string
  guest_checkin_date: string
  tags: string[]
  is_bsb: boolean
  cleaning_minutes_override: number | null
  people_count: number
  notes: string
  extra_beds_single: number
  extra_beds_queen: number
  extra_beds_king: number
  extra_towels_qty: number
  extra_chocolates_qty: number
}

interface FieldErrors {
  date: string
  property_id: string
}

interface Props {
  mode: 'create' | 'edit'
  task?: DailyTaskDTO | null
  isSubmitting?: boolean
  submitLabel?: string
  initialDate?: string
}

const props = withDefaults(defineProps<Props>(), {
  task: null,
  isSubmitting: false,
  submitLabel: 'Save',
  initialDate: '',
})

const emit = defineEmits<{
  submit: [payload: DailyTaskFormPayload]
  cancel: []
}>()

const { checkDuplicateTask } = useDailyTasks()
const { fetchProperties } = useProperties()

const isDuplicateChecking = ref(false)
const properties = ref<PropertyDTO[]>([])
const propertySearchQuery = ref('')
const isPropertyPickerOpen = ref(false)
const tagDraft = ref('')
const MAX_TAGS = 8
const MAX_PRESET_TAGS = 8
const PRESET_TAGS_STORAGE_KEY = 'daily-task-preset-tags'
const DEFAULT_PRESET_TAGS = ['one stay', 'deep clean', 'checkin', 'make sofa']
const presetTags = useState<string[]>('daily-task-preset-tags-state', () => [...DEFAULT_PRESET_TAGS])

const canAddMoreTags = computed(() => form.tags.length < MAX_TAGS)
const canCreateMorePresetTags = computed(() => presetTags.value.length < MAX_PRESET_TAGS)

const selectedPropertyDefaultMinutes = computed<number | null>(() => {
  const p = getSelectedProperty(form.property_id)
  return p?.default_cleaning_minutes ?? null
})

const propertyDefaultMinutesHint = computed(() => {
  const mins = selectedPropertyDefaultMinutes.value
  return mins !== null ? `Default: ${mins} min` : 'Leave empty to use property default'
})

const selectedPropertyDefaultExtraTowels = computed<number>(() => {
  const selectedProperty = getSelectedProperty(form.property_id)
  return selectedProperty?.extra_towels_default_qty ?? 0
})

const selectedPropertyDefaultExtraDishcloths = computed<number>(() => {
  const selectedProperty = getSelectedProperty(form.property_id)
  return selectedProperty?.extra_dishcloths_default_qty ?? 0
})

const linenDefaultsHint = computed(() => {
  if (!form.property_id) {
    return 'Select a property to auto-fill default towels.'
  }

  const towels = selectedPropertyDefaultExtraTowels.value
  const dishcloths = selectedPropertyDefaultExtraDishcloths.value
  const parts: string[] = []

  if (towels > 0) {
    parts.push(`Tw ${towels}`)
  }

  if (dishcloths > 0) {
    parts.push(`Dc ${dishcloths}`)
  }

  if (parts.length > 0) {
    return `Property defaults: ${parts.join(' • ')}.`
  }

  return 'This property has no default towels or dishcloths.'
})

const filteredProperties = computed(() => {
  const query = propertySearchQuery.value.trim().toLowerCase()

  if (!query) {
    return properties.value
  }

  return properties.value.filter((property) => {
    return property.name.toLowerCase().includes(query)
  })
})

function getSelectedProperty(propertyId: string): PropertyDTO | null {
  return properties.value.find((property) => property.id === propertyId) ?? null
}

function todayIsoDate(): string {
  return new Date().toISOString().split('T')[0] ?? ''
}

const form = reactive<FormState>({
  date: props.initialDate || todayIsoDate(),
  property_id: '',
  guest_name: '',
  guest_checkin_date: '',
  tags: [],
  is_bsb: false,
  cleaning_minutes_override: null,
  people_count: 1,
  notes: '',
  extra_beds_single: 0,
  extra_beds_queen: 0,
  extra_beds_king: 0,
  extra_towels_qty: 0,
  extra_chocolates_qty: 0,
})

const errors = reactive<FieldErrors>({
  date: '',
  property_id: '',
})

function syncForm(): void {
  if (props.mode === 'edit' && props.task) {
    form.date = props.task.date
    form.property_id = props.task.property_id
    form.guest_name = props.task.guest_name ?? ''
    form.guest_checkin_date = props.task.guest_checkin_date ?? ''
    form.tags = props.task.tags ?? []
    form.is_bsb = props.task.task_type === 'BSB'
    form.cleaning_minutes_override = props.task.cleaning_minutes_override
    form.people_count = props.task.people_count
    form.notes = props.task.notes ?? ''
    form.extra_beds_single = props.task.extra_beds_single
    form.extra_beds_queen = props.task.extra_beds_queen
    form.extra_beds_king = props.task.extra_beds_king
    form.extra_towels_qty = props.task.extra_towels_qty
    form.extra_chocolates_qty = props.task.extra_chocolates_qty
  } else {
    form.date = props.initialDate || todayIsoDate()
    form.property_id = ''
    form.guest_name = ''
    form.guest_checkin_date = ''
    form.tags = []
    form.is_bsb = false
    form.cleaning_minutes_override = null
    form.people_count = 1
    form.notes = ''
    form.extra_beds_single = 0
    form.extra_beds_queen = 0
    form.extra_beds_king = 0
    form.extra_towels_qty = 0
    form.extra_chocolates_qty = 0
  }

  propertySearchQuery.value = getSelectedProperty(form.property_id)?.name ?? ''
  tagDraft.value = ''
}

function clearErrors(): void {
  errors.date = ''
  errors.property_id = ''
}

function validateForm(): boolean {
  clearErrors()
  let valid = true

  if (!form.date) {
    errors.date = 'Date is required.'
    valid = false
  }

  if (!form.property_id) {
    errors.property_id = 'Please select a property.'
    valid = false
  }

  return valid
}

async function onSubmit(): Promise<void> {
  if (!validateForm()) return

  // Check for duplicate (property + date) before submitting.
  // In edit mode, exclude the current task from the check.
  isDuplicateChecking.value = true
  try {
    const isDuplicate = await checkDuplicateTask(
      form.property_id,
      form.date,
      props.mode === 'edit' && props.task ? props.task.id : undefined,
    )

    if (isDuplicate) {
      errors.property_id = 'This property already has a task on this date.'
      return
    }
  } catch {
    errors.property_id = 'Could not verify availability. Please try again.'
    return
  } finally {
    isDuplicateChecking.value = false
  }

  const payload: DailyTaskFormPayload = {
    date: form.date,
    property_id: form.property_id,
    guest_name: form.guest_name.trim() || null,
    guest_checkin_date: form.guest_checkin_date || null,
    tags: [...form.tags],
    task_type: form.is_bsb ? 'BSB' : 'NORMAL',
    window_start_time: null,
    window_end_time: null,
    desired_start_time: null,
    cleaning_minutes_override: form.cleaning_minutes_override ?? null,
    people_count: form.people_count,
    notes: form.notes || null,
    extra_beds_single: form.extra_beds_single,
    extra_beds_queen: form.extra_beds_queen,
    extra_beds_king: form.extra_beds_king,
    extra_towels_qty: form.extra_towels_qty,
    extra_chocolates_qty: form.extra_chocolates_qty,
  }

  emit('submit', payload)
}

function onPropertySearchInput(): void {
  isPropertyPickerOpen.value = true
  const query = propertySearchQuery.value.trim().toLowerCase()

  if (!query) {
    form.property_id = ''
    return
  }

  const exactMatch = properties.value.find((property) => property.name.toLowerCase() === query)
  form.property_id = exactMatch?.id ?? ''
}

function onPropertySearchBlur(): void {
  setTimeout(() => {
    isPropertyPickerOpen.value = false

    if (!form.property_id) {
      propertySearchQuery.value = ''
      return
    }

    const selectedProperty = getSelectedProperty(form.property_id)
    propertySearchQuery.value = selectedProperty?.name ?? ''
  }, 120)
}

function selectProperty(property: PropertyDTO): void {
  form.property_id = property.id
  propertySearchQuery.value = property.name
  isPropertyPickerOpen.value = false
  errors.property_id = ''
}

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, ' ')
}

function normalizeTagList(tags: string[]): string[] {
  const normalized = tags.map((tag) => normalizeTag(tag)).filter((tag) => tag.length > 0)
  return Array.from(new Set(normalized))
}

function isTagSelected(tag: string): boolean {
  return form.tags.includes(normalizeTag(tag))
}

function addPresetTag(tag: string): void {
  const normalizedTag = normalizeTag(tag)
  if (!normalizedTag || form.tags.includes(normalizedTag) || !canAddMoreTags.value) {
    return
  }

  form.tags = [...form.tags, normalizedTag]
}

function removePresetTag(tag: string): void {
  const normalizedTag = normalizeTag(tag)
  presetTags.value = presetTags.value.filter((presetTag) => presetTag !== normalizedTag)
}

function addOrCreateTag(): void {
  const normalizedTag = normalizeTag(tagDraft.value)
  if (!normalizedTag || !canAddMoreTags.value) {
    return
  }

  const presetExists = presetTags.value.includes(normalizedTag)

  if (!presetExists) {
    if (!canCreateMorePresetTags.value) {
      return
    }

    presetTags.value = normalizeTagList([...presetTags.value, normalizedTag])
  }

  if (!form.tags.includes(normalizedTag)) {
    form.tags = [...form.tags, normalizedTag]
  }

  tagDraft.value = ''
}

function removeTag(tag: string): void {
  form.tags = form.tags.filter((existingTag) => existingTag !== tag)
}

watch(() => props.task, syncForm, { immediate: true })

watch(() => form.property_id, (propertyId, previousPropertyId) => {
  if (props.mode !== 'create' || !propertyId || propertyId === previousPropertyId) {
    return
  }

  const selectedProperty = getSelectedProperty(propertyId)
  form.extra_towels_qty = selectedProperty?.extra_towels_default_qty ?? 0
  form.tags = normalizeTagList(selectedProperty?.default_tags ?? [])
})

watch(presetTags, (tags) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(PRESET_TAGS_STORAGE_KEY, JSON.stringify(normalizeTagList(tags)))
}, { deep: true })

onMounted(async () => {
  if (typeof window !== 'undefined') {
    const storedPresets = window.localStorage.getItem(PRESET_TAGS_STORAGE_KEY)
    if (storedPresets) {
      try {
        const parsed = JSON.parse(storedPresets)
        if (Array.isArray(parsed)) {
          presetTags.value = normalizeTagList(parsed.filter((tag): tag is string => typeof tag === 'string'))
        }
      } catch {
        presetTags.value = [...DEFAULT_PRESET_TAGS]
      }
    } else {
      presetTags.value = normalizeTagList(DEFAULT_PRESET_TAGS)
    }
  }

  try {
    const loaded = await fetchProperties()
    properties.value = loaded.filter((p) => p.active)
    propertySearchQuery.value = getSelectedProperty(form.property_id)?.name ?? ''
  } catch {
    // Non-critical: admin will see empty list and can still type
  }
})
</script>
