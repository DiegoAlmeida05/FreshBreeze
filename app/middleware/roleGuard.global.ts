import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useAuthBootstrap } from '../composables/useAuthBootstrap'
import { useSupabaseClient } from '../composables/useSupabaseClient'

const REMEMBER_MODE_KEY = 'auth-remember-mode'
const SESSION_ACTIVE_KEY = 'auth-session-active'
const AUTH_GUARD_TIMEOUT_MS = 1800

interface AuthProfile {
  role: 'admin' | 'worker'
  active: boolean
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
  const lastRoute = localStorage.getItem('last-app-route')

  if (role === 'admin' && lastRoute?.startsWith('/admin')) {
    return lastRoute
  }

  if (role === 'worker' && lastRoute?.startsWith('/worker')) {
    return lastRoute
  }

  return role === 'admin' ? '/admin' : '/worker/schedule'
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

    await waitForAuthBootstrap(1400)

    const rememberMode = getStorageItem(localStorage, REMEMBER_MODE_KEY)
    const hasSessionMarker = getStorageItem(sessionStorage, SESSION_ACTIVE_KEY) === '1'

    if (rememberMode === 'session' && !hasSessionMarker) {
      void withTimeout('session-signout', async () => {
        await supabase.auth.signOut()
      }, 900, undefined)

      if (isAdminRoute || isWorkerRoute) {
        return navigateTo('/login')
      }
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
      return navigateTo('/login')
    }

    if (isLoginRoute) {
      return navigateTo(resolveRouteAfterAuth(profile.role))
    }

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
