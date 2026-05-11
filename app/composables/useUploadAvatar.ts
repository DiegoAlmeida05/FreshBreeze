import { useSupabaseClient } from './useSupabaseClient'
import { optimizeImageFiles } from '../utils/optimizeImage'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

interface UploadAvatarOptions {
  onProgress?: (progress: number) => void
}

export function useUploadAvatar() {
  const supabase = useSupabaseClient()

  async function optimizeAvatar(file: File): Promise<File> {
    const [optimizedWebp] = await optimizeImageFiles([file], {
      maxDimension: 1280,
      quality: 0.76,
      outputType: 'image/webp',
    })

    if (optimizedWebp && optimizedWebp.size <= MAX_FILE_SIZE) {
      return optimizedWebp
    }

    const [optimizedJpeg] = await optimizeImageFiles([file], {
      maxDimension: 1280,
      quality: 0.74,
      outputType: 'image/jpeg',
    })

    if (!optimizedJpeg || optimizedJpeg.size > MAX_FILE_SIZE) {
      throw new Error('File size must be less than 5MB after optimization.')
    }

    return optimizedJpeg
  }

  function uploadWithProgress(file: File, accessToken: string, onProgress?: (progress: number) => void): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest()
      const formData = new FormData()
      formData.append('file', file)

      request.open('POST', '/api/account/avatar')
      request.setRequestHeader('Authorization', `Bearer ${accessToken}`)

      request.upload.onprogress = (event) => {
        if (!onProgress || !event.lengthComputable) {
          return
        }

        onProgress(Math.min(100, Math.max(0, Math.round((event.loaded / event.total) * 100))))
      }

      request.onerror = () => {
        reject(new Error('Failed to upload photo. Please check your internet connection.'))
      }

      request.onload = () => {
        let responseData: unknown = null

        if (request.responseText) {
          try {
            responseData = JSON.parse(request.responseText) as unknown
          } catch {
            // Keep null fallback.
          }
        }

        if (request.status < 200 || request.status >= 300) {
          const message =
            responseData &&
            typeof responseData === 'object' &&
            'statusMessage' in responseData &&
            typeof responseData.statusMessage === 'string'
              ? responseData.statusMessage
              : `Avatar upload failed with status ${request.status}.`

          reject(new Error(message))
          return
        }

        resolve(responseData)
      }

      request.send(formData)
    })
  }

  async function uploadAvatar(file: File, options?: UploadAvatarOptions): Promise<string> {
    if (!file.type.startsWith('image/')) {
      throw new Error('Please upload a valid image file.')
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size must be less than 10MB.')
    }

    const optimizedFile = await optimizeAvatar(file)

    if (optimizedFile.size > MAX_FILE_SIZE) {
      throw new Error('File size must be less than 5MB.')
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      throw new Error('No active session. Please log in first.')
    }

    const responseData = await uploadWithProgress(optimizedFile, session.access_token, options?.onProgress)

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
