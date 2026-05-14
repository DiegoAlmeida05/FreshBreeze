<template>
  <NuxtLayout name="admin-layout" @signout="onSignOut">
    <section class="space-y-5">
      <!-- Header -->
      <header class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-primary-600">Finance</p>
          <h2 class="mt-1 text-2xl font-semibold text-foreground">Billing</h2>
        </div>
      </header>

      <div
        v-if="billingData"
        class="rounded-xl border px-4 py-3"
        :class="access?.enabled
          ? 'border-success/30 bg-success/10 text-success dark:border-success/20 dark:bg-success/10'
          : 'border-danger/30 bg-danger/10 text-danger dark:border-danger/20 dark:bg-danger/10'"
      >
        <p class="text-sm font-semibold">{{ access?.enabled ? 'Access enabled' : 'Access disabled' }}</p>
        <p class="mt-0.5 text-xs opacity-90">{{ accessSubtitle }}</p>
      </div>

      <div
        v-if="billingData?.isPlatformOwner === true"
        class="rounded-xl border border-primary-100 bg-primary-50/60 px-4 py-3 text-xs text-muted dark:border-white/10 dark:bg-white/[0.03]"
      >
        Owner mode enabled. Advanced billing controls are visible.
      </div>

      <!-- Success banner -->
      <div
        v-if="checkoutResult === 'success'"
        id="billing-success-banner"
        role="alert"
        class="flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success dark:border-success/20 dark:bg-success/10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <div>
          <p class="font-semibold">Checkout completed successfully!</p>
          <p class="mt-0.5 text-xs opacity-80">Subscription status will be updated automatically once the webhook is configured. This will be added in the next step.</p>
        </div>
      </div>

      <!-- Cancelled banner -->
      <div
        v-if="checkoutResult === 'cancelled'"
        id="billing-cancelled-banner"
        role="alert"
        class="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning dark:border-warning/20 dark:bg-warning/10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p class="font-semibold">Checkout was cancelled. No charge was made.</p>
      </div>

      <!-- Error banner -->
      <div
        v-if="checkoutError"
        id="billing-error-banner"
        role="alert"
        class="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger dark:border-danger/20 dark:bg-danger/10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <div>
          <p class="font-semibold">{{ billingErrorTitle }}</p>
          <p class="mt-0.5 text-xs opacity-80">{{ checkoutError }}</p>
        </div>
      </div>

      <div
        v-if="manualAccessSuccess"
        id="billing-manual-success-banner"
        role="alert"
        class="flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success dark:border-success/20 dark:bg-success/10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <p class="font-semibold">Manual access updated successfully.</p>
      </div>

      <div
        v-if="manualAccessError"
        id="billing-manual-error-banner"
        role="alert"
        class="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger dark:border-danger/20 dark:bg-danger/10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <p class="font-semibold">{{ manualAccessError }}</p>
      </div>

      <!-- Subscription card -->
      <div class="overflow-hidden rounded-2xl border border-primary-100 bg-white/60 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
        <div class="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 class="text-base font-semibold text-foreground">App Subscription</h3>
          <span
            class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
            :class="isSubscriptionActive ? 'bg-success/15 text-success' : 'bg-muted/20 text-muted-foreground dark:bg-white/10 dark:text-slate-300'"
          >
            {{ isSubscriptionActive ? 'Active' : 'Inactive' }}
          </span>
        </div>

        <div v-if="isLoadingSubscription" class="px-6 py-8 text-center text-sm text-muted">
          Loading subscription details…
        </div>

        <div v-else-if="subscriptionFetchError" class="px-6 py-8 text-center text-sm text-danger">
          {{ subscriptionFetchError }}
        </div>

        <div v-else-if="subscription" class="divide-y divide-border">
          <div class="flex items-center justify-between px-6 py-4">
            <span class="text-sm text-muted">Plan</span>
            <span class="text-sm font-medium text-foreground">{{ subscription.app_name }}</span>
          </div>
          <div class="flex items-center justify-between px-6 py-4">
            <span class="text-sm text-muted">Monthly amount</span>
            <span class="text-sm font-semibold text-foreground">
              {{ formatAmount(subscription.monthly_amount, subscription.currency) }}
            </span>
          </div>
          <div class="flex items-center justify-between px-6 py-4">
            <span class="text-sm text-muted">Subscription status</span>
            <span
              class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
              :class="isSubscriptionActive ? 'bg-success/15 text-success' : 'bg-muted/20 text-muted-foreground dark:bg-white/10 dark:text-slate-300'"
            >
              {{ isSubscriptionActive ? 'Active' : 'Inactive' }}
            </span>
          </div>
          <div class="flex items-center justify-between px-6 py-4">
            <span class="text-sm text-muted">Next billing date</span>
            <span class="text-sm font-medium text-foreground">{{ formatDate(subscription.current_period_end ?? null) }}</span>
          </div>

          <template v-if="billingData?.isPlatformOwner === true">
            <div class="flex items-center justify-between px-6 py-4">
              <span class="text-sm text-muted">Manual access</span>
              <span class="text-sm font-medium text-foreground">{{ subscription.manual_access_enabled ? 'Enabled' : 'Disabled' }}</span>
            </div>
            <div class="flex items-center justify-between px-6 py-4">
              <span class="text-sm text-muted">Manual access until</span>
              <span class="text-sm font-medium text-foreground">{{ formatDateTime(subscription.manual_access_until) }}</span>
            </div>
            <div class="flex items-center justify-between gap-4 px-6 py-4">
              <span class="text-sm text-muted">Manual access reason</span>
              <span class="text-right text-sm font-medium text-foreground">{{ subscription.manual_access_reason || 'N/A' }}</span>
            </div>
            <div class="flex items-center justify-between px-6 py-4">
              <span class="text-sm text-muted">Trial ends</span>
              <span class="text-sm font-medium text-foreground">{{ formatDateTime(subscription.trial_ends_at) }}</span>
            </div>
            <div class="flex items-center justify-between gap-4 px-6 py-4">
              <span class="text-sm text-muted">Stripe customer ID</span>
              <span class="text-right text-sm font-medium text-foreground">{{ subscription.stripe_customer_id || 'N/A' }}</span>
            </div>
            <div class="flex items-center justify-between px-6 py-4">
              <span class="text-sm text-muted">App key</span>
              <span class="text-sm font-medium text-foreground">{{ subscription.app_key }}</span>
            </div>
            <div class="flex items-center justify-between px-6 py-4">
              <span class="text-sm text-muted">Access reason</span>
              <span class="text-sm font-medium text-foreground">{{ access?.reason || 'N/A' }}</span>
            </div>
            <div class="flex items-center justify-between px-6 py-4">
              <span class="text-sm text-muted">Checked at</span>
              <span class="text-sm font-medium text-foreground">{{ formatDateTime(access?.checkedAt || null) }}</span>
            </div>
          </template>
        </div>

        <!-- Terms acceptance (shown only when Subscribe button is visible) -->
        <div v-if="shouldShowSubscribeButton" class="border-t border-border px-6 py-4">
          <label class="flex cursor-pointer items-start gap-3 text-sm text-foreground">
            <input
              id="billing-terms-checkbox"
              v-model="termsAccepted"
              type="checkbox"
              class="mt-0.5 h-4 w-4 shrink-0 rounded border-primary-300 text-primary-600 focus:ring-primary-500"
              @change="persistTermsUiState(termsAccepted)"
            >
            <span>
              I have read and agree to the
              <button
                type="button"
                class="font-semibold text-primary-600 underline underline-offset-2 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                @click="isTermsModalOpen = true"
              >
                Terms of Service
              </button>
              and acknowledge the subscription conditions.
            </span>
          </label>
        </div>

        <div class="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <button
            type="button"
            class="btn-outline"
            :disabled="isRedirectingPortal || !canManageBilling"
            @click="openBillingPortal"
          >
            <span v-if="isRedirectingPortal" class="inline-flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Opening portal...
            </span>
            <span v-else>Manage billing</span>
          </button>
          <button
            v-if="shouldShowSubscribeButton"
            type="button"
            class="btn-primary"
            :disabled="isRedirecting || !termsAccepted"
            @click="startCheckout"
          >
            <span v-if="isRedirecting" class="inline-flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Redirecting to Stripe…
            </span>
            <span v-else>Subscribe</span>
          </button>
          <span v-else class="text-sm font-medium text-success">Active subscription connected</span>
        </div>
      </div>

      <div
        v-if="billingData?.isPlatformOwner === true"
        class="overflow-hidden rounded-2xl border border-primary-100 bg-white/60 shadow-sm dark:border-white/10 dark:bg-white/[0.03]"
      >
        <div class="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 class="text-base font-semibold text-foreground">Manual Access Controls</h3>
          <span class="inline-flex rounded-full bg-primary-100 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-500/20 dark:text-primary-300">
            Platform owner
          </span>
        </div>

        <form class="space-y-4 px-6 py-5" novalidate @submit.prevent="saveManualAccess">
          <label class="flex items-center gap-3 text-sm font-medium text-foreground">
            <input
              v-model="manualAccessEnabled"
              type="checkbox"
              class="h-4 w-4 rounded border-primary-300 text-primary-600 focus:ring-primary-500"
            >
            Enable manual/free access
          </label>

          <div class="space-y-1">
            <label for="manual-access-until" class="text-xs font-semibold uppercase tracking-wide text-muted">Manual access until (optional)</label>
            <input
              id="manual-access-until"
              v-model="manualAccessUntil"
              type="datetime-local"
              class="input-base"
            >
          </div>

          <div class="space-y-1">
            <label for="manual-access-reason" class="text-xs font-semibold uppercase tracking-wide text-muted">Reason (optional)</label>
            <textarea
              id="manual-access-reason"
              v-model="manualAccessReason"
              rows="3"
              class="input-base"
              maxlength="500"
            />
          </div>

          <div class="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              class="btn-outline"
              :disabled="isSavingManualAccess"
              @click="disableManualAccess"
            >
              Disable manual access
            </button>
            <button
              type="submit"
              class="btn-primary"
              :disabled="isSavingManualAccess"
            >
              {{ isSavingManualAccess ? 'Saving...' : 'Save manual access' }}
            </button>
          </div>
        </form>
      </div>

      <div
        v-else-if="billingData"
        class="rounded-xl border border-primary-100 bg-primary-50/60 px-4 py-3 text-xs text-muted dark:border-white/10 dark:bg-white/[0.03]"
      >
        Manual access controls are restricted to platform owners.
      </div>
    </section>

    <!-- Terms of Service Modal -->
    <div
      v-if="isTermsModalOpen"
      id="billing-terms-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-modal-title"
      class="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      @click.self="isTermsModalOpen = false"
    >
      <div class="absolute inset-0 bg-black/50" aria-hidden="true" @click="isTermsModalOpen = false" />
      <div class="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
        <div class="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 id="terms-modal-title" class="text-base font-semibold text-foreground">Terms of Service</h2>
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition hover:bg-muted/10"
            aria-label="Close terms"
            @click="isTermsModalOpen = false"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
        <div class="max-h-[60vh] overflow-y-auto px-6 py-5 text-sm text-foreground">
          <p class="mb-4 text-xs text-muted">Last updated: May 2025 — Version 1.0</p>

          <section class="mb-4">
            <h3 class="mb-1 font-semibold">1. Subscription</h3>
            <p class="text-muted">The service is provided as a monthly recurring subscription. By subscribing, you authorise recurring charges to your payment method until cancellation. The subscription renews automatically each billing cycle.</p>
          </section>

          <section class="mb-4">
            <h3 class="mb-1 font-semibold">2. Price changes</h3>
            <p class="text-muted">Features, pricing, and integrations may change with prior notice. You will be notified before pricing changes take effect in your billing cycle.</p>
          </section>

          <section class="mb-4">
            <h3 class="mb-1 font-semibold">3. Service availability</h3>
            <p class="text-muted">The platform may experience temporary downtime, maintenance periods, or third-party service interruptions. Service availability is provided on a best-effort basis and uninterrupted operation is not guaranteed.</p>
          </section>

          <section class="mb-4">
            <h3 class="mb-1 font-semibold">4. Feature changes</h3>
            <p class="text-muted">Features and functionality may be added, modified, or removed over time. Material changes will be communicated in advance whenever reasonably possible.</p>
          </section>

          <section class="mb-4">
            <h3 class="mb-1 font-semibold">5. Customer responsibility</h3>
            <p class="text-muted">Users remain responsible for verifying operational, payroll, invoicing, and compliance-related data before taking action.</p>
          </section>

          <section class="mb-4">
            <h3 class="mb-1 font-semibold">6. Platform role and limitations</h3>
            <p class="text-muted">The platform acts as a management and operational support tool and does not replace legal, accounting, payroll, or compliance review. It does not provide tax, legal, or financial advice; qualified professionals should be consulted where required.</p>
          </section>

          <section class="mb-4">
            <h3 class="mb-1 font-semibold">7. Third-party services</h3>
            <p class="text-muted">The platform depends on third-party providers, including payment and infrastructure services. Availability and performance may be affected by those providers, and their terms and privacy policies also apply.</p>
          </section>

          <section class="mb-4">
            <h3 class="mb-1 font-semibold">8. Cancellation and access</h3>
            <p class="text-muted">You may cancel your subscription at any time through the billing portal. Cancellation takes effect at the end of the current billing period. Access to paid features will be removed once the subscription expires.</p>
          </section>

          <section class="mb-4">
            <h3 class="mb-1 font-semibold">9. Limitation of liability</h3>
            <p class="text-muted">To the maximum extent permitted by law, the platform provider is not liable for indirect, incidental, special, consequential, or punitive damages related to service use, including loss of data, revenue, or business opportunity.</p>
          </section>

          <section>
            <h3 class="mb-1 font-semibold">10. Acceptance</h3>
            <p class="text-muted">By checking the acceptance box and proceeding to checkout, you confirm that you have read, understood, and agree to these terms.</p>
          </section>
        </div>
        <div class="flex items-center justify-end border-t border-border px-6 py-4">
          <button
            type="button"
            class="btn-primary"
            @click="isTermsModalOpen = false"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import { useSupabaseClient } from '../../composables/useSupabaseClient'

