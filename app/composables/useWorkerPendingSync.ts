import type { WorkerPendingAction, WorkerPendingActionPayload, WorkerPendingActionType } from '../../shared/types/WorkerPendingSync'

const PENDING_ACTIONS_STORAGE_KEY = 'worker-pending-actions:v1'

function parseActions(value: string | null): WorkerPendingAction[] {
  if (!value) {
    return []
  }

  try {
    const parsed = JSON.parse(value) as WorkerPendingAction[]
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((item) => {
      return (
        item
        && typeof item.id === 'string'
        && typeof item.type === 'string'
        && typeof item.createdAt === 'number'
        && typeof item.payload === 'object'
      )
    })
  } catch {
    return []
  }
}

export function useWorkerPendingSync() {
  const pendingActions = useState<WorkerPendingAction[]>('worker-pending-actions-state', () => [])

  function persist(actions: WorkerPendingAction[]): void {
    pendingActions.value = actions

    if (!import.meta.client) {
      return
    }

    try {
      window.localStorage.setItem(PENDING_ACTIONS_STORAGE_KEY, JSON.stringify(actions))
    } catch {
      // Keep in-memory state if persistence fails.
    }
  }

  function ensureLoaded(): void {
    if (!import.meta.client || pendingActions.value.length > 0) {
      return
    }

    const raw = window.localStorage.getItem(PENDING_ACTIONS_STORAGE_KEY)
    pendingActions.value = parseActions(raw)
  }

  function enqueueAction(type: WorkerPendingActionType, payload: WorkerPendingActionPayload): WorkerPendingAction {
    ensureLoaded()

    const nextAction: WorkerPendingAction = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      createdAt: Date.now(),
      payload,
    }

    persist([...pendingActions.value, nextAction])
    return nextAction
  }

  function removeAction(actionId: string): void {
    ensureLoaded()
    persist(pendingActions.value.filter((action) => action.id !== actionId))
  }

  function clearActions(): void {
    persist([])
  }

  ensureLoaded()

  return {
    pendingActions,
    enqueueAction,
    removeAction,
    clearActions,
  }
}
