<template>
  <article
    class="relative cursor-pointer overflow-hidden rounded-xl border bg-surface shadow-card transition hover:shadow-md dark:border-white/10"
    :style="cardStyle"
    role="button"
    tabindex="0"
    @click="emit('openDetails')"
    @keydown.enter.prevent="emit('openDetails')"
    @keydown.space.prevent="emit('openDetails')"
  >
    <!-- Header: order badge, group label, GO button -->
    <div class="flex items-center justify-between px-4 pb-2 pt-3">
      <div class="flex items-center gap-2">
        <span
          class="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold"
          :style="orderBadgeStyle"
        >
          {{ item.orderIndex + 1 }}
        </span>
        <span
          class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide"
          :style="groupBadgeStyle"
        >
          Team {{ item.groupLabel }}
        </span>
      </div>

      <a
        v-if="mapsUrl"
        :href="mapsUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white shadow-sm transition active:scale-95"
        :style="`background-color: ${item.clientColor};`"
        :aria-label="'Navigate to ' + item.propertyName"
        @click.stop
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          class="h-3.5 w-3.5"
          aria-hidden="true"
        >
          <path
            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
          />
        </svg>
        GO
      </a>
      <span
        v-else
        class="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-bold text-white/90 opacity-70"
        title="No location data available for this property"
        @click.stop
      >
        GO
      </span>
    </div>

    <div class="space-y-2.5 px-4 pb-4">
      <!-- Property name + address -->
      <div>
        <p class="text-sm font-semibold leading-tight text-foreground">
          {{ item.propertyName }}
        </p>
        <p class="mt-0.5 truncate text-[12px] text-muted" :title="item.clientName">
          {{ item.clientName }}
        </p>
        <p class="mt-0.5 truncate text-[12px] text-muted" :title="item.address">
          {{ item.address }}
        </p>
      </div>

      <div class="mt-1.5 flex items-start justify-between gap-3">
        <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted">
          <span class="font-semibold text-foreground/90">{{ roomSummary }}</span>
        </div>
        <div class="shrink-0 text-right text-[11px] font-semibold leading-tight text-foreground/90">
          <p>{{ item.cleaningMinutes }} min</p>
          <p v-if="item.plannedStartTime && item.plannedEndTime">{{ item.plannedStartTime }} - {{ item.plannedEndTime }}</p>
        </div>
      </div>

      <!-- Task type + tags -->
      <div class="flex flex-wrap gap-1.5">
        <span
          v-if="item.taskType === 'BSB'"
          class="inline-flex rounded-full border border-warning/30 bg-warning/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning"
        >
          BSB
        </span>
        <span
          v-for="tag in visibleTags"
          :key="tag"
          class="inline-flex rounded-full border border-primary-200/70 bg-foreground/8 px-2 py-0.5 text-[10px] font-medium text-muted dark:border-white/15"
        >
          {{ tag }}
        </span>
      </div>

      <!-- Extras: towels, chocolates, note indicator -->
      <div
        v-if="linenSummaryLabel || chocolates.totalChocolates > 0 || item.notes"
        class="flex flex-wrap items-center gap-1.5"
      >
        <span
          v-if="linenSummaryLabel"
          class="inline-flex items-center gap-1 rounded-full border border-primary-200/70 bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-primary-700 dark:border-white/15 dark:text-primary-300"
          :title="linenSummaryTitle"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-3 w-3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="6" width="18" height="12" rx="2" />
            <path d="M7 10h10" />
            <path d="M7 14h6" />
          </svg>
          {{ linenSummaryLabel }}
        </span>

        <span
          v-if="chocolates.totalChocolates > 0"
          class="inline-flex rounded-full border border-primary-200/70 bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-primary-700 dark:border-white/15 dark:text-primary-300"
          :title="`${chocolates.baseChocolates} base + ${chocolates.extraChocolates} extra = ${chocolates.totalChocolates} chocolates`"
        >
          🍫 {{ chocolates.totalChocolates }}
        </span>

        <span
          v-if="item.notes"
          class="inline-flex items-center gap-1 rounded-full border border-primary-200/70 bg-foreground/8 px-2 py-0.5 text-[10px] font-medium text-muted dark:border-white/15"
          :title="item.notes"
        >
          📝 Note
        </span>
      </div>

    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ScheduleItem } from '../../../composables/useWorkerSchedule'
