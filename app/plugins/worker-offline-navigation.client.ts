import { navigateTo, preloadRouteComponents, useRouter } from '#imports'

type WorkerOfflineRouteNotice = {
  visible: boolean
  message: string
  targetPath: string
  at: number
}

const WORKER_ROUTES = [
  '/worker/dashboard',
  '/worker/timesheet',
  '/worker/schedule',
  '/worker/invoice',
  '/worker/settings',
] as const

function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|Cannot find module/i.test(message)
}

function runInIdle(task: () => void): void {
  if (!import.meta.client) {
    return
  }

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(task, { timeout: 1800 })
    return
  }

  window.setTimeout(task, 120)
}

export default defineNuxtPlugin(() => {
  if (!import.meta.client) {
    return
  }

  const router = useRouter()
  const offlineRouteNotice = useState<WorkerOfflineRouteNotice>('worker-offline-route-notice', () => ({
    visible: false,
    message: '',
    targetPath: '',
    at: 0,
  }))
  const preloadedRoutes = new Set<string>()

  const preloadWorkerRoutes = (): void => {
    if (!window.navigator.onLine) {
      return
    }

    runInIdle(() => {
      for (const routePath of WORKER_ROUTES) {
        if (preloadedRoutes.has(routePath)) {
          continue
        }

        preloadedRoutes.add(routePath)
        void preloadRouteComponents(routePath).catch(() => {
          // Fail silently to avoid interrupting navigation.
        })
      }
    })
  }

  preloadWorkerRoutes()
  window.addEventListener('online', preloadWorkerRoutes)

  const ONLINE_CHUNK_RECOVERY_KEY = 'chunk-error-recovery-v1'

  router.afterEach((to) => {
    if (to.path.startsWith('/worker') && offlineRouteNotice.value.visible && offlineRouteNotice.value.targetPath === to.path) {
      offlineRouteNotice.value = {
        visible: false,
        message: '',
        targetPath: '',
        at: Date.now(),
      }
    }

    if (to.path.startsWith('/worker')) {
      preloadWorkerRoutes()
    }

    // Clear the chunk recovery flag after a successful navigation, so the guard
    // can fire again if a different chunk fails in the same session.
    if (sessionStorage.getItem(ONLINE_CHUNK_RECOVERY_KEY)) {
      sessionStorage.removeItem(ONLINE_CHUNK_RECOVERY_KEY)
    }
  })

  router.onError((error, to) => {
    if (!isChunkLoadError(error)) {
      return
    }

    if (window.navigator.onLine) {
      // Online chunk error means the browser is loading a stale HTML with old
      // chunk hashes (from a previous deploy). Force a hard reload to fetch
      // fresh HTML and correct chunks. Guard against reload loops with a
      // session-scoped flag that is cleared on successful navigation.
      const alreadyAttempted = sessionStorage.getItem(ONLINE_CHUNK_RECOVERY_KEY)
      if (!alreadyAttempted) {
        sessionStorage.setItem(ONLINE_CHUNK_RECOVERY_KEY, '1')
        const targetPath = to?.fullPath ?? to?.path ?? '/'
        window.location.replace(targetPath)
      }
      return
    }

    const targetPath = to?.path ?? ''

    if (!targetPath.startsWith('/worker')) {
      return
    }

    offlineRouteNotice.value = {
      visible: true,
      message: 'Offline - this screen was not loaded yet. Reconnect once to open it offline.',
      targetPath,
      at: Date.now(),
    }

    const currentPath = router.currentRoute.value.path
    if (!currentPath.startsWith('/worker')) {
      void navigateTo('/worker/schedule', { replace: true })
    }
  })
})
