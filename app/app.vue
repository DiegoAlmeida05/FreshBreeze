<template>
  <div class="min-h-screen w-full max-w-full overflow-x-hidden">
    <NuxtRouteAnnouncer />

    <div
      v-if="shouldShowStartupShell"
      class="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-surface-soft via-primary-50/30 to-primary-warm-50/30 px-6 dark:bg-black dark:bg-none"
    >
      <div class="pointer-events-none absolute -left-16 top-16 h-56 w-56 rounded-full bg-primary-500/10 blur-3xl dark:bg-white/5" />
      <div class="pointer-events-none absolute -right-20 bottom-16 h-64 w-64 rounded-full bg-primary-warm-500/10 blur-3xl dark:bg-white/5" />

      <section class="relative z-10 w-full max-w-sm rounded-[30px] border border-white/65 bg-white/78 px-6 py-10 text-center shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.03] dark:shadow-[0_24px_60px_rgba(0,0,0,0.38)]">
        <img
          src="/logo/logo_escrito_transparente.png"
          alt="FreshBreeze"
          class="mx-auto h-auto w-full max-w-[220px] object-contain"
        />
        <div class="mt-6 flex items-center justify-center gap-2 text-sm text-muted">
          <div class="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          Restoring your workspace...
        </div>
      </section>
    </div>

    <NuxtPage v-else />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useAuthBootstrap } from './composables/useAuthBootstrap'

const route = useRoute()
const router = useRouter()
const startupReady = useState<boolean>('app-startup-ready', () => false)
const shellLayoutMode = useState<'mobile' | 'desktop'>('app-shell-layout-mode', () => 'mobile')
const { waitForAuthBootstrap } = useAuthBootstrap()

const STARTUP_HARD_TIMEOUT_MS = 2000
const STARTUP_DEBUG = true

let rafId = 0
let timeoutIds: number[] = []
let previousScrollRestoration: History['scrollRestoration'] | null = null
let startupResolvePromise: Promise<void> | null = null

const logStartup = (message: string, extra?: Record<string, unknown>) => {
  if (!import.meta.client || !STARTUP_DEBUG) {
    return
  }

  if (extra) {
    console.info('[startup-gate]', message, extra)
    return
  }

  console.info('[startup-gate]', message)
}

const requiresProtectedShell = computed(() => {
  return route.path.startsWith('/admin') || route.path.startsWith('/worker')
})

const shouldShowStartupShell = computed(() => {
  return requiresProtectedShell.value && !startupReady.value
})

const syncShellLayoutMode = () => {
  if (!import.meta.client) {
    return
  }

  shellLayoutMode.value = window.innerWidth >= 1024 ? 'desktop' : 'mobile'
}

const waitForAnimationFrames = async (count: number) => {
  for (let index = 0; index < count; index += 1) {
    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => {
        resolve()
      })
    })
  }
}

const forceStartupReady = (reason: string) => {
  syncShellLayoutMode()

  if (!startupReady.value) {
    startupReady.value = true
    logStartup('forced render fallback', {
      reason,
      route: route.fullPath,
      authBootstrapping: useState<boolean>('auth-bootstrap-loading', () => false).value,
      shellLayoutMode: shellLayoutMode.value,
    })
  }
}

const withTimeout = async (label: string, task: () => Promise<void>, timeoutMs: number): Promise<void> => {
  let resolved = false

  await Promise.race([
    (async () => {
      try {
        await task()
        resolved = true
      } catch (error) {
        logStartup(`${label} failed`, {
          error: error instanceof Error ? error.message : String(error),
        })
      }
    })(),
    new Promise<void>((resolve) => {
      window.setTimeout(() => {
        if (!resolved) {
          logStartup(`${label} timeout`, { timeoutMs })
        }
        resolve()
      }, timeoutMs)
    }),
  ])
}

const resolveStartup = async () => {
  if (!import.meta.client || startupReady.value) {
    return
  }

  if (startupResolvePromise) {
    await startupResolvePromise
    return
  }

  startupResolvePromise = (async () => {
    const hardTimeoutId = window.setTimeout(() => {
      forceStartupReady('hard-timeout')
    }, STARTUP_HARD_TIMEOUT_MS)

    try {
      logStartup('startup begin', {
        route: route.fullPath,
        protected: requiresProtectedShell.value,
      })

      await withTimeout('router-ready', async () => {
        await router.isReady()
      }, 1200)

      logStartup('router resolved')
      syncShellLayoutMode()

      await withTimeout('auth-bootstrap', async () => {
        await waitForAuthBootstrap(1500)
      }, 1600)

      logStartup('auth bootstrap resolved', {
        authBootstrapping: useState<boolean>('auth-bootstrap-loading', () => false).value,
      })

      await withTimeout('animation-frames', async () => {
        await waitForAnimationFrames(2)
      }, 120)

      syncShellLayoutMode()
      scheduleViewportReset()

      if (!startupReady.value) {
        startupReady.value = true
        logStartup('startup ready', {
          shellLayoutMode: shellLayoutMode.value,
          route: route.fullPath,
        })
      }
    } catch (error) {
      logStartup('unexpected startup error', {
        error: error instanceof Error ? error.message : String(error),
      })
      forceStartupReady('startup-exception')
    } finally {
      window.clearTimeout(hardTimeoutId)
      startupResolvePromise = null
    }
  })()

  await startupResolvePromise
}

const resetViewportOffsets = () => {
  syncShellLayoutMode()
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
  void resolveStartup()
})

watch(() => route.fullPath, () => {
  if (!startupReady.value) {
    void resolveStartup()
  }
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
