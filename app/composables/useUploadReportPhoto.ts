import { useSupabaseClient } from './useSupabaseClient'
import { assertAllowedImageType, optimizeImageFiles } from '../utils/optimizeImage'

const MAX_FILE_SIZE = 3 * 1024 * 1024 // 3MB
const MAX_FILES = 5

type UploadPhase = 'compressing' | 'uploading'

interface UploadProgressMeta {
  phase: UploadPhase
  fileIndex: number
  totalFiles: number
  fileName: string
}

interface UploadReportPhotosOptions {
  onProgress?: (progress: number, meta: UploadProgressMeta) => void
}

export function useUploadReportPhoto() {
  const supabase = useSupabaseClient()

  function emitProgress(
    options: UploadReportPhotosOptions | undefined,
    progress: number,
    meta: UploadProgressMeta,
  ): void {
    if (!options?.onProgress) {
      return
    }

    const safeProgress = Math.min(100, Math.max(0, Math.round(progress)))
    options.onProgress(safeProgress, meta)
  }

  async function optimizeWithFallback(file: File): Promise<File> {
    try {
      const [optimizedWebp] = await optimizeImageFiles([file], {
        maxDimension: 1600,
        quality: 0.78,
        outputType: 'image/webp',
      })

      if (optimizedWebp && optimizedWebp.size <= MAX_FILE_SIZE) {
        return optimizedWebp
      }
    } catch {
      // Fallback handled below.
    }

    const [optimizedJpeg] = await optimizeImageFiles([file], {
      maxDimension: 1600,
      quality: 0.76,
      outputType: 'image/jpeg',
    })

    if (!optimizedJpeg || optimizedJpeg.size > MAX_FILE_SIZE) {
      throw new Error('Optimized image is too large. Please use a smaller photo.')
    }

    return optimizedJpeg
  }

  function uploadWithProgress(file: File, accessToken: string, onProgress?: (progress: number) => void): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest()
      const formData = new FormData()
      formData.append('file', file)

      request.open('POST', '/api/properties/report-photo')
      request.setRequestHeader('Authorization', `Bearer ${accessToken}`)

      request.upload.onprogress = (event) => {
        if (!onProgress || !event.lengthComputable) {
          return
        }

        const progress = (event.loaded / event.total) * 100
        onProgress(progress)
      }

      request.onerror = () => {
        reject(new Error('Failed to upload report photo. Please check your internet connection.'))
      }

      request.onload = () => {
        let responseData: unknown = null

        if (request.responseText) {
          try {
            responseData = JSON.parse(request.responseText) as unknown
          } catch {
            // Keep response as null if parsing fails.
          }
        }

        if (request.status < 200 || request.status >= 300) {
          const message =
            responseData &&
            typeof responseData === 'object' &&
            'statusMessage' in responseData &&
            typeof responseData.statusMessage === 'string'
              ? responseData.statusMessage
              : `Report photo upload failed with status ${request.status}.`

          reject(new Error(message))
          return
        }

        resolve(responseData)
      }

      request.send(formData)
    })
  }

  async function uploadOptimizedFile(file: File, fileIndex: number, totalFiles: number, options?: UploadReportPhotosOptions): Promise<string> {
    assertAllowedImageType(file)

    emitProgress(options, ((fileIndex + 0.1) / totalFiles) * 100, {
      phase: 'compressing',
      fileIndex,
      totalFiles,
      fileName: file.name,
    })

    const optimizedFile = await optimizeWithFallback(file)

    emitProgress(options, ((fileIndex + 0.45) / totalFiles) * 100, {
      phase: 'uploading',
      fileIndex,
      totalFiles,
      fileName: file.name,
    })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      throw new Error('No active session. Please log in first.')
    }

    const responseData = await uploadWithProgress(optimizedFile, session.access_token, (progress) => {
      const unitStart = fileIndex / totalFiles
      const unitEnd = (fileIndex + 1) / totalFiles
      const scaled = unitStart + ((unitEnd - unitStart) * (progress / 100))

      emitProgress(options, scaled * 100, {
        phase: 'uploading',
        fileIndex,
        totalFiles,
        fileName: file.name,
      })
    })

    if (
      !responseData ||
      typeof responseData !== 'object' ||
      !('photoUrl' in responseData) ||
      typeof responseData.photoUrl !== 'string'
    ) {
      throw new Error('Invalid response from report photo upload API.')
    }

    return responseData.photoUrl
  }

  async function uploadReportPhoto(file: File, options?: UploadReportPhotosOptions): Promise<string> {
    return uploadOptimizedFile(file, 0, 1, options)
  }

  async function uploadReportPhotos(files: File[], options?: UploadReportPhotosOptions): Promise<string[]> {
    if (files.length === 0) {
      return []
    }

    if (files.length > MAX_FILES) {
      throw new Error('Maximum 5 photos allowed.')
    }

    const uploadedUrls: string[] = []

    for (const [index, file] of files.entries()) {
      uploadedUrls.push(await uploadOptimizedFile(file, index, files.length, options))
    }

    emitProgress(options, 100, {
      phase: 'uploading',
      fileIndex: files.length - 1,
      totalFiles: files.length,
      fileName: files[files.length - 1]?.name ?? '',
    })

    return uploadedUrls
  }

  async function deleteReportPhoto(photoUrl: string): Promise<void> {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      throw new Error('No active session. Please log in first.')
    }

    const response = await fetch('/api/properties/report-photo', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ photoUrl }),
    })

    let responseData: unknown = null

    try {
      responseData = await response.json()
    } catch {
      if (!response.ok) {
        throw new Error(`Report photo delete failed with status ${response.status}.`)
      }
    }

    if (!response.ok) {
      const message =
        responseData &&
        typeof responseData === 'object' &&
        'statusMessage' in responseData &&
        typeof responseData.statusMessage === 'string'
          ? responseData.statusMessage
          : 'Failed to delete report photo.'

      throw new Error(message)
    }
  }

  return {
    uploadReportPhoto,
    uploadReportPhotos,
    deleteReportPhoto,
  }
}
