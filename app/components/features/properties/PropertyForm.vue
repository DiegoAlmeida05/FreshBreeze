<template>
  <form novalidate class="space-y-5" @submit.prevent="onSubmit">
    <section class="form-section space-y-4">
      <h3 class="form-section-title">Property Identity</h3>

      <div>
        <div class="mb-1.5">
          <label for="property-client" class="block text-sm font-medium text-foreground">Client</label>
        </div>
        <select id="property-client" v-model="form.client_id" class="input-base">
          <option value="" disabled>Select a client</option>
          <option v-for="client in clients" :key="client.id" :value="client.id">
            {{ client.name }}
          </option>
        </select>
        <p v-if="isLoadingClients" class="mt-1 text-xs text-muted">Loading clients...</p>
        <p v-else-if="errors.client_id" class="mt-1 text-xs text-error-600">{{ errors.client_id }}</p>
      </div>

      <div>
        <div class="mb-1.5">
          <label for="property-name" class="block text-sm font-medium text-foreground">Property name</label>
        </div>
        <input
          id="property-name"
          v-model="form.name"
          type="text"
          class="input-base"
          placeholder="e.g. Beach House Unit 4A"
        />
        <p v-if="errors.name" class="mt-1 text-xs text-error-600">{{ errors.name }}</p>
      </div>

      <div>
        <div class="mb-1.5">
          <label for="property-address" class="block text-sm font-medium text-foreground">Address</label>
        </div>
        <input
          id="property-address"
          v-model="form.address"
          type="text"
          class="input-base"
          placeholder="123 Sample Street, City"
        />
        <p v-if="errors.address" class="mt-1 text-xs text-error-600">{{ errors.address }}</p>
      </div>

      <div class="rounded-xl border border-border/80 bg-muted/20 p-3.5">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-muted">Coordinates (used for navigation)</p>
          <span
            v-if="!form.lat.trim() || !form.lng.trim()"
            class="inline-flex items-center gap-1 rounded-full bg-warning-100/60 px-2 py-0.5 text-[10px] font-semibold text-warning-700 dark:bg-warning-500/10 dark:text-warning-400"
          >
            Missing — Go button will be unavailable
          </span>
        </div>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <div class="mb-1.5">
              <label for="property-lat" class="block text-xs font-semibold uppercase tracking-wide text-muted">Latitude</label>
            </div>
            <input
              id="property-lat"
              v-model="form.lat"
              type="text"
              inputmode="decimal"
              class="input-base !py-2 text-sm"
              placeholder="-33.8688"
            />
          </div>
          <div>
            <div class="mb-1.5">
              <label for="property-lng" class="block text-xs font-semibold uppercase tracking-wide text-muted">Longitude</label>
            </div>
            <input
              id="property-lng"
              v-model="form.lng"
              type="text"
              inputmode="decimal"
              class="input-base !py-2 text-sm"
              placeholder="151.2093"
            />
          </div>
        </div>
      </div>
    </section>

    <section class="form-section space-y-4">
      <h3 class="form-section-title">Beds &amp; Bathrooms</h3>
      <p class="text-xs text-muted">Default counts for this property. Used to calculate linen and amenity costs per service.</p>

      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <div class="mb-1.5">
            <label for="property-bathrooms" class="block text-xs font-medium text-foreground">Bathrooms</label>
          </div>
          <input
            id="property-bathrooms"
            v-model.number="form.bathrooms"
            type="number"
            min="0"
            step="0.5"
            class="input-base text-sm text-center"
            placeholder="1.5"
            required
          />
        </div>
        <div>
          <div class="mb-1.5">
            <label for="property-beds-single" class="block text-xs font-medium text-foreground">Single beds</label>
          </div>
          <input
            id="property-beds-single"
            v-model.number="form.beds_single"
            type="number"
            min="0"
            step="1"
            class="input-base text-sm text-center"
            placeholder="0"
            required
          />
        </div>
        <div>
          <div class="mb-1.5">
            <label for="property-beds-queen" class="block text-xs font-medium text-foreground">Queen beds</label>
          </div>
          <input
            id="property-beds-queen"
            v-model.number="form.beds_queen"
            type="number"
            min="0"
            step="1"
            class="input-base text-sm text-center"
            placeholder="0"
            required
          />
        </div>
        <div>
          <div class="mb-1.5">
            <label for="property-beds-king" class="block text-xs font-medium text-foreground">King beds</label>
          </div>
          <input
            id="property-beds-king"
            v-model.number="form.beds_king"
            type="number"
            min="0"
            step="1"
            class="input-base text-sm text-center"
            placeholder="0"
            required
          />
        </div>
      </div>
    </section>

    <section class="form-section space-y-4">
      <h3 class="form-section-title">Operational Defaults</h3>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="rounded-xl border border-border/80 bg-surface p-3.5">
          <div class="mb-1.5">
            <label for="property-cleaning-minutes" class="block text-xs font-semibold uppercase tracking-wide text-muted">Cleaning time (min)</label>
          </div>
          <div class="relative max-w-[220px]">
            <input
              id="property-cleaning-minutes"
              v-model.number="form.default_cleaning_minutes"
              type="number"
              min="0"
              step="5"
              class="input-base pr-12 text-right tabular-nums"
              placeholder="120"
              required
            />
            <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-wide text-muted">min</span>
          </div>
          <p class="mt-1.5 text-xs text-muted">Use intervals like 90, 120 or 180.</p>
        </div>

        <div class="rounded-xl border border-border/80 bg-surface p-3.5">
          <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Default extras</p>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="property-extra-towels-default-qty" class="mb-1.5 block text-xs font-medium text-foreground">Extra towels</label>
              <input
                id="property-extra-towels-default-qty"
                v-model.number="form.extra_towels_default_qty"
                type="number"
                min="0"
                step="1"
                class="input-base text-center tabular-nums"
                placeholder="0"
                required
              />
            </div>
            <div>
              <label for="property-extra-dishcloths-default-qty" class="mb-1.5 block text-xs font-medium text-foreground">Extra dishcloths</label>
              <input
                id="property-extra-dishcloths-default-qty"
                v-model.number="form.extra_dishcloths_default_qty"
                type="number"
                min="0"
                step="1"
                class="input-base text-center tabular-nums"
                placeholder="0"
                required
              />
            </div>
          </div>

          <label class="mt-3 inline-flex cursor-pointer items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
            <input
              id="property-includes-chocolates"
              v-model="form.includes_chocolates"
              type="checkbox"
              class="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
            />
            Include chocolate
          </label>
        </div>
      </div>

      <div>
        <div class="mb-1.5">
          <label for="property-notes" class="block text-sm font-medium text-foreground">Notes</label>
        </div>
        <textarea
          id="property-notes"
          v-model="form.notes"
          rows="7"
          class="input-base resize-y font-mono text-sm"
          placeholder="Any special instructions or details..."
        />
        <p class="mt-1.5 text-xs text-muted">
          Tip: use simple text formatting like <strong>- bullets</strong>, <strong>1. numbered lists</strong>, and spaces for alignment.
        </p>

        <div v-if="form.notes.trim()" class="mt-3 overflow-hidden rounded-lg border border-primary-100 bg-primary-50/35 dark:bg-white/5">
          <p class="border-b border-primary-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted">Preview</p>
          <pre class="whitespace-pre-wrap px-3 py-3 text-xs text-foreground">{{ form.notes }}</pre>
        </div>
      </div>
    </section>

    <section class="form-section space-y-4">
      <div>
        <h3 class="form-section-title">Default Tags</h3>
        <p class="mt-1 text-xs text-muted">Tags pre-selected when a daily task is created for this property.</p>
      </div>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-foreground">Default task tags</label>
        <div class="flex flex-wrap gap-2.5">
          <div
            v-for="presetTag in presetTags"
            :key="presetTag"
            class="inline-flex items-center rounded-full border px-0.5 py-0.5 text-xs font-semibold transition"
            :class="isDefaultTagSelected(presetTag)
              ? 'border-primary/30 bg-primary/10 text-primary-700 dark:text-primary-300'
              : 'border-primary-100 bg-surface text-muted dark:border-white/10'"
          >
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-2.5 py-1"
              :aria-label="`${isDefaultTagSelected(presetTag) ? 'Remove' : 'Add'} default tag ${presetTag}`"
              :aria-pressed="isDefaultTagSelected(presetTag)"
              @click="toggleDefaultPresetTag(presetTag)"
            >
              <span
                class="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] leading-none"
                :class="isDefaultTagSelected(presetTag)
                  ? 'bg-primary/20 text-primary-700 dark:text-primary-300'
                  : 'bg-primary/15 text-primary-700 dark:text-primary-300'"
              >
                {{ isDefaultTagSelected(presetTag) ? '−' : '+' }}
              </span>
              <span>{{ presetTag }}</span>
            </button>
            <button
              type="button"
              class="mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-error-500/15 text-[10px] leading-none text-error-600 transition hover:bg-error-500/30 dark:text-error-400"
              :aria-label="`Remove preset tag ${presetTag}`"
              @click="removePresetTag(presetTag)"
            >
              ×
            </button>
          </div>
        </div>

        <div class="mt-3 flex max-w-xl items-stretch gap-2.5">
          <input
            id="property-default-tag-draft"
            v-model="defaultTagDraft"
            type="text"
            class="input-base flex-1"
            placeholder="Type tag name"
            autocomplete="off"
            :disabled="!canAddMoreDefaultTags"
            @keydown.enter.prevent="addOrCreateDefaultTag"
          />
          <button
            type="button"
            class="btn-outline min-w-[96px] !px-3 !py-2 text-xs whitespace-nowrap"
            :disabled="!canAddMoreDefaultTags"
            @click="addOrCreateDefaultTag"
          >
            Add tag
          </button>
        </div>

        <div v-if="form.default_tags.length > 0" class="mt-2 flex flex-wrap gap-2.5">
          <span
            v-for="tag in form.default_tags"
            :key="tag"
            class="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary-700 dark:border-primary/25 dark:text-primary-300"
          >
            <span>{{ tag }}</span>
            <button
              type="button"
              class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-[10px] leading-none transition hover:bg-primary/35"
              aria-label="Remove default tag"
              @click="removeDefaultTag(tag)"
            >
              ×
            </button>
          </span>
        </div>
      </div>
    </section>

    <section class="form-section space-y-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 class="form-section-title">Reference Resources</h3>
          <p class="mt-1 text-xs text-muted">Quick links or file references for operational use.</p>
        </div>
        <button type="button" class="btn-outline !px-3 !py-2 text-xs" @click="addResource">
          Add resource
        </button>
      </div>

      <div v-if="form.property_resources.length === 0" class="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-5 text-sm text-muted">
        No resources added yet.
      </div>

      <div v-else class="space-y-3">
        <article
          v-for="(resource, index) in form.property_resources"
          :key="resource.id"
          class="rounded-xl border border-border/80 bg-surface p-4"
        >
          <div class="mb-3 flex items-center justify-between gap-3">
            <p class="text-sm font-semibold text-foreground">Resource {{ index + 1 }}</p>
            <button type="button" class="btn-outline !px-2.5 !py-1 text-[11px]" @click="removeResource(resource.id)">
              Remove
            </button>
          </div>

          <div class="mb-3">
            <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Type</label>
            <select v-model="resource.resource_type" class="input-base">
              <option value="link">Link</option>
              <option value="attachment">File</option>
            </select>
          </div>

          <div v-if="resource.resource_type === 'link'" class="space-y-2">
            <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">URL</label>
            <input
              v-model="resource.url"
              type="url"
              class="input-base"
              placeholder="https://..."
            />
          </div>

          <div v-else class="space-y-2">
            <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">File upload</label>
            <input
              :id="`property-resource-file-${resource.id}`"
              type="file"
              class="input-base"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              capture="environment"
              :disabled="uploadingResourceId === resource.id"
              @change="onResourceFileChange(resource.id, $event)"
            />
            <p class="text-xs text-muted">Image files only (JPG, PNG, WEBP).</p>
            <p v-if="uploadingResourceId === resource.id" class="text-xs font-medium text-primary-600">Uploading file...</p>
            <p v-else-if="resourceUploadErrorById[resource.id]" class="text-xs font-medium text-error-600">{{ resourceUploadErrorById[resource.id] }}</p>
            <div
              v-if="resource.attachment_url.trim()"
              class="relative inline-flex"
            >
              <a
                :href="resource.attachment_url.trim()"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex flex-col gap-2 rounded-xl border border-border/80 bg-muted/20 p-2 transition hover:border-primary/30 hover:bg-primary-50/40 dark:hover:bg-white/5"
              >
                <img
                  :src="resource.attachment_url.trim()"
                  :alt="`Resource ${index + 1} attachment`"
                  class="h-24 w-24 rounded-lg object-cover"
                >
                <span class="text-xs font-medium text-primary-700 dark:text-primary-300">View attachment</span>
              </a>
              <button
                type="button"
                class="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[10px] font-bold text-white transition hover:bg-black/80"
                aria-label="Remove resource attachment"
                @click="clearResourceAttachment(resource.id)"
              >
                ×
              </button>
            </div>
          </div>
        </article>
      </div>

      <p v-if="errors.property_resources" class="text-xs text-error-600">{{ errors.property_resources }}</p>
    </section>

    <section class="form-section space-y-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 class="form-section-title">Key Management</h3>
          <p class="mt-1 text-xs text-muted">Track each key copy individually and keep pickup details organized.</p>
        </div>
        <label class="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
          <input
            id="property-has-keys"
            v-model="form.has_keys"
            type="checkbox"
            class="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
          />
          Property has keys
        </label>
      </div>

      <div v-if="form.has_keys" class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-muted/20 p-3.5">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-muted">Registered key copies</p>
            <p class="mt-1 text-lg font-semibold text-foreground">{{ form.property_keys.length }}</p>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" class="btn-outline !px-3 !py-1.5 text-xs" @click="removeLastKey" :disabled="form.property_keys.length === 0">
              Remove last
            </button>
            <button type="button" class="btn-outline !px-3 !py-1.5 text-xs" @click="addKey">
              Add key
            </button>
          </div>
        </div>

        <div v-if="form.property_keys.length === 0" class="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-5 text-sm text-muted">
          Add at least one key copy to describe pickup and handling instructions.
        </div>

        <div v-else class="space-y-3">
          <article
            v-for="(keyItem, index) in form.property_keys"
            :key="keyItem.id"
            class="rounded-xl border border-border/80 bg-surface p-4"
          >
            <div class="mb-3 flex items-center justify-between gap-3">
              <p class="text-sm font-semibold text-foreground">Key {{ index + 1 }}</p>
              <button type="button" class="btn-outline !px-2.5 !py-1 text-[11px]" @click="removeKey(keyItem.id)">
                Remove
              </button>
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Label</label>
                <input
                  v-model="keyItem.label"
                  type="text"
                  class="input-base"
                  :placeholder="`e.g. Lockbox ${index + 1}`"
                />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Pickup address</label>
                <input
                  v-model="keyItem.pickup_address"
                  type="text"
                  class="input-base"
                  placeholder="Depot, lockbox or handover point"
                />
              </div>
            </div>

            <div class="mt-3">
              <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Note</label>
              <textarea
                v-model="keyItem.note"
                rows="3"
                class="input-base resize-y text-sm"
                placeholder="Alarm code, where to return it, gate notes..."
              />
            </div>

            <div class="mt-3 space-y-2">
              <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Attachment / Photo</label>
              <input
                :id="`property-key-file-${keyItem.id}`"
                type="file"
                class="input-base"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                capture="environment"
                :disabled="uploadingKeyAttachmentId === keyItem.id"
                @change="onKeyAttachmentFileChange(keyItem.id, $event)"
              />
              <p class="text-xs text-muted">Image files only (JPG, PNG, WEBP).</p>
              <p v-if="uploadingKeyAttachmentId === keyItem.id" class="text-xs font-medium text-primary-600">Uploading photo...</p>
              <p v-else-if="keyAttachmentErrorById[keyItem.id]" class="text-xs font-medium text-error-600">{{ keyAttachmentErrorById[keyItem.id] }}</p>
              <div
                v-if="keyItem.attachment_url.trim()"
                class="relative inline-flex"
              >
                <a
                  :href="keyItem.attachment_url.trim()"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex flex-col gap-2 rounded-xl border border-border/80 bg-muted/20 p-2 transition hover:border-primary/30 hover:bg-primary-50/40 dark:hover:bg-white/5"
                >
                  <img
                    :src="keyItem.attachment_url.trim()"
                    :alt="`Key ${index + 1} attachment`"
                    class="h-24 w-24 rounded-lg object-cover"
                  >
                  <span class="text-xs font-medium text-primary-700 dark:text-primary-300">View attachment</span>
                </a>
                <button
                  type="button"
                  class="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[10px] font-bold text-white transition hover:bg-black/80"
                  aria-label="Remove key attachment"
                  @click="clearKeyAttachment(keyItem.id)"
                >
                  ×
                </button>
              </div>
            </div>
          </article>
        </div>

        <p v-if="errors.property_keys" class="text-xs text-error-600">{{ errors.property_keys }}</p>
      </div>
    </section>

    <section class="form-section space-y-3">
      <h3 class="form-section-title">Status</h3>
      <label class="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
        <input
          id="property-active"
          v-model="form.active"
          type="checkbox"
          class="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
        />
        Active property
      </label>
    </section>

    <div class="action-bar">
      <button type="button" class="btn-outline min-w-[110px]" :disabled="isSubmitting" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="btn-primary min-w-[130px]" :disabled="isSubmitting || isLoadingClients">
        {{ isSubmitting ? 'Saving...' : submitLabel }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { useState } from '#imports'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { ClientDTO } from '../../../../shared/types/ClientDTO'
import type {
  CreatePropertyDTO,
  CreatePropertyKeyDTO,
  CreatePropertyResourceDTO,
  PropertyDTO,
  PropertyResourceType,
  PropertyTags,
  UpdatePropertyDTO,
} from '../../../../shared/types/PropertyDTO'
import { useClients } from '../../../composables/useClients'
import { useUploadPropertyKeyPhoto } from '../../../composables/useUploadPropertyKeyPhoto'
import { assertAllowedImageType } from '../../../utils/optimizeImage'

export type PropertyFormMode = 'create' | 'edit'
export type PropertyFormPayload = CreatePropertyDTO | UpdatePropertyDTO

interface FormPropertyKey {
  id: string
  label: string
  pickup_address: string
  note: string
  attachment_url: string
}

interface FormPropertyResource {
  id: string
  resource_type: PropertyResourceType
  url: string
  attachment_url: string
}

export interface PropertyFormSubmitPayload {
  property: PropertyFormPayload
  propertyKeys: CreatePropertyKeyDTO[]
  propertyResources: CreatePropertyResourceDTO[]
}

interface FieldErrors {
  client_id?: string
  name?: string
  address?: string
  property_keys?: string
  property_resources?: string
}

type UploadErrorById = Record<string, string>

interface FormState {
  client_id: string
  name: string
  address: string
  lat: string
  lng: string
  bathrooms: number
  beds_single: number
  beds_queen: number
  beds_king: number
  default_cleaning_minutes: number
  includes_chocolates: boolean
  extra_towels_default_qty: number
  extra_dishcloths_default_qty: number
  notes: string
  has_keys: boolean
  active: boolean
  default_tags: PropertyTags
  property_keys: FormPropertyKey[]
  property_resources: FormPropertyResource[]
}

interface Props {
  mode?: PropertyFormMode
  property?: PropertyDTO | null
  isSubmitting?: boolean
  submitLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create',
  property: null,
  isSubmitting: false,
  submitLabel: 'Save',
})

