interface WorkerOfflineCacheEntry<T> {
  data: T
  savedAt: number
  expiresAt: number
}

interface WorkerOfflineCacheResult<T> {
  data: T
  savedAt: number
}

const CACHE_NAMESPACE = 'worker-offline-cache:'

function resolveStorageKey(key: string): string {
  return `${CACHE_NAMESPACE}${key}`
}

function parseCacheEntry<T>(value: string | null): WorkerOfflineCacheEntry<T> | null {
  if (!value) {
    return null
  }

  try {
    const parsed = JSON.parse(value) as WorkerOfflineCacheEntry<T>

    if (
      !parsed
      || typeof parsed !== 'object'
      || typeof parsed.savedAt !== 'number'
      || typeof parsed.expiresAt !== 'number'
      || !('data' in parsed)
    ) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function useWorkerOfflineCache() {
  function getCached<T>(key: string): WorkerOfflineCacheResult<T> | null {
    if (!import.meta.client) {
      return null
    }

    const storageKey = resolveStorageKey(key)
    const entry = parseCacheEntry<T>(window.localStorage.getItem(storageKey))

    if (!entry) {
      window.localStorage.removeItem(storageKey)
      return null
    }

    if (Date.now() > entry.expiresAt) {
      window.localStorage.removeItem(storageKey)
      return null
    }

    return {
      data: entry.data,
      savedAt: entry.savedAt,
    }
  }

  function setCached<T>(key: string, data: T, ttlMs: number): void {
    if (!import.meta.client) {
      return
    }

    const now = Date.now()
    const entry: WorkerOfflineCacheEntry<T> = {
      data,
      savedAt: now,
      expiresAt: now + Math.max(1000, ttlMs),
    }

    try {
      window.localStorage.setItem(resolveStorageKey(key), JSON.stringify(entry))
    } catch {
      // Ignore storage quota errors to keep UX responsive.
    }
  }

  return {
    getCached,
    setCached,
  }
}
