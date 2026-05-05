import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { createError, defineEventHandler } from 'h3'
import { config as loadDotenv } from 'dotenv'

const APP_KEY = 'freshbreeze'

// Ensure server routes can read local env files during development.
loadDotenv()
loadDotenv({ path: '.env.local', override: true })

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  const stripeSecretKey = config.stripeSecretKey || process.env.STRIPE_SECRET_KEY || ''
  const stripePriceId = config.stripePriceId || process.env.STRIPE_PRICE_ID || ''
  const appUrl = config.appUrl || process.env.APP_URL || ''

  if (!stripeSecretKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'STRIPE_SECRET_KEY is not configured on the server.',
    })
  }

  if (!stripePriceId) {
    throw createError({
      statusCode: 500,
      statusMessage: 'STRIPE_PRICE_ID is not configured on the server.',
    })
  }

  if (!appUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'APP_URL is not configured on the server.',
    })
  }

  // Read app_subscription row
  const supabaseUrl = config.supabaseUrl || process.env.NUXT_PUBLIC_SUPABASE_URL || ''
  const supabaseServiceKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SECRET_KEY || ''

  if (!supabaseUrl || !supabaseServiceKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase server credentials are not configured.',
    })
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceKey)

  const { data: subscription, error: fetchError } = await adminClient
    .schema('public')
    .from('app_subscription')
    .select('id, stripe_customer_id')
    .eq('app_key', APP_KEY)
    .single()

  if (fetchError || !subscription) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to read app_subscription: ${fetchError?.message ?? 'row not found'}`,
    })
  }

  const stripe = new Stripe(stripeSecretKey)

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    line_items: [
      {
        price: stripePriceId,
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/admin/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/admin/billing?checkout=cancelled`,
    metadata: {
      app_key: APP_KEY,
    },
  }

  // Attach existing Stripe customer if present
  if (subscription.stripe_customer_id) {
    sessionParams.customer = subscription.stripe_customer_id
  }

  const session = await stripe.checkout.sessions.create(sessionParams)

  if (!session.url) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Stripe did not return a checkout URL. Please try again.',
    })
  }

  return { url: session.url }
})
