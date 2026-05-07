<template>
  <div class="space-y-2.5 rounded-2xl border border-primary-100/80 bg-gradient-to-r from-primary-50/70 via-white/85 to-primary-warm-50/70 p-2.5 shadow-sm dark:border-white/10 dark:bg-gradient-to-r dark:from-primary-500/10 dark:via-white/[0.04] dark:to-primary-warm-500/10">
    <div class="flex items-center gap-1.5 rounded-xl border border-primary-100/80 bg-white/70 p-1 dark:border-white/10 dark:bg-white/[0.02]">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        class="flex-1 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide transition"
        :class="selectedFilter === option.value
          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-[0_8px_16px_rgba(37,99,235,0.28)]'
          : 'text-muted hover:bg-primary-500/10 hover:text-foreground'"
        :disabled="disabled"
        @click="emit('update:filter', option.value)"
      >
        {{ option.label }}
      </button>
    </div>

    <div class="mx-auto grid w-full max-w-sm grid-cols-[2.5rem_1fr_2.5rem] items-center gap-2">
      <button
        type="button"
        class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary-200/80 bg-white/80 text-sm font-semibold text-primary-700 shadow-sm transition hover:bg-primary-500/10 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.05] dark:text-primary-300 dark:hover:bg-white/10"
        aria-label="Previous period"
        :disabled="disabled"
        @click="emit('previous')"
      >
        &lt;
      </button>

      <p class="text-center text-sm font-semibold tracking-tight text-foreground">{{ rangeLabel }}</p>

      <button
        type="button"
        class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary-200/80 bg-white/80 text-sm font-semibold text-primary-700 shadow-sm transition hover:bg-primary-500/10 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.05] dark:text-primary-300 dark:hover:bg-white/10"
        aria-label="Next period"
        :disabled="disabled"
        @click="emit('next')"
      >
        &gt;
      </button>
    </div>

    <div class="flex justify-center pt-0.5">
      <button
        type="button"
        class="inline-flex items-center rounded-full border border-primary-200/80 bg-white/85 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary-700 transition hover:bg-primary-500/10 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-primary-300 dark:hover:bg-white/10"
        :disabled="disabled"
        @click="emit('current')"
      >
        {{ currentLabel }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface FilterOption {
  value: 'week' | 'month' | 'year'
  label: string
}

interface Props {
  selectedFilter: 'week' | 'month' | 'year'
  rangeLabel: string
  currentLabel: string
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  disabled: false,
})

const emit = defineEmits<{
  'update:filter': ['week' | 'month' | 'year']
  previous: []
  next: []
  current: []
}>()

const options: FilterOption[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
]
</script>
