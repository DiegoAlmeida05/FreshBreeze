import type { DailyTaskDTO } from '../../shared/types/DailyTaskDTO'

const DRAFT_KEY_PREFIX = 'route-planner'

export interface TeamDraftState {
  id: string
  label: string
  startTime: string
  employeeIds: string[]
  tasks: DailyTaskDTO[]
}

export interface RoutePlannerDraftState {
  selectedDate: string
  unassignedTasks: DailyTaskDTO[]
  teams: TeamDraftState[]
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isTaskArray(value: unknown): value is DailyTaskDTO[] {
  return Array.isArray(value)
}

function isTeamDraftState(value: unknown): value is TeamDraftState {
  if (!value || typeof value !== 'object') {
    return false
  }

  const rec = value as Record<string, unknown>

  return typeof rec.id === 'string'
    && typeof rec.label === 'string'
    && typeof rec.startTime === 'string'
    && isStringArray(rec.employeeIds)
    && isTaskArray(rec.tasks)
}

function isDraftState(value: unknown): value is RoutePlannerDraftState {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>

  return typeof record.selectedDate === 'string'
    && isTaskArray(record.unassignedTasks)
    && Array.isArray(record.teams)
    && (record.teams as unknown[]).every(isTeamDraftState)
}

export function useRoutePlannerDraft() {
  function getDraftKey(date: string): string {
    return `${DRAFT_KEY_PREFIX}:${date}`
  }

  function loadDraft(date: string): RoutePlannerDraftState | null {
    if (!import.meta.client || !date) {
      return null
    }

    const key = getDraftKey(date)
    const raw = localStorage.getItem(key)

    if (!raw) {
      return null
    }

    try {
      const parsed: unknown = JSON.parse(raw)
      if (!isDraftState(parsed)) {
        return null
      }

      return parsed
    } catch {
      return null
    }
  }

  function saveDraft(date: string, draft: RoutePlannerDraftState): void {
    if (!import.meta.client || !date) {
      return
    }

    localStorage.setItem(getDraftKey(date), JSON.stringify(draft))
  }

  function clearDraft(date: string): void {
    if (!import.meta.client || !date) {
      return
    }

    localStorage.removeItem(getDraftKey(date))
  }

  return {
    loadDraft,
    saveDraft,
    clearDraft,
  }
}