const emit = defineEmits<{
  submit: [payload: PropertyFormSubmitPayload]
  cancel: []
  dirtyChange: [value: boolean]
}>()

const { fetchClients } = useClients()
const { uploadPropertyKeyPhotos } = useUploadPropertyKeyPhoto()
const clients = ref<ClientDTO[]>([])
const isLoadingClients = ref(false)
const keyAttachmentErrorById = ref<UploadErrorById>({})
const resourceUploadErrorById = ref<UploadErrorById>({})
const uploadingKeyAttachmentId = ref<string | null>(null)
const uploadingResourceId = ref<string | null>(null)
const initialSnapshot = ref('')
const isSyncingForm = ref(true)

const DEFAULT_PRESET_TAGS = ['one stay', 'deep clean', 'checkin', 'make sofa']
const PRESET_TAGS_STORAGE_KEY = 'daily-task-preset-tags'
const MAX_DEFAULT_TAGS = 8
const MAX_PRESET_TAGS = 8
const presetTags = useState<string[]>('daily-task-preset-tags-state', () => [...DEFAULT_PRESET_TAGS])
const defaultTagDraft = ref('')

const errors = reactive<FieldErrors>({})

const form = reactive<FormState>({
  client_id: '',
  name: '',
  address: '',
  lat: '',
  lng: '',
  bathrooms: 1,
  beds_single: 0,
  beds_queen: 0,
  beds_king: 0,
  default_cleaning_minutes: 120,
  includes_chocolates: false,
  extra_towels_default_qty: 0,
  extra_dishcloths_default_qty: 0,
  notes: '',
  has_keys: false,
  active: true,
  default_tags: [],
  property_keys: [],
  property_resources: [],
})

