<template>
  <article class="rounded-xl border border-primary-100 bg-surface px-3 py-3 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
    <p class="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">{{ label }}</p>
    <p class="mt-2 text-lg font-semibold leading-tight text-foreground sm:text-xl">{{ value }}</p>
    <p v-if="subtitle" class="mt-1 text-[11px] text-muted">{{ subtitle }}</p>
  </article>
</template>

<script setup lang="ts">
interface Props {
  label: string
  value: string
  subtitle?: string
}

defineProps<Props>()
</script>
