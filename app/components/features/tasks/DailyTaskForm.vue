<template>
  <form novalidate class="space-y-5" @submit.prevent="onSubmit">
    <div class="rounded-xl border border-primary-100 bg-surface p-4 dark:border-white/10">
      <h3 class="mb-3 text-sm font-semibold text-foreground">Basic info</h3>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label for="task-date" class="mb-1.5 block text-sm font-medium text-foreground">Date</label>
          <input id="task-date" v-model="form.date" type="date" class="input-base" />
          <p v-if="errors.date" class="mt-1 text-xs text-error-600">{{ errors.date }}</p>
        </div>

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
          <input id="task-guest-checkin-date" v-model="form.guest_checkin_date" type="date" class="input-base" />
        </div>

        <div class="sm:col-span-2">
          <label class="mb-1.5 block text-sm font-medium text-foreground">Visibility tags</label>

          <div class="flex flex-wrap gap-2">
            <button
              v-for="presetTag in presetTags"
              :key="presetTag"
              type="button"
              class="inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold transition"
              :class="isTagSelected(presetTag)
                ? 'border-primary-200 bg-primary/10 text-primary-700 dark:border-white/15 dark:text-primary-300'
                : 'border-primary-100 bg-surface text-muted hover:bg-primary-50/70 dark:border-white/10 dark:hover:bg-white/10'"
              @click="toggleTag(presetTag)"
            >
              {{ presetTag }}
            </button>
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
                x
              </button>
            </span>
          </div>
        </div>
      </div>
    </div>

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
          Property default: {{ selectedPropertyDefaultMinutes }} min - leave empty to keep it
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

    <div class="rounded-xl border border-primary-100 bg-primary-50/40 p-4 dark:border-white/10 dark:bg-white/5">
      <h3 class="mb-1 text-sm font-semibold text-foreground">Extra items for this job</h3>
      <p class="mb-4 text-xs text-muted">Only pricing items added below generate extra charges for this task.</p>

      <div
        v-if="amenitiesBlocked"
        class="mb-4 rounded-lg border border-warning-200 bg-warning-50/70 px-3 py-2 text-xs text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-200"
      >
        This property does not include amenities. Amenities items are hidden.
      </div>

      <div v-if="form.extraItems.length === 0" class="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-4 text-sm text-muted">
        No extra items added.
      </div>

      <div v-else class="mb-3 space-y-2">
        <div
          v-for="(entry, index) in form.extraItems"
          :key="entry.id"
          class="grid grid-cols-1 gap-2 rounded-lg border border-border/80 bg-surface p-2.5 md:grid-cols-[minmax(320px,1fr)_90px_110px_minmax(0,220px)_auto] md:items-center"
        >
          <div class="relative min-w-0 w-full">
            <input
              v-model="entry.item_search_query"
              type="text"
              class="input-base w-full !py-1.5 text-sm"
              placeholder="Search item..."
              autocomplete="off"
              @focus="activeExtraItemPickerEntryId = entry.id"
              @input="onExtraItemSearchInput(entry)"
              @blur="onExtraItemSearchBlur(entry)"
            />

            <div
              v-if="activeExtraItemPickerEntryId === entry.id"
              class="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-primary-100 bg-surface p-1 shadow-lg dark:border-white/10"
            >
              <button
                v-for="pricingItem in getFilteredExtraItems(entry.item_search_query, entry.pricing_item_id)"
                :key="pricingItem.id"
                type="button"
                class="block w-full rounded-md px-2 py-2 text-left text-sm text-foreground transition hover:bg-primary-50/70 dark:hover:bg-white/10"
                @mousedown.prevent="selectExtraItem(entry, pricingItem)"
              >
                  <p class="font-medium">{{ pricingItem.name }}</p>
                  <p class="text-xs text-muted">{{ pricingItem.category }} · ${{ pricingItem.unit_price.toFixed(2) }}</p>
              </button>

              <p v-if="getFilteredExtraItems(entry.item_search_query, entry.pricing_item_id).length === 0" class="px-2 py-2 text-xs text-muted">
                No items found.
              </p>
            </div>
          </div>

          <input
            v-model.number="entry.quantity"
            type="number"
            min="1"
            step="1"
            class="input-base text-center !py-1.5 tabular-nums"
            placeholder="1"
            aria-label="Quantity"
          />

          <div class="text-right text-xs text-muted tabular-nums">
            ${{ lineTotalForExtraItem(entry.pricing_item_id, entry.quantity).toFixed(2) }}
          </div>

          <input
            v-model="entry.note"
            type="text"
            class="input-base !py-1.5 text-sm"
            placeholder="Optional note"
            aria-label="Note"
          />

          <button
            type="button"
            class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-error-600 transition hover:bg-error-100/50 dark:text-error-400 dark:hover:bg-error-500/10"
            aria-label="Remove extra item"
            @click="removeExtraItem(index)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z" />
            </svg>
          </button>
        </div>
      </div>

      <button
        type="button"
        class="btn-outline !px-3 !py-1.5 text-xs"
        :disabled="isLoadingPricingItems || availablePricingItems.length === 0"
        @click="addExtraItem"
      >
        {{ isLoadingPricingItems ? 'Loading items...' : '+ Add extra item' }}
      </button>

      <button
        type="button"
        class="btn-outline !px-3 !py-1.5 text-xs"
        :disabled="isLoadingPricingSets || availablePricingSets.length === 0"
        @click="openApplySetModal"
      >
        {{ isLoadingPricingSets ? 'Loading sets...' : '+ Apply set' }}
      </button>
    </div>

    <Teleport to="body">
      <div v-if="isApplySetModalOpen" class="modal-backdrop z-[100]" @click.self="closeApplySetModal">
        <div class="modal-surface max-w-md">
          <div class="modal-header">
            <h3 class="text-base font-semibold text-foreground">Apply set to extra items</h3>
            <button type="button" class="btn-outline !px-3 !py-1.5" @click="closeApplySetModal">Close</button>
          </div>
          <div class="modal-body space-y-4">
            <div>
              <label for="task-apply-set" class="mb-1.5 block text-sm font-medium text-foreground">Set</label>
              <select id="task-apply-set" v-model="selectedPricingSetId" class="select-base">
                <option value="">Select set</option>
                <option v-for="pricingSet in availablePricingSets" :key="pricingSet.id" :value="pricingSet.id">
                  {{ pricingSet.name }} · {{ pricingSet.items.length }} item(s)
                </option>
              </select>
            </div>

            <p class="text-xs text-muted">The selected set expands into daily task extra items. Existing quantities are summed.</p>

            <div class="flex justify-end gap-2">
              <button type="button" class="btn-outline" @click="closeApplySetModal">Cancel</button>
              <button type="button" class="btn-primary" :disabled="!selectedPricingSetId" @click="applySelectedPricingSet">Apply set</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <div class="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
      <button type="button" class="btn-outline" :disabled="isSubmitting" @click="emit('cancel')">
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
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import type { DailyTaskExtraItemInput, PricingItemDTO } from '../../../../shared/types/PricingItemDTO'
import type { DailyTaskDTO, TaskType } from '../../../../shared/types/DailyTaskDTO'
import type { PropertyDTO } from '../../../../shared/types/PropertyDTO'
import type { PricingSetDTO } from '../../../../shared/types/PricingSetDTO'
import { usePricingItems } from '../../../composables/usePricingItems'
import { usePricingSets } from '../../../composables/usePricingSets'
import { useDailyTasks } from '../../../composables/useDailyTasks'
import { useProperties } from '../../../composables/useProperties'

