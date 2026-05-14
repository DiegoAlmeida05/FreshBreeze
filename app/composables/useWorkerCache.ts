/**
 * useWorkerCache — lightweight localStorage cache for worker pages.
 *
 * v1 — DEV/testing only. No service worker, no IndexedDB, no offline sync.
 * Only stores non-sensitive UI data (schedule items, job detail snapshots, report drafts).
 * Never stores auth tokens or secrets.
 *
 * TTL: 24 hours for schedule/job detail snapshots, no TTL for report drafts.
 * Cache is invalidated on version mismatch or TTL expiry.
 */

const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const CACHE_VERSION = '1'

interface CacheEntry<T> {
  data: T
  cachedAt: number
  version: string
}

function readWorkerCache<T>(key: string): CacheEntry<T> | null {
  if (!import.meta.client) {
    return null
  }

  try {
    const raw = window.localStorage.getItem(key)

    if (!raw) {
      return null
    }

    const entry = JSON.parse(raw) as CacheEntry<T>

    if (entry.version !== CACHE_VERSION) {
      window.localStorage.removeItem(key)
      return null
    }

    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
      window.localStorage.removeItem(key)
      return null
    }

    return entry
  } catch {
    return null
  }
}

function readWorkerCacheNoTTL<T>(key: string): CacheEntry<T> | null {
  if (!import.meta.client) {
    return null
  }

  try {
    const raw = window.localStorage.getItem(key)

    if (!raw) {
      return null
    }

    const entry = JSON.parse(raw) as CacheEntry<T>

    if (entry.version !== CACHE_VERSION) {
      window.localStorage.removeItem(key)
      return null
    }

    return entry
  } catch {
    return null
  }
}

function writeWorkerCache<T>(key: string, data: T): void {
  if (!import.meta.client) {
    return
  }

  try {
    const entry: CacheEntry<T> = {
      data,
      cachedAt: Date.now(),
      version: CACHE_VERSION,
    }

    window.localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // localStorage quota exceeded or unavailable — silently ignore
  }
}

function clearWorkerCache(key: string): void {
  if (!import.meta.client) {
    return
  }

  try {
    window.localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

function scheduleCacheKey(date: string): string {
  return `fb:schedule:${date}`
}

function jobDetailCacheKey(routeStopId: string): string {
  return `fb:job:${routeStopId}`
}

function reportDraftKey(routeStopId: string): string {
  return `fb:report-draft:${routeStopId}`
}

export function useWorkerCache() {
  return {
    readWorkerCache,
    readWorkerCacheNoTTL,
    writeWorkerCache,
    clearWorkerCache,
    scheduleCacheKey,
    jobDetailCacheKey,
    reportDraftKey,
  }
}
