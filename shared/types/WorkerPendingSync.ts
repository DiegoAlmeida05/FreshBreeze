export type WorkerPendingActionType = 'saveTimesheet' | 'saveReport' | 'uploadReportPhoto'

export interface WorkerPendingActionPayload {
  entityId?: string
  date?: string
  note?: string
  fileCount?: number
}

export interface WorkerPendingAction {
  id: string
  type: WorkerPendingActionType
  createdAt: number
  payload: WorkerPendingActionPayload
}
