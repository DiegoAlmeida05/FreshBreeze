<template>
  <div class="page-shell relative overflow-hidden">
    <div class="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-primary-500/20 blur-3xl" />
    <div class="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-primary-warm-500/20 blur-3xl" />

    <div class="page-container relative flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <section class="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-elevated sm:p-8">
        <p class="text-xs font-semibold uppercase tracking-wide text-muted">Account access</p>
        <h1 class="mt-1 text-2xl font-semibold text-foreground">Forgot password</h1>

        <form class="mt-6 space-y-4" @submit.prevent="onSubmit">
          <div>
            <label for="forgot-password-email" class="mb-1.5 block text-sm font-medium text-foreground">Email</label>
            <input
              id="forgot-password-email"
              v-model="email"
              type="email"
              class="input-base"
              placeholder="you@company.com"
              autocomplete="email"
              required
            />
          </div>

          <button type="submit" class="btn-primary w-full" :disabled="isLoading">
            {{ isLoading ? 'Sending link...' : 'Send reset link' }}
          </button>

          <BaseFeedbackBanner
            v-if="successMessage"
            tone="success"
            title="Request sent"
            :message="successMessage"
          />

          <BaseFeedbackBanner
            v-if="errorMessage"
            tone="error"
            title="Request failed"
            :message="errorMessage"
          />

          <NuxtLink to="/login" class="block text-center text-sm font-medium text-primary-600 hover:text-primary-500">
            Back to sign in
          </NuxtLink>
        </form>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BaseFeedbackBanner from '../components/ui/BaseFeedbackBanner.vue'
import { useAuth } from '../composables/useAuth'

const { requestPasswordReset } = useAuth()

const email = ref('')
const isLoading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

async function onSubmit(): Promise<void> {
  successMessage.value = ''
  errorMessage.value = ''
  isLoading.value = true

  try {
    await requestPasswordReset(email.value.trim())
    successMessage.value = 'If this email exists, a reset link has been sent.'
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error
      ? error.message
      : 'Unable to send reset link. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>
