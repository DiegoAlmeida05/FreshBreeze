// ─── Client ───────────────────────────────────────────────────────────────────

export interface Client {
  id: string
  name: string
  color: string
  hourlyRate: number
  linenComboPrice: number
  amenitiesComboPrice: number
  extraTowelPrice: number
  isActive: boolean
}

// ─── Employee ─────────────────────────────────────────────────────────────────

export type EmployeeRole = 'worker' | 'admin'

export interface Employee {
  id: string
  fullName: string
  email: string
  phone: string
  abn: string
  address: string
  weekdayRate: number
  sundayRate: number
  holidayRate: number
  role: EmployeeRole
  isActive: boolean
}

// ─── Property ─────────────────────────────────────────────────────────────────

export interface Property {
  id: string
  name: string
  address: string
  clientId: string
  clientName: string
}

// ─── Quick Task ───────────────────────────────────────────────────────────────

export type CleaningTeam = 'A' | 'B' | 'C'

export interface QuickTask {
  propertyId: string
  clientId: string
  clientName: string
  date: string
  startTime: string
  endTime: string
  durationHours: number
  team: CleaningTeam
}
