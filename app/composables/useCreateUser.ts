import { useSupabaseClient } from './useSupabaseClient'
import type { EmployeeDTO } from '../../shared/types/EmployeeDTO'

export interface CreateUserPayload {
  email: string
  password: string
  full_name: string
  phone: string | null
  address: string | null
  abn: string | null
  hourly_rate_weekday: number
  hourly_rate_sunday: number
  hourly_rate_holiday: number
  role: 'admin' | 'worker'
}

export interface CreateUserResponse {
  success: boolean
  userId: string
  message: string
}

export function useCreateUser() {
  async function createUser(payload: CreateUserPayload): Promise<CreateUserResponse> {
    const supabase = useSupabaseClient()
    
    // Get access token from current Supabase session
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.access_token) {
      throw new Error('No active session. Please log in first.')
    }

    const response = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.text()
      try {
        const parsed = JSON.parse(error)
        throw new Error(parsed.statusMessage || parsed.message || `API error: ${response.status}`)
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message.includes('API error')) {
          throw parseError
        }
        if (parseError instanceof Error && parseError.message) {
          throw parseError
        }
        throw new Error(`API error: ${response.status}`)
      }
    }

    const data: unknown = await response.json()

    if (!data || typeof data !== 'object' || !('userId' in data)) {
      throw new Error('Invalid response from create-user API.')
    }

    return data as CreateUserResponse
  }

  return {
    createUser,
  }
}