const canAddMoreDefaultTags = computed(() => form.default_tags.length < MAX_DEFAULT_TAGS)
const canCreateMorePresetTags = computed(() => presetTags.value.length < MAX_PRESET_TAGS)

function createItemId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function createEmptyKey(index = 0): FormPropertyKey {
  return {
    id: createItemId(),
    label: `Key ${index + 1}`,
    pickup_address: '',
    note: '',
    attachment_url: '',
  }
}

function createEmptyResource(): FormPropertyResource {
  return {
    id: createItemId(),
    resource_type: 'link',
    url: '',
    attachment_url: '',
  }
}

function resetErrors(): void {
  errors.client_id = undefined
  errors.name = undefined
  errors.address = undefined
  errors.property_keys = undefined
  errors.property_resources = undefined
}

function validateForm(): boolean {
  resetErrors()

  errors.client_id = form.client_id ? undefined : 'Please select a client.'
  errors.name = form.name.trim() ? undefined : 'Property name is required.'
  errors.address = form.address.trim() ? undefined : 'Address is required.'

  if (form.has_keys) {
    errors.property_keys = undefined
  }

  const hasIncompleteResource = form.property_resources.some((resource) => {
    const hasUrl = resource.url.trim().length > 0
    const hasAttachmentUrl = resource.attachment_url.trim().length > 0

    return resource.resource_type === 'link'
      ? !hasUrl
      : !hasAttachmentUrl
  })

  if (hasIncompleteResource) {
    errors.property_resources = 'Each resource must have a URL (for links) or file upload (for files).'
  }

  return !errors.client_id && !errors.name && !errors.address && !errors.property_keys && !errors.property_resources
}

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, ' ')
}

