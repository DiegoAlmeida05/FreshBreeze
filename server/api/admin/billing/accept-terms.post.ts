import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createError, defineEventHandler, getHeader, readBody, type H3Event } from 'h3'

type UserRole = 'admin' | 'worker'

interface AuthProfile {
  id: string
  role: UserRole
  active: boolean
}

interface AcceptTermsBody {
  terms_version: string
}

interface RequesterIdentity {
  userId: string
  profileId: string
  email: string | null
}

function parseBody(input: unknown): AcceptTermsBody {
  if (!input || typeof input !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body.' })
  }

  const raw = input as Record<string, unknown>
  const termsVersion = typeof raw.terms_version === 'string' ? raw.terms_version.trim() : ''

  if (!termsVersion) {
    throw createError({ statusCode: 400, statusMessage: 'terms_version is required.' })
  }

  if (termsVersion.length > 50) {
    throw createError({ statusCode: 400, statusMessage: 'terms_version is too long.' })
  }

  return {
    terms_version: termsVersion,
  }
}

function normalizeEmail(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim().toLowerCase()
  return normalized.length > 0 ? normalized : null
}

function getIpAddress(event: H3Event): string | null {
  const forwardedFor = getHeader(event, 'x-forwarded-for')
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim()
    if (firstIp) {
      return firstIp
    }
  }

  const cloudflareIp = getHeader(event, 'cf-connecting-ip')
  if (cloudflareIp?.trim()) {
    return cloudflareIp.trim()
  }

  const realIp = getHeader(event, 'x-real-ip')
  if (realIp?.trim()) {
    return realIp.trim()
  }

  const socketIp = event.node.req.socket?.remoteAddress
  if (typeof socketIp === 'string' && socketIp.trim().length > 0) {
    return socketIp.trim()
  }

  return null
}

function getUserAgent(event: H3Event): string | null {
  const userAgent = getHeader(event, 'user-agent')
  if (!userAgent) {
    return null
  }

  const normalized = userAgent.trim()
  if (!normalized) {
    return null
  }

  return normalized.slice(0, 1000)
}

async function requireAdminUser(event: H3Event, adminClient: SupabaseClient): Promise<RequesterIdentity> {
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
    .select('id, role, active')
    .eq('id', requesterData.user.id)
    .maybeSingle<AuthProfile>()

  if (requesterProfileError || !requesterProfile || !requesterProfile.active || requesterProfile.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Only active admins can accept billing terms.' })
  }

  return {
    userId: requesterData.user.id,
    profileId: requesterProfile.id,
    email: normalizeEmail(requesterData.user.email),
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const supabaseUrl = config.public.supabaseUrl || config.supabaseUrl
  const supabaseServiceRoleKey = config.supabaseServiceRoleKey

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Server configuration is missing Supabase credentials.',
    })
  }

  const body = parseBody(await readBody(event))
  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey)
  const requester = await requireAdminUser(event, adminClient)

  const acceptedAt = new Date().toISOString()
  const ipAddress = getIpAddress(event)
  const userAgent = getUserAgent(event)

  const { data: insertedRow, error: insertError } = await adminClient
    .schema('public')
    .from('billing_terms_acceptances')
    .insert({
      profile_id: requester.profileId,
      user_id: requester.userId,
      email: requester.email,
      accepted_at: acceptedAt,
      terms_version: body.terms_version,
      ip_address: ipAddress,
      user_agent: userAgent,
      source: 'billing_checkout',
    })
    .select('terms_version, accepted_at')
    .single<{ terms_version: string; accepted_at: string }>()

  if (insertError || !insertedRow) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to record terms acceptance: ${insertError?.message ?? 'insert failed'}`,
    })
  }

  return {
    success: true,
    terms_version: insertedRow.terms_version,
    accepted_at: insertedRow.accepted_at,
  }
})
