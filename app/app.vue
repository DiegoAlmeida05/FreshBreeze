<template>
  <div>
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isLoading"
        class="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-0 bg-black"
      >
        <img
          src="/logo/fb.png"
          alt="FreshBreeze loading"
          class="h-72 w-72 object-contain sm:h-84 sm:w-84"
        />
        <p class="text-sm font-medium tracking-wide text-primary-600">Loading FreshBreeze...</p>
      </div>
    </Transition>

    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const isLoading = ref(true)
const nuxtApp = useNuxtApp()

let hideTimer: ReturnType<typeof setTimeout> | undefined
let unhookPageStart: (() => void) | undefined
let unhookPageFinish: (() => void) | undefined
let unhookAppError: (() => void) | undefined

function showLoading() {
  if (hideTimer) {
    clearTimeout(hideTimer)
  }
  isLoading.value = true
}

function hideLoading() {
  if (hideTimer) {
    clearTimeout(hideTimer)
  }

  // Keep the loader visible briefly to avoid flicker on fast navigations.
  hideTimer = setTimeout(() => {
    isLoading.value = false
  }, 250)
}

onMounted(() => {
  hideLoading()

  unhookPageStart = nuxtApp.hook('page:start', () => {
    showLoading()
  })

  unhookPageFinish = nuxtApp.hook('page:finish', () => {
    hideLoading()
  })

  unhookAppError = nuxtApp.hook('app:error', () => {
    hideLoading()
  })
})

onBeforeUnmount(() => {
  if (hideTimer) {
    clearTimeout(hideTimer)
  }
  unhookPageStart?.()
  unhookPageFinish?.()
  unhookAppError?.()
})
</script>
