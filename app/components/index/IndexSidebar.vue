<template>
  <aside class="space-y-6">
    <article class="rounded-3xl border border-border bg-surface p-5 shadow-card transition-transform duration-200 hover:-translate-y-0.5 sm:p-6">
      <h3 class="text-base font-semibold text-foreground">Preview de status</h3>
      <ul class="mt-4 space-y-3">
        <li class="rounded-xl border border-success/20 bg-success/10 px-3 py-3">
          <p class="text-sm font-medium text-success">Cadastro valido</p>
          <p class="text-xs text-muted">Todos os campos obrigatorios preenchidos.</p>
        </li>
        <li class="rounded-xl border border-warning/25 bg-warning/10 px-3 py-3">
          <p class="text-sm font-medium text-warning">Atencao em documentos</p>
          <p class="text-xs text-muted">Comprovante de endereco pendente.</p>
        </li>
        <li class="rounded-xl border border-danger/20 bg-danger/10 px-3 py-3">
          <p class="text-sm font-medium text-danger">Risco de duplicidade</p>
          <p class="text-xs text-muted">Cliente com telefone semelhante ja cadastrado.</p>
        </li>
      </ul>
    </article>

    <article class="rounded-3xl border border-border bg-surface p-5 shadow-card transition-transform duration-200 hover:-translate-y-0.5 sm:p-6">
      <h3 class="text-base font-semibold text-foreground">Paleta aplicada</h3>
      <div class="mt-4 space-y-3">
        <div class="flex items-center gap-3 rounded-xl bg-surface-soft px-3 py-2">
          <span class="h-8 w-8 rounded-lg bg-primary-500"></span>
          <div>
            <p class="text-sm font-medium text-foreground">primary-500</p>
            <p class="text-xs text-muted">Azul para acoes principais</p>
          </div>
        </div>
        <div class="flex items-center gap-3 rounded-xl bg-surface-soft px-3 py-2">
          <span class="h-8 w-8 rounded-lg bg-primary-warm-500"></span>
          <div>
            <p class="text-sm font-medium text-foreground">primary-warm-500</p>
            <p class="text-xs text-muted">Laranja para destaque</p>
          </div>
        </div>
        <div class="flex items-center gap-3 rounded-xl bg-surface-soft px-3 py-2">
          <span class="h-8 w-8 rounded-lg bg-accent-500"></span>
          <div>
            <p class="text-sm font-medium text-foreground">accent-500</p>
            <p class="text-xs text-muted">Feedback de urgencia visual</p>
          </div>
        </div>
      </div>
    </article>
  </aside>
</template>
