<template>
  <NuxtLayout name="worker-layout" @signout="onSignOut">
    <section class="space-y-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-primary-600">Worker</p>
        <h2 class="mt-1 text-2xl font-semibold text-foreground">Worker Profile</h2>
        <p class="mt-1 text-sm text-muted">Dados usados no timesheet e invoice: fiscal, pagamento, tarifas e assinatura.</p>
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

      <form class="space-y-4" novalidate @submit.prevent="onSave">
        <section class="rounded-xl border border-border bg-surface p-4 dark:bg-white/[0.03]">
          <h3 class="text-sm font-semibold text-foreground">Worker information</h3>

          <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label class="text-xs text-muted">
              Legal name
              <input v-model="form.legal_name" type="text" class="input-base mt-1 !py-1.5 text-xs">
            </label>

            <label class="text-xs text-muted">
              ABN
              <input v-model="form.abn" type="text" class="input-base mt-1 !py-1.5 text-xs">
            </label>

            <label class="text-xs text-muted">
              Invoice email
              <input v-model="form.invoice_email" type="email" class="input-base mt-1 !py-1.5 text-xs">
            </label>

            <label class="text-xs text-muted">
              Invoice phone
              <input v-model="form.invoice_phone" type="text" class="input-base mt-1 !py-1.5 text-xs">
            </label>
          </div>
        </section>

        <section class="rounded-xl border border-border bg-surface p-4 dark:bg-white/[0.03]">
          <h3 class="text-sm font-semibold text-foreground">Payment + rates</h3>

          <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label class="text-xs text-muted">
              BSB
              <input v-model="form.payment_bsb" type="text" class="input-base mt-1 !py-1.5 text-xs">
            </label>

            <label class="text-xs text-muted">
              Account
              <input v-model="form.payment_account" type="text" class="input-base mt-1 !py-1.5 text-xs">
            </label>

            <label class="text-xs text-muted">
              Hourly rate weekday (AUD)
              <input v-model.number="form.hourly_rate_weekday_override" type="text" inputmode="decimal" class="input-base mt-1 !py-1.5 text-xs">
            </label>

            <label class="text-xs text-muted">
              Hourly rate sunday (AUD)
              <input v-model.number="form.hourly_rate_sunday_override" type="text" inputmode="decimal" class="input-base mt-1 !py-1.5 text-xs">
            </label>

            <label class="text-xs text-muted">
              Hourly rate holiday (AUD)
              <input v-model.number="form.hourly_rate_holiday_override" type="text" inputmode="decimal" class="input-base mt-1 !py-1.5 text-xs">
            </label>

            <label class="text-xs text-muted">
              Default recipient name
              <input v-model="form.default_recipient_name" type="text" class="input-base mt-1 !py-1.5 text-xs">
            </label>

            <label class="text-xs text-muted">
              Default recipient email
              <input v-model="form.default_recipient_email" type="email" class="input-base mt-1 !py-1.5 text-xs">
            </label>

            <label class="text-xs text-muted">
              Default recipient phone
              <input v-model="form.default_recipient_phone" type="text" class="input-base mt-1 !py-1.5 text-xs">
            </label>

          </div>
        </section>

        <section class="rounded-xl border border-border bg-surface p-4 dark:bg-white/[0.03]">
          <h3 class="text-sm font-semibold text-foreground">Signature (draw or upload)</h3>

          <div class="mt-3 space-y-3">
            <WorkerSignaturePad @signature-change="onSignatureChange" />

            <div class="rounded-lg border border-primary-100 bg-primary-50/50 p-3 dark:border-white/10 dark:bg-white/[0.02]">
              <p class="text-xs font-medium text-foreground">Current signature preview</p>
              <img
                v-if="form.signature_data_url"
                :src="form.signature_data_url"
                alt="Current signature"
                class="mt-2 h-16 w-auto max-w-full rounded border border-border bg-white object-contain p-1"
              >
              <p v-else class="mt-2 text-xs text-muted">No signature saved yet.</p>
            </div>
          </div>
        </section>

        <div class="flex flex-wrap justify-end gap-2">
          <button type="submit" class="btn-primary" :disabled="isSaving">
            {{ isSaving ? 'Saving...' : 'Save worker profile' }}
          </button>
        </div>
      </form>
    </section>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import BaseFeedbackBanner from '../../components/ui/BaseFeedbackBanner.vue'
