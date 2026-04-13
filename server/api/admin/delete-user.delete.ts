import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  createError,
  defineEventHandler,
  getHeader,
  readBody,
} from 'h3'

interface DeleteUserBody {
  userId: string
}

interface AuthProfile {
  id: string
  role: 'admin' | 'worker'
  active: boolean
}

function parseBody(body: unknown): DeleteUserBody {
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body.' })
  }

  const parsed = body as Record<string, unknown>
  const userId = typeof parsed.userId === 'string' ? parsed.userId.trim() : ''

  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'userId is required.' })
  }

  return { userId }
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

  const adminClient: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey)

  const { data: requesterData, error: requesterError } = await adminClient.auth.getUser(accessToken)

  if (requesterError || !requesterData.user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid authorization token.' })
  }

  const { data: requesterProfile, error: requesterProfileError } = await adminClient
    .from('profiles')
    .select('id, role, active')
    .eq('id', requesterData.user.id)
    .maybeSingle<AuthProfile>()

  if (requesterProfileError || !requesterProfile || !requesterProfile.active || requesterProfile.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Only admins can perform this action.' })
  }

  const { userId } = parseBody(await readBody(event))

  const { error: deleteEmployeesError } = await adminClient
    .from('employees')
    .delete()
    .eq('profile_id', userId)

  if (deleteEmployeesError) {
    throw createError({ statusCode: 500, statusMessage: deleteEmployeesError.message })
  }

  const { error: deleteProfileError } = await adminClient
    .from('profiles')
    .delete()
    .eq('id', userId)

  if (deleteProfileError) {
    throw createError({ statusCode: 500, statusMessage: deleteProfileError.message })
  }

  const { error: deleteAuthUserError } = await adminClient.auth.admin.deleteUser(userId)

  if (deleteAuthUserError) {
    throw createError({ statusCode: 500, statusMessage: deleteAuthUserError.message })
  }

  return {
    success: true,
    message: 'User deleted successfully',
  }
})
