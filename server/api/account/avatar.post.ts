import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  createError,
  defineEventHandler,
  getHeader,
  readMultipartFormData,
} from 'h3'

const BUCKET_NAME = 'avatars'
const MAX_FILE_SIZE = 5 * 1024 * 1024

async function ensureBucket(client: SupabaseClient): Promise<void> {
  const { data: bucket, error } = await client.storage.getBucket(BUCKET_NAME)

  if (!error && bucket) {
    if (!bucket.public) {
      const { error: updateError } = await client.storage.updateBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: `${MAX_FILE_SIZE}`,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
      })

      if (updateError) {
        throw createError({ statusCode: 500, statusMessage: updateError.message })
      }
    }

    return
  }

  const { error: createBucketError } = await client.storage.createBucket(BUCKET_NAME, {
    public: true,
    fileSizeLimit: `${MAX_FILE_SIZE}`,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
  })

  if (createBucketError && !createBucketError.message.toLowerCase().includes('already exists')) {
    throw createError({ statusCode: 500, statusMessage: createBucketError.message })
  }
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

  const formData = await readMultipartFormData(event)
  const filePart = formData?.find((part) => part.name === 'file')

  if (!filePart?.data || !filePart.type) {
    throw createError({ statusCode: 400, statusMessage: 'Image file is required.' })
  }

  if (!filePart.type.startsWith('image/')) {
    throw createError({ statusCode: 400, statusMessage: 'Please upload a valid image file.' })
  }

  if (filePart.data.byteLength > MAX_FILE_SIZE) {
    throw createError({ statusCode: 400, statusMessage: 'File size must be less than 5MB.' })
  }

  await ensureBucket(adminClient)

  const extension = filePart.filename?.split('.').pop()?.toLowerCase() || 'jpg'
  const filePath = `${requesterData.user.id}/avatar.${extension}`

  const { error: uploadError } = await adminClient.storage
    .from(BUCKET_NAME)
    .upload(filePath, filePart.data, {
      contentType: filePart.type,
      upsert: true,
    })

  if (uploadError) {
    throw createError({ statusCode: 500, statusMessage: uploadError.message })
  }

  const { data: publicUrlData } = adminClient.storage.from(BUCKET_NAME).getPublicUrl(filePath)
  const publicUrl = publicUrlData?.publicUrl

  const avatarUrl = publicUrl
    ? `${publicUrl}${publicUrl.includes('?') ? '&' : '?'}v=${Date.now()}`
    : null

  if (!avatarUrl) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to generate avatar URL.' })
  }

  const { error: updateEmployeeError } = await adminClient
    .from('employees')
    .update({ photo_url: avatarUrl })
    .eq('profile_id', requesterData.user.id)

  if (updateEmployeeError) {
    throw createError({ statusCode: 500, statusMessage: updateEmployeeError.message })
  }

  return {
    success: true,
    avatarUrl,
    message: 'Avatar uploaded successfully.',
  }
})