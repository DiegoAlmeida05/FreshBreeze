let googleMapsScriptPromise: Promise<void> | null = null
const GOOGLE_MAPS_SCRIPT_ID = 'google-maps-api'
const GOOGLE_MAPS_LOAD_TIMEOUT_MS = 15000

function resolveGoogleNamespace(): typeof window.google {
  if (!import.meta.client || !window.google?.maps) {
    throw new Error('Google Maps is not available in this environment.')
  }

  return window.google
}

function buildGoogleMapsScriptSrc(apiKey: string): string {
  return `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`
}

function removeExistingGoogleMapsScript(): void {
  const existing = document.getElementById(GOOGLE_MAPS_SCRIPT_ID)
  if (existing) {
    existing.remove()
  }
}

function injectGoogleMapsScript(apiKey: string): Promise<void> {
  if (googleMapsScriptPromise) {
    return googleMapsScriptPromise
  }

  const scriptSrc = buildGoogleMapsScriptSrc(apiKey)

  googleMapsScriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null

    if (window.google?.maps) {
      resolve()
      return
    }

    if (existing && existing.src !== scriptSrc) {
      removeExistingGoogleMapsScript()
    }

    const scriptInDom = (document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null)

    if (scriptInDom?.dataset.loadState === 'error') {
      removeExistingGoogleMapsScript()
    }

    const activeScript = (document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null)

    if (activeScript) {
      if (activeScript.dataset.loadState === 'loaded') {
        resolve()
        return
      }

      if (activeScript.dataset.loadState === 'error') {
        reject(new Error('Failed to load Google Maps script.'))
        return
      }

      activeScript.addEventListener('load', () => resolve(), { once: true })
      activeScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps script.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = GOOGLE_MAPS_SCRIPT_ID
    script.async = true
    script.defer = true
    script.src = scriptSrc
    script.dataset.loadState = 'loading'

    script.onload = () => {
      script.dataset.loadState = 'loaded'
      resolve()
    }

    script.onerror = () => {
      script.dataset.loadState = 'error'
      reject(new Error('Failed to load Google Maps script.'))
    }

    document.head.appendChild(script)

    window.setTimeout(() => {
      if (script.dataset.loadState !== 'loaded') {
        script.dataset.loadState = 'error'
        reject(new Error('Google Maps script load timed out.'))
      }
    }, GOOGLE_MAPS_LOAD_TIMEOUT_MS)
  })

  googleMapsScriptPromise = googleMapsScriptPromise.catch((error) => {
    // Allow a future retry after transient failures in local dev.
    googleMapsScriptPromise = null
    removeExistingGoogleMapsScript()
    throw error
  })

  return googleMapsScriptPromise
}

export async function loadGoogleMaps(apiKey: string): Promise<typeof window.google> {
  if (!import.meta.client) {
    throw new Error('Google Maps can only be loaded on client side.')
  }

  if (!apiKey) {
    throw new Error(
      'Missing NUXT_PUBLIC_GOOGLE_MAPS_API_KEY. Ensure this variable exists in .env. If you added it recently, restart the local Nuxt dev server. On Vercel, add/update the variable in Project Settings and redeploy.'
    )
  }

  if (window.google?.maps) {
    return window.google
  }

  await injectGoogleMapsScript(apiKey)
  return resolveGoogleNamespace()
}

declare global {
  interface Window {
    google?: {
      maps?: any
    }
  }
}
