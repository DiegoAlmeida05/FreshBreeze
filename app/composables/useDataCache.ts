/**
 * Composable para gerenciar cache de dados em memória.
 * Reduz requisições desnecessárias à API e melhora performance.
 *
 * Uso:
 * const { getCached, setCached, invalidate } = useDataCache()
 *
 * const data = getCached('my-key') || await fetchData()
 * if (!getCached('my-key')) {
 *   setCached('my-key', data, 5 * 60 * 1000) // 5 minutos
 * }
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const dataCache = new Map<string, CacheEntry<any>>()

export function useDataCache() {
  /**
   * Obtém dados do cache se ainda forem válidos
   */
  function getCached<T>(key: string): T | null {
    const entry = dataCache.get(key)

    if (!entry) {
      return null
    }

    // Verifica se expirou
    if (Date.now() > entry.expiresAt) {
      dataCache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Armazena dados no cache com TTL (Time To Live)
   * @param key Identificador único
   * @param data Dados a armazenar
   * @param ttl Tempo de vida em ms (padrão: 10 minutos)
   */
  function setCached<T>(key: string, data: T, ttl: number = 10 * 60 * 1000): void {
    dataCache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    })
  }

  /**
   * Invalida uma entrada do cache
   */
  function invalidate(key: string): void {
    dataCache.delete(key)
  }

  /**
   * Invalida todas as entradas do cache
   */
  function invalidateAll(): void {
    dataCache.clear()
  }

  return {
    getCached,
    setCached,
    invalidate,
    invalidateAll,
  }
}
