---
applyTo: '**'
---

# Guia de Projeto — Nuxt 4 (estrutura + padrões de código)

⚠️ **Atenção**  
Este documento é um **guia baseado em boas práticas e na documentação oficial**.  
**Sempre siga as orientações do desenvolvedor responsável pelo projeto.**  
Não é uma regra imutável — serve como referência para manter consistência, legibilidade e escalabilidade.

---

## 1) Estrutura de pastas (Nuxt 4)

Sempre respeitar a estrutura abaixo ao criar **novos arquivos/pastas**:

```text
my-nuxt-app/
├─ app/
│  ├─ assets/          # fontes, ícones, imagens processadas, CSS global (se necessário)
│  ├─ components/      # componentes de UI (pequenos, reusáveis, sem lógica de dados)
│  ├─ composables/     # funções reativas (useX) e estados compartilhados (useState)
│  ├─ layouts/         # layouts de páginas (header/footer etc.)
│  ├─ middleware/      # middlewares de rota (auth, guards, etc.)
│  ├─ pages/           # rotas baseadas em arquivos
│  ├─ plugins/         # registros de libs (client/server), injeções de dependência
│  ├─ utils/           # funções puras e helpers sem reatividade
│  ├─ app.vue          # shell do app
│  ├─ app.config.ts    # configurações do app
│  └─ error.vue        # página de erro global
├─ content/            # opcional - conteúdo estático/MD
├─ public/             # arquivos estáticos servidos como raiz (/)
├─ shared/
│  ├─ types/           # tipos globais TypeScript (contratos, DTOs, entidades)
│  └─ constants/       # constantes e enums globais
├─ server/
│  ├─ api/             # rotas server (ex: server/api/users.get.ts)
│  ├─ middleware/      # middlewares server-side Nitro
│  └─ plugins/         # plugins server-side
├─ tailwind.config.ts  # tema e tokens de design
├─ nuxt.config.ts
└─ .env
```

> **Sobre `types`**
> - **Projetos pequenos** → pode manter em `app/types`.
> - **Projetos médios/grandes ou com backend** → prefira `shared/types` fora do `app/` para facilitar compartilhamento.

---

## 2) Princípios de arquitetura

1. **Componentizar ao máximo**
   - Componentes pequenos, coesos e reusáveis.
   - Nada de lógica de dados dentro de componentes — use **composables**.
   - Ao criar componentes, faça com ID fixo para evitar problemas de hidratação.

2. **Composables para lógica de domínio**
   - `/app/composables/useX.ts` → busca de dados, regras de negócio, orquestração.
   - Componente apenas consome o composable.

3. **Responsabilidade única**
   - Um arquivo faz **uma única coisa bem feita**. Se crescer, quebre.

4. **Tipos corretos**
   - Sempre tipar props, emits, retornos, estados e contratos de API.
   - Evitar `any`; preferir tipagem explícita.

5. **Sempre TypeScript**
   - `lang="ts"` nos componentes Vue.
   - Tipos globais no `/shared/types` ou `app/types`.

6. **Padrão de camadas**
   - **UI (`components`)** → **Composables (`composables`)** → **Acesso a dados (`server/api` ou SDK)**.

---

## 3) Regras de nomenclatura

- **Componentes Vue (`/app/components`)** → **PascalCase**  
  Ex.: `UserCard.vue`, `AuthButton.vue`

- **Páginas (`/app/pages`)** → **minúsculas sem traços**, usar apenas letras e, se necessário, subpastas para organizar  
  Ex.: `login.vue`, `profile.vue`, `settings.vue`  
  Se precisar separar por contexto:

```text
/app/pages/admin/dashboard.vue
/app/pages/admin/users.vue
```

- **Layouts (`/app/layouts`)** → **PascalCase**  
  Ex.: `DefaultLayout.vue`, `AdminLayout.vue`

Atenção: para usar o layout, basta envolver o componente na tag `NuxtLayout`.

- **Composables (`/app/composables`)** → prefixo `use` + PascalCase  
  Ex.: `useAuth.ts`, `useCart.ts`

- **Middlewares (`/app/middleware`)** → camelCase  
  Ex.: `authGuard.ts`, `isAdmin.ts`

- **Utils (`/app/utils`)** → camelCase  
  Ex.: `formatDate.ts`, `calculateTotal.ts`

- **Tipos (`/shared/types` ou `app/types`)** → PascalCase para nomes de interfaces ou DTOs  
  Ex.: `UserDTO.ts`, `ProductDTO.ts`

**Sempre use imports explícitos para cada arquivo, evitando auto-imports.**

---

## 4) Padrões de UI — Tabelas CRUD

Estas regras se aplicam a **todos** os componentes de tabela (`*Table.vue`) do projeto.

### 4.1 Badge de status (Active / Inactive)

Usar **um único `<span>`** com `:class` binding. Nunca usar `v-if/v-else` separados nem ícones SVG dentro do badge.

```vue
<span
  class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
  :class="item.active ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'"
>
  {{ item.active ? 'Active' : 'Inactive' }}
</span>
```

> Aplicar tanto na view **mobile** (cards) quanto na view **desktop** (tabela). O mesmo markup é usado em ambos os contextos.

### 4.2 Botões de ação (Edit / Delete) — desktop

Usar `inline-flex h-8 w-8` com ícone SVG interno. Nunca texto, nunca outline com classe `btn-*`.

```vue
<!-- Edit -->
<button
  type="button"
  class="inline-flex h-8 w-8 items-center justify-center rounded-md text-primary-600 transition hover:bg-primary-100/50 dark:text-primary-400 dark:hover:bg-white/10"
  title="Edit [entity]"
  aria-label="Edit [entity]"
  @click="emit('edit', item)"
>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
    <path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
  </svg>
</button>

<!-- Delete -->
<button
  type="button"
  class="inline-flex h-8 w-8 items-center justify-center rounded-md text-error-600 transition hover:bg-error-100/50 dark:text-error-400 dark:hover:bg-error-500/10"
  title="Delete [entity]"
  aria-label="Delete [entity]"
  @click="onDelete(item)"
>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z" />
  </svg>
</button>
```

### 4.3 Botões de ação — mobile (cards)

Na view mobile usar `btn-outline` com texto, exceto Delete que usa `btn-outline` com ícone trash vermelho:

```vue
<!-- Edit -->
<button type="button" class="btn-outline flex-1 !px-2 !py-1.5 text-xs" @click="emit('edit', item)">
  Edit
</button>

<!-- Delete -->
<button type="button" class="btn-outline !px-2 !py-1.5 text-xs text-error-600 dark:text-error-400" @click="onDelete(item)">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z" />
  </svg>
</button>
```

### 4.4 Botão "Add [Entity]" nas páginas

O botão de criação fica no **header da seção**, nunca na topbar. Nunca usar botão circular `+`.

```vue
<!-- No header da section -->
<div class="flex items-center justify-between px-6 py-4 border-b border-border">
  <h2 class="text-base font-semibold text-foreground">Entities</h2>
  <button type="button" class="btn-primary" @click="openCreateModal">
    Add entity
  </button>
</div>
```

### 4.5 Validação de formulários

- Sempre adicionar `novalidate` na tag `<form>`.
- Usar `type="text" inputmode="decimal"` para campos numéricos como lat/lng (nunca `type="number"` com `required`).
- Implementar função `validateForm()` explícita que popula um `reactive<FieldErrors>`.
- Exibir erros por campo com `<p class="mt-1 text-xs text-error-600">{{ errors.field }}</p>`.
- `onSubmit()` chama `validateForm()` e retorna cedo se inválido.
