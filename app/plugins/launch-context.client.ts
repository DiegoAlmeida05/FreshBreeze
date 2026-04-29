const RUNTIME_INSTANCE_KEY = 'app-runtime-instance-id'
const COLD_START_PENDING_KEY = 'app-cold-start-pending'

type LaunchContextState = {
  isStandalone: boolean
  isColdStart: boolean
  coldStartPending: boolean
  instanceId: string
}

function readSessionStorage(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function writeSessionStorage(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(key, value)
  } catch {
    // Ignore storage write failures to avoid blocking app boot.
  }
}

function detectStandaloneMode(): boolean {
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  return iosStandalone || window.matchMedia('(display-mode: standalone)').matches
}

export default defineNuxtPlugin(() => {
  if (!import.meta.client) {
    return
  }

  const launchContext = useState<LaunchContextState>('app-launch-context', () => ({
    isStandalone: false,
    isColdStart: false,
    coldStartPending: false,
    instanceId: '',
  }))

  const existingInstanceId = readSessionStorage(RUNTIME_INSTANCE_KEY)
  const isColdStart = !existingInstanceId
  const instanceId = existingInstanceId ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  const isStandalone = detectStandaloneMode()

  writeSessionStorage(RUNTIME_INSTANCE_KEY, instanceId)

  if (isColdStart) {
    writeSessionStorage(COLD_START_PENDING_KEY, '1')
  }

  launchContext.value = {
    isStandalone,
    isColdStart,
    coldStartPending: readSessionStorage(COLD_START_PENDING_KEY) === '1',
    instanceId,
  }

  console.info('[launch-context]', 'boot', {
    isStandalone,
    isColdStart,
    coldStartPending: launchContext.value.coldStartPending,
    instanceId,
  })
})
