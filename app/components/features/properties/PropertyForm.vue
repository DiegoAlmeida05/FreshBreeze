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
          <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Operational flags</p>

          <label class="mt-3 inline-flex cursor-pointer items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
            <input
              id="property-includes-chocolates"
              v-model="form.includes_chocolates"
              type="checkbox"
              class="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
            />
            Include chocolate
          </label>
          <p class="mt-2 text-xs text-muted">Operational only: does not generate invoice charges unless Chocolate is selected as a pricing item.</p>
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
        <h3 class="form-section-title">Item Pricing</h3>
        <p class="mt-1 text-xs text-muted">Select pricing items to define what is included in each clean and which recurring extras apply.</p>
      </div>

      <!-- Amenities toggle -->
      <div class="rounded-xl border border-border/80 bg-surface p-3.5">
        <label class="flex cursor-pointer items-center gap-3">
          <input
            id="property-includes-amenities"
            v-model="form.includes_amenities"
            type="checkbox"
            class="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
          />
          <div>
            <p class="text-sm font-semibold text-foreground">Includes amenities</p>
            <p class="text-xs text-muted">When unchecked, all amenities items and amenities pack fee are ignored for this property.</p>
          </div>
        </label>
      </div>

      <!-- Pack fees -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="rounded-xl border border-border/80 bg-surface p-3.5">
          <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Pack fees</p>
          <p class="mb-3 text-xs text-muted">Applied once per group (never multiplied by quantity).</p>
          <div class="space-y-3">
            <div>
              <label for="property-linen-pack-fee" class="mb-1.5 block text-xs font-medium text-foreground">Linen pack fee</label>
              <div class="relative">
                <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
                <input
                  id="property-linen-pack-fee"
                  v-model="form.linen_pack_fee"
                  type="text"
                  inputmode="decimal"
                  class="input-base pl-7 pr-3 text-right tabular-nums"
                  placeholder="0.00"
                />
              </div>
              <p v-if="errors.linen_pack_fee" class="mt-1 text-xs text-error-600">{{ errors.linen_pack_fee }}</p>
            </div>
            <div>
              <label for="property-amenities-pack-fee" class="mb-1.5 block text-xs font-medium text-foreground">Amenities pack fee</label>
              <div class="relative">
                <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
                <input
                  id="property-amenities-pack-fee"
                  v-model="form.amenities_pack_fee"
                  type="text"
                  inputmode="decimal"
                  class="input-base pl-7 pr-3 text-right tabular-nums"
                  placeholder="0.00"
                />
              </div>
              <p v-if="errors.amenities_pack_fee" class="mt-1 text-xs text-error-600">{{ errors.amenities_pack_fee }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Base items -->
      <div>
        <div class="mb-2 flex items-center justify-between gap-2">
          <div>
            <p class="text-sm font-semibold text-foreground">Base items</p>
            <p class="text-xs text-muted">Included in every clean for this property.</p>
          </div>
        </div>

        <div v-if="form.base_items.length === 0" class="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-4 text-sm text-muted">
          No base items added.
        </div>

        <div v-else class="mb-3 space-y-2">
          <div
            v-for="(entry, index) in form.base_items"
            :key="entry.id"
            class="flex items-center gap-2 rounded-lg border border-border/80 bg-surface p-2.5"
          >
            <div class="relative flex-1">
              <input
                v-model="entry.item_search_query"
                type="text"
                class="input-base !py-1.5 text-sm"
                placeholder="Search item..."
                autocomplete="off"
                @focus="activePricingItemPickerEntryId = entry.id"
                @input="onPricingItemSearchInput(entry)"
                @blur="onPricingItemSearchBlur(entry)"
              />

              <div
                v-if="activePricingItemPickerEntryId === entry.id"
                class="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-primary-100 bg-surface p-1 shadow-lg dark:border-white/10"
              >
                <button
                  v-for="pricingItem in getFilteredPricingItems(entry.item_search_query, entry.pricing_item_id)"
                  :key="pricingItem.id"
                  type="button"
                  class="block w-full rounded-md px-2 py-2 text-left text-sm text-foreground transition hover:bg-primary-50/70 dark:hover:bg-white/10"
                  @mousedown.prevent="selectPricingItem(entry, pricingItem)"
                >
                  <p class="font-medium">{{ pricingItem.name }}</p>
                  <p class="text-xs text-muted">{{ pricingItem.category }} · ${{ pricingItem.unit_price.toFixed(2) }}</p>
                </button>

                <p v-if="getFilteredPricingItems(entry.item_search_query, entry.pricing_item_id).length === 0" class="px-2 py-2 text-xs text-muted">
                  No items found.
                </p>
              </div>
            </div>
            <input
              v-model.number="entry.quantity"
              type="number"
              min="1"
              step="1"
              class="input-base w-20 text-center !py-1.5 tabular-nums"
              placeholder="1"
              aria-label="Quantity"
            />
            <div class="hidden min-w-[108px] text-right text-xs text-muted sm:block">
              ${{ lineTotalForPropertyItem(entry.pricing_item_id, entry.quantity).toFixed(2) }}
            </div>
            <button
              type="button"
              class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-error-600 transition hover:bg-error-100/50 dark:text-error-400 dark:hover:bg-error-500/10"
              aria-label="Remove base item"
              @click="removeBaseItem(index)"
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
          :disabled="isLoadingPricingItems || availablePricingItemsForProperty.length === 0"
          @click="addBaseItem"
        >
          {{ isLoadingPricingItems ? 'Loading items...' : '+ Add base item' }}
        </button>

        <button
          type="button"
          class="btn-outline !px-3 !py-1.5 text-xs"
          :disabled="isLoadingPricingSets || availablePricingSetsForProperty.length === 0"
          @click="openApplySetModal('base')"
        >
          {{ isLoadingPricingSets ? 'Loading sets...' : '+ Apply set' }}
        </button>
      </div>

      <!-- Default extra items -->
      <div>
        <div class="mb-2">
          <p class="text-sm font-semibold text-foreground">Default extra items</p>
          <p class="text-xs text-muted">Recurring extras added on top of the base for this property.</p>
        </div>

        <div v-if="form.default_extra_items.length === 0" class="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-4 text-sm text-muted">
          No default extra items added.
        </div>

        <div v-else class="mb-3 space-y-2">
          <div
            v-for="(entry, index) in form.default_extra_items"
            :key="entry.id"
            class="flex items-center gap-2 rounded-lg border border-border/80 bg-surface p-2.5"
          >
            <div class="relative flex-1">
              <input
                v-model="entry.item_search_query"
                type="text"
                class="input-base !py-1.5 text-sm"
                placeholder="Search item..."
                autocomplete="off"
                @focus="activePricingItemPickerEntryId = entry.id"
                @input="onPricingItemSearchInput(entry)"
                @blur="onPricingItemSearchBlur(entry)"
              />

              <div
                v-if="activePricingItemPickerEntryId === entry.id"
                class="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-primary-100 bg-surface p-1 shadow-lg dark:border-white/10"
              >
                <button
                  v-for="pricingItem in getFilteredPricingItems(entry.item_search_query, entry.pricing_item_id)"
                  :key="pricingItem.id"
                  type="button"
                  class="block w-full rounded-md px-2 py-2 text-left text-sm text-foreground transition hover:bg-primary-50/70 dark:hover:bg-white/10"
                  @mousedown.prevent="selectPricingItem(entry, pricingItem)"
                >
                  <p class="font-medium">{{ pricingItem.name }}</p>
                  <p class="text-xs text-muted">{{ pricingItem.category }} · ${{ pricingItem.unit_price.toFixed(2) }}</p>
                </button>

                <p v-if="getFilteredPricingItems(entry.item_search_query, entry.pricing_item_id).length === 0" class="px-2 py-2 text-xs text-muted">
                  No items found.
                </p>
              </div>
            </div>
            <input
              v-model.number="entry.quantity"
              type="number"
              min="1"
              step="1"
              class="input-base w-20 text-center !py-1.5 tabular-nums"
              placeholder="1"
              aria-label="Quantity"
            />
            <div class="hidden min-w-[108px] text-right text-xs text-muted sm:block">
              ${{ lineTotalForPropertyItem(entry.pricing_item_id, entry.quantity).toFixed(2) }}
            </div>
            <button
              type="button"
              class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-error-600 transition hover:bg-error-100/50 dark:text-error-400 dark:hover:bg-error-500/10"
              aria-label="Remove default extra item"
              @click="removeDefaultExtraItem(index)"
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
          :disabled="isLoadingPricingItems || availablePricingItemsForProperty.length === 0"
          @click="addDefaultExtraItem"
        >
          {{ isLoadingPricingItems ? 'Loading items...' : '+ Add default extra item' }}
        </button>

        <button
          type="button"
          class="btn-outline !px-3 !py-1.5 text-xs"
          :disabled="isLoadingPricingSets || availablePricingSetsForProperty.length === 0"
          @click="openApplySetModal('default_extra')"
        >
          {{ isLoadingPricingSets ? 'Loading sets...' : '+ Apply set' }}
        </button>
      </div>

      <div class="rounded-xl border border-border/80 bg-surface p-3.5">
        <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Pricing preview</p>
        <div class="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div class="rounded-lg border border-border/70 bg-muted/10 p-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-muted">Base</p>
            <p class="mt-2 flex items-center justify-between"><span>Linen</span><span class="tabular-nums">${{ propertyPricingPreview.baseLinen.toFixed(2) }}</span></p>
            <p class="mt-1 flex items-center justify-between"><span>Amenities</span><span class="tabular-nums">${{ propertyPricingPreview.baseAmenities.toFixed(2) }}</span></p>
          </div>
          <div class="rounded-lg border border-border/70 bg-muted/10 p-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-muted">Default extras</p>
            <p class="mt-2 flex items-center justify-between"><span>Linen</span><span class="tabular-nums">${{ propertyPricingPreview.extraLinen.toFixed(2) }}</span></p>
            <p class="mt-1 flex items-center justify-between"><span>Amenities</span><span class="tabular-nums">${{ propertyPricingPreview.extraAmenities.toFixed(2) }}</span></p>
          </div>
        </div>
        <div class="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div class="rounded-lg border border-border/70 bg-muted/10 p-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-muted">Pack fees applied</p>
            <p class="mt-2 text-xs text-muted">Linen base: {{ propertyPricingPreview.baseLinen > 0 ? 'Yes' : 'No' }}</p>
            <p class="mt-1 text-xs text-muted">Linen extras: {{ propertyPricingPreview.extraLinen > 0 ? 'Yes' : 'No' }}</p>
            <p class="mt-1 text-xs text-muted">Amenities base: {{ form.includes_amenities && propertyPricingPreview.baseAmenities > 0 ? 'Yes' : 'No' }}</p>
            <p class="mt-1 text-xs text-muted">Amenities extras: {{ form.includes_amenities && propertyPricingPreview.extraAmenities > 0 ? 'Yes' : 'No' }}</p>
          </div>
          <div class="rounded-lg border border-border/70 bg-muted/10 p-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-muted">Totals with pack fees</p>
            <p class="mt-2 flex items-center justify-between"><span>Linen total</span><span class="tabular-nums">${{ propertyPricingPreview.linenTotal.toFixed(2) }}</span></p>
            <p class="mt-1 flex items-center justify-between"><span>Amenities total</span><span class="tabular-nums">${{ propertyPricingPreview.amenitiesTotal.toFixed(2) }}</span></p>
          </div>
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

    <Teleport to="body">
      <div v-if="isApplySetModalOpen" class="modal-backdrop z-[100]" @click.self="closeApplySetModal">
        <div class="modal-surface max-w-md">
          <div class="modal-header">
            <h3 class="text-base font-semibold text-foreground">Apply set to {{ applySetScopeLabel }}</h3>
            <button type="button" class="btn-outline !px-3 !py-1.5" @click="closeApplySetModal">Close</button>
          </div>
          <div class="modal-body space-y-4">
            <div>
              <label for="property-apply-set" class="mb-1.5 block text-sm font-medium text-foreground">Set</label>
              <select id="property-apply-set" v-model="selectedPricingSetId" class="select-base">
                <option value="">Select set</option>
                <option v-for="pricingSet in availablePricingSetsForProperty" :key="pricingSet.id" :value="pricingSet.id">
                  {{ pricingSet.name }} · {{ pricingSet.items.length }} item(s)
                </option>
              </select>
            </div>

            <p class="text-xs text-muted">The selected set expands into pricing items in this section. Existing item quantities are summed.</p>

            <div class="flex justify-end gap-2">
              <button type="button" class="btn-outline" @click="closeApplySetModal">Cancel</button>
              <button type="button" class="btn-primary" :disabled="!selectedPricingSetId" @click="applySelectedPricingSet">Apply set</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </form>
</template>

<script setup lang="ts">
import { useState } from '#imports'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import type { ClientDTO } from '../../../../shared/types/ClientDTO'
import type { PricingItemDTO, PropertyPricingItemDTO, PropertyPricingItemInput, PropertyPricingItemScope } from '../../../../shared/types/PricingItemDTO'
import type { PricingSetDTO } from '../../../../shared/types/PricingSetDTO'
import type {
  CreatePropertyDTO,
  CreatePropertyKeyDTO,
  CreatePropertyResourceDTO,
  PropertyDTO,
  PropertyResourceType,
  PropertyTags,
  UpdatePropertyDTO,
} from '../../../../shared/types/PropertyDTO'
import { usePricingItems } from '../../../composables/usePricingItems'
import { usePricingSets } from '../../../composables/usePricingSets'
import { useClients } from '../../../composables/useClients'
import { usePropertyPricingItems } from '../../../composables/usePropertyPricingItems'
import { useUploadPropertyKeyPhoto } from '../../../composables/useUploadPropertyKeyPhoto'
import { calculatePricingItems } from '../../../utils/calculatePricingItems'
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

interface FormComboEntry {
  id: string
  pricing_item_id: string
  item_search_query: string
  quantity: number
}

export interface PropertyFormSubmitPayload {
  property: PropertyFormPayload
  pricingItems: PropertyPricingItemInput[]
  propertyKeys: CreatePropertyKeyDTO[]
  propertyResources: CreatePropertyResourceDTO[]
}

interface FieldErrors {
  client_id?: string
  name?: string
  address?: string
  linen_pack_fee?: string
  amenities_pack_fee?: string
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
  linen_pack_fee: string
  amenities_pack_fee: string
  includes_amenities: boolean
  includes_chocolates: boolean
  extra_towels_default_qty: number
  extra_dishcloths_default_qty: number
  notes: string
  has_keys: boolean
  active: boolean
  default_tags: PropertyTags
  property_keys: FormPropertyKey[]
  property_resources: FormPropertyResource[]
  base_items: FormComboEntry[]
  default_extra_items: FormComboEntry[]
}

interface Props {
  mode?: PropertyFormMode
  property?: PropertyDTO | null
  isSubmitting?: boolean
  submitLabel?: string
  draftKey?: string
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
const { fetchActivePricingItems } = usePricingItems()
const { fetchActivePricingSets } = usePricingSets()
const { getPropertyPricingItems } = usePropertyPricingItems()
const { uploadPropertyKeyPhotos } = useUploadPropertyKeyPhoto()
const clients = ref<ClientDTO[]>([])
const activePricingItems = ref<PricingItemDTO[]>([])
const activePricingSets = ref<PricingSetDTO[]>([])
const isLoadingClients = ref(false)
const isLoadingPricingItems = ref(false)
const isLoadingPricingSets = ref(false)
const keyAttachmentErrorById = ref<UploadErrorById>({})
const resourceUploadErrorById = ref<UploadErrorById>({})
const uploadingKeyAttachmentId = ref<string | null>(null)
const uploadingResourceId = ref<string | null>(null)
const activePricingItemPickerEntryId = ref<string | null>(null)
const isApplySetModalOpen = ref(false)
const applySetTargetScope = ref<PropertyPricingItemScope | null>(null)
const selectedPricingSetId = ref('')
const initialSnapshot = ref('')
const isSyncingForm = ref(true)
let draftSaveTimer: ReturnType<typeof setTimeout> | null = null

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
  linen_pack_fee: '0.00',
  amenities_pack_fee: '0.00',
  includes_amenities: true,
  includes_chocolates: false,
  extra_towels_default_qty: 0,
  extra_dishcloths_default_qty: 0,
  notes: '',
  has_keys: false,
  active: true,
  default_tags: [],
  property_keys: [],
  property_resources: [],
  base_items: [],
  default_extra_items: [],
})