interface FormExtraComboEntry {
  id: string
  pricing_item_id: string
  item_search_query: string
  quantity: number
  note: string
}

export interface DailyTaskFormPayload {
  date: string
  property_id: string
  guest_name: string | null
  guest_checkin_date: string | null
  tags: string[]
  task_type: TaskType
  window_start_time: string | null
  window_end_time: string | null
  desired_start_time: string | null
  cleaning_minutes_override: number | null
  people_count: number
  notes: string | null
  extraItems: DailyTaskExtraItemInput[]
  extra_linen_combo_qty: number
  extra_amenities_combo_qty: number
  extra_linen_queen_qty: number
  extra_linen_single_qty: number
  extra_linen_king_qty: number
  extra_towel_qty: number
  extra_chocolate_qty: number
}

interface FormState {
  date: string
  property_id: string
  guest_name: string
  guest_checkin_date: string
  tags: string[]
  is_bsb: boolean
  window_start_time: string | null
  window_end_time: string | null
  desired_start_time: string | null
  cleaning_minutes_override: number | null
  people_count: number
  notes: string
  extraItems: FormExtraComboEntry[]
}

interface FieldErrors {
  date?: string
  property_id?: string
}

interface Props {
  mode: 'create' | 'edit'
  task?: DailyTaskDTO | null
  isSubmitting?: boolean
  submitLabel?: string
  initialDate?: string
  initialExtraItems?: DailyTaskExtraItemInput[]
  draftKey?: string
}

