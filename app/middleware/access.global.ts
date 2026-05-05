import { defineNuxtRouteMiddleware, navigateTo, useState } from '#app'
import { useAuthBootstrap } from '../composables/useAuthBootstrap'
import { useSupabaseClient } from '../composables/useSupabaseClient'

interface BillingAccessResponse {
  access: {
    enabled: boolean
    checkedAt: string
  }
}

const ACCESS_CACHE_MS = 5 * 60_000

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

  const cachedAccessEnabled = useState<boolean | null>('billing-access-enabled', () => null)
  const cachedAccessCheckedAt = useState<number>('billing-access-checked-at', () => 0)
  const now = Date.now()

  if (now - cachedAccessCheckedAt.value < ACCESS_CACHE_MS) {
    if (cachedAccessEnabled.value === false) {
      return navigateTo('/blocked', { replace: true })
    }

    if (cachedAccessEnabled.value === true) {
      return
    }
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

    cachedAccessEnabled.value = billing.access.enabled
    cachedAccessCheckedAt.value = now

    if (!billing.access.enabled) {
      return navigateTo('/blocked', { replace: true })
    }
  }
  catch {
    // Do not block navigation on transient billing check failures.
  }
})