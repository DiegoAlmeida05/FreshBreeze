<template>
  <NuxtLayout name="worker-layout">
    <template #topbar-title>
      <h1 class="text-base font-semibold text-foreground">Settings</h1>
    </template>

    <section class="space-y-6">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-primary-600">Configuration</p>
        <h2 class="mt-1 text-2xl font-semibold text-foreground">Account Settings</h2>
        <p class="mt-2 max-w-2xl text-sm text-muted dark:text-slate-300">Manage your profile photo, account details and preferences.</p>
      </div>

      <BaseFeedbackBanner
        v-if="feedbackMessage"
        :tone="feedbackTone"
        :title="feedbackTitle"
        :message="feedbackMessage"
        floating
        dismissible
        @dismiss="clearFeedback"
      />

      <div class="overflow-hidden rounded-[28px] border border-primary-100/80 bg-gradient-to-b from-white via-surface to-primary-50/40 shadow-xl shadow-primary-900/5 dark:border-white/10 dark:bg-gradient-to-b dark:from-neutral-950 dark:via-black dark:to-neutral-950 dark:shadow-black/40">
        <div class="border-b border-primary-100/80 px-6 py-8 sm:px-8 dark:border-white/10">
          <h3 class="mb-6 text-center text-lg font-semibold text-foreground">Profile Photo</h3>

          <div class="flex flex-col items-center gap-5 text-center">
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              alt="Profile"
              class="h-28 w-28 rounded-full object-cover ring-2 ring-primary-300 dark:ring-white/15"
            />
            <div
              v-else
              class="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-primary-300 to-primary-500 text-3xl font-bold text-white dark:from-neutral-800 dark:to-neutral-700"
            >
              {{ avatarInitial }}
            </div>

            <input
              id="settings-avatar-input"
              ref="fileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onFileSelected"
            />

            <button
              type="button"
              class="btn-primary w-full sm:w-auto"
              :disabled="isUploadingAvatar"
              @click="triggerFileInput"
            >
              {{ isUploadingAvatar ? `Uploading ${avatarUploadProgress}%` : 'Choose Photo' }}
            </button>

            <div v-if="isUploadingAvatar" class="w-full max-w-xs">
              <div class="h-2 w-full overflow-hidden rounded-full bg-primary-100 dark:bg-white/10">
                <div class="h-full rounded-full bg-primary-500 transition-all duration-200" :style="{ width: `${avatarUploadProgress}%` }" />
              </div>
            </div>

            <p class="text-xs text-muted">PNG, JPG or GIF. Max 5MB.</p>
            <p v-if="selectedFileName" class="text-xs text-primary-600 dark:text-primary-400">{{ selectedFileName }}</p>
          </div>
        </div>

        <div class="border-b border-primary-100/80 px-6 py-8 sm:px-8 dark:border-white/10">
          <h3 class="mb-6 text-lg font-semibold text-foreground">Profile Information</h3>

          <form class="space-y-4" @submit.prevent="onUpdateProfile">
            <div>
              <label for="settings-fullname" class="mb-1.5 block text-sm font-medium text-foreground">Full name</label>
              <input
                id="settings-fullname"
                v-model="profileForm.full_name"
                type="text"
                class="input-base dark:border-white/10 dark:bg-white/5"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label for="settings-email" class="mb-1.5 block text-sm font-medium text-foreground">Email</label>
              <input
                id="settings-email"
                v-model="profileForm.email"
                type="email"
                class="input-base dark:border-white/10 dark:bg-white/5"
                placeholder="your.email@empresa.com"
              />
              <p class="mt-1 text-xs text-muted">A confirmation email will be sent for email changes.</p>
            </div>

            <div class="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button type="button" class="btn-outline dark:border-white/15 dark:text-white dark:hover:bg-white/5" :disabled="isUpdating" @click="resetProfileForm">Cancel</button>
              <button type="submit" class="btn-primary" :disabled="isUpdating">
                {{ isUpdating ? 'Saving...' : 'Save changes' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Worker-only financial profile section -->
        <div v-if="isWorker" class="border-b border-primary-100/80 px-6 py-8 sm:px-8 dark:border-white/10">
          <h3 class="mb-6 text-lg font-semibold text-foreground">Worker Profile (Finance & Rates)</h3>

          <form class="space-y-6" novalidate @submit.prevent="onUpdateWorkerProfile">
            <div>
              <h4 class="mb-4 text-sm font-medium text-foreground">Worker Information</h4>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label for="worker-legal-name" class="mb-1.5 block text-sm font-medium text-foreground">Legal name</label>
                  <input
                    id="worker-legal-name"
                    v-model="workerForm.legal_name"
                    type="text"
                    class="input-base dark:border-white/10 dark:bg-white/5"
                    placeholder="Your legal name"
                  />
                </div>
                <div>
                  <label for="worker-abn" class="mb-1.5 block text-sm font-medium text-foreground">ABN</label>
                  <input
                    id="worker-abn"
                    v-model="workerForm.abn"
                    type="text"
                    class="input-base dark:border-white/10 dark:bg-white/5"
                    placeholder="Australian Business Number"
                  />
                </div>
                <div>
                  <label for="worker-invoice-email" class="mb-1.5 block text-sm font-medium text-foreground">Invoice email</label>
                  <input
                    id="worker-invoice-email"
                    v-model="workerForm.invoice_email"
                    type="email"
                    class="input-base dark:border-white/10 dark:bg-white/5"
                    placeholder="invoice@example.com"
                  />
                </div>
                <div>
                  <label for="worker-invoice-phone" class="mb-1.5 block text-sm font-medium text-foreground">Invoice phone</label>
                  <input
                    id="worker-invoice-phone"
                    v-model="workerForm.invoice_phone"
                    type="text"
                    class="input-base dark:border-white/10 dark:bg-white/5"
                    placeholder="Phone number"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 class="mb-4 text-sm font-medium text-foreground">Payment Details</h4>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label for="worker-bsb" class="mb-1.5 block text-sm font-medium text-foreground">BSB</label>
                  <input
                    id="worker-bsb"
                    v-model="workerForm.payment_bsb"
                    type="text"
                    class="input-base dark:border-white/10 dark:bg-white/5"
                    placeholder="Bank State Branch"
                  />
                </div>
                <div>
                  <label for="worker-account" class="mb-1.5 block text-sm font-medium text-foreground">Account number</label>
                  <input
                    id="worker-account"
                    v-model="workerForm.payment_account"
                    type="text"
                    class="input-base dark:border-white/10 dark:bg-white/5"
                    placeholder="Account number"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 class="mb-4 text-sm font-medium text-foreground">Hourly Rates (AUD)</h4>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label for="worker-rate-weekday" class="mb-1.5 block text-sm font-medium text-foreground">Weekday rate</label>
                  <input
                    id="worker-rate-weekday"
                    v-model.number="workerForm.hourly_rate_weekday_override"
                    type="text"
                    inputmode="decimal"
                    class="input-base dark:border-white/10 dark:bg-white/5"
                    placeholder="40.00"
                  />
                </div>
                <div>
                  <label for="worker-rate-sunday" class="mb-1.5 block text-sm font-medium text-foreground">Sunday rate</label>
                  <input
                    id="worker-rate-sunday"
                    v-model.number="workerForm.hourly_rate_sunday_override"
                    type="text"
                    inputmode="decimal"
                    class="input-base dark:border-white/10 dark:bg-white/5"
                    placeholder="45.00"
                  />
                </div>
                <div>
                  <label for="worker-rate-holiday" class="mb-1.5 block text-sm font-medium text-foreground">Holiday rate</label>
                  <input
                    id="worker-rate-holiday"
                    v-model.number="workerForm.hourly_rate_holiday_override"
                    type="text"
                    inputmode="decimal"
                    class="input-base dark:border-white/10 dark:bg-white/5"
                    placeholder="50.00"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 class="mb-4 text-sm font-medium text-foreground">Signature</h4>
              <p class="mb-3 text-xs text-muted">Draw or upload your signature for invoices</p>
              <WorkerSignaturePad @signature-change="onWorkerSignatureChange" />

              <div class="mt-3 rounded-lg border border-primary-100 bg-primary-50/50 p-3 dark:border-white/10 dark:bg-white/[0.02]">
                <p class="text-xs font-medium text-foreground">Current signature preview</p>
                <img
                  v-if="workerForm.signature_data_url"
                  :src="workerForm.signature_data_url"
                  alt="Current signature"
                  class="mt-2 h-16 w-auto max-w-full rounded border border-border bg-white object-contain p-1"
                >
                <p v-else class="mt-2 text-xs text-muted">No signature saved yet.</p>
              </div>
            </div>

            <div class="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button type="submit" class="btn-primary" :disabled="isUpdatingWorkerProfile">
                {{ isUpdatingWorkerProfile ? 'Saving...' : 'Save worker profile' }}
              </button>
            </div>
          </form>
        </div>

        <div class="border-b border-primary-100/80 px-6 py-8 sm:px-8 dark:border-white/10">
          <h3 class="mb-6 text-lg font-semibold text-foreground">Change Password</h3>

          <form class="space-y-4" @submit.prevent="onUpdatePassword">
            <div>
              <label for="settings-password" class="mb-1.5 block text-sm font-medium text-foreground">New password</label>
              <input
                id="settings-password"
                v-model="passwordForm.newPassword"
                type="password"
                class="input-base dark:border-white/10 dark:bg-white/5"
                placeholder="At least 8 characters"
                minlength="8"
                required
              />
            </div>

            <div>
              <label for="settings-password-confirm" class="mb-1.5 block text-sm font-medium text-foreground">Confirm password</label>
              <input
                id="settings-password-confirm"
                v-model="passwordForm.confirmPassword"
                type="password"
                class="input-base dark:border-white/10 dark:bg-white/5"
                placeholder="Confirm your new password"
                minlength="8"
                required
              />
            </div>

            <BaseFeedbackBanner
              v-if="passwordMismatch"
              tone="warning"
              title="Password mismatch"
              message="Use the same password in both fields before saving."
              floating
            />

            <div class="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button type="button" class="btn-outline dark:border-white/15 dark:text-white dark:hover:bg-white/5" :disabled="isUpdatingPassword" @click="resetPasswordForm">Cancel</button>
              <button type="submit" class="btn-primary" :disabled="Boolean(isUpdatingPassword || passwordMismatch)">
                {{ isUpdatingPassword ? 'Updating...' : 'Update password' }}
              </button>
            </div>
          </form>
        </div>

        <div class="border-b border-primary-100/80 px-6 py-8 sm:px-8 dark:border-white/10">
          <h3 class="mb-6 text-lg font-semibold text-foreground">Appearance</h3>

          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-sm font-medium text-foreground">Dark mode</p>
              <p class="mt-1 text-xs text-muted">Toggle between light and dark theme.</p>
            </div>

            <button
              type="button"
              class="relative inline-flex h-8 w-14 items-center rounded-full bg-primary-200 transition dark:bg-white/10"
              :class="isDark ? 'bg-primary-600 dark:bg-white/20' : 'bg-primary-200'"
              @click="toggleMode"
            >
              <span
                class="inline-block h-6 w-6 transform rounded-full bg-white shadow transition dark:bg-white"
                :class="isDark ? 'translate-x-7' : 'translate-x-1'"
              />
            </button>
          </div>
        </div>

        <div class="px-6 py-8 sm:px-8">
          <h3 class="mb-4 text-lg font-semibold text-foreground">Session</h3>
          <p class="mb-4 text-sm text-muted">Sign out from your account and return to the login page.</p>

          <button
            type="button"
            class="btn-outline text-danger hover:border-danger/50 hover:bg-danger/20 hover:text-danger dark:border-danger/40 dark:bg-danger/5 dark:text-red-300"
            @click="onSignOut"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign out
          </button>
        </div>
      </div>
    </section>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import BaseFeedbackBanner from '../../components/ui/BaseFeedbackBanner.vue'
import WorkerSignaturePad from '../../components/features/worker/WorkerSignaturePad.vue'
import { useAuth } from '../../composables/useAuth'
import { useEditProfile } from '../../composables/useEditProfile'
import { useSupabaseClient } from '../../composables/useSupabaseClient'
import { useTheme } from '../../composables/useTheme'
import { useUploadAvatar } from '../../composables/useUploadAvatar'
import { useWorkerProfileSettings } from '../../composables/useWorkerProfileSettings'

definePageMeta({
  name: 'worker-settings',
  keepalive: true,
})

const { signOut, getCurrentUser, getProfile } = useAuth()
const { updateProfile, updatePassword } = useEditProfile()
const { isDark: isDarkMode, toggleTheme } = useTheme()
const { uploadAvatar } = useUploadAvatar()
const { getSettings: getWorkerSettings, saveSettings: saveWorkerSettings } = useWorkerProfileSettings()
const supabase = useSupabaseClient()
const route = useRoute()

type FeedbackTone = 'success' | 'error' | 'warning' | 'info'

interface PersistedFeedback {
  tone: FeedbackTone
  title: string
  message: string
  expiresAt: number
}

const isDark = computed(() => isDarkMode.value)
const isWorker = ref(false)

const profileForm = reactive({
  full_name: '',
  email: '',
})

const workerForm = reactive({
  legal_name: '',
  abn: '',
  invoice_email: '',
  invoice_phone: '',
  payment_bsb: '',
  payment_account: '',
  hourly_rate_weekday_override: 40,
  hourly_rate_sunday_override: 45,
  hourly_rate_holiday_override: 50,
  signature_data_url: '',
})

const workerInvoiceDefaults = reactive({
  default_recipient_name: '',
  default_recipient_email: '',
  default_recipient_phone: '',
})

const passwordForm = reactive({
  newPassword: '',
  confirmPassword: '',
})

const isUpdating = ref(false)
const isUpdatingPassword = ref(false)
const isUploadingAvatar = ref(false)
const avatarUploadProgress = ref(0)
const isUpdatingWorkerProfile = ref(false)
const feedbackTone = ref<FeedbackTone>('info')
const feedbackTitle = ref('')
const feedbackMessage = ref('')
const avatarUrl = ref('')
const selectedFileName = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const persistedFeedbackKey = computed(() => `freshbreeze:settings-feedback:${route.fullPath}`)
let feedbackTimeout: ReturnType<typeof setTimeout> | null = null

const avatarInitial = computed(() => {
  const name = profileForm.full_name || 'U'
  return name.charAt(0).toUpperCase()
})

const passwordMismatch = computed(() => {
  return Boolean(
    passwordForm.newPassword &&
    passwordForm.confirmPassword &&
    passwordForm.newPassword !== passwordForm.confirmPassword,
  )
})

onMounted(async () => {
  await loadProfileData()
  await loadWorkerProfileData()
  restorePersistedFeedback()
})

function clearFeedback(): void {
  feedbackTitle.value = ''
  feedbackMessage.value = ''

  if (feedbackTimeout) {
    clearTimeout(feedbackTimeout)
    feedbackTimeout = null
  }
}

function setFeedback(
  tone: FeedbackTone,
  title: string,
  message: string,
  duration = 0,
): void {
  clearFeedback()
  feedbackTone.value = tone
  feedbackTitle.value = title
  feedbackMessage.value = message

  if (duration > 0) {
    feedbackTimeout = setTimeout(() => {
      clearFeedback()
    }, duration)
  }
}

function restorePersistedFeedback(): void {
  if (!import.meta.client) {
    return
  }

  const rawFeedback = sessionStorage.getItem(persistedFeedbackKey.value)

  if (!rawFeedback) {
    return
  }

  sessionStorage.removeItem(persistedFeedbackKey.value)

  try {
    const persistedFeedback = JSON.parse(rawFeedback) as PersistedFeedback
    const remainingDuration = persistedFeedback.expiresAt - Date.now()

    if (remainingDuration <= 0) {
      return
    }

    setFeedback(persistedFeedback.tone, persistedFeedback.title, persistedFeedback.message, remainingDuration)
  } catch {
    sessionStorage.removeItem(persistedFeedbackKey.value)
  }
}

async function persistSuccessAndReload(title: string, message: string): Promise<void> {
  if (import.meta.client) {
    const payload: PersistedFeedback = {
      tone: 'success',
      title,
      message,
      expiresAt: Date.now() + 5000,
    }

    sessionStorage.setItem(persistedFeedbackKey.value, JSON.stringify(payload))
  }

  await reloadNuxtApp({ path: route.fullPath, force: true })
}

async function loadProfileData(): Promise<void> {
  try {
    const user = await getCurrentUser()
    const profile = await getProfile()

    if (!user) {
      return
    }

    isWorker.value = profile.role === 'worker'
    profileForm.full_name = profile.full_name || ''
    profileForm.email = profile.email || ''

    const { data: profileData, error } = await supabase
      .from('employees')
      .select('photo_url')
      .eq('profile_id', user.id)
      .maybeSingle()

    if (error) {
      throw error
    }

    avatarUrl.value = profileData?.photo_url || ''
  } catch (err: unknown) {
    setFeedback('error', 'Could not load profile', err instanceof Error ? err.message : 'Failed to load profile.')
  }
}

async function loadWorkerProfileData(): Promise<void> {
  if (!isWorker.value) {
    return
  }

  try {
    clearFeedback()
    const data = await getWorkerSettings()

    workerForm.legal_name = data.legal_name
    workerForm.abn = data.abn
    workerForm.invoice_email = data.invoice_email
    workerForm.invoice_phone = data.invoice_phone
    workerForm.payment_bsb = data.payment_bsb
    workerForm.payment_account = data.payment_account
    workerForm.hourly_rate_weekday_override = data.hourly_rate_weekday_override
    workerForm.hourly_rate_sunday_override = data.hourly_rate_sunday_override
    workerForm.hourly_rate_holiday_override = data.hourly_rate_holiday_override
    workerInvoiceDefaults.default_recipient_name = data.default_recipient_name
    workerInvoiceDefaults.default_recipient_email = data.default_recipient_email
    workerInvoiceDefaults.default_recipient_phone = data.default_recipient_phone
    workerForm.signature_data_url = data.signature_data_url
  } catch (error: unknown) {
    setFeedback('error', 'Worker profile unavailable', error instanceof Error ? error.message : 'Could not load worker profile.')
  }
}

function resetProfileForm(): void {
  clearFeedback()
  void loadProfileData()
}

async function onUpdateProfile(): Promise<void> {
  isUpdating.value = true
  clearFeedback()

  const emailChanged = profileForm.email.trim().length > 0

  try {
    await updateProfile({
      full_name: profileForm.full_name.trim() || undefined,
      email: profileForm.email.trim() || undefined,
    })

    const title = emailChanged ? 'Profile saved' : 'Profile updated'
    const message = emailChanged
      ? 'Your changes were saved. If you changed the email, check your inbox to confirm it.'
      : 'Your profile information was updated successfully.'

    await persistSuccessAndReload(title, message)
  } catch (err: unknown) {
    setFeedback('error', 'Update failed', err instanceof Error ? err.message : 'Failed to update profile.')
  } finally {
    isUpdating.value = false
  }
}

function onWorkerSignatureChange(dataUrl: string): void {
  workerForm.signature_data_url = dataUrl
  setFeedback('info', 'Signature updated', 'Signature staged. Save worker profile to persist.', 3000)
}

async function onUpdateWorkerProfile(): Promise<void> {
  isUpdatingWorkerProfile.value = true
  clearFeedback()

  try {
    await saveWorkerSettings({
      id: null,
      employee_id: '',
      legal_name: workerForm.legal_name,
      abn: workerForm.abn,
      invoice_email: workerForm.invoice_email,
      invoice_phone: workerForm.invoice_phone,
      payment_bsb: workerForm.payment_bsb,
      payment_account: workerForm.payment_account,
      hourly_rate_weekday_override: Number(workerForm.hourly_rate_weekday_override || 0),
      hourly_rate_sunday_override: Number(workerForm.hourly_rate_sunday_override || 0),
      hourly_rate_holiday_override: Number(workerForm.hourly_rate_holiday_override || 0),
      default_recipient_name: workerInvoiceDefaults.default_recipient_name,
      default_recipient_email: workerInvoiceDefaults.default_recipient_email,
      default_recipient_phone: workerInvoiceDefaults.default_recipient_phone,
      signature_data_url: workerForm.signature_data_url,
      created_at: null,
      updated_at: null,
    })

    setFeedback('success', 'Worker profile saved', 'Your worker profile was updated successfully.', 3000)
  } catch (error: unknown) {
    setFeedback('error', 'Save failed', error instanceof Error ? error.message : 'Could not save worker profile.')
  } finally {
    isUpdatingWorkerProfile.value = false
  }
}

function resetPasswordForm(): void {
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
}

async function onUpdatePassword(): Promise<void> {
  if (passwordMismatch.value) {
    return
  }

  isUpdatingPassword.value = true
  clearFeedback()

  try {
    await updatePassword(passwordForm.newPassword)
    resetPasswordForm()

    await persistSuccessAndReload('Password changed', 'Your password was updated successfully.')
  } catch (err: unknown) {
    setFeedback('error', 'Password update failed', err instanceof Error ? err.message : 'Failed to update password.')
  } finally {
    isUpdatingPassword.value = false
  }
}

function toggleMode(): void {
  toggleTheme()
}

function triggerFileInput(): void {
  fileInput.value?.click()
}

async function onFileSelected(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) {
    return
  }

  selectedFileName.value = file.name
  isUploadingAvatar.value = true
  avatarUploadProgress.value = 0
  clearFeedback()

  try {
    const url = await uploadAvatar(file, {
      onProgress(progress) {
        avatarUploadProgress.value = progress
      },
    })
    avatarUrl.value = url
    selectedFileName.value = ''

    if (fileInput.value) {
      fileInput.value.value = ''
    }

    await persistSuccessAndReload('Photo uploaded', 'Your profile photo was updated successfully.')
  } catch (err: unknown) {
    setFeedback('error', 'Upload failed', err instanceof Error ? err.message : 'Failed to upload photo.')
  } finally {
    avatarUploadProgress.value = 0
    isUploadingAvatar.value = false
  }
}

async function onSignOut(): Promise<void> {
  await signOut()
  await navigateTo('/login')
}

// Watch isWorker to load worker profile when ready
watch(isWorker, async (newVal) => {
  if (newVal) {
    await loadWorkerProfileData()
  }
})
</script>