const DEFAULT_PRESET_TAGS = ['linen', 'amenities', 'vip', 'urgent']

const props = withDefaults(defineProps<Props>(), {
  task: null,
  isSubmitting: false,
  submitLabel: 'Save',
  initialDate: '',
  initialExtraItems: () => [],
})

const emit = defineEmits<{
  submit: [payload: DailyTaskFormPayload]
  cancel: []
}>()

const { checkDuplicateTask } = useDailyTasks()
const { fetchProperties } = useProperties()
const { fetchActivePricingItems } = usePricingItems()
const { fetchActivePricingSets } = usePricingSets()

const isDuplicateChecking = ref(false)
const isLoadingPricingItems = ref(false)
const isLoadingPricingSets = ref(false)
const properties = ref<PropertyDTO[]>([])
const activePricingItems = ref<PricingItemDTO[]>([])
const activePricingSets = ref<PricingSetDTO[]>([])
const propertySearchQuery = ref('')
const isPropertyPickerOpen = ref(false)
const activeExtraItemPickerEntryId = ref<string | null>(null)
const isApplySetModalOpen = ref(false)
const selectedPricingSetId = ref('')
const tagDraft = ref('')
const presetTagsState = useState<string[]>('daily-task-preset-tags', () => [...DEFAULT_PRESET_TAGS])
let draftSaveTimer: ReturnType<typeof setTimeout> | null = null
const isApplyingDraft = ref(false)

const form = reactive<FormState>({
  date: props.initialDate || new Date().toISOString().split('T')[0] || '',
  property_id: '',
  guest_name: '',
  guest_checkin_date: '',
  tags: [],
  is_bsb: false,
  window_start_time: null,
  window_end_time: null,
  desired_start_time: null,
  cleaning_minutes_override: null,
  people_count: 1,
  notes: '',
  extraItems: [],
})

const errors = reactive<FieldErrors>({})

function createEntryId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function normalizeTagValue(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function normalizeTags(tags: string[]): string[] {
  return Array.from(new Set(tags.map((tag) => normalizeTagValue(tag)).filter((tag) => tag.length > 0)))
}

function toExtraItemEntry(item: DailyTaskExtraItemInput): FormExtraComboEntry {
  return {
    id: createEntryId(),
    pricing_item_id: item.pricing_item_id,
    item_search_query: getPricingItemDisplay(item.pricing_item_id),
    quantity: Math.max(1, Number(item.quantity ?? 1)),
    note: item.note?.trim() ?? '',
  }
}

const presetTags = computed(() => normalizeTags(presetTagsState.value))
const selectedProperty = computed(() => properties.value.find((property) => property.id === form.property_id) ?? null)
const amenitiesBlocked = computed(() => selectedProperty.value?.includes_amenities === false)
const availablePricingItems = computed(() => {
  if (!amenitiesBlocked.value) {
    return activePricingItems.value
  }

  return activePricingItems.value.filter((pricingItem) => pricingItem.category !== 'amenities')
})

const availablePricingSets = computed(() => {
  const availablePricingItemIds = new Set(availablePricingItems.value.map((pricingItem) => pricingItem.id))

  return activePricingSets.value.filter((pricingSet) => {
    if (!pricingSet.active) {
      return false
    }

    return pricingSet.items.some((item) => availablePricingItemIds.has(item.pricing_item_id))
  })
})

const filteredProperties = computed(() => {
  const query = propertySearchQuery.value.trim().toLowerCase()
  if (!query) {
    return properties.value
  }

  return properties.value.filter((property) => property.name.toLowerCase().includes(query))
})

const canAddMoreTags = computed(() => form.tags.length < 12)
const selectedPropertyDefaultMinutes = computed(() => selectedProperty.value?.default_cleaning_minutes ?? null)
const propertyDefaultMinutesHint = computed(() => {
  return selectedPropertyDefaultMinutes.value !== null ? String(selectedPropertyDefaultMinutes.value) : 'Default cleaning time'
})
const resolvedDraftKey = computed(() => {
  if (props.draftKey) {
    return `daily-task-form:${props.draftKey}`
  }

  if (props.mode === 'edit' && props.task?.id) {
    return `daily-task-form:edit:${props.task.id}`
  }

  return `daily-task-form:create:${props.initialDate || 'unscheduled'}`
})

function readDraft(): Partial<FormState> | null {
  if (!import.meta.client) {
    return null
  }

  const raw = window.localStorage.getItem(resolvedDraftKey.value)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as Partial<FormState>
  } catch {
    return null
  }
}

