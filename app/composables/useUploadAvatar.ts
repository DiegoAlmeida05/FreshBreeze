import { useSupabaseClient } from './useSupabaseClient'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function useUploadAvatar() {
  const supabase = useSupabaseClient()

  async function uploadAvatar(file: File): Promise<string> {
    if (!file.type.startsWith('image/')) {
      throw new Error('Please upload a valid image file.')
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size must be less than 5MB.')
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      throw new Error('No active session. Please log in first.')
    }

    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/account/avatar', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: formData,
    })

    let responseData: unknown = null

    try {
      responseData = await response.json()
    } catch {
      if (!response.ok) {
        throw new Error(`Avatar upload failed with status ${response.status}.`)
      }
    }

    if (!response.ok) {
      const message =
        responseData &&
        typeof responseData === 'object' &&
        'statusMessage' in responseData &&
        typeof responseData.statusMessage === 'string'
          ? responseData.statusMessage
          : 'Failed to upload photo.'

      throw new Error(message)
    }

    if (
      !responseData ||
      typeof responseData !== 'object' ||
      !('avatarUrl' in responseData) ||
      typeof responseData.avatarUrl !== 'string'
    ) {
      throw new Error('Invalid response from avatar upload API.')
    }

    return responseData.avatarUrl
  }

  return {
    uploadAvatar,
  }
}