function normalizeTagList(tags: string[]): string[] {
  const normalized = tags.map((tag) => normalizeTag(tag)).filter((tag) => tag.length > 0)
  return Array.from(new Set(normalized))
}

function normalizeFormKeys(): CreatePropertyKeyDTO[] {
  return form.property_keys
    .map((item, index) => ({
      label: item.label.trim(),
      pickup_address: item.pickup_address.trim() || null,
      note: item.note.trim() || null,
      attachment_url: item.attachment_url.trim() || null,
      sort_order: index,
    }))
    .filter((item) => item.label.length > 0 || (item.pickup_address ?? '').length > 0 || (item.note ?? '').length > 0 || (item.attachment_url ?? '').length > 0)
}

function normalizeFormResources(): CreatePropertyResourceDTO[] {
  return form.property_resources
    .map((item, index) => ({
      resource_type: item.resource_type,
      url: item.resource_type === 'link' ? item.url.trim() : '',
      attachment_url: item.resource_type === 'attachment' ? item.attachment_url.trim() || null : null,
      sort_order: index,
    }))
    .filter((item) => (item.resource_type === 'link' && item.url.length > 0) || (item.resource_type === 'attachment' && (item.attachment_url ?? '').length > 0))
}

function createSnapshot(): string {
  return JSON.stringify({
    client_id: form.client_id,
    name: form.name,
    address: form.address,
    lat: form.lat,
    lng: form.lng,
    bathrooms: form.bathrooms,
    beds_single: form.beds_single,
    beds_queen: form.beds_queen,
    beds_king: form.beds_king,
    default_cleaning_minutes: form.default_cleaning_minutes,
    includes_chocolates: form.includes_chocolates,
    extra_towels_default_qty: form.extra_towels_default_qty,
    extra_dishcloths_default_qty: form.extra_dishcloths_default_qty,
    notes: form.notes,
    has_keys: form.has_keys,
    active: form.active,
    default_tags: form.default_tags,
    property_keys: form.property_keys,
    property_resources: form.property_resources,
  })
}

