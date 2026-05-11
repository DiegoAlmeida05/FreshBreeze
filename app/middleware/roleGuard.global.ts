import { defineNuxtRouteMiddleware, navigateTo, useNuxtApp } from '#app'
import { useAuthBootstrap } from '../composables/useAuthBootstrap'
import { useSupabaseClient } from '../composables/useSupabaseClient'

const REMEMBER_MODE_KEY = 'auth-remember-mode'
const SESSION_ACTIVE_KEY = 'auth-session-active'
const AUTH_GUARD_TIMEOUT_MS = 1800
const ROLE_GUARD_DEBUG = false

interface AuthProfile {
  role: 'admin' | 'worker'
  active: boolean
}

function logRoleGuard(message: string, extra?: Record<string, unknown>): void {
  if (!import.meta.client || !ROLE_GUARD_DEBUG) {
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

function defaultRouteForRole(role: AuthProfile['role']): string {
  return role === 'admin' ? '/admin' : '/worker/schedule'
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

function isStandaloneMode(): boolean {
  return (
    (typeof navigator !== 'undefined' &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true) ||
    window.matchMedia('(display-mode: standalone)').matches
  )
}

function isStandaloneColdStart(): boolean {
  if (!isStandaloneMode()) {
    return false
  }

  return Boolean((window as Window & { __PWA_COLD_START__?: boolean }).__PWA_COLD_START__)
}

function resolveRouteAfterAuth(role: AuthProfile['role']): string {
  // In standalone (PWA), force safe route only on true cold start.
  if (isStandaloneColdStart()) {
    return defaultRouteForRole(role)
  }

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

function hardRedirect(path: string): void {
  if (!import.meta.client) {
    return
  }

  if (window.location.pathname === path) {
    return
  }

  window.location.replace(path)
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
    const nuxtApp = useNuxtApp()

    logRoleGuard('guard start', {
      route: to.fullPath,
      restoredLayout: resolveLayoutFromPath(to.path),
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
        if (nuxtApp.isHydrating || isStandaloneMode()) {
          hardRedirect('/login')
          return
        }

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
        if (nuxtApp.isHydrating || isStandaloneMode()) {
          hardRedirect('/login')
          return
        }

        return navigateTo('/login')
      }

      // Never block the login route: if profile validation fails,
      // allow rendering the login page instead of redirecting to itself.
      return
    }

    if (isLoginRoute) {
      const targetRoute = resolveRouteAfterAuth(profile.role)

      logRoleGuard('authenticated login redirect', {
        from: to.fullPath,
        to: targetRoute,
        role: profile.role,
        active: profile.active,
      })

      // Avoid SSR(/login) -> SPA(/worker|/admin) route swap during hydration,
      // which can trigger intermittent white screens and hydration mismatch on iOS reopen.
      if (nuxtApp.isHydrating || isStandaloneMode()) {
        hardRedirect(targetRoute)
        return
      }

      return navigateTo(targetRoute)
    }

    logRoleGuard('authenticated route restore', {
      route: to.fullPath,
      role: profile.role,
      active: profile.active,
      layout: resolveLayoutFromPath(to.path),
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
      if (useNuxtApp().isHydrating || isStandaloneMode()) {
        hardRedirect('/login')
        return
      }

      return navigateTo('/login')
    }
  }
})
