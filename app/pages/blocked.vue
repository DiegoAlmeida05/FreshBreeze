<template>
  <main class="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.12),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.12),transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-10">
    <div class="absolute inset-0 pointer-events-none opacity-40" aria-hidden="true">
      <div class="absolute -left-10 top-12 h-36 w-36 rounded-full bg-primary-200 blur-3xl" />
      <div class="absolute -right-8 bottom-12 h-40 w-40 rounded-full bg-success/30 blur-3xl" />
    </div>

    <section class="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-xl items-center justify-center">
      <div class="w-full rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_20px_60px_-24px_rgba(15,23,42,0.35)] backdrop-blur sm:p-8">
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-7 w-7" aria-hidden="true">
            <path fill-rule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25V9H5.625A2.625 2.625 0 0 0 3 11.625v7.5a2.625 2.625 0 0 0 2.625 2.625h12.75A2.625 2.625 0 0 0 21 19.125v-7.5A2.625 2.625 0 0 0 18.375 9H17.25V6.75A5.25 5.25 0 0 0 12 1.5Zm3.75 7.5V6.75a3.75 3.75 0 0 0-7.5 0V9h7.5Z" clip-rule="evenodd" />
          </svg>
        </div>

        <div class="mt-5 text-center">
          <img
            src="/logo/logo_escrito_transparente.png"
            alt="FreshBreeze"
            class="mx-auto h-10 w-auto sm:h-12"
          >
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-primary-600">FreshBreeze Billing</p>
          <h1 class="mt-4 text-3xl font-bold text-slate-900">Access Restricted</h1>
          <p class="mt-1 text-sm font-medium text-slate-600">Your subscription is inactive</p>
          <p class="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-600">
            Your subscription is inactive. Please subscribe or update your payment method to continue using the app.
          </p>
        </div>

        <div
          v-if="checkoutError"
          role="alert"
          class="mt-5 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {{ checkoutError }}
        </div>

        <div class="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            class="btn-primary h-11 w-full justify-center"
            :disabled="isRedirectingCheckout"
            @click="startCheckout"
          >
            <span v-if="isRedirectingCheckout" class="inline-flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Redirecting...
            </span>
            <span v-else>Subscribe now</span>
          </button>

          <button
            type="button"
            class="btn-outline h-11 w-full justify-center"
            :disabled="isRedirectingPortal || !canManageBilling"
            @click="openBillingPortal"
          >
            <span v-if="isRedirectingPortal" class="inline-flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Opening...
            </span>
            <span v-else>Manage billing</span>
          </button>
        </div>

        <p v-if="!canManageBilling" class="mt-3 text-center text-xs text-slate-500">
          Manage billing is available after your customer profile is linked in Stripe.
        </p>

        <div class="mt-6 flex justify-center">
          <NuxtLink to="/admin/billing" class="text-xs font-semibold text-primary-700 transition hover:text-primary-500">
            Open billing page
          </NuxtLink>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSupabaseClient } from '../composables/useSupabaseClient'

interface BillingAccessResponse {
  subscription: {
    stripe_customer_id: string | null
  }
}

const supabase = useSupabaseClient()

const stripeCustomerId = ref<string | null>(null)
const isRedirectingCheckout = ref(false)
const isRedirectingPortal = ref(false)
const checkoutError = ref<string | null>(null)

const canManageBilling = computed(() => Boolean(stripeCustomerId.value))

async function getAccessToken(): Promise<string> {
  const { data, error } = await supabase.auth.getSession()

  if (error || !data.session?.access_token) {
    throw new Error('Unable to read user session. Please sign in again.')
  }

  return data.session.access_token
}

async function fetchBillingSnapshot(): Promise<void> {
  try {
    const accessToken = await getAccessToken()
    const data = await $fetch<BillingAccessResponse>('/api/admin/billing', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    stripeCustomerId.value = data.subscription.stripe_customer_id
  }
  catch {
    stripeCustomerId.value = null
  }
}

async function startCheckout(): Promise<void> {
  checkoutError.value = null
  isRedirectingCheckout.value = true

  try {
    const accessToken = await getAccessToken()
    const response = await $fetch<{ url: string }>('/api/stripe/create-checkout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.url) {
      checkoutError.value = 'Stripe did not return a checkout URL. Please try again.'
      isRedirectingCheckout.value = false
      return
    }

    window.location.href = response.url
  }
  catch (err: unknown) {
    checkoutError.value = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.'
    isRedirectingCheckout.value = false
  }
}

async function openBillingPortal(): Promise<void> {
  checkoutError.value = null
  isRedirectingPortal.value = true

  try {
    const accessToken = await getAccessToken()
    const response = await $fetch<{ url: string }>('/api/stripe/create-portal', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.url) {
      checkoutError.value = 'Stripe did not return a billing portal URL. Please try again.'
      isRedirectingPortal.value = false
      return
    }

    window.location.href = response.url
  }
  catch (err: unknown) {
    checkoutError.value = err instanceof Error ? err.message : 'Failed to open billing portal. Please try again.'
    isRedirectingPortal.value = false
  }
}

onMounted(() => {
  fetchBillingSnapshot()
})
</script>