const isDirty = computed(() => createSnapshot() !== initialSnapshot.value)

function resetDirtyTracking(): void {
  initialSnapshot.value = createSnapshot()
  emit('dirtyChange', false)
}

async function syncForm(): Promise<void> {
  const property = props.property
  isSyncingForm.value = true
  resetErrors()

  if (property) {
    form.client_id = property.client_id
    form.name = property.name
    form.address = property.address
    form.lat = property.lat !== null ? String(property.lat) : ''
    form.lng = property.lng !== null ? String(property.lng) : ''
    form.bathrooms = property.bathrooms
    form.beds_single = property.beds_single
    form.beds_queen = property.beds_queen
    form.beds_king = property.beds_king
    form.default_cleaning_minutes = property.default_cleaning_minutes
    form.includes_chocolates = property.includes_chocolates
    form.extra_towels_default_qty = property.extra_towels_default_qty
    form.extra_dishcloths_default_qty = property.extra_dishcloths_default_qty
    form.notes = property.notes ?? ''
    form.has_keys = property.has_keys
    form.active = property.active
    form.default_tags = normalizeTagList(property.default_tags ?? [])
    form.property_keys = property.property_keys.length > 0
      ? property.property_keys.map((item) => ({
          id: item.id,
          label: item.label,
          pickup_address: item.pickup_address ?? '',
          note: item.note ?? '',
          attachment_url: item.attachment_url ?? '',
        }))
      : []
    form.property_resources = property.property_resources.length > 0
      ? property.property_resources.map((item) => ({
          id: item.id,
          resource_type: item.resource_type,
          url: item.url,
          attachment_url: item.attachment_url ?? '',
        }))
      : []
  } else {
    form.client_id = ''
    form.name = ''
    form.address = ''
    form.lat = ''
    form.lng = ''
    form.bathrooms = 1
    form.beds_single = 0
    form.beds_queen = 0
    form.beds_king = 0
    form.default_cleaning_minutes = 120
    form.includes_chocolates = false
    form.extra_towels_default_qty = 0
    form.extra_dishcloths_default_qty = 0
    form.notes = ''
    form.has_keys = false
    form.active = true
    form.default_tags = []
    form.property_keys = []
    form.property_resources = []
  }

  resetDirtyTracking()
  isSyncingForm.value = false
}