interface AppSubscription {
  app_key: string
  app_name: string
  status: string
  monthly_amount: number
  currency: string
  stripe_customer_id: string | null
  current_period_end?: string | null
  trial_ends_at: string | null
  manual_access_enabled: boolean
  manual_access_until: string | null
  manual_access_reason: string | null
}

interface BillingResponse {
  subscription: AppSubscription
  access: {
    enabled: boolean
    reason: 'active_subscription' | 'trial_active' | 'manual_with_expiry' | 'manual_without_expiry' | 'inactive'
    checkedAt: string
  }
  isPlatformOwner: boolean
}

interface AcceptTermsResponse {
  success: true
  terms_version: string
  accepted_at: string
}

interface FetchLikeError {
  statusCode?: number
  statusMessage?: string
  data?: {
    statusCode?: number
    statusMessage?: string
    message?: string
  }
  message?: string
}

const route = useRoute()
const router = useRouter()
const { signOut } = useAuth()
const supabase = useSupabaseClient()

const billingData = ref<BillingResponse | null>(null)
const isLoadingSubscription = ref(true)
const subscriptionFetchError = ref<string | null>(null)
const isRedirecting = ref(false)
const isRedirectingPortal = ref(false)
const checkoutError = ref<string | null>(null)
const billingErrorContext = ref<'checkout' | 'portal'>('checkout')
const manualAccessError = ref<string | null>(null)
const manualAccessSuccess = ref(false)
const isSavingManualAccess = ref(false)

