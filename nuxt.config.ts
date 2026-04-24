// https://nuxt.com/docs/api/configuration/nuxt-config
const appBuildTimestamp = process.env.NUXT_PUBLIC_APP_UPDATED_AT ?? new Date().toISOString()

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NODE_ENV === 'development' },
  ssr: true,

  nitro: {
    compressPublicAssets: true,
  },

  routeRules: {
    '/manifest.webmanifest': {
      headers: {
        'cache-control': 'public, max-age=3600, must-revalidate',
      },
    },
    '/icons/**': {
      headers: {
        'cache-control': 'public, max-age=31536000, immutable',
      },
    },
    '/logo/**': {
      headers: {
        'cache-control': 'public, max-age=31536000, immutable',
      },
    },
  },

  app: {
    head: {
      script: [
        {
          key: 'pwa-recover-early-startup',
          tagPosition: 'head',
          children: `(function () {
  try {
    var RUNTIME_INSTANCE_KEY = 'pwa-runtime-instance-id'
    var existingRuntimeInstanceId = null

    try {
      existingRuntimeInstanceId = window.sessionStorage.getItem(RUNTIME_INSTANCE_KEY)
    } catch {
      existingRuntimeInstanceId = null
    }

    var isColdStart = !existingRuntimeInstanceId
    var runtimeInstanceId = existingRuntimeInstanceId || (Date.now() + '-' + Math.random().toString(36).slice(2, 10))

    try {
      window.sessionStorage.setItem(RUNTIME_INSTANCE_KEY, runtimeInstanceId)
    } catch {
      // Ignore storage failures.
    }

    window.__PWA_COLD_START__ = isColdStart
    window.__PWA_RUNTIME_INSTANCE_ID__ = runtimeInstanceId

    var isStandalone = (
      (typeof navigator !== 'undefined' && navigator.standalone === true) ||
      (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches)
    )

    if (!isStandalone) {
      return
    }

    var RECOVER_ATTEMPT_KEY = 'pwa-recover-attempted-at'
    var RECOVER_WATCHDOG_TIMEOUT_MS = 2000
    var recoveryWatchdogTimer = 0

    function isAppMounted() {
      try {
        if (window.__APP_MOUNTED__ === true) {
          return true
        }

        var nuxtRoot = document.getElementById('__nuxt')
        return Boolean(nuxtRoot && nuxtRoot.getAttribute('data-app-mounted') === '1')
      } catch {
        return false
      }
    }

    function getRecoveryTarget() {
      var path = window.location.pathname || '/'

      if (path.indexOf('/admin') === 0) {
        return '/admin'
      }

      if (path.indexOf('/worker') === 0) {
        return '/worker/schedule'
      }

      try {
        var lastRoute = window.localStorage.getItem('last-app-route') || ''
        if (lastRoute.indexOf('/admin') === 0) {
          return '/admin'
        }
      } catch {
        // Ignore localStorage read failure.
      }

      return '/worker/schedule'
    }

    function buildRecoveryUrl(target, reason) {
      var separator = target.indexOf('?') >= 0 ? '&' : '?'
      return target + separator + 'pwa_recover=' + Date.now() + '&pwa_recover_reason=' + encodeURIComponent(reason)
    }

    function injectRecoveryScreen(target, reason) {
      if (document.getElementById('pwa-recover-screen')) {
        return
      }

      var label = target === '/admin' ? 'Open Dashboard' : 'Open Schedule'
      var overlay = document.createElement('div')
      overlay.id = 'pwa-recover-screen'
      overlay.setAttribute('role', 'alert')
      overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:#f8fafc;color:#0f172a;padding:24px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;'

      var panel = document.createElement('div')
      panel.style.cssText = 'width:100%;max-width:360px;border:1px solid #dbeafe;background:#ffffff;border-radius:18px;padding:20px;box-shadow:0 20px 40px rgba(15,23,42,0.15);text-align:center;'

      var title = document.createElement('h1')
      title.textContent = 'Reopening your app...'
      title.style.cssText = 'margin:0 0 10px 0;font-size:18px;line-height:1.3;font-weight:700;color:#0f172a;'

      var subtitle = document.createElement('p')
      subtitle.textContent = 'We are recovering your session safely.'
      subtitle.style.cssText = 'margin:0 0 14px 0;font-size:14px;line-height:1.4;color:#334155;'

      var button = document.createElement('button')
      button.type = 'button'
      button.textContent = label
      button.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border:none;border-radius:10px;background:#0077E6;color:#fff;font-size:14px;font-weight:600;cursor:pointer;'
      button.addEventListener('click', function () {
        window.location.replace(buildRecoveryUrl(target, reason + '-button'))
      })

      panel.appendChild(title)
      panel.appendChild(subtitle)
      panel.appendChild(button)
      overlay.appendChild(panel)
      document.body.appendChild(overlay)
    }

    function hasRecoveryAttempt() {
      try {
        return Boolean(window.sessionStorage.getItem(RECOVER_ATTEMPT_KEY))
      } catch {
        return false
      }
    }

    function markRecoveryAttempt() {
      try {
        window.sessionStorage.setItem(RECOVER_ATTEMPT_KEY, String(Date.now()))
      } catch {
        // Ignore storage failure.
      }
    }

    function runRecovery(reason) {
      var target = getRecoveryTarget()
      injectRecoveryScreen(target, reason)

      if (hasRecoveryAttempt()) {
        return
      }

      markRecoveryAttempt()
      window.setTimeout(function () {
        window.location.replace(buildRecoveryUrl(target, reason))
      }, 450)
    }

    function armWatchdog(reason) {
      if (recoveryWatchdogTimer) {
        window.clearTimeout(recoveryWatchdogTimer)
      }

      recoveryWatchdogTimer = window.setTimeout(function () {
        if (isAppMounted()) {
          return
        }

        runRecovery(reason)
      }, RECOVER_WATCHDOG_TIMEOUT_MS)
    }

    function onResumeSignal(reason) {
      armWatchdog(reason)
    }

    window.addEventListener('pageshow', function (event) {
      if (event.persisted) {
        onResumeSignal('pageshow-persisted')
      }
    })

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState !== 'visible') {
        return
      }

      var navEntry = (typeof performance.getEntriesByType === 'function' && performance.getEntriesByType('navigation')[0]) || null
      var navType = navEntry && navEntry.type

      if (navType === 'back_forward') {
        onResumeSignal('visibility-back-forward')
      }
    })

    // Also arm once on early startup in standalone; harmless if app mounts quickly.
    armWatchdog('early-startup')
  } catch (error) {
    // Avoid throwing from early head script.
  }
})()`,
        },
      ],
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
    resendApiKey: process.env.RESEND_API_KEY ?? '',
    resendFromEmail: process.env.RESEND_FROM_EMAIL ?? '',
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