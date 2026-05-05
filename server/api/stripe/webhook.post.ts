import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { createError, defineEventHandler, getHeader, readRawBody } from 'h3'

const DEFAULT_APP_KEY = 'freshbreeze'

type UpdatePayload = Record<string, unknown>

function unixToIso(value: number | null | undefined): string | null {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    return null
  }

  return new Date(value * 1000).toISOString()
}

function resolvePriceId(subscription: Stripe.Subscription | null): string | null {
  if (!subscription?.items?.data?.length) {
    return null
  }

  return subscription.items.data[0]?.price?.id ?? null
}

async function getPaymentMethodSnapshot(stripe: Stripe, customerId: string | null): Promise<UpdatePayload> {
  if (!customerId) {
    return {}
  }

  try {
    const customer = await stripe.customers.retrieve(customerId, {
      expand: ['invoice_settings.default_payment_method'],
    })

    if (customer.deleted) {
      return {}
    }

    const paymentMethod = customer.invoice_settings.default_payment_method

    if (!paymentMethod || typeof paymentMethod === 'string' || paymentMethod.type !== 'card' || !paymentMethod.card) {
      return {}
    }

    return {
      payment_method_brand: paymentMethod.card.brand,
      payment_method_last4: paymentMethod.card.last4,
      payment_method_exp_month: paymentMethod.card.exp_month,
      payment_method_exp_year: paymentMethod.card.exp_year,
    }
  }
  catch {
    return {}
  }
}

async function updateAppSubscription(
  adminClient: ReturnType<typeof createClient>,
  payload: UpdatePayload,
  options: {
    stripeSubscriptionId?: string | null
    stripeCustomerId?: string | null
    appKey?: string | null
  },
): Promise<void> {
  if (options.stripeSubscriptionId) {
    const { data, error } = await adminClient
      .schema('public')
      .from('app_subscription')
      .update(payload)
      .eq('stripe_subscription_id', options.stripeSubscriptionId)
      .select('app_key')
      .maybeSingle()

    if (error) {
      throw createError({ statusCode: 500, statusMessage: `Failed to update by subscription: ${error.message}` })
    }

    if (data) {
      return
    }
  }

  if (options.stripeCustomerId) {
    const { data, error } = await adminClient
      .schema('public')
      .from('app_subscription')
      .update(payload)
      .eq('stripe_customer_id', options.stripeCustomerId)
      .select('app_key')
      .maybeSingle()

    if (error) {
      throw createError({ statusCode: 500, statusMessage: `Failed to update by customer: ${error.message}` })
    }

    if (data) {
      return
    }
  }

  const targetAppKey = options.appKey || DEFAULT_APP_KEY

  const { error } = await adminClient
    .schema('public')
    .from('app_subscription')
    .update(payload)
    .eq('app_key', targetAppKey)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: `Failed to update by app_key: ${error.message}` })
  }
}

