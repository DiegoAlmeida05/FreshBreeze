export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const

export interface OptimizeImageOptions {
  maxDimension?: number
  quality?: number
  outputType?: 'image/webp' | 'image/jpeg' | 'image/png'
}

const DEFAULT_OPTIONS: Required<OptimizeImageOptions> = {
  maxDimension: 1600,
  quality: 0.8,
  outputType: 'image/webp',
}

function isAllowedImageType(mimeType: string): boolean {
  return ALLOWED_IMAGE_MIME_TYPES.includes(mimeType as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])
}

function toExtension(mimeType: string): string {
  if (mimeType === 'image/png') return 'png'
  if (mimeType === 'image/jpeg') return 'jpg'
  return 'webp'
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to read image file.'))
    }

    image.src = objectUrl
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, outputType: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to optimize image.'))
          return
        }

        resolve(blob)
      },
      outputType,
      quality,
    )
  })
}

export async function optimizeImageFile(file: File, options: OptimizeImageOptions = {}): Promise<File> {
  if (!isAllowedImageType(file.type)) {
    throw new Error('Invalid file type. Use JPG, JPEG, PNG or WEBP.')
  }

  if (typeof window === 'undefined') {
    return file
  }

  const config = { ...DEFAULT_OPTIONS, ...options }
  const image = await loadImage(file)
  const ratio = Math.min(1, config.maxDimension / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * ratio))
  const height = Math.max(1, Math.round(image.height * ratio))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')

  if (!context) {
    return file
  }

  context.drawImage(image, 0, 0, width, height)

  const blob = await canvasToBlob(canvas, config.outputType, config.quality)
  const extension = toExtension(config.outputType)
  const baseName = file.name.replace(/\.[^.]+$/, '')

  return new File([blob], `${baseName}.${extension}`, { type: config.outputType })
}

export async function optimizeImageFiles(files: File[], options: OptimizeImageOptions = {}): Promise<File[]> {
  const optimizedFiles: File[] = []

  for (const file of files) {
    optimizedFiles.push(await optimizeImageFile(file, options))
  }

  return optimizedFiles
}

export function assertAllowedImageType(file: File): void {
  if (!isAllowedImageType(file.type)) {
    throw new Error('Invalid file type. Use JPG, JPEG, PNG or WEBP.')
  }
}
