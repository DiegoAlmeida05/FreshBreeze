<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="modal-backdrop z-[90]"
      @click.self="onCancel"
    >
      <div
        class="modal-surface max-w-md"
        :class="danger ? 'border-danger/40' : 'border-primary-100'
        "
        role="dialog"
        aria-modal="true"
      >
        <div class="modal-header">
          <h3 class="text-base font-semibold" :class="danger ? 'text-danger' : 'text-foreground'">
            {{ title }}
          </h3>
        </div>

        <div class="modal-body">
          <p class="text-sm text-muted">
            {{ message }}
          </p>
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="btn-outline"
            :disabled="loading"
            @click="onCancel"
          >
            {{ cancelLabelResolved }}
          </button>

          <button
            type="button"
            class="btn-primary"
            :class="danger ? '!border-danger/60 !bg-danger !text-white hover:!bg-danger/90' : ''"
            :disabled="loading"
            @click="onConfirm"
          >
            {{ loading ? 'Processing...' : confirmLabelResolved }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  danger?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  loading: false,
  danger: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()

const confirmLabelResolved = computed(() => props.confirmLabel)
const cancelLabelResolved = computed(() => props.cancelLabel)

function onCancel(): void {
  if (props.loading) {
    return
  }

  emit('cancel')
  emit('update:modelValue', false)
}

function onConfirm(): void {
  emit('confirm')
}
</script>
