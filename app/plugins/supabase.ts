import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const isAuthBootstrapping = useState<boolean>('auth-bootstrap-loading', () => import.meta.client)

  const supabaseClient: SupabaseClient = createClient(
    config.public.supabaseUrl,
    config.public.supabaseAnonKey,
  )

  if (import.meta.client) {
    const bootstrapFallbackTimeoutId = window.setTimeout(() => {
      if (isAuthBootstrapping.value) {
        isAuthBootstrapping.value = false
        console.info('[auth-bootstrap]', 'plugin fallback timeout forced resolve', { timeoutMs: 1800 })
      }
    }, 1800)

    void supabaseClient.auth.getSession()
      .catch(() => {
        // Session restore failures are handled by auth flow guards.
      })
      .finally(() => {
        window.clearTimeout(bootstrapFallbackTimeoutId)
        isAuthBootstrapping.value = false
      })

    supabaseClient.auth.onAuthStateChange(() => {
      if (isAuthBootstrapping.value) {
        isAuthBootstrapping.value = false
      }
    })
  }

  return {
    provide: {
      supabase: supabaseClient,
    },
  }
})