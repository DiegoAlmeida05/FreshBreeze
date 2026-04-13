<template>
  <header class="relative mb-8 overflow-hidden rounded-3xl border border-border/70 bg-surface/90 p-6 shadow-elevated backdrop-blur-sm sm:p-8">
    <div class="absolute inset-0 bg-gradient-to-r from-primary-500/15 via-primary-warm-500/20 to-accent-500/10" />
    <div class="relative flex flex-col gap-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="inline-flex items-center gap-2 rounded-full border border-border bg-surface-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
          <span class="h-2 w-2 rounded-full" :class="isDark ? 'bg-primary-warm-500' : 'bg-primary-500'" />
          Tema: {{ isDark ? 'Dark' : 'Light' }}
        </div>
        <button type="button" class="btn-outline" @click="emit('toggleTheme')">
          {{ isDark ? 'Alternar para Light' : 'Alternar para Dark' }}
        </button>
      </div>

      <img
        src="/logo/loading-screen.gif"
        alt="Loading Screen FreshBreeze"
        class="h-auto w-[300px] object-contain sm:w-[380px]"
      />

      <div class="space-y-2">
        <p class="text-sm font-semibold uppercase tracking-wide text-primary-600">Demo UI moderna</p>
        <h1 class="font-heading text-3xl text-foreground sm:text-4xl">Cadastro Inteligente FreshBreeze</h1>
        <p class="max-w-2xl text-sm text-muted sm:text-base">
          Simulacao com identidade visual atualizada para visualizar componentes, contraste e experiencia de cadastro em Light e Dark Mode.
        </p>
      </div>

      <div class="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div class="rounded-xl border border-border bg-surface/80 px-4 py-3">
          <p class="text-xs font-semibold uppercase tracking-wide text-muted">Tempo medio</p>
          <p class="mt-1 text-lg font-semibold text-foreground">2m 14s</p>
        </div>
        <div class="rounded-xl border border-border bg-surface/80 px-4 py-3">
          <p class="text-xs font-semibold uppercase tracking-wide text-muted">Conversao esperada</p>
          <p class="mt-1 text-lg font-semibold text-success">+18%</p>
        </div>
        <div class="rounded-xl border border-border bg-surface/80 px-4 py-3">
          <p class="text-xs font-semibold uppercase tracking-wide text-muted">Satisfacao do fluxo</p>
          <p class="mt-1 text-lg font-semibold text-primary-600">9.2 / 10</p>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
interface Props {
  isDark: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (event: 'toggleTheme'): void
}>()
</script>
