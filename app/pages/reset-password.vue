<template>
  <div class="page-shell relative overflow-hidden">
    <div class="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-primary-500/20 blur-3xl" />
    <div class="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-primary-warm-500/20 blur-3xl" />

    <div class="page-container relative flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <section class="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-elevated sm:p-8">
        <p class="text-xs font-semibold uppercase tracking-wide text-muted">Account recovery</p>
        <h1 class="mt-1 text-2xl font-semibold text-foreground">Reset password</h1>

        <form class="mt-6 space-y-4" @submit.prevent="onSubmit">
          <div>
            <label for="reset-password-new" class="mb-1.5 block text-sm font-medium text-foreground">New password</label>
            <input
              id="reset-password-new"
              v-model="newPassword"
              type="password"
              minlength="8"
              class="input-base"
              placeholder="At least 8 characters"
              autocomplete="new-password"
              required
            />
          </div>

          <div>
            <label for="reset-password-confirm" class="mb-1.5 block text-sm font-medium text-foreground">Confirm password</label>
            <input
              id="reset-password-confirm"
              v-model="confirmPassword"
              type="password"
              minlength="8"
              class="input-base"
              placeholder="Confirm your new password"
              autocomplete="new-password"
              required
            />
          </div>

          <BaseFeedbackBanner
            v-if="validationMessage"
            tone="warning"
            title="Validation"
            :message="validationMessage"
          />

          <button type="submit" class="btn-primary w-full" :disabled="isLoading">
            {{ isLoading ? 'Updating password...' : 'Update password' }}
          </button>

          <BaseFeedbackBanner
            v-if="successMessage"
            tone="success"
            title="Success"
            :message="successMessage"
          />

          <BaseFeedbackBanner
            v-if="errorMessage"
            tone="error"
            title="Update failed"
            :message="errorMessage"
          />
        </form>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { navigateTo } from '#app'
import BaseFeedbackBanner from '../components/ui/BaseFeedbackBanner.vue'
import { useAuth } from '../composables/useAuth'

const { updatePassword } = useAuth()

const newPassword = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const validationMessage = computed(() => {
  if (!newPassword.value && !confirmPassword.value) {
    return ''
  }

  if (newPassword.value.length > 0 && newPassword.value.length < 8) {
    return 'Password must have at least 8 characters.'
  }

  if (confirmPassword.value.length > 0 && newPassword.value !== confirmPassword.value) {
    return 'Passwords must match.'
  }

  return ''
})

async function onSubmit(): Promise<void> {
  successMessage.value = ''
  errorMessage.value = ''

  if (newPassword.value.length < 8) {
    errorMessage.value = 'Password must have at least 8 characters.'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords must match.'
    return
  }

  isLoading.value = true

  try {
    await updatePassword(newPassword.value)
    successMessage.value = 'Password updated successfully'

    setTimeout(() => {
      void navigateTo('/login')
    }, 1200)
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error
      ? error.message
      : 'Unable to update password. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>