import WorkerSignaturePad from '../../components/features/worker/WorkerSignaturePad.vue'
import { useAuth } from '../../composables/useAuth'
import { useWorkerProfileSettings } from '../../composables/useWorkerProfileSettings'

definePageMeta({
  name: 'worker-profile',
})

type FeedbackTone = 'success' | 'error' | 'warning' | 'info'

const { signOut } = useAuth()
const { getSettings, saveSettings } = useWorkerProfileSettings()

const isSaving = ref(false)

const feedbackTone = ref<FeedbackTone>('info')
const feedbackTitle = ref('')
const feedbackMessage = ref('')

const form = reactive({
  legal_name: '',
  abn: '',
  invoice_email: '',
  invoice_phone: '',
  payment_bsb: '',
  payment_account: '',
  hourly_rate_weekday_override: 40,
  hourly_rate_sunday_override: 45,
  hourly_rate_holiday_override: 50,
  default_recipient_name: '',
  default_recipient_email: '',
  default_recipient_phone: '',
  signature_data_url: '',
})

onMounted(async () => {
  await loadSettings()
})

async function loadSettings(): Promise<void> {
  try {
    clearFeedback()
    const data = await getSettings()

    form.legal_name = data.legal_name
    form.abn = data.abn
    form.invoice_email = data.invoice_email
    form.invoice_phone = data.invoice_phone
    form.payment_bsb = data.payment_bsb
    form.payment_account = data.payment_account
    form.hourly_rate_weekday_override = data.hourly_rate_weekday_override
    form.hourly_rate_sunday_override = data.hourly_rate_sunday_override
    form.hourly_rate_holiday_override = data.hourly_rate_holiday_override
    form.default_recipient_name = data.default_recipient_name
    form.default_recipient_email = data.default_recipient_email
    form.default_recipient_phone = data.default_recipient_phone
    form.signature_data_url = data.signature_data_url
  } catch (error: unknown) {
    setFeedback('error', 'Profile unavailable', error instanceof Error ? error.message : 'Could not load worker profile.')
  }
}

function onSignatureChange(dataUrl: string): void {
  form.signature_data_url = dataUrl
  setFeedback('info', 'Signature updated', 'Signature staged. Save profile to persist.')
}

async function onSave(): Promise<void> {
  try {
    isSaving.value = true
    clearFeedback()

    const saved = await saveSettings({
      id: null,
      employee_id: '',
      legal_name: form.legal_name,
      abn: form.abn,
      invoice_email: form.invoice_email,
      invoice_phone: form.invoice_phone,
      payment_bsb: form.payment_bsb,
      payment_account: form.payment_account,
      hourly_rate_weekday_override: Number(form.hourly_rate_weekday_override || 0),
      hourly_rate_sunday_override: Number(form.hourly_rate_sunday_override || 0),
      hourly_rate_holiday_override: Number(form.hourly_rate_holiday_override || 0),
      default_recipient_name: form.default_recipient_name,
      default_recipient_email: form.default_recipient_email,
      default_recipient_phone: form.default_recipient_phone,
      signature_data_url: form.signature_data_url,
      created_at: null,
      updated_at: null,
    })

    setFeedback('success', 'Saved', 'Worker profile updated successfully.')
  } catch (error: unknown) {
    setFeedback('error', 'Save failed', error instanceof Error ? error.message : 'Could not save worker profile.')
  } finally {
    isSaving.value = false
  }
}

function setFeedback(tone: FeedbackTone, title: string, message: string): void {
  feedbackTone.value = tone
  feedbackTitle.value = title
  feedbackMessage.value = message
}

function clearFeedback(): void {
  feedbackTitle.value = ''
  feedbackMessage.value = ''
}

async function onSignOut(): Promise<void> {
  await signOut()
  await navigateTo('/login')
}
</script>