function clearDraft(): void {
  if (!import.meta.client) {
    return
  }

  window.localStorage.removeItem(resolvedDraftKey.value)
}

function scheduleDraftSave(): void {
  if (!import.meta.client || isApplyingDraft.value) {
    return
  }

  if (draftSaveTimer) {
    clearTimeout(draftSaveTimer)
  }

  draftSaveTimer = setTimeout(() => {
    const snapshot: FormState = {
      date: form.date,
      property_id: form.property_id,
      guest_name: form.guest_name,
      guest_checkin_date: form.guest_checkin_date,
      tags: [...form.tags],
      is_bsb: form.is_bsb,
      window_start_time: form.window_start_time,
      window_end_time: form.window_end_time,
      desired_start_time: form.desired_start_time,
      cleaning_minutes_override: form.cleaning_minutes_override,
      people_count: form.people_count,
      notes: form.notes,
      extraItems: form.extraItems.map((entry) => ({ ...entry })),
    }

    window.localStorage.setItem(resolvedDraftKey.value, JSON.stringify(snapshot))
    draftSaveTimer = null
  }, 400)
}

function applyDraftIfAvailable(): void {
  const draft = readDraft()
  if (!draft) {
    return
  }

  isApplyingDraft.value = true

  if (typeof draft.date === 'string') form.date = draft.date
  if (typeof draft.property_id === 'string') form.property_id = draft.property_id
  if (typeof draft.guest_name === 'string') form.guest_name = draft.guest_name
  if (typeof draft.guest_checkin_date === 'string') form.guest_checkin_date = draft.guest_checkin_date
  if (Array.isArray(draft.tags)) form.tags = normalizeTags(draft.tags)
  if (typeof draft.is_bsb === 'boolean') form.is_bsb = draft.is_bsb
  if (typeof draft.window_start_time === 'string' || draft.window_start_time === null) form.window_start_time = draft.window_start_time
  if (typeof draft.window_end_time === 'string' || draft.window_end_time === null) form.window_end_time = draft.window_end_time
  if (typeof draft.desired_start_time === 'string' || draft.desired_start_time === null) form.desired_start_time = draft.desired_start_time
  if (typeof draft.cleaning_minutes_override === 'number' || draft.cleaning_minutes_override === null) form.cleaning_minutes_override = draft.cleaning_minutes_override
  if (typeof draft.people_count === 'number') form.people_count = Math.max(1, Math.floor(draft.people_count))
  if (typeof draft.notes === 'string') form.notes = draft.notes
  if (Array.isArray(draft.extraItems)) form.extraItems = draft.extraItems.map((entry) => ({ ...entry, id: createEntryId() }))

  propertySearchQuery.value = selectedProperty.value?.name ?? propertySearchQuery.value
  isApplyingDraft.value = false
}

function resetErrors(): void {
  errors.date = undefined
  errors.property_id = undefined
}

function isTagSelected(tag: string): boolean {
  return form.tags.includes(normalizeTagValue(tag))
}

function toggleTag(tag: string): void {
  const normalized = normalizeTagValue(tag)
  if (!normalized) {
    return
  }

  if (form.tags.includes(normalized)) {
    form.tags = form.tags.filter((current) => current !== normalized)
    return
  }

  if (canAddMoreTags.value) {
    form.tags = normalizeTags([...form.tags, normalized])
  }
}

function removeTag(tag: string): void {
  const normalized = normalizeTagValue(tag)
  form.tags = form.tags.filter((current) => current !== normalized)
}

