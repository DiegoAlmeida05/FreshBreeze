import Stripe from 'stripe'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createError, defineEventHandler, getHeader, type H3Event } from 'h3'
import { config as loadDotenv } from 'dotenv'

type UserRole = 'admin' | 'worker'

interface AuthProfile {
  id: string
  role: UserRole
  active: boolean
}

interface AppSubscriptionRow {
  stripe_customer_id: string | null
  stripe_subscription_id?: string | null
}

const APP_KEY = 'freshbreeze'

loadDotenv()
loadDotenv({ path: '.env.local', override: true })

async function requireAdminUser(event: H3Event, adminClient: SupabaseClient): Promise<void> {
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
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  const stripeSecretKey = config.stripeSecretKey || process.env.STRIPE_SECRET_KEY || ''
  const appUrl = config.appUrl || process.env.APP_URL || ''
  const supabaseUrl = config.public.supabaseUrl || config.supabaseUrl || process.env.NUXT_PUBLIC_SUPABASE_URL || ''
  const supabaseServiceKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SECRET_KEY || ''

  if (!stripeSecretKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'STRIPE_SECRET_KEY is not configured on the server.',
    })
  }

  if (!appUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'APP_URL is not configured on the server.',
    })
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase server credentials are not configured.',
    })
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceKey)
  await requireAdminUser(event, adminClient)

  const { data: subscription, error: fetchError } = await adminClient
    .schema('public')
    .from('app_subscription')
    .select('stripe_customer_id, stripe_subscription_id')
    .eq('app_key', APP_KEY)
    .single<AppSubscriptionRow>()

  if (fetchError || !subscription) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to read app_subscription: ${fetchError?.message ?? 'row not found'}`,
    })
  }

  if (!subscription.stripe_customer_id) {
    console.warn('[stripe:create-portal] missing billing account', {
      hasCustomerId: false,
      hasSubscriptionId: Boolean(subscription.stripe_subscription_id),
      appKey: APP_KEY,
    })

    throw createError({
      statusCode: 400,
      statusMessage: 'No billing account found for this workspace',
    })
  }

  const stripe = new Stripe(stripeSecretKey)

  try {
    const portalConfigurations = await stripe.billingPortal.configurations.list({ limit: 1 })
    if (!portalConfigurations.data.length) {
      console.warn('[stripe:create-portal] billing portal not configured', {
        hasCustomerId: Boolean(subscription.stripe_customer_id),
        hasSubscriptionId: Boolean(subscription.stripe_subscription_id),
        appKey: APP_KEY,
      })

      throw createError({
        statusCode: 503,
        statusMessage: 'Stripe billing portal is not configured',
      })
    }
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) {
      throw err
    }

    const stripeError = err as { type?: string; message?: string; code?: string }
    console.error('[stripe:create-portal] failed to read portal configuration', {
      stripeErrorType: stripeError?.type ?? null,
      stripeErrorCode: stripeError?.code ?? null,
      stripeErrorMessage: stripeError?.message ?? 'unknown_error',
      hasCustomerId: Boolean(subscription.stripe_customer_id),
      hasSubscriptionId: Boolean(subscription.stripe_subscription_id),
      appKey: APP_KEY,
    })

    throw createError({
      statusCode: 503,
      statusMessage: 'Stripe billing portal is not configured',
    })
  }

  let session: Stripe.BillingPortal.Session
  try {
    session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${appUrl}/admin/billing`,
    })
  } catch (err: unknown) {
    const stripeError = err as { type?: string; message?: string; code?: string }

    console.error('[stripe:create-portal] failed to create portal session', {
      stripeErrorType: stripeError?.type ?? null,
      stripeErrorCode: stripeError?.code ?? null,
      stripeErrorMessage: stripeError?.message ?? 'unknown_error',
      hasCustomerId: Boolean(subscription.stripe_customer_id),
      hasSubscriptionId: Boolean(subscription.stripe_subscription_id),
      appKey: APP_KEY,
    })

    if ((stripeError?.code ?? '') === 'resource_missing') {
      throw createError({
        statusCode: 400,
        statusMessage: 'No billing account found for this workspace',
      })
    }

    throw createError({
      statusCode: 502,
      statusMessage: 'Unable to open billing portal right now',
    })
  }

  if (!session.url) {
    console.error('[stripe:create-portal] portal session has no URL', {
      hasCustomerId: Boolean(subscription.stripe_customer_id),
      hasSubscriptionId: Boolean(subscription.stripe_subscription_id),
      appKey: APP_KEY,
    })

    throw createError({
      statusCode: 500,
      statusMessage: 'Unable to open billing portal right now',
    })
  }

  return { url: session.url }
})
