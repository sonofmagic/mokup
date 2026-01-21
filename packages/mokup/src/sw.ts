export interface ServiceWorkerRegisterOptions {
  path?: string
  scope?: string
  enabled?: boolean
}

export interface ServiceWorkerUnregisterOptions {
  path?: string
  scope?: string
}

const defaultSwPath = '/mokup-sw.js'
const defaultSwScope = '/'

function normalizeSwPath(path: string | undefined) {
  if (!path) {
    return defaultSwPath
  }
  return path.startsWith('/') ? path : `/${path}`
}

function normalizeSwScope(scope: string | undefined) {
  if (!scope) {
    return defaultSwScope
  }
  return scope.startsWith('/') ? scope : `/${scope}`
}

function resolveScopeUrl(scope: string, origin: string) {
  const url = new URL(scope, origin)
  if (!url.pathname.endsWith('/')) {
    url.pathname = `${url.pathname}/`
  }
  return url.href
}

function matchesScriptPath(scriptUrl: string, origin: string, pathname: string) {
  try {
    const parsed = new URL(scriptUrl)
    return parsed.origin === origin && parsed.pathname === pathname
  }
  catch {
    return false
  }
}

export async function registerMokupServiceWorker(
  options: ServiceWorkerRegisterOptions = {},
): Promise<ServiceWorkerRegistration | null> {
  if (options.enabled === false) {
    return null
  }
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }
  const path = normalizeSwPath(options.path)
  const scope = normalizeSwScope(options.scope)
  try {
    return await navigator.serviceWorker.register(path, {
      type: 'module',
      scope,
    })
  }
  catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[mokup] Failed to register service worker:', error)
    return null
  }
}

export async function unregisterMokupServiceWorker(
  options: ServiceWorkerUnregisterOptions = {},
): Promise<ServiceWorkerRegistration[]> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return []
  }
  const origin = window.location.origin
  const path = normalizeSwPath(options.path)
  const scope = normalizeSwScope(options.scope)
  const pathUrl = new URL(path, origin)
  const scopeUrl = resolveScopeUrl(scope, origin)

  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    const matched = registrations.filter((registration) => {
      if (registration.scope !== scopeUrl) {
        return false
      }
      const scriptUrls = [
        registration.active?.scriptURL,
        registration.waiting?.scriptURL,
        registration.installing?.scriptURL,
      ].filter((entry): entry is string => typeof entry === 'string')
      return scriptUrls.some(entry =>
        matchesScriptPath(entry, origin, pathUrl.pathname),
      )
    })
    const removed: ServiceWorkerRegistration[] = []
    for (const registration of matched) {
      const success = await registration.unregister()
      if (success) {
        removed.push(registration)
      }
    }
    return removed
  }
  catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[mokup] Failed to unregister service worker:', error)
    return []
  }
}
