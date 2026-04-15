<template>
  <div class="page-shell relative overflow-hidden">
    <div class="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-primary-500/20 blur-3xl" />
    <div class="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-primary-warm-500/20 blur-3xl" />

    <div class="page-container relative flex min-h-[calc(100vh-4rem)] items-center justify-start">
      <section
        v-if="isBootstrapping"
        class="w-full max-w-md rounded-3xl border border-border bg-surface px-6 py-10 text-center shadow-elevated"
      >
        <img
          src="/logo/logo_escrito_transparente.png"
          alt="FreshBreeze"
          class="mx-auto h-auto w-full max-w-[220px] object-contain"
        />
        <div class="mt-6 flex items-center justify-center gap-2 text-sm text-muted">
          <div class="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          Restoring your session...
        </div>
      </section>

      <section
        v-else
        class="block w-full overflow-hidden rounded-3xl border border-border bg-surface shadow-elevated text-left lg:grid lg:grid-cols-2 lg:max-w-5xl"
      >
        <article class="relative hidden overflow-hidden border-b border-border p-8 lg:block lg:border-b-0 lg:border-r">
          <div class="absolute inset-0 bg-gradient-to-br from-primary-500/20 via-primary-warm-500/20 to-accent-500/10" />
          <div class="relative flex h-full items-center justify-center">
            <div class="flex w-full flex-col items-center justify-center text-center">
              <img
                src="/logo/logo_escrito_transparente.png"
                alt="FreshBreeze"
                class="h-auto w-full max-w-[460px] object-contain"
              />
              <p class="mt-6 text-sm font-semibold uppercase tracking-wide text-primary-700">Secure access</p>
              <h1 class="mt-2 font-heading text-3xl text-foreground">Sign in to FreshBreeze</h1>
            </div>
          </div>
        </article>

        <article class="p-6 sm:p-8 text-left">
          <div class="mb-5 rounded-2xl border border-border/80 bg-primary-50/40 p-4 text-center lg:hidden">
            <img
              src="/logo/logo_escrito_transparente.png"
              alt="FreshBreeze"
              class="mx-auto h-auto w-full max-w-[260px] object-contain"
            />
            <p class="mt-3 text-[11px] font-semibold uppercase tracking-wide text-primary-700">Secure access</p>
          </div>

          <div class="mb-6 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between text-left">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-muted">Account access</p>
              <h2 class="mt-1 text-2xl font-semibold text-foreground">Welcome</h2>
              <p class="mt-1 text-sm text-muted">Sign in to continue.</p>
            </div>
            <AuthActionButton
              id="login-theme-toggle"
              type="button"
              variant="outline"
              class="self-end lg:self-auto"
              :label="isDark ? 'Light mode' : 'Dark mode'"
              @click="toggleTheme"
            />
          </div>

          <form class="space-y-4" @submit.prevent="onLoginSubmit">
            <AuthTextField
              id="login-email"
              v-model="loginEmail"
              label="Email"
              type="email"
              placeholder="you@company.com"
              autocomplete="email"
              required
            />

            <AuthTextField
              id="login-password"
              v-model="loginPassword"
              label="Password"
              type="password"
              allow-password-toggle
              placeholder="Enter your password"
              autocomplete="current-password"
              required
            />

            <label class="flex items-center justify-between gap-2 text-sm">
              <span class="flex items-center gap-2 text-foreground">
                <input
                  id="login-remember"
                  v-model="remember"
                  type="checkbox"
                  class="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
                />
                Remember me
              </span>
              <NuxtLink to="/forgot-password" class="font-medium text-primary-600 hover:text-primary-500">Forgot password?</NuxtLink>
            </label>

            <div class="pt-2">
              <AuthActionButton
                id="login-submit"
                type="submit"
                variant="primary"
                :label="isLoading ? 'Signing in...' : 'Sign in'"
                :disabled="isLoading"
                full-width
              />
            </div>

            <BaseFeedbackBanner
              v-if="loginError"
              tone="error"
              title="Sign in failed"
              :message="loginError"
              floating
            />
          </form>
        </article>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import type { ProfileDTO } from '../../shared/types/ProfileDTO'
import BaseFeedbackBanner from '../components/ui/BaseFeedbackBanner.vue'
import AuthActionButton from '../components/login/AuthActionButton.vue'
import AuthTextField from '../components/login/AuthTextField.vue'
import { useAuth } from '../composables/useAuth'
import { useTheme } from '../composables/useTheme'

const REMEMBER_MODE_KEY = 'auth-remember-mode'
const LAST_ROUTE_STORAGE_KEY = 'last-app-route'

const { isDark, toggleTheme } = useTheme()
const { signIn, getProfile } = useAuth()

const loginEmail = ref('')
const loginPassword = ref('')
const remember = ref(false)
const isLoading = ref(false)
const loginError = ref('')
const isBootstrapping = ref(true)
const isAuthBootstrapping = useState<boolean>('auth-bootstrap-loading', () => true)

onMounted(() => {
  if (!import.meta.client) {
    return
  }

  const savedMode = localStorage.getItem(REMEMBER_MODE_KEY)
  remember.value = savedMode !== 'session'

  void bootstrapAuthFlow()
})

async function bootstrapAuthFlow(): Promise<void> {
  await waitForAuthBootstrap()

  try {
    await redirectIfAlreadyAuthenticated()
  } finally {
    isBootstrapping.value = false
  }
}

async function waitForAuthBootstrap(): Promise<void> {
  if (!import.meta.client || !isAuthBootstrapping.value) {
    return
  }

  await new Promise<void>((resolve) => {
    const stop = watch(isAuthBootstrapping, (loading) => {
      if (!loading) {
        stop()
        resolve()
      }
    })

    setTimeout(() => {
      stop()
      resolve()
    }, 2000)
  })
}

async function redirectIfAlreadyAuthenticated(): Promise<void> {
  try {
    const profile = await getProfile()

    if (!profile.active) {
      return
    }

    await navigateTo(resolveRouteAfterAuth(profile))
  } catch {
    // No valid session yet: keep the user on the login page.
  }
}

function resolveRouteAfterAuth(profile: ProfileDTO): string {
  if (!import.meta.client) {
    return profile.role === 'admin' ? '/admin' : '/worker/schedule'
  }

  const lastRoute = localStorage.getItem(LAST_ROUTE_STORAGE_KEY)

  if (profile.role === 'admin' && lastRoute?.startsWith('/admin')) {
    return lastRoute
  }

  if (profile.role === 'worker' && lastRoute?.startsWith('/worker')) {
    return lastRoute
  }

  return profile.role === 'admin' ? '/admin' : '/worker/schedule'
}

async function onLoginSubmit(): Promise<void> {
  loginError.value = ''
  isLoading.value = true

  try {
    await signIn(loginEmail.value, loginPassword.value, remember.value)

    const profile = await getProfile()

    if (!profile.active) {
      loginError.value = 'Your account is inactive. Please contact an administrator.'
      return
    }

    await navigateTo(resolveRouteAfterAuth(profile))
  } catch (err: unknown) {
    loginError.value = err instanceof Error
      ? err.message
      : 'An error occurred while signing in. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>
