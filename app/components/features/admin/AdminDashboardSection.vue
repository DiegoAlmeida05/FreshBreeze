<template>
  <section
    class="rounded-2xl border p-4 shadow-sm backdrop-blur-sm transition sm:p-5"
    :class="toneClass"
  >
    <header class="flex items-center justify-between gap-3">
      <div>
        <h3 class="text-sm font-semibold text-foreground sm:text-base">{{ title }}</h3>
        <p v-if="description" class="mt-0.5 text-xs text-muted">{{ description }}</p>
      </div>

      <button
        v-if="collapsible"
        type="button"
        class="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition hover:bg-primary-100/70 hover:text-foreground dark:hover:bg-white/10"
        :aria-label="isOpen ? 'Collapse section' : 'Expand section'"
        @click="emit('toggle')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-4 w-4 transition-transform"
          :class="isOpen ? '' : '-rotate-90'"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
    </header>

    <div v-show="isOpen" class="mt-3.5">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title: string
  description?: string
  isOpen?: boolean
  collapsible?: boolean
  highlight?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  description: '',
  isOpen: true,
  collapsible: true,
  highlight: false,
})

const emit = defineEmits<{
  toggle: []
}>()

const toneClass = computed(() => {
  if (props.highlight) {
    return 'border-primary-200/80 bg-gradient-to-br from-primary-50/80 via-white/85 to-primary-warm-50/75 shadow-[0_12px_28px_rgba(37,99,235,0.12)] dark:border-primary-400/30 dark:bg-gradient-to-br dark:from-primary-500/12 dark:via-white/[0.04] dark:to-primary-warm-500/10'
  }

  return 'border-primary-100/80 bg-white/75 dark:border-white/10 dark:bg-white/[0.03]'
})
</script>
