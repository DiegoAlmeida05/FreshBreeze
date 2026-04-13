import { useSupabaseClient } from './useSupabaseClient'
import { assertAllowedImageType, optimizeImageFiles } from '../utils/optimizeImage'

const MAX_FILE_SIZE = 3 * 1024 * 1024 // 3MB
const MAX_FILES = 5

export function useUploadPropertyKeyPhoto() {
  const supabase = useSupabaseClient()

  async function uploadOptimizedFile(file: File): Promise<string> {
    assertAllowedImageType(file)

    const [optimizedFile] = await optimizeImageFiles([file], {
      maxDimension: 1600,
      quality: 0.8,
      outputType: 'image/webp',
    })

    if (!optimizedFile || optimizedFile.size > MAX_FILE_SIZE) {
      throw new Error('Optimized image is too large. Please use a smaller photo.')
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      throw new Error('No active session. Please log in first.')
    }

    const formData = new FormData()
  formData.append('file', optimizedFile)

    const response = await fetch('/api/properties/key-photo', {
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
        throw new Error(`Key photo upload failed with status ${response.status}.`)
      }
    }

    if (!response.ok) {
      const message =
        responseData &&
        typeof responseData === 'object' &&
        'statusMessage' in responseData &&
        typeof responseData.statusMessage === 'string'
          ? responseData.statusMessage
          : 'Failed to upload key photo.'

      throw new Error(message)
    }

    if (
      !responseData ||
      typeof responseData !== 'object' ||
      !('keyPhotoUrl' in responseData) ||
      typeof responseData.keyPhotoUrl !== 'string'
    ) {
      throw new Error('Invalid response from key photo upload API.')
    }

    return responseData.keyPhotoUrl
  }

  async function uploadPropertyKeyPhoto(file: File): Promise<string> {
    return uploadOptimizedFile(file)
  }

  async function uploadPropertyKeyPhotos(files: File[]): Promise<string[]> {
    if (files.length === 0) {
      return []
    }

    if (files.length > MAX_FILES) {
      throw new Error('Maximum 5 photos allowed.')
    }

    const uploadedUrls: string[] = []

    for (const file of files) {
      uploadedUrls.push(await uploadOptimizedFile(file))
    }

    return uploadedUrls
  }

  return {
    uploadPropertyKeyPhoto,
    uploadPropertyKeyPhotos,
  }
}
