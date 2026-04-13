<template>
  <Teleport v-if="floating" to="body">
    <div class="pointer-events-none fixed inset-x-0 top-4 z-[130] flex justify-end px-4 sm:top-6 sm:px-6">
      <div
        class="pointer-events-auto w-full max-w-2xl rounded-2xl border px-4 py-3 shadow-soft backdrop-blur-sm sm:w-auto sm:min-w-[24rem]"
        :class="containerClass"
        role="alert"
        aria-live="polite"
      >
        <div class="flex items-start gap-3">
          <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" :class="iconContainerClass">
            <svg v-if="tone === 'success'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4.5 w-4.5">
              <path d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.5-1.5z" />
            </svg>
            <svg v-else-if="tone === 'warning'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4.5 w-4.5">
              <path d="M12 2 1 21h22L12 2zm1 15h-2v-2h2v2zm0-4h-2V9h2v4z" />
            </svg>
            <svg v-else-if="tone === 'error'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4.5 w-4.5">
              <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm4 13.59L14.59 17 12 14.41 9.41 17 8 15.59 10.59 13 8 10.41 9.41 9 12 11.59 14.59 9 16 10.41 13.41 13z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4.5 w-4.5">
              <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm1 15h-2v-6h2zm0-8h-2V7h2z" />
            </svg>
          </div>
          <div class="min-w-0 flex-1">
            <p v-if="title" class="font-semibold leading-5" :class="titleClass">
              {{ title }}
            </p>
            <p class="leading-5" :class="messageClass">
              {{ message }}
            </p>
          </div>
          <button
            v-if="dismissible"
            type="button"
            class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition hover:bg-black/5 dark:hover:bg-white/10"
            :aria-label="dismissLabel"
            :title="dismissLabel"
            @click="emit('dismiss')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
              <path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.41L10.59 13.41 4.29 19.7 2.88 18.29 9.17 12 2.88 5.71 4.29 4.3l6.3 6.29 6.29-6.3z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <div
    v-else
    class="rounded-2xl border px-4 py-3 shadow-soft backdrop-blur-sm"
    :class="containerClass"
    role="alert"
    aria-live="polite"
  >
    <div class="flex items-start gap-3">
      <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" :class="iconContainerClass">
        <svg v-if="tone === 'success'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4.5 w-4.5">
          <path d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.5-1.5z" />
        </svg>
        <svg v-else-if="tone === 'warning'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4.5 w-4.5">
          <path d="M12 2 1 21h22L12 2zm1 15h-2v-2h2v2zm0-4h-2V9h2v4z" />
        </svg>
        <svg v-else-if="tone === 'error'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4.5 w-4.5">
          <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm4 13.59L14.59 17 12 14.41 9.41 17 8 15.59 10.59 13 8 10.41 9.41 9 12 11.59 14.59 9 16 10.41 13.41 13z" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4.5 w-4.5">
          <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm1 15h-2v-6h2zm0-8h-2V7h2z" />
        </svg>
      </div>
      <div class="min-w-0 flex-1">
        <p v-if="title" class="font-semibold leading-5" :class="titleClass">
          {{ title }}
        </p>
        <p class="leading-5" :class="messageClass">
          {{ message }}
        </p>
      </div>
      <button
        v-if="dismissible"
        type="button"
        class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition hover:bg-black/5 dark:hover:bg-white/10"
        :aria-label="dismissLabel"
        :title="dismissLabel"
        @click="emit('dismiss')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
          <path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.41L10.59 13.41 4.29 19.7 2.88 18.29 9.17 12 2.88 5.71 4.29 4.3l6.3 6.29 6.29-6.3z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type FeedbackTone = 'success' | 'error' | 'warning' | 'info'

interface Props {
  tone?: FeedbackTone
  title?: string
  message: string
  floating?: boolean
  dismissible?: boolean
  dismissLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  tone: 'info',
  title: '',
  floating: false,
  dismissible: false,
  dismissLabel: 'Dismiss message',
})

const emit = defineEmits<{
  dismiss: []
}>()

const containerClass = computed(() => {
  switch (props.tone) {
    case 'success':
      return 'border-success/25 bg-gradient-to-r from-success/12 via-success/8 to-surface'
    case 'warning':
      return 'border-warning/25 bg-gradient-to-r from-warning/15 via-warning/8 to-surface'
    case 'error':
      return 'border-danger/25 bg-gradient-to-r from-danger/12 via-danger/8 to-surface'
    default:
      return 'border-primary-200/60 bg-gradient-to-r from-primary-50 via-surface to-primary-warm-50/40'
  }
})

const iconContainerClass = computed(() => {
  switch (props.tone) {
    case 'success':
      return 'bg-success/15 text-success'
    case 'warning':
      return 'bg-warning/15 text-warning'
    case 'error':
      return 'bg-danger/15 text-danger'
    default:
      return 'bg-primary-500/12 text-primary-700'
  }
})

const titleClass = computed(() => {
  switch (props.tone) {
    case 'success':
      return 'text-success'
    case 'warning':
      return 'text-warning'
    case 'error':
      return 'text-danger'
    default:
      return 'text-foreground'
  }
})

const messageClass = computed(() => {
  switch (props.tone) {
    case 'success':
      return 'text-success/90'
    case 'warning':
      return 'text-warning/90'
    case 'error':
      return 'text-danger/90'
    default:
      return 'text-muted'
  }
})
</script>