const canAddMoreDefaultTags = computed(() => form.default_tags.length < MAX_DEFAULT_TAGS)
const canCreateMorePresetTags = computed(() => presetTags.value.length < MAX_PRESET_TAGS)
const availablePricingItemsForProperty = computed(() => {
  if (form.includes_amenities) {
    return activePricingItems.value
  }

  return activePricingItems.value.filter((pricingItem) => pricingItem.category !== 'amenities')
})

const availablePricingSetsForProperty = computed(() => {
  const availablePricingItemIds = new Set(availablePricingItemsForProperty.value.map((pricingItem) => pricingItem.id))

  return activePricingSets.value.filter((pricingSet) => {
    if (!pricingSet.active) {
      return false
    }

    return pricingSet.items.some((item) => availablePricingItemIds.has(item.pricing_item_id))
  })
})

const applySetScopeLabel = computed(() => {
  return applySetTargetScope.value === 'base' ? 'base items' : 'default extra items'
})

const propertyPricingPreview = computed(() => {
  const pricingItemById = new Map(activePricingItems.value.map((pricingItem) => [pricingItem.id, pricingItem]))

  const toPreviewRows = (entries: FormComboEntry[], scope: 'base' | 'default_extra'): PropertyPricingItemDTO[] => {
    return entries
      .map((entry) => {
        const pricingItem = pricingItemById.get(entry.pricing_item_id)

        if (!pricingItem || entry.quantity <= 0) {
          return null
        }

        return {
          id: entry.id,
          property_id: props.property?.id ?? '',
          pricing_item_id: pricingItem.id,
          scope,
          quantity: Math.max(1, Number(entry.quantity ?? 1)),
          pricing_item: {
            id: pricingItem.id,
            name: pricingItem.name,
            category: pricingItem.category,
            unit_price: pricingItem.unit_price,
            active: pricingItem.active,
          },
          created_at: '',
          updated_at: '',
        }
      })
      .filter((row): row is PropertyPricingItemDTO => Boolean(row))
  }

  const linenPackFee = parseMoneyInput(form.linen_pack_fee)
  const amenitiesPackFee = parseMoneyInput(form.amenities_pack_fee)

  return calculatePricingItems({
    propertyBaseItems: toPreviewRows(form.base_items, 'base'),
    propertyDefaultExtraItems: toPreviewRows(form.default_extra_items, 'default_extra'),
    taskExtraItems: [],
    linenPackFee: Number.isFinite(linenPackFee) ? linenPackFee : 0,
    amenitiesPackFee: Number.isFinite(amenitiesPackFee) ? amenitiesPackFee : 0,
    includesAmenities: form.includes_amenities,
  })
})
const resolvedDraftKey = computed(() => {
  if (props.draftKey) {
    return `property-form:${props.draftKey}`
  }

  if (props.mode === 'edit' && props.property?.id) {
    return `property-form:edit:${props.property.id}`
  }

  return 'property-form:create'
})

