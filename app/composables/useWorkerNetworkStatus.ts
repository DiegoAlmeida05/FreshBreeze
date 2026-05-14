import { computed } from 'vue'

let listenersBound = false

export function useWorkerNetworkStatus() {
  const isOnline = useState<boolean>('worker-network-online', () => true)

  function syncFromNavigator(): void {
    if (!import.meta.client) {
      return
    }

    isOnline.value = window.navigator.onLine
  }

  if (import.meta.client && !listenersBound) {
    listenersBound = true
    syncFromNavigator()
    window.addEventListener('online', syncFromNavigator)
    window.addEventListener('offline', syncFromNavigator)
  }

  const isOffline = computed(() => !isOnline.value)

  return {
    isOnline,
    isOffline,
  }
}
