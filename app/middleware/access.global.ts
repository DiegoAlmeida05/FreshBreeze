import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useAuthBootstrap } from '../composables/useAuthBootstrap'
import { useSupabaseClient } from '../composables/useSupabaseClient'

interface BillingAccessResponse {
  access: {
    enabled: boolean
    checkedAt: string
  }
  isPlatformOwner?: boolean
}

function isRouteAllowedWithoutAccess(path: string): boolean {
  return path === '/login' || path === '/admin/billing' || path === '/blocked'
}

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) {
    return
  }

  if (isRouteAllowedWithoutAccess(to.path)) {
    return
  }

  const isProtectedAppRoute = to.path.startsWith('/admin')

  if (!isProtectedAppRoute) {
    return
  }

  const { waitForAuthBootstrap } = useAuthBootstrap()
  const supabase = useSupabaseClient()

  await waitForAuthBootstrap(1400)

  const { data, error } = await supabase.auth.getSession()

  if (error || !data.session?.access_token) {
    return
  }

  try {
    const billing = await $fetch<BillingAccessResponse>('/api/admin/billing', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
      },
    })

    if (billing.isPlatformOwner === true) {
      return
    }

    if (!billing.access.enabled && billing.isPlatformOwner !== true) {
      return navigateTo('/blocked', { replace: true })
    }
  }
  catch {
    // Do not block navigation on transient billing check failures.
  }
})