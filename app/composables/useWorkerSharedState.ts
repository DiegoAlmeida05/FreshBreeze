import type { ScheduleItem } from './useWorkerSchedule'
import type { WorkerTimesheetDay, WorkerTimesheetSummary } from './useWorkerTimesheet'

interface WorkerCachedValue<T> {
  value: T
  lastUpdated: number
  savedAt: number
  hydrated: boolean
  stale: boolean
}

interface WorkerProfileBasics {
  id: string
  fullName: string
  email: string
  avatarUrl: string
}

interface WorkerTimesheetCachedWeek {
  days: WorkerTimesheetDay[]
  summary: WorkerTimesheetSummary
}

export interface WorkerMinimalJobDetail {
  routeStopId: string
  groupLabel: string
  orderIndex: number
  taskDate: string
  propertyId: string
  propertyName: string
  clientName: string
  address: string
  lat: number | null
  lng: number | null
  taskType: 'BSB' | 'NORMAL'
  tags: string[]
  taskNotes: string | null
  guestName: string | null
  guestCheckinDate: string | null
  bathrooms: number
  bedsSingle: number
  bedsQueen: number
  bedsKing: number
  extraTowelsQty: number
  extraBedsSingle: number
  extraBedsQueen: number
  extraBedsKing: number
  extraChocolatesQty: number
  hasKey: boolean
  keyPhotoUrl: string | null
  link1: string | null
  link2: string | null
  plannedStartTime: string | null
  plannedEndTime: string | null
}

type WorkerScheduleMap = Record<string, WorkerCachedValue<{
  scheduleItems: ScheduleItem[]
  availableGroups: string[]
  holidayNamesByDate: Record<string, string[]>
}>>

type WorkerJobDetailMap = Record<string, WorkerCachedValue<unknown>>
type WorkerMinimalJobDetailMap = Record<string, WorkerCachedValue<WorkerMinimalJobDetail>>
type WorkerTimesheetMap = Record<string, WorkerCachedValue<WorkerTimesheetCachedWeek>>
type WorkerDashboardMap = Record<string, WorkerCachedValue<WorkerTimesheetSummary | {
  totalHours: number
  estimatedEarnings: number
  workedDays: number
  averageHoursPerDay: number
}>>

export function useWorkerSharedState() {
  const scheduleByKey = useState<WorkerScheduleMap>('worker-shared-schedule-by-key', () => ({}))
  const jobDetailByRouteStopId = useState<WorkerJobDetailMap>('worker-shared-job-detail-by-route-stop-id', () => ({}))
  const minimalJobDetailByRouteStopId = useState<WorkerMinimalJobDetailMap>('worker-shared-min-job-detail-by-route-stop-id', () => ({}))
  const timesheetByWeek = useState<WorkerTimesheetMap>('worker-shared-timesheet-by-week', () => ({}))
  const dashboardByKey = useState<WorkerDashboardMap>('worker-shared-dashboard-by-key', () => ({}))
  const profileBasics = useState<WorkerCachedValue<WorkerProfileBasics> | null>('worker-shared-profile-basics', () => null)

  function preserveLastValidData<T>(incoming: T | null | undefined, current: T | null | undefined): T | null {
    if (incoming !== null && incoming !== undefined) {
      return incoming
    }

    if (current !== null && current !== undefined) {
      return current
    }

    return null
  }

  function getSchedule<T>(key: string): WorkerCachedValue<T> | null {
    const item = scheduleByKey.value[key] as WorkerCachedValue<T> | undefined
    return item ?? null
  }

  function setSchedule<T>(key: string, value: T): void {
    const now = Date.now()
    scheduleByKey.value = {
      ...scheduleByKey.value,
      [key]: {
        value,
        lastUpdated: now,
        savedAt: now,
        hydrated: true,
        stale: false,
      },
    }
  }

  function getJobDetail<T>(routeStopId: string): WorkerCachedValue<T> | null {
    const item = jobDetailByRouteStopId.value[routeStopId] as WorkerCachedValue<T> | undefined
    return item ?? null
  }

  function setJobDetail<T>(routeStopId: string, value: T): void {
    const now = Date.now()
    jobDetailByRouteStopId.value = {
      ...jobDetailByRouteStopId.value,
      [routeStopId]: {
        value,
        lastUpdated: now,
        savedAt: now,
        hydrated: true,
        stale: false,
      },
    }
  }

  function getMinimalJobDetail(routeStopId: string): WorkerCachedValue<WorkerMinimalJobDetail> | null {
    const item = minimalJobDetailByRouteStopId.value[routeStopId]
    return item ?? null
  }

  function setMinimalJobDetail(routeStopId: string, value: WorkerMinimalJobDetail): void {
    const now = Date.now()
    minimalJobDetailByRouteStopId.value = {
      ...minimalJobDetailByRouteStopId.value,
      [routeStopId]: {
        value,
        lastUpdated: now,
        savedAt: now,
        hydrated: true,
        stale: false,
      },
    }
  }

  function getTimesheet<T>(key: string): WorkerCachedValue<T> | null {
    const item = timesheetByWeek.value[key] as WorkerCachedValue<T> | undefined
    return item ?? null
  }

  function setTimesheet<T>(key: string, value: T): void {
    const now = Date.now()
    timesheetByWeek.value = {
      ...timesheetByWeek.value,
      [key]: {
        value,
        lastUpdated: now,
        savedAt: now,
        hydrated: true,
        stale: false,
      },
    }
  }

  function getDashboard<T>(key: string): WorkerCachedValue<T> | null {
    const item = dashboardByKey.value[key] as WorkerCachedValue<T> | undefined
    return item ?? null
  }

  function setDashboard<T>(key: string, value: T): void {
    const now = Date.now()
    dashboardByKey.value = {
      ...dashboardByKey.value,
      [key]: {
        value,
        lastUpdated: now,
        savedAt: now,
        hydrated: true,
        stale: false,
      },
    }
  }

  function getProfileBasics(): WorkerCachedValue<WorkerProfileBasics> | null {
    return profileBasics.value
  }

  function setProfileBasics(value: WorkerProfileBasics): void {
    const now = Date.now()
    profileBasics.value = {
      value,
      lastUpdated: now,
      savedAt: now,
      hydrated: true,
      stale: false,
    }
  }

  return {
    getSchedule,
    setSchedule,
    getJobDetail,
    setJobDetail,
    getMinimalJobDetail,
    setMinimalJobDetail,
    getTimesheet,
    setTimesheet,
    getDashboard,
    setDashboard,
    getProfileBasics,
    setProfileBasics,
    preserveLastValidData,
  }
}
