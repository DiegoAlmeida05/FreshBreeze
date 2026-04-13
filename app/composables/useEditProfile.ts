import { useSupabaseClient } from './useSupabaseClient'
import { useAuth } from './useAuth'

export interface ProfileUpdatePayload {
  full_name?: string
  email?: string
  photo_url?: string
}

export function useEditProfile() {
  const supabase = useSupabaseClient()
  const { getCurrentUser } = useAuth()

  async function updateProfile(payload: ProfileUpdatePayload): Promise<void> {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('No authenticated user found.')
    }

    // Update auth email if provided
    if (payload.email && payload.email !== user.email) {
      const { error: authEmailError } = await supabase.auth.updateUser({
        email: payload.email,
      })

      if (authEmailError) {
        throw new Error(authEmailError.message)
      }
    }

    // Update profile in public.profiles table
    const updateData: Record<string, unknown> = {}

    if (payload.full_name !== undefined) {
      updateData.full_name = payload.full_name
    }

    if (payload.photo_url !== undefined) {
      updateData.photo_url = payload.photo_url
    }

    if (Object.keys(updateData).length > 0) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

      if (profileError) {
        throw new Error(profileError.message)
      }
    }
  }

  async function updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  return {
    updateProfile,
    updatePassword,
  }
}