watch(
  () => props.property,
  () => {
    void syncForm()
  },
  { immediate: true },
)

watch(presetTags, (tags) => {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(PRESET_TAGS_STORAGE_KEY, JSON.stringify(normalizeTagList(tags)))
}, { deep: true })

watch(
  () => form.has_keys,
  (hasKeys) => {
    if (!hasKeys) {
      form.property_keys = []
      return
    }

    if (form.property_keys.length === 0) {
      form.property_keys = [createEmptyKey()]
    }
  },
)

watch(isDirty, (value) => {
  if (isSyncingForm.value) {
    return
  }

  emit('dirtyChange', value)
})

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

  isLoadingClients.value = true
  try {
    clients.value = await fetchClients()
  } finally {
    isLoadingClients.value = false
  }
})

function addKey(): void {
  form.property_keys = [...form.property_keys, createEmptyKey(form.property_keys.length)]
}

function removeKey(keyId: string): void {
  form.property_keys = form.property_keys.filter((item) => item.id !== keyId)
  delete keyAttachmentErrorById.value[keyId]
}

function removeLastKey(): void {
  if (form.property_keys.length === 0) {
    return
  }

  form.property_keys = form.property_keys.slice(0, -1)
}

function clearKeyAttachment(keyId: string): void {
  const target = form.property_keys.find((key) => key.id === keyId)

  if (!target) {
    return
  }

  target.attachment_url = ''
  keyAttachmentErrorById.value[keyId] = ''
}

