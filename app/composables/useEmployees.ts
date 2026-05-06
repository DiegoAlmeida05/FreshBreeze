import type { CreateEmployeeDTO, EmployeeDTO, UpdateEmployeeDTO } from '../../shared/types/EmployeeDTO'
import { useSupabaseClient } from './useSupabaseClient'

const employeeSelectFieldsBase = 'id, profile_id, full_name, email, phone, address, abn, photo_url, hourly_rate_weekday, hourly_rate_sunday, hourly_rate_holiday, active, created_at, updated_at'

type UserRole = 'admin' | 'worker'

function normalizeRole(value: unknown): 'admin' | 'worker' {
  return value === 'admin' ? 'admin' : 'worker'
}

function toEmployeeDTO(
  row: Record<string, unknown>,
  role: 'admin' | 'worker' = 'worker',
  isPlatformOwner = false,
): EmployeeDTO {
  return {
    id: String(row.id),
    profile_id: (row.profile_id ?? null) as string | null,
    role,
    is_platform_owner: isPlatformOwner,
    full_name: String(row.full_name ?? ''),
    email: (row.email ?? null) as string | null,
    phone: (row.phone ?? null) as string | null,
    address: (row.address ?? null) as string | null,
    abn: (row.abn ?? null) as string | null,
    photo_url: (row.photo_url ?? null) as string | null,
    hourly_rate_weekday: Number(row.hourly_rate_weekday ?? 0),
    hourly_rate_sunday: Number(row.hourly_rate_sunday ?? 0),
    hourly_rate_holiday: Number(row.hourly_rate_holiday ?? 0),
    active: Boolean(row.active),
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  }
}

export function useEmployees() {
  const supabase = useSupabaseClient()

  async function loadRoleMap(profileIds: string[]): Promise<{
    roleMap: Map<string, 'admin' | 'worker'>
    ownerMap: Map<string, boolean>
  }> {
    const roleMap = new Map<string, 'admin' | 'worker'>()
    const ownerMap = new Map<string, boolean>()

    if (profileIds.length === 0) {
      return { roleMap, ownerMap }
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      throw new Error('No active session. Please log in first.')
    }

    const response = await fetch('/api/admin/profiles-roles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ profileIds }),
    })

    if (!response.ok) {
      let message = `API error: ${response.status}`

      try {
        const body = await response.json() as { statusMessage?: string; message?: string }
        message = body.statusMessage || body.message || message
      } catch {
        // Keep default message when response is not JSON.
      }

      throw new Error(message)
    }

    const payload = await response.json() as {
      roles?: Record<string, UserRole>
      owners?: Record<string, boolean>
    }
    const roles = payload.roles ?? {}
    const owners = payload.owners ?? {}

    for (const [id, role] of Object.entries(roles)) {
      roleMap.set(id, normalizeRole(role))
    }

    for (const [id, isOwner] of Object.entries(owners)) {
      ownerMap.set(id, Boolean(isOwner))
    }

    return { roleMap, ownerMap }
  }

  async function getEmployees(): Promise<EmployeeDTO[]> {
    const { data, error } = await supabase
      .from('employees')
      .select(employeeSelectFieldsBase)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    const employeeRows = (data ?? []) as Record<string, unknown>[]
    const profileIds = employeeRows
      .map((row) => row.profile_id)
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)

    const { roleMap, ownerMap } = await loadRoleMap(profileIds)

    return employeeRows.map((row) => {
      const profileId = typeof row.profile_id === 'string' ? row.profile_id : null

      if (!profileId) {
        return toEmployeeDTO(row, 'worker', false)
      }

      return toEmployeeDTO(row, roleMap.get(profileId) ?? 'worker', ownerMap.get(profileId) ?? false)
    })
  }

  async function getEmployeeById(id: string): Promise<EmployeeDTO | null> {
    const { data, error } = await supabase
      .from('employees')
      .select(employeeSelectFieldsBase)
      .eq('id', id)
      .maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    if (!data) {
      return null
    }

    const employeeRow = data as Record<string, unknown>
    const profileId = typeof employeeRow.profile_id === 'string' ? employeeRow.profile_id : null

    if (!profileId) {
      return toEmployeeDTO(employeeRow, 'worker', false)
    }

    const { roleMap, ownerMap } = await loadRoleMap([profileId])
    return toEmployeeDTO(employeeRow, roleMap.get(profileId) ?? 'worker', ownerMap.get(profileId) ?? false)
  }

  async function createEmployee(payload: CreateEmployeeDTO): Promise<EmployeeDTO> {
    const { data, error } = await supabase
      .from('employees')
      .insert(payload)
      .select(employeeSelectFieldsBase)
      .single()

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to create employee.')
    }

    return toEmployeeDTO(data as Record<string, unknown>, 'worker', false)
  }

  async function updateEmployee(id: string, payload: UpdateEmployeeDTO): Promise<EmployeeDTO> {
    const { data, error } = await supabase
      .from('employees')
      .update(payload)
      .eq('id', id)
      .select(employeeSelectFieldsBase)
      .single()

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to update employee.')
    }

    const employeeRow = data as Record<string, unknown>
    const profileId = typeof employeeRow.profile_id === 'string' ? employeeRow.profile_id : null

    if (!profileId) {
      return toEmployeeDTO(employeeRow, 'worker', false)
    }

    const { roleMap, ownerMap } = await loadRoleMap([profileId])
    return toEmployeeDTO(employeeRow, roleMap.get(profileId) ?? 'worker', ownerMap.get(profileId) ?? false)
  }

  async function deleteEmployee(id: string): Promise<void> {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(error.message)
    }
  }

  async function deleteEmployeeUser(userId: string): Promise<void> {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      throw new Error('No active session. Please log in first.')
    }

    const response = await fetch('/api/admin/delete-user', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ userId }),
    })

    if (!response.ok) {
      let message = `API error: ${response.status}`

      try {
        const body = await response.json() as { statusMessage?: string; message?: string }
        message = body.statusMessage || body.message || message
      } catch {
        // Keep default message when response is not JSON.
      }

      throw new Error(message)
    }
  }

  async function updateEmployeeUserRole(userId: string, role: 'admin' | 'worker'): Promise<void> {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      throw new Error('No active session. Please log in first.')
    }

    const response = await fetch('/api/admin/update-user-role', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ userId, role }),
    })

    if (!response.ok) {
      let message = `API error: ${response.status}`

      try {
        const body = await response.json() as { statusMessage?: string; message?: string }
        message = body.statusMessage || body.message || message
      } catch {
        // Keep default message when response is not JSON.
      }

      throw new Error(message)
    }
  }

  return {
    getEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    deleteEmployeeUser,
    updateEmployeeUserRole,
  }
}