function addOrCreateTag(): void {
  const normalized = normalizeTagValue(tagDraft.value)
  if (!normalized || !canAddMoreTags.value) {
    return
  }

  form.tags = normalizeTags([...form.tags, normalized])

  if (!presetTagsState.value.includes(normalized)) {
    presetTagsState.value = normalizeTags([...presetTagsState.value, normalized])
  }

  tagDraft.value = ''
}

function findPropertyByName(name: string): PropertyDTO | null {
  const normalized = name.trim().toLowerCase()
  return properties.value.find((property) => property.name.toLowerCase() === normalized) ?? null
}

function selectProperty(property: PropertyDTO): void {
  form.property_id = property.id
  propertySearchQuery.value = property.name
  isPropertyPickerOpen.value = false
  errors.property_id = undefined
}

function onPropertySearchInput(): void {
  isPropertyPickerOpen.value = true
  const exact = findPropertyByName(propertySearchQuery.value)
  form.property_id = exact?.id ?? ''
}

function onPropertySearchBlur(): void {
  window.setTimeout(() => {
    isPropertyPickerOpen.value = false

    if (!form.property_id) {
      const exact = findPropertyByName(propertySearchQuery.value)
      if (exact) {
        selectProperty(exact)
        return
      }

      propertySearchQuery.value = ''
      return
    }

    propertySearchQuery.value = selectedProperty.value?.name ?? ''
  }, 120)
}

function addExtraItem(): void {
  form.extraItems = [
    ...form.extraItems,
    {
      id: createEntryId(),
      pricing_item_id: '',
      item_search_query: '',
      quantity: 1,
      note: '',
    },
  ]
}

function openApplySetModal(): void {
  selectedPricingSetId.value = availablePricingSets.value[0]?.id ?? ''
  isApplySetModalOpen.value = true
}

function closeApplySetModal(): void {
  isApplySetModalOpen.value = false
  selectedPricingSetId.value = ''
}

function applySelectedPricingSet(): void {
  const pricingSet = availablePricingSets.value.find((item) => item.id === selectedPricingSetId.value)
  if (!pricingSet) {
    return
  }

  const availablePricingItemIds = new Set(availablePricingItems.value.map((pricingItem) => pricingItem.id))

  for (const item of pricingSet.items) {
    if (!availablePricingItemIds.has(item.pricing_item_id)) {
      continue
    }

    const existing = form.extraItems.find((entry) => entry.pricing_item_id === item.pricing_item_id)
    if (existing) {
      existing.quantity += Math.max(1, Number(item.quantity ?? 1))
      existing.item_search_query = getPricingItemDisplay(existing.pricing_item_id)
      continue
    }

    form.extraItems = [
      ...form.extraItems,
      {
        id: createEntryId(),
        pricing_item_id: item.pricing_item_id,
        item_search_query: getPricingItemDisplay(item.pricing_item_id),
        quantity: Math.max(1, Number(item.quantity ?? 1)),
        note: '',
      },
    ]
  }

  closeApplySetModal()
}

function mergeNotes(first: string, second: string): string {
  const values = [first.trim(), second.trim()].filter((value) => value.length > 0)
  if (values.length === 0) {
    return ''
  }

  return Array.from(new Set(values)).join(' | ')
}

function removeExtraItem(index: number): void {
  form.extraItems = form.extraItems.filter((_, entryIndex) => entryIndex !== index)
}

function lineTotalForExtraItem(pricingItemId: string, quantity: number): number {
  const pricingItem = activePricingItems.value.find((item) => item.id === pricingItemId)
  if (!pricingItem) {
    return 0
  }

  return Number((pricingItem.unit_price * Math.max(1, Number(quantity ?? 1))).toFixed(2))
}

function getPricingItemDisplay(pricingItemId: string): string {
  const pricingItem = activePricingItems.value.find((item) => item.id === pricingItemId)
  if (!pricingItem) {
    return ''
  }

  return `${pricingItem.name} (${pricingItem.category}) - $${pricingItem.unit_price.toFixed(2)}`
}

function findPricingItemByName(name: string): PricingItemDTO | null {
  const normalized = name.trim().toLowerCase()
  return availablePricingItems.value.find((pricingItem) => pricingItem.name.toLowerCase() === normalized) ?? null
}

