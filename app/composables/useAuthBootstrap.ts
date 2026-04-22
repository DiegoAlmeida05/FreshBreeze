import { watch } from 'vue'

export function useAuthBootstrap() {
  const isAuthBootstrapping = useState<boolean>('auth-bootstrap-loading', () => import.meta.client)

  async function waitForAuthBootstrap(timeoutMs = 2200): Promise<void> {
    if (!import.meta.client || !isAuthBootstrapping.value) {
      return
    }

    await new Promise<void>((resolve) => {
      const timeoutId = window.setTimeout(() => {
        stop()
        resolve()
      }, timeoutMs)

      const stop = watch(isAuthBootstrapping, (loading) => {
        if (!loading) {
          window.clearTimeout(timeoutId)
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