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
  })

  router.onError((error, to) => {
    if (window.navigator.onLine) {
      return
    }

    if (!isChunkLoadError(error)) {
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
