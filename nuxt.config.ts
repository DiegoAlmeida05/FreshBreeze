// https://nuxt.com/docs/api/configuration/nuxt-config
const appBuildTimestamp = process.env.NUXT_PUBLIC_APP_UPDATED_AT ?? new Date().toISOString()

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: true,

  app: {
    head: {
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
        { name: 'theme-color', content: '#0077E6' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'FreshBreeze' },
        { name: 'mobile-web-app-capable', content: 'yes' },
      ],
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'apple-touch-icon', href: '/icons/icon-192.png' },
      ],
    },
  },

  modules: ['@nuxtjs/tailwindcss'],

  runtimeConfig: {
    supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL ?? '',
    supabaseServiceRoleKey: process.env.SUPABASE_SECRET_KEY ?? '',
    openaiApiKey: process.env.OPENAI_API_KEY ?? '',
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_KEY ?? '',
      appUpdatedAt: appBuildTimestamp,
      googleMapsApiKey: process.env.NUXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    },
  },

  tailwindcss: {
    // Use our custom CSS entry point (includes @tailwind directives + design tokens)
    cssPath: '~/assets/css/tailwind.css',
    // Use the TypeScript config instead of the removed .js one
    configPath: 'tailwind.config.ts',
  },
})