const termsAccepted = ref(false)
const isTermsModalOpen = ref(false)

const TERMS_VERSION = '1.0'
const TERMS_UI_STORAGE_KEY = 'fb:billing-terms-ui-checked'

function persistTermsUiState(value: boolean): void {
  try {
    window.localStorage.setItem(TERMS_UI_STORAGE_KEY, value ? '1' : '0')
  } catch {
    // localStorage unavailable — continue without persisting UI preference
  }
}

function resolveBillingPortalErrorMessage(err: unknown): string {
  const typedError = err as FetchLikeError
  const backendMessage = typedError?.data?.statusMessage || typedError?.statusMessage || ''

  if (backendMessage === 'No billing account found for this workspace') {
    return 'No billing account found for this workspace'
  }

  if (backendMessage === 'Stripe billing portal is not configured') {
    return 'Stripe billing portal is not configured'
  }

  return 'Unable to open billing portal right now'
}

const manualAccessEnabled = ref(false)
const manualAccessUntil = ref('')
const manualAccessReason = ref('')

const subscription = computed(() => billingData.value?.subscription ?? null)
const access = computed(() => billingData.value?.access ?? null)
const isSubscriptionActive = computed(() => (subscription.value?.status ?? '').toLowerCase() === 'active')
const canManageBilling = computed(() => Boolean(subscription.value?.stripe_customer_id))
const shouldShowSubscribeButton = computed(() => {
  const subscriptionStatus = (subscription.value?.status ?? '').toLowerCase()
  const hasStripeCustomer = Boolean(subscription.value?.stripe_customer_id)

  return subscriptionStatus !== 'active' || !hasStripeCustomer
})
const accessSubtitle = computed(() => {
  if (!billingData.value || !subscription.value || !access.value) {
    return ''
  }

  if (!access.value.enabled) {
    return 'Subscription inactive. Please subscribe or contact platform owner.'
  }

  if (access.value.reason === 'active_subscription') {
    return 'Active subscription.'
  }

  if (access.value.reason === 'trial_active') {
    return `Trial active until ${formatDateTime(subscription.value.trial_ends_at)}.`
  }

  if (access.value.reason === 'manual_with_expiry') {
    return `Manual access active until ${formatDateTime(subscription.value.manual_access_until)}.`
  }

  if (access.value.reason === 'manual_without_expiry') {
    return 'Manual access active without expiry.'
  }

  return 'Subscription inactive. Please subscribe or contact platform owner.'
})

