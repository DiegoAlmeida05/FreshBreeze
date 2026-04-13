<template>
  <label class="block">
    <span class="mb-1.5 block text-sm font-medium text-foreground">
      {{ label }}
      <span v-if="required">*</span>
    </span>

    <div class="relative">
      <input
        :id="id"
        :type="inputType"
        :value="modelValue"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :required="required"
        :class="allowPasswordToggle && type === 'password' ? 'input-base pr-12' : 'input-base'"
        @input="onInput"
      />

      <button
        v-if="allowPasswordToggle && type === 'password'"
        :id="`${id}-toggle-password`"
        type="button"
        class="absolute inset-y-0 right-0 inline-flex items-center px-3 text-muted transition hover:text-foreground"
        :aria-label="isPasswordVisible ? 'Ocultar senha' : 'Exibir senha'"
        @click="togglePasswordVisibility"
      >
        <svg
          v-if="!isPasswordVisible"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
          <circle cx="12" cy="12" r="3" />
        </svg>

        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 5.1A9.9 9.9 0 0 1 12 5c6.4 0 10 7 10 7a17.2 17.2 0 0 1-4.2 5.1" />
          <path d="M6.2 6.2A16.9 16.9 0 0 0 2 12s3.6 7 10 7a9.9 9.9 0 0 0 5.1-1.4" />
        </svg>
      </button>
    </div>
  </label>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  id: string
  label: string
  modelValue: string
  type?: 'text' | 'email' | 'password' | 'tel'
  placeholder?: string
  autocomplete?: string
  required?: boolean
  allowPasswordToggle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  placeholder: '',
  autocomplete: 'off',
  required: false,
  allowPasswordToggle: false,
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const isPasswordVisible = ref(false)

const inputType = computed(() => {
  if (props.allowPasswordToggle && props.type === 'password') {
    return isPasswordVisible.value ? 'text' : 'password'
  }

  return props.type
})

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

function togglePasswordVisibility() {
  isPasswordVisible.value = !isPasswordVisible.value
}
</script>