function getFilteredExtraItems(query: string, selectedPricingItemId = ''): PricingItemDTO[] {
  const normalizedQuery = query.trim().toLowerCase()
  let result = availablePricingItems.value

  if (normalizedQuery.length > 0) {
    result = result.filter((pricingItem) => pricingItem.name.toLowerCase().includes(normalizedQuery))
  }

  if (selectedPricingItemId && !result.some((pricingItem) => pricingItem.id === selectedPricingItemId)) {
    const selected = availablePricingItems.value.find((pricingItem) => pricingItem.id === selectedPricingItemId)
    if (selected) {
      result = [selected, ...result]
    }
  }

  return result
}

function selectExtraItem(entry: FormExtraComboEntry, pricingItem: PricingItemDTO): void {
  const currentIndex = form.extraItems.findIndex((item) => item.id === entry.id)
  const duplicateIndex = form.extraItems.findIndex((item, index) => item.pricing_item_id === pricingItem.id && index !== currentIndex)

  if (currentIndex >= 0 && duplicateIndex >= 0) {
    const currentEntry = form.extraItems[currentIndex]
    const duplicateEntry = form.extraItems[duplicateIndex]

    if (currentEntry && duplicateEntry) {
      duplicateEntry.quantity = Math.max(1, Number(duplicateEntry.quantity ?? 1)) + Math.max(1, Number(currentEntry.quantity ?? 1))
      duplicateEntry.note = mergeNotes(duplicateEntry.note, currentEntry.note)
    }

    removeExtraItem(currentIndex)
    activeExtraItemPickerEntryId.value = null
    return
  }

  entry.pricing_item_id = pricingItem.id
  entry.item_search_query = getPricingItemDisplay(pricingItem.id)
  activeExtraItemPickerEntryId.value = null
}

function onExtraItemSearchInput(entry: FormExtraComboEntry): void {
  activeExtraItemPickerEntryId.value = entry.id
  const exact = findPricingItemByName(entry.item_search_query)
  entry.pricing_item_id = exact?.id ?? ''
}

function onExtraItemSearchBlur(entry: FormExtraComboEntry): void {
  window.setTimeout(() => {
    if (activeExtraItemPickerEntryId.value === entry.id) {
      activeExtraItemPickerEntryId.value = null
    }

    if (!entry.pricing_item_id) {
      const exact = findPricingItemByName(entry.item_search_query)
      if (exact) {
        selectExtraItem(entry, exact)
        return
      }

      entry.item_search_query = ''
      return
    }

    entry.item_search_query = getPricingItemDisplay(entry.pricing_item_id)
  }, 120)
}

function syncExtraItemSearchText(): void {
  form.extraItems = form.extraItems.map((entry) => ({
    ...entry,
    item_search_query: getPricingItemDisplay(entry.pricing_item_id),
  }))
}

function normalizeExtraItems(): DailyTaskExtraItemInput[] {
  const merged = new Map<string, { quantity: number; note: string | null }>()

  for (const entry of form.extraItems) {
    const pricingItemId = entry.pricing_item_id.trim()
    if (!pricingItemId) {
      continue
    }

    const quantity = Math.max(1, Number(entry.quantity ?? 1))
    const note = entry.note.trim() || null
    const existing = merged.get(pricingItemId)

    if (!existing) {
      merged.set(pricingItemId, {
        quantity,
        note,
      })
      continue
    }

    existing.quantity += quantity
    if (note) {
      existing.note = existing.note ? mergeNotes(existing.note, note) : note
    }
  }

  return Array.from(merged.entries()).map(([pricing_item_id, value]) => ({
    pricing_item_id,
    quantity: value.quantity,
    note: value.note,
  }))
}