const checkoutResult = computed<'success' | 'cancelled' | null>(() => {
  const val = route.query.checkout
  if (val === 'success') return 'success'
  if (val === 'cancelled') return 'cancelled'
  return null
})

const billingErrorTitle = computed(() => {
  return billingErrorContext.value === 'portal'
    ? 'Failed to open billing portal'
    : 'Failed to start checkout'
})

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount) + '/month'
}

function formatDate(value: string | null): string {
  if (!value) {
    return 'N/A'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'N/A'
  }

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return 'N/A'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'N/A'
  }

  return date.toLocaleString()
}

function toDatetimeLocalValue(value: string | null): string {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const pad = (num: number) => String(num).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

async function getAccessToken(): Promise<string> {
  const { data, error } = await supabase.auth.getSession()

  if (error || !data.session?.access_token) {
    throw new Error('Unable to read user session. Please sign in again.')
  }

  return data.session.access_token
}

function hydrateManualForm(data: BillingResponse): void {
  manualAccessEnabled.value = data.subscription.manual_access_enabled
  manualAccessUntil.value = toDatetimeLocalValue(data.subscription.manual_access_until)
  manualAccessReason.value = data.subscription.manual_access_reason || ''
}

async function fetchSubscription(): Promise<void> {
  isLoadingSubscription.value = true
  subscriptionFetchError.value = null
  manualAccessError.value = null

  try {
    const accessToken = await getAccessToken()
    const data = await $fetch<BillingResponse>('/api/admin/billing', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    billingData.value = data
    hydrateManualForm(data)
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load billing details.'
    subscriptionFetchError.value = message
  }
  finally {
    isLoadingSubscription.value = false
  }
}

async function startCheckout(): Promise<void> {
  if (isRedirecting.value) {
    return
  }

  if (!termsAccepted.value) {
    billingErrorContext.value = 'checkout'
    checkoutError.value = 'Please accept the Terms of Service before subscribing.'
    return
  }

  billingErrorContext.value = 'checkout'
  checkoutError.value = null
  isRedirecting.value = true

  try {
    const accessToken = await getAccessToken()

    const acceptTermsResponse = await $fetch<AcceptTermsResponse>('/api/admin/billing/accept-terms', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: {
        terms_version: TERMS_VERSION,
      },
    })

    if (!acceptTermsResponse?.success) {
      billingErrorContext.value = 'checkout'
      checkoutError.value = 'Unable to confirm terms acceptance right now. Please try again.'
      isRedirecting.value = false
      return
    }

    // UI convenience only. Source of truth is the server insert in billing_terms_acceptances.
    persistTermsUiState(true)

    const idempotencyKey = `billing-checkout:${Date.now()}:${Math.random().toString(36).slice(2)}`
    const response = await $fetch<{ url: string }>('/api/stripe/create-checkout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'x-idempotency-key': idempotencyKey,
      },
    })

    if (!response.url) {
      billingErrorContext.value = 'checkout'
      checkoutError.value = 'Stripe did not return a checkout URL. Please try again.'
      isRedirecting.value = false
      return
    }

    window.location.href = response.url
  }
  catch (err: unknown) {
    billingErrorContext.value = 'checkout'
    const message = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.'
    checkoutError.value = message
    isRedirecting.value = false
  }
}

