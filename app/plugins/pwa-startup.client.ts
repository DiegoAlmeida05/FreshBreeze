import { defineNuxtPlugin } from '#app'
import { createClient } from '@supabase/supabase-js'

function isStandaloneMode(): boolean {
  return (
    (typeof navigator !== 'undefined' &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true) ||
    window.matchMedia('(display-mode: standalone)').matches
  )
}

/**
 * PWA Startup Fix
 *
 * Runs ONCE per page load (plugins never re-run during SPA navigation).
 *
 * On every standalone (home screen) launch:
 * - Detects if the app is running in standalone mode
 * - Checks if a user session exists
 * - Forces window.location.replace() to the role-based safe landing page
 *
 * This prevents the white screen caused by restoring a broken previous route.
 * If the current path is already the safe landing page, no redirect is issued
 * to avoid reload loops.
 */
export default defineNuxtPlugin(async () => {
  if (!isStandaloneMode()) {
    return
  }

  const currentPath = window.location.pathname

  // Only normalize public entry routes. Deep app routes should be preserved.
  if (currentPath !== '/' && currentPath !== '/login') {
    return
  }

  const config = useRuntimeConfig()
  const supabase = createClient(config.public.supabaseUrl, config.public.supabaseAnonKey)

  if (!supabase?.auth) {
    return
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // No session — roleGuard will handle redirect to /login
    return
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    return
  }

  const target = profile.role === 'admin' ? '/admin' : '/worker/schedule'

  // Already on the safe landing page — skip to avoid reload loop
  if (currentPath === target) {
    return
  }

  window.location.replace(target)
})
