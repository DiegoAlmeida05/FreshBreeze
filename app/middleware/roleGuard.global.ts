import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useAuthBootstrap } from '../composables/useAuthBootstrap'
import { useSupabaseClient } from '../composables/useSupabaseClient'

const REMEMBER_MODE_KEY = 'auth-remember-mode'
const SESSION_ACTIVE_KEY = 'auth-session-active'
const AUTH_GUARD_TIMEOUT_MS = 1800
const RUNTIME_INSTANCE_KEY = 'app-runtime-instance-id'
const COLD_START_PENDING_KEY = 'app-cold-start-pending'

interface AuthProfile {
  role: 'admin' | 'worker'
  active: boolean
}

interface LaunchContext {
  isStandalone: boolean
  isColdStart: boolean
  coldStartPending: boolean
  instanceId: string
}

function logRoleGuard(message: string, extra?: Record<string, unknown>): void {
  if (!import.meta.client) {
    return
  }

  if (extra) {
    console.info('[role-guard]', message, extra)
    return
  }

  console.info('[role-guard]', message)
}

function getStorageItem(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

function setStorageItem(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value)
  } catch {
    // Ignore storage write failures to avoid blocking auth guard.
  }
}

function removeStorageItem(storage: Storage, key: string): void {
  try {
    storage.removeItem(key)
  } catch {
    // Ignore storage remove failures to avoid blocking auth guard.
  }
}

function detectStandaloneMode(): boolean {
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  return iosStandalone || window.matchMedia('(display-mode: standalone)').matches
}

function ensureLaunchContextState(): LaunchContext {
  const launchContextState = useState<LaunchContext>('app-launch-context', () => ({
    isStandalone: false,
    isColdStart: false,
    coldStartPending: false,
    instanceId: '',
  }))

  if (launchContextState.value.instanceId) {
    return launchContextState.value
  }

  const storedInstanceId = getStorageItem(sessionStorage, RUNTIME_INSTANCE_KEY)
  const isColdStart = !storedInstanceId
  const instanceId = storedInstanceId ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

  setStorageItem(sessionStorage, RUNTIME_INSTANCE_KEY, instanceId)

  if (isColdStart) {
    setStorageItem(sessionStorage, COLD_START_PENDING_KEY, '1')
  }

  launchContextState.value = {
    isStandalone: detectStandaloneMode(),
    isColdStart,
    coldStartPending: getStorageItem(sessionStorage, COLD_START_PENDING_KEY) === '1',
    instanceId,
  }

  return launchContextState.value
}

function defaultRouteForRole(role: AuthProfile['role']): string {
  return role === 'admin' ? '/admin' : '/worker/schedule'
}

function shouldApplyColdStartPolicy(launchContext: LaunchContext): boolean {
  return launchContext.isStandalone && launchContext.coldStartPending
}

function markColdStartPolicyHandled(): void {
  const launchContextState = useState<LaunchContext>('app-launch-context', () => ({
    isStandalone: false,
    isColdStart: false,
    coldStartPending: false,
    instanceId: '',
  }))

  launchContextState.value = {
    ...launchContextState.value,
    coldStartPending: false,
  }

  removeStorageItem(sessionStorage, COLD_START_PENDING_KEY)
}

async function withTimeout<T>(label: string, task: () => Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  let finished = false

  const timeoutResult = new Promise<T>((resolve) => {
    window.setTimeout(() => {
      if (!finished) {
        logRoleGuard(`${label} timeout`, { timeoutMs })
      }
      resolve(fallback)
    }, timeoutMs)
  })

  const taskResult = (async () => {
    try {
      const result = await task()
      finished = true
      return result
    } catch (error) {
      logRoleGuard(`${label} failed`, {
        error: error instanceof Error ? error.message : String(error),
      })
      finished = true
      return fallback
    }
  })()

  return Promise.race([taskResult, timeoutResult])
}

function resolveRouteAfterAuth(role: AuthProfile['role']): string {
  const lastRoute = getStorageItem(localStorage, 'last-app-route')

  if (role === 'admin' && lastRoute?.startsWith('/admin')) {
    return lastRoute
  }

  if (role === 'worker' && lastRoute?.startsWith('/worker')) {
    return lastRoute
  }

  return defaultRouteForRole(role)
}

