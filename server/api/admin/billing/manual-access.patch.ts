import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createError, defineEventHandler, getHeader, readBody, type H3Event } from 'h3'

type UserRole = 'admin' | 'worker'

interface AuthProfile {
  id: string
  role: UserRole
  active: boolean
}

interface ManualAccessBody {
  manualAccessEnabled: boolean
  manualAccessUntil: string | null
  manualAccessReason: string | null
}

interface AppSubscriptionRow {
  app_key: string
  app_name: string
  status: string
  monthly_amount: number
  currency: string
  trial_ends_at: string | null
  manual_access_enabled: boolean
  manual_access_until: string | null
  manual_access_reason: string | null
}

type AccessReason = 'active_subscription' | 'trial_active' | 'manual_with_expiry' | 'manual_without_expiry' | 'inactive'

const APP_KEY = 'freshbreeze'

function normalizeEmail(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim().toLowerCase()
  return normalized.length > 0 ? normalized : null
}

function parseOwnerEmails(rawValue: string): Set<string> {
  return new Set(
    rawValue
      .split(',')
      .map((email) => normalizeEmail(email))
      .filter((email): email is string => Boolean(email)),
  )
}

function parseBody(input: unknown): ManualAccessBody {
  if (!input || typeof input !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body.' })
  }

  const raw = input as Record<string, unknown>
  const manualAccessEnabled = raw.manualAccessEnabled
  const manualAccessUntil = raw.manualAccessUntil
  const manualAccessReason = raw.manualAccessReason

  if (typeof manualAccessEnabled !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'manualAccessEnabled must be a boolean.' })
  }

  let parsedUntil: string | null = null

  if (typeof manualAccessUntil === 'string' && manualAccessUntil.trim().length > 0) {
    const parsedDate = new Date(manualAccessUntil)

    if (Number.isNaN(parsedDate.getTime())) {
      throw createError({ statusCode: 400, statusMessage: 'manualAccessUntil must be a valid date.' })
    }

    parsedUntil = parsedDate.toISOString()
  }

  let parsedReason: string | null = null

  if (typeof manualAccessReason === 'string' && manualAccessReason.trim().length > 0) {
    parsedReason = manualAccessReason.trim().slice(0, 500)
  }

  return {
    manualAccessEnabled,
    manualAccessUntil: parsedUntil,
    manualAccessReason: parsedReason,
  }
}

function resolveAccess(subscription: AppSubscriptionRow, now: Date): { enabled: boolean, reason: AccessReason } {
  if (subscription.status === 'active') {
    return { enabled: true, reason: 'active_subscription' }
  }

  if (subscription.status === 'trialing' && subscription.trial_ends_at) {
    if (new Date(subscription.trial_ends_at).getTime() > now.getTime()) {
      return { enabled: true, reason: 'trial_active' }
    }
  }

  if (subscription.manual_access_enabled) {
    if (!subscription.manual_access_until) {
      return { enabled: true, reason: 'manual_without_expiry' }
    }

    if (new Date(subscription.manual_access_until).getTime() > now.getTime()) {
      return { enabled: true, reason: 'manual_with_expiry' }
    }
  }

  return { enabled: false, reason: 'inactive' }
}

async function requireAdminUser(event: H3Event, adminClient: SupabaseClient): Promise<{ email: string | null }> {
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
    throw createError({ statusCode: 403, statusMessage: 'Only admins can access billing.' })
  }

  return {
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

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey)
  const requester = await requireAdminUser(event, adminClient)

  const runtimeOwnerEmails = typeof config.platformOwnerEmails === 'string' ? config.platformOwnerEmails : ''
  const rawOwnerEmails = runtimeOwnerEmails.trim().length > 0
    ? runtimeOwnerEmails
    : (process.env.PLATFORM_OWNER_EMAILS ?? '')
  const ownerEmails = parseOwnerEmails(rawOwnerEmails)
  const normalizedRequesterEmail = normalizeEmail(requester.email) || ''
  const isPlatformOwner = normalizedRequesterEmail.length > 0 && ownerEmails.has(normalizedRequesterEmail)

  if (!isPlatformOwner) {
    throw createError({ statusCode: 403, statusMessage: 'Only platform owners can change manual access.' })
  }

  const body = parseBody(await readBody(event))

  const updatePayload = body.manualAccessEnabled
    ? {
      manual_access_enabled: true,
      manual_access_until: body.manualAccessUntil,
      manual_access_reason: body.manualAccessReason,
    }
    : {
      manual_access_enabled: false,
      manual_access_until: null,
      manual_access_reason: null,
    }

  const { data: subscription, error } = await adminClient
    .schema('public')
    .from('app_subscription')
    .update(updatePayload)
    .eq('app_key', APP_KEY)
    .select('app_key, app_name, status, monthly_amount, currency, trial_ends_at, manual_access_enabled, manual_access_until, manual_access_reason')
    .single<AppSubscriptionRow>()

  if (error || !subscription) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to update manual access: ${error?.message ?? 'row not found'}`,
    })
  }

  const now = new Date()
  const access = resolveAccess(subscription, now)

  return {
    subscription,
    access: {
      enabled: access.enabled,
      reason: access.reason,
      checkedAt: now.toISOString(),
    },
    isPlatformOwner: true,
  }
})