function addResource(): void {
  form.property_resources = [...form.property_resources, createEmptyResource()]
}

function removeResource(resourceId: string): void {
  form.property_resources = form.property_resources.filter((item) => item.id !== resourceId)
  delete resourceUploadErrorById.value[resourceId]
}

function clearResourceAttachment(resourceId: string): void {
  const target = form.property_resources.find((resource) => resource.id === resourceId)

  if (!target) {
    return
  }

  target.attachment_url = ''
  resourceUploadErrorById.value[resourceId] = ''
}

async function uploadImageFile(file: File): Promise<string> {
  const [uploadedUrl] = await uploadPropertyKeyPhotos([file])
  if (!uploadedUrl) {
    throw new Error('Upload did not return a file URL.')
  }
  return uploadedUrl
}

async function onResourceFileChange(resourceId: string, event: Event): Promise<void> {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]

  if (!file) {
    return
  }

  resourceUploadErrorById.value[resourceId] = ''
  uploadingResourceId.value = resourceId

  try {
    assertAllowedImageType(file)
    const uploadedUrl = await uploadImageFile(file)
    const target = form.property_resources.find((resource) => resource.id === resourceId)
    if (target) {
      target.attachment_url = uploadedUrl
      target.url = ''
    }
  } catch (err: unknown) {
    resourceUploadErrorById.value[resourceId] = err instanceof Error ? err.message : 'Failed to upload resource file.'
  } finally {
    uploadingResourceId.value = null
    if (input) {
      input.value = ''
    }
  }
}

async function onKeyAttachmentFileChange(keyId: string, event: Event): Promise<void> {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]

  if (!file) {
    return
  }

  keyAttachmentErrorById.value[keyId] = ''
  uploadingKeyAttachmentId.value = keyId

  try {
    assertAllowedImageType(file)
    const uploadedUrl = await uploadImageFile(file)
    const target = form.property_keys.find((key) => key.id === keyId)
    if (target) {
      target.attachment_url = uploadedUrl
    }
  } catch (err: unknown) {
    keyAttachmentErrorById.value[keyId] = err instanceof Error ? err.message : 'Failed to upload key attachment.'
  } finally {
    uploadingKeyAttachmentId.value = null
    if (input) {
      input.value = ''
    }
  }
}