function createItemId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

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
  if (!import.meta.client || isSyncingForm.value) {
    return
  }

  if (draftSaveTimer) {
    clearTimeout(draftSaveTimer)
  }

  draftSaveTimer = setTimeout(() => {
    const snapshot: FormState = {
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
      linen_pack_fee: form.linen_pack_fee,
      amenities_pack_fee: form.amenities_pack_fee,
      includes_amenities: form.includes_amenities,
      includes_chocolates: form.includes_chocolates,
      extra_towels_default_qty: form.extra_towels_default_qty,
      extra_dishcloths_default_qty: form.extra_dishcloths_default_qty,
      notes: form.notes,
      has_keys: form.has_keys,
      active: form.active,
      default_tags: [...form.default_tags],
      property_keys: form.property_keys.map((item) => ({ ...item })),
      property_resources: form.property_resources.map((item) => ({ ...item })),
      base_items: form.base_items.map((item) => ({ ...item })),
      default_extra_items: form.default_extra_items.map((item) => ({ ...item })),
    }

    window.localStorage.setItem(resolvedDraftKey.value, JSON.stringify(snapshot))
    draftSaveTimer = null
  }, 500)
}

function applyDraftIfAvailable(): void {
  const draft = readDraft()
  if (!draft) {
    return
  }

  isSyncingForm.value = true

  if (typeof draft.client_id === 'string') form.client_id = draft.client_id
  if (typeof draft.name === 'string') form.name = draft.name
  if (typeof draft.address === 'string') form.address = draft.address
  if (typeof draft.lat === 'string') form.lat = draft.lat
  if (typeof draft.lng === 'string') form.lng = draft.lng
  if (typeof draft.bathrooms === 'number') form.bathrooms = draft.bathrooms
  if (typeof draft.beds_single === 'number') form.beds_single = draft.beds_single
  if (typeof draft.beds_queen === 'number') form.beds_queen = draft.beds_queen
  if (typeof draft.beds_king === 'number') form.beds_king = draft.beds_king
  if (typeof draft.default_cleaning_minutes === 'number') form.default_cleaning_minutes = draft.default_cleaning_minutes
  if (typeof draft.linen_pack_fee === 'string') form.linen_pack_fee = draft.linen_pack_fee
  if (typeof draft.amenities_pack_fee === 'string') form.amenities_pack_fee = draft.amenities_pack_fee
  if (typeof draft.includes_amenities === 'boolean') form.includes_amenities = draft.includes_amenities
  if (typeof draft.includes_chocolates === 'boolean') form.includes_chocolates = draft.includes_chocolates
  if (typeof draft.extra_towels_default_qty === 'number') form.extra_towels_default_qty = draft.extra_towels_default_qty
  if (typeof draft.extra_dishcloths_default_qty === 'number') form.extra_dishcloths_default_qty = draft.extra_dishcloths_default_qty
  if (typeof draft.notes === 'string') form.notes = draft.notes
  if (typeof draft.has_keys === 'boolean') form.has_keys = draft.has_keys
  if (typeof draft.active === 'boolean') form.active = draft.active
  if (Array.isArray(draft.default_tags)) form.default_tags = normalizeTagList(draft.default_tags)
  if (Array.isArray(draft.property_keys)) form.property_keys = draft.property_keys.map((item) => ({ ...item, id: item.id || createItemId() }))
  if (Array.isArray(draft.property_resources)) form.property_resources = draft.property_resources.map((item) => ({ ...item, id: item.id || createItemId() }))
  if (Array.isArray(draft.base_items)) form.base_items = draft.base_items.map((item) => ({ ...item, id: item.id || createItemId() }))
  if (Array.isArray(draft.default_extra_items)) form.default_extra_items = draft.default_extra_items.map((item) => ({ ...item, id: item.id || createItemId() }))

  syncPricingItemsSearchText()
  resetDirtyTracking()
  isSyncingForm.value = false
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

function createEmptyPricingItemEntry(defaultPricingItemId = ''): FormComboEntry {
  return {
    id: createItemId(),
    pricing_item_id: defaultPricingItemId,
    item_search_query: getPricingItemDisplay(defaultPricingItemId),
    quantity: 1,
  }
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

  return availablePricingItemsForProperty.value.find((pricingItem) => pricingItem.name.toLowerCase() === normalized) ?? null
}

function getFilteredPricingItems(query: string, selectedPricingItemId = ''): PricingItemDTO[] {
  const normalized = query.trim().toLowerCase()
  let result = availablePricingItemsForProperty.value

  if (normalized) {
    result = result.filter((pricingItem) => pricingItem.name.toLowerCase().includes(normalized))
  }

  if (selectedPricingItemId && !result.some((pricingItem) => pricingItem.id === selectedPricingItemId)) {
    const selected = availablePricingItemsForProperty.value.find((pricingItem) => pricingItem.id === selectedPricingItemId)
    if (selected) {
      result = [selected, ...result]
    }
  }

  return result
}

function selectPricingItem(entry: FormComboEntry, pricingItem: PricingItemDTO): void {
  entry.pricing_item_id = pricingItem.id
  entry.item_search_query = getPricingItemDisplay(pricingItem.id)
  activePricingItemPickerEntryId.value = null
}

function onPricingItemSearchInput(entry: FormComboEntry): void {
  activePricingItemPickerEntryId.value = entry.id
  const exact = findPricingItemByName(entry.item_search_query)
  entry.pricing_item_id = exact?.id ?? ''
}

function onPricingItemSearchBlur(entry: FormComboEntry): void {
  window.setTimeout(() => {
    if (activePricingItemPickerEntryId.value === entry.id) {
      activePricingItemPickerEntryId.value = null
    }

    if (!entry.pricing_item_id) {
      const exact = findPricingItemByName(entry.item_search_query)
      if (exact) {
        selectPricingItem(entry, exact)
        return
      }

      entry.item_search_query = ''
      return
    }

    entry.item_search_query = getPricingItemDisplay(entry.pricing_item_id)
  }, 120)
}

function syncPricingItemsSearchText(): void {
  form.base_items = form.base_items.map((entry) => ({
    ...entry,
    item_search_query: getPricingItemDisplay(entry.pricing_item_id),
  }))

  form.default_extra_items = form.default_extra_items.map((entry) => ({
    ...entry,
    item_search_query: getPricingItemDisplay(entry.pricing_item_id),
  }))
}

function addBaseItem(): void {
  form.base_items = [...form.base_items, createEmptyPricingItemEntry('')]
}

function removeBaseItem(index: number): void {
  form.base_items = form.base_items.filter((_, itemIndex) => itemIndex !== index)
}

function addDefaultExtraItem(): void {
  form.default_extra_items = [...form.default_extra_items, createEmptyPricingItemEntry('')]
}

function openApplySetModal(scope: PropertyPricingItemScope): void {
  applySetTargetScope.value = scope
  selectedPricingSetId.value = availablePricingSetsForProperty.value[0]?.id ?? ''
  isApplySetModalOpen.value = true
}

function closeApplySetModal(): void {
  isApplySetModalOpen.value = false
  applySetTargetScope.value = null
  selectedPricingSetId.value = ''
}

function applyPricingSetToEntries(entries: FormComboEntry[], pricingSet: PricingSetDTO): FormComboEntry[] {
  const availablePricingItemIds = new Set(availablePricingItemsForProperty.value.map((pricingItem) => pricingItem.id))
  const nextEntries = [...entries]

  for (const item of pricingSet.items) {
    if (!availablePricingItemIds.has(item.pricing_item_id)) {
      continue
    }

    const existing = nextEntries.find((entry) => entry.pricing_item_id === item.pricing_item_id)
    if (existing) {
      existing.quantity += Math.max(1, Number(item.quantity ?? 1))
      existing.item_search_query = getPricingItemDisplay(existing.pricing_item_id)
      continue
    }

    nextEntries.push({
      id: createItemId(),
      pricing_item_id: item.pricing_item_id,
      item_search_query: getPricingItemDisplay(item.pricing_item_id),
      quantity: Math.max(1, Number(item.quantity ?? 1)),
    })
  }

  return nextEntries
}

function applySelectedPricingSet(): void {
  if (!applySetTargetScope.value) {
    return
  }

  const pricingSet = availablePricingSetsForProperty.value.find((item) => item.id === selectedPricingSetId.value)
  if (!pricingSet) {
    return
  }

  if (applySetTargetScope.value === 'base') {
    form.base_items = applyPricingSetToEntries(form.base_items, pricingSet)
  } else {
    form.default_extra_items = applyPricingSetToEntries(form.default_extra_items, pricingSet)
  }

  closeApplySetModal()
}

function removeDefaultExtraItem(index: number): void {
  form.default_extra_items = form.default_extra_items.filter((_, itemIndex) => itemIndex !== index)
}

function lineTotalForPropertyItem(pricingItemId: string, quantity: number): number {
  const pricingItem = activePricingItems.value.find((item) => item.id === pricingItemId)
  if (!pricingItem) {
    return 0
  }

  return Number((pricingItem.unit_price * Math.max(1, Number(quantity ?? 1))).toFixed(2))
}

function resetErrors(): void {
  errors.client_id = undefined
  errors.name = undefined
  errors.address = undefined
  errors.linen_pack_fee = undefined
  errors.amenities_pack_fee = undefined
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

  const linenPackFee = parseMoneyInput(form.linen_pack_fee)
  if (!Number.isFinite(linenPackFee) || linenPackFee < 0) {
    errors.linen_pack_fee = 'Enter a valid value.'
  }

  const amenitiesPackFee = parseMoneyInput(form.amenities_pack_fee)
  if (!Number.isFinite(amenitiesPackFee) || amenitiesPackFee < 0) {
    errors.amenities_pack_fee = 'Enter a valid value.'
  }

  return !errors.client_id
    && !errors.name
    && !errors.address
    && !errors.linen_pack_fee
    && !errors.amenities_pack_fee
    && !errors.property_keys
    && !errors.property_resources
}

function toMoneyInput(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : '0.00'
}

function parseMoneyInput(value: string): number {
  const normalized = value.replace(',', '.').trim()
  const numeric = Number.parseFloat(normalized)
  return Number.isFinite(numeric) ? numeric : NaN
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

function normalizeFormPricingItems(): PropertyPricingItemInput[] {
  const normalized = new Map<string, PropertyPricingItemInput>()

  const appendEntries = (entries: FormComboEntry[], scope: 'base' | 'default_extra') => {
    for (const entry of entries) {
      const pricingItemId = entry.pricing_item_id.trim()
      const quantity = toNonNegativeInt(entry.quantity)
      if (!pricingItemId || quantity <= 0) {
        continue
      }

      const key = `${scope}:${pricingItemId}`
      const current = normalized.get(key)
      if (current) {
        current.quantity += quantity
      } else {
        normalized.set(key, {
          pricing_item_id: pricingItemId,
          scope,
          quantity,
        })
      }
    }
  }

  appendEntries(form.base_items, 'base')
  appendEntries(form.default_extra_items, 'default_extra')

  return Array.from(normalized.values())
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
    linen_pack_fee: form.linen_pack_fee,
    amenities_pack_fee: form.amenities_pack_fee,
    includes_amenities: form.includes_amenities,
    includes_chocolates: form.includes_chocolates,
    extra_towels_default_qty: form.extra_towels_default_qty,
    extra_dishcloths_default_qty: form.extra_dishcloths_default_qty,
    notes: form.notes,
    has_keys: form.has_keys,
    active: form.active,
    default_tags: form.default_tags,
    property_keys: form.property_keys,
    property_resources: form.property_resources,
    base_items: form.base_items,
    default_extra_items: form.default_extra_items,
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
    form.linen_pack_fee = toMoneyInput(property.linen_pack_fee)
    form.amenities_pack_fee = toMoneyInput(property.amenities_pack_fee)
    form.includes_amenities = property.includes_amenities
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

    if (property.id) {
      const propertyPricingItems = await getPropertyPricingItems(property.id)
      form.base_items = propertyPricingItems
        .filter((item) => item.scope === 'base')
        .map((item) => ({
          id: createItemId(),
          pricing_item_id: item.pricing_item_id,
          item_search_query: getPricingItemDisplay(item.pricing_item_id),
          quantity: Math.max(1, Number(item.quantity ?? 1)),
        }))
      form.default_extra_items = propertyPricingItems
        .filter((item) => item.scope === 'default_extra')
        .map((item) => ({
          id: createItemId(),
          pricing_item_id: item.pricing_item_id,
          item_search_query: getPricingItemDisplay(item.pricing_item_id),
          quantity: Math.max(1, Number(item.quantity ?? 1)),
        }))
    } else {
      form.base_items = []
      form.default_extra_items = []
    }
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
    form.linen_pack_fee = '0.00'
    form.amenities_pack_fee = '0.00'
    form.includes_amenities = true
    form.includes_chocolates = false
    form.extra_towels_default_qty = 0
    form.extra_dishcloths_default_qty = 0
    form.notes = ''
    form.has_keys = false
    form.active = true
    form.default_tags = []
    form.property_keys = []
    form.property_resources = []
    form.base_items = []
    form.default_extra_items = []
  }

  resetDirtyTracking()
  isSyncingForm.value = false
  applyDraftIfAvailable()
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

watch(
  () => form.includes_amenities,
  (includesAmenities) => {
    if (includesAmenities) {
      return
    }

    const amenitiesItemIds = new Set(activePricingItems.value.filter((pricingItem) => pricingItem.category === 'amenities').map((pricingItem) => pricingItem.id))
    form.base_items = form.base_items.filter((entry) => !amenitiesItemIds.has(entry.pricing_item_id))
    form.default_extra_items = form.default_extra_items.filter((entry) => !amenitiesItemIds.has(entry.pricing_item_id))

    syncPricingItemsSearchText()
  },
)

watch(activePricingItems, () => {
  syncPricingItemsSearchText()
}, { deep: true })

watch(
  () => ({ form: createSnapshot(), key: resolvedDraftKey.value }),
  () => {
    scheduleDraftSave()
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
  isLoadingPricingItems.value = true
  isLoadingPricingSets.value = true
  try {
    const [loadedClients, loadedPricingItems, loadedPricingSets] = await Promise.all([
      fetchClients(),
      fetchActivePricingItems(),
      fetchActivePricingSets(),
    ])

    clients.value = loadedClients
    activePricingItems.value = loadedPricingItems
    activePricingSets.value = loadedPricingSets
    syncPricingItemsSearchText()
  } finally {
    isLoadingClients.value = false
    isLoadingPricingItems.value = false
    isLoadingPricingSets.value = false
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
  const linenPackFee = parseMoneyInput(form.linen_pack_fee)
  const amenitiesPackFee = parseMoneyInput(form.amenities_pack_fee)
  const extraTowelsDefaultQty = 0
  const extraDishclothsDefaultQty = 0
  const pricingItems = normalizeFormPricingItems()

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
    linen_combo_extra_price: 0,
    amenities_combo_extra_price: 0,
    linen_queen_extra_price: 0,
    linen_single_extra_price: 0,
    linen_king_extra_price: 0,
    towel_extra_price: 0,
    chocolate_extra_price: 0,
    linen_pack_fee: linenPackFee,
    amenities_pack_fee: amenitiesPackFee,
    includes_amenities: form.includes_amenities,
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
    pricingItems,
    propertyKeys,
    propertyResources,
  })

  clearDraft()
}

onBeforeUnmount(() => {
  if (draftSaveTimer) {
    clearTimeout(draftSaveTimer)
    draftSaveTimer = null
  }
})
</script>
