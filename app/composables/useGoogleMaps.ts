let googleMapsScriptPromise: Promise<void> | null = null

function resolveGoogleNamespace(): typeof window.google {
  if (!import.meta.client || !window.google?.maps) {
    throw new Error('Google Maps is not available in this environment.')
  }

  return window.google
}

function injectGoogleMapsScript(apiKey: string): Promise<void> {
  if (googleMapsScriptPromise) {
    return googleMapsScriptPromise
  }

  googleMapsScriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('google-maps-api') as HTMLScriptElement | null

    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps script.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = 'google-maps-api'
    script.async = true
    script.defer = true
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`

    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Maps script.'))

    document.head.appendChild(script)
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
