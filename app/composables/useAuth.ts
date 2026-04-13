import type { User } from '@supabase/supabase-js'
import type { ProfileDTO } from '../../shared/types/ProfileDTO'
import { useSupabaseClient } from './useSupabaseClient'

const REMEMBER_MODE_KEY = 'auth-remember-mode'
const SESSION_ACTIVE_KEY = 'auth-session-active'

type RememberMode = 'persistent' | 'session'

export function useAuth() {
  const supabase = useSupabaseClient()

  async function signIn(email: string, password: string, remember = true): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      throw new Error(error.message)
    }

    if (process.client) {
      const rememberMode: RememberMode = remember ? 'persistent' : 'session'
      localStorage.setItem(REMEMBER_MODE_KEY, rememberMode)
      sessionStorage.setItem(SESSION_ACTIVE_KEY, '1')
    }
  }

  async function signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw new Error(error.message)
    }

    if (process.client) {
      sessionStorage.removeItem(SESSION_ACTIVE_KEY)
    }
  }

  async function getCurrentUser(): Promise<User> {
    const { data, error } = await supabase.auth.getUser()

    if (error || !data.user) {
      throw new Error(error?.message ?? 'User is not authenticated.')
    }

    return data.user
  }

  async function getProfile(): Promise<ProfileDTO> {
    const user = await getCurrentUser()

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, active, created_at, updated_at')
      .eq('id', user.id)
      .single()

    if (error || !data) {
      throw new Error(error?.message ?? 'Profile not found.')
    }

    return data as ProfileDTO
  }

  async function requestPasswordReset(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  async function updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      throw new Error(error.message)
    }
  }

  return {
    signIn,
    signOut,
    getCurrentUser,
    getProfile,
    requestPasswordReset,
    updatePassword,
  }
}
