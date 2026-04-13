---
applyTo: '{nuxt.config.ts,.env,server/**/*,app/composables/**/*,app/middleware/**/*,app/pages/**/*,app/plugins/**/*,app/types/**/*,shared/types/**/*}'
---

# Guia Essencial Atualizado — @nuxtjs/supabase (Nuxt 4)

Este arquivo é um guia de referência para uso do módulo `@nuxtjs/supabase`.
Sempre siga as decisões e instruções do desenvolvedor do projeto.

---

## 1) Instalação

Instale o módulo:

```bash
npx nuxi@latest module add supabase
```

Configure no `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/supabase'],
})
```

---

## 2) Variáveis de ambiente (v2+ / JWT signing keys)

Crie ou ajuste o arquivo `.env`:

```env
SUPABASE_URL="https://example.supabase.co"
```

Importante (v2+):
`SUPABASE_KEY` agora é a **publishable key**
(não mais a anon key no sentido antigo)

```env
SUPABASE_KEY="<your_publishable_key>"
```

Para bypass de RLS no servidor (admin):

```env
SUPABASE_SECRET_KEY="<your_secret_key>"
```

Legado (deprecated - não use em novos projetos):

```env
SUPABASE_SERVICE_KEY="<service_role_key>"
```

Observação:
Você pode usar `NUXT_PUBLIC_` para trabalhar via `runtimeConfig`
(ex: `NUXT_PUBLIC_SUPABASE_URL`, `NUXT_PUBLIC_SUPABASE_KEY`).

---

## 3) Configuração recomendada do módulo

```ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/supabase'],

  supabase: {
    useSsrCookies: true,

    redirect: true,

    redirectOptions: {
      login: '/login',
      callback: '/confirm',

      include: undefined,
      exclude: [],

      saveRedirectToCookie: false,
    },

    cookieOptions: {
      maxAge: 60 * 60 * 8,
      sameSite: 'lax',
      secure: true,
    },

    // cookiePrefix: 'sb-{project-id}-auth-token'
    // types: './app/types/database.types.ts'
    // clientOptions: {}
  }
})
```

Importante sobre `useSsrCookies`:
Quando `useSsrCookies = true`, não é possível customizar:
- `flowType`
- `autoRefreshToken`
- `detectSessionInUrl`
- `persistSession`
- `storage`

Se precisar disso, use `useSsrCookies = false` (perde SSR automático).

---

## 4) Breaking change (v2)

`useSupabaseUser()` não retorna mais o User completo.
Agora retorna JWT Claims (`auth.getClaims`).

Se precisar do User completo:
use `supabase.auth.getUser()`.

---

## 5) Autenticação (PKCE - fluxo padrão)

O módulo exige duas páginas:
- `/login`
- `/confirm`

Configure no Supabase Dashboard:
`Authentication > URL Configuration > Redirect URLs`
Inclua a URL do `/confirm` (dev e produção).

### 5.1) Página `/login` (OTP por email)

```ts
const supabase = useSupabaseClient()
const email = ref('')

async function signInWithOtp() {
  await supabase.auth.signInWithOtp({
    email: email.value,
    options: {
      emailRedirectTo: 'http://localhost:3000/confirm'
    }
  })
}
```

### 5.2) Página `/confirm`

```ts
const user = useSupabaseUser()

watch(user, () => {
  if (user.value) {
    navigateTo('/')
  }
}, { immediate: true })
```

### 5.3) Redirecionar para rota original (cookie)

Ative no `nuxt.config.ts`:
`saveRedirectToCookie: true`

No `/confirm`:

```ts
const user = useSupabaseUser()
const redirectInfo = useSupabaseCookieRedirect()

watch(user, () => {
  if (user.value) {
    const path = redirectInfo.pluck()
    navigateTo(path || '/')
  }
}, { immediate: true })
```

---

## 6) Reset de senha

Etapa 1 - Solicitar reset:

```ts
supabase.auth.resetPasswordForEmail(email, {
  redirectTo: 'https://example.com/password/update'
})
```

Etapa 2 - Atualizar senha:

```ts
supabase.auth.updateUser({
  password: newPassword
})
```

Opcional:
Escutar evento `PASSWORD_RECOVERY` via `onAuthStateChange`.

---

## 7) Composables principais (client)

- `useSupabaseClient()` -> cliente Supabase (`supabase-js`)
- `useSupabaseSession()` -> sessão reativa
- `useSupabaseUser()` -> JWT claims (v2)
- `useSupabaseCookieRedirect()` -> controle manual de redirect

---

## 8) Middleware de auth (quando `redirect = false`)

```ts
export default defineNuxtRouteMiddleware(() => {
  const session = useSupabaseSession()
  if (!session.value) navigateTo('/login')
})
```

Em páginas protegidas:

```ts
definePageMeta({ middleware: 'auth' })
```

---

## 9) Server (Nitro) - uso no backend

Importante:
Em SSR com `useFetch`, sempre enviar cookies:

```ts
headers: useRequestHeaders(['cookie'])
```

### 9.1) `serverSupabaseClient` (respeita RLS)

```ts
const client = await serverSupabaseClient(event)
await client.from('table').select('*')
```

### 9.2) `serverSupabaseServiceRole` (bypass RLS - admin)

Usa `SUPABASE_SECRET_KEY` (recomendado)

```ts
const client = serverSupabaseServiceRole(event)
await client.from('protected_table').select('*')
```

### 9.3) `serverSupabaseUser` (user no servidor)

```ts
const user = await serverSupabaseUser(event)
```

---

## 10) Realtime (Postgres Changes)

- Ative Realtime na tabela no Supabase
- Use `client.channel(...).on('postgres_changes', ...)`

---

## 11) TypeScript - tipos do banco

Local padrão:
`app/types/database.types.ts`

Gerar tipos (remoto):

```bash
supabase gen types --lang=typescript --project-id PROJECT_ID > app/types/database.types.ts
```

Gerar tipos (local):

```bash
supabase gen types --lang=typescript --local > app/types/database.types.ts
```

---

## 12) Checklist final

- `SUPABASE_KEY = publishable key (v2+)`
- `SUPABASE_SECRET_KEY` apenas no servidor
- Redirect URLs configuradas no dashboard
- `useSsrCookies = true` para SSR
- `useSupabaseUser` retorna claims, não User

---

Fim do guia.