async function retrieveSubscription(
  stripe: Stripe,
  subscriptionId: string | null | undefined,
): Promise<Stripe.Subscription | null> {
  if (!subscriptionId) {
    return null
  }

  try {
    return await stripe.subscriptions.retrieve(subscriptionId)
  }
  catch {
    return null
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  const stripeSecretKey = config.stripeSecretKey || process.env.STRIPE_SECRET_KEY || ''
  const stripeWebhookSecret = config.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET || ''
  const supabaseUrl = config.public.supabaseUrl || config.supabaseUrl || process.env.NUXT_PUBLIC_SUPABASE_URL || ''
  const supabaseServiceRoleKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SECRET_KEY || ''

  if (!stripeSecretKey || !stripeWebhookSecret) {
    throw createError({ statusCode: 500, statusMessage: 'Stripe webhook is not fully configured on the server.' })
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, statusMessage: 'Supabase server credentials are not configured.' })
  }

  const stripeSignature = getHeader(event, 'stripe-signature')

  if (!stripeSignature) {
    throw createError({ statusCode: 400, statusMessage: 'Missing Stripe signature header.' })
  }

  const rawBody = await readRawBody(event, false)

  if (!rawBody) {
    throw createError({ statusCode: 400, statusMessage: 'Missing webhook body.' })
  }

  const stripe = new Stripe(stripeSecretKey)

  let stripeEvent: Stripe.Event

  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, stripeSignature, stripeWebhookSecret)
  }
  catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid Stripe webhook signature.' })
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey)
  const nowIso = new Date().toISOString()

  switch (stripeEvent.type) {
    case 'checkout.session.completed': {
      const session = stripeEvent.data.object as Stripe.Checkout.Session
      const customerId = typeof session.customer === 'string' ? session.customer : null
      const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null
      const appKey = session.metadata?.app_key || DEFAULT_APP_KEY
      const subscription = await retrieveSubscription(stripe, subscriptionId)
      const paymentSnapshot = await getPaymentMethodSnapshot(stripe, customerId)

      await updateAppSubscription(
        adminClient,
        {
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          stripe_price_id: resolvePriceId(subscription),
          status: subscription?.status || 'active',
          current_period_start: unixToIso(subscription?.current_period_start),
          current_period_end: unixToIso(subscription?.current_period_end),
          cancel_at_period_end: subscription?.cancel_at_period_end ?? false,
          last_payment_status: 'paid',
          last_payment_at: nowIso,
          updated_at: nowIso,
          ...paymentSnapshot,
        },
        {
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId: customerId,
          appKey,
        },
      )
      break
    }

    case 'invoice.paid': {
      const invoice = stripeEvent.data.object as Stripe.Invoice
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : null
      const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : null
      const invoiceId = invoice.id || null
      const subscription = await retrieveSubscription(stripe, subscriptionId)
      const paymentSnapshot = await getPaymentMethodSnapshot(stripe, customerId)

      await updateAppSubscription(
        adminClient,
        {
          status: 'active',
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          stripe_price_id: resolvePriceId(subscription),
          last_payment_status: 'paid',
          last_payment_at: nowIso,
          last_invoice_id: invoiceId,
          current_period_start: unixToIso(subscription?.current_period_start),
          current_period_end: unixToIso(subscription?.current_period_end),
          cancel_at_period_end: subscription?.cancel_at_period_end ?? false,
          updated_at: nowIso,
          ...paymentSnapshot,
        },
        {
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId: customerId,
          appKey: DEFAULT_APP_KEY,
        },
      )
      break
    }

    case 'invoice.payment_failed': {
      const invoice = stripeEvent.data.object as Stripe.Invoice
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : null
      const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : null
      const invoiceId = invoice.id || null

      await updateAppSubscription(
        adminClient,
        {
          status: 'past_due',
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          last_payment_status: 'failed',
          last_invoice_id: invoiceId,
          updated_at: nowIso,
        },
        {
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId: customerId,
          appKey: DEFAULT_APP_KEY,
        },
      )
      break
    }

    case 'customer.subscription.updated': {
      const subscription = stripeEvent.data.object as Stripe.Subscription
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : null
      const subscriptionId = subscription.id
      const paymentSnapshot = await getPaymentMethodSnapshot(stripe, customerId)

      await updateAppSubscription(
        adminClient,
        {
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          stripe_price_id: resolvePriceId(subscription),
          status: subscription.status,
          current_period_start: unixToIso(subscription.current_period_start),
          current_period_end: unixToIso(subscription.current_period_end),
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: nowIso,
          ...paymentSnapshot,
        },
        {
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId: customerId,
          appKey: DEFAULT_APP_KEY,
        },
      )
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = stripeEvent.data.object as Stripe.Subscription
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : null

      await updateAppSubscription(
        adminClient,
        {
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          status: 'cancelled',
          cancel_at_period_end: subscription.cancel_at_period_end,
          current_period_start: unixToIso(subscription.current_period_start),
          current_period_end: unixToIso(subscription.current_period_end),
          manual_access_enabled: false,
          manual_access_until: null,
          manual_access_reason: null,
          updated_at: nowIso,
        },
        {
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: customerId,
          appKey: DEFAULT_APP_KEY,
        },
      )
      break
    }

    default:
      break
  }

  return { received: true }
})
