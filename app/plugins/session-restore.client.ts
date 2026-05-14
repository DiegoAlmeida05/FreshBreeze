/**
 * Session Restoration Plugin
 * Handles session refresh on network reconnection to prevent session loss
 * when transitioning from offline to online.
 */

export default defineNuxtPlugin(async () => {
  if (!import.meta.client) {
    return
  }

  const { restoreSessionAfterReconnection, clearAuthCaches } = useAuth()

  let wasOnline = typeof navigator !== 'undefined' && navigator.onLine
  let isRestoring = false

  async function handleOnline(): Promise<void> {
    if (isRestoring) return
    if (wasOnline) return // Only restore if we were previously offline

    isRestoring = true

    try {
      await restoreSessionAfterReconnection()
    } catch (error) {
      // Silently handle restoration failures. The user will be redirected
      // to /login by roleGuard middleware on the next route navigation
      // if the session is invalid.
      if (import.meta.dev) {
        console.error('[session-restore] Failed to restore session on reconnection:', error)
      }
    } finally {
      isRestoring = false
      wasOnline = true
    }
  }

  function handleOffline(): void {
    wasOnline = false
  }

  // Set up event listeners for network status changes
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // Cleanup on app unload
  window.addEventListener('beforeunload', () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })
})
