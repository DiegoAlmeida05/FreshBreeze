import { watch } from 'vue'

export function useAuthBootstrap() {
  const isAuthBootstrapping = useState<boolean>('auth-bootstrap-loading', () => import.meta.client)

  const logAuthBootstrap = (message: string, extra?: Record<string, unknown>) => {
    if (!import.meta.client) {
      return
    }

    if (extra) {
      console.info('[auth-bootstrap]', message, extra)
      return
    }

    console.info('[auth-bootstrap]', message)
  }

  async function waitForAuthBootstrap(timeoutMs = 2200): Promise<void> {
    if (!import.meta.client || !isAuthBootstrapping.value) {
      return
    }

    await new Promise<void>((resolve) => {
      const timeoutId = window.setTimeout(() => {
        if (isAuthBootstrapping.value) {
          isAuthBootstrapping.value = false
        }

        logAuthBootstrap('forced resolve by timeout', { timeoutMs })
        stop()
        resolve()
      }, timeoutMs)

      const stop = watch(isAuthBootstrapping, (loading) => {
        if (!loading) {
          window.clearTimeout(timeoutId)
          logAuthBootstrap('resolved', { timeoutMs })
          stop()
          resolve()
        }
      })
    })
  }

  return {
    isAuthBootstrapping,
    waitForAuthBootstrap,
  }
}