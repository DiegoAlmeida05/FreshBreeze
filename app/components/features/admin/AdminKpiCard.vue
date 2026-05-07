<template>
  <component
    :is="clickable ? 'button' : 'article'"
    type="button"
    class="group relative w-full overflow-hidden rounded-2xl border p-4 text-left backdrop-blur-sm transition duration-300"
    :class="[
      toneClass,
      clickable
        ? 'hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(15,23,42,0.12)] active:translate-y-0'
        : '',
      active ? 'ring-2 ring-primary-300/70 dark:ring-primary-400/60' : '',
    ]"
    @click="onClick"
  >
    <div class="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-primary-500/10 blur-2xl dark:bg-primary-300/15" />

    <div class="relative flex items-start justify-between gap-3">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-[0.13em] text-primary-700/85 dark:text-primary-300/85">
          {{ title }}
        </p>

        <p class="mt-2 text-3xl font-bold leading-none tracking-tight text-foreground sm:text-[1.95rem]">
          {{ value }}
        </p>

        <p v-if="subtitle" class="mt-1.5 text-[11px] font-medium text-muted">
          {{ subtitle }}
        </p>
      </div>

      <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary-200/70 bg-white/80 text-primary-700 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-primary-300">
        <svg v-if="icon === 'properties'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4.5 w-4.5">
          <path d="m3 10 9-7 9 7" />
          <path d="M5 9.5V20h14V9.5" />
          <path d="M10 20v-6h4v6" />
        </svg>
        <svg v-else-if="icon === 'employees'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4.5 w-4.5">
          <circle cx="9" cy="8" r="3" />
          <path d="M3 19a6 6 0 0 1 12 0" />
          <path d="M17 11a2.5 2.5 0 1 0 0-5" />
          <path d="M21 19a4.5 4.5 0 0 0-4.5-4.5" />
        </svg>
        <svg v-else-if="icon === 'clients'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4.5 w-4.5">
          <circle cx="12" cy="8" r="3" />
          <path d="M4 19a8 8 0 0 1 16 0" />
        </svg>
        <svg v-else-if="icon === 'planning'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4.5 w-4.5">
          <path d="M4 19h16" />
          <path d="M6 16V9" />
          <path d="M12 16V6" />
          <path d="M18 16v-4" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4.5 w-4.5">
          <path d="M12 3v18" />
          <path d="M17 8h-7a2 2 0 1 1 0-4h6" />
          <path d="M7 16h7a2 2 0 1 1 0 4H8" />
        </svg>
      </span>
    </div>

    <p v-if="meta" class="relative mt-2 text-[10px] font-medium uppercase tracking-wide text-muted/90">
      {{ meta }}
    </p>

    <div v-if="$slots.footer" class="relative mt-3">
      <slot name="footer" />
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type KpiTone = 'default' | 'success' | 'warning' | 'info'

interface Props {
  title: string
  value: string
  subtitle?: string
  meta?: string
  tone?: KpiTone
  icon?: 'properties' | 'employees' | 'clients' | 'planning' | 'financial'
  clickable?: boolean
  active?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: '',
  meta: '',
  tone: 'default',
  icon: 'properties',
  clickable: false,
  active: false,
})

const emit = defineEmits<{
  select: []
}>()

const toneClass = computed(() => {
  if (props.tone === 'success') {
    return 'border-success/25 bg-gradient-to-br from-success/12 via-white/85 to-surface shadow-[0_10px_24px_rgba(21,128,61,0.12)] dark:from-success/10 dark:via-white/[0.05] dark:to-white/[0.03]'
  }

  if (props.tone === 'warning') {
    return 'border-warning/30 bg-gradient-to-br from-warning/12 via-white/85 to-surface shadow-[0_10px_24px_rgba(202,138,4,0.12)] dark:from-warning/10 dark:via-white/[0.05] dark:to-white/[0.03]'
  }

  if (props.tone === 'info') {
    return 'border-primary-200/80 bg-gradient-to-br from-primary-100/60 via-white/85 to-primary-warm-50/55 shadow-[0_10px_24px_rgba(37,99,235,0.11)] dark:from-primary-500/12 dark:via-white/[0.05] dark:to-primary-warm-500/10'
  }

  return 'border-primary-100/80 bg-gradient-to-br from-white/92 via-white/82 to-primary-50/45 shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-white/10 dark:from-white/[0.06] dark:via-white/[0.04] dark:to-white/[0.03]'
})

function onClick(): void {
  if (!props.clickable) {
    return
  }

  emit('select')
}
</script>
