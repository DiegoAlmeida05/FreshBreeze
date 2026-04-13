<template>
  <label class="inline-flex cursor-pointer items-center gap-2.5 select-none">
    <input
      type="checkbox"
      class="sr-only"
      :checked="checked"
      :disabled="disabled"
      @change="onToggle"
    />
    <span
      class="relative inline-block h-5 w-10 rounded-full border transition"
      :class="[
        checked
          ? 'border-success/40 bg-success/70 dark:bg-success/55'
          : 'border-border bg-surface-soft dark:bg-surface-soft/80',
        disabled ? 'opacity-60' : '',
      ]"
    >
      <span
        class="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform dark:bg-slate-100"
        :class="checked ? 'translate-x-5' : ''"
      />
    </span>
    <span class="text-xs font-semibold" :class="checked ? 'text-success' : 'text-muted'">
      {{ checked ? onLabel : offLabel }}
    </span>
  </label>
</template>

<script setup lang="ts">
const props = defineProps({
  checked: Boolean,
  disabled: Boolean,
  onLabel: { type: String, default: 'Resolved' },
  offLabel: { type: String, default: 'Open' },
})
const emit = defineEmits(['update:checked', 'toggle'])

function onToggle(e: Event) {
  const next = (e.target as HTMLInputElement).checked
  emit('update:checked', next)
  emit('toggle', next)
}
</script>
