import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createError, defineEventHandler, getHeader, readBody } from 'h3'
import { isPlatformOwnerEmail } from '../../utils/platformOwner'

type UserRole = 'admin' | 'worker'

interface ProfilesRolesBody {
  profileIds: string[]
}

interface AuthProfile {
  id: string
  role: UserRole
  active: boolean
}

interface RoleRow {
  id: string
  role: UserRole
  email: string | null
}

function parseBody(body: unknown): ProfilesRolesBody {
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body.' })
  }

  const parsed = body as Record<string, unknown>
  const input = Array.isArray(parsed.profileIds) ? parsed.profileIds : []

  const profileIds = input
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter((value) => value.length > 0)

  return {
    profileIds: Array.from(new Set(profileIds)).slice(0, 500),
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

  const { profileIds } = parseBody(await readBody(event))

  if (profileIds.length === 0) {
    return {
      roles: {} as Record<string, UserRole>,
      owners: {} as Record<string, boolean>,
    }
  }

  const { data, error } = await adminClient
    .from('profiles')
    .select('id, role, email')
    .in('id', profileIds)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  const roles: Record<string, UserRole> = {}
  const owners: Record<string, boolean> = {}

  for (const row of (data ?? []) as RoleRow[]) {
    roles[row.id] = row.role === 'admin' ? 'admin' : 'worker'
    owners[row.id] = isPlatformOwnerEmail(row.email)
  }

  return { roles, owners }
})
