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
    .select('stripe_customer_id')
    .eq('app_key', APP_KEY)
    .single<AppSubscriptionRow>()

  if (fetchError || !subscription) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to read app_subscription: ${fetchError?.message ?? 'row not found'}`,
    })
  }

  if (!subscription.stripe_customer_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No Stripe customer is linked to this subscription yet.',
    })
  }

  const stripe = new Stripe(stripeSecretKey)
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: `${appUrl}/admin/billing`,
  })

  if (!session.url) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Stripe did not return a billing portal URL. Please try again.',
    })
  }

  return { url: session.url }
})
