<template>
  <div class="min-h-screen w-full max-w-full overflow-x-hidden">
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'

let rafId = 0
let timeoutIds: number[] = []
let previousScrollRestoration: History['scrollRestoration'] | null = null

const resetViewportOffsets = () => {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  document.scrollingElement?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  document.documentElement.scrollLeft = 0
  document.body.scrollLeft = 0
}

const clearScheduledResets = () => {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }

  timeoutIds.forEach((timeoutId) => {
    window.clearTimeout(timeoutId)
  })
  timeoutIds = []
}

const scheduleViewportReset = () => {
  clearScheduledResets()

  rafId = window.requestAnimationFrame(() => {
    resetViewportOffsets()

    timeoutIds = [90, 240, 600].map((delay) => {
      return window.setTimeout(() => {
        resetViewportOffsets()
      }, delay)
    })
  })
}

const handlePageShow = () => {
  scheduleViewportReset()
}

const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    scheduleViewportReset()
  }
}

const handleViewportGeometryChange = () => {
  scheduleViewportReset()
}

onMounted(() => {
  if ('scrollRestoration' in history) {
    previousScrollRestoration = history.scrollRestoration
    history.scrollRestoration = 'manual'
  }

  window.addEventListener('pageshow', handlePageShow)
  window.addEventListener('resize', handleViewportGeometryChange, { passive: true })
  window.addEventListener('orientationchange', handleViewportGeometryChange)
  window.visualViewport?.addEventListener('resize', handleViewportGeometryChange)
  window.visualViewport?.addEventListener('scroll', handleViewportGeometryChange)
  document.addEventListener('visibilitychange', handleVisibilityChange)

  scheduleViewportReset()
})

onBeforeUnmount(() => {
  clearScheduledResets()

  window.removeEventListener('pageshow', handlePageShow)
  window.removeEventListener('resize', handleViewportGeometryChange)
  window.removeEventListener('orientationchange', handleViewportGeometryChange)
  window.visualViewport?.removeEventListener('resize', handleViewportGeometryChange)
  window.visualViewport?.removeEventListener('scroll', handleViewportGeometryChange)
  document.removeEventListener('visibilitychange', handleVisibilityChange)

  if (previousScrollRestoration) {
    history.scrollRestoration = previousScrollRestoration
  }
})
</script>
