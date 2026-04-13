import { createClient } from '@supabase/supabase-js'
import { createError, defineEventHandler, getHeader, readBody } from 'h3'

const BUCKET_NAME = 'property-report-photos'

interface DeletePhotoBody {
  photoUrl?: unknown
}

function getStoragePathFromPublicUrl(photoUrl: string): string {
  let parsed: URL

  try {
    parsed = new URL(photoUrl)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid photo URL.' })
  }

  const marker = `/storage/v1/object/public/${BUCKET_NAME}/`
  const fullPath = `${parsed.pathname}${parsed.search}`
  const markerIndex = fullPath.indexOf(marker)

  if (markerIndex === -1) {
    throw createError({ statusCode: 400, statusMessage: 'Photo URL does not belong to the report photo bucket.' })
  }

  const encodedPath = fullPath.slice(markerIndex + marker.length).split('?')[0] ?? ''
  const storagePath = decodeURIComponent(encodedPath)

  if (!storagePath) {
    throw createError({ statusCode: 400, statusMessage: 'Photo URL path is empty.' })
  }

  return storagePath
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const supabaseUrl = config.public.supabaseUrl
  const supabaseServiceRoleKey = config.supabaseServiceRoleKey

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Server configuration is missing Supabase credentials.',
    })
  }

  const authorization = getHeader(event, 'authorization')
  const accessToken = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : null

  if (!accessToken) {
    throw createError({ statusCode: 401, statusMessage: 'Missing authorization token.' })
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey)

  const { data: requesterData, error: requesterError } = await adminClient.auth.getUser(accessToken)

  if (requesterError || !requesterData.user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid authorization token.' })
  }

  const body = await readBody<DeletePhotoBody>(event)
  const photoUrl = typeof body?.photoUrl === 'string' ? body.photoUrl.trim() : ''

  if (!photoUrl) {
    throw createError({ statusCode: 400, statusMessage: 'photoUrl is required.' })
  }

  const storagePath = getStoragePathFromPublicUrl(photoUrl)
  const { error } = await adminClient.storage.from(BUCKET_NAME).remove([storagePath])

  if (error && !error.message.toLowerCase().includes('not found')) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return {
    success: true,
  }
})