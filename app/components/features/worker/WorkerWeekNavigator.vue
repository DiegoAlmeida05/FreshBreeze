<template>
  <section class="space-y-2 rounded-xl border border-primary-100 bg-gradient-to-r from-primary-50/60 via-surface to-primary-warm-50/60 p-3 dark:border-white/10 dark:from-[#1b2534] dark:via-[#182231] dark:to-[#212d3d]">
    <div class="flex flex-wrap items-center gap-2">
      <div class="flex items-center gap-1.5">
        <button
          type="button"
          class="btn-outline !px-2.5 !py-1.5 text-xs"
          aria-label="Previous week"
          @click="emit('shift-week', -1)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        <input
          :value="modelValue"
          type="date"
          class="input-base w-full max-w-[170px] !py-1 !text-xs [color-scheme:light] dark:[color-scheme:dark]"
          @input="onDateInput"
        >

        <button
          type="button"
          class="btn-outline !px-2.5 !py-1.5 text-xs"
          aria-label="Next week"
          @click="emit('shift-week', 1)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      <button
        type="button"
        class="btn-outline !px-2 !py-1 text-[11px]"
        @click="emit('go-today')"
      >
        This Week
      </button>

      <p class="text-[10px] font-medium uppercase tracking-wide text-muted">
        {{ label }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string
  label: string
}

defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'shift-week': [delta: number]
  'go-today': []
}>()

function onDateInput(event: Event): void {
  const target = event.target as HTMLInputElement | null
  emit('update:modelValue', target?.value ?? '')
}
</script>