function toNullableDecimal(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const normalized = typeof value === 'number'
    ? value
    : Number(String(value).replace(',', '.').trim())

  if (!Number.isFinite(normalized)) {
    return null
  }

  return normalized
}

function toNonNegativeInt(value: unknown): number {
  if (value === null || value === undefined || value === '') {
    return 0
  }

  const normalized = typeof value === 'number'
    ? value
    : Number(String(value).replace(/[^\d-]/g, '').trim())

  if (!Number.isFinite(normalized)) {
    return 0
  }

  return Math.max(0, Math.round(normalized))
}

function toNonNegativeHalf(value: unknown): number {
  if (value === null || value === undefined || value === '') {
    return 0
  }

  const normalized = typeof value === 'number'
    ? value
    : Number(String(value).replace(',', '.').trim())

  if (!Number.isFinite(normalized)) {
    return 0
  }

  return Math.max(0, Math.round(normalized * 2) / 2)
}

function isDefaultTagSelected(tag: string): boolean {
  return form.default_tags.includes(normalizeTag(tag))
}

function toggleDefaultPresetTag(tag: string): void {
  const normalizedTag = normalizeTag(tag)
  if (!normalizedTag) {
    return
  }

  if (form.default_tags.includes(normalizedTag)) {
    removeDefaultTag(normalizedTag)
    return
  }

  if (!canAddMoreDefaultTags.value) {
    return
  }

  form.default_tags = [...form.default_tags, normalizedTag]
}

function removePresetTag(tag: string): void {
  const normalizedTag = normalizeTag(tag)
  presetTags.value = presetTags.value.filter((t) => t !== normalizedTag)
}

function addOrCreateDefaultTag(): void {
  const normalizedTag = normalizeTag(defaultTagDraft.value)
  if (!normalizedTag || !canAddMoreDefaultTags.value) {
    return
  }

  const presetExists = presetTags.value.includes(normalizedTag)

  if (!presetExists) {
    if (!canCreateMorePresetTags.value) {
      return
    }
    presetTags.value = normalizeTagList([...presetTags.value, normalizedTag])
  }

  if (!form.default_tags.includes(normalizedTag)) {
    form.default_tags = [...form.default_tags, normalizedTag]
  }

  defaultTagDraft.value = ''
}

function removeDefaultTag(tag: string): void {
  form.default_tags = form.default_tags.filter((t) => t !== tag)
}

async function onSubmit(): Promise<void> {
  if (!validateForm()) {
    return
  }

  const propertyKeys = form.has_keys ? normalizeFormKeys() : []
  const propertyResources = normalizeFormResources()
  const lat = toNullableDecimal(form.lat)
  const lng = toNullableDecimal(form.lng)
  const bathrooms = toNonNegativeHalf(form.bathrooms)
  const bedsSingle = toNonNegativeInt(form.beds_single)
  const bedsQueen = toNonNegativeInt(form.beds_queen)
  const bedsKing = toNonNegativeInt(form.beds_king)
  const defaultCleaningMinutes = toNonNegativeInt(form.default_cleaning_minutes)
  const extraTowelsDefaultQty = toNonNegativeInt(form.extra_towels_default_qty)
  const extraDishclothsDefaultQty = toNonNegativeInt(form.extra_dishcloths_default_qty)

  const payload: PropertyFormPayload = {
    client_id: form.client_id,
    name: form.name.trim(),
    address: form.address.trim(),
    lat,
    lng,
    bathrooms,
    beds_single: bedsSingle,
    beds_queen: bedsQueen,
    beds_king: bedsKing,
    default_cleaning_minutes: defaultCleaningMinutes,
    includes_chocolates: form.includes_chocolates,
    extra_towels_default_qty: extraTowelsDefaultQty,
    extra_dishcloths_default_qty: extraDishclothsDefaultQty,
    notes: form.notes.trim() || null,
    has_keys: form.has_keys,
    key_count: propertyKeys.length,
    active: form.active,
    default_tags: normalizeTagList(form.default_tags),
  }

  emit('submit', {
    property: payload,
    propertyKeys,
    propertyResources,
  })
}
</script>
