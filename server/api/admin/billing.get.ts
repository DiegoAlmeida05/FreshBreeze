import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { createError, defineEventHandler, getHeader, type H3Event } from 'h3'
import { isPlatformOwnerEmail, normalizeEmail } from '../../utils/platformOwner'

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
  stripe_price_id: string | null
  current_period_end: string | null
  trial_ends_at: string | null
  manual_access_enabled: boolean
  manual_access_until: string | null
  manual_access_reason: string | null
}

type AccessReason = 'active_subscription' | 'trial_active' | 'manual_with_expiry' | 'manual_without_expiry' | 'inactive'

const APP_KEY = 'freshbreeze'

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
  const stripeSecretKey = config.stripeSecretKey || process.env.STRIPE_SECRET_KEY || ''

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Server configuration is missing Supabase credentials.',
    })
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey)
  const requester = await requireAdminUser(event, adminClient)

  const normalizedRequesterEmail =
    normalizeEmail(requester.userEmail) ||
    normalizeEmail(requester.email) ||
    normalizeEmail(requester.profileEmail) ||
    ''

  const isPlatformOwner = isPlatformOwnerEmail(normalizedRequesterEmail)

  const { data: existingSubscription, error } = await adminClient
    .schema('public')
    .from('app_subscription')
    .select('app_key, app_name, status, monthly_amount, currency, stripe_customer_id, stripe_price_id, current_period_end, trial_ends_at, manual_access_enabled, manual_access_until, manual_access_reason')
    .eq('app_key', APP_KEY)
    .maybeSingle<AppSubscriptionRow>()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to load app subscription: ${error.message}`,
    })
  }

  let subscription = existingSubscription

  if (!subscription) {
    const stripePriceId = config.stripePriceId || process.env.STRIPE_PRICE_ID || null

    const { data: createdSubscription, error: createSubscriptionError } = await adminClient
      .schema('public')
      .from('app_subscription')
      .upsert({
        app_key: APP_KEY,
        app_name: 'FreshBreeze',
        status: 'inactive',
        monthly_amount: 0,
        currency: 'AUD',
        stripe_customer_id: null,
        stripe_price_id: stripePriceId,
        current_period_end: null,
        trial_ends_at: null,
        manual_access_enabled: false,
        manual_access_until: null,
        manual_access_reason: null,
      }, { onConflict: 'app_key' })
      .select('app_key, app_name, status, monthly_amount, currency, stripe_customer_id, stripe_price_id, current_period_end, trial_ends_at, manual_access_enabled, manual_access_until, manual_access_reason')
      .single<AppSubscriptionRow>()

    if (createSubscriptionError || !createdSubscription) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to initialize app subscription: ${createSubscriptionError?.message ?? 'row not created'}`,
      })
    }

    subscription = createdSubscription
  }

  const now = new Date()
  let resolvedMonthlyAmount = Number(subscription.monthly_amount)
  let resolvedCurrency = subscription.currency

  if (stripeSecretKey && subscription.stripe_price_id) {
    try {
      const stripe = new Stripe(stripeSecretKey)
      const price = await stripe.prices.retrieve(subscription.stripe_price_id)

      if (typeof price.unit_amount === 'number') {
        resolvedMonthlyAmount = Number((price.unit_amount / 100).toFixed(2))
      }

      if (price.currency) {
        resolvedCurrency = String(price.currency).toUpperCase()
      }
    } catch {
      // Keep DB value when Stripe lookup fails.
    }
  }

  const access = isPlatformOwner
    ? { enabled: true, reason: 'active_subscription' as AccessReason }
    : resolveAccess(subscription, now)

  return {
    subscription: {
      ...subscription,
      monthly_amount: resolvedMonthlyAmount,
      currency: resolvedCurrency,
    },
    access: {
      enabled: access.enabled,
      reason: access.reason,
      checkedAt: now.toISOString(),
    },
    isPlatformOwner,
  }
})
