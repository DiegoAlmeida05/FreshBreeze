import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createError, defineEventHandler, getHeader, type H3Event } from 'h3'

type UserRole = 'admin' | 'worker'

interface AuthProfile {
  id: string
  role: UserRole
  active: boolean
  email?: string | null
}

interface RequesterIdentity {
  email: string | null
  userEmail: string | null
  profileEmail: string | null
}

interface AppSubscriptionRow {
  app_key: string
  app_name: string
  status: string
  monthly_amount: number
  currency: string
  stripe_customer_id: string | null
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

async function requireAdminUser(
  event: H3Event,
  adminClient: SupabaseClient,
): Promise<RequesterIdentity> {
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
    throw createError({ statusCode: 403, statusMessage: 'Only admins can access billing.' })
  }

  const userEmail = requesterData.user.email ?? null
  const profileEmail = requesterProfile?.email ?? null

  return {
    email: normalizeEmail(userEmail),
    userEmail,
    profileEmail,
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

  const normalizedRequesterEmail =
    normalizeEmail(requester.userEmail) ||
    normalizeEmail(requester.email) ||
    normalizeEmail(requester.profileEmail) ||
    ''

  const isPlatformOwner = normalizedRequesterEmail.length > 0 && ownerEmails.has(normalizedRequesterEmail)

  const { data: subscription, error } = await adminClient
    .schema('public')
    .from('app_subscription')
    .select('app_key, app_name, status, monthly_amount, currency, stripe_customer_id, trial_ends_at, manual_access_enabled, manual_access_until, manual_access_reason')
    .eq('app_key', APP_KEY)
    .single<AppSubscriptionRow>()

  if (error || !subscription) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to load app subscription: ${error?.message ?? 'row not found'}`,
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
    isPlatformOwner,
  }
})
