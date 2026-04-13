import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  createError,
  defineEventHandler,
  getHeader,
  readBody,
} from 'h3'

type UserRole = 'admin' | 'worker'

interface CreateUserBody {
  email: string
  password: string
  full_name: string
  phone: string | null
  address: string | null
  abn: string | null
  hourly_rate_weekday: number
  hourly_rate_sunday: number
  hourly_rate_holiday: number
  role: UserRole
}

interface EmployeeInsertPayload {
  profile_id: string
  full_name: string
  email: string
  phone: string | null
  address: string | null
  abn: string | null
  hourly_rate_weekday: number
  hourly_rate_sunday: number
  hourly_rate_holiday: number
  active: boolean
}

interface AuthProfile {
  id: string
  full_name: string | null
  email: string | null
  role: UserRole
  active: boolean
}

function parseNullableString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function parseNumber(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
    throw createError({ statusCode: 400, statusMessage: `Invalid ${fieldName}.` })
  }

  return value
}

async function insertEmployee(
  adminClient: SupabaseClient,
  payload: EmployeeInsertPayload,
): Promise<void> {
  const insertResult = await adminClient
    .schema('public')
    .from('employees')
    .insert(payload)

  if (insertResult.error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to create employee: ${insertResult.error.message}`,
    })
  }
}

function parseBody(rawBody: unknown): CreateUserBody {
  if (!rawBody || typeof rawBody !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body.' })
  }

  const body = rawBody as Record<string, unknown>

  if (typeof body.email !== 'string' || body.email.trim().length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Email is required.' })
  }

  if (typeof body.password !== 'string' || body.password.length < 6) {
    throw createError({ statusCode: 400, statusMessage: 'Password must have at least 6 characters.' })
  }

  if (typeof body.full_name !== 'string' || body.full_name.trim().length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Full name is required.' })
  }

  if (body.role !== 'admin' && body.role !== 'worker') {
    throw createError({ statusCode: 400, statusMessage: 'Role must be admin or worker.' })
  }

  return {
    email: body.email.trim().toLowerCase(),
    password: body.password,
    full_name: body.full_name.trim(),
    phone: parseNullableString(body.phone),
    address: parseNullableString(body.address),
    abn: parseNullableString(body.abn),
    hourly_rate_weekday: parseNumber(body.hourly_rate_weekday, 'hourly_rate_weekday'),
    hourly_rate_sunday: parseNumber(body.hourly_rate_sunday, 'hourly_rate_sunday'),
    hourly_rate_holiday: parseNumber(body.hourly_rate_holiday, 'hourly_rate_holiday'),
    role: body.role,
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const supabaseUrl = config.public.supabaseUrl
  const supabaseServiceRoleKey = config.supabaseServiceRoleKey

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Server configuration is missing supabaseUrl or supabaseServiceRoleKey.',
    })
  }

  const adminClient: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey)

  const authorization = getHeader(event, 'authorization')
  const accessToken = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : null

  if (!accessToken) {
    throw createError({ statusCode: 401, statusMessage: 'Missing authorization token.' })
  }

  const { data: requesterData, error: requesterError } = await adminClient.auth.getUser(accessToken)

  if (requesterError || !requesterData.user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid authorization token.' })
  }

  const { data: requesterProfile, error: requesterProfileError } = await adminClient
    .from('profiles')
    .select('id, full_name, email, role, active')
    .eq('id', requesterData.user.id)
    .maybeSingle<AuthProfile>()

  if (requesterProfileError || !requesterProfile || !requesterProfile.active) {
    throw createError({ statusCode: 403, statusMessage: 'Requester profile is not active.' })
  }

  if (requesterProfile.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Only admins can create users.' })
  }

  const payload = parseBody(await readBody(event))

  const { data: existingProfile, error: existingProfileError } = await adminClient
    .schema('public')
    .from('profiles')
    .select('id, full_name, email, role, active')
    .eq('email', payload.email)
    .maybeSingle<AuthProfile>()

  if (existingProfileError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to check existing profile: ${existingProfileError.message}`,
    })
  }

  if (existingProfile) {
    const { data: existingEmployee, error: existingEmployeeError } = await adminClient
      .schema('public')
      .from('employees')
      .select('id')
      .eq('profile_id', existingProfile.id)
      .maybeSingle<{ id: string }>()

    if (existingEmployeeError) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to check existing employee: ${existingEmployeeError.message}`,
      })
    }

    if (existingEmployee) {
      throw createError({
        statusCode: 409,
        statusMessage: 'This user already exists and already has an employee record.',
      })
    }

    await insertEmployee(adminClient, {
      profile_id: existingProfile.id,
      full_name: payload.full_name,
      email: payload.email,
      phone: payload.phone,
      address: payload.address,
      abn: payload.abn,
      hourly_rate_weekday: payload.hourly_rate_weekday,
      hourly_rate_sunday: payload.hourly_rate_sunday,
      hourly_rate_holiday: payload.hourly_rate_holiday,
      active: true,
    })

    return {
      success: true,
      userId: existingProfile.id,
      message: 'Existing user linked to employee successfully',
    }
  }

  const { data: createdAuthData, error: createAuthError } = await adminClient.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true,
  })

  if (createAuthError || !createdAuthData.user) {
    throw createError({
      statusCode: createAuthError?.message?.toLowerCase().includes('already') ? 409 : 500,
      statusMessage: createAuthError?.message ?? 'Failed to create auth user.',
    })
  }

  const userId = createdAuthData.user.id

  const { error: profileError } = await adminClient
    .schema('public')
    .from('profiles')
    .insert({
      id: userId,
      full_name: payload.full_name,
      email: payload.email,
      role: payload.role,
      active: true,
    })

  if (profileError) {
    await adminClient.auth.admin.deleteUser(userId)

    throw createError({
      statusCode: 500,
      statusMessage: `Failed to create profile: ${profileError.message}`,
    })
  }

  try {
    await insertEmployee(adminClient, {
      profile_id: userId,
      full_name: payload.full_name,
      email: payload.email,
      phone: payload.phone,
      address: payload.address,
      abn: payload.abn,
      hourly_rate_weekday: payload.hourly_rate_weekday,
      hourly_rate_sunday: payload.hourly_rate_sunday,
      hourly_rate_holiday: payload.hourly_rate_holiday,
      active: true,
    })
  } catch (employeeError: unknown) {
    await adminClient
      .schema('public')
      .from('profiles')
      .delete()
      .eq('id', userId)

    await adminClient.auth.admin.deleteUser(userId)

    if (employeeError instanceof Error) {
      throw createError({
        statusCode: 500,
        statusMessage: employeeError.message,
      })
    }

    throw employeeError
  }

  return {
    success: true,
    userId,
    message: 'User created successfully',
  }
})