function resolveLayoutFromPath(path: string): 'admin' | 'worker' | 'public' {
  if (path.startsWith('/admin')) {
    return 'admin'
  }

  if (path.startsWith('/worker')) {
    return 'worker'
  }

  return 'public'
}

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) {
    return
  }

  const isAdminRoute = to.path.startsWith('/admin')
  const isWorkerRoute = to.path.startsWith('/worker')
  const isLoginRoute = to.path === '/login'

  if (!isAdminRoute && !isWorkerRoute && !isLoginRoute) {
    return
  }

  try {
    const supabase = useSupabaseClient()
    const { waitForAuthBootstrap } = useAuthBootstrap()
    const launchContext = ensureLaunchContextState()

    logRoleGuard('guard start', {
      route: to.fullPath,
      restoredLayout: resolveLayoutFromPath(to.path),
      launchContext,
    })

    await waitForAuthBootstrap(1400)

    logRoleGuard('bootstrap settled', {
      route: to.fullPath,
    })

    const rememberMode = getStorageItem(localStorage, REMEMBER_MODE_KEY)
    const hasSessionMarker = getStorageItem(sessionStorage, SESSION_ACTIVE_KEY) === '1'

    if (rememberMode === 'session' && !hasSessionMarker) {
      void withTimeout('session-signout', async () => {
        await supabase.auth.signOut()
      }, 900, undefined)

      if (isAdminRoute || isWorkerRoute) {
        return navigateTo('/login')
      }

      return
    }

    const userResult = await withTimeout(
      'auth-getUser',
      async () => {
        return supabase.auth.getUser()
      },
      AUTH_GUARD_TIMEOUT_MS,
      { data: { user: null }, error: null },
    )

    if (userResult.error || !userResult.data.user) {
      if (isAdminRoute || isWorkerRoute) {
        return navigateTo('/login')
      }

      return
    }

    const profileResult = await withTimeout(
      'profile-fetch',
      async () => {
        return supabase
          .from('profiles')
          .select('role, active')
          .eq('id', userResult.data.user.id)
          .maybeSingle<AuthProfile>()
      },
      AUTH_GUARD_TIMEOUT_MS,
      { data: null, error: null },
    )

    const profile = profileResult.data

    if (profileResult.error || !profile || !profile.active) {
      void withTimeout('inactive-signout', async () => {
        await supabase.auth.signOut()
      }, 900, undefined)

      if (isAdminRoute || isWorkerRoute) {
        return navigateTo('/login')
      }

      // Never block the login route: if profile validation fails,
      // allow rendering the login page instead of redirecting to itself.
      return
    }

    if (isLoginRoute) {
      const shouldForceRoleLanding = shouldApplyColdStartPolicy(launchContext)
      const targetRoute = shouldForceRoleLanding
        ? defaultRouteForRole(profile.role)
        : resolveRouteAfterAuth(profile.role)

      if (shouldForceRoleLanding) {
        markColdStartPolicyHandled()
      }

      logRoleGuard('authenticated login redirect', {
        from: to.fullPath,
        to: targetRoute,
        role: profile.role,
        active: profile.active,
        shouldForceRoleLanding,
      })

      return navigateTo(targetRoute)
    }

    const shouldForceRoleLanding = shouldApplyColdStartPolicy(launchContext)
    const safeDefaultRoute = defaultRouteForRole(profile.role)

    if (shouldForceRoleLanding) {
      markColdStartPolicyHandled()

      logRoleGuard('cold-start role landing', {
        from: to.fullPath,
        to: safeDefaultRoute,
        role: profile.role,
        isStandalone: launchContext.isStandalone,
        isColdStart: launchContext.isColdStart,
      })

      if (to.path !== safeDefaultRoute) {
        return navigateTo(safeDefaultRoute, { replace: true })
      }
    }

    logRoleGuard('authenticated route restore', {
      route: to.fullPath,
      role: profile.role,
      active: profile.active,
      layout: resolveLayoutFromPath(to.path),
      coldStartPolicyApplied: shouldForceRoleLanding,
      shellLayoutMode: useState<'mobile' | 'desktop'>('app-shell-layout-mode', () => 'mobile').value,
    })

    if (isAdminRoute && profile.role !== 'admin') {
      return navigateTo('/worker/schedule')
    }

    if (isWorkerRoute && profile.role !== 'worker') {
      return navigateTo('/admin')
    }
  } catch (error) {
    logRoleGuard('unexpected guard failure', {
      route: to.fullPath,
      error: error instanceof Error ? error.message : String(error),
    })

    if (isAdminRoute || isWorkerRoute) {
      return navigateTo('/login')
    }
  }
})
