<template>
  <button
    :id="id"
    :type="type"
    :disabled="disabled"
    :class="buttonClass"
  >
    <slot>{{ label }}</slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  id: string
  label?: string
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'outline'
  fullWidth?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  type: 'button',
  variant: 'primary',
  fullWidth: false,
  disabled: false,
})

const buttonClass = computed(() => {
  const baseClass = props.variant === 'secondary'
    ? 'btn-secondary'
    : props.variant === 'outline'
      ? 'btn-outline'
      : 'btn-primary'

  if (props.fullWidth) {
    return `${baseClass} w-full`
  }

  return baseClass
})
</script>