import { calculateChocolates } from '../../../utils/calculateChocolates'
import { buildVisibleTaskTags } from '../../../utils/visualTaskTags'

const props = defineProps<{
  item: ScheduleItem
}>()

const emit = defineEmits<{
  openDetails: []
}>()

function hexToRgbParts(hex: string): string | null {
  const cleaned = hex.replace('#', '')
  if (cleaned.length !== 6) return null
  const r = parseInt(cleaned.slice(0, 2), 16)
  const g = parseInt(cleaned.slice(2, 4), 16)
  const b = parseInt(cleaned.slice(4, 6), 16)
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null
  return `${r}, ${g}, ${b}`
}

const rgbParts = computed(() => hexToRgbParts(props.item.clientColor) ?? '99, 102, 241')

const cardStyle = computed(
  () => `border-left: 4px solid ${props.item.clientColor};`,
)

const orderBadgeStyle = computed(
  () =>
    `background: rgba(${rgbParts.value}, 0.15); color: ${props.item.clientColor};`,
)

const groupBadgeStyle = computed(
  () =>
    `background: rgba(${rgbParts.value}, 0.12); color: ${props.item.clientColor};`,
)

const mapsUrl = computed(() => {
  const { propertyLat, propertyLng, address } = props.item

  if (propertyLat !== null && propertyLng !== null) {
    const latLng = `${propertyLat},${propertyLng}`
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(latLng)}`
  }

  const trimmedAddress = address?.trim()
  if (trimmedAddress) {
    return `https://maps.google.com/?q=${encodeURIComponent(trimmedAddress)}`
  }

  return ''
})

const chocolates = computed(() =>
  calculateChocolates({
    includesChocolates: props.item.includesChocolates,
    bedsSingle: props.item.bedsSingle,
    bedsQueen: props.item.bedsQueen,
    bedsKing: props.item.bedsKing,
    extraBedsSingle: props.item.extraBedsSingle,
    extraBedsQueen: props.item.extraBedsQueen,
    extraBedsKing: props.item.extraBedsKing,
    extraChocolatesQty: props.item.extraChocolatesQty,
  }),
)

const roomSummary = computed(() => {
  const parts: string[] = []
  const bedsSingle = Number(props.item.bedsSingle)
  const bedsQueen = Number(props.item.bedsQueen)
  const bedsKing = Number(props.item.bedsKing)
  const bathrooms = Number(props.item.bathrooms)

  if (bedsSingle > 0) parts.push(`${bedsSingle}S`)
  if (bedsQueen > 0) parts.push(`${bedsQueen}Q`)
  if (bedsKing > 0) parts.push(`${bedsKing}K`)
  if (bathrooms > 0) parts.push(`${bathrooms}B`)

  return parts.join(' | ') || '—'
})

const towelsSummaryTotal = computed(() => Number(props.item.extraTowelsQty))
const dishclothsDefaultQty = computed(() => Number(props.item.extraDishclothsDefaultQty ?? 0))

const linenSummaryLabel = computed(() => {
  const parts: string[] = []
  if (towelsSummaryTotal.value > 0) {
    parts.push(`Tw ${towelsSummaryTotal.value}`)
  }
  if (dishclothsDefaultQty.value > 0) {
    parts.push(`Dc ${dishclothsDefaultQty.value}`)
  }

  return parts.join(' • ')
})

const linenSummaryTitle = computed(() => {
  const parts: string[] = []
  if (towelsSummaryTotal.value > 0) {
    parts.push(`Extra towels ${towelsSummaryTotal.value}`)
  }
  if (dishclothsDefaultQty.value > 0) {
    parts.push(`Default dishcloths ${dishclothsDefaultQty.value}`)
  }

  return parts.join(' • ')
})

const visibleTags = computed(() => {
  return buildVisibleTaskTags(props.item.tags, props.item.propertyDefaultTags)
})
</script>
