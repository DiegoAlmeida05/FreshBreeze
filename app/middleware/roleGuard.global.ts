import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useSupabaseClient } from '../composables/useSupabaseClient'

const REMEMBER_MODE_KEY = 'auth-remember-mode'
const SESSION_ACTIVE_KEY = 'auth-session-active'

interface AuthProfile {
  role: 'admin' | 'worker'
  active: boolean
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

  const supabase = useSupabaseClient()

  const rememberMode = localStorage.getItem(REMEMBER_MODE_KEY)
  const hasSessionMarker = sessionStorage.getItem(SESSION_ACTIVE_KEY) === '1'

  if (rememberMode === 'session' && !hasSessionMarker) {
    await supabase.auth.signOut()

    if (isAdminRoute || isWorkerRoute) {
      return navigateTo('/login')
    }
  }

  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    if (isAdminRoute || isWorkerRoute) {
      return navigateTo('/login')
    }

    return
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, active')
    .eq('id', userData.user.id)
    .maybeSingle<AuthProfile>()

  if (profileError || !profile || !profile.active) {
    await supabase.auth.signOut()
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
})
