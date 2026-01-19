export interface MokupServiceWorkerOptions {
  path?: string
  scope?: string
  enabled?: boolean
}

export async function registerMokupServiceWorker(
  options: MokupServiceWorkerOptions = {},
): Promise<ServiceWorkerRegistration | null> {
  if (options.enabled === false) {
    return null
  }
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }
  const path = options.path ?? '/mokup-sw.js'
  const scope = options.scope ?? '/'
  try {
    return await navigator.serviceWorker.register(path, {
      type: 'module',
      scope,
    })
  }
  catch (error) {
    console.warn('[mokup] Failed to register service worker:', error)
    return null
  }
}
