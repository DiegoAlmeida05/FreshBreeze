import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useSupabaseClient } from '../composables/useSupabaseClient'

const REMEMBER_MODE_KEY = 'auth-remember-mode'
const SESSION_ACTIVE_KEY = 'auth-session-active'

interface AuthProfile {
  role: 'admin' | 'worker'
  active: boolean
}

export default defineNuxtRouteMiddleware(async (to) => {
  const isAdminRoute = to.path.startsWith('/admin')
  const isWorkerRoute = to.path.startsWith('/worker')
  const isLoginRoute = to.path === '/login'

  if (!isAdminRoute && !isWorkerRoute && !isLoginRoute) {
    return
  }

  const supabase = useSupabaseClient()

  if (import.meta.client) {
    const rememberMode = localStorage.getItem(REMEMBER_MODE_KEY)
    const hasSessionMarker = sessionStorage.getItem(SESSION_ACTIVE_KEY) === '1'

    if (rememberMode === 'session' && !hasSessionMarker) {
      await supabase.auth.signOut()

      if (isAdminRoute || isWorkerRoute) {
        return navigateTo('/login')
      }
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
    return navigateTo(profile.role === 'admin' ? '/admin' : '/worker/schedule')
  }

  if (isAdminRoute && profile.role !== 'admin') {
    return navigateTo('/worker/schedule')
  }

  if (isWorkerRoute && profile.role !== 'worker') {
    return navigateTo('/admin')
  }
})