async function openBillingPortal(): Promise<void> {
  if (isRedirectingPortal.value) {
    return
  }

  billingErrorContext.value = 'portal'
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
      billingErrorContext.value = 'portal'
      checkoutError.value = 'Unable to open billing portal right now'
      isRedirectingPortal.value = false
      return
    }

    window.location.href = response.url
  }
  catch (err: unknown) {
    billingErrorContext.value = 'portal'
    checkoutError.value = resolveBillingPortalErrorMessage(err)
    isRedirectingPortal.value = false
  }
}

async function saveManualAccess(): Promise<void> {
  manualAccessError.value = null
  manualAccessSuccess.value = false
  isSavingManualAccess.value = true

  try {
    const accessToken = await getAccessToken()
    const data = await $fetch<BillingResponse>('/api/admin/billing/manual-access', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: {
        manualAccessEnabled: manualAccessEnabled.value,
        manualAccessUntil: manualAccessUntil.value || null,
        manualAccessReason: manualAccessReason.value || null,
      },
    })

    billingData.value = data
    hydrateManualForm(data)
    manualAccessSuccess.value = true
  }
  catch (err: unknown) {
    manualAccessError.value = err instanceof Error ? err.message : 'Failed to update manual access.'
  }
  finally {
    isSavingManualAccess.value = false
  }
}

async function disableManualAccess(): Promise<void> {
  manualAccessEnabled.value = false
  manualAccessUntil.value = ''
  manualAccessReason.value = ''
  await saveManualAccess()
}

async function onSignOut(): Promise<void> {
  await signOut()
  await router.push('/login')
}

onMounted(() => {
  if (import.meta.client) {
    try {
      const storedState = window.localStorage.getItem(TERMS_UI_STORAGE_KEY)
      termsAccepted.value = storedState === '1'
    } catch {
      termsAccepted.value = false
    }
  }

  fetchSubscription()
})
</script>
