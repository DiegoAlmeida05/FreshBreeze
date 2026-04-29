/**
 * Composable para persistir dados de formulário em sessionStorage e localStorage.
 * Garante que dados não sejam perdidos ao voltar da app ou mesmo ao sair da página.
 *
 * Uso:
 * const { saveFormState, restoreFormState, clearFormState } = useFormPersistence()
 *
 * // Salvar estado do formulário
 * saveFormState('my-form', { field1: 'value1', field2: 'value2' })
 *
 * // Restaurar estado
 * const savedState = restoreFormState('my-form')
 *
 * // Limpar
 * clearFormState('my-form')
 */

export function useFormPersistence() {
  /**
   * Salva dados do formulário em sessionStorage
   * SessionStorage é limpo quando a aba é fechada, mas persiste ao voltar da app
   */
  function saveFormState<T extends Record<string, any>>(key: string, data: T, storage: 'session' | 'local' = 'session'): void {
    if (!process.client) return

    try {
      const storageTarget = storage === 'session' ? sessionStorage : localStorage
      storageTarget.setItem(`form-state:${key}`, JSON.stringify(data))
    }
    catch (error) {
      console.warn(`Failed to save form state for "${key}":`, error)
    }
  }

  /**
   * Restaura dados do formulário do sessionStorage
   */
  function restoreFormState<T extends Record<string, any>>(key: string, defaultValue?: T, storage: 'session' | 'local' = 'session'): T | null {
    if (!process.client) return defaultValue ?? null

    try {
      const storageTarget = storage === 'session' ? sessionStorage : localStorage
      const stored = storageTarget.getItem(`form-state:${key}`)
      if (!stored) return defaultValue ?? null

      return JSON.parse(stored) as T
    }
    catch (error) {
      console.warn(`Failed to restore form state for "${key}":`, error)
      return defaultValue ?? null
    }
  }

  /**
   * Limpa dados do formulário do sessionStorage
   */
  function clearFormState(key: string, storage: 'session' | 'local' = 'session'): void {
    if (!process.client) return

    try {
      const storageTarget = storage === 'session' ? sessionStorage : localStorage
      storageTarget.removeItem(`form-state:${key}`)
    }
    catch (error) {
      console.warn(`Failed to clear form state for "${key}":`, error)
    }
  }

  /**
   * Limpa todos os dados de formulário
   */
  function clearAllFormStates(storage: 'session' | 'local' = 'session'): void {
    if (!process.client) return

    try {
      const storageTarget = storage === 'session' ? sessionStorage : localStorage
      const keys = Object.keys(storageTarget).filter((k) => k.startsWith('form-state:'))
      keys.forEach((key) => storageTarget.removeItem(key))
    }
    catch (error) {
      console.warn('Failed to clear all form states:', error)
    }
  }

  /**
   * Sincroniza um valor reativo com storage automaticamente
   * Útil para auto-save enquanto o usuário digita
   */
  function syncFormState<T extends Record<string, any>>(
    key: string,
    data: T,
    debounceMs: number = 500,
    storage: 'session' | 'local' = 'session',
  ): void {
    if (!process.client) return

    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const save = () => {
      saveFormState(key, data, storage)
    }

    // Se já existe um timeout, cancela
    if (timeoutId) clearTimeout(timeoutId)

    // Define novo timeout para salvar após debounce
    timeoutId = setTimeout(save, debounceMs)
  }

  return {
    saveFormState,
    restoreFormState,
    clearFormState,
    clearAllFormStates,
    syncFormState,
  }
}
