<template>
  <article class="card-surface xl:col-span-2 rounded-3xl border-border/80 bg-surface/95">
    <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold text-foreground">Dados do cliente</h2>
        <p class="text-sm text-muted">Fluxo estruturado para cadastro rapido e com boa legibilidade.</p>
      </div>
      <span class="inline-flex items-center rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
        Campos com * sao obrigatorios
      </span>
    </div>

    <div class="mb-6 h-2 overflow-hidden rounded-full bg-surface-soft">
      <div class="h-full w-2/3 rounded-full bg-gradient-to-r from-primary-500 to-primary-warm-500" />
    </div>

    <form class="space-y-6" @submit.prevent>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="mb-1.5 block text-sm font-medium text-foreground">Nome do cliente *</span>
          <input class="input-base" type="text" placeholder="Ex.: Condominio Jardim das Flores" />
        </label>

        <label class="block">
          <span class="mb-1.5 block text-sm font-medium text-foreground">Tipo de cliente *</span>
          <select class="input-base">
            <option>Residencial</option>
            <option>Comercial</option>
            <option>Industrial</option>
          </select>
        </label>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="mb-1.5 block text-sm font-medium text-foreground">Email</span>
          <input class="input-base" type="email" placeholder="contato@cliente.com" />
        </label>

        <label class="block">
          <span class="mb-1.5 block text-sm font-medium text-foreground">Telefone</span>
          <input class="input-base" type="tel" placeholder="(11) 99999-0000" />
        </label>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label class="block sm:col-span-2">
          <span class="mb-1.5 block text-sm font-medium text-foreground">Endereco *</span>
          <input class="input-base" type="text" placeholder="Rua, numero e complemento" />
        </label>

        <label class="block">
          <span class="mb-1.5 block text-sm font-medium text-foreground">CEP *</span>
          <input class="input-base" type="text" placeholder="00000-000" />
        </label>
      </div>

      <label class="block">
        <span class="mb-1.5 block text-sm font-medium text-foreground">Observacoes operacionais</span>
        <textarea class="input-base min-h-28" placeholder="Ex.: acesso restrito apos 18h, informar portaria ao chegar."></textarea>
      </label>

      <div class="rounded-2xl border border-border bg-surface-soft/80 p-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-muted">Preferencias de servico</p>
        <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label class="flex items-center gap-2 text-sm text-foreground">
            <input class="h-4 w-4 rounded border-border text-primary-warm-500 focus:ring-primary-warm-500" type="checkbox" checked />
            Receber alertas por WhatsApp
          </label>
          <label class="flex items-center gap-2 text-sm text-foreground">
            <input class="h-4 w-4 rounded border-border text-primary-warm-500 focus:ring-primary-warm-500" type="checkbox" />
            Exigir assinatura digital na entrega
          </label>
          <label class="flex items-center gap-2 text-sm text-foreground">
            <input class="h-4 w-4 rounded border-border text-primary-warm-500 focus:ring-primary-warm-500" type="checkbox" checked />
            Prioridade para coleta matinal
          </label>
          <label class="flex items-center gap-2 text-sm text-foreground">
            <input class="h-4 w-4 rounded border-border text-primary-warm-500 focus:ring-primary-warm-500" type="checkbox" />
            Permitir reagendamento automatico
          </label>
        </div>
      </div>

      <div class="flex flex-wrap gap-3 pt-2">
        <button type="submit" class="btn-primary">Salvar cadastro</button>
        <button type="button" class="btn-secondary">Salvar e criar rota</button>
        <button type="button" class="btn-outline">Cancelar</button>
      </div>
    </form>
  </article>
</template>
