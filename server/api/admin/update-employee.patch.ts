import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createError, defineEventHandler, getHeader, readBody, type H3Event } from 'h3'
import { isPlatformOwnerEmail } from '../../utils/platformOwner'

type UserRole = 'admin' | 'worker'

type UpdateEmployeeBody = {
  employeeId: string
  payload: Record<string, unknown>
}

interface AuthProfile {
  id: string
  role: UserRole
  active: boolean
  email: string | null
}

interface EmployeeTarget {
  id: string
  profile_id: string | null
  email: string | null
}

interface ProfileEmailRow {
  id: string
  email: string | null
}

const ALLOWED_FIELDS = new Set([
  'full_name',
  'email',
  'phone',
  'address',
  'abn',
  'photo_url',
  'hourly_rate_weekday',
  'hourly_rate_sunday',
  'hourly_rate_holiday',
  'active',
])

const employeeSelectFieldsBase = 'id, profile_id, full_name, email, phone, address, abn, photo_url, hourly_rate_weekday, hourly_rate_sunday, hourly_rate_holiday, active, created_at, updated_at'

function sanitizeNullableString(value: unknown): string | null {
  if (value === null) {
    return null
  }

  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid string field in employee payload.' })
  }

  return value.trim()
}

function sanitizeRate(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid hourly rate in employee payload.' })
  }

  return Number(value)
}

function parseBody(body: unknown): UpdateEmployeeBody {
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body.' })
  }

  const parsed = body as Record<string, unknown>
  const employeeId = typeof parsed.employeeId === 'string' ? parsed.employeeId.trim() : ''
  const payload = parsed.payload

  if (!employeeId) {
    throw createError({ statusCode: 400, statusMessage: 'Employee id is required.' })
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw createError({ statusCode: 400, statusMessage: 'Employee payload is required.' })
  }

  return {
    employeeId,
    payload: payload as Record<string, unknown>,
  }
}

function sanitizePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const updateData: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(payload)) {
    if (!ALLOWED_FIELDS.has(key)) {
      continue
    }

    if (key === 'active') {
      if (typeof value !== 'boolean') {
        throw createError({ statusCode: 400, statusMessage: 'Field "active" must be a boolean.' })
      }

      updateData.active = value
      continue
    }

    if (key === 'hourly_rate_weekday' || key === 'hourly_rate_sunday' || key === 'hourly_rate_holiday') {
      updateData[key] = sanitizeRate(value)
      continue
    }

    updateData[key] = sanitizeNullableString(value)
  }

  if (Object.keys(updateData).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No editable fields were provided.' })
  }

  return updateData
}

function normalizeEmail(value: string | null): string | null {
  if (!value) {
    return null
  }

  const normalized = value.trim().toLowerCase()
  return normalized.length > 0 ? normalized : null
}

async function requireAdminUser(event: H3Event, adminClient: SupabaseClient): Promise<{ isRequesterOwner: boolean }> {
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
    .select('id, role, active, email')
    .eq('id', requesterData.user.id)
    .maybeSingle<AuthProfile>()

  if (requesterProfileError || !requesterProfile || !requesterProfile.active || requesterProfile.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Only admins can perform this action.' })
  }

  const requesterEmail = requesterData.user.email ?? requesterProfile.email

  return {
    isRequesterOwner: isPlatformOwnerEmail(requesterEmail),
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

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey)
  const { isRequesterOwner } = await requireAdminUser(event, adminClient)

  const { employeeId, payload } = parseBody(await readBody(event))
  const updateData = sanitizePayload(payload)

  const { data: targetEmployee, error: targetEmployeeError } = await adminClient
    .from('employees')
    .select('id, profile_id, email')
    .eq('id', employeeId)
    .maybeSingle<EmployeeTarget>()

  if (targetEmployeeError) {
    throw createError({ statusCode: 500, statusMessage: targetEmployeeError.message })
  }

  if (!targetEmployee) {
    throw createError({ statusCode: 404, statusMessage: 'Employee not found.' })
  }

  if (targetEmployee.profile_id) {
    const { data: sameProfileRows, error: sameProfileRowsError } = await adminClient
      .from('employees')
      .select('id')
      .eq('profile_id', targetEmployee.profile_id)

    if (sameProfileRowsError) {
      throw createError({ statusCode: 500, statusMessage: sameProfileRowsError.message })
    }

    const conflictRow = (sameProfileRows ?? []).find((row) => row.id !== employeeId)
    if (conflictRow) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Data integrity error: this profile is linked to more than one employee.',
      })
    }
  }

  if (Object.prototype.hasOwnProperty.call(updateData, 'email')) {
    const normalizedEmail = normalizeEmail((updateData.email ?? null) as string | null)

    if (normalizedEmail) {
      const { data: matchingEmailRows, error: matchingEmailRowsError } = await adminClient
        .from('employees')
        .select('id')
        .ilike('email', normalizedEmail)

      if (matchingEmailRowsError) {
        throw createError({ statusCode: 500, statusMessage: matchingEmailRowsError.message })
      }

      const conflictingEmailRow = (matchingEmailRows ?? []).find((row) => row.id !== employeeId)
      if (conflictingEmailRow) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Email is already in use by another employee.',
        })
      }
    }
  }

  let targetOwnerEmail: string | null = targetEmployee.email

  if (targetEmployee.profile_id) {
    const { data: targetProfile, error: targetProfileError } = await adminClient
      .from('profiles')
      .select('id, email')
      .eq('id', targetEmployee.profile_id)
      .maybeSingle<ProfileEmailRow>()

    if (targetProfileError) {
      throw createError({ statusCode: 500, statusMessage: targetProfileError.message })
    }

    targetOwnerEmail = targetProfile?.email ?? targetOwnerEmail
  }

  if (isPlatformOwnerEmail(targetOwnerEmail) && !isRequesterOwner) {
    throw createError({ statusCode: 403, statusMessage: 'Platform owner cannot be modified by non-owner admins.' })
  }

  const { data: updatedEmployee, error: updateError } = await adminClient
    .from('employees')
    .update(updateData)
    .eq('id', employeeId)
    .select(employeeSelectFieldsBase)
    .single()

  if (updateError || !updatedEmployee) {
    throw createError({ statusCode: 500, statusMessage: updateError?.message ?? 'Failed to update employee.' })
  }

  return { employee: updatedEmployee }
})
