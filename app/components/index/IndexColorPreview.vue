<template>
  <section class="mb-8 rounded-3xl border border-border bg-surface p-5 shadow-card sm:p-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-foreground">Visualizacao rapida de cores</h2>
        <p class="mt-1 text-sm text-muted">Botao, tag e bloco textual para comparar comportamento visual em ambos os temas.</p>
      </div>
      <div class="inline-flex rounded-full border border-border bg-surface-soft p-1 text-xs">
        <span class="rounded-full bg-primary-500 px-3 py-1 font-semibold text-white">Primary</span>
        <span class="rounded-full px-3 py-1 font-semibold text-primary-warm-700">Warm</span>
      </div>
    </div>

    <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <button type="button" class="rounded-xl bg-primary-500 px-4 py-3 text-sm font-semibold text-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-600 hover:shadow-elevated">
        Acao Principal
      </button>
      <button type="button" class="rounded-xl bg-primary-warm-500 px-4 py-3 text-sm font-semibold text-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-warm-600 hover:shadow-elevated">
        Acao de Destaque
      </button>
      <button type="button" class="rounded-xl border border-primary-500 bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-100">
        Surface Azul
      </button>
      <button type="button" class="rounded-xl border border-primary-warm-500 bg-primary-warm-50 px-4 py-3 text-sm font-semibold text-primary-warm-700 transition-colors hover:bg-primary-warm-100">
        Surface Laranja
      </button>
    </div>
  </section>
</template>