function syncForm(): void {
  if (props.mode === 'edit' && props.task) {
    form.date = props.task.date
    form.property_id = props.task.property_id
    form.guest_name = props.task.guest_name ?? ''
    form.guest_checkin_date = props.task.guest_checkin_date ?? ''
    form.tags = [...(props.task.tags ?? [])]
    form.is_bsb = props.task.task_type === 'BSB'
    form.window_start_time = props.task.window_start_time ?? null
    form.window_end_time = props.task.window_end_time ?? null
    form.desired_start_time = props.task.desired_start_time ?? null
    form.cleaning_minutes_override = props.task.cleaning_minutes_override
    form.people_count = props.task.people_count
    form.notes = props.task.notes ?? ''
    form.extraItems = props.initialExtraItems.map((item) => toExtraItemEntry(item))
  } else {
    form.date = props.initialDate || new Date().toISOString().split('T')[0] || ''
    form.property_id = ''
    form.guest_name = ''
    form.guest_checkin_date = ''
    form.tags = []
    form.is_bsb = false
    form.window_start_time = null
    form.window_end_time = null
    form.desired_start_time = null
    form.cleaning_minutes_override = null
    form.people_count = 1
    form.notes = ''
    form.extraItems = props.initialExtraItems.map((item) => toExtraItemEntry(item))
  }

  propertySearchQuery.value = selectedProperty.value?.name ?? ''
  resetErrors()
}

function validateForm(): boolean {
  resetErrors()
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
  if (!validateForm()) {
    return
  }

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

  emit('submit', {
    date: form.date,
    property_id: form.property_id,
    guest_name: form.guest_name.trim() || null,
    guest_checkin_date: form.guest_checkin_date || null,
    tags: [...form.tags],
    task_type: form.is_bsb ? 'BSB' : 'NORMAL',
    window_start_time: form.window_start_time,
    window_end_time: form.window_end_time,
    desired_start_time: form.desired_start_time,
    cleaning_minutes_override: form.cleaning_minutes_override ?? null,
    people_count: form.people_count,
    notes: form.notes.trim() || null,
    extraItems: normalizeExtraItems(),
    extra_linen_combo_qty: 0,
    extra_amenities_combo_qty: 0,
    extra_linen_queen_qty: 0,
    extra_linen_single_qty: 0,
    extra_linen_king_qty: 0,
    extra_towel_qty: 0,
    extra_chocolate_qty: 0,
  })

  clearDraft()
}

watch(() => props.task, syncForm, { immediate: true })
watch(() => props.initialExtraItems, () => {
  form.extraItems = props.initialExtraItems.map((item) => toExtraItemEntry(item))
}, { deep: true })
watch(() => props.initialDate, (value) => {
  if (props.mode === 'create' && value) {
    form.date = value
  }
})
watch(() => form.property_id, (propertyId, previousPropertyId) => {
  if (props.mode !== 'create' || !propertyId || propertyId === previousPropertyId) {
    return
  }

  const property = properties.value.find((item) => item.id === propertyId)
  form.tags = normalizeTags(property?.default_tags ?? [])
  propertySearchQuery.value = property?.name ?? ''
})
watch(amenitiesBlocked, (blocked) => {
  if (!blocked) {
    return
  }

  const allowedPricingItemIds = new Set(availablePricingItems.value.map((pricingItem) => pricingItem.id))
  form.extraItems = form.extraItems.filter((entry) => allowedPricingItemIds.has(entry.pricing_item_id))
  syncExtraItemSearchText()
})

watch(activePricingItems, () => {
  syncExtraItemSearchText()
}, { deep: true })

watch(
  () => ({ form: { ...form, extraItems: form.extraItems.map((entry) => ({ ...entry })) }, key: resolvedDraftKey.value }),
  () => {
    scheduleDraftSave()
  },
  { deep: true },
)

watch(
  () => resolvedDraftKey.value,
  () => {
    syncForm()
    applyDraftIfAvailable()
  },
)

onMounted(async () => {
  isLoadingPricingItems.value = true
  isLoadingPricingSets.value = true
  try {
    const [fetchedProperties, fetchedPricingItems, fetchedPricingSets] = await Promise.all([
      fetchProperties(),
      fetchActivePricingItems(),
      fetchActivePricingSets(),
    ])

    properties.value = fetchedProperties.filter((property) => property.active)
    activePricingItems.value = fetchedPricingItems
    activePricingSets.value = fetchedPricingSets
    syncExtraItemSearchText()
    propertySearchQuery.value = selectedProperty.value?.name ?? ''
    applyDraftIfAvailable()
  } finally {
    isLoadingPricingItems.value = false
    isLoadingPricingSets.value = false
  }
})

onBeforeUnmount(() => {
  if (draftSaveTimer) {
    clearTimeout(draftSaveTimer)
    draftSaveTimer = null
  }
})
</script>
