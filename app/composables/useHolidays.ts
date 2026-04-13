import { useSupabaseClient } from './useSupabaseClient'
import type { CreateHolidayDTO, HolidayDTO, UpdateHolidayDTO } from '../../shared/types/HolidayDTO'

interface HolidayRow {
  id: string
  date: string
  name: string
  country: string | null
  state: string | null
  is_active: boolean
  created_at: string | null
}

function toHolidayDTO(row: HolidayRow): HolidayDTO {
  return {
    id: row.id,
    date: row.date,
    name: row.name,
    country: row.country,
    state: row.state,
    is_active: row.is_active,
    created_at: row.created_at ?? '',
  }
}

function buildYearRange(year: number): { startDate: string, endDate: string } {
  return {
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
  }
}

function buildTargetDate(sourceDate: string, targetYear: number): string | null {
  const [, month, day] = sourceDate.split('-')

  if (!month || !day) {
    return null
  }

  const targetDate = `${targetYear}-${month}-${day}`
  const date = new Date(`${targetDate}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  const validMonth = String(date.getMonth() + 1).padStart(2, '0')
  const validDay = String(date.getDate()).padStart(2, '0')

  if (validMonth !== month || validDay !== day) {
    return null
  }

  return targetDate
}

export interface DuplicateHolidaysSummary {
  created: number
  skipped: number
}

export function useHolidays() {
  const supabase = useSupabaseClient()

  async function fetchHolidays(): Promise<HolidayDTO[]> {
    const { data, error } = await supabase
      .from('holidays')
      .select('id, date, name, country, state, is_active, created_at')
      .order('date', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return ((data ?? []) as HolidayRow[]).map((row) => toHolidayDTO(row))
  }

  async function getHolidaysByYear(year: number): Promise<HolidayDTO[]> {
    if (!Number.isInteger(year) || year < 1) {
      return []
    }

    const { startDate, endDate } = buildYearRange(year)

    const { data, error } = await supabase
      .from('holidays')
      .select('id, date, name, country, state, is_active, created_at')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return ((data ?? []) as HolidayRow[]).map((row) => toHolidayDTO(row))
  }

  async function createHoliday(payload: CreateHolidayDTO): Promise<HolidayDTO> {
    const insertPayload = {
      date: payload.date,
      name: payload.name.trim(),
      country: payload.country?.trim() || null,
      state: payload.state?.trim() || null,
      is_active: payload.is_active ?? true,
    }

    const { data, error } = await supabase
      .from('holidays')
      .insert(insertPayload)
      .select('id, date, name, country, state, is_active, created_at')
      .single()

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to create holiday.')
    }

    return toHolidayDTO(data as HolidayRow)
  }

  async function updateHoliday(id: string, payload: UpdateHolidayDTO): Promise<HolidayDTO> {
    const updatePayload: Record<string, unknown> = {}

    if (payload.date !== undefined) {
      updatePayload.date = payload.date
    }

    if (payload.name !== undefined) {
      updatePayload.name = payload.name.trim()
    }

    if (payload.country !== undefined) {
      updatePayload.country = payload.country?.trim() || null
    }

    if (payload.state !== undefined) {
      updatePayload.state = payload.state?.trim() || null
    }

    if (payload.is_active !== undefined) {
      updatePayload.is_active = payload.is_active
    }

    const { data, error } = await supabase
      .from('holidays')
      .update(updatePayload)
      .eq('id', id)
      .select('id, date, name, country, state, is_active, created_at')
      .single()

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to update holiday.')
    }

    return toHolidayDTO(data as HolidayRow)
  }

  async function deleteHoliday(id: string): Promise<void> {
    const { error } = await supabase
      .from('holidays')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(error.message)
    }
  }

  async function duplicateHolidaysToYear(sourceYear: number, targetYear: number): Promise<DuplicateHolidaysSummary> {
    if (!Number.isInteger(sourceYear) || !Number.isInteger(targetYear) || sourceYear < 1 || targetYear < 1) {
      throw new Error('Source year and target year must be valid numbers.')
    }

    const sourceHolidays = await getHolidaysByYear(sourceYear)
    const targetHolidays = await getHolidaysByYear(targetYear)
    const existingTargetDates = new Set(targetHolidays.map((holiday) => holiday.date))
    const insertPayloads: CreateHolidayDTO[] = []
    let skipped = 0

    for (const holiday of sourceHolidays) {
      const targetDate = buildTargetDate(holiday.date, targetYear)

      if (!targetDate || existingTargetDates.has(targetDate)) {
        skipped += 1
        continue
      }

      insertPayloads.push({
        date: targetDate,
        name: holiday.name,
        country: holiday.country,
        state: holiday.state,
        is_active: holiday.is_active,
      })
      existingTargetDates.add(targetDate)
    }

    if (insertPayloads.length === 0) {
      return {
        created: 0,
        skipped,
      }
    }

    const { error } = await supabase
      .from('holidays')
      .insert(insertPayloads)

    if (error) {
      throw new Error(error.message)
    }

    return {
      created: insertPayloads.length,
      skipped,
    }
  }

  async function getHolidaysByRange(startDate: string, endDate: string): Promise<HolidayDTO[]> {
    if (!startDate || !endDate) {
      return []
    }

    const { data, error } = await supabase
      .from('holidays')
      .select('id, date, name, country, state, is_active, created_at')
      .eq('is_active', true)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return ((data ?? []) as HolidayRow[]).map((row) => toHolidayDTO(row))
  }

  async function isHoliday(date: string): Promise<boolean> {
    if (!date) {
      return false
    }

    const holidays = await getHolidaysByRange(date, date)
    return holidays.length > 0
  }

  return {
    fetchHolidays,
    getHolidaysByYear,
    createHoliday,
    updateHoliday,
    deleteHoliday,
    duplicateHolidaysToYear,
    getHolidaysByRange,
    isHoliday,
  }
}
