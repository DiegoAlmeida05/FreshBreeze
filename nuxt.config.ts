// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,

  modules: ['@nuxtjs/tailwindcss'],

  runtimeConfig: {
    supabaseUrl: process.env.SUPABASE_URL ?? process.env.NUXT_PUBLIC_SUPABASE_URL ?? '',
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    openaiApiKey: process.env.OPENAI_API_KEY ?? '',
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    },
  },

  tailwindcss: {
    // Use our custom CSS entry point (includes @tailwind directives + design tokens)
    cssPath: '~/assets/css/tailwind.css',
    // Use the TypeScript config instead of the removed .js one
    configPath: 'tailwind.config.ts',
  },
})