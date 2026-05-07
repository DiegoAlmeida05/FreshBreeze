<template>
  <article class="rounded-2xl border border-primary-100/80 bg-white/72 px-4 py-3.5 shadow-[0_10px_24px_rgba(15,23,42,0.08)] backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.12)] active:translate-y-0 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_10px_24px_rgba(0,0,0,0.28)] dark:hover:shadow-[0_14px_28px_rgba(0,0,0,0.34)]">
    <p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-700/80 dark:text-primary-300/80">{{ label }}</p>
    <p class="mt-2 text-xl font-semibold leading-tight text-foreground sm:text-2xl">{{ value }}</p>
    <p v-if="subtitle" class="mt-1 text-[10px] font-medium tracking-wide text-muted/90">{{ subtitle }}</p>
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
