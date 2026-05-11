import type { User } from '@supabase/supabase-js'
import type { ProfileDTO } from '../../shared/types/ProfileDTO'
import { useSupabaseClient } from './useSupabaseClient'

const REMEMBER_MODE_KEY = 'auth-remember-mode'
const SESSION_ACTIVE_KEY = 'auth-session-active'

type RememberMode = 'persistent' | 'session'

const USER_CACHE_TTL_MS = 30 * 1000
const PROFILE_CACHE_TTL_MS = 60 * 1000

let cachedUserEntry: { user: User; expiresAt: number } | null = null
let cachedProfileEntry: { userId: string; profile: ProfileDTO; expiresAt: number } | null = null
let userRequest: Promise<User> | null = null
let profileRequest: Promise<ProfileDTO> | null = null

function clearAuthCaches(): void {
  cachedUserEntry = null
  cachedProfileEntry = null
}

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

    clearAuthCaches()
  }

  async function signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw new Error(error.message)
    }

    if (process.client) {
      sessionStorage.removeItem(SESSION_ACTIVE_KEY)
    }

    clearAuthCaches()
  }

  async function getCurrentUser(): Promise<User> {
    if (cachedUserEntry && cachedUserEntry.expiresAt > Date.now()) {
      return cachedUserEntry.user
    }

    if (!userRequest) {
      userRequest = (async () => {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          throw new Error(sessionError.message)
        }

        const sessionUser = sessionData.session?.user
        if (sessionUser) {
          cachedUserEntry = {
            user: sessionUser,
            expiresAt: Date.now() + USER_CACHE_TTL_MS,
          }

          return sessionUser
        }

        const { data, error } = await supabase.auth.getUser()

        if (error || !data.user) {
          throw new Error(error?.message ?? 'User is not authenticated.')
        }

        cachedUserEntry = {
          user: data.user,
          expiresAt: Date.now() + USER_CACHE_TTL_MS,
        }

        return data.user
      })()
    }

    try {
      return await userRequest
    } finally {
      userRequest = null
    }
  }

  async function getProfile(): Promise<ProfileDTO> {
    const user = await getCurrentUser()

    if (
      cachedProfileEntry &&
      cachedProfileEntry.userId === user.id &&
      cachedProfileEntry.expiresAt > Date.now()
    ) {
      return cachedProfileEntry.profile
    }

    if (!profileRequest) {
      profileRequest = (async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, role, active, created_at, updated_at')
          .eq('id', user.id)
          .single()

        if (error || !data) {
          throw new Error(error?.message ?? 'Profile not found.')
        }

        const profile = data as ProfileDTO
        cachedProfileEntry = {
          userId: user.id,
          profile,
          expiresAt: Date.now() + PROFILE_CACHE_TTL_MS,
        }

        return profile
      })()
    }

    try {
      return await profileRequest
    } finally {
      profileRequest = null
    }
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

  /**
   * Restores and validates the Supabase session after network reconnection.
   * Clears in-memory caches and fetches fresh session from Supabase.
   * This prevents stale session tokens from blocking user access on reconnection.
   */
  async function restoreSessionAfterReconnection(): Promise<void> {
    try {
      clearAuthCaches()

      const { data, error } = await supabase.auth.getSession()

      if (error) {
        throw new Error(error.message)
      }

      if (!data.session) {
        throw new Error('No active session')
      }
    } catch (err) {
      clearAuthCaches()
      throw err
    }
  }

  return {
    signIn,
    signOut,
    getCurrentUser,
    getProfile,
    requestPasswordReset,
    updatePassword,
    restoreSessionAfterReconnection,
    clearAuthCaches: () => clearAuthCaches(),
  }
}
