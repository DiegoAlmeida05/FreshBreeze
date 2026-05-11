import { computed } from 'vue'

type WorkerSyncStatus = 'idle' | 'syncing' | 'synced'

let syncedResetTimeout: ReturnType<typeof setTimeout> | null = null

export function useWorkerSyncStatus() {
  const activeSyncCount = useState<number>('worker-sync-active-count', () => 0)
  const syncStatus = useState<WorkerSyncStatus>('worker-sync-status', () => 'idle')

  function clearSyncedTimeout(): void {
    if (!syncedResetTimeout) {
      return
    }

    clearTimeout(syncedResetTimeout)
    syncedResetTimeout = null
  }

  function startSync(): void {
    clearSyncedTimeout()
    activeSyncCount.value += 1
    syncStatus.value = 'syncing'
  }

  function finishSync(): void {
    activeSyncCount.value = Math.max(0, activeSyncCount.value - 1)

    if (activeSyncCount.value > 0) {
      syncStatus.value = 'syncing'
      return
    }

    syncStatus.value = 'synced'
    clearSyncedTimeout()
    syncedResetTimeout = setTimeout(() => {
      syncStatus.value = 'idle'
      syncedResetTimeout = null
    }, 1800)
  }

  const isSyncing = computed(() => syncStatus.value === 'syncing')

  return {
    syncStatus,
    isSyncing,
    startSync,
    finishSync,
  }
}
