import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const isAuthBootstrapping = useState<boolean>('auth-bootstrap-loading', () => import.meta.client)

  const supabaseClient: SupabaseClient = createClient(
    config.public.supabaseUrl,
    config.public.supabaseAnonKey,
  )

  if (import.meta.client) {
    // Aggressive timeout: complete auth bootstrap within 800ms on mobile
    // Prevents UI lock during initial load. Session will be restored
    // opportunistically after initial render if needed.
    const bootstrapFallbackTimeoutId = window.setTimeout(() => {
      if (isAuthBootstrapping.value) {
        isAuthBootstrapping.value = false
      }
    }, 800)

    void supabaseClient.auth.getSession()
      .catch(() => {
        // Session restore failures are handled by auth flow guards.
      })
      .finally(() => {
        window.clearTimeout(bootstrapFallbackTimeoutId)
        if (isAuthBootstrapping.value) {
          isAuthBootstrapping.value = false
        }
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