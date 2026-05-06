import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createError, defineEventHandler, getHeader, readBody } from 'h3'
import { isPlatformOwnerEmail } from '../../utils/platformOwner'

type UserRole = 'admin' | 'worker'

interface UpdateUserRoleBody {
  userId: string
  role: UserRole
}

interface AuthProfile {
  id: string
  role: UserRole
  active: boolean
}

function parseBody(body: unknown): UpdateUserRoleBody {
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body.' })
  }

  const parsed = body as Record<string, unknown>
  const userId = typeof parsed.userId === 'string' ? parsed.userId.trim() : ''
  const role = parsed.role

  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'userId is required.' })
  }

  if (role !== 'admin' && role !== 'worker') {
    throw createError({ statusCode: 400, statusMessage: 'role must be admin or worker.' })
  }

  return {
    userId,
    role,
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

  const { userId, role } = parseBody(await readBody(event))

  const { data: targetProfile, error: targetProfileError } = await adminClient
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .maybeSingle<{ email: string | null }>()

  if (targetProfileError) {
    throw createError({ statusCode: 500, statusMessage: targetProfileError.message })
  }

  let targetEmail = targetProfile?.email ?? null

  if (!targetEmail) {
    const { data: targetAuthUserData, error: targetAuthUserError } = await adminClient.auth.admin.getUserById(userId)

    if (targetAuthUserError) {
      throw createError({ statusCode: 500, statusMessage: targetAuthUserError.message })
    }

    targetEmail = targetAuthUserData.user?.email ?? null
  }

  if (isPlatformOwnerEmail(targetEmail)) {
    throw createError({ statusCode: 403, statusMessage: 'Cannot modify platform owner' })
  }

  if (requesterData.user.id === userId && role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'You cannot remove your own admin role.',
    })
  }

  const { error: updateProfileError } = await adminClient
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  if (updateProfileError) {
    throw createError({ statusCode: 500, statusMessage: updateProfileError.message })
  }

  return {
    success: true,
    message: 'User role updated successfully',
  }
})
